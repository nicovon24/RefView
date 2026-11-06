import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { openTestDatabase } from '../db/connection';
import { bootstrapApplicationOwner, withApplicationOwner } from './application-owner';
import { deleteApplicationOwner, purgeExpiredApplicationOwners } from './application-owner-retention';

const db = openTestDatabase();
afterAll(async () => db.$disconnect());

function jar() {
  let value: string | undefined;
  const writes: Array<{ value: string; options: Record<string, unknown> }> = [];
  return {
    get: (name: string) => name === 'refview_session' && value ? { value } : undefined,
    set: (_name: string, next: string, options: Record<string, unknown>) => { value = next; writes.push({ value: next, options }); },
    writes,
  };
}

async function owner() {
  const cookies = jar();
  await bootstrapApplicationOwner(db, cookies, {});
  const id = await withApplicationOwner(db, cookies, async (_tx, ownerId) => ownerId);
  return { cookies, id };
}

async function hierarchy(ownerId: string) {
  const suffix = randomUUID();
  const profileId = `retention-${suffix}`;
  const scenarioId = `retention-${suffix}`;
  await db.competitionProfile.create({ data: { profileId, version: 1, contentHash: `sha256:${'a'.repeat(64)}`, settings: {} } });
  await db.scenarioVersion.create({ data: { scenarioId, version: 1, contentHash: `sha256:${'b'.repeat(64)}`,
    lawsEdition: 'IFAB-2026-27', sourceReferences: [{}], publicContent: {}, privateContent: {},
    competitionProfileId: profileId, competitionProfileVersion: 1 } });
  const plan = await db.sessionPlan.create({ data: { ownerId, competitionProfileId: profileId,
    competitionProfileVersion: 1, seed: 'retention', locale: 'es', role: 'mainReferee' } });
  const item = await db.sessionPlanItem.create({ data: { planId: plan.id, ownerId, order: 0, scenarioId, scenarioVersion: 1 } });
  const attempt = await db.attempt.create({ data: { ownerId, planItemId: item.id, locale: 'es', role: 'mainReferee' } });
  await db.attemptRunStart.create({ data: { attemptId: attempt.id, runRevision: 0, scenarioContentHash: `sha256:${'b'.repeat(64)}`,
    role: 'mainReferee', initialView: {}, traceVersion: 1, visibilityModelVersion: 1, cameraRigVersion: 1,
    eyeCalibrationVersion: 1, observationRubricVersion: 1 } });
  await db.observationTrace.create({ data: { attemptId: attempt.id, runRevision: 0, traceVersion: 1, payload: {}, summary: {} } });
  const decision = await db.decision.create({ data: { attemptId: attempt.id, kind: 'initial', decisionTick: 1,
    stopPlay: true, restart: 'penaltyKick', discipline: 'none' } });
  await db.evaluation.create({ data: { attemptId: attempt.id, decisionId: decision.id, evaluationVersion: 1,
    observationRubricVersion: 1, result: {} } });
  await db.finalizationClaim.create({ data: { ownerId, attemptId: attempt.id, decisionId: decision.id,
    idempotencyKey: randomUUID(), payloadDigest: `sha256:${'c'.repeat(64)}` } });
  return { profileId, scenarioId, planId: plan.id, itemId: item.id, attemptId: attempt.id, decisionId: decision.id };
}

describe('application owner retention on PostgreSQL', () => {
  it('requires exact empty self-delete input and deletes the full owned hierarchy', async () => {
    const first = await owner(); const second = await owner();
    const kept = await hierarchy(second.id);
    const removed = await hierarchy(first.id);
    await expect(deleteApplicationOwner(db, first.cookies, { other: second.id })).rejects.toThrow();
    expect(first.cookies.writes).toHaveLength(1);
    await expect(deleteApplicationOwner(db, first.cookies, {})).resolves.toEqual({});
    expect(first.cookies.writes.at(-1)).toMatchObject({ value: '', options: {
      secure: true, httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0,
    } });
    expect(await db.anonymousSession.findUnique({ where: { id: first.id } })).toBeNull();
    expect(await db.finalizationClaim.count({ where: { ownerId: first.id } })).toBe(0);
    expect(await db.evaluation.count({ where: { attemptId: removed.attemptId } })).toBe(0);
    expect(await db.observationTrace.count({ where: { attemptId: removed.attemptId } })).toBe(0);
    expect(await db.decision.count({ where: { attemptId: removed.attemptId } })).toBe(0);
    expect(await db.attemptRunStart.count({ where: { attemptId: removed.attemptId } })).toBe(0);
    expect(await db.sessionPlanItem.count({ where: { id: removed.itemId } })).toBe(0);
    expect(await db.sessionPlan.count({ where: { id: removed.planId } })).toBe(0);
    expect(await db.attempt.findUnique({ where: { id: removed.attemptId } })).toBeNull();
    expect(await db.attempt.findUnique({ where: { id: kept.attemptId } })).not.toBeNull();
    expect(await db.scenarioVersion.findUnique({ where: { scenarioId_version: { scenarioId: removed.scenarioId, version: 1 } } })).not.toBeNull();
    expect(await db.competitionProfile.findUnique({ where: { profileId_version: { profileId: removed.profileId, version: 1 } } })).not.toBeNull();
    await expect(deleteApplicationOwner(db, first.cookies, {})).resolves.toEqual({});
  });

  it('rolls back self-delete after SQL executes and retains the cookie', async () => {
    const first = await owner(); const rows = await hierarchy(first.id);
    const broken = new Proxy(db, { get(target, property, receiver) {
      if (property === '$transaction') return async (callback: (tx: typeof db) => Promise<unknown>) =>
        target.$transaction(async (tx) => callback(new Proxy(tx, { get(inner, key, recv) {
          if (key === '$queryRaw') return async (...args: unknown[]) => {
            await Reflect.apply(Reflect.get(inner, key, recv), inner, args);
            throw new Error('injected failure');
          };
          return Reflect.get(inner, key, recv);
        } }) as typeof db));
      return Reflect.get(target, property, receiver);
    } });
    await expect(deleteApplicationOwner(broken, first.cookies, {})).rejects.toThrow('injected failure');
    expect(first.cookies.writes).toHaveLength(1);
    expect(await db.finalizationClaim.count({ where: { ownerId: first.id } })).toBe(1);
    expect(await db.attempt.findUnique({ where: { id: rows.attemptId } })).not.toBeNull();
    await deleteApplicationOwner(db, first.cookies, {});
  });

  it('purges expired owners in bounded repeatable batches and preserves live owners', async () => {
    const expired = await owner(); const live = await owner();
    const removed = await hierarchy(expired.id); const kept = await hierarchy(live.id);
    await db.anonymousSession.update({ where: { id: expired.id }, data: {
      createdAt: new Date('2000-01-01T00:00:00.000Z'), expiresAt: new Date('2000-01-02T00:00:00.000Z'),
    } });
    expect(await purgeExpiredApplicationOwners(db, 1)).toEqual({ deletedOwners: 1 });
    for (let batch = 0; batch < 10; batch++) {
      if ((await purgeExpiredApplicationOwners(db, 100)).deletedOwners === 0) break;
    }
    expect(await purgeExpiredApplicationOwners(db, 1)).toEqual({ deletedOwners: 0 });
    expect(await db.attempt.findUnique({ where: { id: removed.attemptId } })).toBeNull();
    expect(await db.attempt.findUnique({ where: { id: kept.attemptId } })).not.toBeNull();
    expect(await db.anonymousSession.findUnique({ where: { id: live.id } })).not.toBeNull();
  });

  it('rolls back a purge after SQL deletes the owner', async () => {
    const expired = await owner(); const rows = await hierarchy(expired.id);
    await db.anonymousSession.update({ where: { id: expired.id }, data: {
      createdAt: new Date('1980-01-01T00:00:00.000Z'), expiresAt: new Date('1980-01-02T00:00:00.000Z'),
    } });
    const broken = new Proxy(db, { get(target, property, receiver) {
      if (property === '$transaction') return async (callback: (tx: typeof db) => Promise<unknown>) =>
        target.$transaction(async (tx) => callback(new Proxy(tx, { get(inner, key, recv) {
          if (key === '$queryRaw') return async (...args: unknown[]) => {
            await Reflect.apply(Reflect.get(inner, key, recv), inner, args);
            throw new Error('purge failure');
          };
          return Reflect.get(inner, key, recv);
        } }) as typeof db));
      return Reflect.get(target, property, receiver);
    } });
    await expect(purgeExpiredApplicationOwners(broken, 1)).rejects.toThrow('purge failure');
    expect(await db.anonymousSession.findUnique({ where: { id: expired.id } })).not.toBeNull();
    expect(await db.finalizationClaim.count({ where: { ownerId: expired.id } })).toBe(1);
    expect(await db.attempt.findUnique({ where: { id: rows.attemptId } })).not.toBeNull();
    expect(await purgeExpiredApplicationOwners(db, 1)).toEqual({ deletedOwners: 1 });
  });

  it('checks expiry after an exclusive-lock wait before self-delete', async () => {
    const first = await owner();
    let unlock!: () => void;
    let locked!: () => void;
    const unlockGate = new Promise<void>((resolve) => { unlock = resolve; });
    const lockedGate = new Promise<void>((resolve) => { locked = resolve; });
    const holder = db.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "AnonymousSession" SET "expiresAt" = clock_timestamp() + interval '300 milliseconds'
        WHERE "id" = ${first.id}
      `;
      locked();
      await unlockGate;
    });
    await lockedGate;
    const deleting = deleteApplicationOwner(db, first.cookies, {});
    await new Promise((resolve) => setTimeout(resolve, 450));
    unlock();
    await holder;
    await expect(deleting).resolves.toEqual({});
    expect(await db.anonymousSession.findUnique({ where: { id: first.id } })).not.toBeNull();
    expect(first.cookies.writes.at(-1)?.options.maxAge).toBe(0);
    await purgeExpiredApplicationOwners(db, 100);
  });

  it('waits for an ordinary owner operation before deleting its rows', async () => {
    const first = await owner();
    const rows = await hierarchy(first.id);
    let release!: () => void;
    let entered!: () => void;
    const releaseGate = new Promise<void>((resolve) => { release = resolve; });
    const enteredGate = new Promise<void>((resolve) => { entered = resolve; });
    const ordinary = withApplicationOwner(db, first.cookies, async (tx, ownerId) => {
      expect(ownerId).toBe(first.id);
      expect(await tx.attempt.count({ where: { ownerId } })).toBe(1);
      entered();
      await releaseGate;
      expect(await tx.attempt.count({ where: { ownerId } })).toBe(1);
    });
    await enteredGate;
    let deletionSettled = false;
    const deleting = deleteApplicationOwner(db, first.cookies, {}).finally(() => { deletionSettled = true; });
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(deletionSettled).toBe(false);
      expect(first.cookies.writes).toHaveLength(1);
    } finally {
      release();
    }
    await ordinary;
    await expect(deleting).resolves.toEqual({});
    expect(await db.anonymousSession.findUnique({ where: { id: first.id } })).toBeNull();
    expect(await db.attempt.findUnique({ where: { id: rows.attemptId } })).toBeNull();
    expect(await db.finalizationClaim.count({ where: { ownerId: first.id } })).toBe(0);
  });

  it('skips an expired owner locked by an ordinary operation and purges it on retry', async () => {
    const first = await owner();
    const rows = await hierarchy(first.id);
    await db.$executeRaw`
      UPDATE "AnonymousSession" SET "expiresAt" = clock_timestamp() + interval '500 milliseconds'
      WHERE "id" = ${first.id}
    `;
    let release!: () => void;
    let entered!: () => void;
    const releaseGate = new Promise<void>((resolve) => { release = resolve; });
    const enteredGate = new Promise<void>((resolve) => { entered = resolve; });
    const ordinary = withApplicationOwner(db, first.cookies, async (_tx, ownerId) => {
      expect(ownerId).toBe(first.id);
      entered();
      await releaseGate;
    });
    await enteredGate;
    try {
      await new Promise((resolve) => setTimeout(resolve, 650));
      await purgeExpiredApplicationOwners(db, 100);
      expect(await db.anonymousSession.findUnique({ where: { id: first.id } })).not.toBeNull();
      expect(await db.attempt.findUnique({ where: { id: rows.attemptId } })).not.toBeNull();
    } finally {
      release();
    }
    await ordinary;
    await purgeExpiredApplicationOwners(db, 100);
    expect(await db.anonymousSession.findUnique({ where: { id: first.id } })).toBeNull();
    expect(await db.attempt.findUnique({ where: { id: rows.attemptId } })).toBeNull();
  });
});
