import 'dotenv/config';
import { expect, test } from 'vitest';
import { openTestDatabase } from '../../lib/db/connection';
import { syntheticItemId, syntheticReviewId } from '../../../scripts/setup-synthetic-assessment-test';
import { loadPinnedAssessmentV1, verifyPinnedAssessmentV1 } from './pinned-reader-v1';

const ref = { itemId: syntheticItemId, version: 1 };
const rollback = new Error('rollback pinned reader test');

test('recompiles a reviewed PostgreSQL source for its pinned identity', async () => {
  const database = openTestDatabase();
  try {
    const compiled = await loadPinnedAssessmentV1(database, ref);
    expect(compiled?.source.itemId).toBe(syntheticItemId);
    expect(compiled?.source.privateRubric.acceptedAnswers).toHaveLength(1);
    expect(await loadPinnedAssessmentV1(database, { ...ref, version: 2 })).toBeNull();
    expect(await loadPinnedAssessmentV1(database, { itemId: 'challenge-severity-rule', version: 1 })).toBeNull();
  } finally { await database.$disconnect(); }
});

test('rejects missing original reviewed event, review evidence, and source bytes', async () => {
  const database = openTestDatabase();
  try {
    const row = await database.assessmentPublication.findUnique({
      where: { itemId_itemVersion: { itemId: ref.itemId, itemVersion: ref.version } },
      include: { source: true, review: { include: { principal: true, revocations: true } }, events: true },
    });
    if (!row?.review) throw new Error('reviewed synthetic fixture missing');
    expect(verifyPinnedAssessmentV1(row, ref)?.contentHash).toBe(row.contentHash);
    expect(() => verifyPinnedAssessmentV1({ ...row, events: [] }, ref)).toThrow();
    expect(() => verifyPinnedAssessmentV1({ ...row, events: row.events.map((event) => ({
      ...event, reviewId: 'other-review',
    })) }, ref)).toThrow();
    expect(() => verifyPinnedAssessmentV1({ ...row,
      reviewedAt: new Date(row.reviewedAt!.getTime() + 1000) }, ref)).toThrow();
    expect(() => verifyPinnedAssessmentV1({ ...row, events: row.events.map((event) => ({
      ...event, occurredAt: new Date(event.occurredAt.getTime() + 1000),
    })) }, ref)).toThrow();
    expect(() => verifyPinnedAssessmentV1({ ...row, review: { ...row.review!, evidenceRef: '' } }, ref)).toThrow();
    expect(() => verifyPinnedAssessmentV1({ ...row, review: { ...row.review!, rubricHash: `sha256:${'a'.repeat(64)}` } }, ref)).toThrow();
    expect(() => verifyPinnedAssessmentV1({ ...row, source: { ...row.source,
      canonicalEnvelope: `${row.source.canonicalEnvelope} ` } }, ref)).toThrow();
  } finally { await database.$disconnect(); }
});

test('retired publication remains pinned through a rolled-back PostgreSQL transition', async () => {
  const database = openTestDatabase();
  try {
    await expect(database.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL session_replication_role = 'replica'");
      await tx.$executeRaw`UPDATE public."AssessmentPublication" SET "state"='retired',
        "revision"=2, "retiredAt"=clock_timestamp()
        WHERE "itemId"=${syntheticItemId} AND "itemVersion"=1`;
      await tx.$executeRaw`INSERT INTO public."AssessmentPublicationEvent"
        ("eventId", "itemId", "itemVersion", "contentHash", "reviewId", "priorState",
          "nextState", "priorRevision", "nextRevision", "actor", "reason", "occurredAt")
        SELECT 'synthetic-pinned-retirement-test', "itemId", "itemVersion", "contentHash", "reviewId",
          'reviewed', 'retired', 1, 2, 'synthetic-assessment-reviewer-test', 'Rollback pinned reader test', "retiredAt"
        FROM public."AssessmentPublication" WHERE "itemId"=${syntheticItemId} AND "itemVersion"=1`;
      expect((await loadPinnedAssessmentV1(tx, ref))?.source.itemId).toBe(syntheticItemId);
      const retired = await tx.assessmentPublication.findUnique({
        where: { itemId_itemVersion: { itemId: ref.itemId, itemVersion: ref.version } },
        include: { source: true, review: { include: { principal: true, revocations: true } }, events: true },
      });
      if (!retired) throw new Error('retired fixture missing');
      expect(() => verifyPinnedAssessmentV1({ ...retired,
        retiredAt: new Date(retired.retiredAt!.getTime() + 1000) }, ref)).toThrow();
      await tx.$executeRaw`INSERT INTO public."AssessmentReviewRevocation"
        ("revocationId", "reviewId", "itemId", "itemVersion", "contentHash", "actor", "reason", "revokedAt")
        SELECT 'synthetic-pinned-later-revocation-test', "reviewId", "itemId", "itemVersion",
          "contentHash", 'synthetic-assessment-reviewer-test', 'Later withdrawal',
          (SELECT "retiredAt" + interval '1 second' FROM public."AssessmentPublication"
            WHERE "itemId"=${syntheticItemId} AND "itemVersion"=1)
        FROM public."AssessmentReviewRecord" WHERE "reviewId"=${syntheticReviewId}`;
      expect((await loadPinnedAssessmentV1(tx, ref))?.source.itemId).toBe(syntheticItemId);
      throw rollback;
    })).rejects.toBe(rollback);
    expect((await loadPinnedAssessmentV1(database, ref))?.source.itemId).toBe(syntheticItemId);
  } finally { await database.$disconnect(); }
});

test('withdrawn original review remains pinned only after retirement', async () => {
  const database = openTestDatabase();
  try {
    await expect(database.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL session_replication_role = 'replica'");
      await tx.$executeRaw`INSERT INTO public."AssessmentReviewRevocation"
        ("revocationId", "reviewId", "itemId", "itemVersion", "contentHash", "actor", "reason")
        SELECT 'synthetic-pinned-revocation-test', "reviewId", "itemId", "itemVersion",
          "contentHash", 'synthetic-assessment-reviewer-test', 'Rollback pinned reader test'
        FROM public."AssessmentReviewRecord" WHERE "reviewId"=${syntheticReviewId}`;
      await expect(loadPinnedAssessmentV1(tx, ref)).rejects.toThrow();
      await tx.$executeRaw`UPDATE public."AssessmentPublication" SET "state"='retired',
        "revision"=2, "retiredAt"=(SELECT "revokedAt" FROM public."AssessmentReviewRevocation"
          WHERE "reviewId"=${syntheticReviewId})
        WHERE "itemId"=${syntheticItemId} AND "itemVersion"=1`;
      await tx.$executeRaw`INSERT INTO public."AssessmentPublicationEvent"
        ("eventId", "itemId", "itemVersion", "contentHash", "reviewId", "priorState",
          "nextState", "priorRevision", "nextRevision", "actor", "reason", "occurredAt")
        SELECT 'synthetic-pinned-revoked-retirement-test', "itemId", "itemVersion", "contentHash", "reviewId",
          'reviewed', 'retired', 1, 2, 'synthetic-assessment-reviewer-test', 'Rollback pinned reader test', "retiredAt"
        FROM public."AssessmentPublication" WHERE "itemId"=${syntheticItemId} AND "itemVersion"=1`;
      expect((await loadPinnedAssessmentV1(tx, ref))?.source.itemId).toBe(syntheticItemId);
      const retired = await tx.assessmentPublication.findUnique({
        where: { itemId_itemVersion: { itemId: ref.itemId, itemVersion: ref.version } },
        include: { source: true, review: { include: { principal: true, revocations: true } }, events: true },
      });
      if (!retired?.review) throw new Error('withdrawn fixture missing');
      const event = retired.events.find((entry) => entry.nextRevision === 2)!;
      const revocation = retired.review.revocations[0];
      for (const mutation of [
        { actor: 'other-reviewer' }, { reason: 'Other reason' },
        { occurredAt: new Date(event.occurredAt.getTime() + 1000) },
      ]) {
        expect(() => verifyPinnedAssessmentV1({ ...retired, events: retired.events.map((entry) =>
          entry.nextRevision === 2 ? { ...entry, ...mutation } : entry) }, ref)).toThrow();
      }
      expect(() => verifyPinnedAssessmentV1({ ...retired, review: { ...retired.review!,
        revocations: [{ ...revocation, reason: 'Other reason' }] } }, ref)).toThrow();
      throw rollback;
    })).rejects.toBe(rollback);
    expect((await loadPinnedAssessmentV1(database, ref))?.source.itemId).toBe(syntheticItemId);
  } finally { await database.$disconnect(); }
});
