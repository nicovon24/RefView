import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { openTestDatabase } from './connection';

const db = openTestDatabase();
afterAll(async () => { await db.$disconnect(); });
const digest = (digit: string) => `sha256:${digit.repeat(64)}`;

async function draft() {
  const id = randomUUID();
  await db.competitionProfile.create({ data: {
    profileId: id, version: 1, contentHash: digest('a'), settings: { fixture: true },
  } });
  await db.scenarioVersion.create({ data: {
    scenarioId: id, version: 1, contentHash: digest('b'), sourceSchemaVersion: 2,
    canonicalSource: { fixture: true }, lawsEdition: 'IFAB-2026-27',
    sourceReferences: [{ fixture: true }], publicContent: {}, privateContent: {},
    competitionProfileId: id, competitionProfileVersion: 1,
  } });
  await db.scenarioPublication.create({ data: { scenarioId: id, scenarioVersion: 1 } });
  return id;
}

describe('v2 publication database guard in isolated PostgreSQL', () => {
  it('requires a bound review record and rejects an incomplete rendered approval', async () => {
    const scenarioId = await draft();
    const reviewId = randomUUID();
    await expect(db.$transaction(async (tx) => {
      await tx.scenarioPublication.update({
        where: { scenarioId_scenarioVersion: { scenarioId, scenarioVersion: 1 } },
        data: { state: 'reviewed', revision: 1, reviewRecordId: reviewId, reviewedAt: new Date() },
      });
    })).rejects.toThrow();
    await db.scenarioReviewRecord.create({ data: {
      reviewId, scenarioId, scenarioVersion: 1, contentHash: digest('b'),
      reviewerPrincipal: 'synthetic-test-reviewer', briefApproval: { actor: 'Nicolas', at: 'fixture', evidenceRef: 'fixture' },
      renderedEvidenceApproval: {}, captureEvidence: {}, rendererBuildHash: digest('c'),
      sourcesAndLicensesChecked: false, observationCalibrationApproved: false,
    } });
    await expect(db.$transaction(async (tx) => {
      await tx.scenarioPublication.update({
        where: { scenarioId_scenarioVersion: { scenarioId, scenarioVersion: 1 } },
        data: { state: 'reviewed', revision: 1, reviewRecordId: reviewId, reviewedAt: new Date() },
      });
      await tx.scenarioPublicationEvent.create({ data: {
        scenarioId, scenarioVersion: 1, priorState: 'draft', nextState: 'reviewed',
        priorRevision: 0, nextRevision: 1, actor: 'synthetic-test', reason: 'fixture',
      } });
    })).rejects.toThrow(/authored source lacks bound review evidence/);
    expect((await db.scenarioPublication.findUniqueOrThrow({
      where: { scenarioId_scenarioVersion: { scenarioId, scenarioVersion: 1 } },
    })).state).toBe('draft');
    await expect(db.scenarioReviewRecord.update({
      where: { reviewId_scenarioId_scenarioVersion: { reviewId, scenarioId, scenarioVersion: 1 } },
      data: { reviewerPrincipal: 'mutated' },
    })).rejects.toThrow();
  });

  it('rejects review records bound to a wrong source hash', async () => {
    const scenarioId = await draft();
    await expect(db.scenarioReviewRecord.create({ data: {
      reviewId: randomUUID(), scenarioId, scenarioVersion: 1, contentHash: digest('d'),
      reviewerPrincipal: 'synthetic-test-reviewer', briefApproval: {},
      renderedEvidenceApproval: {}, captureEvidence: {}, rendererBuildHash: digest('c'),
      sourcesAndLicensesChecked: false, observationCalibrationApproved: false,
    } })).rejects.toThrow();
  });

  it('rejects a reviewed transition when a required capture is absent', async () => {
    const scenarioId = await draft();
    const reviewId = randomUUID();
    const capture = { reference: 'synthetic-test-capture', sha256: digest('e') };
    await db.scenarioReviewRecord.create({ data: {
      reviewId, scenarioId, scenarioVersion: 1, contentHash: digest('b'),
      reviewerPrincipal: 'synthetic-test-reviewer',
      briefApproval: { actor: 'Nicolas', at: 'fixture', evidenceRef: 'fixture' },
      renderedEvidenceApproval: { actor: 'Nicolas', at: 'fixture', evidenceRef: 'fixture',
        sourceHash: digest('b'), rendererBuildHash: digest('c') },
      captureEvidence: { firstGood: capture, firstPoor: capture, thirdGood: capture },
      rendererBuildHash: digest('c'), sourcesAndLicensesChecked: true,
      observationCalibrationApproved: true,
    } });
    await expect(db.$transaction(async (tx) => {
      await tx.scenarioPublication.update({
        where: { scenarioId_scenarioVersion: { scenarioId, scenarioVersion: 1 } },
        data: { state: 'reviewed', revision: 1, reviewRecordId: reviewId, reviewedAt: new Date() },
      });
      await tx.scenarioPublicationEvent.create({ data: {
        scenarioId, scenarioVersion: 1, priorState: 'draft', nextState: 'reviewed',
        priorRevision: 0, nextRevision: 1, actor: 'synthetic-test', reason: 'missing capture guard',
      } });
    })).rejects.toThrow(/authored source lacks bound review evidence/);
    expect((await db.scenarioPublication.findUniqueOrThrow({
      where: { scenarioId_scenarioVersion: { scenarioId, scenarioVersion: 1 } },
    })).state).toBe('draft');
  });
});
