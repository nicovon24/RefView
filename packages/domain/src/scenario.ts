import { createTimelineFixture, type ActorSample, type TimelineFixture, type TimelineFixtureInput } from "./timeline";

export type ScenarioRef = Readonly<{ scenarioId: string; version: number }>;
export type ScenarioHash = `sha256:${string}`;
export type FieldGeometry = Readonly<{
  lengthM: 105; widthM: 68; goalWidthM: 7.32; penaltyAreaDepthM: 16.5;
  penaltyAreaExtraWidthEachSideM: 16.5; lineWidthM: 0.12;
  attackDirection: "positiveZ" | "negativeZ";
}>;
export type DecisionGate = Readonly<{ opensAtTick: number; closesAtTick: number; forcePauseAtTick: number }>;
export type ScenarioRole = "mainReferee" | "assistantReferee" | "var";
export type PublicCue = Readonly<{
  cueId: string; tick: number; ordinal: number; kind: "animationCue" | "audioCue"; assetId: string;
}>;
export type PublicDecisionOption = Readonly<{
  optionId: string; kind: "stopPlay" | "restart" | "discipline";
  value: boolean | "playOn" | "penaltyKick" | "directFreeKick" | "indirectFreeKick" | "droppedBall"
    | "none" | "yellow" | "red";
}>;
export type PrivateReview = Readonly<{
  facts: Readonly<Record<string, unknown>>;
  evidence: readonly Readonly<Record<string, unknown>>[];
  rubric: Readonly<Record<string, unknown>>;
}>;
export type AssetBinding = Readonly<{
  assetId: string; fingerprint: ScenarioHash; licenseRef: string;
}>;
export type ScenarioInput = {
  schemaVersion: 1; ref: ScenarioRef; contentHash: ScenarioHash;
  classification: "clear" | "interpretative" | "inconclusive";
  lawsEdition: "IFAB-2026-27"; competitionProfileId: string;
  field: FieldGeometry; decisionGate: DecisionGate; supportedRoles: ScenarioRole[];
  timeline: TimelineFixtureInput; cues: PublicCue[]; decisionOptions: PublicDecisionOption[];
  assetRegistry: AssetBinding[];
  privateReview: PrivateReview;
};
export type PlayableScenario = Readonly<{
  ref: ScenarioRef; contentHash: ScenarioHash; field: FieldGeometry;
  durationTicks: number; tickRateHz: 60; decisionGate: DecisionGate; role: ScenarioRole;
  actors: readonly Readonly<{ tick: number; actors: readonly Readonly<ActorSample>[] }>[];
  ball: readonly Readonly<{ tick: number; ball: TimelineFixtureInput["samples"][number]["ball"] }>[];
  cues: readonly PublicCue[]; decisionOptions: readonly PublicDecisionOption[];
  lawsEdition: "IFAB-2026-27";
}>;
export type Scenario = Readonly<{
  ref: ScenarioRef; contentHash: ScenarioHash; timeline: TimelineFixture;
  privateReview: PrivateReview; assetRegistry: readonly AssetBinding[];
  resolveActorHandle(handle: string): string;
  publicActorHandle(canonicalId: string): string;
  playable(role: ScenarioRole): PlayableScenario;
}>;
const SCENARIO_KEYS = ["schemaVersion", "ref", "contentHash", "classification", "lawsEdition",
  "competitionProfileId", "field", "decisionGate", "supportedRoles", "timeline", "cues",
  "decisionOptions", "assetRegistry", "privateReview"] as const;

function exact(value: object, keys: readonly string[], name: string): void {
  if (Object.keys(value).sort().join("|") !== [...keys].sort().join("|"))
    throw new TypeError(`${name} has invalid fields`);
}
function integer(value: number, min: number, max: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new RangeError(`${name} out of bounds`);
}
function opaque(value: string, pattern: RegExp, name: string): void {
  if (typeof value !== "string" || !pattern.test(value)) throw new TypeError(`invalid ${name}`);
}
function privateCopy(value: unknown): unknown {
  if (Array.isArray(value)) return Object.freeze(value.map(privateCopy));
  if (value && typeof value === "object") {
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
      throw new TypeError("private review must contain plain data");
    const copy: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const [key, child] of Object.entries(value))
      Object.defineProperty(copy, key, { value: privateCopy(child), enumerable: true });
    return Object.freeze(copy);
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new TypeError("nonfinite private value");
  if (!["string", "number", "boolean"].includes(typeof value) && value !== null)
    throw new TypeError("private review must contain JSON data");
  return value;
}
function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;
function rightRotate(value: number, count: number): number {
  return (value >>> count) | (value << (32 - count));
}
function sha256(bytes: Uint8Array): string {
  const bitLength = BigInt(bytes.length) * 8n;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const data = new Uint8Array(paddedLength);
  data.set(bytes);
  data[bytes.length] = 0x80;
  const view = new DataView(data.buffer);
  view.setUint32(paddedLength - 8, Number((bitLength >> 32n) & 0xffffffffn));
  view.setUint32(paddedLength - 4, Number(bitLength & 0xffffffffn));
  const state = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = new Uint32Array(64);
    for (let index = 0; index < 16; index++) words[index] = view.getUint32(offset + index * 4);
    for (let index = 16; index < 64; index++) {
      const x = words[index - 15]!;
      const y = words[index - 2]!;
      words[index] = (words[index - 16]! + (rightRotate(x, 7) ^ rightRotate(x, 18) ^ (x >>> 3))
        + words[index - 7]! + (rightRotate(y, 17) ^ rightRotate(y, 19) ^ (y >>> 10))) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = state as [number, number, number, number, number, number, number, number];
    for (let index = 0; index < 64; index++) {
      const t1 = (h + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & f) ^ (~e & g)) + SHA256_K[index]! + words[index]!) >>> 0;
      const t2 = ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    state[0] = (state[0]! + a) >>> 0; state[1] = (state[1]! + b) >>> 0;
    state[2] = (state[2]! + c) >>> 0; state[3] = (state[3]! + d) >>> 0;
    state[4] = (state[4]! + e) >>> 0; state[5] = (state[5]! + f) >>> 0;
    state[6] = (state[6]! + g) >>> 0; state[7] = (state[7]! + h) >>> 0;
  }
  return state.map((word) => word!.toString(16).padStart(8, "0")).join("");
}
function canonicalJson(value: unknown, seen: Set<object> = new Set()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("nonfinite scenario content");
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== "object") throw new TypeError("non-JSON scenario content");
  if (seen.has(value)) throw new TypeError("cyclic scenario content");
  seen.add(value);
  if (Array.isArray(value)) {
    const keys = Reflect.ownKeys(value);
    if (keys.length !== value.length + 1 || keys.some((key) => typeof key !== "string")
      || !keys.includes("length")) throw new TypeError("invalid scenario array properties");
    for (let index = 0; index < value.length; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !Object.hasOwn(descriptor, "value") || !descriptor.enumerable)
        throw new TypeError("sparse or accessor scenario array");
    }
    const copy = value.map((child) => canonicalJson(child, seen));
    seen.delete(value);
    return copy;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
    throw new TypeError("scenario content must be plain JSON data");
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string") || ownKeys.length !== Object.keys(value).length)
    throw new TypeError("hidden or symbol scenario content");
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort(compareCodeUnits)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, "value") || !descriptor.enumerable)
      throw new TypeError("accessor scenario content");
    Object.defineProperty(copy, key, { value: canonicalJson(descriptor.value, seen),
      enumerable: true, writable: true, configurable: true });
  }
  seen.delete(value);
  return copy;
}
function normalizeEvidence(evidence: readonly Readonly<Record<string, unknown>>[]): unknown[] {
  const ids = new Set<string>();
  return evidence.map((item) => {
    if (typeof item.evidenceId !== "string" || !item.evidenceId || ids.has(item.evidenceId))
      throw new Error("invalid or duplicate evidence ID");
    ids.add(item.evidenceId);
    if (!Object.hasOwn(item, "samples")) return item;
    if (!Array.isArray(item.samples)) throw new TypeError("evidence samples must be an array");
    const ticks = new Set<number>();
    const samples = [...item.samples].sort((a, b) => (a as { tick: number }).tick - (b as { tick: number }).tick);
    for (const sample of samples) {
      const tick = (sample as { tick: number }).tick;
      if (!Number.isSafeInteger(tick) || tick < 0 || ticks.has(tick))
        throw new Error("invalid or duplicate evidence sample tick");
      ticks.add(tick);
    }
    return { ...item, samples };
  }).sort((a, b) => compareCodeUnits(a.evidenceId as string, b.evidenceId as string));
}

/** Hashes the complete v1 source represented by ScenarioInput, excluding publication metadata. */
export function deriveScenarioContentHash(input: ScenarioInput): ScenarioHash {
  canonicalJson(input);
  exact(input, SCENARIO_KEYS, "scenario");
  exact(input.timeline, ["ref", "durationTicks", "samples", "events"], "timeline");
  exact(input.privateReview, ["facts", "evidence", "rubric"], "private review");
  const source = {
    schemaVersion: input.schemaVersion, ref: input.ref, classification: input.classification,
    lawsEdition: input.lawsEdition, competitionProfileId: input.competitionProfileId,
    field: input.field, decisionGate: input.decisionGate, supportedRoles: input.supportedRoles,
    timeline: { ref: input.timeline.ref, durationTicks: input.timeline.durationTicks,
      samples: [...input.timeline.samples].sort((a, b) => a.tick - b.tick).map((sample) => ({
        ...sample, actors: [...sample.actors].sort((a, b) => compareCodeUnits(a.actorId, b.actorId)),
      })),
      events: [...input.timeline.events].sort((a, b) => a.tick - b.tick || a.ordinal - b.ordinal
        || compareCodeUnits(a.eventId, b.eventId)) },
    cues: [...input.cues].sort((a, b) => a.tick - b.tick || a.ordinal - b.ordinal
      || compareCodeUnits(a.cueId, b.cueId)),
    decisionOptions: [...input.decisionOptions].sort((a, b) => compareCodeUnits(a.optionId, b.optionId)),
    assetRegistry: [...input.assetRegistry].sort((a, b) => compareCodeUnits(a.assetId, b.assetId)),
    privateReview: { facts: input.privateReview.facts,
      evidence: normalizeEvidence(input.privateReview.evidence), rubric: input.privateReview.rubric },
  };
  const bytes = JSON.stringify(["refview-scenario-content-v1", canonicalJson(source)]);
  return `sha256:${sha256(new TextEncoder().encode(bytes))}`;
}
/** The expected identity comes from trusted publication metadata, not the challenge client. */
export function createScenario(input: ScenarioInput, expected: Readonly<{ ref: ScenarioRef; contentHash: string }>): Scenario {
  exact(input, SCENARIO_KEYS, "scenario");
  if (input.schemaVersion !== 1) throw new Error("unsupported scenario schema version");
  if (!/^sha256:[0-9a-f]{64}$/.test(input.contentHash) || input.contentHash !== expected.contentHash)
    throw new Error("scenario hash mismatch");
  if (input.ref.scenarioId !== expected.ref.scenarioId || input.ref.version !== expected.ref.version)
    throw new Error("scenario ref mismatch");
  if (!/^incident-[0-9]{3}$/.test(input.ref.scenarioId))
    throw new Error("scenario ID must be a neutral public handle");
  if (input.timeline.ref.scenarioId !== input.ref.scenarioId || input.timeline.ref.version !== input.ref.version)
    throw new Error("timeline ref mismatch");
  exact(input.timeline, ["ref", "durationTicks", "samples", "events"], "timeline");
  if (!["clear", "interpretative", "inconclusive"].includes(input.classification)
    || input.lawsEdition !== "IFAB-2026-27") throw new Error("invalid scenario metadata");
  opaque(input.competitionProfileId, /^[a-z][a-z0-9-]*$/, "competition profile");
  exact(input.field, ["lengthM", "widthM", "goalWidthM", "penaltyAreaDepthM",
    "penaltyAreaExtraWidthEachSideM", "lineWidthM", "attackDirection"], "field");
  if (input.field.lengthM !== 105 || input.field.widthM !== 68 || input.field.goalWidthM !== 7.32
    || input.field.penaltyAreaDepthM !== 16.5 || input.field.penaltyAreaExtraWidthEachSideM !== 16.5
    || input.field.lineWidthM !== 0.12 || !["positiveZ", "negativeZ"].includes(input.field.attackDirection))
    throw new Error("invalid field geometry");
  const field = Object.freeze({ lengthM: input.field.lengthM, widthM: input.field.widthM,
    goalWidthM: input.field.goalWidthM, penaltyAreaDepthM: input.field.penaltyAreaDepthM,
    penaltyAreaExtraWidthEachSideM: input.field.penaltyAreaExtraWidthEachSideM,
    lineWidthM: input.field.lineWidthM, attackDirection: input.field.attackDirection });
  const timeline = createTimelineFixture(input.timeline);
  exact(input.decisionGate, ["opensAtTick", "closesAtTick", "forcePauseAtTick"], "decision gate");
  const { opensAtTick, closesAtTick, forcePauseAtTick } = input.decisionGate;
  integer(opensAtTick, 0, timeline.durationTicks, "gate open");
  integer(closesAtTick, opensAtTick, timeline.durationTicks, "gate close");
  integer(forcePauseAtTick, closesAtTick, timeline.durationTicks, "force pause");
  const decisionGate = Object.freeze({ opensAtTick, closesAtTick, forcePauseAtTick });
  if (!Array.isArray(input.supportedRoles) || input.supportedRoles.length !== 1
    || input.supportedRoles[0] !== "mainReferee")
    throw new Error("v1 requires a main-referee-only task");
  const supportedRoles = Object.freeze([...input.supportedRoles]);
  exact(input.privateReview, ["facts", "evidence", "rubric"], "private review");
  if (!Array.isArray(input.privateReview.evidence)) throw new Error("invalid private review");
  const privateReview = privateCopy(input.privateReview) as PrivateReview;
  const canonicalActors = timeline.snapshot(0).actors.map((actor) => actor.actorId);
  if (canonicalActors.length > 999 || canonicalActors.some((actorId) => /^actor-[0-9]{3}$/.test(actorId)))
    throw new Error("invalid canonical actor roster for public handles");
  const canonicalToPublic = new Map(canonicalActors.map((actorId, index) =>
    [actorId, `actor-${String(index + 1).padStart(3, "0")}`]));
  const publicToCanonical = new Map([...canonicalToPublic].map(([canonical, handle]) => [handle, canonical]));
  if (!Array.isArray(input.assetRegistry) || input.assetRegistry.length > 999)
    throw new Error("invalid asset registry size");
  const assetRegistry = Object.freeze(input.assetRegistry.map((binding) => {
    exact(binding, ["assetId", "fingerprint", "licenseRef"], "asset binding");
    if (typeof binding.assetId !== "string" || !binding.assetId
      || /^asset-[0-9]{3}$/.test(binding.assetId)
      || typeof binding.licenseRef !== "string" || !binding.licenseRef
      || !/^sha256:[0-9a-f]{64}$/.test(binding.fingerprint))
      throw new Error("invalid asset binding");
    return Object.freeze({ assetId: binding.assetId, fingerprint: binding.fingerprint,
      licenseRef: binding.licenseRef });
  }).sort((a, b) => a.assetId < b.assetId ? -1 : a.assetId > b.assetId ? 1 : 0));
  if (new Set(assetRegistry.map((binding) => binding.assetId)).size !== assetRegistry.length)
    throw new Error("duplicate asset binding");
  if (new Set(assetRegistry.map((binding) => binding.fingerprint)).size !== assetRegistry.length)
    throw new Error("duplicate asset fingerprint");
  const canonicalAssetToPublic = new Map(assetRegistry.map((binding, index) =>
    [binding.assetId, `asset-${String(index + 1).padStart(3, "0")}`]));
  const usedAssets = new Set<string>();
  const cues = input.cues.map((cue) => {
    exact(cue, ["cueId", "tick", "ordinal", "kind", "assetId"], "cue");
    opaque(cue.cueId, /^cue-[0-9]{3}$/, "cue ID");
    if (!canonicalAssetToPublic.has(cue.assetId)) throw new Error("unbound cue asset");
    usedAssets.add(cue.assetId);
    integer(cue.tick, 0, timeline.durationTicks, "cue tick");
    integer(cue.ordinal, 0, Number.MAX_SAFE_INTEGER, "cue ordinal");
    if (cue.kind !== "animationCue" && cue.kind !== "audioCue") throw new Error("invalid cue kind");
    return Object.freeze({ cueId: cue.cueId, tick: cue.tick, ordinal: cue.ordinal,
      kind: cue.kind, assetId: canonicalAssetToPublic.get(cue.assetId)! });
  });
  if (new Set(cues.map((cue) => cue.cueId)).size !== cues.length) throw new Error("duplicate cue ID");
  const decisionOptions = input.decisionOptions.map((option) => {
    exact(option, ["optionId", "kind", "value"], "decision option");
    opaque(option.optionId, /^opt-[0-9]{3}$/, "option ID");
    const valid = option.kind === "stopPlay" ? typeof option.value === "boolean"
      : option.kind === "restart" ? ["playOn", "penaltyKick", "directFreeKick", "indirectFreeKick", "droppedBall"].includes(option.value as string)
        : option.kind === "discipline" && ["none", "yellow", "red"].includes(option.value as string);
    if (!valid) throw new Error("invalid decision option");
    return Object.freeze({ optionId: option.optionId, kind: option.kind, value: option.value });
  });
  if (new Set(decisionOptions.map((option) => option.optionId)).size !== decisionOptions.length)
    throw new Error("duplicate decision option ID");
  const requiredChoices = ["stopPlay:false", "stopPlay:true", "restart:playOn",
    "restart:directFreeKick", "restart:indirectFreeKick", "restart:droppedBall",
    "restart:penaltyKick", "discipline:none", "discipline:yellow", "discipline:red"];
  const choices = decisionOptions.map((option) => `${option.kind}:${option.value}`);
  if (choices.length !== requiredChoices.length || new Set(choices).size !== requiredChoices.length
    || requiredChoices.some((choice) => !choices.includes(choice)))
    throw new Error("v1 decision options must include each neutral choice exactly once");
  const actors = Object.freeze(Array.from({ length: timeline.durationTicks + 1 }, (_, tick) => {
    const snapshot = timeline.snapshot(tick);
    return Object.freeze({ tick, actors: Object.freeze(snapshot.actors.map((actor) => {
      if (!canonicalAssetToPublic.has(actor.clipId)) throw new Error("unbound clip asset");
      usedAssets.add(actor.clipId);
      return Object.freeze({ actorId: canonicalToPublic.get(actor.actorId)!, position: actor.position,
        yawRad: actor.yawRad, clipId: canonicalAssetToPublic.get(actor.clipId)!, phaseQ: actor.phaseQ });
    })) });
  }));
  if (usedAssets.size !== assetRegistry.length) throw new Error("unused asset binding");
  const ball = Object.freeze(Array.from({ length: timeline.durationTicks + 1 }, (_, tick) =>
    Object.freeze({ tick, ball: Object.freeze({ position: timeline.snapshot(tick).ball.position,
      orientation: timeline.snapshot(tick).ball.orientation }) })));
  const ref = Object.freeze({ scenarioId: input.ref.scenarioId, version: input.ref.version });
  const contentHash = input.contentHash;
  if (deriveScenarioContentHash(input) !== contentHash) throw new Error("scenario content hash mismatch");
  return Object.freeze({ ref, contentHash, timeline, privateReview, assetRegistry,
    resolveActorHandle(handle: string): string {
      const canonical = publicToCanonical.get(handle);
      if (!canonical) throw new Error("unknown public actor handle");
      return canonical;
    },
    publicActorHandle(canonicalId: string): string {
      const handle = canonicalToPublic.get(canonicalId);
      if (!handle) throw new Error("unknown canonical actor ID");
      return handle;
    },
    playable(role: ScenarioRole): PlayableScenario {
      if (!supportedRoles.includes(role)) throw new Error("unsupported role");
      return Object.freeze({ ref, contentHash, field, durationTicks: timeline.durationTicks,
        tickRateHz: 60, decisionGate, role, actors, ball, cues: Object.freeze(cues),
        decisionOptions: Object.freeze(decisionOptions), lawsEdition: input.lawsEdition });
    } });
}
