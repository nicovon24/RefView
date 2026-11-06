import 'server-only';
import { createHash } from 'node:crypto';
import { canonicalJsonV2 } from '@refview/content';
import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { compileAssessmentSourceV1 } from './source-v1';

type Ref = Readonly<{ itemId: string; version: number }>;
type PublishedRow = Prisma.AssessmentPublicationGetPayload<{
  include: { source: true; review: { include: { revocations: true; principal: true } } };
}>;
const sha256Pattern = /^sha256:[0-9a-f]{64}$/;
const rolePattern = /^[a-z][a-z0-9_]*$/;
const present = (value: string) => value.length > 0 && value === value.trim();

const approvedDecisions = {
  footballInterpretationApproved: true,
  sourcesAndProvenanceApproved: true,
  spanishEnglishEquivalenceApproved: true,
  acceptedAlternativesApproved: true,
  correctionApproved: true,
  rubricMeaningApproved: true,
};

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

/** Throws on inconsistent stored authority. A draft or retired row is simply unavailable. */
export function verifyPublishedAssessmentV1(row: PublishedRow, ref: Ref) {
  if (row.state !== 'reviewed') return null;
  const { source, review } = row;
  if (!review || !row.reviewId || row.reviewId !== review.reviewId || review.revocations.length
    || row.itemId !== ref.itemId || row.itemVersion !== ref.version
    || source.itemId !== ref.itemId || source.version !== ref.version
    || source.contentHash !== row.contentHash || review.itemId !== row.itemId
    || review.itemVersion !== row.itemVersion || review.contentHash !== row.contentHash
    || review.rubricVersion !== source.rubricVersion || review.rubricHash !== source.rubricHash
    || row.revision !== 1 || !row.reviewedAt || row.retiredAt
    || review.reviewerPrincipal !== review.principal.principalId
    || !rolePattern.test(review.principal.databaseRole)
    || !present(review.principal.issuanceEvidenceRef)
    || !sha256Pattern.test(review.principal.issuanceEvidenceSha256)
    || !present(review.evidenceRef) || !sha256Pattern.test(review.evidenceSha256)
    || !Number.isFinite(review.reviewedAt.getTime())
    || review.reviewedAt.getTime() > row.reviewedAt.getTime()
    || canonicalJsonV2(review.decisions) !== canonicalJsonV2(approvedDecisions)) {
    throw new Error('assessment publication has no valid reviewed binding');
  }

  const compiled = compileAssessmentSourceV1(source.sourceJson);
  const envelope = canonicalJsonV2(['refview-assessment-item-v1', compiled.source]);
  const rubricEnvelope = canonicalJsonV2(['refview-assessment-rubric-v1', compiled.source.privateRubric]);
  if (source.sourceSchemaVersion !== 1 || source.itemId !== compiled.source.itemId
    || source.version !== compiled.source.version || source.lawsEdition !== compiled.source.lawsEdition
    || source.topicId !== compiled.source.topicId || source.level !== compiled.source.level
    || source.itemType !== compiled.source.type
    || source.rubricVersion !== compiled.source.privateRubric.rubricVersion
    || source.contentHash !== compiled.contentHash || source.rubricHash !== compiled.rubricHash
    || canonicalJsonV2(source.sourceJson) !== canonicalJsonV2(compiled.source)
    || source.canonicalEnvelope !== envelope || digest(source.canonicalEnvelope) !== source.contentHash
    || source.rubricEnvelope !== rubricEnvelope || digest(source.rubricEnvelope) !== source.rubricHash) {
    throw new Error('assessment publication source differs from canonical compiled bytes');
  }
  return compiled;
}

/** Server-private source for owner service use. This must never cross a client serialization boundary. */
export async function loadPublishedAssessmentV1(
  database: Pick<PrismaClient, 'assessmentPublication'>, ref: Ref,
) {
  const row = await database.assessmentPublication.findUnique({
    where: { itemId_itemVersion: { itemId: ref.itemId, itemVersion: ref.version } },
    include: { source: true, review: { include: { revocations: true, principal: true } } },
  });
  return row ? verifyPublishedAssessmentV1(row, ref) : null;
}
