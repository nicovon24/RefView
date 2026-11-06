import type { NormalizedCoreSourceV2 } from "./source-core-v2";
import type { NormalizedRenderingV2 } from "./source-rendering-v2";
import type { NormalizedObservationSourceV2 } from "./source-observation-v2";

export type GeometryPointV2 = Readonly<{ x: number; y: number; z: number }>;
export type GeometryBoxV2 = Readonly<{ min: GeometryPointV2; max: GeometryPointV2 }>;
export type GeometryResolverV2 = Readonly<{
  sampleAttachment: (rigAssetId: string, clipAssetId: string, phaseQ: number,
    attachmentName: string) => GeometryPointV2 | undefined;
  sampleGeometryPart: (rigAssetId: string, clipAssetId: string, phaseQ: number,
    geometryPartName: string) => GeometryBoxV2 | undefined;
}>;

const TOLERANCE_M = 0.05;
const ENCLOSURE_EPSILON_M = 1e-9;
const MILESTONE_CAPTURE_TICKS = [120, 360, 366, 371, 480] as const;
const key = (evidenceId: string, id: string): string => `${evidenceId}\u0000${id}`;

function finitePoint(value: GeometryPointV2 | undefined, label: string): asserts value is GeometryPointV2 {
  if (!value || ![value.x, value.y, value.z].every((axis) => typeof axis === "number" && Number.isFinite(axis))) {
    throw new Error(`missing or invalid ${label}`);
  }
}

function actorWorldPoint(local: GeometryPointV2, position: GeometryPointV2, yawRad: number): GeometryPointV2 {
  const cos = Math.cos(yawRad);
  const sin = Math.sin(yawRad);
  return { x: position.x + cos * local.x + sin * local.z,
    y: position.y + local.y, z: position.z - sin * local.x + cos * local.z };
}

function sampledWorldBox(local: GeometryBoxV2 | undefined, position: GeometryPointV2,
  yawRad: number): GeometryBoxV2 {
  if (!local) throw new Error("missing geometry part");
  finitePoint(local.min, "geometry part min");
  finitePoint(local.max, "geometry part max");
  if (local.min.x >= local.max.x || local.min.y >= local.max.y || local.min.z >= local.max.z) {
    throw new Error("invalid geometry part extent");
  }
  const corners = [local.min.x, local.max.x].flatMap((x) =>
    [local.min.y, local.max.y].flatMap((y) =>
      [local.min.z, local.max.z].map((z) => actorWorldPoint({ x, y, z }, position, yawRad))));
  return { min: { x: Math.min(...corners.map((p) => p.x)),
    y: Math.min(...corners.map((p) => p.y)), z: Math.min(...corners.map((p) => p.z)) },
  max: { x: Math.max(...corners.map((p) => p.x)),
    y: Math.max(...corners.map((p) => p.y)), z: Math.max(...corners.map((p) => p.z)) } };
}

function actorAt(core: NormalizedCoreSourceV2, tick: number, actorId: string) {
  const sample = core.timeline.samples.find((item) => item.tick === tick);
  if (!sample) throw new Error(`missing canonical sample at tick ${tick}`);
  const actor = sample.actors.find((item) => item.actorId === actorId);
  if (!actor) throw new Error(`unknown actor ${actorId} at tick ${tick}`);
  return actor;
}

function bindingFor(rendering: NormalizedRenderingV2, actorId: string, clipId: string) {
  const binding = rendering.actorBindings.find((item) => item.actorId === actorId);
  if (!binding || !binding.clipAssetIds.includes(clipId)) throw new Error(`unknown actor/clip binding ${actorId}`);
  const rig = rendering.assets.find((item) => item.assetId === binding.rigAssetId);
  if (!rig) throw new Error(`missing rig asset for actor ${actorId}`);
  return { binding, rig };
}

function comparePoint(actual: GeometryPointV2, expected: GeometryPointV2, label: string): void {
  finitePoint(actual, label);
  finitePoint(expected, label);
  if (["x", "y", "z"].some((axis) =>
    Math.abs(actual[axis as keyof GeometryPointV2] - expected[axis as keyof GeometryPointV2]) > TOLERANCE_M)) {
    throw new Error(`${label} correspondence mismatch`);
  }
}

function compareBox(authored: GeometryBoxV2, sampled: GeometryBoxV2, label: string): void {
  finitePoint(authored.min, `${label} min`);
  finitePoint(authored.max, `${label} max`);
  for (const axis of ["x", "y", "z"] as const) {
    if (Math.abs(authored.min[axis] - sampled.min[axis]) > TOLERANCE_M ||
        Math.abs(authored.max[axis] - sampled.max[axis]) > TOLERANCE_M ||
        authored.min[axis] > sampled.min[axis] + ENCLOSURE_EPSILON_M ||
        authored.max[axis] < sampled.max[axis] - ENCLOSURE_EPSILON_M) {
      throw new Error(`${label} correspondence mismatch`);
    }
  }
}

export function verifyGeometryCorrespondenceV2(
  core: NormalizedCoreSourceV2, rendering: NormalizedRenderingV2,
  source: NormalizedObservationSourceV2, resolver: GeometryResolverV2,
): Readonly<{ checkedTicks: readonly number[]; requiredCaptureTicks: readonly number[] }> {
  const anchorBindings = new Map(source.geometryBindings.anchors.map((item) => [key(item.evidenceId, item.anchorId), item]));
  const occluderBindings = new Map(source.geometryBindings.occluders.map((item) => [key(item.evidenceId, item.boxId), item]));
  const checkedTicks = new Set<number>();
  const usedAnchors = new Set<string>();
  const usedOccluders = new Set<string>();
  for (const evidence of source.observation.evidence) {
    if (evidence.samples.length !== evidence.toTick - evidence.fromTick + 1) throw new Error("missing evidence sample");
    const samples = new Map(evidence.samples.map((item) => [item.tick, item]));
    if (samples.size !== evidence.samples.length) throw new Error("duplicate evidence sample");
    for (let tick = evidence.fromTick; tick <= evidence.toTick; tick++) {
      const sample = samples.get(tick);
      if (!sample) throw new Error(`missing evidence sample at tick ${tick}`);
      const canonical = core.timeline.samples.find((item) => item.tick === tick);
      if (!canonical) throw new Error(`missing canonical sample at tick ${tick}`);
      checkedTicks.add(tick);
      for (const anchor of sample.anchors) {
        const bindingKey = key(evidence.evidenceId, anchor.anchorId);
        const binding = anchorBindings.get(bindingKey);
        if (!binding) throw new Error(`missing anchor binding ${bindingKey}`);
        usedAnchors.add(bindingKey);
        const target = binding.target;
        let expected: GeometryPointV2;
        if (target.kind === "ballCenter") expected = canonical.ball.position;
        else if (target.kind === "fieldPoint") expected = { x: target.xM, y: 0, z: 36 };
        else {
          const actor = actorAt(core, tick, target.actorId);
          const { binding: actorBinding, rig } = bindingFor(rendering, target.actorId, actor.clipId);
          if (!rig.attachmentNames.includes(target.attachmentName)) throw new Error("unknown attachment binding");
          const local = resolver.sampleAttachment(actorBinding.rigAssetId, actor.clipId, actor.phaseQ,
            target.attachmentName);
          finitePoint(local, "attachment");
          expected = actorWorldPoint(local, actor.position, actor.yawRad);
        }
        comparePoint(anchor.position, expected, `anchor ${bindingKey}`);
      }
      for (const box of sample.occluders) {
        const bindingKey = key(evidence.evidenceId, box.boxId);
        const binding = occluderBindings.get(bindingKey);
        if (!binding) throw new Error(`missing occluder binding ${bindingKey}`);
        usedOccluders.add(bindingKey);
        const actor = actorAt(core, tick, binding.actorId);
        const { binding: actorBinding, rig } = bindingFor(rendering, binding.actorId, actor.clipId);
        if (!rig.geometryPartNames.includes(binding.geometryPartName)) throw new Error("unknown geometry part binding");
        const local = resolver.sampleGeometryPart(actorBinding.rigAssetId, actor.clipId, actor.phaseQ,
          binding.geometryPartName);
        const expected = sampledWorldBox(local, actor.position, actor.yawRad);
        compareBox(box, expected, `occluder ${bindingKey}`);
      }
    }
  }
  if (usedAnchors.size !== anchorBindings.size || usedOccluders.size !== occluderBindings.size) {
    throw new Error("unused geometry binding");
  }
  return Object.freeze({
    checkedTicks: Object.freeze([...checkedTicks].sort((a, b) => a - b)),
    requiredCaptureTicks: Object.freeze([...new Set([...MILESTONE_CAPTURE_TICKS, ...checkedTicks])]
      .sort((a, b) => a - b)),
  });
}
