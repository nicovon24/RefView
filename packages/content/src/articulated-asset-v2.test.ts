import { describe, expect, it } from "vitest";
import { attachmentNames, geometryPartNames, samplePlayerGeometry } from "../assets/asset-001.mjs";
import type { Pose } from "../assets/asset-001.mjs";

const clip = async (name: string) => (await import(new URL(`../assets/${name}`, import.meta.url).href) as
  { samplePose: (phase: number) => Pose }).samplePose;
const runPose = await clip("asset-002.mjs");
const tripPose = await clip("asset-003.mjs");
const challengePose = await clip("asset-004.mjs");

const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe("articulated procedural asset", () => {
  it("runs with alternating grounded steps, visible knee flexion, and arm counter-swing", () => {
    const frames = Array.from({ length: 29 }, (_, phase) => samplePlayerGeometry(runPose(phase)));
    const leftHeights = frames.map(({ joints }) => joints.leftAnkle.y);
    const rightHeights = frames.map(({ joints }) => joints.rightAnkle.y);
    expect(Math.max(...leftHeights) - Math.min(...leftHeights)).toBeGreaterThan(0.07);
    expect(Math.max(...rightHeights) - Math.min(...rightHeights)).toBeGreaterThan(0.07);
    expect(frames.some(({ joints }) => joints.leftAnkle.y > joints.rightAnkle.y + 0.06)).toBe(true);
    expect(frames.some(({ joints }) => joints.rightAnkle.y > joints.leftAnkle.y + 0.06)).toBe(true);
    expect(Math.max(...frames.map(({ joints }) => joints.leftKnee.z)) -
      Math.min(...frames.map(({ joints }) => joints.leftKnee.z))).toBeGreaterThan(0.12);
    expect(frames.some(({ joints }) => joints.leftWrist.z * joints.leftAnkle.z < 0)).toBe(true);
    for (const { joints, parts } of frames) {
      expect(joints.head).toEqual({ x: 0, y: 1.72, z: 0 });
      expect(joints.spine).toEqual({ x: 0, y: 1.22, z: 0 });
      expect(parts.body).toEqual(frames[0]!.parts.body);
    }
    for (let phase = 1; phase < frames.length; phase++) {
      for (const name of Object.keys(frames[phase]!.joints) as (keyof typeof frames[number]["joints"])[]) {
        expect(distance(frames[phase]!.joints[name], frames[phase - 1]!.joints[name])).toBeLessThan(0.2);
      }
    }
  });

  it("keeps the authored run-to-incident clip transitions continuous", () => {
    for (const [runPhase, incident] of [[355, challengePose], [365, tripPose]] as const) {
      const before = samplePlayerGeometry(runPose(runPhase));
      const after = samplePlayerGeometry(incident(0));
      for (const name of Object.keys(after.joints) as (keyof typeof after.joints)[]) {
        expect(distance(before.joints[name], after.joints[name]), `${runPhase} ${name}`).toBeLessThan(0.2);
      }
    }
  });

  it("anticipates and recovers from the challenge with bent support and arm motion", () => {
    const frames = Array.from({ length: 21 }, (_, phase) => samplePlayerGeometry(challengePose(phase)));
    expect(frames[10]!.attachments.contactFoot).toEqual({ x: -0.75, y: 0.34, z: 0.9 });
    expect(frames[0]!.joints.leftKnee.z).not.toBeCloseTo(frames[10]!.joints.leftKnee.z);
    expect(frames[5]!.joints.rightKnee.y).toBeLessThan(frames[0]!.joints.rightKnee.y);
    expect(frames[10]!.joints.leftWrist.z).not.toBeCloseTo(frames[0]!.joints.leftWrist.z);
    expect(frames[20]!.joints).toEqual(frames[0]!.joints);
  });

  it("eases into a braced fall and settles hands above the turf", () => {
    const frames = Array.from({ length: 21 }, (_, phase) => samplePlayerGeometry(tripPose(phase)));
    expect(frames[0]!.attachments.contactFoot).toEqual({ x: 0, y: 0.34, z: 0 });
    expect(frames[20]!.joints.head.y).toBeLessThan(0.4);
    expect(frames[20]!.joints.leftWrist.y).toBeGreaterThanOrEqual(0.06);
    expect(frames[20]!.joints.rightWrist.y).toBeGreaterThanOrEqual(0.06);
    expect(frames[20]!.joints.head.y - frames[19]!.joints.head.y).toBeGreaterThan(-0.02);
    expect(frames[1]!.joints.head.y - frames[0]!.joints.head.y).toBeGreaterThan(-0.02);
    for (let phase = 1; phase < frames.length; phase++) {
      for (const name of Object.keys(frames[phase]!.joints) as (keyof typeof frames[number]["joints"])[]) {
        expect(distance(frames[phase]!.joints[name], frames[phase - 1]!.joints[name])).toBeLessThan(0.2);
      }
    }
  });
  it("shares actual joints across segments and attachment anchors", () => {
    expect(attachmentNames).toEqual(["contactFoot", "ground", "head", "torso"]);
    expect(geometryPartNames).toEqual(["body", "lowerLeg"]);
    for (const pose of [runPose(360), challengePose(10), tripPose(0), tripPose(10), tripPose(20)]) {
      const geometry = samplePlayerGeometry(pose);
      const { joints, segments, attachments } = geometry;
      expect(attachments.contactFoot).toEqual(joints.leftAnkle);
      expect(attachments.head).toEqual(joints.head);
      expect(attachments.torso).toEqual(joints.spine);
      expect(segments.torso).toEqual({ start: joints.hip, end: joints.spine });
      expect(segments.neck).toEqual({ start: joints.spine, end: joints.neck });
      expect(segments.leftThigh).toEqual({ start: joints.leftHip, end: joints.leftKnee });
      expect(segments.leftShin).toEqual({ start: joints.leftKnee, end: joints.leftAnkle });
      expect(segments.rightThigh).toEqual({ start: joints.rightHip, end: joints.rightKnee });
      expect(segments.rightShin).toEqual({ start: joints.rightKnee, end: joints.rightAnkle });
      for (const point of Object.values(joints)) {
        expect(Object.values(point).every(Number.isFinite)).toBe(true);
      }
    }
  });

  it("extends a visible left boot into the challenge and retracts smoothly", () => {
    const at = (phase: number) => samplePlayerGeometry(challengePose(phase)).attachments.contactFoot!;
    expect(at(10)).toEqual({ x: -0.75, y: 0.34, z: 0.9 });
    expect(distance(at(0), at(10))).toBeGreaterThan(1.15);
    expect(distance(at(0), at(10))).toBeLessThan(1.2);
    for (let phase = 1; phase <= 20; phase++) {
      expect(distance(at(phase), at(phase - 1))).toBeLessThan(0.2);
    }
    expect(distance(at(20), at(0))).toBeLessThan(0.01);
  });

  it("keeps head and limbs connected throughout the fall", () => {
    const first = samplePlayerGeometry(tripPose(0));
    const final = samplePlayerGeometry(tripPose(20));
    expect(first.attachments.contactFoot).toEqual({ x: 0, y: 0.34, z: 0 });
    expect(final.attachments.head!.y).toBeLessThan(0.4);
    expect(final.attachments.head!.z).toBeGreaterThan(1.2);
    for (let phase = 1; phase <= 20; phase++) {
      const previous = samplePlayerGeometry(tripPose(phase - 1));
      const current = samplePlayerGeometry(tripPose(phase));
      for (const name of Object.keys(current.joints) as (keyof typeof current.joints)[]) {
        expect(distance(current.joints[name], previous.joints[name])).toBeLessThan(0.2);
      }
      expect(distance(current.joints.neck, current.joints.head)).toBeLessThan(0.25);
      expect(distance(current.joints.spine, current.joints.neck)).toBeLessThan(0.55);
    }
  });
});
