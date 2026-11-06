import 'dotenv/config';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { afterAll, expect, test } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { openTestDatabase } from '../../lib/db/connection';
import { deleteApplicationOwner, purgeExpiredApplicationOwners } from '../../lib/auth/application-owner-retention';
import { syntheticItemId } from '../../../scripts/setup-synthetic-assessment-test';
import { assessmentHistoryV1, finalizeAssessmentV1, restoreAssessmentV1,
  startAssessmentV1 } from './owner-service-v1';

const database = openTestDatabase();
const appUrl = process.env.TEST_CONTENT_APP_URL;
if (!appUrl || decodeURIComponent(new URL(appUrl).pathname.slice(1)) !== 'refview_test') {
  throw new Error('TEST_CONTENT_APP_URL must target restricted refview_test');
}
const app = new PrismaClient({ adapter: new PrismaPg({ connectionString: appUrl }) });
afterAll(async () => { await app.$disconnect(); await database.$disconnect(); });
const ref = { itemId: syntheticItemId, version: 1, locale: 'es' as const };
const hash = (token: string) => `sha256:${createHash('sha256').update(token).digest('hex')}`;

async function owner() {
  const token = randomBytes(32).toString('hex');
  const id = randomUUID();
  await database.anonymousSession.create({ data: { id, tokenHash: hash(token),
    expiresAt: new Date(Date.now() + 3600_000) } });
  return { id, cookie: { get: (name: string) => name === 'refview_session' ? { value: token } : undefined,
    set: () => { throw new Error('owner service must not set cookies'); } },
    cleanup: async () => { await database.anonymousSession.deleteMany({ where: { id } }); } };
}

test('owner-bound start and finalization persist one result and support normalized alias retries', async () => {
  const firstOwner = await owner();
  const secondOwner = await owner();
  try {
    const active = await startAssessmentV1(app, firstOwner.cookie, ref);
    expect(active).toMatchObject({ itemId: syntheticItemId, inputSpec: { kind: 'ruleQuestion' } });
    expect(JSON.stringify(active)).not.toMatch(/privateRubric|acceptedAnswers|correction/);
    const answer = { kind: 'ruleQuestion', optionId: 'choice-b' };
    const request = { attemptId: active.attemptId, idempotencyKey: randomUUID(), answer, locale: 'es' as const };
    await expect(finalizeAssessmentV1(app, secondOwner.cookie, request)).rejects.toThrow(/unavailable/);
    const result = await finalizeAssessmentV1(app, firstOwner.cookie, request);
    expect(result.evaluation.structuredDecision.score).toBe(0);
    expect((await finalizeAssessmentV1(app, firstOwner.cookie, request))).toEqual(result);
    expect((await finalizeAssessmentV1(app, firstOwner.cookie,
      { ...request, idempotencyKey: randomUUID() }))).toEqual(result);
    await expect(finalizeAssessmentV1(app, firstOwner.cookie,
      { ...request, answer: { ...answer, optionId: 'choice-a' } })).rejects.toThrow(/conflict/);
    const children = await database.assessmentAttempt.findUniqueOrThrow({
      where: { attemptId: active.attemptId }, include: { submission: true, result: true, claims: true } });
    expect(children.state).toBe('finalized');
    expect(children.submission?.normalizedAnswer).toEqual(answer);
    expect(children.result?.evaluation).toMatchObject({ structuredDecision: { score: 0 } });
    expect(children.claims).toHaveLength(2);
  } finally { await firstOwner.cleanup(); await secondOwner.cleanup(); }
});

test('restricted owner self-delete cascades finalized Assessment rows', async () => {
  const current = await owner();
  try {
    const active = await startAssessmentV1(app, current.cookie, ref);
    await finalizeAssessmentV1(app, current.cookie, { attemptId: active.attemptId,
      idempotencyKey: randomUUID(), answer: { kind: 'ruleQuestion', optionId: 'choice-a' }, locale: 'es' });
    let cleared = false;
    await deleteApplicationOwner(app, { get: current.cookie.get,
      set: () => { cleared = true; } }, {});
    expect(cleared).toBe(true);
    expect(await database.anonymousSession.findUnique({ where: { id: current.id } })).toBeNull();
    expect(await database.assessmentAttempt.findUnique({ where: { attemptId: active.attemptId } })).toBeNull();
    expect(await database.assessmentSubmission.findUnique({ where: { attemptId: active.attemptId } })).toBeNull();
    expect(await database.assessmentResult.findFirst({ where: { attemptId: active.attemptId } })).toBeNull();
    expect(await database.assessmentFinalizationClaim.count({ where: { attemptId: active.attemptId } })).toBe(0);
  } finally { await current.cleanup(); }
});

test('restricted purge cascades finalized Assessment rows only after expiry', async () => {
  const current = await owner();
  try {
    const active = await startAssessmentV1(app, current.cookie, ref);
    await finalizeAssessmentV1(app, current.cookie, { attemptId: active.attemptId,
      idempotencyKey: randomUUID(), answer: { kind: 'ruleQuestion', optionId: 'choice-a' }, locale: 'es' });
    await purgeExpiredApplicationOwners(app, 1);
    expect(await database.anonymousSession.findUnique({ where: { id: current.id } })).not.toBeNull();
    expect(await database.assessmentAttempt.findUnique({ where: { attemptId: active.attemptId } })).not.toBeNull();
    await database.anonymousSession.update({ where: { id: current.id }, data: {
      createdAt: new Date('1800-01-01T00:00:00.000Z'),
      expiresAt: new Date('1800-01-02T00:00:00.000Z'),
    } });
    for (let batch = 0; batch < 100; batch++) {
      await purgeExpiredApplicationOwners(app, 1);
      if (await database.anonymousSession.findUnique({ where: { id: current.id } }) === null) break;
    }
    expect(await database.anonymousSession.findUnique({ where: { id: current.id } })).toBeNull();
    expect(await database.assessmentAttempt.findUnique({ where: { attemptId: active.attemptId } })).toBeNull();
  } finally { await current.cleanup(); }
});

test('invalid input and absent owner leave no attempt or children', async () => {
  const current = await owner();
  try {
    const before = await database.assessmentAttempt.count({ where: { ownerId: current.id } });
    await expect(startAssessmentV1(app, current.cookie, { ...ref, extra: true })).rejects.toThrow();
    await expect(startAssessmentV1(app, { get: () => undefined,
      set: () => { throw new Error('unexpected cookie write'); } }, ref)).rejects.toThrow(/unavailable/);
    expect(await database.assessmentAttempt.count({ where: { ownerId: current.id } })).toBe(before);
    const active = await startAssessmentV1(app, current.cookie, ref);
    await expect(finalizeAssessmentV1(app, current.cookie, { attemptId: active.attemptId,
      idempotencyKey: randomUUID(), answer: { kind: 'ruleQuestion', optionId: 'unknown' }, locale: 'es' }))
      .rejects.toThrow();
    expect(await database.assessmentSubmission.findUnique({ where: { attemptId: active.attemptId } })).toBeNull();
  } finally { await current.cleanup(); }
});

test('concurrent different keys finalize once and a changed answer cannot replace it', async () => {
  const current = await owner();
  try {
    const active = await startAssessmentV1(app, current.cookie, ref);
    const answer = { kind: 'ruleQuestion', optionId: 'choice-a' };
    const requests = [randomUUID(), randomUUID()].map((idempotencyKey) =>
      finalizeAssessmentV1(app, current.cookie, { attemptId: active.attemptId,
        idempotencyKey, answer, locale: 'en' }));
    const [left, right] = await Promise.all(requests);
    expect(left).toEqual(right);
    expect(left.evaluation.structuredDecision.score).toBe(100);
    expect(await database.assessmentResult.count({ where: { attemptId: active.attemptId } })).toBe(1);
    expect(await database.assessmentFinalizationClaim.count({ where: { attemptId: active.attemptId } })).toBe(2);
    await expect(finalizeAssessmentV1(app, current.cookie, { attemptId: active.attemptId,
      idempotencyKey: randomUUID(), answer: { kind: 'ruleQuestion', optionId: 'choice-b' },
      locale: 'en' })).rejects.toThrow(/conflict/);
  } finally { await current.cleanup(); }
});

test('expired owner cannot start or finalize an owned attempt', async () => {
  const current = await owner();
  try {
    const active = await startAssessmentV1(app, current.cookie, ref);
    await database.anonymousSession.update({ where: { id: current.id },
      data: { createdAt: new Date(Date.now() - 7200_000),
        expiresAt: new Date(Date.now() - 1000) } });
    await expect(startAssessmentV1(app, current.cookie, ref)).rejects.toThrow(/unavailable/);
    await expect(finalizeAssessmentV1(app, current.cookie, { attemptId: active.attemptId,
      idempotencyKey: randomUUID(), answer: { kind: 'ruleQuestion', optionId: 'choice-a' },
      locale: 'es' })).rejects.toThrow(/unavailable/);
    expect(await database.assessmentSubmission.findUnique({ where: { attemptId: active.attemptId } })).toBeNull();
  } finally { await current.cleanup(); }
});

test('restore and cursor history remain scoped to the owner', async () => {
  const current = await owner();
  const other = await owner();
  try {
    const first = await startAssessmentV1(app, current.cookie, ref);
    const second = await startAssessmentV1(app, current.cookie, ref);
    expect(await restoreAssessmentV1(app, current.cookie,
      { attemptId: first.attemptId, locale: 'es' })).toMatchObject({ state: 'ready' });
    await finalizeAssessmentV1(app, current.cookie, { attemptId: first.attemptId,
      idempotencyKey: randomUUID(), answer: { kind: 'ruleQuestion', optionId: 'choice-a' },
      locale: 'es' });
    const restored = await restoreAssessmentV1(app, current.cookie,
      { attemptId: first.attemptId, locale: 'en' });
    expect(restored).toMatchObject({ state: 'finalized', result: {
      evaluation: { structuredDecision: { score: 100 } } } });
    const page = await assessmentHistoryV1(app, current.cookie, { limit: 1 });
    expect(page.entries).toHaveLength(1);
    expect(page.nextCursorAttemptId).toBeTruthy();
    const next = await assessmentHistoryV1(app, current.cookie,
      { limit: 1, cursorAttemptId: page.nextCursorAttemptId! });
    expect(next.entries).toHaveLength(1);
    expect(new Set([...page.entries, ...next.entries].map((entry) => entry.attemptId)))
      .toEqual(new Set([first.attemptId, second.attemptId]));
    await expect(restoreAssessmentV1(app, other.cookie,
      { attemptId: first.attemptId, locale: 'es' })).rejects.toThrow(/unavailable/);
    await expect(assessmentHistoryV1(app, other.cookie,
      { limit: 1, cursorAttemptId: first.attemptId })).rejects.toThrow(/unavailable/);
  } finally { await current.cleanup(); await other.cleanup(); }
});

test('oversized and deeply nested answers fail before persistence', async () => {
  const current = await owner();
  try {
    const active = await startAssessmentV1(app, current.cookie, ref);
    const huge = { kind: 'ruleQuestion', optionId: 'a'.repeat(100_000) };
    const nested = { kind: 'ruleQuestion', optionId: 'choice-a', extra: { deep: { value: true } } };
    for (const answer of [huge, nested]) {
      await expect(finalizeAssessmentV1(app, current.cookie, { attemptId: active.attemptId,
        idempotencyKey: randomUUID(), answer, locale: 'es' })).rejects.toThrow(/unavailable/);
    }
    expect(await database.assessmentSubmission.findUnique({ where: { attemptId: active.attemptId } })).toBeNull();
  } finally { await current.cleanup(); }
});

test('concurrent different answers yield one immutable result and one conflict', async () => {
  const current = await owner();
  try {
    const active = await startAssessmentV1(app, current.cookie, ref);
    const submissions = ['choice-a', 'choice-b'].map((optionId) =>
      finalizeAssessmentV1(app, current.cookie, { attemptId: active.attemptId,
        idempotencyKey: randomUUID(), answer: { kind: 'ruleQuestion', optionId }, locale: 'es' }));
    const outcomes = await Promise.allSettled(submissions);
    expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(await database.assessmentSubmission.count({ where: { attemptId: active.attemptId } })).toBe(1);
    expect(await database.assessmentResult.count({ where: { attemptId: active.attemptId } })).toBe(1);
    expect(await database.assessmentFinalizationClaim.count({ where: { attemptId: active.attemptId } })).toBe(1);
  } finally { await current.cleanup(); }
});

test('owner deletion cascades descendants and closes restore/history', async () => {
  const current = await owner();
  const active = await startAssessmentV1(app, current.cookie, ref);
  await finalizeAssessmentV1(app, current.cookie, { attemptId: active.attemptId,
    idempotencyKey: randomUUID(), answer: { kind: 'ruleQuestion', optionId: 'choice-a' },
    locale: 'es' });
  await current.cleanup();
  expect(await database.assessmentAttempt.findUnique({ where: { attemptId: active.attemptId } })).toBeNull();
  await expect(restoreAssessmentV1(app, current.cookie,
    { attemptId: active.attemptId, locale: 'es' })).rejects.toThrow(/unavailable/);
  await expect(assessmentHistoryV1(app, current.cookie, { limit: 1 })).rejects.toThrow(/unavailable/);
});

test('transaction abort after service finalization callback rolls back every child and state', async () => {
  const current = await owner();
  try {
    const active = await startAssessmentV1(app, current.cookie, ref);
    const aborting = { $transaction: (callback: Parameters<PrismaClient['$transaction']>[0]) =>
      app.$transaction(async (tx) => { await callback(tx); throw new Error('forced rollback'); }) } as unknown as PrismaClient;
    await expect(finalizeAssessmentV1(aborting, current.cookie, { attemptId: active.attemptId,
      idempotencyKey: randomUUID(), answer: { kind: 'ruleQuestion', optionId: 'choice-a' },
      locale: 'es' })).rejects.toThrow(/unavailable/);
    const row = await database.assessmentAttempt.findUniqueOrThrow({ where: { attemptId: active.attemptId } });
    expect(row.state).toBe('ready');
    expect(row.finalizedAt).toBeNull();
    expect(await database.assessmentSubmission.findUnique({ where: { attemptId: active.attemptId } })).toBeNull();
    expect(await database.assessmentResult.findUnique({ where: { attemptId: active.attemptId } })).toBeNull();
    expect(await database.assessmentFinalizationClaim.count({ where: { attemptId: active.attemptId } })).toBe(0);
  } finally { await current.cleanup(); }
});
