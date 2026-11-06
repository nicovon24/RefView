import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { PrismaClient, Prisma } from '../../generated/prisma/client';

type ScenarioRef = Readonly<{ scenarioId: string; version: number }>;
export type CompetitionProfileInput = Readonly<{
  profileId: string; version: number; contentHash: string; settings: Prisma.InputJsonValue;
}>;
export async function createCompetitionProfile(database: PrismaClient, input: CompetitionProfileInput) {
  await requireIsolatedTestDatabase(database);
  nonempty(input.profileId, 'profile ID');
  if (!Number.isSafeInteger(input.version) || input.version < 1) throw new Error('invalid profile version');
  if (!hashPattern.test(input.contentHash)) throw new Error('invalid profile hash');
  return database.competitionProfile.create({ data: input });
}
export type DraftScenarioInput = ScenarioRef & Readonly<{
  profileId: string; profileVersion: number; contentHash: string; lawsEdition: string;
  sourceReferences: Prisma.InputJsonValue; publicContent: Prisma.InputJsonValue;
  privateContent: Prisma.InputJsonValue;
}>;
export type PublicationTransition = ScenarioRef & Readonly<{
  expectedRevision: number; nextState: 'reviewed' | 'retired';
  reviewRecordId?: string; actor: string; reason: string;
}>;

function nonempty(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} is required`);
}
const hashPattern = /^sha256:[a-f0-9]{64}$/;
async function requireIsolatedTestDatabase(database: PrismaClient): Promise<void> {
  const rows = await database.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  if (!rows[0]?.name.endsWith('_test')) throw new Error('legacy synthetic publication is test-only');
}
const finite = z.number().finite();
const vector = z.strictObject({ x: finite, y: finite, z: finite });
const actor = z.strictObject({
  actorId: z.string().regex(/^actor-[0-9]{3}$/), position: vector, yawRad: finite,
  clipId: z.string().regex(/^asset-[0-9]{3}$/), phaseQ: z.number().int().min(0).max(999999),
});
const publicScenario = z.strictObject({
  ref: z.strictObject({ scenarioId: z.string().min(1), version: z.number().int().positive() }),
  contentHash: z.string().regex(hashPattern),
  field: z.strictObject({ lengthM: z.literal(105), widthM: z.literal(68), goalWidthM: z.literal(7.32),
    penaltyAreaDepthM: z.literal(16.5), penaltyAreaExtraWidthEachSideM: z.literal(16.5),
    lineWidthM: z.literal(0.12), attackDirection: z.enum(['positiveZ', 'negativeZ']) }),
  durationTicks: z.number().int().nonnegative(), tickRateHz: z.literal(60),
  decisionGate: z.strictObject({ opensAtTick: z.number().int().nonnegative(),
    closesAtTick: z.number().int().nonnegative(), forcePauseAtTick: z.number().int().nonnegative() }),
  role: z.literal('mainReferee'),
  actors: z.array(z.strictObject({ tick: z.number().int().nonnegative(), actors: z.array(actor) })),
  ball: z.array(z.strictObject({ tick: z.number().int().nonnegative(), ball: z.strictObject({
    position: vector, orientation: z.strictObject({ qx: finite, qy: finite, qz: finite, qw: finite }),
  }) })),
  cues: z.array(z.strictObject({ cueId: z.string().regex(/^cue-[0-9]{3}$/),
    tick: z.number().int().nonnegative(), ordinal: z.number().int().nonnegative(),
    kind: z.enum(['animationCue', 'audioCue']), assetId: z.string().regex(/^asset-[0-9]{3}$/) })),
  decisionOptions: z.array(z.discriminatedUnion('kind', [
    z.strictObject({ optionId: z.string().regex(/^opt-[0-9]{3}$/), kind: z.literal('stopPlay'), value: z.boolean() }),
    z.strictObject({ optionId: z.string().regex(/^opt-[0-9]{3}$/), kind: z.literal('restart'),
      value: z.enum(['playOn', 'penaltyKick', 'directFreeKick', 'indirectFreeKick', 'droppedBall']) }),
    z.strictObject({ optionId: z.string().regex(/^opt-[0-9]{3}$/), kind: z.literal('discipline'),
      value: z.enum(['none', 'yellow', 'red']) }),
  ])),
  lawsEdition: z.literal('IFAB-2026-27'),
});

function validatePublicScenario(value: unknown, expected: ScenarioRef & { contentHash: string; lawsEdition: string }) {
  const parsed = publicScenario.parse(value);
  if (parsed.ref.scenarioId !== expected.scenarioId || parsed.ref.version !== expected.version
    || parsed.contentHash !== expected.contentHash || parsed.lawsEdition !== expected.lawsEdition)
    throw new Error('public scenario identity mismatch');
  if (parsed.actors.length !== parsed.durationTicks + 1 || parsed.ball.length !== parsed.durationTicks + 1
    || parsed.actors.some((sample, tick) => sample.tick !== tick)
    || parsed.ball.some((sample, tick) => sample.tick !== tick))
    throw new Error('public scenario timeline mismatch');
  const actorIds = parsed.actors[0]?.actors.map((actor) => actor.actorId) ?? [];
  if (new Set(actorIds).size !== actorIds.length
    || parsed.actors.some((sample) => sample.actors.length !== actorIds.length
      || new Set(sample.actors.map((actor) => actor.actorId)).size !== sample.actors.length
      || sample.actors.some((actor, index) => actor.actorId !== actorIds[index])))
    throw new Error('public actor identities mismatch');
  if (parsed.cues.some((cue) => cue.tick > parsed.durationTicks)
    || new Set(parsed.cues.map((cue) => cue.cueId)).size !== parsed.cues.length
    || new Set(parsed.decisionOptions.map((option) => option.optionId)).size !== parsed.decisionOptions.length)
    throw new Error('invalid public cue or option');
  const gate = parsed.decisionGate;
  if (gate.opensAtTick > gate.closesAtTick || gate.closesAtTick > gate.forcePauseAtTick
    || gate.forcePauseAtTick > parsed.durationTicks) throw new Error('invalid public decision gate');
  return parsed;
}

/** Authoring operation. Only synthetic fixtures may be reviewed before rendered-evidence approval. */
export async function createDraftScenarioVersion(database: PrismaClient, input: DraftScenarioInput) {
  await requireIsolatedTestDatabase(database);
  if (!Number.isSafeInteger(input.version) || input.version < 1) throw new Error('invalid scenario version');
  nonempty(input.profileId, 'profile ID');
  nonempty(input.scenarioId, 'scenario ID');
  nonempty(input.lawsEdition, 'source edition');
  if (!hashPattern.test(input.contentHash)) throw new Error('invalid content hash');
  if (!Array.isArray(input.sourceReferences) || input.sourceReferences.length === 0)
    throw new Error('source references are required');
  const publicContent = validatePublicScenario(input.publicContent, input);
  return database.$transaction(async (tx) => {
    await tx.scenarioVersion.create({ data: {
      scenarioId: input.scenarioId, version: input.version, contentHash: input.contentHash,
      lawsEdition: input.lawsEdition, sourceReferences: input.sourceReferences,
      publicContent, privateContent: input.privateContent,
      competitionProfileId: input.profileId, competitionProfileVersion: input.profileVersion,
    } });
    return tx.scenarioPublication.create({ data: {
      scenarioId: input.scenarioId, scenarioVersion: input.version,
    } });
  });
}

/** Serializes publication changes with new-attempt creation on the publication row. */
export async function transitionScenarioPublication(database: PrismaClient, input: PublicationTransition) {
  await requireIsolatedTestDatabase(database);
  nonempty(input.actor, 'actor');
  nonempty(input.reason, 'reason');
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0)
    throw new Error('invalid expected revision');
  return database.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ state: 'draft' | 'reviewed' | 'retired'; revision: number }>>`
      SELECT "state", "revision" FROM "ScenarioPublication"
      WHERE "scenarioId" = ${input.scenarioId} AND "scenarioVersion" = ${input.version}
      FOR UPDATE
    `;
    const current = rows[0];
    if (!current) throw new Error('publication not found');
    if (current.revision !== input.expectedRevision) throw new Error('stale publication revision');
    if (current.state === 'draft' && input.nextState === 'reviewed') {
      nonempty(input.reviewRecordId ?? '', 'review record');
      const source = await tx.scenarioVersion.findUniqueOrThrow({
        where: { scenarioId_version: { scenarioId: input.scenarioId, version: input.version } },
        select: { lawsEdition: true, sourceReferences: true, sourceSchemaVersion: true, contentHash: true },
      });
      if (source.sourceSchemaVersion !== 1) throw new Error('authored review requires trusted review operation');
      nonempty(source.lawsEdition, 'source edition');
      if (!Array.isArray(source.sourceReferences) || source.sourceReferences.length === 0)
        throw new Error('source references are required');
      await tx.scenarioReviewRecord.create({ data: {
        reviewId: input.reviewRecordId!, scenarioId: input.scenarioId,
        scenarioVersion: input.version, contentHash: source.contentHash,
        reviewerPrincipal: 'legacy-synthetic-test', briefApproval: {},
        renderedEvidenceApproval: {}, captureEvidence: {},
        rendererBuildHash: `sha256:${'0'.repeat(64)}`,
        sourcesAndLicensesChecked: false, observationCalibrationApproved: false,
      } });
    } else if (current.state !== 'reviewed' || input.nextState !== 'retired') {
      throw new Error('illegal publication transition');
    }
    const nextRevision = current.revision + 1;
    const publication = await tx.scenarioPublication.update({
      where: { scenarioId_scenarioVersion: { scenarioId: input.scenarioId, scenarioVersion: input.version } },
      data: input.nextState === 'reviewed'
        ? { state: 'reviewed', revision: nextRevision, reviewRecordId: input.reviewRecordId, reviewedAt: new Date() }
        : { state: 'retired', revision: nextRevision, retiredAt: new Date() },
    });
    await tx.scenarioPublicationEvent.create({ data: {
      id: randomUUID(), scenarioId: input.scenarioId, scenarioVersion: input.version,
      priorState: current.state, nextState: input.nextState,
      priorRevision: current.revision, nextRevision,
      actor: input.actor.trim(), reason: input.reason.trim(),
    } });
    return publication;
  });
}

/** Internal pinned-version read; retirement does not invalidate existing attempts. */
export function getScenarioVersion(database: PrismaClient, scenarioId: string, version: number) {
  return database.scenarioVersion.findUnique({ where: { scenarioId_version: { scenarioId, version } } });
}

/** Challenge-safe catalog read. Private content and source details stay server-side. */
export async function getReviewedScenarioVersion(database: PrismaClient, scenarioId: string, version: number) {
  await requireIsolatedTestDatabase(database);
  const publication = await database.scenarioPublication.findUnique({
    where: { scenarioId_scenarioVersion: { scenarioId, scenarioVersion: version } },
    select: { state: true },
  });
  if (publication?.state !== 'reviewed') return null;
  const scenario = await database.scenarioVersion.findUnique({
    where: { scenarioId_version: { scenarioId, version } },
    select: { scenarioId: true, version: true, contentHash: true, lawsEdition: true, publicContent: true },
  });
  if (!scenario) return null;
  return { ...scenario, publicContent: validatePublicScenario(scenario.publicContent, scenario) };
}
