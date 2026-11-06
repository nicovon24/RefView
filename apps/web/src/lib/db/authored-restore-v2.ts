import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { evaluateClearPenaltyMainRefereeV1, normalizeDecision } from '@refview/domain';
import { summarizeObservationTraceV1, type ObservationTraceV1, type ViewSample } from '@refview/simulation';
import type { CompilerDependenciesV2 } from '@refview/content';
import type { PrismaClient } from '../../generated/prisma/client';
import { getPinnedAuthoredScenarioV2 } from './authored-publication-v2';
import { authoredPayloadDigestV2 } from './authored-finalization-v2';

/** Restores only the caller's attempt and re-derives finalized results from the pinned source. */
export async function restoreAuthoredAttemptV2(database: PrismaClient, token: string,
  attemptId: string, dependencies: CompilerDependenciesV2) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('anonymous owner unavailable');
  const tokenHash = `sha256:${createHash('sha256').update(token).digest('hex')}`;
  return database.$transaction(async (tx) => {
    const [owner] = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AnonymousSession" WHERE "tokenHash" = ${tokenHash}
        AND "expiresAt" > NOW() FOR SHARE`;
    if (!owner) throw new Error('anonymous owner unavailable');
    const attempt = await tx.attempt.findFirst({ where: { id: attemptId, ownerId: owner.id },
      include: { planItem: { include: { scenario: true } }, evaluation: true,
        decisions: { where: { kind: 'initial' } } },
    });
    if (!attempt) throw new Error('attempt owner mismatch');
    const pinned = attempt.planItem.scenario;
    const ref = { scenarioId: pinned.scenarioId, version: pinned.version };
    const compiled = await getPinnedAuthoredScenarioV2(tx, ref, dependencies);
    if (!compiled || compiled.contentHash !== pinned.contentHash) throw new Error('pinned source mismatch');
    const scenarioRef = { ...ref, contentHash: compiled.contentHash };
    const safeAttempt = { id: attempt.id, state: attempt.state, runRevision: attempt.runRevision,
      lastSafeTick: attempt.lastSafeTick, decidingTick: attempt.decidingTick,
      locale: attempt.locale, role: attempt.role, finalizedAt: attempt.finalizedAt };
    if (!['debrief', 'completed'].includes(attempt.state)) {
      return { attempt: { ...safeAttempt, evaluation: null, decisions: [] },
        scenarioRef, playable: compiled.playable, preparedDebrief: null, durableResult: null };
    }
    if (!attempt.finalizedAt || !attempt.evaluation || attempt.decisions.length !== 1) {
      throw new Error('incomplete finalized attempt');
    }
    const storedDecision = attempt.decisions[0]!;
    if (attempt.evaluation.decisionId !== storedDecision.id) throw new Error('evaluation decision mismatch');
    const runStart = await tx.attemptRunStart.findUnique({ where: { attemptId_runRevision: {
      attemptId: attempt.id, runRevision: attempt.runRevision,
    } } });
    const storedTrace = await tx.observationTrace.findUnique({ where: { attemptId: attempt.id } });
    if (!runStart || !storedTrace || storedTrace.runRevision !== attempt.runRevision ||
      storedTrace.traceVersion !== 1 || runStart.scenarioContentHash !== compiled.contentHash) {
      throw new Error('missing pinned observation trace');
    }
    const trace = storedTrace.payload as ObservationTraceV1;
    const rubric = compiled.privateContext.boundRubric.rubric;
    const summary = summarizeObservationTraceV1(trace, {
      fixture: compiled.privateContext.observationFixture,
      attemptId: attempt.id, runRevision: runStart.runRevision, role: 'mainReferee',
      initialView: runStart.initialView as ViewSample,
      fieldBounds: { minX: -compiled.playable.field.widthM / 2,
        maxX: compiled.playable.field.widthM / 2,
        minZ: -compiled.playable.field.lengthM / 2,
        maxZ: compiled.playable.field.lengthM / 2 },
      decisionTick: attempt.decidingTick ?? -1,
      decisionWindow: { fromTick: compiled.playable.decisionGate.opensAtTick,
        toTick: compiled.playable.decisionGate.closesAtTick },
      eligibleDecidingTransition: attempt.decidingRunRevision === runStart.runRevision,
      rubric: { scenarioRef: ref, scenarioContentHash: compiled.contentHash,
        observationRubricVersion: 1,
        requiredEvidenceIds: rubric.observation.requiredEvidenceIds },
    });
    if (!isDeepStrictEqual(summary, storedTrace.summary)) throw new Error('observation summary mismatch');
    const actorIds = compiled.canonicalSource.timeline.samples[0]!.actors.map((actor) => actor.actorId);
    const handles = new Map<string, string>(actorIds.map((id) =>
      [compiled.canonicalToPublicActorHandles.get(id)!, id]));
    const offenderActorHandle = storedDecision.offenderActorId === null ? null :
      compiled.canonicalToPublicActorHandles.get(storedDecision.offenderActorId);
    if (storedDecision.offenderActorId !== null && !offenderActorHandle) {
      throw new Error('decision actor source mismatch');
    }
    const decision = normalizeDecision({ decisionTick: storedDecision.decisionTick,
      stopPlay: storedDecision.stopPlay, restart: storedDecision.restart,
      discipline: storedDecision.discipline, offenderActorHandle }, {
      decisionGate: compiled.playable.decisionGate, decidingTick: attempt.decidingTick ?? -1,
      traceStopTick: trace.stopTick, canonicalActorIds: actorIds,
      resolveActorHandle: (handle) => {
        const id = handles.get(handle);
        if (!id) throw new Error('unknown actor handle');
        return id;
      },
    });
    if (decision.offenderActorId !== storedDecision.offenderActorId) {
      throw new Error('decision source mismatch');
    }
    const expectedDigest = authoredPayloadDigestV2({ scenarioRef: ref,
      scenarioContentHash: compiled.contentHash, attemptId: attempt.id,
      runRevision: runStart.runRevision, decision, trace });
    const claims = await tx.finalizationClaim.findMany({ where: {
      ownerId: owner.id, attemptId: attempt.id, decisionId: storedDecision.id,
    } });
    if (!claims.some((claim) => claim.payloadDigest === expectedDigest)) {
      throw new Error('finalization claim mismatch');
    }
    const evaluation = evaluateClearPenaltyMainRefereeV1(decision, {
      rubric, canonicalActorIds: actorIds,
      privateEvidenceIds: compiled.privateContext.observationFixture.evidence.map((item) => item.evidenceId),
      preparedDebriefContentIds: [compiled.privateContext.preparedDebrief.contentId],
      observationSummary: summary,
    });
    if (attempt.evaluation.evaluationVersion !== 1 ||
      attempt.evaluation.observationRubricVersion !== 1 ||
      !isDeepStrictEqual(evaluation, attempt.evaluation.result)) {
      throw new Error('evaluation source mismatch');
    }
    const { offenderActorId: _privateActor, ...publicDecision } = storedDecision;
    void _privateActor;
    return { attempt: { ...safeAttempt, evaluation: {
      id: attempt.evaluation.id, evaluationVersion: 1, result: evaluation,
    }, decisions: [{ ...publicDecision, offenderActorHandle }] },
      scenarioRef, playable: compiled.playable,
      preparedDebrief: compiled.privateContext.preparedDebrief,
      durableResult: { attemptId: attempt.id, runRevision: attempt.runRevision,
        decisionId: storedDecision.id, evaluationId: attempt.evaluation.id,
        finalizedAt: attempt.finalizedAt.toISOString() } };
  });
}
