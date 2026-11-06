import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { normalizeRenderingV2 } from "./source-rendering-v2";

const actors = ["attack-08", "attack-09", "attack-10", "defence-01", "defence-02", "defence-04", "defence-05"];
const bytes = (id: string) => new TextEncoder().encode(id);
const digest = (id: string) => `sha256:${createHash("sha256").update(bytes(id)).digest("hex")}`;
const asset = (id: string, index: number) => ({
  assetId: id, kind: "file", neutralClientPath: `/assets/asset-${String(index).padStart(3, "0")}.glb`,
  sha256: digest(id), creator: "RefView", origin: "Original", licenseId: "Owned",
  licenseEvidence: "asset-register", attachmentNames: ["foot"], geometryPartNames: ["body"],
});
const context = {
  actorIds: actors,
  timelineClipRefs: actors.map((actorId) => ({ actorId, clipId: `clip-${actorId}` })),
  resolveAssetBytes: (id: string) => bytes(id),
};
const fixture = () => ({
  assets: [
    ...actors.map((id, index) => asset(`rig-${id}`, index + 1)),
    ...actors.map((id, index) => asset(`clip-${id}`, index + 8)),
    asset("audio-whistle", 15),
  ],
  actorBindings: actors.map((actorId) => ({ actorId, rigAssetId: `rig-${actorId}`, clipAssetIds: [`clip-${actorId}`] })),
  safeCues: [{ cueId: "cue-whistle", tick: 372, ordinal: 0, kind: "audioCue", assetId: "audio-whistle" }],
});

describe("normalizeRenderingV2", () => {
  it("sorts declared sets, detaches input, and freezes the complete result", () => {
    const input = fixture();
    const result = normalizeRenderingV2({ assets: [...input.assets].reverse(),
      actorBindings: [...input.actorBindings].reverse(), safeCues: input.safeCues }, context);
    expect(result.assets.map((item) => item.assetId)).toEqual([...input.assets.map((item) => item.assetId)].sort());
    expect(result.actorBindings.map((item) => item.actorId)).toEqual(actors);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.actorBindings[0]?.clipAssetIds)).toBe(true);
    input.actorBindings[0]!.clipAssetIds[0] = "changed";
    expect(result.actorBindings[0]?.clipAssetIds).toEqual(["clip-attack-08"]);
  });

  it("requires seven actor bindings and exact timeline clip references", () => {
    const missing = fixture(); missing.actorBindings.pop();
    expect(() => normalizeRenderingV2(missing, context)).toThrow();
    const missingClip = fixture(); missingClip.actorBindings[0]!.clipAssetIds = [];
    expect(() => normalizeRenderingV2(missingClip, context)).toThrow();
    const unusedClip = fixture(); unusedClip.actorBindings[0]!.clipAssetIds.push("audio-whistle");
    expect(() => normalizeRenderingV2(unusedClip, context)).toThrow();
  });

  it("allows actors to share one rig asset", () => {
    const input = fixture();
    const removedRig = input.actorBindings[1]!.rigAssetId;
    input.actorBindings[1]!.rigAssetId = input.actorBindings[0]!.rigAssetId;
    input.assets = input.assets.filter((entry) => entry.assetId !== removedRig);
    expect(normalizeRenderingV2(input, context).actorBindings[1]?.rigAssetId).toBe("rig-attack-08");
  });

  it("rejects a clip binding unused by its actor even when another actor uses that clip", () => {
    const input = fixture();
    input.actorBindings[1]!.clipAssetIds.push("clip-attack-08");
    expect(() => normalizeRenderingV2(input, context)).toThrow(/unused/);
  });

  it("requires valid, referenced cue assets and no unused assets", () => {
    const unused = fixture(); unused.assets.push(asset("unused", 16));
    expect(() => normalizeRenderingV2(unused, context)).toThrow();
    const missing = fixture(); missing.safeCues[0]!.assetId = "missing";
    expect(() => normalizeRenderingV2(missing, context)).toThrow();
    const invalidAnimation = fixture(); invalidAnimation.safeCues[0] = { ...invalidAnimation.safeCues[0]!, kind: "animationCue", assetId: "audio-whistle" };
    expect(() => normalizeRenderingV2(invalidAnimation, context)).toThrow();
    const wrongBytes = { ...context, resolveAssetBytes: () => bytes("different") };
    expect(() => normalizeRenderingV2(fixture(), wrongBytes)).toThrow();
  });

  it("bounds ticks and rejects duplicate cue IDs or same-tick ordinals", () => {
    for (const tick of [-1, 481, 1.5, Number.NaN]) {
      const input = fixture(); input.safeCues[0]!.tick = tick;
      expect(() => normalizeRenderingV2(input, context)).toThrow();
    }
    const duplicate = fixture(); duplicate.safeCues.push({ ...duplicate.safeCues[0]!, cueId: "another" });
    expect(() => normalizeRenderingV2(duplicate, context)).toThrow();
    duplicate.safeCues[1]!.ordinal = 1; duplicate.safeCues[1]!.cueId = "cue-whistle";
    expect(() => normalizeRenderingV2(duplicate, context)).toThrow();
  });

  it("rejects unknown, hidden, accessor, symbol, and decorated inputs without calling getters", () => {
    let calls = 0;
    const accessor = fixture();
    Object.defineProperty(accessor.actorBindings[0], "rigAssetId", { enumerable: true, get() { calls++; return "bad"; } });
    expect(() => normalizeRenderingV2(accessor, context)).toThrow();
    expect(calls).toBe(0);
    const unknown = { ...fixture(), facts: {} };
    expect(() => normalizeRenderingV2(unknown, context)).toThrow();
    const hidden = fixture(); Object.defineProperty(hidden.safeCues[0], "hidden", { value: true });
    expect(() => normalizeRenderingV2(hidden, context)).toThrow();
    const symbol = fixture(); Object.defineProperty(symbol.actorBindings[0], Symbol("secret"), { value: true });
    expect(() => normalizeRenderingV2(symbol, context)).toThrow();
    const decorated = fixture(); Object.defineProperty(decorated.safeCues, "extra", { value: true });
    expect(() => normalizeRenderingV2(decorated, context)).toThrow();
  });
});
