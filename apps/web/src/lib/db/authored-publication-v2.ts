import { isDeepStrictEqual } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { compileCanonicalScenarioSourceV2, recompileStoredCanonicalSourceV2,
  type CompilerDependenciesV2 } from '@refview/content';
import type { PrismaClient, Prisma, ScenarioReviewRecord } from '../../generated/prisma/client';

type Ref = Readonly<{ scenarioId: string; version: number }>;
const hashPattern = /^sha256:[0-9a-f]{64}$/;
const attemptInput = z.strictObject({
  scenarioId: z.string().min(1), version: z.number().int().positive(),
  profileId: z.string().min(1), profileVersion: z.number().int().positive(),
  locale: z.enum(['es', 'en']),
});
const finite = z.number().finite();
const cameraInput = z.strictObject({
  mode: z.enum(['thirdPerson', 'firstPerson']),
  distanceM: finite.min(2).max(8), lateralOffsetM: finite.min(-3).max(3),
  verticalFovRad: finite.min(0.785).max(1.31), viewportAspect: finite.min(0.75).max(2.5),
});

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function same(a: unknown, b: unknown): boolean {
  return isDeepStrictEqual(a, b);
}

/** Compile one source before the transaction; persist all derived values atomically. */
export async function createDraftAuthoredScenarioV2(
  database: PrismaClient, input: unknown, dependencies: CompilerDependenciesV2,
) {
  const compiled = compileCanonicalScenarioSourceV2(input, dependencies);
  const profile = compiled.profileIdentity;
  const source = compiled.canonicalSource;
  return database.$transaction(async (tx) => {
    const existing = await tx.competitionProfile.findUnique({
      where: { profileId_version: { profileId: profile.profileId, version: profile.version } },
    });
    if (existing) {
      if (existing.contentHash !== compiled.profileHash || !same(existing.settings, profile.settings)) {
        throw new Error('stored competition profile differs from compiled source');
      }
    } else {
      await tx.competitionProfile.create({ data: {
        profileId: profile.profileId, version: profile.version,
        contentHash: compiled.profileHash, settings: json(profile.settings),
      } });
    }
    await tx.scenarioVersion.create({ data: {
      scenarioId: source.ref.scenarioId, version: source.ref.version,
      contentHash: compiled.contentHash, sourceSchemaVersion: 2,
      canonicalSource: json(source), lawsEdition: source.lawsEdition,
      sourceReferences: json(source.officialSources), publicContent: json(compiled.playable),
      privateContent: json(compiled.privateContext),
      competitionProfileId: profile.profileId, competitionProfileVersion: profile.version,
    } });
    await tx.scenarioPublication.create({ data: {
      scenarioId: source.ref.scenarioId, scenarioVersion: source.ref.version,
    } });
    return { ref: source.ref, contentHash: compiled.contentHash, state: 'draft' as const };
  });
}

async function verifyStoredSource(database: Pick<PrismaClient, 'scenarioVersion'>, ref: Ref,
  dependencies: CompilerDependenciesV2) {
  const row = await database.scenarioVersion.findUnique({
    where: { scenarioId_version: { scenarioId: ref.scenarioId, version: ref.version } },
    include: { competitionProfile: true },
  });
  if (!row) return null;
  if (row.sourceSchemaVersion !== 2 || row.canonicalSource === null) {
    throw new Error('legacy or missing canonical source is not authored training');
  }
  const compiled = recompileStoredCanonicalSourceV2(row.canonicalSource, dependencies);
  if (row.contentHash !== compiled.contentHash ||
    row.competitionProfileId !== compiled.profileIdentity.profileId ||
    row.competitionProfileVersion !== compiled.profileIdentity.version ||
    row.competitionProfile.contentHash !== compiled.profileHash ||
    !same(row.competitionProfile.settings, compiled.profileIdentity.settings) ||
    row.lawsEdition !== compiled.canonicalSource.lawsEdition ||
    !same(row.sourceReferences, compiled.canonicalSource.officialSources) ||
    !same(row.publicContent, compiled.playable) ||
    !same(row.privateContent, compiled.privateContext)) {
    throw new Error('stored authored source or derived cache mismatch');
  }
  return compiled;
}

/** Pinned attempts may read an immutable source after retirement. */
export async function getPinnedAuthoredScenarioV2(database: Pick<PrismaClient, 'scenarioVersion'>, ref: Ref,
  dependencies: CompilerDependenciesV2) {
  return verifyStoredSource(database, ref, dependencies);
}

function validApproval(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return ['actor', 'at', 'evidenceRef'].every((key) =>
    typeof item[key] === 'string' && item[key].trim().length > 0);
}

function validCapture(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.reference === 'string' && item.reference.trim().length > 0 &&
    typeof item.sha256 === 'string' && hashPattern.test(item.sha256);
}

function requireBoundReview(record: ScenarioReviewRecord | null,
  ref: Ref, contentHash: string, rendererBuildHash: string): void {
  if (!record || record.scenarioId !== ref.scenarioId ||
    record.scenarioVersion !== ref.version || record.contentHash !== contentHash ||
    record.rendererBuildHash !== rendererBuildHash ||
    !record.sourcesAndLicensesChecked || !record.observationCalibrationApproved ||
    !validApproval(record.briefApproval) || !validApproval(record.renderedEvidenceApproval) ||
    record.renderedEvidenceApproval.actor !== 'Nicolas' ||
    record.renderedEvidenceApproval.sourceHash !== contentHash ||
    record.renderedEvidenceApproval.rendererBuildHash !== rendererBuildHash ||
    !record.captureEvidence || typeof record.captureEvidence !== 'object' ||
    Array.isArray(record.captureEvidence)) {
    throw new Error('reviewed authored source lacks bound approval');
  }
  const captures = record.captureEvidence as Record<string, unknown>;
  if (!['firstGood', 'firstPoor', 'thirdGood', 'thirdPoor'].every((key) => validCapture(captures[key]))) {
    throw new Error('reviewed authored source lacks required captures');
  }
}

/** Catalog/start authority: source, cache, review and served build must all agree. */
export async function getReviewedAuthoredScenarioV2(database: PrismaClient, ref: Ref,
  dependencies: CompilerDependenciesV2, rendererBuildHash: string) {
  if (!hashPattern.test(rendererBuildHash)) throw new Error('invalid renderer build hash');
  return database.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<Array<{ state: string }>>`
      SELECT "state" FROM "ScenarioPublication"
      WHERE "scenarioId" = ${ref.scenarioId} AND "scenarioVersion" = ${ref.version}
      FOR SHARE
    `;
    if (locked?.state !== 'reviewed') return null;
    const publication = await tx.scenarioPublication.findUniqueOrThrow({
      where: { scenarioId_scenarioVersion: { scenarioId: ref.scenarioId, scenarioVersion: ref.version } },
      include: { reviewRecord: true },
    });
    const compiled = await verifyStoredSource(tx, ref, dependencies);
    if (!compiled) throw new Error('reviewed authored source is missing');
    requireBoundReview(publication.reviewRecord, ref, compiled.contentHash, rendererBuildHash);
    return { ref, contentHash: compiled.contentHash, playable: compiled.playable };
  });
}

/** Owner-bound v2 start holds the publication lock while verifying every source and review gate. */
export async function createMainRefereeAttemptV2(database: PrismaClient, token: string,
  input: unknown, dependencies: CompilerDependenciesV2, rendererBuildHash: string) {
  const requested = attemptInput.parse(input);
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('anonymous owner unavailable');
  if (!hashPattern.test(rendererBuildHash)) throw new Error('invalid renderer build hash');
  const tokenHash = `sha256:${createHash('sha256').update(token).digest('hex')}`;
  return database.$transaction(async (tx) => {
    const [owner] = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AnonymousSession"
      WHERE "tokenHash" = ${tokenHash} AND "expiresAt" > NOW() FOR SHARE
    `;
    if (!owner) throw new Error('anonymous owner unavailable');
    const [publication] = await tx.$queryRaw<Array<{ state: string; reviewRecordId: string | null }>>`
      SELECT "state", "reviewRecordId" FROM "ScenarioPublication"
      WHERE "scenarioId" = ${requested.scenarioId} AND "scenarioVersion" = ${requested.version}
      FOR UPDATE
    `;
    if (publication?.state !== 'reviewed' || !publication.reviewRecordId) {
      throw new Error('scenario is not reviewed');
    }
    const ref = { scenarioId: requested.scenarioId, version: requested.version };
    const compiled = await verifyStoredSource(tx, ref, dependencies);
    if (!compiled) throw new Error('reviewed authored source is missing');
    if (compiled.profileIdentity.profileId !== requested.profileId ||
      compiled.profileIdentity.version !== requested.profileVersion) {
      throw new Error('competition profile mismatch');
    }
    const record = await tx.scenarioReviewRecord.findUnique({ where: {
      reviewId_scenarioId_scenarioVersion: { reviewId: publication.reviewRecordId,
        scenarioId: requested.scenarioId, scenarioVersion: requested.version },
    } });
    requireBoundReview(record, ref, compiled.contentHash, rendererBuildHash);
    const plan = await tx.sessionPlan.create({ data: {
      ownerId: owner.id, competitionProfileId: requested.profileId,
      competitionProfileVersion: requested.profileVersion,
      seed: randomUUID(), locale: requested.locale, role: 'mainReferee',
    } });
    const item = await tx.sessionPlanItem.create({ data: {
      planId: plan.id, ownerId: owner.id, order: 0,
      scenarioId: requested.scenarioId, scenarioVersion: requested.version,
    } });
    const attempt = await tx.attempt.create({ data: {
      ownerId: owner.id, planItemId: item.id, locale: requested.locale, role: 'mainReferee',
      clientBuild: rendererBuildHash,
    } });
    return { plan: { ...plan, items: [item] }, attempt };
  });
}

/** Starts a pinned authored run from the immutable source pose, never a client-supplied position. */
export async function startAuthoredAttemptRunV2(database: PrismaClient, token: string,
  attemptId: string, expectedRevision: number, preferencesInput: unknown,
  dependencies: CompilerDependenciesV2, rendererBuildHash: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('anonymous owner unavailable');
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('invalid revision');
  if (!hashPattern.test(rendererBuildHash)) throw new Error('invalid renderer build hash');
  const preferences = cameraInput.parse(preferencesInput);
  const tokenHash = `sha256:${createHash('sha256').update(token).digest('hex')}`;
  return database.$transaction(async (tx) => {
    const [owner] = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AnonymousSession"
      WHERE "tokenHash" = ${tokenHash} AND "expiresAt" > NOW() FOR SHARE
    `;
    if (!owner) throw new Error('anonymous owner unavailable');
    const [locked] = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Attempt" WHERE "id" = ${attemptId}
        AND "ownerId" = ${owner.id} FOR UPDATE
    `;
    if (!locked) throw new Error('attempt owner mismatch');
    const attempt = await tx.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: {
      planItem: { include: { scenario: true } },
    } });
    if (attempt.runRevision !== expectedRevision) throw new Error('stale run revision');
    if (attempt.state !== 'ready') throw new Error('attempt is not ready');
    if (attempt.role !== 'mainReferee') throw new Error('role mismatch');
    if (attempt.clientBuild !== rendererBuildHash) throw new Error('renderer build differs from reviewed attempt');
    const pinned = attempt.planItem.scenario;
    const compiled = await verifyStoredSource(tx,
      { scenarioId: pinned.scenarioId, version: pinned.version }, dependencies);
    if (!compiled || compiled.contentHash !== pinned.contentHash) throw new Error('pinned source mismatch');
    const publication = await tx.scenarioPublication.findUnique({ where: {
      scenarioId_scenarioVersion: { scenarioId: pinned.scenarioId, scenarioVersion: pinned.version },
    }, include: { reviewRecord: true } });
    requireBoundReview(publication?.reviewRecord ?? null,
      { scenarioId: pinned.scenarioId, version: pinned.version }, compiled.contentHash, rendererBuildHash);
    const sourcePose = compiled.playable.initialRefereePose;
    if (Math.abs(sourcePose.position.x) > compiled.playable.field.widthM / 2 ||
      Math.abs(sourcePose.position.z) > compiled.playable.field.lengthM / 2) {
      throw new Error('initial referee pose outside field');
    }
    const initialView = { tick: 0, refereePosition: sourcePose.position,
      lookYaw: sourcePose.lookYaw, lookPitch: sourcePose.lookPitch,
      cameraMode: preferences.mode, cameraDistanceM: preferences.distanceM,
      cameraLateralOffsetM: preferences.lateralOffsetM,
      viewportAspectRatio: preferences.viewportAspect, verticalFovRad: preferences.verticalFovRad };
    const runStart = await tx.attemptRunStart.create({ data: {
      attemptId, runRevision: attempt.runRevision, scenarioContentHash: compiled.contentHash,
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
