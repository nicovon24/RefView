import type { compileCanonicalScenarioSourceV2 } from '@refview/content';
import type { CandidateGeometrySample } from './geometry';
import { nearestSurfacePair, type CandidateTriangleSelection, type SurfaceSegmentHit } from './surface-query';
import { runRiggedCalibrationPilot, seedRiggedContactBindings, type CalibrationGeometrySampler,
  type ContactBinding, type RiggedCalibrationReport, type RiggedContactBindings } from './calibration';

type Point = { x: number; y: number; z: number };
type CompiledSource = ReturnType<typeof compileCanonicalScenarioSourceV2>;
type Row = RiggedCalibrationReport['rows'][number];
type Triangle = CandidateTriangleSelection;
type LayerCounts = Readonly<{ selectedTriangles: number; excludedBodyTriangles: number;
  unmatchedSkinTriangles: number; retainedTriangles: number }>;
type Blocker = Readonly<{ actorHandle: string; meshId: string; triangleId: number; distance: number }> | null;
type AnchorDiff = Readonly<{ position: Point; eyeAvailable: boolean; cameraAvailable: boolean;
  firstBlockers: Readonly<{ eye: Blocker; rawCamera: Blocker; nearClipped: Blocker }> }>;
type RowSide = Readonly<{ anchors: Readonly<Record<string, AnchorDiff>>;
  firstBlockers: Readonly<Record<string, AnchorDiff['firstBlockers']>>;
  contactSeparationM: number | null; classification: Row['classification'] }>;
export type RiggedContactLayerComparison = Readonly<{
  purpose: 'local-rigged-contact-layer-comparison'; historicalBaselineHashes: Readonly<Record<string, string>>;
  baseline: Readonly<{ bindings: RiggedContactBindings; report: RiggedCalibrationReport }>;
  alternative: Readonly<{ bindings: RiggedContactBindings; report: RiggedCalibrationReport }>;
  correspondence: Readonly<{ body: Readonly<{ meshId: string; triangleId: number;
    vertexIds: readonly number[]; barycentric: readonly number[]; position: Point }>;
    shell: Readonly<{ meshId: string; triangleId: number; vertexIds: readonly number[];
      barycentric: readonly number[]; position: Point }>; posedSeparationM: number }>;
  selectionCounts: Readonly<{ defender: LayerCounts; attacker: LayerCounts }>;
  rowDifferences: readonly Readonly<{ tick: number; evidenceId: string; viewId: Row['viewId'];
    cameraMode: Row['cameraMode']; baseline: RowSide; alternative: RowSide }>[];
}>;
export type RiggedContactLayerMetrics = Readonly<{ baselineSeedPairProductCount: number;
  baselineSeedElapsedMs: number; baselinePilotTriangleCount: number; baselinePilotRayCastCount: number;
  baselinePilotElapsedMs: number; alternativePairProductCount: number; alternativePilotTriangleCount: number;
  alternativePilotRayCastCount: number; alternativePilotElapsedMs: number; elapsedMs: number }>;

const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
function detachedFrozen<T>(value: T): T {
  const copy = JSON.parse(JSON.stringify(value)) as T;
  const freeze = (item: unknown): void => {
    if (item && typeof item === 'object') { for (const child of Object.values(item)) freeze(child); Object.freeze(item); }
  };
  freeze(copy);
  return copy;
}
function world(local: Point, root: CandidateGeometrySample['root']): Point {
  const c = Math.cos(root.yawRad); const s = Math.sin(root.yawRad);
  return { x: local.x * c + local.z * s + root.position.x,
    y: local.y + root.position.y, z: -local.x * s + local.z * c + root.position.z };
}
function selected(sample: CandidateGeometrySample, regions: readonly string[]): Triangle[] {
  const result: Triangle[] = [];
  for (const mesh of [...sample.meshes].sort((a, b) => compare(a.meshId, b.meshId))) {
    const ids = new Set(regions.flatMap((region) => mesh.regions[region as keyof typeof mesh.regions]?.triangleIds ?? []));
    for (const triangleId of [...ids].sort((a, b) => a - b)) result.push({ sample, meshId: mesh.meshId, triangleId });
  }
  if (!result.length) throw new Error('Missing selected contact region');
  return result;
}
function triangleIds(item: Triangle): readonly [number, number, number] {
  const mesh = item.sample.meshes.find((entry) => entry.meshId === item.meshId);
  const ids = mesh?.triangles[item.triangleId];
  if (!ids || ids.length !== 3 || ids.some((id) => !Number.isInteger(id) || id < 0) ||
    new Set(ids).size !== 3) throw new TypeError('Invalid selected triangle IDs');
  return ids;
}
const key = (ids: readonly number[]) => [...ids].sort((a, b) => a - b).join(',');
const role = (meshId: string): 'body' | 'shell' | 'other' => {
  const name = meshId.slice(meshId.indexOf(':') + 1);
  return name === 'SuperHero_Male' ? 'body' : name === 'AuditionBoots' ? 'shell' : 'other';
};
function layerSelection(sample: CandidateGeometrySample, regions: readonly string[]) {
  const candidates = selected(sample, regions);
  const shells = new Map<string, Triangle[]>();
  for (const item of candidates.filter((entry) => role(entry.meshId) === 'shell')) {
    const id = key(triangleIds(item)); shells.set(id, [...(shells.get(id) ?? []), item]);
  }
  const bodies = new Map<string, Triangle[]>();
  for (const item of candidates.filter((entry) => role(entry.meshId) === 'body')) {
    const id = key(triangleIds(item)); bodies.set(id, [...(bodies.get(id) ?? []), item]);
  }
  let excludedBodyTriangles = 0; let unmatchedSkinTriangles = 0;
  const retained = candidates.filter((item) => {
    if (role(item.meshId) !== 'body') return true;
    const id = key(triangleIds(item)); const matching = shells.get(id);
    if (!matching) { unmatchedSkinTriangles += 1; return true; }
    if (matching.length !== 1 || bodies.get(id)?.length !== 1) throw new Error('Ambiguous duplicate body-shell correspondence');
    excludedBodyTriangles += 1; return false;
  });
  if (!retained.length) throw new Error('No retained layer triangles');
  return { retained, shells, counts: { selectedTriangles: candidates.length, excludedBodyTriangles,
    unmatchedSkinTriangles, retainedTriangles: retained.length } };
}
function fixedBinding(item: Triangle, barycentric: readonly number[]): ContactBinding {
  return { actorHandle: item.sample.actorHandle, meshId: item.meshId, triangleId: item.triangleId,
    vertexIds: [...triangleIds(item)] as [number, number, number],
    barycentric: [...barycentric] as [number, number, number] };
}
function evaluate(item: Triangle, barycentric: readonly number[]): Point {
  const mesh = item.sample.meshes.find((entry) => entry.meshId === item.meshId)!;
  const vertices = new Map(mesh.vertices.map((vertex) => [vertex.vertexId, vertex.position]));
  const ids = triangleIds(item);
  const point = { x: 0, y: 0, z: 0 };
  ids.forEach((id, index) => {
    const vertex = vertices.get(id);
    if (!vertex) throw new TypeError('Missing correspondence vertex');
    point.x += vertex.x * barycentric[index]!;
    point.y += vertex.y * barycentric[index]!;
    point.z += vertex.z * barycentric[index]!;
  });
  return world(point, item.sample.root);
}
function blocker(hit: SurfaceSegmentHit | null): Blocker {
  return hit ? { actorHandle: hit.witness.actorHandle, meshId: hit.witness.meshId,
    triangleId: hit.witness.triangleId, distance: hit.distance } : null;
}
function side(row: Row): RowSide {
  const anchors = Object.fromEntries(row.anchors.map((anchor) => [anchor.anchorId,
    { position: anchor.position, eyeAvailable: anchor.eye.candidateAvailable,
      cameraAvailable: anchor.camera.candidateAvailable,
      firstBlockers: { eye: blocker(anchor.eye.rawEyeHit), rawCamera: blocker(anchor.camera.rawCameraHit),
        nearClipped: blocker(anchor.camera.nearClippedHit) } }]));
  const contact = row.anchors.find((anchor) => anchor.anchorId === 'contactFoot');
  const challenger = row.anchors.find((anchor) => anchor.anchorId === 'challengerFoot');
  return { anchors, firstBlockers: Object.fromEntries(Object.entries(anchors)
    .map(([id, value]) => [id, value.firstBlockers])),
  contactSeparationM: contact && challenger ? distance(contact.position, challenger.position) : null,
  classification: row.classification };
}
export async function compareRiggedContactLayers(input: {
  geometrySampler: CalibrationGeometrySampler; compiledSource: CompiledSource;
  rendererInputFingerprint: string; historicalBaselineHashes: Readonly<Record<string, string>>;
}): Promise<{ comparison: RiggedContactLayerComparison; metrics: RiggedContactLayerMetrics }> {
  const started = performance.now();
  const names = ['bindings.json', 'metrics.json', 'report.json'];
  if (JSON.stringify(Object.keys(input.historicalBaselineHashes).sort(compare)) !== JSON.stringify(names) ||
    names.some((name) => !/^sha256:[a-f0-9]{64}$/.test(input.historicalBaselineHashes[name] ?? ''))) {
    throw new TypeError('Invalid historical baseline hash metadata');
  }
  const seed = await seedRiggedContactBindings(input);
  const baseline = await runRiggedCalibrationPilot({ ...input, bindings: seed.bindings });
  const attackerHandle = seed.bindings.attacker.actorHandle;
  const defenderHandle = seed.bindings.defender.actorHandle;
  const defenderSample = input.geometrySampler.sample(defenderHandle, 366);
  const attackerSample = input.geometrySampler.sample(attackerHandle, 366);
  const defender = layerSelection(defenderSample, ['leftBoot']);
  const attacker = layerSelection(attackerSample, ['leftBoot', 'leftShin']);
  const sourceBody = defenderSample.meshes.find((mesh) => mesh.meshId === seed.bindings.defender.meshId);
  const bodyItem = { sample: defenderSample, meshId: seed.bindings.defender.meshId,
    triangleId: seed.bindings.defender.triangleId };
  if (!sourceBody || role(bodyItem.meshId) !== 'body') throw new Error('Baseline defender witness is not body skin');
  const bodyIds = triangleIds(bodyItem);
  const shellMatches = defender.shells.get(key(bodyIds));
  if (!shellMatches || shellMatches.length !== 1) throw new Error('Missing or ambiguous baseline shell correspondence');
  const shellItem = shellMatches[0]!; const shellIds = triangleIds(shellItem);
  const shellBarycentric = shellIds.map((id) => seed.bindings.defender.barycentric[bodyIds.indexOf(id)]!);
  const bodyPosition = evaluate(bodyItem, seed.bindings.defender.barycentric);
  const shellPosition = evaluate(shellItem, shellBarycentric);
  const nearest = nearestSurfacePair(defender.retained, attacker.retained);
  const contact = input.compiledSource.canonicalSource.facts.contactGround;
  const alternativeBindings: RiggedContactBindings = { ...seed.bindings,
    defender: fixedBinding({ sample: defenderSample, meshId: nearest.a.meshId, triangleId: nearest.a.triangleId },
      nearest.a.barycentric),
    attacker: fixedBinding({ sample: attackerSample, meshId: nearest.b.meshId, triangleId: nearest.b.triangleId },
      nearest.b.barycentric),
    seedSeparationM: nearest.distance,
    seedDistanceToAuthoredContactM: { defender: distance(nearest.a.position, contact),
      attacker: distance(nearest.b.position, contact) } };
  const alternative = await runRiggedCalibrationPilot({ ...input, bindings: alternativeBindings });
  const beforeRows = baseline.report.rows; const afterRows = alternative.report.rows;
  if (beforeRows.length !== 92 || afterRows.length !== 92) throw new Error('Incomplete comparison matrix');
  let area = 0; let contactRows = 0;
  const rowDifferences = beforeRows.map((row, index) => {
    const after = afterRows[index]!;
    if (row.tick !== after.tick || row.evidenceId !== after.evidenceId || row.viewId !== after.viewId ||
      row.cameraMode !== after.cameraMode) throw new Error('Comparison row identity mismatch');
    if (row.evidenceId === 'EV-INSIDE-AREA') {
      area += 1;
      if (JSON.stringify(row) !== JSON.stringify(after)) throw new Error('Area row changed under contact layer comparison');
    } else if (row.evidenceId === 'EV-TRIP-CONTACT') contactRows += 1;
    return { tick: row.tick, evidenceId: row.evidenceId, viewId: row.viewId,
      cameraMode: row.cameraMode, baseline: side(row), alternative: side(after) };
  });
  if (area !== 60 || contactRows !== 32) throw new Error('Incomplete area or contact comparison');
  const comparison: RiggedContactLayerComparison = { purpose: 'local-rigged-contact-layer-comparison',
    historicalBaselineHashes: input.historicalBaselineHashes,
    baseline: { bindings: seed.bindings, report: baseline.report },
    alternative: { bindings: alternativeBindings, report: alternative.report },
    correspondence: { body: { meshId: bodyItem.meshId, triangleId: bodyItem.triangleId,
      vertexIds: bodyIds, barycentric: seed.bindings.defender.barycentric, position: bodyPosition },
    shell: { meshId: shellItem.meshId, triangleId: shellItem.triangleId, vertexIds: shellIds,
      barycentric: shellBarycentric, position: shellPosition },
    posedSeparationM: distance(bodyPosition, shellPosition) },
    selectionCounts: { defender: defender.counts, attacker: attacker.counts }, rowDifferences };
  const metrics: RiggedContactLayerMetrics = { baselineSeedPairProductCount: seed.metrics.seedPairProductCount,
    baselineSeedElapsedMs: seed.metrics.elapsedMs, baselinePilotTriangleCount: baseline.metrics.triangleCount,
    baselinePilotRayCastCount: baseline.metrics.rayCastCount, baselinePilotElapsedMs: baseline.metrics.elapsedMs,
    alternativePairProductCount: defender.retained.length * attacker.retained.length,
    alternativePilotTriangleCount: alternative.metrics.triangleCount,
    alternativePilotRayCastCount: alternative.metrics.rayCastCount, alternativePilotElapsedMs: alternative.metrics.elapsedMs,
    elapsedMs: performance.now() - started };
  return { comparison: detachedFrozen(comparison), metrics: detachedFrozen(metrics) };
}
