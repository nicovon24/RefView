import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { openTestDatabase } from './connection';
import { createCompetitionProfile, createDraftScenarioVersion, transitionScenarioPublication } from './publication';
import { createAnonymousSession, resolveAnonymousOwner, createMainRefereeAttempt, startAttemptRun,
  enterDeciding, recoverAttempt, restoreAttempt } from './attempt-lifecycle';

const db = openTestDatabase();
afterAll(async () => db.$disconnect());

async function fixture(state: 'draft' | 'reviewed' | 'retired' = 'reviewed',
  options: { durationTicks?: number; position?: { x: number; y: number; z: number } } = {}) {
  const id = randomUUID();
  const durationTicks = options.durationTicks ?? 2;
  const profileId = `synthetic-profile-${id}`;
  const scenarioId = `synthetic-scenario-${id}`;
  const contentHash = `sha256:${'a'.repeat(64)}`;
  await createCompetitionProfile(db, { profileId, version: 1,
    contentHash: `sha256:${'b'.repeat(64)}`, settings: { synthetic: true } });
  await createDraftScenarioVersion(db, { profileId, profileVersion: 1, scenarioId, version: 1,
    contentHash, lawsEdition: 'IFAB-2026-27', sourceReferences: [{ synthetic: true }],
    publicContent: { ref: { scenarioId, version: 1 }, contentHash,
      field: { lengthM: 105, widthM: 68, goalWidthM: 7.32, penaltyAreaDepthM: 16.5,
        penaltyAreaExtraWidthEachSideM: 16.5, lineWidthM: 0.12, attackDirection: 'positiveZ' },
      durationTicks, tickRateHz: 60,
      decisionGate: { opensAtTick: 1, closesAtTick: durationTicks, forcePauseAtTick: durationTicks },
      role: 'mainReferee', actors: Array.from({ length: durationTicks + 1 }, (_, tick) => ({ tick, actors: [] })),
      ball: Array.from({ length: durationTicks + 1 }, (_, tick) => ({ tick, ball: { position: { x: 0, y: 0, z: 0 },
        orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })),
      cues: [], decisionOptions: [], lawsEdition: 'IFAB-2026-27' },
    privateContent: { initialRefereePose: { position: options.position ?? { x: 4, y: 0, z: -8 }, yawRad: 0.5 } },
  });
  if (state !== 'draft') await transitionScenarioPublication(db, { scenarioId, version: 1,
    expectedRevision: 0, nextState: 'reviewed', reviewRecordId: `synthetic-${id}`,
    actor: 'synthetic-test', reason: 'Synthetic test only' });
  if (state === 'retired') await transitionScenarioPublication(db, { scenarioId, version: 1,
    expectedRevision: 1, nextState: 'retired', actor: 'synthetic-test', reason: 'Synthetic retirement' });
  return { profileId, scenarioId, contentHash };
}

const view = { mode: 'thirdPerson' as const, distanceM: 5, lateralOffsetM: 0,
  verticalFovRad: 1.1, viewportAspect: 16 / 9 };

describe('anonymous attempt lifecycle against isolated PostgreSQL', () => {
  it('stores only a hash and rejects wrong or expired owner', async () => {
    const session = await createAnonymousSession(db);
    expect(session.token).toMatch(/^[a-f0-9]{64}$/);
    expect(session.ownerId).not.toBe(session.token);
    const row = await db.anonymousSession.findUniqueOrThrow({ where: { id: session.ownerId } });
    expect(row.tokenHash).toBe(`sha256:${createHash('sha256').update(session.token).digest('hex')}`);
    expect(JSON.stringify(row)).not.toContain(session.token);
    expect(await resolveAnonymousOwner(db, session.token)).toBe(session.ownerId);
    expect(await resolveAnonymousOwner(db, 'f'.repeat(64))).toBeNull();
    await db.anonymousSession.update({ where: { id: session.ownerId }, data: {
      createdAt: new Date(Date.now() - 9 * 86400000),
      expiresAt: new Date(Date.now() - 2 * 86400000),
    } });
    expect(await resolveAnonymousOwner(db, session.token)).toBeNull();
  });

  it('creates only reviewed matching-profile one-item plans; retirement preserves pinned attempt', async () => {
    const owner = await createAnonymousSession(db);
    const draft = await fixture('draft');
    await expect(createMainRefereeAttempt(db, owner.token, { scenarioId: draft.scenarioId,
      version: 1, profileId: draft.profileId, profileVersion: 1, locale: 'es' })).rejects.toThrow();
    const reviewed = await fixture();
    await expect(createMainRefereeAttempt(db, owner.token, { scenarioId: reviewed.scenarioId,
      version: 1, profileId: draft.profileId, profileVersion: 1, locale: 'es' })).rejects.toThrow();
    const created = await createMainRefereeAttempt(db, owner.token, { scenarioId: reviewed.scenarioId,
      version: 1, profileId: reviewed.profileId, profileVersion: 1, locale: 'es' });
    expect(created.attempt.state).toBe('ready');
    expect(created.plan.items).toHaveLength(1);
    expect(created.plan.items[0]).toMatchObject({ scenarioId: reviewed.scenarioId,
      scenarioVersion: 1, order: 0 });
    await transitionScenarioPublication(db, { scenarioId: reviewed.scenarioId, version: 1,
      expectedRevision: 1, nextState: 'retired', actor: 'synthetic-test', reason: 'Retire' });
    await expect(createMainRefereeAttempt(db, owner.token, { scenarioId: reviewed.scenarioId,
      version: 1, profileId: reviewed.profileId, profileVersion: 1, locale: 'es' })).rejects.toThrow();
    expect((await restoreAttempt(db, owner.token, created.attempt.id))?.scenarioRef).toEqual({
      scenarioId: reviewed.scenarioId, version: 1, contentHash: reviewed.contentHash });
    expect((await startAttemptRun(db, owner.token, created.attempt.id, 0, view)).scenarioContentHash)
      .toBe(reviewed.contentHash);
    await expect(restoreAttempt(db, 'f'.repeat(64), created.attempt.id)).rejects.toThrow();
    await db.anonymousSession.update({ where: { id: owner.ownerId }, data: {
      createdAt: new Date(Date.now() - 9 * 86400000),
      expiresAt: new Date(Date.now() - 2 * 86400000),
    } });
    await expect(restoreAttempt(db, owner.token, created.attempt.id)).rejects.toThrow(/owner unavailable/);
    await expect(recoverAttempt(db, owner.token, created.attempt.id, 0)).rejects.toThrow(/owner unavailable/);
    await expect(createMainRefereeAttempt(db, owner.token, { scenarioId: draft.scenarioId,
      version: 1, profileId: draft.profileId, profileVersion: 1, locale: 'es' })).rejects.toThrow(/owner unavailable/);
  });

  it('pins server pose, guards run uniqueness and deciding tick, recovers only once per revision', async () => {
    const owner = await createAnonymousSession(db);
    const scenario = await fixture();
    const { attempt } = await createMainRefereeAttempt(db, owner.token, { scenarioId: scenario.scenarioId,
      version: 1, profileId: scenario.profileId, profileVersion: 1, locale: 'en' });
    const otherOwner = await createAnonymousSession(db);
    await expect(startAttemptRun(db, otherOwner.token, attempt.id, 0, view)).rejects.toThrow();
    await expect(startAttemptRun(db, owner.token, attempt.id, 0, {
      ...view, position: { x: 99, y: 0, z: 99 },
    })).rejects.toThrow();
    for (const invalidView of [
      { ...view, lateralOffsetM: 3.1 }, { ...view, viewportAspect: 0.74 },
      { ...view, verticalFovRad: 1.32 },
    ]) await expect(startAttemptRun(db, owner.token, attempt.id, 0, invalidView)).rejects.toThrow();
    const started = await startAttemptRun(db, owner.token, attempt.id, 0, view);
    expect(started.runRevision).toBe(0);
    expect(started.initialView).toEqual({ tick: 0,
      refereePosition: { x: 4, y: 0, z: -8 }, lookYaw: 0.5, lookPitch: 0,
      cameraMode: 'thirdPerson', cameraDistanceM: 5, cameraLateralOffsetM: 0,
      viewportAspectRatio: 16 / 9, verticalFovRad: 1.1 });
    expect(await db.attemptRunStart.count({ where: { attemptId: attempt.id } })).toBe(1);
    await expect(startAttemptRun(db, owner.token, attempt.id, 0, view)).rejects.toThrow();
    await expect(enterDeciding(db, owner.token, attempt.id, 0, 0)).rejects.toThrow();
    await enterDeciding(db, owner.token, attempt.id, 0, 1);
    await expect(enterDeciding(db, owner.token, attempt.id, 0, 1)).rejects.toThrow();
    const recovered = await recoverAttempt(db, owner.token, attempt.id, 0);
    expect(recovered).toMatchObject({ state: 'ready', runRevision: 1,
      lastSafeTick: 0, decidingTick: null, decidingRunRevision: null });
    await expect(recoverAttempt(db, owner.token, attempt.id, 0)).rejects.toThrow();
    expect((await restoreAttempt(db, owner.token, attempt.id))?.attempt.runRevision).toBe(1);
    await expect(startAttemptRun(db, owner.token, attempt.id, 0, view)).rejects.toThrow(/stale/);
    const restarted = await startAttemptRun(db, owner.token, attempt.id, 1, view);
    expect(restarted.runRevision).toBe(1);
    expect(await db.attemptRunStart.count({ where: { attemptId: attempt.id } })).toBe(2);
    await enterDeciding(db, owner.token, attempt.id, 1, 2);
    const decision = await db.decision.create({ data: { attemptId: attempt.id, kind: 'initial',
      decisionTick: 2, stopPlay: true, restart: 'penaltyKick', discipline: 'none' } });
    await db.evaluation.create({ data: { attemptId: attempt.id, decisionId: decision.id,
      evaluationVersion: 1, observationRubricVersion: 1, result: { synthetic: 'result' } } });
    await db.attempt.update({ where: { id: attempt.id }, data: { state: 'debrief', finalizedAt: new Date() } });
    await expect(restoreAttempt(db, owner.token, attempt.id)).rejects.toThrow();
    await db.attempt.update({ where: { id: attempt.id }, data: { state: 'completed' } });
    await expect(restoreAttempt(db, owner.token, attempt.id)).rejects.toThrow();
    await expect(restoreAttempt(db, otherOwner.token, attempt.id)).rejects.toThrow();
  });

  it('rejects invalid trusted spawn and an incident exceeding the bounded trace duration', async () => {
    const owner = await createAnonymousSession(db);
    for (const options of [
      { position: { x: 4, y: 1, z: -8 } },
      { position: { x: 40, y: 0, z: -8 } },
      { durationTicks: 481 },
    ]) {
      const scenario = await fixture('reviewed', options);
      if (options.durationTicks) {
        await expect(createMainRefereeAttempt(db, owner.token, { scenarioId: scenario.scenarioId,
          version: 1, profileId: scenario.profileId, profileVersion: 1, locale: 'es' })).rejects.toThrow();
      } else {
        const { attempt } = await createMainRefereeAttempt(db, owner.token, { scenarioId: scenario.scenarioId,
          version: 1, profileId: scenario.profileId, profileVersion: 1, locale: 'es' });
        await expect(startAttemptRun(db, owner.token, attempt.id, 0, view)).rejects.toThrow();
      }
    }
  });
});
