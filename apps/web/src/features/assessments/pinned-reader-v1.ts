import 'server-only';
import { createHash } from 'node:crypto';
import { canonicalJsonV2 } from '@refview/content';
import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { compileAssessmentSourceV1 } from './source-v1';

type Ref = Readonly<{ itemId: string; version: number }>;
type PinnedRow = Prisma.AssessmentPublicationGetPayload<{
  include: { source: true; review: { include: { revocations: true; principal: true } }; events: true };
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
const digest = (value: string) => `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;

/** Private historical source for an already owned attempt. Never use for new-start eligibility. */
export function verifyPinnedAssessmentV1(row: PinnedRow, ref: Ref) {
  if (row.state === 'draft') return null;
  const { source, review } = row;
  if (!review || !row.reviewId || row.reviewId !== review.reviewId
    || row.itemId !== ref.itemId || row.itemVersion !== ref.version
    || source.itemId !== ref.itemId || source.version !== ref.version
    || row.contentHash !== source.contentHash
    || review.itemId !== ref.itemId || review.itemVersion !== ref.version
    || review.contentHash !== source.contentHash
    || review.rubricVersion !== source.rubricVersion || review.rubricHash !== source.rubricHash
    || !row.reviewedAt || !Number.isFinite(row.reviewedAt.getTime())
    || (row.state === 'reviewed' && (row.revision !== 1 || row.retiredAt || review.revocations.length !== 0))
    || (row.state === 'retired' && (row.revision !== 2 || !row.retiredAt
      || !Number.isFinite(row.retiredAt.getTime()) || row.retiredAt < row.reviewedAt))
    || review.revocations.length > 1
    || review.revocations.some((revocation) => revocation.reviewId !== review.reviewId
      || revocation.itemId !== ref.itemId || revocation.itemVersion !== ref.version
      || revocation.contentHash !== source.contentHash
      || !present(revocation.actor) || !present(revocation.reason)
      || !Number.isFinite(revocation.revokedAt.getTime())
      || revocation.revokedAt < review.reviewedAt)
    || review.reviewerPrincipal !== review.principal.principalId
    || !rolePattern.test(review.principal.databaseRole)
    || !present(review.principal.issuanceEvidenceRef)
    || !sha256Pattern.test(review.principal.issuanceEvidenceSha256)
    || !present(review.evidenceRef) || !sha256Pattern.test(review.evidenceSha256)
    || !Number.isFinite(review.reviewedAt.getTime()) || review.reviewedAt > row.reviewedAt
    || canonicalJsonV2(review.decisions) !== canonicalJsonV2(approvedDecisions)) {
    throw new Error('assessment pin has no valid original review binding');
  }

  const reviewedEvent = row.events.filter((event) => event.nextRevision === 1);
  if (reviewedEvent.length !== 1 || reviewedEvent[0].itemId !== ref.itemId
    || reviewedEvent[0].itemVersion !== ref.version
    || reviewedEvent[0].contentHash !== source.contentHash
    || reviewedEvent[0].reviewId !== review.reviewId
    || reviewedEvent[0].priorState !== 'draft' || reviewedEvent[0].nextState !== 'reviewed'
    || reviewedEvent[0].priorRevision !== 0
    || reviewedEvent[0].actor !== review.reviewerPrincipal || !present(reviewedEvent[0].reason)
    || !Number.isFinite(reviewedEvent[0].occurredAt.getTime())
    || reviewedEvent[0].occurredAt.getTime() !== row.reviewedAt.getTime()
    || reviewedEvent[0].occurredAt < review.reviewedAt) {
    throw new Error('assessment pin has no original reviewed event');
  }
  if (row.state === 'retired') {
    const retiredEvent = row.events.filter((event) => event.nextRevision === 2);
    if (retiredEvent.length !== 1 || row.events.length !== 2
      || retiredEvent[0].itemId !== ref.itemId || retiredEvent[0].itemVersion !== ref.version
      || retiredEvent[0].contentHash !== source.contentHash
      || retiredEvent[0].reviewId !== review.reviewId
      || retiredEvent[0].priorState !== 'reviewed' || retiredEvent[0].nextState !== 'retired'
      || retiredEvent[0].priorRevision !== 1
      || !present(retiredEvent[0].actor) || !present(retiredEvent[0].reason)
      || !Number.isFinite(retiredEvent[0].occurredAt.getTime())
      || retiredEvent[0].occurredAt.getTime() !== row.retiredAt!.getTime()
      || retiredEvent[0].occurredAt < reviewedEvent[0].occurredAt) {
      throw new Error('assessment pin has no retired event');
    }
    const revocation = review.revocations[0];
    if (revocation && (revocation.revokedAt < row.retiredAt!
      || (revocation.revokedAt.getTime() === row.retiredAt!.getTime()
        && (revocation.actor !== retiredEvent[0].actor || revocation.reason !== retiredEvent[0].reason)))) {
      throw new Error('assessment pin withdrawal differs from retirement event');
    }
  } else if (row.events.length !== 1) {
    throw new Error('assessment pin has unexpected publication event');
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
    throw new Error('assessment pin source differs from canonical compiled bytes');
  }
  return compiled;
}

/** Owner service must establish ownership before calling this server-private read. */
export async function loadPinnedAssessmentV1(
  database: Pick<PrismaClient, 'assessmentPublication'>, ref: Ref,
) {
  const row = await database.assessmentPublication.findUnique({
    where: { itemId_itemVersion: { itemId: ref.itemId, itemVersion: ref.version } },
    include: { source: true, review: { include: { revocations: true, principal: true } }, events: true },
  });
  return row ? verifyPinnedAssessmentV1(row, ref) : null;
}
