import { createHash } from 'node:crypto';
import { evaluateClearPenaltyMainRefereeV1, normalizeDecision } from '@refview/domain';
import { summarizeObservationTraceV1, type ObservationTraceV1, type ViewSample } from '@refview/simulation';
import type { CompilerDependenciesV2 } from '@refview/content';
import { z } from 'zod';
import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { getPinnedAuthoredScenarioV2 } from './authored-publication-v2';

const requestSchema = z.strictObject({
  attemptId: z.string().min(1), idempotencyKey: z.string().min(1).max(128),
  decision: z.unknown(), trace: z.unknown(),
});

function stable(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(Object.is(value, -0) ? 0 : value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}`;
  throw new TypeError('non-JSON finalization payload');
}
export const authoredPayloadDigestV2 = (value: unknown) =>
  `sha256:${createHash('sha256').update(stable(value)).digest('hex')}`;
function parseRequest(input: string | unknown) {
  const raw = typeof input === 'string' ? input : JSON.stringify(input);
  if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > 256 * 1024) {
    throw new Error('finalization payload exceeds 256 KiB');
  }
  return requestSchema.parse(JSON.parse(raw));
}
function durableResult(attemptId: string, runRevision: number, decisionId: string,
  evaluationId: string, finalizedAt: Date | null) {
  if (!finalizedAt) throw new Error('incomplete finalized attempt');
  return { attemptId, runRevision, decisionId, evaluationId, finalizedAt: finalizedAt.toISOString() };
}

/** Finalizes a pinned v2 source under one owner and attempt lock. */
export async function finalizeAuthoredInitialDecisionV2(database: PrismaClient, token: string,
  payload: string | unknown, dependencies: CompilerDependenciesV2) {
  const request = parseRequest(payload);
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('anonymous owner unavailable');
  const tokenHash = `sha256:${createHash('sha256').update(token).digest('hex')}`;
  return database.$transaction(async (tx) => {
    const [owner] = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AnonymousSession" WHERE "tokenHash" = ${tokenHash}
        AND "expiresAt" > NOW() FOR SHARE`;
    if (!owner) throw new Error('anonymous owner unavailable');
    const [locked] = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Attempt" WHERE "id" = ${request.attemptId}
        AND "ownerId" = ${owner.id} FOR UPDATE`;
    if (!locked) throw new Error('attempt owner mismatch');
    const attempt = await tx.attempt.findUniqueOrThrow({ where: { id: request.attemptId },
      include: { planItem: { include: { scenario: true } } } });
    if (attempt.role !== 'mainReferee') throw new Error('role mismatch');
    const pinned = attempt.planItem.scenario;
    const ref = { scenarioId: pinned.scenarioId, version: pinned.version };
    const compiled = await getPinnedAuthoredScenarioV2(tx, ref, dependencies);
    if (!compiled || compiled.contentHash !== pinned.contentHash) throw new Error('pinned source mismatch');
    const source = compiled.canonicalSource;
    const trace = request.trace as ObservationTraceV1;
    const runStart = await tx.attemptRunStart.findUnique({ where: { attemptId_runRevision: {
      attemptId: attempt.id, runRevision: trace?.runRevision,
    } } });
    if (!runStart || runStart.scenarioContentHash !== compiled.contentHash ||
      runStart.role !== attempt.role) throw new Error('pinned run mismatch');
    const actorIds = source.timeline.samples[0]!.actors.map((actor) => actor.actorId);
    const handles = new Map<string, string>(actorIds.map((actorId) =>
      [compiled.canonicalToPublicActorHandles.get(actorId)!, actorId]));
    const decision = normalizeDecision(request.decision, {
      decisionGate: compiled.playable.decisionGate, decidingTick: attempt.decidingTick ?? -1,
      traceStopTick: trace?.stopTick, canonicalActorIds: actorIds,
      resolveActorHandle: (handle) => {
        const actorId = handles.get(handle);
        if (!actorId) throw new Error('unknown actor handle');
        return actorId;
      },
    });
    const rubric = compiled.privateContext.boundRubric.rubric;
    const fixture = compiled.privateContext.observationFixture;
    const summary = summarizeObservationTraceV1(trace, {
      fixture, attemptId: attempt.id, runRevision: runStart.runRevision, role: 'mainReferee',
      initialView: runStart.initialView as ViewSample,
      fieldBounds: { minX: -source.field.widthM / 2, maxX: source.field.widthM / 2,
        minZ: -source.field.lengthM / 2, maxZ: source.field.lengthM / 2 },
      decisionTick: attempt.decidingTick ?? -1,
      decisionWindow: { fromTick: source.decisionGate.opensAtTick,
        toTick: source.decisionGate.closesAtTick },
      eligibleDecidingTransition: attempt.decidingRunRevision === runStart.runRevision,
      rubric: { scenarioRef: ref, scenarioContentHash: compiled.contentHash,
        observationRubricVersion: 1,
        requiredEvidenceIds: rubric.observation.requiredEvidenceIds },
    });
    const payloadDigest = authoredPayloadDigestV2({ scenarioRef: ref, scenarioContentHash: compiled.contentHash,
      attemptId: attempt.id, runRevision: runStart.runRevision, decision, trace });
    const existingClaim = await tx.finalizationClaim.findUnique({ where: {
      ownerId_attemptId_idempotencyKey: { ownerId: owner.id,
        attemptId: attempt.id, idempotencyKey: request.idempotencyKey },
    } });
    if (existingClaim && existingClaim.payloadDigest !== payloadDigest) throw new Error('finalization conflict');
    const prior = await tx.decision.findUnique({ where: { attemptId_kind: {
      attemptId: attempt.id, kind: 'initial',
    } } });
    const toPublic = (row: { offenderActorId: string | null }) => {
      const { offenderActorId, ...safe } = row;
      return { ...safe, offenderActorHandle: offenderActorId === null ? null :
        compiled.canonicalToPublicActorHandles.get(offenderActorId) };
    };
    if (prior) {
      const priorClaim = await tx.finalizationClaim.findFirst({ where: {
        attemptId: attempt.id, decisionId: prior.id,
      } });
      if (!priorClaim || priorClaim.payloadDigest !== payloadDigest) throw new Error('finalization conflict');
      if (!['debrief', 'completed'].includes(attempt.state)) throw new Error('incomplete finalization state');
      const evaluation = await tx.evaluation.findUniqueOrThrow({ where: { attemptId: attempt.id } });
      if (!existingClaim) await tx.finalizationClaim.create({ data: {
        ownerId: owner.id, attemptId: attempt.id, idempotencyKey: request.idempotencyKey,
        payloadDigest, decisionId: prior.id,
      } });
      return { decision: toPublic(prior), evaluation: evaluation.result,
        state: attempt.state, finalizedAt: attempt.finalizedAt,
        durableResult: durableResult(attempt.id, runStart.runRevision,
          prior.id, evaluation.id, attempt.finalizedAt) };
    }
    if (existingClaim || attempt.state !== 'deciding' ||
      attempt.runRevision !== runStart.runRevision ||
      attempt.decidingRunRevision !== runStart.runRevision ||
      attempt.decidingTick !== decision.decisionTick) throw new Error('run is not eligible for finalization');
    const result = evaluateClearPenaltyMainRefereeV1(decision, {
      rubric, canonicalActorIds: actorIds,
      privateEvidenceIds: fixture.evidence.map((item) => item.evidenceId),
      preparedDebriefContentIds: [compiled.privateContext.preparedDebrief.contentId],
      observationSummary: summary,
    });
    const storedDecision = await tx.decision.create({ data: {
      attemptId: attempt.id, kind: 'initial', ...decision,
    } });
    await tx.observationTrace.create({ data: {
      attemptId: attempt.id, runRevision: runStart.runRevision, traceVersion: 1,
      payload: trace as unknown as Prisma.InputJsonValue,
      summary: summary as unknown as Prisma.InputJsonValue,
    } });
    const evaluation = await tx.evaluation.create({ data: {
      attemptId: attempt.id, decisionId: storedDecision.id, evaluationVersion: 1,
      observationRubricVersion: 1, result: result as unknown as Prisma.InputJsonValue,
    } });
    await tx.finalizationClaim.create({ data: {
      ownerId: owner.id, attemptId: attempt.id, idempotencyKey: request.idempotencyKey,
      payloadDigest, decisionId: storedDecision.id,
    } });
    const finalized = await tx.attempt.update({ where: { id: attempt.id }, data: {
      state: 'debrief', finalizedAt: new Date(),
    } });
    return { decision: toPublic(storedDecision), evaluation: result,
      state: finalized.state, finalizedAt: finalized.finalizedAt,
      durableResult: durableResult(attempt.id, runStart.runRevision,
        storedDecision.id, evaluation.id, finalized.finalizedAt) };
  });
}
