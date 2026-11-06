import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { deriveScenarioContentHash, createScenario, type ScenarioInput } from '@refview/domain';
import { openTestDatabase } from './connection';
import { createAnonymousSession, createMainRefereeAttempt, startAttemptRun, enterDeciding,
  restoreAttempt } from './attempt-lifecycle';
import { finalizeInitialDecision } from './finalization';
import { transitionScenarioPublication } from './publication';
import type { Prisma } from '../../generated/prisma/client';

const db = openTestDatabase();
afterAll(async () => db.$disconnect());
const field = { lengthM: 105, widthM: 68, goalWidthM: 7.32, penaltyAreaDepthM: 16.5,
  penaltyAreaExtraWidthEachSideM: 16.5, lineWidthM: 0.12, attackDirection: 'positiveZ' } as const;
let scenarioNumber = 900;
const choices = [
  { optionId: 'opt-001', kind: 'stopPlay', value: false }, { optionId: 'opt-002', kind: 'stopPlay', value: true },
  ...(['playOn', 'directFreeKick', 'indirectFreeKick', 'droppedBall', 'penaltyKick'] as const)
    .map((value, index) => ({ optionId: `opt-00${index + 3}`, kind: 'restart', value })),
  ...(['none', 'yellow', 'red'] as const).map((value, index) =>
    ({ optionId: `opt-${String(index + 8).padStart(3, '0')}`, kind: 'discipline', value })),
] as ScenarioInput['decisionOptions'];

async function readyFixture(options: { invalidRubric?: boolean; geometryMismatch?: 'window' | 'anchors' | 'occluders';
  debriefMismatch?: boolean; colliderMismatch?: boolean; spawnMismatch?: boolean } = {}) {
  const unique = randomUUID().replaceAll('-', '').slice(0, 12);
  const ref = { scenarioId: `incident-${scenarioNumber--}`, version: Date.now() % 1_000_000_000 + scenarioNumber };
  const profileId = `synthetic-${unique}`;
  const rubric = { evaluationVersion: 1, classification: 'clear', role: 'mainReferee',
    decision: { mode: 'exactSemanticMatch', expected: { stopPlay: true, restart: 'penaltyKick',
      discipline: 'none', offenderActorId: 'defence-04' }, allowUnspecifiedOffenderWhenNoCard: true,
      evidenceIds: ['contact'] },
    observation: { observationRubricVersion: 1, requiredEvidenceIds: ['contact'] },
    communication: { mode: 'notApplicable', reason: 'noAuthoredCommunicationInput' },
    protocol: { mode: 'notApplicable', reason: 'initialMainRefereeNoVar' },
    debriefContentId: 'synthetic-debrief' };
  const pinnedRubric = options.invalidRubric ? { ...rubric, debriefContentId: 'missing-debrief' } : rubric;
  const canonicalEvidence = [{ evidenceId: 'contact', fromTick: 0, toTick: 4,
    requiredAnchorIds: ['foot'], samples: Array.from({ length: 5 }, (_, tick) => ({ tick,
      anchors: [{ anchorId: 'foot', position: { x: 0, y: 1.7, z: 10 } }], occluders: [] })) }];
  const canonicalSpawn = { position: { x: 0, y: 0, z: 0 }, yawRad: 0 };
  const source: ScenarioInput = { schemaVersion: 1, ref, contentHash: `sha256:${'a'.repeat(64)}`,
    classification: 'clear', lawsEdition: 'IFAB-2026-27', competitionProfileId: profileId,
    field, decisionGate: { opensAtTick: 1, closesAtTick: 4, forcePauseAtTick: 4 },
    supportedRoles: ['mainReferee'],
    timeline: { ref, durationTicks: 4, samples: Array.from({ length: 5 }, (_, tick) => ({ tick,
      actors: [{ actorId: 'defence-04', position: { x: 0, y: 0, z: 10 }, yawRad: 0,
        clipId: 'synthetic-run', phaseQ: 0 }],
      ball: { position: { x: 0, y: 0, z: 10 }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })),
      events: [] }, cues: [], decisionOptions: choices, assetRegistry: [{ assetId: 'synthetic-run',
        fingerprint: `sha256:${'1'.repeat(64)}`, licenseRef: 'original-refview' }],
    privateReview: { facts: { initialRefereePose: canonicalSpawn }, evidence: canonicalEvidence,
      rubric: pinnedRubric } };
  source.contentHash = deriveScenarioContentHash(source);
  const scenario = createScenario(source, { ref, contentHash: source.contentHash });
  const observationFixtureInput = { ref, scenarioContentHash: source.contentHash, durationTicks: 4,
    visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
    cameraColliders: options.colliderMismatch ? [{ boxId: 'collider',
      min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 2, z: 1 } }] : [],
    evidence: options.geometryMismatch === 'window'
      ? [{ ...canonicalEvidence[0]!, fromTick: 1, samples: canonicalEvidence[0]!.samples.slice(1) }]
      : options.geometryMismatch === 'anchors'
        ? [{ ...canonicalEvidence[0]!, samples: canonicalEvidence[0]!.samples.map((sample) => ({ ...sample,
          anchors: [{ anchorId: 'foot', position: { x: 2, y: 1.7, z: 10 } }] })) }]
        : options.geometryMismatch === 'occluders'
          ? [{ ...canonicalEvidence[0]!, samples: canonicalEvidence[0]!.samples.map((sample) => ({ ...sample,
            occluders: [{ boxId: 'shifted', min: { x: 20, y: 0, z: 20 }, max: { x: 21, y: 2, z: 21 } }] })) }]
          : canonicalEvidence };
  await db.competitionProfile.create({ data: { profileId, version: 1,
    contentHash: `sha256:${'b'.repeat(64)}`, settings: { synthetic: true } } });
  await db.scenarioVersion.create({ data: { scenarioId: ref.scenarioId, version: ref.version,
    contentHash: source.contentHash, lawsEdition: source.lawsEdition, sourceReferences: [{ synthetic: true }],
    publicContent: scenario.playable('mainReferee'),
    privateContent: { initialRefereePose: options.spawnMismatch
      ? { position: { x: 3, y: 0, z: 0 }, yawRad: 0 } : canonicalSpawn,
      scenarioInput: source, observationFixtureInput, rubric: pinnedRubric,
      preparedDebriefContentIds: options.debriefMismatch
        ? ['synthetic-debrief', 'unhashed-extra'] : ['synthetic-debrief'] } as unknown as Prisma.InputJsonValue,
    competitionProfileId: profileId, competitionProfileVersion: 1 } });
  await db.scenarioPublication.create({ data: { scenarioId: ref.scenarioId, scenarioVersion: ref.version } });
  await transitionScenarioPublication(db, { scenarioId: ref.scenarioId, version: ref.version,
    expectedRevision: 0, nextState: 'reviewed', reviewRecordId: `synthetic-${unique}`,
    actor: 'synthetic-test', reason: 'Synthetic finalization test' });
  const owner = await createAnonymousSession(db);
  const { attempt } = await createMainRefereeAttempt(db, owner.token, { scenarioId: ref.scenarioId,
    version: ref.version, profileId, profileVersion: 1, locale: 'es' });
  const run = await startAttemptRun(db, owner.token, attempt.id, 0, { mode: 'firstPerson', distanceM: 4,
    lateralOffsetM: 0, verticalFovRad: 1, viewportAspect: 1.5 });
  await enterDeciding(db, owner.token, attempt.id, 0, 4);
  const trace = { scenarioRef: ref, scenarioContentHash: source.contentHash, attemptId: attempt.id,
    runRevision: 0, traceVersion: 1, visibilityModelVersion: 1, cameraRigVersion: 1,
    eyeCalibrationVersion: 1, observationRubricVersion: 1, role: 'mainReferee', stopTick: 4,
    views: Array.from({ length: 5 }, (_, tick) => ({ tick, epoch: 0, sprint: false,
      view: { ...run.initialView as object, tick } })),
    renderReceipts: [0, 2, 4].map((tick, index) => ({ sequence: index + 1,
      tick, epoch: 0, source: 'live', workflowState: 'playing', documentVisible: true,
      pointerLocked: true, paused: false })),
    breaks: [{ sequence: 4, afterTick: 4, nextEpoch: null, reason: 'deciding' }] };
  const payload = { attemptId: attempt.id, idempotencyKey: 'first',
    decision: { decisionTick: 4, stopPlay: true, restart: 'penaltyKick', discipline: 'none',
      offenderActorHandle: 'actor-001' }, trace };
  return { owner, attempt, payload };
}

describe('transactional initial finalization on isolated PostgreSQL', () => {
  it('rejects wrong owner, untrusted fields and summary without writes', async () => {
    const f = await readyFixture();
    const other = await createAnonymousSession(db);
    await expect(finalizeInitialDecision(db, other.token, f.payload)).rejects.toThrow(/owner mismatch/);
    await expect(finalizeInitialDecision(db, f.owner.token, { ...f.payload,
      summary: { score: 100 } })).rejects.toThrow();
    await expect(finalizeInitialDecision(db, f.owner.token, { ...f.payload,
      trace: { ...f.payload.trace, summary: { score: 100 } } })).rejects.toThrow();
    expect(await db.decision.count({ where: { attemptId: f.attempt.id } })).toBe(0);
  });

  it('commits one result, aliases same payload, and rejects conflicting payload', async () => {
    const f = await readyFixture();
    const first = await finalizeInitialDecision(db, f.owner.token, f.payload);
    expect(first).toMatchObject({ state: 'debrief', evaluation: {
      decisionQuality: { score: 100 }, observationAndPositioning: { score: 100 } },
      decision: { offenderActorHandle: 'actor-001' } });
    expect(Object.keys(first.decision)).not.toContain('offenderActorId');
    expect(JSON.stringify(first)).not.toContain('defence-04');
    expect(first.durableResult).toMatchObject({ attemptId: f.attempt.id, runRevision: 0,
      decisionId: first.decision.id, evaluationId: expect.any(String), finalizedAt: expect.any(String) });
    expect(Number.isNaN(Date.parse(first.durableResult.finalizedAt))).toBe(false);
    const again = await finalizeInitialDecision(db, f.owner.token, f.payload);
    expect(again.decision.id).toBe(first.decision.id);
    expect(again.durableResult).toEqual(first.durableResult);
    const alias = await finalizeInitialDecision(db, f.owner.token, { ...f.payload, idempotencyKey: 'second' });
    expect(alias.decision.id).toBe(first.decision.id);
    expect(alias.durableResult).toEqual(first.durableResult);
    await expect(finalizeInitialDecision(db, f.owner.token, { ...f.payload,
      decision: { ...f.payload.decision, restart: 'directFreeKick' } })).rejects.toThrow();
    expect(await db.decision.count({ where: { attemptId: f.attempt.id } })).toBe(1);
    expect(await db.finalizationClaim.count({ where: { attemptId: f.attempt.id } })).toBe(2);
    const restored = await restoreAttempt(db, f.owner.token, f.attempt.id);
    expect(restored.attempt).toMatchObject({ state: 'debrief', decisions: [{
      id: first.decision.id, offenderActorHandle: 'actor-001',
      decisionTick: 4, stopPlay: true, restart: 'penaltyKick', discipline: 'none',
    }] });
    expect(restored.durableResult).toEqual(first.durableResult);
    expect(JSON.stringify(restored)).not.toContain('defence-04');
    expect(JSON.stringify(restored)).not.toContain('scenarioInput');
    expect(JSON.stringify(restored)).not.toContain(f.owner.token);
  });

  it('accepts a structurally valid wrong decision and rolls back invalid private rubric', async () => {
    const f = await readyFixture();
    const wrong = await finalizeInitialDecision(db, f.owner.token, { ...f.payload,
      decision: { decisionTick: 4, stopPlay: false, restart: 'playOn', discipline: 'none',
        offenderActorHandle: null } });
    expect((wrong.evaluation as { decisionQuality: { score: number } }).decisionQuality.score).toBe(0);
    const g = await readyFixture({ invalidRubric: true });
    await expect(finalizeInitialDecision(db, g.owner.token, g.payload)).rejects.toThrow();
    expect(await db.decision.count({ where: { attemptId: g.attempt.id } })).toBe(0);
    expect(await db.finalizationClaim.count({ where: { attemptId: g.attempt.id } })).toBe(0);
    expect(await db.observationTrace.count({ where: { attemptId: g.attempt.id } })).toBe(0);
    expect((await restoreAttempt(db, g.owner.token, g.attempt.id)).attempt.state).toBe('deciding');
  });

  it('serializes concurrent keys and restores a completed durable result', async () => {
    const f = await readyFixture();
    const [a, b] = await Promise.all([
      finalizeInitialDecision(db, f.owner.token, f.payload),
      finalizeInitialDecision(db, f.owner.token, { ...f.payload, idempotencyKey: 'other' }),
    ]);
    expect(a.decision.id).toBe(b.decision.id);
    expect(await db.decision.count({ where: { attemptId: f.attempt.id } })).toBe(1);
    await db.attempt.update({ where: { id: f.attempt.id }, data: { state: 'completed' } });
    const restored = await finalizeInitialDecision(db, f.owner.token, f.payload);
    expect(restored).toMatchObject({ state: 'completed', decision: { id: a.decision.id } });
    expect(restored.durableResult).toEqual(a.durableResult);
    const reloaded = await restoreAttempt(db, f.owner.token, f.attempt.id);
    expect(reloaded.attempt).toMatchObject({ state: 'completed', decisions: [{
      id: a.decision.id, offenderActorHandle: 'actor-001',
    }] });
    expect(reloaded.durableResult).toEqual(a.durableResult);
    const other = await createAnonymousSession(db);
    await expect(restoreAttempt(db, other.token, f.attempt.id)).rejects.toThrow(/owner mismatch/);
    expect(await db.evaluation.count({ where: { attemptId: f.attempt.id } })).toBe(1);
  });

  it('conflicts concurrent distinct keys with different semantic payloads', async () => {
    const f = await readyFixture();
    const outcomes = await Promise.allSettled([
      finalizeInitialDecision(db, f.owner.token, f.payload),
      finalizeInitialDecision(db, f.owner.token, { ...f.payload, idempotencyKey: 'different',
        decision: { decisionTick: 4, stopPlay: false, restart: 'playOn', discipline: 'none',
          offenderActorHandle: null } }),
    ]);
    expect(outcomes.filter((entry) => entry.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((entry) => entry.status === 'rejected')).toHaveLength(1);
    expect(await db.decision.count({ where: { attemptId: f.attempt.id } })).toBe(1);
    expect(await db.finalizationClaim.count({ where: { attemptId: f.attempt.id } })).toBe(1);
  });

  it('rejects geometry, collider, and debrief data not bound to the hashed source', async () => {
    for (const options of [{ geometryMismatch: 'window' as const },
      { geometryMismatch: 'anchors' as const }, { geometryMismatch: 'occluders' as const },
      { colliderMismatch: true },
      { debriefMismatch: true }]) {
      const f = await readyFixture(options);
      await expect(finalizeInitialDecision(db, f.owner.token, f.payload)).rejects.toThrow();
      expect(await db.decision.count({ where: { attemptId: f.attempt.id } })).toBe(0);
    }
  });

  it('rejects a run spawn that differs from the hashed private source fact', async () => {
    const f = await readyFixture({ spawnMismatch: true });
    await expect(finalizeInitialDecision(db, f.owner.token, f.payload)).rejects.toThrow(/spawn|projection/i);
    expect(await db.decision.count({ where: { attemptId: f.attempt.id } })).toBe(0);
    expect((await restoreAttempt(db, f.owner.token, f.attempt.id)).attempt.state).toBe('deciding');
  });

  it('enforces byte cap and rejects expired owner on retry', async () => {
    const f = await readyFixture();
    await expect(finalizeInitialDecision(db, f.owner.token, JSON.stringify({ ...f.payload,
      padding: 'x'.repeat(256 * 1024) }))).rejects.toThrow(/256 KiB/);
    await expect(finalizeInitialDecision(db, f.owner.token, { ...f.payload,
      padding: 'x'.repeat(256 * 1024) })).rejects.toThrow(/256 KiB/);
    await finalizeInitialDecision(db, f.owner.token, f.payload);
    await db.anonymousSession.update({ where: { id: f.owner.ownerId }, data: {
      createdAt: new Date(Date.now() - 9 * 86400000),
      expiresAt: new Date(Date.now() - 2 * 86400000),
    } });
    await expect(finalizeInitialDecision(db, f.owner.token, f.payload)).rejects.toThrow(/owner unavailable/);
    await expect(restoreAttempt(db, f.owner.token, f.attempt.id)).rejects.toThrow(/owner unavailable/);
  });

  it('fails closed on finalized rows without the current trace or matching claim digest', async () => {
    const missingTrace = await readyFixture();
    await finalizeInitialDecision(db, missingTrace.owner.token, missingTrace.payload);
    await db.observationTrace.delete({ where: { attemptId: missingTrace.attempt.id } });
    await expect(restoreAttempt(db, missingTrace.owner.token, missingTrace.attempt.id))
      .rejects.toThrow(/trace/);

    const missingClaim = await readyFixture();
    const result = await finalizeInitialDecision(db, missingClaim.owner.token, missingClaim.payload);
    await db.finalizationClaim.deleteMany({ where: { attemptId: missingClaim.attempt.id } });
    await expect(restoreAttempt(db, missingClaim.owner.token, missingClaim.attempt.id))
      .rejects.toThrow(/claim/);
    await db.finalizationClaim.create({ data: { ownerId: missingClaim.owner.ownerId,
      attemptId: missingClaim.attempt.id, decisionId: result.decision.id,
      idempotencyKey: 'invalid-digest', payloadDigest: `sha256:${'f'.repeat(64)}` } });
    await expect(restoreAttempt(db, missingClaim.owner.token, missingClaim.attempt.id))
      .rejects.toThrow(/digest/);
  });

  it('rejects stored evaluation fields outside the public v1 result contract', async () => {
    const f = await readyFixture();
    await finalizeInitialDecision(db, f.owner.token, f.payload);
    const evaluation = await db.evaluation.delete({ where: { attemptId: f.attempt.id } });
    await db.evaluation.create({ data: { id: evaluation.id, attemptId: f.attempt.id,
      decisionId: evaluation.decisionId, evaluationVersion: 1, observationRubricVersion: 1,
      result: { ...(evaluation.result as object), offenderActorId: 'defence-04' } as Prisma.InputJsonValue } });
    await expect(restoreAttempt(db, f.owner.token, f.attempt.id)).rejects.toThrow(/offenderActorId/);
  });

  it('rejects structurally valid evaluation values that diverge from the pinned source', async () => {
    for (const tamper of [
      (result: Record<string, unknown>) => { (result.decisionQuality as Record<string, unknown>).evidenceIds = ['defence-04']; },
      (result: Record<string, unknown>) => { (result.observationAndPositioning as Record<string, unknown>).score = 40; },
    ]) {
      const f = await readyFixture();
      await finalizeInitialDecision(db, f.owner.token, f.payload);
      const evaluation = await db.evaluation.delete({ where: { attemptId: f.attempt.id } });
      const injected = structuredClone(evaluation.result) as Record<string, unknown>;
      tamper(injected);
      await db.evaluation.create({ data: { id: evaluation.id, attemptId: f.attempt.id,
        decisionId: evaluation.decisionId, evaluationVersion: 1, observationRubricVersion: 1,
        result: injected as Prisma.InputJsonValue } });
      await expect(restoreAttempt(db, f.owner.token, f.attempt.id)).rejects.toThrow(/evaluation/);
    }
  });
});
