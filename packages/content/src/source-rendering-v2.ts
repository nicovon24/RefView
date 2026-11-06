import { canonicalJsonV2 } from "./source-core-v2";
import { verifyAssetRegistryV2, type AssetRecordV2 } from "./asset-registry-v2";

export type ActorBindingV2 = Readonly<{ actorId: string; rigAssetId: string; clipAssetIds: readonly string[] }>;
export type SafeCueV2 = Readonly<{ cueId: string; tick: number; ordinal: number;
  kind: "animationCue" | "audioCue"; assetId: string }>;
export type NormalizedRenderingV2 = Readonly<{ assets: readonly AssetRecordV2[];
  actorBindings: readonly ActorBindingV2[]; safeCues: readonly SafeCueV2[] }>;
export type RenderingContextV2 = Readonly<{
  actorIds: readonly string[];
  timelineClipRefs: readonly Readonly<{ actorId: string; clipId: string }>[];
  resolveAssetBytes: (assetId: string, neutralClientPath: string) => Uint8Array;
}>;

const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;

function record(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError(`invalid ${label}`);
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) {
    throw new TypeError(`invalid ${label} fields`);
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`invalid ${label}`);
  return value;
}

function id(value: unknown, label: string): string {
  if (typeof value !== "string" || !ID.test(value)) throw new TypeError(`invalid ${label}`);
  return value;
}

function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new TypeError(`duplicate ${label}`);
}

function tickNumber(value: unknown, label: string, max: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > max) {
    throw new TypeError(`invalid ${label}`);
  }
  return value;
}

export function normalizeRenderingV2(input: unknown, context: RenderingContextV2): NormalizedRenderingV2 {
  // This pass rejects accessors, hidden/symbol keys, non-plain objects, and sparse arrays before any field read.
  const detached = JSON.parse(canonicalJsonV2(input)) as unknown;
  const rendering = record(detached, ["assets", "actorBindings", "safeCues"], "rendering");
  const actors = context.actorIds.map((value) => id(value, "roster actor ID"));
  if (actors.length !== 7) throw new TypeError("rendering requires seven actors");
  unique(actors, "roster actor ID");
  const roster = new Set(actors);
  const assets = verifyAssetRegistryV2(rendering.assets, context.resolveAssetBytes);
  const assetsById = new Map(assets.map((asset) => [asset.assetId, asset]));
  const bindings = array(rendering.actorBindings, "actor bindings").map((value): ActorBindingV2 => {
    const source = record(value, ["actorId", "rigAssetId", "clipAssetIds"], "actor binding");
    const actorId = id(source.actorId, "binding actor ID");
    const rigAssetId = id(source.rigAssetId, "rig asset ID");
    const clipAssetIds = array(source.clipAssetIds, "clip asset IDs").map((item) => id(item, "clip asset ID"));
    unique(clipAssetIds, "clip asset ID");
    if (!roster.has(actorId) || !assetsById.has(rigAssetId) || clipAssetIds.some((clip) => !assetsById.has(clip))) {
      throw new TypeError("binding reference mismatch");
    }
    return Object.freeze({ actorId, rigAssetId, clipAssetIds: Object.freeze(clipAssetIds.sort(compare)) });
  });
  if (bindings.length !== actors.length) throw new TypeError("incomplete actor bindings");
  unique(bindings.map((binding) => binding.actorId), "binding actor ID");
  const bindingsByActor = new Map(bindings.map((binding) => [binding.actorId, binding]));
  const timelineClipPairs = new Set<string>();
  for (const reference of context.timelineClipRefs) {
    const actorId = id(reference.actorId, "timeline actor ID");
    const clipId = id(reference.clipId, "timeline clip ID");
    if (!roster.has(actorId) || !bindingsByActor.get(actorId)?.clipAssetIds.includes(clipId)) {
      throw new TypeError("timeline clip binding mismatch");
    }
    timelineClipPairs.add(`${actorId}:${clipId}`);
  }
  const cueClips = new Set<string>();
  const cues = array(rendering.safeCues, "safe cues").map((value): SafeCueV2 => {
    const source = record(value, ["cueId", "tick", "ordinal", "kind", "assetId"], "safe cue");
    const cueId = id(source.cueId, "cue ID");
    const tick = tickNumber(source.tick, "cue tick", 480);
    const ordinal = tickNumber(source.ordinal, "cue ordinal", Number.MAX_SAFE_INTEGER);
    const kind = source.kind;
    const assetId = id(source.assetId, "cue asset ID");
    if (kind !== "animationCue" && kind !== "audioCue") throw new TypeError("invalid cue kind");
    if (!assetsById.has(assetId)) throw new TypeError("unknown cue asset");
    if (kind === "animationCue") {
      if (!bindings.some((binding) => binding.clipAssetIds.includes(assetId))) {
        throw new TypeError("unbound animation cue clip");
      }
      cueClips.add(assetId);
    }
    return Object.freeze({ cueId, tick, ordinal, kind, assetId });
  });
  unique(cues.map((cue) => cue.cueId), "cue ID");
  unique(cues.map((cue) => `${cue.tick}:${cue.ordinal}`), "cue tick/ordinal");
  const referencedAssets = new Set<string>([
    ...bindings.map((binding) => binding.rigAssetId),
    ...bindings.flatMap((binding) => binding.clipAssetIds),
    ...cues.map((cue) => cue.assetId),
  ]);
  if (assets.some((asset) => !referencedAssets.has(asset.assetId)) ||
      bindings.some((binding) => binding.clipAssetIds.some((clip) =>
        !timelineClipPairs.has(`${binding.actorId}:${clip}`) && !cueClips.has(clip)))) {
    throw new TypeError("unused rendering asset or clip binding");
  }
  return Object.freeze({ assets,
    actorBindings: Object.freeze(bindings.sort((a, b) => compare(a.actorId, b.actorId))),
    safeCues: Object.freeze(cues.sort((a, b) => a.tick - b.tick || a.ordinal - b.ordinal || compare(a.cueId, b.cueId))),
  });
}
