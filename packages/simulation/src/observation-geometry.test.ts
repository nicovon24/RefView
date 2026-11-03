import { createTimelineFixture, worldStateChecksum } from "@refview/domain";
import { describe, expect, it } from "vitest";
import { createObservationFixture, measureEvidenceAtTick, reconstructViewpoints, type ObservationFixtureInput, type ViewSample } from "./observation-geometry";

const hash = `sha256:${"a".repeat(64)}`;
const timeline = createTimelineFixture({
  ref: { scenarioId: "geometry", version: 2 }, durationTicks: 2,
  samples: Array.from({ length: 3 }, (_, tick) => ({ tick, actors: [], ball: { position: { x: 0, y: 0, z: 0 }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })), events: [],
});
const point = (x: number, y = 1.7, z = 10) => ({ x, y, z });
const box = (boxId: string, min = point(-1, 0, 4), max = point(1, 3, 6)) => ({ boxId, min, max });
function input(): ObservationFixtureInput {
  return {
    ref: { scenarioId: "geometry", version: 2 }, scenarioContentHash: hash, durationTicks: 2,
    visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1, cameraColliders: [],
    evidence: [{ evidenceId: "contact", fromTick: 0, toTick: 2, requiredAnchorIds: ["foot", "ball"],
      samples: Array.from({ length: 3 }, (_, tick) => ({ tick, anchors: [{ anchorId: "foot", position: point(0) }, { anchorId: "ball", position: point(0.2) }], occluders: [] })) }],
  };
}
const view: ViewSample = { tick: 0, refereePosition: { x: 0, y: 0, z: 0 }, lookYaw: 0, lookPitch: 0,
  cameraMode: "firstPerson", cameraDistanceM: 4, cameraLateralOffsetM: 0, viewportAspectRatio: 1.5, verticalFovRad: 1, };
const create = (value = input()) => createObservationFixture(value, timeline, hash);

describe("RV-005 C1 observation geometry", () => {
  it("pins exact identity, duration, hash and supported versions", () => {
    expect(create().scenarioContentHash).toBe(hash);
    for (const change of [
      (x: ObservationFixtureInput) => { x.ref.version = 3; },
      (x: ObservationFixtureInput) => { x.durationTicks = 3; },
      (x: ObservationFixtureInput) => { x.scenarioContentHash = `sha256:${"b".repeat(64)}`; },
      (x: ObservationFixtureInput) => { x.scenarioContentHash = "sha256:ABC"; },
      (x: ObservationFixtureInput) => { x.visibilityModelVersion = 2; },
      (x: ObservationFixtureInput) => { x.cameraRigVersion = 2; },
      (x: ObservationFixtureInput) => { x.eyeCalibrationVersion = 2; },
    ]) { const x = input(); change(x); expect(() => create(x)).toThrow(); }
  });

  it("requires complete inclusive samples, stable unique IDs and finite ordered boxes", () => {
    for (const change of [
      (x: ObservationFixtureInput) => { x.evidence[0]!.samples.pop(); },
      (x: ObservationFixtureInput) => { x.evidence[0]!.samples[1]!.tick = 0; },
      (x: ObservationFixtureInput) => { x.evidence[0]!.samples[1]!.tick = 3; },
      (x: ObservationFixtureInput) => { x.evidence[0]!.samples[0]!.anchors.pop(); },
      (x: ObservationFixtureInput) => { x.evidence[0]!.samples[0]!.anchors.push({ anchorId: "foot", position: point(0) }); },
      (x: ObservationFixtureInput) => { x.evidence.push(x.evidence[0]!); },
      (x: ObservationFixtureInput) => { x.evidence[0]!.requiredAnchorIds.push("foot"); },
      (x: ObservationFixtureInput) => { x.evidence[0]!.samples[0]!.occluders = [box("same"), box("same")]; },
      (x: ObservationFixtureInput) => { x.cameraColliders = [box("bad", point(1, 0, 0), point(0, 1, 1))]; },
      (x: ObservationFixtureInput) => { x.cameraColliders = [box("bad", point(0, 0, 0), point(0, 1, 1))]; },
      (x: ObservationFixtureInput) => { x.cameraColliders = [box("bad", point(0, 0, 0), point(Number.POSITIVE_INFINITY, 1, 1))]; },
    ]) { const x = input(); change(x); expect(() => create(x)).toThrow(); }
  });

  it("copies and freezes nested private geometry", () => {
    const original = input(); const fixture = create(original);
    original.evidence[0]!.samples[0]!.anchors[0]!.position.z = 99;
    expect(fixture.evidence[0]!.samples[0]!.anchors[0]!.position.z).toBe(10);
    expect(Object.isFrozen(fixture.evidence[0]!.samples[0]!.anchors[0]!.position)).toBe(true);
    expect(Object.isFrozen(fixture.evidence[0]!.samples)).toBe(true);
  });

  it("reconstructs eye, first person, third person, roll-free basis, and collision clamp", () => {
    const fixture = create();
    const first = reconstructViewpoints(fixture, view);
    expect(first.eye.position).toEqual(point(0, 1.7, 0));
    expect(first.eye.forward).toEqual({ x: 0, y: 0, z: 1 });
    expect(first.camera).toEqual(first.eye);
    const pitched = reconstructViewpoints(fixture, { ...view, lookYaw: Math.PI / 2, lookPitch: Math.PI / 6 });
    expect(pitched.eye.forward.x).toBeCloseTo(Math.sqrt(3) / 2);
    expect(pitched.eye.forward.y).toBeCloseTo(0.5);
    expect(pitched.eye.right.z).toBeCloseTo(-1);
    const third = reconstructViewpoints(fixture, { ...view, cameraMode: "thirdPerson", lookYaw: Math.PI / 2, lookPitch: 0 });
    expect(third.camera.position.x).toBeCloseTo(-4);
    expect(third.camera.position.y).toBeCloseTo(2.1);
    expect(third.camera.position.z).toBeCloseTo(0);
    const lateral = reconstructViewpoints(fixture, { ...view, cameraMode: "thirdPerson", cameraLateralOffsetM: 2 });
    expect(lateral.camera.position).toEqual(point(2, 2.1, -4));
    expect(third.camera.right.y).toBe(0);
    expect(third.camera.up.x * third.camera.right.x + third.camera.up.y * third.camera.right.y + third.camera.up.z * third.camera.right.z).toBeCloseTo(0);
    const collisionInput = input(); collisionInput.cameraColliders = [box("wall", point(-1, 0, -2), point(1, 4, -1))];
    const collided = reconstructViewpoints(create(collisionInput), { ...view, cameraMode: "thirdPerson" });
    expect(collided.camera.position.z).toBeCloseTo(-0.9);
    expect(collided.eye.position).toEqual(first.eye.position);
    const insideInput = input(); insideInput.cameraColliders = [box("around-eye", point(-1, 0, -1), point(1, 4, 1))];
    expect(reconstructViewpoints(create(insideInput), { ...view, cameraMode: "thirdPerson" }).camera.position).toEqual(first.eye.position);
  });

  it("classifies joint, camera-only, eye-only and neither with all anchors at one tick", () => {
    const fixture = create();
    expect(measureEvidenceAtTick(fixture, "contact", 0, view).classification).toBe("joint");
    const cameraOnlyInput = input(); cameraOnlyInput.evidence[0]!.samples[0]!.anchors = [{ anchorId: "foot", position: point(0, 1.7, -3) }, { anchorId: "ball", position: point(0.2, 1.7, -3) }];
    expect(measureEvidenceAtTick(create(cameraOnlyInput), "contact", 0, { ...view, cameraMode: "thirdPerson" }).classification).toBe("cameraOnly");
    const eyeOnlyInput = input(); eyeOnlyInput.evidence[0]!.samples[0]!.occluders = [box("screen", point(1, 0, 0), point(3, 4, 4))];
    expect(measureEvidenceAtTick(create(eyeOnlyInput), "contact", 0, { ...view, cameraMode: "thirdPerson", cameraLateralOffsetM: 3 }).classification).toBe("eyeOnly");
    expect(measureEvidenceAtTick(fixture, "contact", 0, { ...view, lookYaw: Math.PI }).classification).toBe("neither");
  });

  it("rejects split anchors, occlusion, out-of-window and tick mismatch without changing world checksum", () => {
    const before = worldStateChecksum(timeline.snapshot(0));
    const split = input(); split.evidence[0]!.samples[0]!.anchors[1]!.position = point(0, 1.7, -10);
    expect(measureEvidenceAtTick(create(split), "contact", 0, view).classification).toBe("neither");
    const blocked = input(); blocked.evidence[0]!.samples[0]!.occluders = [box("block")];
    expect(measureEvidenceAtTick(create(blocked), "contact", 0, view).classification).toBe("neither");
    expect(() => measureEvidenceAtTick(create(), "contact", 0, { ...view, tick: 1 })).toThrow();
    expect(() => measureEvidenceAtTick(create(), "contact", 3, { ...view, tick: 3 })).toThrow();
    expect(worldStateChecksum(timeline.snapshot(0))).toBe(before);
  });

  it("never composes readability from different anchors or different ticks", () => {
    const crossView = input();
    crossView.evidence[0]!.samples[0]!.anchors[1]!.position = point(0, 1.7, -3);
    crossView.evidence[0]!.samples[0]!.occluders = [box("camera-screen", point(1, 0, 0), point(3, 4, 4))];
    expect(measureEvidenceAtTick(create(crossView), "contact", 0,
      { ...view, cameraMode: "thirdPerson", cameraLateralOffsetM: 3 }).classification).toBe("neither");
    const split = input();
    split.evidence[0]!.samples[0]!.anchors[0]!.position = point(0, 1.7, -3);
    split.evidence[0]!.samples[0]!.anchors[1]!.position = point(0, 1.7, 10);
    split.evidence[0]!.samples[1]!.anchors[0]!.position = point(0, 1.7, 10);
    split.evidence[0]!.samples[1]!.anchors[1]!.position = point(0, 1.7, -3);
    const fixture = create(split);
    const third = { ...view, cameraMode: "thirdPerson" as const };
    expect(measureEvidenceAtTick(fixture, "contact", 0, third).classification).toBe("cameraOnly");
    expect(measureEvidenceAtTick(fixture, "contact", 1, { ...third, tick: 1 }).classification).toBe("cameraOnly");
    const alternating = input();
    alternating.evidence[0]!.samples[0]!.anchors.forEach((a) => { a.position = point(0, 1.7, -3); });
    alternating.evidence[0]!.samples[1]!.occluders = [box("camera-screen", point(1, 0, 0), point(3, 4, 4))];
    const alternateFixture = create(alternating);
    expect(measureEvidenceAtTick(alternateFixture, "contact", 0, third).classification).toBe("cameraOnly");
    expect(measureEvidenceAtTick(alternateFixture, "contact", 1, { ...third, tick: 1, cameraLateralOffsetM: 3 }).classification).toBe("eyeOnly");
  });

  it("includes central angle and distance boundaries and rejects invalid view inputs", () => {
    const x = input(); x.evidence[0]!.samples[0]!.anchors = [{ anchorId: "foot", position: point(15, 1.7, 15 * Math.sqrt(3)) }, { anchorId: "ball", position: point(0, 1.7, 30) }];
    expect(measureEvidenceAtTick(create(x), "contact", 0, view).classification).toBe("joint");
    x.evidence[0]!.samples[0]!.anchors[1]!.position.z = 30.001;
    expect(measureEvidenceAtTick(create(x), "contact", 0, view).classification).toBe("neither");
    const vertical = input();
    vertical.evidence[0]!.samples[0]!.anchors[0]!.position = point(0, 1.7 + 10 * Math.tan(25 * Math.PI / 180), 10);
    expect(measureEvidenceAtTick(create(vertical), "contact", 0, view).classification).toBe("joint");
    vertical.evidence[0]!.samples[0]!.anchors[0]!.position.y += 0.01;
    expect(measureEvidenceAtTick(create(vertical), "contact", 0, view).classification).toBe("neither");
    for (const invalid of [{ ...view, lookYaw: Infinity }, { ...view, lookPitch: 1.3 }, { ...view, refereePosition: point(0, 0.1, 0) }, { ...view, verticalFovRad: 0 }, { ...view, cameraDistanceM: 9 }]) {
      expect(() => reconstructViewpoints(create(), invalid)).toThrow();
    }
  });
});
