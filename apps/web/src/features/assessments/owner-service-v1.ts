import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { canonicalJsonV2 } from '@refview/content';
import { z } from 'zod';
import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { withApplicationOwner, type ApplicationOwnerCookieStore,
  type ApplicationOwnerTransaction } from '../../lib/auth/application-owner';
import { withAccountTransaction, type AccountPrincipal } from '../../lib/auth/account-principal';
import { evaluateAssessmentAnswerV1 } from './evaluation-v1';
import { loadPinnedAssessmentV1 } from './pinned-reader-v1';
import { projectAssessmentActiveAttemptV1, projectAssessmentFinalizedResultV1 } from './public-dto-v1';
import { loadPublishedAssessmentV1 } from './published-reader-v1';

const slug = z.string().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const locale = z.enum(['es', 'en']);
const startInput = z.strictObject({ itemId: slug, version: z.number().int().positive().safe(), locale });
const structuredAnswer = { stopPlay: z.boolean(),
  restart: z.enum(['playOn', 'penaltyKick', 'directFreeKick', 'indirectFreeKick', 'droppedBall']),
  discipline: z.enum(['none', 'yellow', 'red']), offenderHandle: slug.nullable() };
const answerInput = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('ruleQuestion'), optionId: slug }),
  z.strictObject({ kind: z.literal('restartDiscipline'), ...structuredAnswer }),
  z.strictObject({ kind: z.literal('authoredIncidentAnalysis'), ...structuredAnswer,
    reasoning: z.string().max(4096) }),
]);
const finalizeInput = z.strictObject({ attemptId: z.uuid(), idempotencyKey: z.uuid(),
  answer: answerInput, locale });
const restoreInput = z.strictObject({ attemptId: z.uuid(), locale });
const historyInput = z.strictObject({ limit: z.number().int().min(1).max(50),
  cursorAttemptId: z.uuid().optional() });
type Transaction = ApplicationOwnerTransaction;
type StartRequest = z.infer<typeof startInput>;
type FinalizeRequest = z.infer<typeof finalizeInput>;
type RestoreRequest = z.infer<typeof restoreInput>;
type HistoryRequest = z.infer<typeof historyInput>;
const unavailable = () => new Error('assessment unavailable');
const conflict = () => new Error('assessment conflict');
async function publicErrors<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    if (error instanceof Error && (error.message === 'assessment unavailable'
      || error.message === 'assessment conflict')) throw error;
    throw unavailable();
  }
}

async function databaseNow(tx: Transaction) {
  const rows = await tx.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS now`;
  return rows[0]!.now;
}

async function nextPractice(tx: Transaction,
  source: NonNullable<Awaited<ReturnType<typeof loadPinnedAssessmentV1>>>) {
  const result: Array<{ targetItemId: string; targetVersion: number;
    availability: 'available' | 'unavailable' }> = [];
  for (const ref of source.source.recommendationRefs) {
    const published = await loadPublishedAssessmentV1(tx, { itemId: ref.targetItemId,
      version: ref.targetVersion });
    result.push({ targetItemId: ref.targetItemId, targetVersion: ref.targetVersion,
      availability: published && published.source.topicId === source.source.topicId
        && published.source.lawsEdition === source.source.lawsEdition ? 'available' : 'unavailable' });
  }
  return result;
}

/** Starts a fresh attempt only while the exact reviewed publication remains locked and eligible. */
export async function startAssessmentV1(database: PrismaClient,
  cookies: ApplicationOwnerCookieStore, input: unknown) {
  return publicErrors(async () => {
    const request = startInput.parse(input);
    return withApplicationOwner(database, cookies, (tx, ownerId) =>
      startOwnedAssessment(tx, ownerId, request));
  });
}

/** Account writes use one SQL-selected primary bucket, with no issued bearer token. */
export async function startAccountAssessmentV1(database: PrismaClient,
  principal: AccountPrincipal, input: unknown) {
  return publicErrors(async () => {
    const request = startInput.parse(input);
    return withAccountTransaction(database, principal, async (tx) => {
      const unissuedHash = `sha256:${randomBytes(32).toString('hex')}`;
      const rows = await tx.$queryRaw<Array<{ ownerId: string }>>`
        SELECT public.application_account_primary_owner(
          ${principal.token}, ${unissuedHash}) AS "ownerId"`;
      if (rows.length !== 1 || !rows[0]?.ownerId) throw unavailable();
      return startOwnedAssessment(tx, rows[0].ownerId, request);
    });
  });
}

async function startOwnedAssessment(tx: Transaction, ownerId: string, request: StartRequest) {
  const locked = await tx.$queryRaw<Array<{ contentHash: string; rubricVersion: number;
    rubricHash: string }>>`SELECT content_hash AS "contentHash",
    rubric_version AS "rubricVersion", rubric_hash AS "rubricHash"
    FROM public.content_lock_assessment_eligibility(${request.itemId}, ${request.version})`;
  if (locked.length !== 1) throw unavailable();
  const compiled = await loadPublishedAssessmentV1(tx, request);
  if (!compiled || compiled.contentHash !== locked[0]!.contentHash
    || compiled.rubricHash !== locked[0]!.rubricHash
    || compiled.source.privateRubric.rubricVersion !== locked[0]!.rubricVersion) throw unavailable();
  const attemptId = randomUUID();
  const startedAt = await databaseNow(tx);
  await tx.assessmentAttempt.create({ data: { attemptId, ownerId,
    itemId: request.itemId, itemVersion: request.version,
    contentHash: compiled.contentHash, rubricVersion: locked[0]!.rubricVersion,
    rubricHash: compiled.rubricHash, lawsEdition: compiled.source.lawsEdition, startedAt } });
  return projectAssessmentActiveAttemptV1(compiled, attemptId, request.locale);
}

async function lockAttempt(tx: Transaction, ownerId: string, attemptId: string,
  mode: 'share' | 'exclusive') {
  if (mode === 'exclusive') {
    const rows = await tx.$queryRaw<Array<{ attemptId: string }>>`
      SELECT "attemptId" FROM public."AssessmentAttempt"
      WHERE "attemptId"=${attemptId} AND "ownerId"=${ownerId} FOR UPDATE`;
    if (rows.length !== 1) throw unavailable();
  } else {
    const rows = await tx.$queryRaw<Array<{ attemptId: string }>>`
      SELECT "attemptId" FROM public."AssessmentAttempt"
      WHERE "attemptId"=${attemptId} AND "ownerId"=${ownerId} FOR SHARE`;
    if (rows.length !== 1) throw unavailable();
  }
}

async function accountAttemptOwner(tx: Transaction, principal: AccountPrincipal,
  attemptId: string, mode: 'share' | 'exclusive') {
  const rows = await tx.$queryRaw<Array<{ ownerId: string | null }>>`
    SELECT public.application_account_attempt_owner(
      ${principal.token}, ${attemptId}, ${mode}) AS "ownerId"`;
  if (rows.length !== 1 || !rows[0]?.ownerId) throw unavailable();
  return rows[0].ownerId;
}

/** Confirms the original answer exactly once; normalized equal retries may add an alias claim. */
export async function finalizeAssessmentV1(database: PrismaClient,
  cookies: ApplicationOwnerCookieStore, input: unknown) {
  return publicErrors(async () => {
    const request = finalizeInput.parse(input);
    return withApplicationOwner(database, cookies, (tx, ownerId) =>
      finalizeOwnedAssessment(tx, ownerId, request));
  });
}

/** Membership and the original owner lock precede the attempt lock. */
export async function finalizeAccountAssessmentV1(database: PrismaClient,
  principal: AccountPrincipal, input: unknown) {
  return publicErrors(async () => {
    const request = finalizeInput.parse(input);
    return withAccountTransaction(database, principal, async (tx) => {
      const ownerId = await accountAttemptOwner(tx, principal, request.attemptId, 'exclusive');
      return finalizeOwnedAssessment(tx, ownerId, request);
    });
  });
}

async function finalizeOwnedAssessment(tx: Transaction, ownerId: string, request: FinalizeRequest) {
    await lockAttempt(tx, ownerId, request.attemptId, 'exclusive');
    const attempt = await tx.assessmentAttempt.findUniqueOrThrow({
      where: { attemptId: request.attemptId }, include: { submission: true, result: true } });
    const compiled = await loadPinnedAssessmentV1(tx,
      { itemId: attempt.itemId, version: attempt.itemVersion });
    if (!compiled || attempt.contentHash !== compiled.contentHash
      || attempt.rubricHash !== compiled.rubricHash
      || attempt.rubricVersion !== compiled.source.privateRubric.rubricVersion
      || attempt.lawsEdition !== compiled.source.lawsEdition) throw unavailable();
    const evaluated = evaluateAssessmentAnswerV1(compiled, request.answer);
    const claim = await tx.assessmentFinalizationClaim.findUnique({ where: {
      ownerId_attemptId_idempotencyKey: { ownerId, attemptId: request.attemptId,
        idempotencyKey: request.idempotencyKey } } });
    if (claim && claim.submissionDigest !== evaluated.submissionDigest) throw conflict();
    let resultId: string;
    if (attempt.result || attempt.submission || claim) {
      if (!attempt.result || !attempt.submission || attempt.state !== 'finalized'
        || !attempt.finalizedAt || attempt.result.finalizedAt.getTime() !== attempt.finalizedAt.getTime()
        || attempt.result.submissionDigest !== evaluated.submissionDigest
        || attempt.submission.submissionDigest !== evaluated.submissionDigest
        || canonicalJsonV2(attempt.submission.normalizedAnswer) !== canonicalJsonV2(evaluated.normalizedAnswer)
        || attempt.result.algorithmVersion !== evaluated.result.algorithmVersion
        || attempt.result.correctionVersion !== evaluated.result.correctionVersion
        || canonicalJsonV2(attempt.result.evaluation) !== canonicalJsonV2(evaluated.result)
        || (claim && claim.resultId !== attempt.result.resultId)) throw conflict();
      resultId = attempt.result.resultId;
      if (!claim) await tx.assessmentFinalizationClaim.create({ data: {
        claimId: randomUUID(), ownerId, attemptId: request.attemptId,
        idempotencyKey: request.idempotencyKey,
        submissionDigest: evaluated.submissionDigest, resultId } });
    } else {
      if (attempt.state !== 'ready' || attempt.finalizedAt !== null) throw conflict();
      const finalizedAt = await databaseNow(tx);
      resultId = randomUUID();
      await tx.assessmentSubmission.create({ data: { attemptId: request.attemptId,
        normalizedAnswer: evaluated.normalizedAnswer as Prisma.InputJsonValue,
        submissionDigest: evaluated.submissionDigest, submittedAt: finalizedAt } });
      await tx.assessmentResult.create({ data: { resultId, attemptId: request.attemptId,
        submissionDigest: evaluated.submissionDigest,
        algorithmVersion: evaluated.result.algorithmVersion,
        correctionVersion: evaluated.result.correctionVersion,
        evaluation: evaluated.result as Prisma.InputJsonValue, finalizedAt } });
      await tx.assessmentFinalizationClaim.create({ data: { claimId: randomUUID(),
        ownerId, attemptId: request.attemptId, idempotencyKey: request.idempotencyKey,
        submissionDigest: evaluated.submissionDigest, resultId } });
      await tx.assessmentAttempt.update({ where: { attemptId: request.attemptId },
        data: { state: 'finalized', finalizedAt } });
    }
    return projectAssessmentFinalizedResultV1(compiled, request.attemptId, request.locale,
      evaluated, await nextPractice(tx, compiled));
}

/** Reauthorizes every read and verifies stored finalized bytes against the pinned rubric. */
export async function restoreAssessmentV1(database: PrismaClient,
  cookies: ApplicationOwnerCookieStore, input: unknown) {
  return publicErrors(async () => {
    const request = restoreInput.parse(input);
    return withApplicationOwner(database, cookies, (tx, ownerId) =>
      restoreOwnedAssessment(tx, ownerId, request));
  });
}

/** Restores from any account bucket after SQL membership and owner locking. */
export async function restoreAccountAssessmentV1(database: PrismaClient,
  principal: AccountPrincipal, input: unknown) {
  return publicErrors(async () => {
    const request = restoreInput.parse(input);
    return withAccountTransaction(database, principal, async (tx) => {
      const ownerId = await accountAttemptOwner(tx, principal, request.attemptId, 'share');
      return restoreOwnedAssessment(tx, ownerId, request);
    });
  });
}

async function restoreOwnedAssessment(tx: Transaction, ownerId: string, request: RestoreRequest) {
      await lockAttempt(tx, ownerId, request.attemptId, 'share');
      const attempt = await tx.assessmentAttempt.findUniqueOrThrow({
        where: { attemptId: request.attemptId }, include: { submission: true, result: true } });
      const compiled = await loadPinnedAssessmentV1(tx,
        { itemId: attempt.itemId, version: attempt.itemVersion });
      if (!compiled || attempt.contentHash !== compiled.contentHash
        || attempt.rubricHash !== compiled.rubricHash
        || attempt.rubricVersion !== compiled.source.privateRubric.rubricVersion
        || attempt.lawsEdition !== compiled.source.lawsEdition) throw unavailable();
      if (attempt.state === 'ready') {
        if (attempt.submission || attempt.result || attempt.finalizedAt) throw unavailable();
        return { state: 'ready' as const,
          attempt: projectAssessmentActiveAttemptV1(compiled, attempt.attemptId, request.locale) };
      }
      if (attempt.state !== 'finalized' || !attempt.submission || !attempt.result
        || !attempt.finalizedAt || !attempt.startedAt) throw unavailable();
      const evaluated = evaluateAssessmentAnswerV1(compiled, attempt.submission.normalizedAnswer);
      if (attempt.submission.submissionDigest !== evaluated.submissionDigest
        || attempt.result.submissionDigest !== evaluated.submissionDigest
        || attempt.result.algorithmVersion !== evaluated.result.algorithmVersion
        || attempt.result.correctionVersion !== evaluated.result.correctionVersion
        || canonicalJsonV2(attempt.result.evaluation) !== canonicalJsonV2(evaluated.result)
        || attempt.result.finalizedAt.getTime() !== attempt.finalizedAt.getTime()) throw unavailable();
      return { state: 'finalized' as const,
        result: projectAssessmentFinalizedResultV1(compiled, attempt.attemptId,
          request.locale, evaluated, await nextPractice(tx, compiled)) };
}

/** Bounded owner-only timeline; the cursor must itself belong to this owner. */
export async function assessmentHistoryV1(database: PrismaClient,
  cookies: ApplicationOwnerCookieStore, input: unknown) {
  return publicErrors(async () => {
    const request = historyInput.parse(input);
    return withApplicationOwner(database, cookies, async (tx, ownerId) => {
      const cursor = request.cursorAttemptId
        ? await tx.assessmentAttempt.findFirst({ where: { ownerId,
          attemptId: request.cursorAttemptId }, select: { attemptId: true, startedAt: true } }) : null;
      if (request.cursorAttemptId && !cursor) throw unavailable();
      const rows = await tx.assessmentAttempt.findMany({ where: { ownerId,
        ...(cursor ? { OR: [{ startedAt: { lt: cursor.startedAt } },
          { startedAt: cursor.startedAt, attemptId: { lt: cursor.attemptId } }] } : {}) },
      orderBy: [{ startedAt: 'desc' }, { attemptId: 'desc' }], take: request.limit + 1,
      select: { attemptId: true, itemId: true, itemVersion: true, lawsEdition: true,
        state: true, startedAt: true, finalizedAt: true } });
      return projectHistory(rows, request.limit);
    });
  });
}

type HistoryRow = { attemptId: string; itemId: string; itemVersion: number;
  lawsEdition: string; state: 'ready' | 'finalized'; startedAt: Date; finalizedAt: Date | null };

function projectHistory(rows: HistoryRow[], limit: number) {
  const page = rows.slice(0, limit);
  return { entries: page.map((row) => ({ attemptId: row.attemptId,
    itemId: row.itemId, version: row.itemVersion, lawsEdition: row.lawsEdition,
    state: row.state, startedAt: row.startedAt.toISOString(),
    finalizedAt: row.finalizedAt?.toISOString() ?? null })),
  nextCursorAttemptId: rows.length > limit ? page.at(-1)!.attemptId : null };
}

/** One global tuple order across every bound owner; SQL validates the cursor. */
export async function accountAssessmentHistoryV1(database: PrismaClient,
  principal: AccountPrincipal, input: unknown) {
  return publicErrors(async () => {
    const request: HistoryRequest = historyInput.parse(input);
    return withAccountTransaction(database, principal, async (tx) => {
      const rows = await tx.$queryRaw<Array<HistoryRow>>`
        SELECT attempt_id AS "attemptId", item_id AS "itemId",
          item_version AS "itemVersion", laws_edition AS "lawsEdition",
          attempt_state AS state, started_at AS "startedAt",
          finalized_at AS "finalizedAt"
        FROM public.application_account_assessment_history(
          ${principal.token}, ${request.limit}, ${request.cursorAttemptId ?? null})`;
      return projectHistory(rows, request.limit);
    });
  });
}
