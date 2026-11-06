import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { openTestDatabase } from './connection';
import { createCompetitionProfile, createDraftScenarioVersion, getReviewedScenarioVersion, getScenarioVersion, transitionScenarioPublication } from './publication';

const database = openTestDatabase();
afterAll(async () => database.$disconnect());

function fixture() {
  const id = randomUUID();
  return {
    profileId: `synthetic-profile-${id}`, profileVersion: 2,
    profileContentHash: `sha256:${'c'.repeat(64)}`,
    scenarioId: `synthetic-scenario-${id}`,
    version: 1,
    contentHash: `sha256:${'a'.repeat(64)}`,
    lawsEdition: 'IFAB-2026-27',
    sourceReferences: [{ edition: 'IFAB-2026-27', reference: 'synthetic-test-only' }],
    publicContent: {
      ref: { scenarioId: `synthetic-scenario-${id}`, version: 1 }, contentHash: `sha256:${'a'.repeat(64)}`,
      field: { lengthM: 105, widthM: 68, goalWidthM: 7.32, penaltyAreaDepthM: 16.5,
        penaltyAreaExtraWidthEachSideM: 16.5, lineWidthM: 0.12, attackDirection: 'positiveZ' },
      durationTicks: 0, tickRateHz: 60,
      decisionGate: { opensAtTick: 0, closesAtTick: 0, forcePauseAtTick: 0 },
      role: 'mainReferee', actors: [{ tick: 0, actors: [] }],
      ball: [{ tick: 0, ball: { position: { x: 0, y: 0, z: 0 },
        orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } }],
      cues: [], decisionOptions: [], lawsEdition: 'IFAB-2026-27',
    },
    privateContent: { answer: 'synthetic-only' },
    settings: { kind: 'synthetic-test-only' },
  };
}

async function createFixture(item: ReturnType<typeof fixture>) {
  await createCompetitionProfile(database, {
    profileId: item.profileId, version: item.profileVersion,
    contentHash: item.profileContentHash, settings: item.settings,
  });
  await createDraftScenarioVersion(database, item);
}

describe('scenario publication against isolated PostgreSQL', () => {
  it('reviews, retires, audits, and retains a pinned immutable version', async () => {
    const item = fixture();
    await createFixture(item);
    expect((await database.competitionProfile.findUnique({ where: {
      profileId_version: { profileId: item.profileId, version: item.profileVersion },
    } }))?.contentHash).toBe(item.profileContentHash);
    expect(await getReviewedScenarioVersion(database, item.scenarioId, item.version)).toBeNull();

    const reviewed = await transitionScenarioPublication(database, {
      scenarioId: item.scenarioId, version: item.version, expectedRevision: 0,
      nextState: 'reviewed', reviewRecordId: `synthetic-review-${randomUUID()}`,
      actor: 'synthetic-test-author', reason: 'Synthetic test review',
    });
    expect(reviewed).toMatchObject({ state: 'reviewed', revision: 1 });
    const catalogEntry = await getReviewedScenarioVersion(database, item.scenarioId, item.version);
    expect(catalogEntry?.publicContent).toEqual(item.publicContent);
    expect(catalogEntry).not.toHaveProperty('privateContent');
    expect(catalogEntry).not.toHaveProperty('sourceReferences');

    const retired = await transitionScenarioPublication(database, {
      scenarioId: item.scenarioId, version: item.version, expectedRevision: 1,
      nextState: 'retired', actor: 'synthetic-test-author', reason: 'Synthetic test retirement',
    });
    expect(retired).toMatchObject({ state: 'retired', revision: 2 });
    expect(await getReviewedScenarioVersion(database, item.scenarioId, item.version)).toBeNull();
    expect((await getScenarioVersion(database, item.scenarioId, item.version))?.contentHash).toBe(item.contentHash);
    expect(await database.scenarioPublicationEvent.findMany({
      where: { scenarioId: item.scenarioId, scenarioVersion: item.version }, orderBy: { nextRevision: 'asc' },
    })).toMatchObject([
      { priorState: 'draft', nextState: 'reviewed', priorRevision: 0, nextRevision: 1, actor: 'synthetic-test-author' },
      { priorState: 'reviewed', nextState: 'retired', priorRevision: 1, nextRevision: 2, actor: 'synthetic-test-author' },
    ]);
  });

  it('rejects stale and illegal transitions without events', async () => {
    const item = fixture();
    await createFixture(item);
    await expect(transitionScenarioPublication(database, {
      scenarioId: item.scenarioId, version: item.version, expectedRevision: 0,
      nextState: 'retired', actor: 'synthetic-test', reason: 'Illegal skip',
    })).rejects.toThrow();
    await expect(transitionScenarioPublication(database, {
      scenarioId: item.scenarioId, version: item.version, expectedRevision: 1,
      nextState: 'reviewed', reviewRecordId: 'synthetic-review', actor: 'synthetic-test', reason: 'Stale',
    })).rejects.toThrow();
    await expect(transitionScenarioPublication(database, {
      scenarioId: item.scenarioId, version: item.version, expectedRevision: 0,
      nextState: 'reviewed', actor: 'synthetic-test', reason: 'Missing review record',
    })).rejects.toThrow(/review record/);
    expect(await database.scenarioPublicationEvent.count({ where: { scenarioId: item.scenarioId } })).toBe(0);
  });

  it('enforces database immutability and matching audit at commit', async () => {
    const item = fixture();
    await createFixture(item);
    await expect(database.scenarioVersion.update({
      where: { scenarioId_version: { scenarioId: item.scenarioId, version: item.version } },
      data: { contentHash: `sha256:${'b'.repeat(64)}` },
    })).rejects.toThrow();
    await expect(database.scenarioPublication.update({
      where: { scenarioId_scenarioVersion: { scenarioId: item.scenarioId, scenarioVersion: item.version } },
      data: { state: 'reviewed', revision: 1, reviewRecordId: 'synthetic-review', reviewedAt: new Date() },
    })).rejects.toThrow();
    expect((await database.scenarioPublication.findUnique({
      where: { scenarioId_scenarioVersion: { scenarioId: item.scenarioId, scenarioVersion: item.version } },
    }))?.state).toBe('draft');
  });

  it('rejects nested private data in authored public content', async () => {
    const item = fixture();
    await createCompetitionProfile(database, {
      profileId: item.profileId, version: item.profileVersion,
      contentHash: item.profileContentHash, settings: item.settings,
    });
    await expect(createDraftScenarioVersion(database, {
      ...item, publicContent: { ...item.publicContent,
        actors: [{ tick: 0, actors: [{ actorId: 'actor-001', position: { x: 0, y: 0, z: 0 },
          yawRad: 0, clipId: 'asset-001', phaseQ: 0, evidence: { answer: 'penalty' } }] }],
      },
    })).rejects.toThrow();
    expect(await database.scenarioVersion.count({ where: { scenarioId: item.scenarioId } })).toBe(0);
  });

  it('rejects an unsafe legacy catalog row on read', async () => {
    const item = fixture();
    await createCompetitionProfile(database, {
      profileId: item.profileId, version: item.profileVersion,
      contentHash: item.profileContentHash, settings: item.settings,
    });
    await database.scenarioVersion.create({ data: {
      scenarioId: item.scenarioId, version: item.version, contentHash: item.contentHash,
      lawsEdition: item.lawsEdition, sourceReferences: item.sourceReferences,
      publicContent: { ...item.publicContent, decisionGate: {
        ...item.publicContent.decisionGate, evidence: { answer: 'penalty' },
      } },
      privateContent: item.privateContent,
      competitionProfileId: item.profileId, competitionProfileVersion: item.profileVersion,
    } });
    await database.scenarioPublication.create({ data: {
      scenarioId: item.scenarioId, scenarioVersion: item.version,
    } });
    await transitionScenarioPublication(database, {
      scenarioId: item.scenarioId, version: item.version, expectedRevision: 0,
      nextState: 'reviewed', reviewRecordId: 'synthetic-review',
      actor: 'synthetic-test', reason: 'Legacy row test',
    });
    await expect(getReviewedScenarioVersion(database, item.scenarioId, item.version)).rejects.toThrow();
  });

  it('rejects a legacy reviewed row with a mismatched option kind on read', async () => {
    const item = fixture();
    await createCompetitionProfile(database, {
      profileId: item.profileId, version: item.profileVersion,
      contentHash: item.profileContentHash, settings: item.settings,
    });
    await database.scenarioVersion.create({ data: {
      scenarioId: item.scenarioId, version: item.version, contentHash: item.contentHash,
      lawsEdition: item.lawsEdition, sourceReferences: item.sourceReferences,
      publicContent: { ...item.publicContent,
        decisionOptions: [{ optionId: 'opt-001', kind: 'stopPlay', value: 'penaltyKick' }] },
      privateContent: item.privateContent,
      competitionProfileId: item.profileId, competitionProfileVersion: item.profileVersion,
    } });
    await database.scenarioPublication.create({ data: {
      scenarioId: item.scenarioId, scenarioVersion: item.version,
    } });
    await transitionScenarioPublication(database, {
      scenarioId: item.scenarioId, version: item.version, expectedRevision: 0,
      nextState: 'reviewed', reviewRecordId: 'synthetic-review',
      actor: 'synthetic-test', reason: 'Legacy option test',
    });
    await expect(getReviewedScenarioVersion(database, item.scenarioId, item.version)).rejects.toThrow();
  });

  it.each(['optionKind', 'phase', 'duplicateActor', 'unstableActors', 'cueTick'] as const)(
    'rejects invalid playable invariant %s before insert', async (invalid) => {
      const item = fixture();
      await createCompetitionProfile(database, {
        profileId: item.profileId, version: item.profileVersion,
        contentHash: item.profileContentHash, settings: item.settings,
      });
      const sample = { actorId: 'actor-001', position: { x: 0, y: 0, z: 0 },
        yawRad: 0, clipId: 'asset-001', phaseQ: 0 };
      const content = { ...item.publicContent, durationTicks: 1,
        decisionGate: { opensAtTick: 0, closesAtTick: 1, forcePauseAtTick: 1 },
        actors: [{ tick: 0, actors: [sample] }, { tick: 1, actors: [sample] }],
        ball: [...item.publicContent.ball, { ...item.publicContent.ball[0]!, tick: 1 }],
        cues: [] as Array<{ cueId: string; tick: number; ordinal: number; kind: string; assetId: string }>,
        decisionOptions: [] as Array<{ optionId: string; kind: string; value: string }>,
      };
      if (invalid === 'optionKind') content.decisionOptions = [{ optionId: 'opt-001', kind: 'stopPlay', value: 'penaltyKick' }];
      if (invalid === 'phase') content.actors[0]!.actors = [{ ...sample, phaseQ: 1.5 }];
      if (invalid === 'duplicateActor') content.actors[0]!.actors = [sample, sample];
      if (invalid === 'unstableActors') content.actors[1]!.actors = [];
      if (invalid === 'cueTick') content.cues = [{ cueId: 'cue-001', tick: 2, ordinal: 0,
        kind: 'animationCue', assetId: 'asset-001' }];
      await expect(createDraftScenarioVersion(database, { ...item, publicContent: content })).rejects.toThrow();
    },
  );
});
