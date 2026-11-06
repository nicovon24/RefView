import { describe, expect, it } from "vitest";
import type { ViewSample } from "@refview/simulation";
import { IncidentInput, integrateIncidentView } from "./input";

const view: ViewSample = { tick: 0, refereePosition: { x: 0, y: 0, z: 0 }, lookYaw: 0, lookPitch: 0,
  cameraMode: "thirdPerson", cameraDistanceM: 5, cameraLateralOffsetM: 0,
  viewportAspectRatio: 16 / 9, verticalFovRad: 1 };

describe("incident input", () => {
  it("assigns changes to the next sampled tick and consumes mouse look once", () => {
    const input = new IncidentInput();
    input.setActive(true, 0);
    input.key("KeyW", true, 1);
    input.mouse(100, -100, 2);
    const one = input.sampleTick(1, 16_667);
    const two = input.sampleTick(2, 33_334);
    expect(one.tick).toBe(1);
    expect(one.forward).toBe(true);
    expect(one.mouseDx).toBe(100);
    expect(two.mouseDx).toBe(0);
    expect(two.forward).toBe(true);
    expect(integrateIncidentView(view, 1, one).refereePosition.z).toBeGreaterThan(0);
    expect(integrateIncidentView(view, 1, one).lookYaw).toBeLessThan(0);
    expect(integrateIncidentView(view, 1, one).lookPitch).toBeGreaterThan(0);
  });

  it("maps right to negative x and normalizes diagonal and sprint movement", () => {
    const right = integrateIncidentView(view, 1, { tick: 1, forward: false, right: true, sprint: false, mouseDx: 0, mouseDy: 0 });
    expect(right.refereePosition.x).toBeLessThan(0);
    const diagonal = integrateIncidentView(view, 1, { tick: 1, forward: true, right: true, sprint: false, mouseDx: 0, mouseDy: 0 });
    const sprint = integrateIncidentView(view, 1, { tick: 1, forward: true, right: true, sprint: true, mouseDx: 0, mouseDy: 0 });
    expect(Math.hypot(diagonal.refereePosition.x, diagonal.refereePosition.z)).toBeCloseTo(4.2 / 60);
    expect(Math.hypot(sprint.refereePosition.x, sprint.refereePosition.z)).toBeCloseTo(7 / 60);
    expect(Math.hypot(sprint.refereePosition.x, sprint.refereePosition.z)).toBeLessThan(9 / 60);
  });

  it("clamps field bounds and C2 look limits", () => {
    const edge = { ...view, refereePosition: { x: -34, y: 0, z: 52.5 } };
    const next = integrateIncidentView(edge, 1, { tick: 1, forward: true, right: true, sprint: true, mouseDx: 10_000, mouseDy: -10_000 });
    expect(next.refereePosition).toEqual({ x: -34, y: 0, z: 52.5 });
    expect(Math.abs(next.lookYaw)).toBeLessThanOrEqual(12 / 60);
    expect(Math.abs(next.lookPitch)).toBeLessThanOrEqual(6 / 60);
    const opposite = integrateIncidentView({ ...view, refereePosition: { x: 34, y: 0, z: -52.5 } }, 1,
      { tick: 1, backward: true, left: true, sprint: true, mouseDx: 0, mouseDy: 0 });
    expect(opposite.refereePosition).toEqual({ x: 34, y: 0, z: -52.5 });
  });

  it("clears held input and pending look while inactive", () => {
    const input = new IncidentInput();
    input.setActive(true, 0);
    input.key("KeyW", true, 1);
    input.mouse(50, 25, 2);
    input.setActive(false);
    input.setActive(true, 100_000);
    expect(input.sampleTick(1, 116_667)).toMatchObject({ forward: false, mouseDx: 0, mouseDy: 0 });
  });

  it("applies press, mouse, and release only at crossed tick boundaries", () => {
    const input = new IncidentInput();
    input.setActive(true, 0);
    input.key("KeyW", true, 40_000);
    input.mouse(30, 0, 70_000);
    input.key("KeyW", false, 90_000);
    const samples = Array.from({ length: 6 }, (_, index) => input.sampleTick(index + 1, Math.round((index + 1) * 1_000_000 / 60)));
    expect(samples.map((sample) => sample.forward)).toEqual([false, false, true, true, true, false]);
    expect(samples.map((sample) => sample.mouseDx)).toEqual([0, 0, 0, 0, 30, 0]);
    const views = samples.reduce<ViewSample[]>((prior, sample) => [...prior, integrateIncidentView(prior.at(-1)!, sample.tick, sample)], [view]);
    expect(views[1]!.refereePosition.z).toBe(0);
    expect(views[2]!.refereePosition.z).toBe(0);
    expect(views[3]!.refereePosition.z).toBeGreaterThan(0);
    expect(views[6]!.refereePosition.z).toBe(views[5]!.refereePosition.z);
  });

  it("rejects stale events after a boundary and resets the resume baseline", () => {
    const input = new IncidentInput();
    input.setActive(true, 0);
    input.sampleTick(1, 16_667);
    expect(() => input.key("KeyW", true, 10_000)).toThrow(/stale/);
    input.setActive(false);
    input.setActive(true, 100_000);
    expect(() => input.mouse(1, 0, 99_999)).toThrow(/stale/);
    expect(input.sampleTick(2, 116_667).forward).toBe(false);
  });
});
