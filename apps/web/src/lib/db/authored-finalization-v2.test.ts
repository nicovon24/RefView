import 'dotenv/config';
import { randomInt, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../packages/content/src/authored-incident-v2';
import { createDraftAuthoredScenarioV2, createMainRefereeAttemptV2,
  startAuthoredAttemptRunV2 } from './authored-publication-v2';
import { finalizeAuthoredInitialDecisionV2 } from './authored-finalization-v2';
import { restoreAuthoredAttemptV2 } from './authored-restore-v2';
import { createAnonymousSession, enterDeciding } from './attempt-lifecycle';
import { openTestDatabase } from './connection';
import type { Prisma } from '../../generated/prisma/client';

const db = openTestDatabase();
afterAll(async () => db.$disconnect());
const assets = new Map([['player-rig', 'asset-001.mjs'],
  ['run-clip', 'asset-002.mjs'], ['trip-clip', 'asset-003.mjs'],
  ['challenge-clip', 'asset-004.mjs']]);
const dependencies = {
  resolveAssetBytes: (assetId: string, path: string) => {
    const filename = assets.get(assetId);
    return filename && path === `/assets/${filename}`
      ? readFileSync(new URL(`../../../../../packages/content/assets/${filename}`, import.meta.url))
      : undefined;
  },
  ...createIncident001GeometryResolverV2(),
};

async function readyFixture() {
  const source = createIncident001SourceV2();
  source.ref.version = randomInt(1_000_000, 2_000_000_000);
  source.timeline.ref.version = source.ref.version;
  const draft = await createDraftAuthoredScenarioV2(db, source, dependencies);
  const build = `sha256:${'2'.repeat(64)}`;
  const capture = { reference: 'synthetic-test-capture', sha256: `sha256:${'3'.repeat(64)}` };
  // This database record exists solely to exercise repository gates; it is not Nicolas's approval.
  const reviewId = randomUUID();
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
  const owner = await createAnonymousSession(db);
  const started = await createMainRefereeAttemptV2(db, owner.token, {
    scenarioId: draft.ref.scenarioId, version: draft.ref.version,
    profileId: 'senior-standard', profileVersion: 1, locale: 'es',
  }, dependencies, build);
  const runStart = await startAuthoredAttemptRunV2(db, owner.token, started.attempt.id, 0, {
    mode: 'thirdPerson', distanceM: 4, lateralOffsetM: 0,
    verticalFovRad: 65 * Math.PI / 180, viewportAspect: 2,
  }, dependencies, build);
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
  return { owner, attemptId: started.attempt.id, payload };
}

async function expectNoFinalization(attemptId: string) {
  expect(await db.decision.count({ where: { attemptId } })).toBe(0);
  expect(await db.observationTrace.count({ where: { attemptId } })).toBe(0);
  expect(await db.evaluation.count({ where: { attemptId } })).toBe(0);
  expect(await db.finalizationClaim.count({ where: { attemptId } })).toBe(0);
  expect((await db.attempt.findUniqueOrThrow({ where: { id: attemptId } })).state).toBe('deciding');
}

describe('v2 authored finalization on isolated PostgreSQL', () => {
  it('rejects malformed requests and traces without durable writes', async () => {
    const fixture = await readyFixture();
    const malformed = [
      { ...fixture.payload, summary: { score: 100 } },
      { ...fixture.payload, trace: { ...fixture.payload.trace, summary: { score: 100 } } },
      { ...fixture.payload, trace: { ...fixture.payload.trace, views: fixture.payload.trace.views.slice(1) } },
      { ...fixture.payload, trace: { ...fixture.payload.trace,
        views: fixture.payload.trace.views.map((view, index) => index === 10
          ? { ...view, tick: 9 } : view) } },
    ];
    for (const payload of malformed) {
      await expect(finalizeAuthoredInitialDecisionV2(db, fixture.owner.token, payload, dependencies))
        .rejects.toThrow();
      await expectNoFinalization(fixture.attemptId);
    }
  });

  it('rolls back decision and trace when evaluation persistence fails after both writes', async () => {
    const fixture = await readyFixture();
    let reachedEvaluationWrite = false;
    const failingDb = db.$extends({ query: { evaluation: { async create() {
      reachedEvaluationWrite = true;
      throw new Error('synthetic evaluation persistence failure');
    } } } });
    await expect(finalizeAuthoredInitialDecisionV2(failingDb as typeof db,
      fixture.owner.token, fixture.payload, dependencies))
      .rejects.toThrow(/synthetic evaluation persistence failure/);
    expect(reachedEvaluationWrite).toBe(true);
    await expectNoFinalization(fixture.attemptId);
    const finished = await finalizeAuthoredInitialDecisionV2(db,
      fixture.owner.token, fixture.payload, dependencies);
    expect(finished.state).toBe('debrief');
  });

  it('accepts an identical payload under a second idempotency key exactly once', async () => {
    const fixture = await readyFixture();
    const first = await finalizeAuthoredInitialDecisionV2(db,
      fixture.owner.token, fixture.payload, dependencies);
    const alias = await finalizeAuthoredInitialDecisionV2(db, fixture.owner.token,
      { ...fixture.payload, idempotencyKey: 'second' }, dependencies);
    expect(alias.durableResult).toEqual(first.durableResult);
    expect(alias.durableResult.decisionId).toBe(first.durableResult.decisionId);
    expect(await db.decision.count({ where: { attemptId: fixture.attemptId } })).toBe(1);
    expect(await db.observationTrace.count({ where: { attemptId: fixture.attemptId } })).toBe(1);
    expect(await db.evaluation.count({ where: { attemptId: fixture.attemptId } })).toBe(1);
    expect(await db.finalizationClaim.count({ where: { attemptId: fixture.attemptId } })).toBe(2);
  });

  it('rejects a stored evaluation that diverges from the pinned source on restore', async () => {
    const fixture = await readyFixture();
    await finalizeAuthoredInitialDecisionV2(db, fixture.owner.token, fixture.payload, dependencies);
    const row = await db.evaluation.delete({ where: { attemptId: fixture.attemptId } });
    const corrupted = structuredClone(row.result) as Record<string, unknown>;
    (corrupted.decisionQuality as Record<string, unknown>).score = 0;
    await db.evaluation.create({ data: { id: row.id, attemptId: fixture.attemptId,
      decisionId: row.decisionId, evaluationVersion: row.evaluationVersion,
      observationRubricVersion: row.observationRubricVersion,
      result: corrupted as Prisma.InputJsonValue } });
    await expect(restoreAuthoredAttemptV2(db, fixture.owner.token,
      fixture.attemptId, dependencies)).rejects.toThrow(/evaluation source mismatch/);
  });
});
