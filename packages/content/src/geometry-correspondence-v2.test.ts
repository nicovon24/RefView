import { describe, expect, it, vi } from "vitest";
import { verifyGeometryCorrespondenceV2 } from "./geometry-correspondence-v2";
import type { NormalizedCoreSourceV2 } from "./source-core-v2";
import type { NormalizedRenderingV2 } from "./source-rendering-v2";
import type { NormalizedObservationSourceV2 } from "./source-observation-v2";

const point = (x: number, y: number, z: number) => ({ x, y, z });
function fixture() {
  const ticks = [120, 360, 366, 371, 480];
  const core = { timeline: { samples: ticks.map((tick) => ({ tick,
    actors: [{ actorId: "actor-a", position: point(10, 0, 20), yawRad: Math.PI / 2,
      clipId: "clip-a", phaseQ: tick }], ball: { position: point(1, 0.2, 2) },
  })) } };
  const rendering = { assets: [{ assetId: "rig-a", attachmentNames: ["foot"],
    geometryPartNames: ["leg"] }], actorBindings: [{ actorId: "actor-a", rigAssetId: "rig-a",
      clipAssetIds: ["clip-a"] }] };
  const evidence = ticks.map((tick) => ({ evidenceId: `e-${tick}`, fromTick: tick, toTick: tick,
    requiredAnchorIds: ["actor", "ball", "line"], samples: [{ tick, anchors: [
      { anchorId: "actor", position: point(10, 0, 19) },
      { anchorId: "ball", position: point(1, 0.2, 2) },
      { anchorId: "line", position: point(3, 0, 36) },
    ], occluders: [{ boxId: "leg", min: point(10, 0, 19), max: point(11, 1, 20) }] }],
  }));
  const observation = { observation: { evidence }, geometryBindings: {
    anchors: evidence.flatMap(({ evidenceId }) => [
      { evidenceId, anchorId: "actor", target: { kind: "actorAttachment", actorId: "actor-a", attachmentName: "foot" } },
      { evidenceId, anchorId: "ball", target: { kind: "ballCenter" } },
      { evidenceId, anchorId: "line", target: { kind: "fieldPoint", feature: "nearPenaltyAreaLine", xM: 3 } },
    ]), occluders: evidence.map(({ evidenceId }) => ({ evidenceId, boxId: "leg",
      actorId: "actor-a", geometryPartName: "leg" })),
  } };
  const resolver = { sampleAttachment: () => point(1, 0, 0),
    sampleGeometryPart: () => ({ min: point(0, 0, 0), max: point(1, 1, 1) }) };
  return { core, rendering, observation, resolver };
}
type Fixture = ReturnType<typeof fixture>;
const check = (f: Fixture, resolver: Parameters<typeof verifyGeometryCorrespondenceV2>[3] = f.resolver) =>
  verifyGeometryCorrespondenceV2(f.core as unknown as NormalizedCoreSourceV2,
    f.rendering as unknown as NormalizedRenderingV2,
    f.observation as unknown as NormalizedObservationSourceV2, resolver);

describe("v2 geometry correspondence", () => {
  it("checks every evidence tick and canonical milestone within evidence windows", () => {
    const f = fixture();
    expect(check(f).checkedTicks)
      .toEqual([120, 360, 366, 371, 480]);
  });

  it("plans milestone captures even when a milestone has no evidence sample", () => {
    const f = fixture();
    f.observation.observation.evidence.pop();
    f.observation.geometryBindings.anchors.splice(-3);
    f.observation.geometryBindings.occluders.pop();
    expect(check(f).checkedTicks).toEqual([120, 360, 366, 371]);
    expect(check(f).requiredCaptureTicks).toEqual([120, 360, 366, 371, 480]);
  });

  it("passes each actor's exact rig, clip, phase, and declared name to the resolver", () => {
    const f = fixture();
    const attachment = vi.fn(f.resolver.sampleAttachment);
    const part = vi.fn(f.resolver.sampleGeometryPart);
    check(f, { sampleAttachment: attachment, sampleGeometryPart: part });
    expect(attachment).toHaveBeenCalledWith("rig-a", "clip-a", 366, "foot");
    expect(part).toHaveBeenCalledWith("rig-a", "clip-a", 366, "leg");
  });

  it("checks every tick of a continuous evidence window and adds it to capture plan", () => {
    const f = fixture();
    const evidence = f.observation.observation.evidence[2]!;
    evidence.toTick = 368;
    for (const tick of [367, 368]) {
      f.core.timeline.samples.push({ ...f.core.timeline.samples[2]!, tick,
        actors: [{ ...f.core.timeline.samples[2]!.actors[0]!, phaseQ: tick }] });
      evidence.samples.push({ ...structuredClone(evidence.samples[0]!), tick });
    }
    expect(check(f).checkedTicks).toEqual([120, 360, 366, 367, 368, 371, 480]);
    expect(check(f).requiredCaptureTicks).toEqual([120, 360, 366, 367, 368, 371, 480]);
  });

  it("rejects displaced anchors, mismatched or enlarged occluders", () => {
    const f = fixture();
    f.observation.observation.evidence[0]!.samples[0]!.anchors[0]!.position.x += 0.051;
    expect(() => check(f)).toThrow(/anchor/);
    const g = fixture();
    g.observation.observation.evidence[0]!.samples[0]!.occluders[0]!.min.x -= 0.051;
    expect(() => check(g)).toThrow(/occluder/);
    const h = fixture();
    h.observation.observation.evidence[0]!.samples[0]!.occluders[0]!.max.x -= 0.001;
    expect(() => check(h)).toThrow(/occluder/);
  });

  it("rejects missing resolver output, binding, and evidence samples", () => {
    const f = fixture();
    expect(() => check(f, { ...f.resolver, sampleAttachment: () => undefined })).toThrow(/attachment/);
    const g = fixture();
    g.observation.geometryBindings.occluders[0]!.actorId = "unknown";
    expect(() => check(g)).toThrow(/actor/);
    const h = fixture();
    h.observation.observation.evidence[0]!.samples.length = 0;
    expect(() => check(h)).toThrow(/sample/);
    const i = fixture();
    expect(() => check(i, { ...i.resolver, sampleGeometryPart: () => undefined })).toThrow(/geometry part/);
  });

  it("compares canonical ball and fixed field points at evidence ticks", () => {
    const f = fixture();
    f.observation.observation.evidence[2]!.samples[0]!.anchors[1]!.position.z += 0.051;
    expect(() => check(f)).toThrow(/anchor/);
    const g = fixture();
    g.observation.observation.evidence[4]!.samples[0]!.anchors[2]!.position.z = 35.9;
    expect(() => check(g)).toThrow(/anchor/);
  });
});
