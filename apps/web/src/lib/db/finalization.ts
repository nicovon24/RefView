import { createHash } from 'node:crypto';
import { createScenario, deriveScenarioContentHash, evaluateClearPenaltyMainRefereeV1,
  normalizeDecision, type ScenarioInput, type ClearPenaltyMainRefereeRubricV1 } from '@refview/domain';
import { createObservationFixture, summarizeObservationTraceV1,
  type ObservationFixtureInput, type ObservationTraceV1 } from '@refview/simulation';
import { z } from 'zod';
import type { Prisma, PrismaClient } from '../../generated/prisma/client';

type Transaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
const tokenPattern = /^[a-f0-9]{64}$/;
const requestSchema = z.strictObject({
  attemptId: z.string().min(1), idempotencyKey: z.string().min(1).max(128),
  decision: z.unknown(), trace: z.unknown(),
});
const privateSchema = z.strictObject({
  initialRefereePose: z.unknown(), scenarioInput: z.unknown(), observationFixtureInput: z.unknown(),
  rubric: z.unknown(), preparedDebriefContentIds: z.array(z.string().min(1)).min(1),
});

function stable(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(Object.is(value, -0) ? 0 : value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}`;
  throw new TypeError('non-JSON finalization payload');
}
function digest(value: unknown): string { return `sha256:${createHash('sha256').update(stable(value)).digest('hex')}`; }
function publicDecision<T extends { offenderActorId: string | null }>(
  row: T, scenario: ReturnType<typeof createScenario>,
) {
  const { offenderActorId, ...safe } = row;
  return { ...safe, offenderActorHandle: offenderActorId === null
    ? null : scenario.publicActorHandle(offenderActorId) };
}
function durableResult(attemptId: string, runRevision: number, decisionId: string,
  evaluationId: string, finalizedAt: Date | null) {
  if (!finalizedAt) throw new Error('incomplete finalized attempt');
  return { attemptId, runRevision, decisionId, evaluationId, finalizedAt: finalizedAt.toISOString() };
}
function parseRequest(payload: string | unknown) {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
  if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > 256 * 1024)
    throw new Error('finalization payload exceeds 256 KiB');
  return requestSchema.parse(JSON.parse(raw));
}
async function ownerInTransaction(tx: Transaction, token: string) {
  if (!tokenPattern.test(token)) throw new Error('anonymous owner unavailable');
  const tokenHash = `sha256:${createHash('sha256').update(token).digest('hex')}`;
  const [owner] = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "AnonymousSession" WHERE "tokenHash" = ${tokenHash}
      AND "expiresAt" > NOW() FOR SHARE`;
  if (!owner) throw new Error('anonymous owner unavailable');
  return owner.id;
}

/** Finalizes one pinned initial decision; the cookie token is supplied by trusted server code. */
export async function finalizeInitialDecision(database: PrismaClient, token: string, payload: string | unknown) {
  const request = parseRequest(payload);
  return database.$transaction(async (tx) => {
    const ownerId = await ownerInTransaction(tx, token);
    const [locked] = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Attempt" WHERE "id" = ${request.attemptId} AND "ownerId" = ${ownerId} FOR UPDATE`;
    if (!locked) throw new Error('attempt owner mismatch');
    const attempt = await tx.attempt.findUniqueOrThrow({ where: { id: request.attemptId }, include: {
      planItem: { include: { scenario: true } },
    } });
    const pinned = attempt.planItem.scenario;
    const privateContent = privateSchema.parse(pinned.privateContent);
    const source = privateContent.scenarioInput as ScenarioInput;
    const ref = { scenarioId: pinned.scenarioId, version: pinned.version };
    if (deriveScenarioContentHash(source) !== pinned.contentHash) throw new Error('scenario source hash mismatch');
    const scenario = createScenario(source, { ref, contentHash: pinned.contentHash });
    if (source.competitionProfileId !== pinned.competitionProfileId || source.lawsEdition !== pinned.lawsEdition
      || stable(scenario.playable('mainReferee')) !== stable(pinned.publicContent)
      || stable(privateContent.rubric) !== stable(source.privateReview.rubric)
      || stable(privateContent.initialRefereePose) !== stable(source.privateReview.facts.initialRefereePose))
      throw new Error('pinned scenario projection mismatch');
    const trace = request.trace as ObservationTraceV1;
    // The bound identity is validated by C2. The revision is pinned to the exact submitted run.
    const runStart = await tx.attemptRunStart.findUnique({ where: { attemptId_runRevision: {
      attemptId: attempt.id, runRevision: trace?.runRevision,
    } } });
    if (!runStart || runStart.scenarioContentHash !== pinned.contentHash || runStart.role !== attempt.role)
      throw new Error('pinned run mismatch');
    const decision = normalizeDecision(request.decision, {
      decisionGate: scenario.playable('mainReferee').decisionGate,
      decidingTick: attempt.decidingTick ?? -1, traceStopTick: trace?.stopTick,
      canonicalActorIds: scenario.timeline.snapshot(0).actors.map((actor) => actor.actorId),
      resolveActorHandle: scenario.resolveActorHandle,
    });
    const fixtureInput = privateContent.observationFixtureInput as ObservationFixtureInput;
    // Synthetic v1 has no hashed camera-collider source. Keep that geometry absent until the
    // canonical ScenarioInput carries it; fixture evidence must match the hashed private source.
    if (stable(fixtureInput.evidence) !== stable(source.privateReview.evidence)
      || !Array.isArray(fixtureInput.cameraColliders) || fixtureInput.cameraColliders.length !== 0)
      throw new Error('private observation fixture geometry mismatch');
    const fixture = createObservationFixture(fixtureInput,
      scenario.timeline, pinned.contentHash);
    const rubric = privateContent.rubric as ClearPenaltyMainRefereeRubricV1;
    if (privateContent.preparedDebriefContentIds.length !== 1
      || privateContent.preparedDebriefContentIds[0] !== rubric.debriefContentId)
      throw new Error('prepared debrief binding mismatch');
    const summary = summarizeObservationTraceV1(trace, {
      fixture, attemptId: attempt.id, runRevision: runStart.runRevision, role: 'mainReferee',
      initialView: runStart.initialView as typeof trace.views[number]['view'],
      fieldBounds: { minX: -scenario.playable('mainReferee').field.widthM / 2,
        maxX: scenario.playable('mainReferee').field.widthM / 2,
        minZ: -scenario.playable('mainReferee').field.lengthM / 2,
        maxZ: scenario.playable('mainReferee').field.lengthM / 2 },
      decisionTick: attempt.decidingTick ?? -1,
      decisionWindow: { fromTick: source.decisionGate.opensAtTick, toTick: source.decisionGate.closesAtTick },
      eligibleDecidingTransition: attempt.decidingRunRevision === runStart.runRevision,
      rubric: { scenarioRef: ref, scenarioContentHash: pinned.contentHash,
        observationRubricVersion: 1, requiredEvidenceIds: rubric.observation.requiredEvidenceIds },
    });
    const payloadDigest = digest({ scenarioRef: ref, scenarioContentHash: pinned.contentHash,
      attemptId: attempt.id, runRevision: runStart.runRevision, decision, trace });
    const existingClaim = await tx.finalizationClaim.findUnique({ where: { ownerId_attemptId_idempotencyKey: {
      ownerId, attemptId: attempt.id, idempotencyKey: request.idempotencyKey,
    } } });
    if (existingClaim && existingClaim.payloadDigest !== payloadDigest) throw new Error('finalization conflict');
    const priorDecision = await tx.decision.findUnique({ where: { attemptId_kind: { attemptId: attempt.id, kind: 'initial' } } });
    if (priorDecision) {
      const priorClaim = await tx.finalizationClaim.findFirst({ where: { attemptId: attempt.id, decisionId: priorDecision.id } });
      if (!priorClaim || priorClaim.payloadDigest !== payloadDigest) throw new Error('finalization conflict');
      const evaluation = await tx.evaluation.findUniqueOrThrow({ where: { attemptId: attempt.id } });
      if (!['debrief', 'completed'].includes(attempt.state)) throw new Error('incomplete finalization state');
      if (!existingClaim) await tx.finalizationClaim.create({ data: {
        ownerId, attemptId: attempt.id, idempotencyKey: request.idempotencyKey,
        payloadDigest, decisionId: priorDecision.id,
      } });
      return { decision: publicDecision(priorDecision, scenario),
        evaluation: evaluation.result, state: attempt.state, finalizedAt: attempt.finalizedAt,
        durableResult: durableResult(attempt.id, runStart.runRevision, priorDecision.id,
          evaluation.id, attempt.finalizedAt) };
    }
    if (existingClaim || attempt.state !== 'deciding' || attempt.runRevision !== runStart.runRevision
      || attempt.decidingRunRevision !== runStart.runRevision || attempt.decidingTick !== decision.decisionTick)
      throw new Error('run is not eligible for finalization');
    const result = evaluateClearPenaltyMainRefereeV1(decision, {
      rubric, canonicalActorIds: scenario.timeline.snapshot(0).actors.map((actor) => actor.actorId),
      privateEvidenceIds: fixture.evidence.map((entry) => entry.evidenceId),
      preparedDebriefContentIds: privateContent.preparedDebriefContentIds,
      observationSummary: summary,
    });
    const storedDecision = await tx.decision.create({ data: { attemptId: attempt.id, kind: 'initial', ...decision } });
    await tx.observationTrace.create({ data: { attemptId: attempt.id, runRevision: runStart.runRevision,
      traceVersion: 1, payload: trace as unknown as Prisma.InputJsonValue,
      summary: summary as unknown as Prisma.InputJsonValue } });
    const storedEvaluation = await tx.evaluation.create({ data: { attemptId: attempt.id, decisionId: storedDecision.id,
      evaluationVersion: 1, observationRubricVersion: 1, result: result as unknown as Prisma.InputJsonValue } });
    await tx.finalizationClaim.create({ data: { ownerId, attemptId: attempt.id,
      idempotencyKey: request.idempotencyKey, payloadDigest, decisionId: storedDecision.id } });
    const finalized = await tx.attempt.update({ where: { id: attempt.id }, data: {
      state: 'debrief', finalizedAt: new Date(),
    } });
    return { decision: publicDecision(storedDecision, scenario),
      evaluation: result, state: finalized.state, finalizedAt: finalized.finalizedAt,
      durableResult: durableResult(attempt.id, runStart.runRevision, storedDecision.id,
        storedEvaluation.id, finalized.finalizedAt) };
  });
}
