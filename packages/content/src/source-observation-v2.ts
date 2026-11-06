import { z } from "zod";
import { canonicalJsonV2 } from "./source-core-v2";

const id = z.string().min(1);
const finite = z.number().finite();
const tick = z.number().int().min(0).max(480);
const vector = z.strictObject({ x: finite, y: finite, z: finite });
const box = z.strictObject({ boxId: id, min: vector, max: vector });
const anchor = z.strictObject({ anchorId: id, position: vector });
const sample = z.strictObject({ tick, anchors: z.array(anchor).min(1), occluders: z.array(box) });
const evidence = z.strictObject({ evidenceId: id, fromTick: tick, toTick: tick,
  requiredAnchorIds: z.array(id).min(1), samples: z.array(sample).min(1) });
const observationSchema = z.strictObject({ visibilityModelVersion: z.literal(1), cameraRigVersion: z.literal(1),
  eyeCalibrationVersion: z.literal(1), cameraColliders: z.array(box), evidence: z.array(evidence).min(1) });
const anchorBinding = z.strictObject({ evidenceId: id, anchorId: id, target: z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("actorAttachment"), actorId: id, attachmentName: id }),
  z.strictObject({ kind: z.literal("ballCenter") }),
  z.strictObject({ kind: z.literal("fieldPoint"), feature: z.literal("nearPenaltyAreaLine"),
    xM: finite.min(-20.16).max(20.16) }),
]) });
const occluderBinding = z.strictObject({ evidenceId: id, boxId: id, actorId: id, geometryPartName: id });
const bindingsSchema = z.strictObject({ anchors: z.array(anchorBinding), occluders: z.array(occluderBinding) });

export type NormalizedObservationSourceV2 = Readonly<{
  observation: z.infer<typeof observationSchema>;
  geometryBindings: z.infer<typeof bindingsSchema>;
}>;

function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${label}`);
}
function orderedBox(value: z.infer<typeof box>): void {
  if (value.min.x >= value.max.x || value.min.y >= value.max.y || value.min.z >= value.max.z) {
    throw new RangeError("box must have positive extent");
  }
}
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Normalizes private C1 geometry before the full source compiler binds its derived content hash. */
export function normalizeObservationSourceV2(
  observationInput: unknown,
  geometryBindingsInput: unknown,
  rigNames: ReadonlyMap<string, Readonly<{ attachments: readonly string[]; parts: readonly string[] }>>,
): NormalizedObservationSourceV2 {
  const observation = observationSchema.parse(JSON.parse(canonicalJsonV2(observationInput)));
  const geometryBindings = bindingsSchema.parse(JSON.parse(canonicalJsonV2(geometryBindingsInput)));
  unique(observation.evidence.map((item) => item.evidenceId), "evidence ID");
  unique(observation.cameraColliders.map((item) => item.boxId), "camera collider ID");
  observation.cameraColliders.forEach(orderedBox);
  observation.cameraColliders.sort((a, b) => compare(a.boxId, b.boxId));
  const requiredAnchors = new Set<string>();
  const requiredOccluders = new Set<string>();
  for (const item of observation.evidence) {
    if (item.fromTick > item.toTick || item.samples.length !== item.toTick - item.fromTick + 1) {
      throw new Error("incomplete evidence window");
    }
    unique(item.requiredAnchorIds, "required anchor ID");
    unique(item.samples.map((entry) => String(entry.tick)), "evidence sample tick");
    item.requiredAnchorIds.sort(compare);
    item.samples.sort((a, b) => a.tick - b.tick);
    for (let index = 0; index < item.samples.length; index++) {
      const entry = item.samples[index]!;
      if (entry.tick !== item.fromTick + index) throw new Error("missing evidence sample tick");
      unique(entry.anchors.map((point) => point.anchorId), "anchor ID");
      unique(entry.occluders.map((part) => part.boxId), "occluder ID");
      if (entry.anchors.length !== item.requiredAnchorIds.length ||
        entry.anchors.some((point) => !item.requiredAnchorIds.includes(point.anchorId))) {
        throw new Error("missing required evidence anchor");
      }
      entry.anchors.sort((a, b) => compare(a.anchorId, b.anchorId));
      entry.occluders.forEach(orderedBox);
      entry.occluders.sort((a, b) => compare(a.boxId, b.boxId));
      for (const point of entry.anchors) requiredAnchors.add(`${item.evidenceId}\u0000${point.anchorId}`);
      for (const part of entry.occluders) requiredOccluders.add(`${item.evidenceId}\u0000${part.boxId}`);
    }
  }
  const anchors = geometryBindings.anchors;
  const occluders = geometryBindings.occluders;
  const anchorKeys = anchors.map((item) => `${item.evidenceId}\u0000${item.anchorId}`);
  const occluderKeys = occluders.map((item) => `${item.evidenceId}\u0000${item.boxId}`);
  unique(anchorKeys, "geometry anchor binding");
  unique(occluderKeys, "geometry occluder binding");
  if (requiredAnchors.size !== anchorKeys.length || anchorKeys.some((key) => !requiredAnchors.has(key)) ||
    requiredOccluders.size !== occluderKeys.length || occluderKeys.some((key) => !requiredOccluders.has(key))) {
    throw new Error("geometry binding/sample mismatch");
  }
  for (const item of anchors) {
    if (item.target.kind === "actorAttachment" &&
      !rigNames.get(item.target.actorId)?.attachments.includes(item.target.attachmentName)) {
      throw new Error("unknown rig attachment");
    }
  }
  for (const item of occluders) {
    if (!rigNames.get(item.actorId)?.parts.includes(item.geometryPartName)) {
      throw new Error("unknown rig geometry part");
    }
  }
  observation.evidence.sort((a, b) => compare(a.evidenceId, b.evidenceId));
  anchors.sort((a, b) => compare(`${a.evidenceId}\u0000${a.anchorId}`, `${b.evidenceId}\u0000${b.anchorId}`));
  occluders.sort((a, b) => compare(`${a.evidenceId}\u0000${a.boxId}`, `${b.evidenceId}\u0000${b.boxId}`));
  return freeze({ observation, geometryBindings });
}
