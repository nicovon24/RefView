import 'server-only';
import { createHash } from 'node:crypto';
import { canonicalJsonV2 } from '@refview/content';
import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { compileAcademyLessonSourceV1 } from './lesson-source-v1';

type Ref = Readonly<{ lessonId: string; version: number }>;
type PublishedRow = Prisma.AcademyPublicationGetPayload<{
  include: { source: true; review: { include: { revocations: true; principal: true } } };
}>;
const sha256Pattern = /^sha256:[0-9a-f]{64}$/;
const rolePattern = /^[a-z][a-z0-9_]*$/;
const present = (value: string) => value.length > 0 && value === value.trim();
const approvedDecisions = {
  footballInterpretationApproved: true,
  sourcesAndProvenanceApproved: true,
  spanishEnglishEquivalenceApproved: true,
};

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

/** Throws on a corrupt reviewed publication. Draft and retired versions are unavailable. */
export function verifyPublishedAcademyLessonV1(row: PublishedRow, ref: Ref) {
  if (row.state !== 'reviewed') return null;
  const { source, review } = row;
  if (!review || !row.reviewId || row.reviewId !== review.reviewId || review.revocations.length
    || row.lessonId !== ref.lessonId || row.lessonVersion !== ref.version
    || source.lessonId !== ref.lessonId || source.version !== ref.version
    || source.contentHash !== row.contentHash || review.lessonId !== row.lessonId
    || review.lessonVersion !== row.lessonVersion || review.contentHash !== row.contentHash
    || row.revision !== 1 || !row.reviewedAt || row.retiredAt
    || review.reviewerPrincipal !== review.principal.principalId
    || !rolePattern.test(review.principal.databaseRole)
    || !present(review.principal.issuanceEvidenceRef)
    || !sha256Pattern.test(review.principal.issuanceEvidenceSha256)
    || !present(review.evidenceRef) || !sha256Pattern.test(review.evidenceSha256)
    || !Number.isFinite(review.reviewedAt.getTime())
    || review.reviewedAt.getTime() > row.reviewedAt.getTime()
    || canonicalJsonV2(review.decisions) !== canonicalJsonV2(approvedDecisions)) {
    throw new Error('Academy publication has no valid reviewed binding');
  }

  const compiled = compileAcademyLessonSourceV1(source.sourceJson);
  const envelope = canonicalJsonV2(['refview-academy-lesson-v1', compiled.source]);
  if (source.sourceSchemaVersion !== 1 || source.lessonId !== compiled.source.lessonId
    || source.version !== compiled.source.version || source.lawsEdition !== compiled.source.lawsEdition
    || source.topicId !== compiled.source.topicId || source.contentHash !== compiled.contentHash
    || canonicalJsonV2(source.sourceJson) !== canonicalJsonV2(compiled.source)
    || source.canonicalEnvelope !== envelope || digest(source.canonicalEnvelope) !== source.contentHash) {
    throw new Error('Academy publication source differs from canonical compiled bytes');
  }
  return compiled;
}

/** Server-only reviewed lesson source; callers must project content before client serialization. */
export async function loadPublishedAcademyLessonV1(
  database: Pick<PrismaClient, 'academyPublication'>, ref: Ref,
) {
  const row = await database.academyPublication.findUnique({
    where: { lessonId_lessonVersion: { lessonId: ref.lessonId, lessonVersion: ref.version } },
    include: { source: true, review: { include: { revocations: true, principal: true } } },
  });
  return row ? verifyPublishedAcademyLessonV1(row, ref) : null;
}
