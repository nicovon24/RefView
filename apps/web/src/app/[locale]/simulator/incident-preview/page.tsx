import { notFound } from 'next/navigation';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, resolve } from 'node:path';
import { IncidentPreview } from '@/features/simulator/incident/IncidentPreview';
import { loadIncident001Preview } from '@/features/simulator/incident/load-incident';
import type { ContactVisualization } from '@/features/simulator/rigged-player/evidence/contact-visualization';
import { createRendererFingerprintV1 } from '@/lib/authoring/renderer-fingerprint-v1';

const diagnosticTicks = [364, 366, 370, 371];
const validPoint = (value: unknown): value is { x: number; y: number; z: number } =>
  value !== null && typeof value === 'object' && ['x', 'y', 'z'].every((key) =>
    Number.isFinite((value as Record<string, unknown>)[key]));
const validDigest = (value: unknown) => typeof value === 'string' && /^sha256:[0-9a-f]{64}$/.test(value);
const digest = (bytes: Buffer) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

function bindingMatches(patch: ContactVisualization['rows'][number]['defender'], binding: unknown): boolean {
  const expected = record(binding);
  return !!expected && patch.actorHandle === expected.actorHandle && patch.meshId === expected.meshId &&
    patch.triangleId === expected.triangleId && same(patch.vertexIds, expected.vertexIds) &&
    same(patch.barycentric, expected.barycentric);
}

function matchesAttestation(visualization: ContactVisualization, reportValue: unknown,
  attestationValue: unknown, reportBytes: Buffer, visualizationBytes: Buffer, currentFingerprint: string,
  contentHash: string): boolean {
  const report = record(reportValue);
  const attestation = record(attestationValue);
  const source = record(report?.source);
  const resources = record(report?.resources);
  const timeline = record(report?.timeline);
  const geometry = record(report?.geometry);
  const selected = record(report?.selected);
  const defender = record(selected?.defender);
  const attacker = record(selected?.attacker);
  const frozenBindings = record(attestation?.frozenBindings);
  if (!report || !attestation || !source || !resources || !timeline || !geometry || !selected || !defender || !attacker ||
    !frozenBindings || report.status !== 'accepted' || selected.status !== 'accepted' ||
    attestation.purpose !== 'local-rigged-contact-visualization-reconstruction' ||
    attestation.selectionRecomputed !== false || attestation.visualReviewStatus !== 'pending' ||
    attestation.reportSha256 !== digest(reportBytes) ||
    attestation.visualizationSha256 !== digest(visualizationBytes) ||
    attestation.historicalReportRendererInputFingerprint !== report.rendererInputFingerprintAfter ||
    report.rendererInputFingerprintBefore !== report.rendererInputFingerprintAfter ||
    !validDigest(report.rendererInputFingerprintAfter) ||
    attestation.currentStableRendererInputFingerprint !== currentFingerprint ||
    visualization.identity.rendererInputFingerprint !== currentFingerprint ||
    !same(attestation.sidecarIdentity, visualization.identity) ||
    !same(frozenBindings.defender, defender.binding) || !same(frozenBindings.attacker, attacker.binding) ||
    source.canonicalContentHash !== contentHash || source.playableContentHash !== contentHash ||
    resources.manifestDigest !== `sha256:${visualization.identity.resourceDigest}` ||
    timeline.publicActorTimelineHash !== visualization.identity.publicActorTimelineHash ||
    geometry.identity !== visualization.identity.geometryIdentity ||
    selected.geometryIdentity !== visualization.identity.geometryIdentity ||
    !same(visualization.rows[1]?.defender.point, defender.position) ||
    !same(visualization.rows[1]?.attacker.point, attacker.position)) return false;
  return visualization.rows.every((row) => same(row.axis, selected.axis) &&
    bindingMatches(row.defender, defender.binding) && bindingMatches(row.attacker, attacker.binding));
}

function validPatch(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const patch = value as Record<string, unknown>;
  if (typeof patch.actorHandle !== 'string' || !patch.actorHandle ||
    typeof patch.meshId !== 'string' || !patch.meshId ||
    !Number.isSafeInteger(patch.triangleId) || !Array.isArray(patch.vertexIds) ||
    patch.vertexIds.length !== 3 || !patch.vertexIds.every(Number.isSafeInteger) ||
    !Array.isArray(patch.barycentric) || patch.barycentric.length !== 3 ||
    !patch.barycentric.every((weight) => Number.isFinite(weight) && weight >= 0 && weight <= 1) ||
    Math.abs(patch.barycentric.reduce((sum: number, weight: number) => sum + weight, 0) - 1) > 1e-8 ||
    !Array.isArray(patch.vertices) || patch.vertices.length !== 3 ||
    !patch.vertices.every(validPoint) || !validPoint(patch.point) || !validPoint(patch.leftAnkle)) return false;
  const point = patch.point as { x: number; y: number; z: number };
  const barycentric = patch.barycentric as number[];
  const vertices = patch.vertices as { x: number; y: number; z: number }[];
  return (['x', 'y', 'z'] as const).every((axis) =>
    Math.abs(point[axis] - vertices.reduce((sum, vertex, index) =>
      sum + vertex[axis] * barycentric[index]!, 0)) <= 1e-7);
}

function validDiagnostic(value: unknown, contentHash: string): value is ContactVisualization {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 'rigged-contact-visualization-v1' ||
    !candidate.identity || typeof candidate.identity !== 'object' || !Array.isArray(candidate.rows) ||
    candidate.rows.length !== 4) return false;
  const identity = candidate.identity as Record<string, unknown>;
  if (identity.canonicalContentHash !== contentHash ||
    typeof identity.resourceDigest !== 'string' || !/^[0-9a-f]{64}$/.test(identity.resourceDigest) ||
    !['publicActorTimelineHash', 'geometryIdentity', 'rendererInputFingerprint']
      .every((key) => validDigest(identity[key]))) return false;
  return candidate.rows.every((value, index) => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Record<string, unknown>;
    if (row.tick !== diagnosticTicks[index] || !validPatch(row.defender) || !validPatch(row.attacker) ||
      !validPoint(row.axis) || !Number.isFinite(row.separationM) ||
      !Number.isFinite(row.signedSeparationM)) return false;
    const defender = row.defender as ContactVisualization['rows'][number]['defender'];
    const attacker = row.attacker as ContactVisualization['rows'][number]['attacker'];
    if (defender.actorHandle !== 'actor-006' || attacker.actorHandle !== 'actor-002') return false;
    const delta = { x: attacker.point.x - defender.point.x,
      y: attacker.point.y - defender.point.y, z: attacker.point.z - defender.point.z };
    const axis = row.axis as { x: number; y: number; z: number };
    return Math.abs(Math.hypot(delta.x, delta.y, delta.z) - (row.separationM as number)) <= 1e-7 &&
      Math.abs(delta.x * axis.x + delta.y * axis.y + delta.z * axis.z -
        (row.signedSeparationM as number)) <= 1e-7;
  });
}

async function loadDiagnostic(contentHash: string): Promise<ContactVisualization | undefined> {
  try {
    const root = basename(process.cwd()) === 'web' ? resolve(process.cwd(), '../..') : process.cwd();
    const artifact = resolve(root, 'artifacts/rigged-contact-feature');
    const [visualizationBytes, attestationBytes, reportBytes] = await Promise.all([
      readFile(resolve(artifact, 'visualization.json')),
      readFile(resolve(artifact, 'visualization-attestation.json')),
      readFile(resolve(artifact, 'report.json')),
    ]);
    const raw: unknown = JSON.parse(visualizationBytes.toString('utf8'));
    if (!validDiagnostic(raw, contentHash)) return undefined;
    const attestation: unknown = JSON.parse(attestationBytes.toString('utf8'));
    const report: unknown = JSON.parse(reportBytes.toString('utf8'));
    const currentFingerprint = createRendererFingerprintV1(root, '10.33.2').fingerprint;
    return matchesAttestation(raw, report, attestation, reportBytes, visualizationBytes,
      currentFingerprint, contentHash) ? raw : undefined;
  } catch { return undefined; }
}

export default async function IncidentPreviewPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tick?: string; camera?: string; contactDiagnostic?: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const query = await searchParams;
  const tick = Number(query.tick ?? 0);
  const initialTick = Number.isSafeInteger(tick) && tick >= 0 && tick <= 480 ? tick : 0;
  const playable = loadIncident001Preview();
  const contactDiagnostic = process.env.NODE_ENV === 'development' && query.contactDiagnostic === '1'
    ? await loadDiagnostic(playable.contentHash) : undefined;
  return <IncidentPreview locale={locale} playable={playable} initialTick={initialTick}
    initialCamera={query.camera === 'first' ? 'firstPerson' : 'thirdPerson'} contactDiagnostic={contactDiagnostic} />;
}
