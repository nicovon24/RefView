import 'dotenv/config';
import { expect, test } from 'vitest';
import { openTestDatabase } from '../../lib/db/connection';
import { loadPublishedAssessmentV1, verifyPublishedAssessmentV1 } from './published-reader-v1';
import { syntheticItemId, syntheticReviewId } from '../../../scripts/setup-synthetic-assessment-test';

const ref = { itemId: 'challenge-severity-rule', version: 1 };
const publishedRef = { itemId: syntheticItemId, version: 1 };

test('reads a real reviewed synthetic publication and its provisioned reviewer attribution', async () => {
  const database = openTestDatabase();
  try {
    const published = await loadPublishedAssessmentV1(database, publishedRef);
    expect(published?.source.itemId).toBe(syntheticItemId);
    const row = await database.assessmentPublication.findUnique({
      where: { itemId_itemVersion: { itemId: syntheticItemId, itemVersion: 1 } },
      include: { source: true, review: { include: { revocations: true, principal: true } } },
    });
    expect(row?.reviewId).toBe(syntheticReviewId);
    expect(row?.review?.principal.principalId).toBe(row?.review?.reviewerPrincipal);
    expect(row?.review?.principal.databaseRole).toBe('refview_reviewer_test');
  } finally { await database.$disconnect(); }
});

test('PostgreSQL draft and missing versions are unavailable', async () => {
  const database = openTestDatabase();
  try {
    expect(await loadPublishedAssessmentV1(database, ref)).toBeNull();
    expect(await loadPublishedAssessmentV1(database, { ...ref, version: 2 })).toBeNull();
  } finally {
    await database.$disconnect();
  }
});

test('exact source bytes, rubric identity, review attribution and revocation fail closed', async () => {
  const database = openTestDatabase();
  try {
    const approved = await database.assessmentPublication.findUnique({
      where: { itemId_itemVersion: { itemId: syntheticItemId, itemVersion: 1 } },
      include: { source: true, review: { include: { revocations: true, principal: true } } },
    });
    if (!approved?.review) throw new Error('reviewed synthetic fixture missing');
    const review = approved.review;
    const expected = verifyPublishedAssessmentV1(approved, publishedRef);
    expect(expected?.source.itemId).toBe(syntheticItemId);
    expect(() => verifyPublishedAssessmentV1({ ...approved, review: { ...review,
      principal: { ...review.principal, principalId: 'unprovisioned' } } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAssessmentV1({ ...approved, review: { ...review,
      evidenceRef: '' } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAssessmentV1({ ...approved, review: { ...review,
      evidenceSha256: `sha256:${'z'.repeat(64)}` } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAssessmentV1({ ...approved, review: { ...review,
      reviewedAt: new Date(approved.reviewedAt!.getTime() + 1_000) } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAssessmentV1({ ...approved, review: { ...review,
      revocations: [{ reviewId: approved.reviewId }] } } as typeof approved, publishedRef)).toThrow();
    expect(() => verifyPublishedAssessmentV1({ ...approved, review: { ...review,
      rubricHash: `sha256:${'b'.repeat(64)}` } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAssessmentV1({ ...approved, review: { ...review,
      decisions: { correctionApproved: false } } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAssessmentV1({ ...approved, contentHash: `sha256:${'c'.repeat(64)}` }, publishedRef)).toThrow();
    expect(() => verifyPublishedAssessmentV1({ ...approved, source: { ...approved.source,
      canonicalEnvelope: `${approved.source.canonicalEnvelope} ` } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAssessmentV1({ ...approved, source: { ...approved.source,
      sourceJson: { ...expected!.source, localized: { ...expected!.source.localized,
        en: { ...expected!.source.localized.en, title: 'Altered title' } } } } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAssessmentV1({ ...approved, source: { ...approved.source,
      sourceJson: { invalid: true } } }, publishedRef)).toThrow();
  } finally {
    await database.$disconnect();
  }
});

test('a retired PostgreSQL publication is unavailable inside a rolled-back transaction', async () => {
  const database = openTestDatabase();
  const rollback = new Error('rollback test state');
  try {
    await expect(database.$transaction(async (tx) => {
      // Simulate a persisted state for reader coverage; rollback preserves the trusted fixture.
      await tx.$executeRawUnsafe("SET LOCAL session_replication_role = 'replica'");
      await tx.$executeRaw`UPDATE public."AssessmentPublication" SET "state"='retired',
        "revision"=2, "retiredAt"=clock_timestamp()
        WHERE "itemId"=${syntheticItemId} AND "itemVersion"=1`;
      expect(await loadPublishedAssessmentV1(tx, publishedRef)).toBeNull();
      throw rollback;
    })).rejects.toBe(rollback);
    expect((await loadPublishedAssessmentV1(database, publishedRef))?.source.itemId).toBe(syntheticItemId);
  } finally { await database.$disconnect(); }
});

test('a revoked PostgreSQL review fails closed inside a rolled-back transaction', async () => {
  const database = openTestDatabase();
  const rollback = new Error('rollback test state');
  try {
    await expect(database.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL session_replication_role = 'replica'");
      await tx.$executeRaw`INSERT INTO public."AssessmentReviewRevocation"
        ("revocationId", "reviewId", "itemId", "itemVersion", "contentHash", "actor", "reason")
        SELECT 'synthetic-rollback-revocation', "reviewId", "itemId", "itemVersion",
          "contentHash", 'synthetic-assessment-reviewer-test', 'Rollback reader test'
        FROM public."AssessmentReviewRecord" WHERE "reviewId"=${syntheticReviewId}`;
      await expect(loadPublishedAssessmentV1(tx, publishedRef)).rejects.toThrow(/reviewed binding/);
      throw rollback;
    })).rejects.toBe(rollback);
    expect((await loadPublishedAssessmentV1(database, publishedRef))?.source.itemId).toBe(syntheticItemId);
  } finally { await database.$disconnect(); }
});
