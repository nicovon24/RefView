import { randomInt, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../packages/content/src/authored-incident-v2';
import { createDraftAuthoredScenarioV2, createMainRefereeAttemptV2, startAuthoredAttemptRunV2,
  getPinnedAuthoredScenarioV2,
  getReviewedAuthoredScenarioV2 } from './authored-publication-v2';
import { finalizeAuthoredInitialDecisionV2 } from './authored-finalization-v2';
import { restoreAuthoredAttemptV2 } from './authored-restore-v2';
import { openTestDatabase } from './connection';
import { createAnonymousSession, createMainRefereeAttempt, enterDeciding } from './attempt-lifecycle';

const db = openTestDatabase();
afterAll(async () => { await db.$disconnect(); });
const assetNames = new Map([['player-rig', 'asset-001.mjs'],
  ['run-clip', 'asset-002.mjs'], ['trip-clip', 'asset-003.mjs'],
  ['challenge-clip', 'asset-004.mjs']]);
const dependencies = {
  resolveAssetBytes: (assetId: string, path: string) => {
    const filename = assetNames.get(assetId);
    if (!filename || path !== `/assets/${filename}`) return undefined;
    return readFileSync(new URL(`../../../../../packages/content/assets/${filename}`, import.meta.url));
  },
  ...createIncident001GeometryResolverV2(),
};
function source() {
  const value = createIncident001SourceV2();
  const version = randomInt(1_000_000, 2_000_000_000);
  value.ref.version = version;
  value.timeline.ref.version = version;
  return value;
}

describe('authored v2 repository on isolated PostgreSQL', () => {
  it('stores one compiled source and verifies immutable profile, source and caches before pinned reads', async () => {
    const draft = await createDraftAuthoredScenarioV2(db, source(), dependencies);
    const row = await db.scenarioVersion.findUniqueOrThrow({
      where: { scenarioId_version: draft.ref },
    });
    expect(row.sourceSchemaVersion).toBe(2);
    expect(row.canonicalSource).not.toBeNull();
    expect(row.contentHash).toBe(draft.contentHash);
    const pinned = await getPinnedAuthoredScenarioV2(db, draft.ref, dependencies);
    expect(pinned?.contentHash).toBe(draft.contentHash);
    expect(await getReviewedAuthoredScenarioV2(db, draft.ref, dependencies,
      `sha256:${'1'.repeat(64)}`)).toBeNull();
    await expect(db.scenarioVersion.update({ where: { scenarioId_version: draft.ref },
      data: { publicContent: { forged: true } } })).rejects.toThrow();
    const wrongProfile = source();
    wrongProfile.competitionProfile.settings.fieldLengthM = 106;
    await expect(createDraftAuthoredScenarioV2(db, wrongProfile, dependencies)).rejects.toThrow();
  });

  it('requires matching reviewed build and preserves pinned source through retirement', async () => {
    const scenarioSource = source();
    const draft = await createDraftAuthoredScenarioV2(db, scenarioSource, dependencies);
    const reviewId = randomUUID();
    const build = `sha256:${'2'.repeat(64)}`;
    const capture = { reference: 'synthetic-test-capture', sha256: `sha256:${'3'.repeat(64)}` };
    await db.scenarioReviewRecord.create({ data: {
      reviewId, scenarioId: draft.ref.scenarioId, scenarioVersion: draft.ref.version,
      contentHash: draft.contentHash, reviewerPrincipal: 'synthetic-test-reviewer',
      briefApproval: { actor: 'Nicolas', at: 'synthetic-test', evidenceRef: 'synthetic-test' },
      renderedEvidenceApproval: { actor: 'Nicolas', at: 'synthetic-test',
        evidenceRef: 'synthetic-test', sourceHash: draft.contentHash, rendererBuildHash: build },
      captureEvidence: { firstGood: capture, firstPoor: capture, thirdGood: capture, thirdPoor: capture },
      rendererBuildHash: build, sourcesAndLicensesChecked: true,
      observationCalibrationApproved: true,
    } });
    await db.$transaction(async (tx) => {
      await tx.scenarioPublication.update({
        where: { scenarioId_scenarioVersion: { scenarioId: draft.ref.scenarioId,
          scenarioVersion: draft.ref.version } },
        data: { state: 'reviewed', revision: 1, reviewRecordId: reviewId, reviewedAt: new Date() },
      });
      await tx.scenarioPublicationEvent.create({ data: {
        scenarioId: draft.ref.scenarioId, scenarioVersion: draft.ref.version,
        priorState: 'draft', nextState: 'reviewed', priorRevision: 0, nextRevision: 1,
        actor: 'synthetic-test', reason: 'test-only synthetic review',
      } });
    });
    expect((await getReviewedAuthoredScenarioV2(db, draft.ref, dependencies, build))?.contentHash)
      .toBe(draft.contentHash);
    const owner = await createAnonymousSession(db);
    await expect(createMainRefereeAttempt(db, owner.token, {
      scenarioId: draft.ref.scenarioId, version: draft.ref.version,
      profileId: 'senior-standard', profileVersion: 1, locale: 'es',
    })).rejects.toThrow(/verified v2 start/);
    const started = await createMainRefereeAttemptV2(db, owner.token, {
      scenarioId: draft.ref.scenarioId, version: draft.ref.version,
      profileId: 'senior-standard', profileVersion: 1, locale: 'es',
    }, dependencies, build);
    expect(started.attempt.ownerId).toBe(owner.ownerId);
    expect(started.attempt.clientBuild).toBe(build);
    const camera = { mode: 'thirdPerson', distanceM: 4, lateralOffsetM: 0,
      verticalFovRad: 65 * Math.PI / 180, viewportAspect: 2 };
    const stranger = await createAnonymousSession(db);
    await expect(startAuthoredAttemptRunV2(db, stranger.token, started.attempt.id, 0,
      camera, dependencies, build)).rejects.toThrow(/owner/);
    await expect(startAuthoredAttemptRunV2(db, owner.token, started.attempt.id, 0,
      { ...camera, distanceM: 50 }, dependencies, build)).rejects.toThrow();
    await expect(startAuthoredAttemptRunV2(db, owner.token, started.attempt.id, 0,
      camera, dependencies, `sha256:${'4'.repeat(64)}`)).rejects.toThrow(/build/);
    const runStart = await startAuthoredAttemptRunV2(db, owner.token, started.attempt.id, 0,
      camera, dependencies, build);
    expect(runStart.scenarioContentHash).toBe(draft.contentHash);
    expect(runStart.initialView).toMatchObject({ tick: 0,
      refereePosition: scenarioSource.initialRefereePose.position,
      lookYaw: scenarioSource.initialRefereePose.lookYaw,
      lookPitch: scenarioSource.initialRefereePose.lookPitch,
      cameraMode: 'thirdPerson', cameraDistanceM: 4 });
    await expect(startAuthoredAttemptRunV2(db, owner.token, started.attempt.id, 0,
      camera, dependencies, build)).rejects.toThrow(/not ready/);
    await enterDeciding(db, owner.token, started.attempt.id, 0, 366);
    const trace = { scenarioRef: draft.ref, scenarioContentHash: draft.contentHash,
      attemptId: started.attempt.id, runRevision: 0, traceVersion: 1,
      visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
      observationRubricVersion: 1, role: 'mainReferee', stopTick: 366,
      views: Array.from({ length: 367 }, (_, tick) => ({ tick, epoch: 0, sprint: false,
        view: { ...(runStart.initialView as object), tick } })),
      renderReceipts: [], breaks: [{ sequence: 0, afterTick: 366,
        nextEpoch: null, reason: 'deciding' }] };
    const payload = { attemptId: started.attempt.id, idempotencyKey: 'first', trace,
      decision: { decisionTick: 366, stopPlay: true, restart: 'penaltyKick',
        discipline: 'none', offenderActorHandle: null } };
    const finished = await finalizeAuthoredInitialDecisionV2(db, owner.token, payload, dependencies);
    expect(finished.evaluation).toMatchObject({ decisionQuality: { score: 100 },
      observationAndPositioning: { status: 'insufficientEvidence', score: null } });
    expect((await finalizeAuthoredInitialDecisionV2(db, owner.token, payload, dependencies))
      .durableResult).toEqual(finished.durableResult);
    await expect(finalizeAuthoredInitialDecisionV2(db, owner.token, { ...payload,
      decision: { ...payload.decision, restart: 'directFreeKick' } }, dependencies))
      .rejects.toThrow();
    await expect(finalizeAuthoredInitialDecisionV2(db, stranger.token, payload, dependencies))
      .rejects.toThrow(/owner/);
    const restored = await restoreAuthoredAttemptV2(db, owner.token, started.attempt.id, dependencies);
    expect(restored.durableResult).toEqual(finished.durableResult);
    expect(restored.attempt).toMatchObject({ state: 'debrief', decisions: [{
      offenderActorHandle: null, restart: 'penaltyKick', discipline: 'none',
    }], evaluation: { result: { decisionQuality: { score: 100 } } } });
    expect(restored.preparedDebrief).toMatchObject({ contentId: 'debrief-001' });
    expect(JSON.stringify(restored.playable)).not.toMatch(/defence-04|contactGround|expectedRestart/);
    await expect(restoreAuthoredAttemptV2(db, stranger.token, started.attempt.id, dependencies))
      .rejects.toThrow(/owner/);
    await expect(getReviewedAuthoredScenarioV2(db, draft.ref, dependencies,
      `sha256:${'4'.repeat(64)}`)).rejects.toThrow(/approval/);
    const prior = await db.scenarioPublication.findUniqueOrThrow({
      where: { scenarioId_scenarioVersion: { scenarioId: draft.ref.scenarioId,
        scenarioVersion: draft.ref.version } },
    });
    await db.$transaction(async (tx) => {
      await tx.scenarioPublication.update({
        where: { scenarioId_scenarioVersion: { scenarioId: draft.ref.scenarioId,
          scenarioVersion: draft.ref.version } },
        data: { state: 'retired', revision: 2, retiredAt: new Date() },
      });
      await tx.scenarioPublicationEvent.create({ data: {
        scenarioId: draft.ref.scenarioId, scenarioVersion: draft.ref.version,
        priorState: 'reviewed', nextState: 'retired', priorRevision: 1, nextRevision: 2,
        actor: 'synthetic-test', reason: 'test-only retirement',
      } });
    });
    const retired = await db.scenarioPublication.findUniqueOrThrow({
      where: { scenarioId_scenarioVersion: { scenarioId: draft.ref.scenarioId,
        scenarioVersion: draft.ref.version } },
    });
    expect(retired.reviewRecordId).toBe(prior.reviewRecordId);
    expect(retired.reviewedAt).toEqual(prior.reviewedAt);
    expect(await getReviewedAuthoredScenarioV2(db, draft.ref, dependencies, build)).toBeNull();
    await expect(createMainRefereeAttemptV2(db, owner.token, {
      scenarioId: draft.ref.scenarioId, version: draft.ref.version,
      profileId: 'senior-standard', profileVersion: 1, locale: 'es',
    }, dependencies, build)).rejects.toThrow(/not reviewed/);
    expect((await getPinnedAuthoredScenarioV2(db, draft.ref, dependencies))?.contentHash)
      .toBe(draft.contentHash);
    expect((await restoreAuthoredAttemptV2(db, owner.token, started.attempt.id, dependencies))
      .durableResult).toEqual(finished.durableResult);
  });
});
