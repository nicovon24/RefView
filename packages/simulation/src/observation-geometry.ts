import type { TimelineFixture, Vec3m } from "@refview/domain";

export type Box = { boxId: string; min: Vec3m; max: Vec3m };
export type ObservationFixtureInput = {
  ref: { scenarioId: string; version: number }; scenarioContentHash: string; durationTicks: number;
  visibilityModelVersion: number; cameraRigVersion: number; eyeCalibrationVersion: number;
  cameraColliders: Box[];
  evidence: Array<{ evidenceId: string; fromTick: number; toTick: number; requiredAnchorIds: string[];
    samples: Array<{ tick: number; anchors: Array<{ anchorId: string; position: Vec3m }>; occluders: Box[] }> }>;
};
type FrozenBox = Readonly<{ boxId: string; min: Readonly<Vec3m>; max: Readonly<Vec3m> }>;
type FrozenEvidence = Readonly<{ evidenceId: string; fromTick: number; toTick: number; requiredAnchorIds: readonly string[];
  samples: readonly Readonly<{ tick: number; anchors: readonly Readonly<{ anchorId: string; position: Readonly<Vec3m> }>[]; occluders: readonly FrozenBox[] }>[] }>;
export type ObservationFixture = Readonly<{ ref: Readonly<{ scenarioId: string; version: number }>; scenarioContentHash: string; durationTicks: number;
  visibilityModelVersion: 1; cameraRigVersion: 1; eyeCalibrationVersion: 1; cameraColliders: readonly FrozenBox[]; evidence: readonly FrozenEvidence[] }>;
export type ViewSample = { tick: number; refereePosition: Vec3m; lookYaw: number; lookPitch: number;
  cameraMode: "firstPerson" | "thirdPerson"; cameraDistanceM: number; cameraLateralOffsetM: number;
  viewportAspectRatio: number; verticalFovRad: number };
export type Viewpoint = Readonly<{ position: Readonly<Vec3m>; forward: Readonly<Vec3m>; right: Readonly<Vec3m>; up: Readonly<Vec3m> }>;

function finite(n: number, label: string): number {
  if (!Number.isFinite(n)) throw new RangeError(`${label} must be finite`);
  return Object.is(n, -0) ? 0 : n;
}
function range(n: number, min: number, max: number, label: string): number {
  finite(n, label);
  if (n < min || n > max) throw new RangeError(`${label} outside ${min}..${max}`);
  return n;
}
function integer(n: number, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(n)) throw new RangeError(`${label} must be a safe integer`);
  return range(n, min, max, label);
}
function id(s: string, label: string): string {
  if (typeof s !== "string" || s.length === 0) throw new TypeError(`${label} must be nonempty`);
  return s;
}
function vec(v: Vec3m): Readonly<Vec3m> {
  return Object.freeze({ x: finite(v.x, "x"), y: finite(v.y, "y"), z: finite(v.z, "z") });
}
function boxes(values: Box[]): readonly FrozenBox[] {
  const seen = new Set<string>();
  return Object.freeze(values.map((value) => {
    id(value.boxId, "boxId");
    if (seen.has(value.boxId)) throw new Error(`duplicate box ID ${value.boxId}`);
    seen.add(value.boxId);
    const min = vec(value.min), max = vec(value.max);
    if (min.x >= max.x || min.y >= max.y || min.z >= max.z) throw new RangeError("box must have positive extent");
    return Object.freeze({ boxId: value.boxId, min, max });
  }).sort((a, b) => a.boxId < b.boxId ? -1 : a.boxId > b.boxId ? 1 : 0));
}
export function createObservationFixture(input: ObservationFixtureInput, timeline: TimelineFixture, expectedHash: string): ObservationFixture {
  id(input.ref.scenarioId, "scenarioId");
  integer(input.ref.version, 1, Number.MAX_SAFE_INTEGER, "scenario version");
  if (input.ref.scenarioId !== timeline.ref.scenarioId || input.ref.version !== timeline.ref.version) throw new Error("scenario ref mismatch");
  if (input.durationTicks !== timeline.durationTicks) throw new Error("duration mismatch");
  integer(input.durationTicks, 0, Number.MAX_SAFE_INTEGER, "durationTicks");
  if (!/^sha256:[0-9a-f]{64}$/.test(input.scenarioContentHash) || input.scenarioContentHash !== expectedHash) throw new Error("scenario hash mismatch");
  for (const name of ["visibilityModelVersion", "cameraRigVersion", "eyeCalibrationVersion"] as const) {
    if (input[name] !== 1) throw new RangeError(`unsupported ${name}`);
  }
  const evidenceIds = new Set<string>();
  const evidence = input.evidence.map((entry): FrozenEvidence => {
    id(entry.evidenceId, "evidenceId");
    if (evidenceIds.has(entry.evidenceId)) throw new Error(`duplicate evidence ID ${entry.evidenceId}`);
    evidenceIds.add(entry.evidenceId);
    integer(entry.fromTick, 0, input.durationTicks, "fromTick");
    integer(entry.toTick, entry.fromTick, input.durationTicks, "toTick");
    if (entry.requiredAnchorIds.length < 1) throw new Error("evidence requires anchors");
    const required = new Set<string>();
    for (const anchorId of entry.requiredAnchorIds) {
      id(anchorId, "anchorId");
      if (required.has(anchorId)) throw new Error(`duplicate required anchor ID ${anchorId}`);
      required.add(anchorId);
    }
    if (entry.samples.length !== entry.toTick - entry.fromTick + 1) throw new Error("incomplete evidence samples");
    const ticks = new Set<number>();
    const samples = entry.samples.map((sample) => {
      integer(sample.tick, entry.fromTick, entry.toTick, "evidence sample tick");
      if (ticks.has(sample.tick)) throw new Error(`duplicate evidence sample tick ${sample.tick}`);
      ticks.add(sample.tick);
      const anchorIds = new Set<string>();
      const anchors = sample.anchors.map((anchor) => {
        id(anchor.anchorId, "anchorId");
        if (!required.has(anchor.anchorId) || anchorIds.has(anchor.anchorId)) throw new Error(`invalid anchor ID ${anchor.anchorId}`);
        anchorIds.add(anchor.anchorId);
        return Object.freeze({ anchorId: anchor.anchorId, position: vec(anchor.position) });
      }).sort((a, b) => a.anchorId < b.anchorId ? -1 : a.anchorId > b.anchorId ? 1 : 0);
      if (anchorIds.size !== required.size) throw new Error("missing required anchor");
      return Object.freeze({ tick: sample.tick, anchors: Object.freeze(anchors), occluders: boxes(sample.occluders) });
    }).sort((a, b) => a.tick - b.tick);
    return Object.freeze({ evidenceId: entry.evidenceId, fromTick: entry.fromTick, toTick: entry.toTick,
      requiredAnchorIds: Object.freeze([...required].sort()), samples: Object.freeze(samples) });
  }).sort((a, b) => a.evidenceId < b.evidenceId ? -1 : a.evidenceId > b.evidenceId ? 1 : 0);
  return Object.freeze({ ref: Object.freeze({ ...input.ref }), scenarioContentHash: input.scenarioContentHash,
    durationTicks: input.durationTicks, visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
    cameraColliders: boxes(input.cameraColliders), evidence: Object.freeze(evidence) });
}

const add = (a: Vec3m, b: Vec3m): Vec3m => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: Vec3m, b: Vec3m): Vec3m => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scale = (a: Vec3m, s: number): Vec3m => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const dot = (a: Vec3m, b: Vec3m): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3m, b: Vec3m): Vec3m => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const length = (a: Vec3m): number => Math.hypot(a.x, a.y, a.z);
const normal = (a: Vec3m): Vec3m => scale(a, 1 / length(a));
const worldUp: Vec3m = { x: 0, y: 1, z: 0 };

function entrySegment(start: Vec3m, end: Vec3m, box: FrozenBox): { entry: number; exit: number; inside: boolean } | null {
  const delta = sub(end, start);
  let entry = 0, exit = 1;
  const inside = start.x > box.min.x && start.x < box.max.x && start.y > box.min.y && start.y < box.max.y && start.z > box.min.z && start.z < box.max.z;
  for (const axis of ["x", "y", "z"] as const) {
    if (delta[axis] === 0) {
      if (start[axis] <= box.min[axis] || start[axis] >= box.max[axis]) return null;
    } else {
      const a = (box.min[axis] - start[axis]) / delta[axis];
      const b = (box.max[axis] - start[axis]) / delta[axis];
      entry = Math.max(entry, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (entry >= exit) return null;
    }
  }
  return { entry, exit, inside };
}
export function validateView(sample: ViewSample, duration: number): void {
  integer(sample.tick, 0, duration, "view tick");
  const position = vec(sample.refereePosition);
  if (position.y !== 0) throw new RangeError("referee ground y must be zero");
  finite(sample.lookYaw, "lookYaw");
  range(sample.lookPitch, -1.2, 1.2, "lookPitch");
  if (sample.cameraMode !== "firstPerson" && sample.cameraMode !== "thirdPerson") throw new TypeError("invalid cameraMode");
  range(sample.cameraDistanceM, 2, 8, "cameraDistanceM");
  range(sample.cameraLateralOffsetM, -3, 3, "cameraLateralOffsetM");
  range(sample.viewportAspectRatio, 0.75, 2.5, "viewportAspectRatio");
  range(sample.verticalFovRad, 0.785, 1.31, "verticalFovRad");
}
export function reconstructViewpoints(fixture: ObservationFixture, sample: ViewSample): Readonly<{ eye: Viewpoint; camera: Viewpoint }> {
  validateView(sample, fixture.durationTicks);
  const yaw = sample.lookYaw, pitch = sample.lookPitch;
  const forward = vec({ x: Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: Math.cos(yaw) * Math.cos(pitch) });
  const right = vec({ x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) });
  const position = vec(add(sample.refereePosition, { x: 0, y: 1.7, z: 0 }));
  const eye: Viewpoint = Object.freeze({ position, forward, right, up: vec(cross(forward, right)) });
  if (sample.cameraMode === "firstPerson") return Object.freeze({ eye, camera: eye });
  const horizontal = { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) };
  const desired = add(add(sub(position, scale(horizontal, sample.cameraDistanceM)), scale(right, sample.cameraLateralOffsetM)), { x: 0, y: 0.4, z: 0 });
  const travel = sub(desired, position), travelLength = length(travel);
  let cameraPosition = desired;
  for (const box of fixture.cameraColliders) {
    const hit = entrySegment(position, desired, box);
    if (hit?.inside) { cameraPosition = position; break; }
    if (hit && hit.entry * travelLength < length(sub(cameraPosition, position))) {
      cameraPosition = add(position, scale(travel, Math.max(0, hit.entry * travelLength - 0.1) / travelLength));
    }
  }
  const viewForward = vec(normal(sub(add(position, scale(forward, 10)), cameraPosition)));
  const cameraRight = vec(normal(cross(worldUp, viewForward)));
  const camera: Viewpoint = Object.freeze({ position: vec(cameraPosition), forward: viewForward, right: cameraRight, up: vec(cross(viewForward, cameraRight)) });
  return Object.freeze({ eye, camera });
}

function readable(anchor: Vec3m, viewpoint: Viewpoint, halfHorizontal: number, halfVertical: number, occluders: readonly FrozenBox[]): boolean {
  const ray = sub(anchor, viewpoint.position), distance = length(ray);
  if (distance > 30 || distance <= 0) return false;
  const forward = dot(ray, viewpoint.forward);
  if (forward <= 0) return false;
  const horizontal = Math.abs(Math.atan2(dot(ray, viewpoint.right), forward));
  const vertical = Math.abs(Math.atan2(dot(ray, viewpoint.up), forward));
  const epsilon = 1e-12;
  if (horizontal > Math.min(halfHorizontal, Math.PI / 6) + epsilon || vertical > Math.min(halfVertical, 25 * Math.PI / 180) + epsilon) return false;
  for (const box of occluders) {
    const hit = entrySegment(viewpoint.position, anchor, box);
    if (hit && hit.exit * distance > 0.001 && hit.entry * distance < distance - 0.001) return false;
  }
  return true;
}
export function measureEvidenceAtTick(fixture: ObservationFixture, evidenceId: string, tick: number, sample: ViewSample): Readonly<{
  evidenceId: string; tick: number; classification: "joint" | "cameraOnly" | "eyeOnly" | "neither";
  eyeReadable: boolean; cameraReadable: boolean }> {
  integer(tick, 0, fixture.durationTicks, "queried tick");
  if (sample.tick !== tick) throw new Error("view tick mismatch");
  const evidence = fixture.evidence.find((entry) => entry.evidenceId === evidenceId);
  if (!evidence) throw new Error(`unknown evidence ID ${evidenceId}`);
  if (tick < evidence.fromTick || tick > evidence.toTick) throw new RangeError("tick outside evidence window");
  const { eye, camera } = reconstructViewpoints(fixture, sample);
  const geometry = evidence.samples[tick - evidence.fromTick]!;
  const eyeReadable = geometry.anchors.every((anchor) => readable(anchor.position, eye, 55 * Math.PI / 180, Math.PI / 4, geometry.occluders));
  const cameraReadable = geometry.anchors.every((anchor) => readable(anchor.position, camera,
    Math.atan(Math.tan(sample.verticalFovRad / 2) * sample.viewportAspectRatio), sample.verticalFovRad / 2, geometry.occluders));
  const classification = eyeReadable ? cameraReadable ? "joint" : "eyeOnly" : cameraReadable ? "cameraOnly" : "neither";
  return Object.freeze({ evidenceId, tick, classification, eyeReadable, cameraReadable });
}
