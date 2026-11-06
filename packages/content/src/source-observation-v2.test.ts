import { describe, expect, it } from "vitest";
import { normalizeObservationSourceV2 } from "./source-observation-v2";

const rigNames = new Map([["attack-09", { attachments: ["leftFoot"], parts: ["lowerLeg"] }]]);
const fixture = () => ({
  observation: {
    visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
    cameraColliders: [] as Array<{ boxId: string; min: { x: number; y: number; z: number };
      max: { x: number; y: number; z: number } }>, evidence: [{ evidenceId: "EV-TRIP-CONTACT", fromTick: 366, toTick: 366,
      requiredAnchorIds: ["foot"], samples: [{ tick: 366,
        anchors: [{ anchorId: "foot", position: { x: 13.8, y: 0.2, z: 36.8 } }],
        occluders: [{ boxId: "leg", min: { x: 13.7, y: 0, z: 36.7 }, max: { x: 13.9, y: 0.5, z: 36.9 } }],
      }],
    }],
  },
  geometryBindings: {
    anchors: [{ evidenceId: "EV-TRIP-CONTACT", anchorId: "foot",
      target: { kind: "actorAttachment", actorId: "attack-09", attachmentName: "leftFoot" } }],
    occluders: [{ evidenceId: "EV-TRIP-CONTACT", boxId: "leg", actorId: "attack-09",
      geometryPartName: "lowerLeg" }],
  },
});

describe("v2 observation source", () => {
  it("normalizes, detaches, and freezes private geometry", () => {
    const input = fixture();
    const result = normalizeObservationSourceV2(input.observation, input.geometryBindings, rigNames);
    expect(result.observation.evidence[0]?.evidenceId).toBe("EV-TRIP-CONTACT");
    input.observation.evidence[0]!.samples[0]!.anchors[0]!.position.x = 99;
    expect(result.observation.evidence[0]?.samples[0]?.anchors[0]?.position.x).toBe(13.8);
    expect(Object.isFrozen(result.geometryBindings.anchors[0])).toBe(true);
  });

  it("rejects missing and unused geometry bindings", () => {
    const input = fixture();
    input.geometryBindings.anchors.length = 0;
    expect(() => normalizeObservationSourceV2(input.observation, input.geometryBindings, rigNames)).toThrow();
    const extra = fixture();
    extra.geometryBindings.anchors.push({ evidenceId: "EV-OTHER", anchorId: "foot",
      target: { kind: "actorAttachment", actorId: "attack-09", attachmentName: "leftFoot" } });
    expect(() => normalizeObservationSourceV2(extra.observation, extra.geometryBindings, rigNames)).toThrow();
  });

  it("rejects missing rig names and invalid field-line points", () => {
    const input = fixture();
    input.geometryBindings.anchors[0]!.target.attachmentName = "unknown";
    expect(() => normalizeObservationSourceV2(input.observation, input.geometryBindings, rigNames)).toThrow();
    const field = fixture();
    field.geometryBindings.anchors[0]!.target = {
      kind: "fieldPoint", feature: "nearPenaltyAreaLine", xM: 20.17,
    } as unknown as typeof field.geometryBindings.anchors[0]["target"];
    expect(() => normalizeObservationSourceV2(field.observation, field.geometryBindings, rigNames)).toThrow();
  });

  it("rejects accessors and extra keys without invoking getters", () => {
    const input = fixture();
    let called = false;
    Object.defineProperty(input.observation.evidence[0], "bad", { enumerable: true, get() { called = true; return 1; } });
    expect(() => normalizeObservationSourceV2(input.observation, input.geometryBindings, rigNames)).toThrow();
    expect(called).toBe(false);
  });

  it("normalizes camera collider permutations by box ID", () => {
    const a = fixture();
    a.observation.cameraColliders = [
      { boxId: "z", min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } },
      { boxId: "a", min: { x: 2, y: 0, z: 0 }, max: { x: 3, y: 1, z: 1 } },
    ];
    const b = structuredClone(a);
    b.observation.cameraColliders.reverse();
    expect(normalizeObservationSourceV2(a.observation, a.geometryBindings, rigNames))
      .toEqual(normalizeObservationSourceV2(b.observation, b.geometryBindings, rigNames));
  });
});
