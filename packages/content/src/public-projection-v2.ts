import type { NormalizedCoreSourceV2 } from "./source-core-v2";
import type { NormalizedRenderingV2 } from "./source-rendering-v2";
import type { NormalizedDecisionSourceV2 } from "./source-decision-v2";

type ActorHandle = `actor-${string}`;
type AssetHandle = `asset-${string}`;
type ContentHash = `sha256:${string}`;
type ActorFrame = Readonly<{ actorHandle: ActorHandle; position: Readonly<{ x: number; y: number; z: number }>;
  yawRad: number; clipHandle: AssetHandle; phaseQ: number }>;
type BallFrame = Readonly<{ position: Readonly<{ x: number; y: number; z: number }>;
  orientation: Readonly<{ qx: number; qy: number; qz: number; qw: number }> }>;

export type PlayableScenarioV2 = Readonly<{
  ref: NormalizedCoreSourceV2["ref"];
  contentHash: ContentHash;
  field: NormalizedCoreSourceV2["field"];
  durationTicks: 480;
  tickRateHz: 60;
  decisionGate: NormalizedCoreSourceV2["decisionGate"];
  initialRefereePose: NormalizedCoreSourceV2["initialRefereePose"];
  role: "mainReferee";
  actors: readonly Readonly<{ tick: number; actors: readonly ActorFrame[] }>[];
  ball: readonly Readonly<{ tick: number; ball: BallFrame }>[];
  cues: readonly Readonly<{ cueId: `cue-${string}`; tick: number; ordinal: number;
    kind: "animationCue" | "audioCue"; assetHandle: AssetHandle }>[];
  decisionOptions: NormalizedDecisionSourceV2["decisionOptions"];
  lawsEdition: "IFAB-2026-27";
  actorRigBindings: readonly Readonly<{ actorHandle: ActorHandle; rigAssetHandle: AssetHandle }>[];
  assetManifest: readonly Readonly<{ assetHandle: AssetHandle; neutralClientPath: string;
    sha256: ContentHash; kind: "proceduralModule" | "file" }>[];
}>;

export type PublicProjectionV2 = Readonly<{
  playable: PlayableScenarioV2;
  canonicalToPublicActorHandles: HandleLookup<ActorHandle>;
  canonicalToPublicAssetHandles: HandleLookup<AssetHandle>;
}>;

export type HandleLookup<T extends string> = Readonly<{
  get: (canonicalId: string) => T | undefined;
  has: (canonicalId: string) => boolean;
}>;

const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const handle = <T extends "actor" | "asset" | "cue">(prefix: T, index: number): `${T}-${string}` =>
  `${prefix}-${String(index + 1).padStart(3, "0")}`;

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

function immutableLookup<T extends string>(source: Map<string, T>): HandleLookup<T> {
  const privateCopy = new Map(source);
  return Object.freeze({
    get: (canonicalId: string): T | undefined => privateCopy.get(canonicalId),
    has: (canonicalId: string): boolean => privateCopy.has(canonicalId),
  });
}

/** Projects validated source slices; only the compiler should supply the derived hash. */
export function projectPublicScenarioV2(
  core: NormalizedCoreSourceV2, rendering: NormalizedRenderingV2,
  decision: NormalizedDecisionSourceV2, contentHash: string,
): PublicProjectionV2 {
  if (!/^sha256:[0-9a-f]{64}$/.test(contentHash)) throw new TypeError("invalid derived content hash");
  const samples = [...core.timeline.samples].sort((a, b) => a.tick - b.tick);
  if (core.timeline.durationTicks !== 480 || samples.length !== 481 ||
      samples.some((sample, tick) => sample.tick !== tick)) throw new TypeError("incomplete timeline");
  const roster = samples[0]!.actors.map((actor) => actor.actorId).sort(compare);
  if (roster.length !== 7 || new Set(roster).size !== 7 ||
      roster.some((id) => /^actor-[0-9]{3}$/.test(id))) throw new TypeError("invalid actor roster");
  const actorHandles = new Map(roster.map((id, index) => [id, handle("actor", index)]));
  const assets = [...rendering.assets].sort((a, b) => compare(a.assetId, b.assetId));
  if (!assets.length || assets.length > 999 || new Set(assets.map((asset) => asset.assetId)).size !== assets.length)
    throw new TypeError("invalid asset registry");
  const assetHandles = new Map(assets.map((asset, index) => [asset.assetId, handle("asset", index)]));
  const actorHandle = (id: string): ActorHandle => {
    const value = actorHandles.get(id);
    if (!value) throw new TypeError("unknown actor binding");
    return value;
  };
  const assetHandle = (id: string): AssetHandle => {
    const value = assetHandles.get(id);
    if (!value) throw new TypeError("missing asset binding");
    return value;
  };
  const bindings = [...rendering.actorBindings].sort((a, b) => compare(a.actorId, b.actorId));
  if (bindings.length !== roster.length || new Set(bindings.map((binding) => binding.actorId)).size !== roster.length)
    throw new TypeError("incomplete actor rig bindings");
  const boundClips = new Map(bindings.map((binding) => [binding.actorId, new Set(binding.clipAssetIds)]));
  const referenced = new Set<string>();
  const actorRigBindings = bindings.map((binding) => {
    referenced.add(binding.rigAssetId);
    for (const clip of binding.clipAssetIds) { assetHandle(clip); referenced.add(clip); }
    return { actorHandle: actorHandle(binding.actorId), rigAssetHandle: assetHandle(binding.rigAssetId) };
  });
  const actors = samples.map((sample) => ({ tick: sample.tick,
    actors: [...sample.actors].sort((a, b) => compare(a.actorId, b.actorId)).map((actor): ActorFrame => {
      if (!boundClips.get(actor.actorId)?.has(actor.clipId)) throw new TypeError("unbound timeline clip");
      return { actorHandle: actorHandle(actor.actorId), position: { x: actor.position.x,
        y: actor.position.y, z: actor.position.z }, yawRad: actor.yawRad,
        clipHandle: assetHandle(actor.clipId), phaseQ: actor.phaseQ };
    }),
  }));
  if (actors.some((frame) => frame.actors.length !== roster.length ||
      new Set(frame.actors.map((actor) => actor.actorHandle)).size !== roster.length))
    throw new TypeError("incomplete actor frame");
  const ball = samples.map((sample) => ({ tick: sample.tick, ball: {
    position: { x: sample.ball.position.x, y: sample.ball.position.y, z: sample.ball.position.z },
    orientation: { qx: sample.ball.orientation.qx, qy: sample.ball.orientation.qy,
      qz: sample.ball.orientation.qz, qw: sample.ball.orientation.qw },
  } }));
  if (rendering.safeCues.length > 999 ||
      new Set(rendering.safeCues.map((cue) => cue.cueId)).size !== rendering.safeCues.length)
    throw new TypeError("invalid public cues");
  const cues = [...rendering.safeCues].sort((a, b) => a.tick - b.tick || a.ordinal - b.ordinal ||
    compare(a.cueId, b.cueId)).map((cue, index) => {
    referenced.add(cue.assetId);
    return { cueId: handle("cue", index), tick: cue.tick, ordinal: cue.ordinal,
      kind: cue.kind, assetHandle: assetHandle(cue.assetId) };
  });
  if (assets.some((asset) => !referenced.has(asset.assetId))) throw new TypeError("unused public asset");
  const assetManifest = assets.map((asset) => {
    if (!/^\/assets\/asset-[0-9]{3,}\.(?:bin|glb|gltf|js|json|mjs|mp3|ogg|png|wav|webp)$/.test(asset.neutralClientPath) ||
        !/^sha256:[0-9a-f]{64}$/.test(asset.sha256)) throw new TypeError("unsafe asset metadata");
    return { assetHandle: assetHandle(asset.assetId), neutralClientPath: asset.neutralClientPath,
      sha256: asset.sha256, kind: asset.kind };
  });
  const playable = freezeDeep({
    ref: { scenarioId: core.ref.scenarioId, version: core.ref.version },
    contentHash: contentHash as ContentHash,
    field: { lengthM: core.field.lengthM, widthM: core.field.widthM, goalWidthM: core.field.goalWidthM,
      penaltyAreaDepthM: core.field.penaltyAreaDepthM,
      penaltyAreaExtraWidthEachSideM: core.field.penaltyAreaExtraWidthEachSideM,
      lineWidthM: core.field.lineWidthM, attackDirection: core.field.attackDirection },
    durationTicks: 480 as const, tickRateHz: 60 as const,
    decisionGate: { opensAtTick: core.decisionGate.opensAtTick,
      closesAtTick: core.decisionGate.closesAtTick, forcePauseAtTick: core.decisionGate.forcePauseAtTick },
    initialRefereePose: { position: { x: core.initialRefereePose.position.x,
      y: core.initialRefereePose.position.y, z: core.initialRefereePose.position.z },
      lookYaw: core.initialRefereePose.lookYaw, lookPitch: core.initialRefereePose.lookPitch },
    role: "mainReferee" as const, actors, ball, cues,
    decisionOptions: [...decision.decisionOptions].sort((a, b) => compare(a.optionId, b.optionId))
      .map((option) => ({ optionId: option.optionId, kind: option.kind, value: option.value })),
    lawsEdition: core.lawsEdition, actorRigBindings, assetManifest,
  }) satisfies PlayableScenarioV2;
  return Object.freeze({ playable, canonicalToPublicActorHandles: immutableLookup(actorHandles),
    canonicalToPublicAssetHandles: immutableLookup(assetHandles) });
}
