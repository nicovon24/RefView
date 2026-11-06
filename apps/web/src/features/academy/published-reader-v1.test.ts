import 'dotenv/config';
import { expect, test } from 'vitest';
import { openTestDatabase } from '../../lib/db/connection';
import { academyLessonSourceV1 } from './lesson-source-v1';
import { loadPublishedAcademyLessonV1, verifyPublishedAcademyLessonV1 } from './published-reader-v1';
import { syntheticLessonId, syntheticReviewId, syntheticReviewerPrincipal,
  prepareSyntheticAcademy } from '../../../scripts/setup-synthetic-academy-test';

const draftRef = { lessonId: academyLessonSourceV1.lessonId, version: academyLessonSourceV1.version };
const publishedRef = { lessonId: syntheticLessonId, version: 1 };

test('reads the reviewed synthetic PostgreSQL lesson and mapped reviewer attribution', async () => {
  const database = openTestDatabase();
  try {
    const fixture = prepareSyntheticAcademy();
    const published = await loadPublishedAcademyLessonV1(database, publishedRef);
    expect(published?.source.lessonId).toBe(syntheticLessonId);
    expect(published?.contentHash).toBe(fixture.contentHash);
    const row = await database.academyPublication.findUnique({
      where: { lessonId_lessonVersion: { lessonId: syntheticLessonId, lessonVersion: 1 } },
      include: { source: true, review: { include: { revocations: true, principal: true } } },
    });
    expect(row?.reviewId).toBe(syntheticReviewId);
    expect(row?.review?.reviewerPrincipal).toBe(syntheticReviewerPrincipal);
    expect(row?.review?.principal.principalId).toBe(row?.review?.reviewerPrincipal);
    expect(row?.review?.principal.databaseRole).toBe('refview_reviewer_test');
  } finally { await database.$disconnect(); }
});

test('PostgreSQL draft and missing Academy versions are unavailable', async () => {
  const database = openTestDatabase();
  try {
    expect(await loadPublishedAcademyLessonV1(database, draftRef)).toBeNull();
    expect(await loadPublishedAcademyLessonV1(database, { ...draftRef, version: 999 })).toBeNull();
  } finally { await database.$disconnect(); }
});

test('exact source, review attribution, decisions, and revocation fail closed', async () => {
  const database = openTestDatabase();
  try {
    const row = await database.academyPublication.findUnique({
      where: { lessonId_lessonVersion: { lessonId: syntheticLessonId, lessonVersion: 1 } },
      include: { source: true, review: { include: { revocations: true, principal: true } } },
    });
    if (!row?.review || !row.reviewedAt) throw new Error('Reviewed synthetic Academy fixture missing');
    const review = row.review;
    const reviewedAt = row.reviewedAt;
    const source = verifyPublishedAcademyLessonV1(row, publishedRef)?.source;
    expect(source?.lessonId).toBe(syntheticLessonId);
    expect(() => verifyPublishedAcademyLessonV1(row, { ...publishedRef, version: 2 })).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, contentHash: `sha256:${'c'.repeat(64)}` }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, revision: 0 }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, reviewId: null }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, review: { ...review, reviewerPrincipal: 'other' } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, review: { ...review,
      principal: { ...review.principal, databaseRole: 'bad-role' } } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, review: { ...review,
      principal: { ...review.principal, issuanceEvidenceRef: '' } } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, review: { ...review,
      evidenceSha256: `sha256:${'z'.repeat(64)}` } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, review: { ...review,
      reviewedAt: new Date(reviewedAt.getTime() + 1_000) } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, review: { ...review,
      revocations: [{ reviewId: syntheticReviewId }] } } as typeof row, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, review: { ...review,
      decisions: { footballInterpretationApproved: false } } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, source: { ...row.source,
      canonicalEnvelope: `${row.source.canonicalEnvelope} ` } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, source: { ...row.source,
      sourceJson: { ...source!, localized: { ...source!.localized,
        en: { ...source!.localized.en, title: 'Altered' } } } } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, source: { ...row.source,
      sourceJson: { invalid: true } } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, source: { ...row.source,
      topicId: 'other' } }, publishedRef)).toThrow();
    expect(() => verifyPublishedAcademyLessonV1({ ...row, source: { ...row.source,
      sourceSchemaVersion: 2 } }, publishedRef)).toThrow();
  } finally { await database.$disconnect(); }
});

test('a retired PostgreSQL publication is unavailable inside a rolled-back transaction', async () => {
  const database = openTestDatabase();
  const rollback = new Error('rollback test state');
  try {
    await expect(database.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL session_replication_role = 'replica'");
      await tx.$executeRaw`UPDATE public."AcademyPublication" SET "state"='retired',
        "revision"=2, "retiredAt"=clock_timestamp()
        WHERE "lessonId"=${syntheticLessonId} AND "lessonVersion"=1`;
      expect(await loadPublishedAcademyLessonV1(tx, publishedRef)).toBeNull();
      throw rollback;
    })).rejects.toBe(rollback);
    expect((await loadPublishedAcademyLessonV1(database, publishedRef))?.source.lessonId).toBe(syntheticLessonId);
  } finally { await database.$disconnect(); }
});

test('a revoked PostgreSQL review fails closed inside a rolled-back transaction', async () => {
  const database = openTestDatabase();
  const rollback = new Error('rollback test state');
  try {
    await expect(database.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL session_replication_role = 'replica'");
      await tx.$executeRaw`INSERT INTO public."AcademyReviewRevocation"
        ("revocationId", "reviewId", "lessonId", "lessonVersion", "contentHash", "actor", "reason")
        SELECT 'synthetic-academy-rollback-revocation', "reviewId", "lessonId", "lessonVersion",
          "contentHash", ${syntheticReviewerPrincipal}, 'Rollback reader test'
        FROM public."AcademyReviewRecord" WHERE "reviewId"=${syntheticReviewId}`;
      await expect(loadPublishedAcademyLessonV1(tx, publishedRef)).rejects.toThrow(/reviewed binding/);
      throw rollback;
    })).rejects.toBe(rollback);
    expect((await loadPublishedAcademyLessonV1(database, publishedRef))?.source.lessonId).toBe(syntheticLessonId);
  } finally { await database.$disconnect(); }
});
