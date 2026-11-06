import { describe, expect, it } from "vitest";
import type { NormalizedCoreSourceV2 } from "./source-core-v2";
import type { NormalizedRenderingV2 } from "./source-rendering-v2";
import type { NormalizedDecisionSourceV2 } from "./source-decision-v2";
import { projectPublicScenarioV2 } from "./public-projection-v2";

const hash = `sha256:${"a".repeat(64)}` as const;
const roster = ["defence-05", "attack-09", "defence-04", "attack-08", "attack-10", "defence-01", "defence-02"];
const asset = (assetId: string, n: number) => ({ assetId, kind: "file" as const,
  neutralClientPath: `/assets/asset-${String(n).padStart(3, "0")}.glb`, sha256: hash,
  creator: "private creator", origin: "private origin", licenseId: "private-license",
  licenseEvidence: "private evidence", attachmentNames: [], geometryPartNames: [] });

function inputs() {
  const core = {
    ref: { scenarioId: "incident-001", version: 2 }, lawsEdition: "IFAB-2026-27",
    field: { lengthM: 105, widthM: 68, goalWidthM: 7.32, penaltyAreaDepthM: 16.5,
      penaltyAreaExtraWidthEachSideM: 16.5, lineWidthM: 0.12, attackDirection: "positiveZ" },
    decisionGate: { opensAtTick: 360, closesAtTick: 480, forcePauseAtTick: 480 },
    initialRefereePose: { position: { x: 3, y: 0, z: 29 }, lookYaw: 0, lookPitch: 0 },
    timeline: { durationTicks: 480, samples: Array.from({ length: 481 }, (_, tick) => ({ tick,
      actors: roster.map((actorId) => ({ actorId, position: { x: 1, y: 0, z: tick / 100 },
        yawRad: 0, clipId: "run-clip", phaseQ: tick })),
      ball: { position: { x: 8, y: 0.11, z: 29 }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } },
    })), events: [{ kind: "offence", evidenceId: "EV-TRIP-CONTACT", answerKey: "penaltyKick" }] },
    facts: { expectedRestart: "penaltyKick", offenderActorId: "defence-04" },
    rubric: { answerKey: "penaltyKick" }, preparedDebrief: { text: "private ruling" },
  } as unknown as NormalizedCoreSourceV2;
  const rendering = { assets: [asset("rig-private", 2), asset("run-clip", 1), asset("sound-private", 3)],
    actorBindings: roster.map((actorId) => ({ actorId, rigAssetId: "rig-private", clipAssetIds: ["run-clip"] })),
    safeCues: [{ cueId: "contact-private", tick: 365, ordinal: 0, kind: "audioCue" as const,
      assetId: "sound-private", answerKey: "penaltyKick" }],
    privateRuling: "penaltyKick",
  } as unknown as NormalizedRenderingV2;
  const decision = { decisionOptions: [
    { optionId: "opt-002", kind: "stopPlay" as const, value: false },
    { optionId: "opt-001", kind: "stopPlay" as const, value: true },
  ], rubric: { expected: "penaltyKick", evidenceIds: ["EV-TRIP-CONTACT"] } } as unknown as NormalizedDecisionSourceV2;
  return { core, rendering, decision };
}

describe("projectPublicScenarioV2", () => {
  it("emits an exact challenge-safe JSON allowlist and stable opaque handles", () => {
    const { core, rendering, decision } = inputs();
    const result = projectPublicScenarioV2(core, rendering, decision, hash);
    const dto = JSON.parse(JSON.stringify(result.playable)) as Record<string, unknown>;
    expect(Object.keys(dto).sort()).toEqual(["actorRigBindings", "actors", "assetManifest", "ball",
      "contentHash", "cues", "decisionGate", "decisionOptions", "durationTicks", "field",
      "initialRefereePose", "lawsEdition", "ref", "role", "tickRateHz"].sort());
    expect(result.playable.actors).toHaveLength(481);
    expect(result.playable.ball).toHaveLength(481);
    expect(Object.keys((dto.actors as Array<{ actors: object[] }>)[0]!.actors[0]!).sort())
      .toEqual(["actorHandle", "position", "yawRad", "clipHandle", "phaseQ"].sort());
    expect(Object.keys((dto.actors as object[])[0]!).sort()).toEqual(["actors", "tick"]);
    expect(Object.keys((dto.ball as object[])[0]!).sort()).toEqual(["ball", "tick"]);
    expect(Object.keys((dto.cues as object[])[0]!).sort())
      .toEqual(["cueId", "tick", "ordinal", "kind", "assetHandle"].sort());
    expect(Object.keys((dto.actorRigBindings as object[])[0]!).sort())
      .toEqual(["actorHandle", "rigAssetHandle"].sort());
    expect(Object.keys((dto.decisionOptions as object[])[0]!).sort())
      .toEqual(["optionId", "kind", "value"].sort());
    expect(result.canonicalToPublicActorHandles.get("attack-08")).toBe("actor-001");
    expect(result.canonicalToPublicActorHandles.get("defence-05")).toBe("actor-007");
    expect(result.canonicalToPublicAssetHandles.get("rig-private")).toBe("asset-001");
    expect(result.canonicalToPublicAssetHandles.get("run-clip")).toBe("asset-002");
    expect(result.playable.cues[0]).toEqual({ cueId: "cue-001", tick: 365, ordinal: 0,
      kind: "audioCue", assetHandle: "asset-003" });
    expect(result.playable.actorRigBindings[0]).toEqual({ actorHandle: "actor-001", rigAssetHandle: "asset-001" });
    expect(result.playable.assetManifest.map((entry) => entry.assetHandle))
      .toEqual(["asset-001", "asset-002", "asset-003"]);
    expect(Object.keys((dto.assetManifest as object[])[0]!).sort())
      .toEqual(["assetHandle", "neutralClientPath", "sha256", "kind"].sort());
    const serialized = JSON.stringify(dto);
    for (const secret of ["defence-04", "attack-08", "rig-private", "run-clip", "sound-private",
      "contact-private", "EV-TRIP-CONTACT", "answerKey", "expectedRestart", "private origin",
      "private-license", "preparedDebrief", "rubric", "events", "facts"])
      expect(serialized).not.toContain(secret);
  });

  it("detaches and deeply freezes the DTO while keeping maps server-only", () => {
    const { core, rendering, decision } = inputs();
    const result = projectPublicScenarioV2(core, rendering, decision, hash);
    const before = JSON.stringify(result.playable);
    (core.timeline.samples[0]!.actors[0]!.position as { x: number }).x = 99;
    (rendering.assets[0] as { origin: string }).origin = "changed";
    (decision.decisionOptions[0] as { value: boolean }).value = true;
    expect(JSON.stringify(result.playable)).toBe(before);
    expect(Object.isFrozen(result.playable.actors[0]!.actors[0]!.position)).toBe(true);
    expect(Object.isFrozen(result.playable.assetManifest[0])).toBe(true);
    expect(JSON.stringify(result.playable)).not.toContain("canonicalToPublic");
  });

  it("does not expose mutable server handle maps", () => {
    const { core, rendering, decision } = inputs();
    const result = projectPublicScenarioV2(core, rendering, decision, hash);
    for (const lookup of [result.canonicalToPublicActorHandles, result.canonicalToPublicAssetHandles]) {
      expect(Object.isFrozen(lookup)).toBe(true);
      expect("set" in lookup).toBe(false);
      expect("delete" in lookup).toBe(false);
      expect("clear" in lookup).toBe(false);
      expect(() => (lookup as unknown as Map<string, string>).set("attack-08", "actor-999")).toThrow();
    }
    expect(result.canonicalToPublicActorHandles.get("attack-08")).toBe("actor-001");
    expect(result.canonicalToPublicAssetHandles.get("rig-private")).toBe("asset-001");
  });

  it("keeps public handles and DTO stable when trusted set inputs are reordered", () => {
    const first = inputs();
    const second = inputs();
    second.core.timeline.samples.reverse();
    second.core.timeline.samples.forEach((sample) => sample.actors.reverse());
    const reorderedRendering = { ...second.rendering, assets: [...second.rendering.assets].reverse(),
      actorBindings: [...second.rendering.actorBindings].reverse(),
      safeCues: [...second.rendering.safeCues].reverse() };
    const reorderedDecision = { ...second.decision,
      decisionOptions: [...second.decision.decisionOptions].reverse() };
    const a = projectPublicScenarioV2(first.core, first.rendering, first.decision, hash);
    const b = projectPublicScenarioV2(second.core, reorderedRendering, reorderedDecision, hash);
    expect(b.playable).toEqual(a.playable);
    for (const id of roster) expect(b.canonicalToPublicActorHandles.get(id))
      .toBe(a.canonicalToPublicActorHandles.get(id));
    for (const id of ["rig-private", "run-clip", "sound-private"])
      expect(b.canonicalToPublicAssetHandles.get(id)).toBe(a.canonicalToPublicAssetHandles.get(id));
  });

  it("rejects malformed hashes and missing or unused rendering dependencies", () => {
    const { core, rendering, decision } = inputs();
    expect(() => projectPublicScenarioV2(core, rendering, decision, "sha256:fake")).toThrow();
    const missing = { ...rendering, assets: rendering.assets.filter((item) => item.assetId !== "run-clip") };
    expect(() => projectPublicScenarioV2(core, missing, decision, hash)).toThrow();
    const unused = { ...rendering, assets: [...rendering.assets, asset("unused-private", 4)] };
    expect(() => projectPublicScenarioV2(core, unused, decision, hash)).toThrow();
    const duplicateCue = { ...rendering, safeCues: [rendering.safeCues[0]!, rendering.safeCues[0]!] };
    expect(() => projectPublicScenarioV2(core, duplicateCue, decision, hash)).toThrow();
  });
});
