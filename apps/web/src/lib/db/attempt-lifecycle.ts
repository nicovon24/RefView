import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createScenario, deriveScenarioContentHash, evaluateClearPenaltyMainRefereeV1,
  normalizeDecision, type ClearPenaltyMainRefereeRubricV1, type ScenarioInput,
  type TrustedObservationSummaryV1 } from '@refview/domain';
import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';

const tokenPattern = /^[a-f0-9]{64}$/;
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const finite = z.number().finite();
const camera = z.strictObject({
  mode: z.enum(['thirdPerson', 'firstPerson']),
  distanceM: finite.min(2).max(8), lateralOffsetM: finite.min(-3).max(3),
  verticalFovRad: finite.min(0.785).max(1.31), viewportAspect: finite.min(0.75).max(2.5),
});
const pose = z.strictObject({
  position: z.strictObject({ x: finite, y: z.literal(0), z: finite }),
  yawRad: finite, pitchRad: finite.min(-1.2).max(1.2).optional(),
});
const publicGate = z.object({
  role: z.literal('mainReferee'), durationTicks: z.number().int().min(0).max(480),
  field: z.object({ lengthM: finite.positive(), widthM: finite.positive() }),
  decisionGate: z.object({ opensAtTick: z.number().int().nonnegative(),
    closesAtTick: z.number().int().nonnegative(), forcePauseAtTick: z.number().int().nonnegative() }),
}).superRefine((value, context) => {
  const gate = value.decisionGate;
  if (gate.opensAtTick > gate.closesAtTick || gate.closesAtTick > gate.forcePauseAtTick
    || gate.forcePauseAtTick > value.durationTicks)
    context.addIssue({ code: 'custom', message: 'invalid decision gate' });
});
const createInput = z.strictObject({
  scenarioId: z.string().min(1), version: z.number().int().positive(),
  profileId: z.string().min(1), profileVersion: z.number().int().positive(),
  locale: z.enum(['es', 'en']),
});
const ids = z.array(z.string().min(1));
const decisionDimension = z.strictObject({
  status: z.literal('scored'), score: z.union([z.literal(0), z.literal(100)]),
  reasonCodes: z.array(z.enum(['stopMismatch', 'restartMismatch', 'disciplineMismatch', 'offenderMismatch'])),
  evidenceIds: ids.min(1),
}).refine((value) => (value.score === 100) === (value.reasonCodes.length === 0),
  'inconsistent decision score');
const observationDimension = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('scored'), score: z.union([z.literal(0), z.literal(40), z.literal(100)]),
    reasonCodes: z.tuple([]), evidenceIds: ids.min(1) }),
  z.strictObject({ status: z.literal('insufficientEvidence'), score: z.null(),
    reasonCodes: z.tuple([z.literal('noEligibleLiveReceipt')]), evidenceIds: z.tuple([]) }),
]);
const publicEvaluationV1 = z.strictObject({
  evaluationVersion: z.literal(1), decisionQuality: decisionDimension,
  observationAndPositioning: observationDimension,
  communication: z.strictObject({ status: z.literal('notApplicable'), score: z.null(),
    reasonCodes: z.tuple([z.literal('noAuthoredCommunicationInput')]), evidenceIds: z.tuple([]) }),
  protocolApplication: z.strictObject({ status: z.literal('notApplicable'), score: z.null(),
    reasonCodes: z.tuple([z.literal('initialMainRefereeNoVar')]), evidenceIds: z.tuple([]) }),
  debriefContentId: z.string().min(1),
});

function hashToken(token: string) {
  return `sha256:${createHash('sha256').update(token).digest('hex')}`;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(Object.is(value, -0) ? 0 : value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(',')}}`;
  throw new Error('invalid pinned scenario content');
}

/** Only the caller's HttpOnly cookie may supply this token. Never expose it in a request body. */
export async function createAnonymousSession(database: PrismaClient) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  const row = await database.anonymousSession.create({ data: { tokenHash: hashToken(token), expiresAt } });
  return { token, ownerId: row.id, expiresAt, cookie: {
    name: 'refview_session', value: token, httpOnly: true as const, secure: true as const,
    sameSite: 'lax' as const, path: '/' as const, maxAge: sessionLifetimeMs / 1000,
  } };
}

export async function resolveAnonymousOwner(database: PrismaClient, token: string): Promise<string | null> {
  if (!tokenPattern.test(token)) return null;
  const owner = await database.anonymousSession.findUnique({ where: { tokenHash: hashToken(token) },
    select: { id: true, expiresAt: true } });
  return owner && owner.expiresAt.getTime() > Date.now() ? owner.id : null;
}

type Transaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

async function requireOwnerInTransaction(tx: Transaction, token: string): Promise<string> {
  if (!tokenPattern.test(token)) throw new Error('anonymous owner unavailable');
  const [owner] = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "AnonymousSession"
    WHERE "tokenHash" = ${hashToken(token)} AND "expiresAt" > NOW() FOR SHARE
  `;
  if (!owner) throw new Error('anonymous owner unavailable');
  return owner.id;
}

/** Locks publication so review retirement and new attempt creation cannot cross. */
export async function createMainRefereeAttempt(database: PrismaClient, token: string, input: unknown) {
  const requested = createInput.parse(input);
  return database.$transaction(async (tx) => {
    const [target] = await tx.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    if (!target?.name.endsWith('_test')) throw new Error('legacy synthetic attempts are test-only');
    const ownerId = await requireOwnerInTransaction(tx, token);
    const [publication] = await tx.$queryRaw<Array<{ state: 'draft' | 'reviewed' | 'retired' }>>`
      SELECT "state" FROM "ScenarioPublication"
      WHERE "scenarioId" = ${requested.scenarioId} AND "scenarioVersion" = ${requested.version}
      FOR UPDATE
    `;
    if (publication?.state !== 'reviewed') throw new Error('scenario is not reviewed');
    const scenario = await tx.scenarioVersion.findUniqueOrThrow({ where: { scenarioId_version: {
      scenarioId: requested.scenarioId, version: requested.version } },
      select: { competitionProfileId: true, competitionProfileVersion: true,
        publicContent: true, sourceSchemaVersion: true } });
    if (scenario.sourceSchemaVersion !== 1) throw new Error('authored attempts require verified v2 start');
    if (scenario.competitionProfileId !== requested.profileId
      || scenario.competitionProfileVersion !== requested.profileVersion)
      throw new Error('competition profile mismatch');
    publicGate.parse(scenario.publicContent);
    const planRow = await tx.sessionPlan.create({ data: {
      ownerId, competitionProfileId: requested.profileId,
      competitionProfileVersion: requested.profileVersion,
      seed: randomUUID(), locale: requested.locale, role: 'mainReferee',
    } });
    const item = await tx.sessionPlanItem.create({ data: {
      planId: planRow.id, ownerId, order: 0, scenarioId: requested.scenarioId,
      scenarioVersion: requested.version,
    } });
    const attempt = await tx.attempt.create({ data: {
      ownerId, planItemId: item.id, locale: requested.locale, role: 'mainReferee',
    } });
    return { plan: { ...planRow, items: [item] }, attempt };
  });
}

async function lockedAttempt(tx: Transaction,
  ownerId: string, attemptId: string) {
  const [row] = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Attempt" WHERE "id" = ${attemptId} AND "ownerId" = ${ownerId} FOR UPDATE
  `;
  if (!row) throw new Error('attempt owner mismatch');
  return tx.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: {
    planItem: { include: { scenario: true } },
  } });
}

/** Client may choose bounded display preferences, never authored ground position or look. */
export async function startAttemptRun(database: PrismaClient, token: string, attemptId: string,
  expectedRevision: number, cameraPreferences: unknown) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('invalid revision');
  const preferences = camera.parse(cameraPreferences);
  return database.$transaction(async (tx) => {
    const ownerId = await requireOwnerInTransaction(tx, token);
    const attempt = await lockedAttempt(tx, ownerId, attemptId);
    if (attempt.runRevision !== expectedRevision) throw new Error('stale run revision');
    if (attempt.state !== 'ready') throw new Error('attempt is not ready');
    const scenario = attempt.planItem.scenario;
    const challenge = publicGate.parse(scenario.publicContent);
    if (attempt.role !== challenge.role || attempt.role !== 'mainReferee') throw new Error('role mismatch');
    const source = z.object({ initialRefereePose: pose }).parse(scenario.privateContent);
    const initialPose = source.initialRefereePose;
    if (Math.abs(initialPose.position.x) > challenge.field.widthM / 2
      || Math.abs(initialPose.position.z) > challenge.field.lengthM / 2)
      throw new Error('initial referee pose outside field');
    const initialView = { tick: 0, refereePosition: initialPose.position,
      lookYaw: initialPose.yawRad, lookPitch: initialPose.pitchRad ?? 0,
      cameraMode: preferences.mode, cameraDistanceM: preferences.distanceM,
      cameraLateralOffsetM: preferences.lateralOffsetM,
      viewportAspectRatio: preferences.viewportAspect, verticalFovRad: preferences.verticalFovRad };
    const runStart = await tx.attemptRunStart.create({ data: {
      attemptId, runRevision: attempt.runRevision, scenarioContentHash: scenario.contentHash,
      role: 'mainReferee', initialView,
      traceVersion: 1, visibilityModelVersion: 1, cameraRigVersion: 1,
      eyeCalibrationVersion: 1, observationRubricVersion: 1,
    } });
    await tx.attempt.update({ where: { id: attemptId }, data: {
      state: 'playing', lastSafeTick: 0, startedAt: attempt.startedAt ?? new Date(),
    } });
    return runStart;
  });
}

/** The server receives a trusted live-play tick; this marker is required by finalization. */
export async function enterDeciding(database: PrismaClient, token: string, attemptId: string,
  expectedRevision: number, decisionTick: number) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0
    || !Number.isSafeInteger(decisionTick) || decisionTick < 0) throw new Error('invalid tick or revision');
  return database.$transaction(async (tx) => {
    const ownerId = await requireOwnerInTransaction(tx, token);
    const attempt = await lockedAttempt(tx, ownerId, attemptId);
    if (attempt.state !== 'playing' || attempt.runRevision !== expectedRevision)
      throw new Error('run is not active at expected revision');
    const challenge = publicGate.parse(attempt.planItem.scenario.publicContent);
    const gate = challenge.decisionGate;
    if (decisionTick < gate.opensAtTick || decisionTick > gate.closesAtTick
      || decisionTick > gate.forcePauseAtTick || decisionTick > challenge.durationTicks)
      throw new Error('decision tick is outside gate');
    return tx.attempt.update({ where: { id: attemptId }, data: {
      state: 'deciding', lastSafeTick: decisionTick,
      decidingTick: decisionTick, decidingRunRevision: expectedRevision,
    } });
  });
}

/** Active reload discards the uncommitted run and restarts at canonical tick zero. */
export async function recoverAttempt(database: PrismaClient, token: string, attemptId: string,
  expectedRevision: number) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('invalid revision');
  return database.$transaction(async (tx) => {
    const ownerId = await requireOwnerInTransaction(tx, token);
    const attempt = await lockedAttempt(tx, ownerId, attemptId);
    if (attempt.runRevision !== expectedRevision || !['playing', 'deciding'].includes(attempt.state))
      throw new Error('stale or inactive recovery');
    return tx.attempt.update({ where: { id: attemptId }, data: {
      state: 'ready', runRevision: { increment: 1 }, lastSafeTick: 0,
      decidingTick: null, decidingRunRevision: null,
    } });
  });
}

/** Owner-bound recovery view; no private scenario content or token hash is returned. */
export async function restoreAttempt(database: PrismaClient, token: string, attemptId: string) {
  return database.$transaction(async (tx) => {
    const ownerId = await requireOwnerInTransaction(tx, token);
    const attempt = await tx.attempt.findFirst({ where: { id: attemptId, ownerId },
      select: { id: true, state: true, runRevision: true, lastSafeTick: true, decidingTick: true,
        locale: true, role: true, finalizedAt: true,
        planItem: { select: { scenarioId: true, scenarioVersion: true,
          scenario: { select: { contentHash: true, lawsEdition: true,
            competitionProfileId: true, publicContent: true, privateContent: true } } } },
        evaluation: { select: { id: true, result: true, evaluationVersion: true, decisionId: true } },
        decisions: { where: { kind: 'initial' }, select: { id: true, decisionTick: true,
          stopPlay: true, restart: true, discipline: true, offenderActorId: true } },
      } });
    if (!attempt) throw new Error('attempt owner mismatch');
    const { planItem, ...safeAttempt } = attempt;
    const scenarioRef = {
      scenarioId: planItem.scenarioId, version: planItem.scenarioVersion,
      contentHash: planItem.scenario.contentHash,
    };
    if (attempt.state !== 'debrief' && attempt.state !== 'completed') {
      const { evaluation: _evaluation, decisions: _decisions, ...activeAttempt } = safeAttempt;
      void _evaluation; void _decisions;
      return { attempt: { ...activeAttempt, evaluation: null, decisions: [] }, scenarioRef,
        durableResult: null };
    }
    if (!attempt.finalizedAt || !attempt.evaluation || attempt.decisions.length !== 1)
      throw new Error('incomplete finalized attempt');
    const pinned = planItem.scenario;
    const privateContent = z.object({ scenarioInput: z.unknown() }).parse(pinned.privateContent);
    const source = privateContent.scenarioInput as ScenarioInput;
    if (deriveScenarioContentHash(source) !== pinned.contentHash) throw new Error('scenario source hash mismatch');
    const scenario = createScenario(source, { ref: {
      scenarioId: planItem.scenarioId, version: planItem.scenarioVersion,
    }, contentHash: pinned.contentHash });
    if (source.competitionProfileId !== pinned.competitionProfileId
      || source.lawsEdition !== pinned.lawsEdition
      || stableJson(scenario.playable('mainReferee')) !== stableJson(pinned.publicContent))
      throw new Error('pinned scenario projection mismatch');
    const decision = attempt.decisions[0]!;
    if (attempt.evaluation.decisionId !== decision.id) throw new Error('evaluation decision mismatch');
    const result = publicEvaluationV1.parse(attempt.evaluation.result);
    if (attempt.evaluation.evaluationVersion !== result.evaluationVersion
      || result.debriefContentId !== source.privateReview.rubric.debriefContentId)
      throw new Error('evaluation source mismatch');
    const trace = await tx.observationTrace.findUnique({ where: { attemptId: attempt.id } });
    if (!trace || trace.runRevision !== attempt.runRevision || trace.traceVersion !== 1)
      throw new Error('missing current observation trace');
    const tracePayload = z.object({ scenarioRef: z.object({ scenarioId: z.string(), version: z.number() }),
      scenarioContentHash: z.string(), attemptId: z.string(), runRevision: z.number(),
      stopTick: z.number() }).parse(trace.payload);
    if (tracePayload.scenarioRef.scenarioId !== scenarioRef.scenarioId
      || tracePayload.scenarioRef.version !== scenarioRef.version
      || tracePayload.scenarioContentHash !== scenarioRef.contentHash
      || tracePayload.attemptId !== attempt.id || tracePayload.runRevision !== attempt.runRevision
      || tracePayload.stopTick !== decision.decisionTick)
      throw new Error('observation trace identity mismatch');
    const decisionPayload = { decisionTick: decision.decisionTick, stopPlay: decision.stopPlay,
      restart: decision.restart, discipline: decision.discipline,
      offenderActorId: decision.offenderActorId };
    const expectedDigest = `sha256:${createHash('sha256').update(stableJson({
      scenarioRef: { scenarioId: scenarioRef.scenarioId, version: scenarioRef.version },
      scenarioContentHash: scenarioRef.contentHash, attemptId: attempt.id,
      runRevision: attempt.runRevision, decision: decisionPayload, trace: trace.payload,
    })).digest('hex')}`;
    const claims = await tx.finalizationClaim.findMany({ where: { ownerId, attemptId: attempt.id,
      decisionId: decision.id }, select: { payloadDigest: true } });
    if (claims.length === 0) throw new Error('missing finalization claim');
    if (!claims.some((claim) => claim.payloadDigest === expectedDigest))
      throw new Error('finalization claim digest mismatch');
    const { offenderActorId, ...publicFields } = decision;
    const offenderActorHandle = offenderActorId === null ? null : scenario.publicActorHandle(offenderActorId);
    const normalized = normalizeDecision({ decisionTick: decision.decisionTick,
      stopPlay: decision.stopPlay, restart: decision.restart, discipline: decision.discipline,
      offenderActorHandle }, { decisionGate: scenario.playable('mainReferee').decisionGate,
      decidingTick: attempt.decidingTick ?? -1, traceStopTick: tracePayload.stopTick,
      canonicalActorIds: scenario.timeline.snapshot(0).actors.map((actor) => actor.actorId),
      resolveActorHandle: scenario.resolveActorHandle });
    if (stableJson(normalized) !== stableJson(decisionPayload)) throw new Error('decision source mismatch');
    const rubric = source.privateReview.rubric as ClearPenaltyMainRefereeRubricV1;
    const recomputed = evaluateClearPenaltyMainRefereeV1(normalized, {
      rubric, canonicalActorIds: scenario.timeline.snapshot(0).actors.map((actor) => actor.actorId),
      privateEvidenceIds: source.privateReview.evidence.map((entry) => entry.evidenceId as string),
      preparedDebriefContentIds: [rubric.debriefContentId],
      observationSummary: trace.summary as unknown as TrustedObservationSummaryV1,
    });
    if (stableJson(result) !== stableJson(recomputed)) throw new Error('evaluation source mismatch');
    const publicDecision = { ...publicFields, offenderActorHandle };
    return { attempt: { ...safeAttempt, evaluation: {
      id: attempt.evaluation.id, evaluationVersion: 1, result: recomputed,
    }, decisions: [publicDecision] }, scenarioRef,
      durableResult: { attemptId: attempt.id, runRevision: attempt.runRevision,
        decisionId: decision.id, evaluationId: attempt.evaluation.id,
        finalizedAt: attempt.finalizedAt.toISOString() } };
  });
}
