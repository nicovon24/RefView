import { describe, expect, it } from "vitest";
import { createTimelineFixture } from "@refview/domain";
import { LiveCapture, type CaptureClock } from "./live-capture";
import { createObservationFixture, type ViewSample } from "./observation-geometry";
import { validateObservationTraceV1 } from "./observation-trace";
import { createLivePlayback } from "./playback";

class Clock implements CaptureClock {
  tick = 0;
  status: "idle" | "running" | "paused" | "performancePaused" = "idle";
  private last = 0;
  private remainder = 0;
  start(time: number) { this.last = time; this.status = "running"; }
  advance(time: number) {
    if (this.status !== "running") return;
    const total = this.remainder + (time - this.last) * 60;
    this.tick += Math.floor(total / 1_000_000);
    this.remainder = total % 1_000_000;
    this.last = time;
  }
  pause() { this.status = "paused"; }
  hide() { this.pause(); }
  losePointerLock() { this.pause(); }
  resume(time: number) { this.last = time; this.status = "running"; }
}

const initial: ViewSample = { tick: 0, refereePosition: { x: 0, y: 0, z: 0 }, lookYaw: 0,
  lookPitch: 0, cameraMode: "thirdPerson", cameraDistanceM: 4, cameraLateralOffsetM: 0,
  viewportAspectRatio: 1.5, verticalFovRad: 1 };
const identity = { scenarioRef: { scenarioId: "case", version: 1 }, scenarioContentHash: "hash",
  attemptId: "attempt", runRevision: 0, traceVersion: 1, visibilityModelVersion: 1,
  cameraRigVersion: 1, eyeCalibrationVersion: 1, observationRubricVersion: 1, role: "mainReferee" as const };
type Input = { step: number; turn?: number; cameraMode?: ViewSample["cameraMode"] };
const integrate = (prior: ViewSample, tick: number, input: Input): ViewSample => ({ ...prior,
  tick, lookYaw: prior.lookYaw + (input.turn ?? 0), cameraMode: input.cameraMode ?? prior.cameraMode,
  refereePosition: { ...prior.refereePosition, x: prior.refereePosition.x + input.step } });
function capture() { return new LiveCapture(new Clock(), identity, initial, integrate); }
const active = { workflowState: "playing" as const, documentVisible: true, pointerLocked: true, paused: false };
const submit = (recorder: LiveCapture<Input>) =>
  recorder.submitExact(active, () => {});
const advance = (recorder: LiveCapture<Input>, time: number, input: Input) =>
  recorder.advance(time, () => ({ input, sprint: false }));

describe("live capture adapter", () => {
  it.each([30, 60, 144])("captures every fixed tick at %i display fps without backfilling a frame pose", (fps) => {
    const recorder = capture();
    recorder.start(0);
    submit(recorder);
    for (let frame = 1; frame <= fps; frame++) {
      const time = Math.round(frame * 1_000_000 / fps);
      advance(recorder, time, { step: 0.05 });
      submit(recorder);
    }
    const trace = recorder.decide();
    expect(trace.views.map((v) => v.tick)).toEqual(Array.from({ length: 61 }, (_, i) => i));
    trace.views.forEach((v) => expect(v.view.refereePosition.x).toBeCloseTo(v.tick * 0.05, 10));
    expect(trace.renderReceipts.every((r) => r.source === "live" && r.workflowState === "playing" && r.documentVisible && r.pointerLocked && !r.paused)).toBe(true);
    expect(trace.renderReceipts).toHaveLength(fps + 1);
    expect(new Set(trace.renderReceipts.map((r) => r.tick)).size).toBeGreaterThanOrEqual(31);
    expect(trace.breaks).toEqual([{ sequence: trace.renderReceipts.length, afterTick: 60, nextEpoch: null, reason: "deciding" }]);
  });

  it("passes the exact current immutable view to the renderer", () => {
    const recorder = capture(); recorder.start(0);
    const old = recorder.currentView;
    advance(recorder, 16_667, { step: 0.05 });
    recorder.submitExact(active, (view) => {
      expect(view).toBe(recorder.currentView);
      expect(view).not.toBe(old);
      expect(Object.isFrozen(view)).toBe(true);
    });
    expect(recorder.decide().renderReceipts.map((r) => r.tick)).toEqual([1]);
  });

  it("closes epochs on inactivity and applies new camera settings only to the next tick", () => {
    const recorder = capture(); recorder.start(0);
    advance(recorder, 16_667, { step: 0.05 });
    const first = recorder.currentView;
    recorder.pause("cameraChanged");
    expect(() => submit(recorder)).toThrow(/active/);
    recorder.resume(1_000_000);
    advance(recorder, 1_016_667, { step: 0.05, cameraMode: "firstPerson" });
    expect(first.cameraMode).toBe("thirdPerson");
    expect(recorder.currentView.cameraMode).toBe("firstPerson");
    submit(recorder);
    const trace = recorder.decide();
    expect(trace.views.map((v) => v.epoch)).toEqual([0, 0, 1]);
    expect(trace.breaks.map((b) => [b.afterTick, b.nextEpoch, b.reason])).toEqual([[1, 1, "cameraChanged"], [2, null, "deciding"]]);
    expect(trace.renderReceipts.map((r) => [r.tick, r.epoch])).toEqual([[2, 1]]);
  });

  it("breaks on focus loss and performance pause, suppresses held-tick receipts, and resumes from a fresh clock baseline", () => {
    const recorder = capture(); recorder.start(0);
    advance(recorder, 16_667, { step: 0.05 });
    recorder.pause("hidden");
    recorder.resume(2_000_000);
    expect(() => submit(recorder)).toThrow(/active/);
    advance(recorder, 2_016_667, { step: 0.05 });
    submit(recorder);
    recorder.pause("performancePause");
    recorder.resume(3_000_000);
    advance(recorder, 3_016_667, { step: 0.05 });
    const trace = recorder.decide();
    expect(trace.views.map((v) => v.tick)).toEqual([0, 1, 2, 3]);
    expect(trace.breaks.map((b) => b.reason)).toEqual(["hidden", "performancePause", "deciding"]);
    expect(trace.renderReceipts.map((r) => [r.tick, r.epoch])).toEqual([[2, 1]]);
  });

  it.each(["pause", "pointerReleased", "viewportChanged"] as const)("records a %s break without inventing inactive ticks", (reason) => {
    const recorder = capture(); recorder.start(0);
    advance(recorder, 16_667, { step: 0.05 });
    recorder.pause(reason);
    recorder.resume(1_000_000);
    advance(recorder, 1_016_667, { step: 0.05 });
    const trace = recorder.decide();
    expect(trace.views.map((v) => [v.tick, v.epoch])).toEqual([[0, 0], [1, 0], [2, 1]]);
    expect(trace.breaks.map((b) => b.reason)).toEqual([reason, "deciding"]);
  });

  it("abandons an old revision on reload and cannot mutate the finalized trace", () => {
    const old = capture(); old.start(0); advance(old, 16_667, { step: 0.05 });
    old.abandon();
    expect(() => old.decide()).toThrow(/abandoned/);
    const next = new LiveCapture(new Clock(), { ...identity, runRevision: 1 }, initial, integrate);
    next.start(100); advance(next, 16_767, { step: 0.05 });
    const trace = next.decide();
    expect(trace.runRevision).toBe(1);
    expect(trace.views[0]?.tick).toBe(0);
    expect(() => advance(next, 33_434, { step: 0.05 })).toThrow(/finalized/);
    expect(Object.isFrozen(trace.views[0]?.view.refereePosition)).toBe(true);
  });

  it("produces a trace accepted by the server validator using the canonical playback clock", () => {
    const hash = `sha256:${"a".repeat(64)}`;
    const timeline = createTimelineFixture({ ref: identity.scenarioRef, durationTicks: 3,
      samples: Array.from({ length: 4 }, (_, tick) => ({ tick, actors: [], ball: {
        position: { x: 0, y: 0, z: 0 }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })), events: [] });
    const fixture = createObservationFixture({ ref: identity.scenarioRef, scenarioContentHash: hash,
      durationTicks: 3, visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
      cameraColliders: [], evidence: [] }, timeline, hash);
    const recorder = new LiveCapture(createLivePlayback(timeline, { maxCatchUpTicks: 4 }),
      { ...identity, scenarioContentHash: hash }, initial, integrate);
    recorder.start(0);
    submit(recorder);
    advance(recorder, 33_334, { step: 0.05 });
    submit(recorder);
    const trace = recorder.decide();
    expect(trace.views.map((v) => v.view.refereePosition.x)).toEqual([0, 0.05, 0.1]);
    const trusted = { fixture, attemptId: "attempt", runRevision: 0,
      role: "mainReferee", initialView: initial, fieldBounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
      decisionTick: 2, decisionWindow: { fromTick: 0, toTick: 3 }, eligibleDecidingTransition: true } as const;
    expect(() => validateObservationTraceV1(trace, trusted)).not.toThrow();
    const interrupted = new LiveCapture(createLivePlayback(timeline, { maxCatchUpTicks: 4 }),
      { ...identity, scenarioContentHash: hash }, initial, integrate);
    interrupted.start(0);
    advance(interrupted, 16_667, { step: 0.05 });
    expect(() => interrupted.submitExact({ ...active, documentVisible: false }, () => {})).toThrow(/inactive/);
    interrupted.resume(1_000_000);
    advance(interrupted, 1_016_667, { step: 0.05 });
    submit(interrupted);
    expect(() => validateObservationTraceV1(interrupted.decide(), trusted)).not.toThrow();
  });

  it("does not create an empty epoch when paused again before the first resumed tick", () => {
    const recorder = capture(); recorder.start(0);
    advance(recorder, 16_667, { step: 0.05 });
    recorder.pause("hidden");
    recorder.resume(1_000_000);
    recorder.pause("pointerReleased");
    recorder.resume(2_000_000);
    advance(recorder, 2_016_667, { step: 0.05 });
    const trace = recorder.decide();
    expect(trace.views.map((v) => v.epoch)).toEqual([0, 0, 1]);
    expect(trace.breaks.map((b) => [b.afterTick, b.nextEpoch, b.reason])).toEqual(
      [[1, 1, "hidden"], [2, null, "deciding"]]);
  });

  it("records a receipt only after the exact render callback confirms submission", () => {
    const recorder = capture(); recorder.start(0);
    let submitted = 0;
    expect(() => recorder.submitExact({ ...active, pointerLocked: false }, () => { submitted++; })).toThrow(/inactive/);
    recorder.resume(1_000_000);
    advance(recorder, 1_016_667, { step: 0.05 });
    expect(() => recorder.submitExact(active, () => { throw new Error("renderer failed"); })).toThrow(/renderer failed/);
    expect(submitted).toBe(0);
    recorder.submitExact(active, (view) => { expect(view).toBe(recorder.currentView); submitted++; });
    expect(submitted).toBe(1);
    expect(recorder.decide().renderReceipts).toHaveLength(1);
  });

  it("does not claim a receipt when submission crosses a lifecycle break", () => {
    const recorder = capture(); recorder.start(0);
    expect(() => recorder.submitExact(active, () => recorder.pause("hidden"))).toThrow(/lifecycle/);
    recorder.resume(1_000_000);
    advance(recorder, 1_016_667, { step: 0.05 });
    expect(recorder.decide().renderReceipts).toHaveLength(0);
  });

  it.each([
    [{ ...active, documentVisible: false }, "hidden"],
    [{ ...active, pointerLocked: false }, "pointerReleased"],
    [{ ...active, paused: true }, "pause"],
    [{ ...active, workflowState: "other" as const }, "pause"],
  ] as const)("closes the epoch for an inactive renderer and cannot credit its held tick", (inactive, reason) => {
    const recorder = capture(); recorder.start(0);
    advance(recorder, 16_667, { step: 0.05 });
    expect(() => recorder.submitExact(inactive, () => {})).toThrow(/inactive/);
    recorder.resume(1_000_000);
    expect(() => submit(recorder)).toThrow(/active/);
    advance(recorder, 1_016_667, { step: 0.05 });
    submit(recorder);
    const trace = recorder.decide();
    expect(trace.breaks.map((b) => b.reason)).toEqual([reason, "deciding"]);
    expect(trace.renderReceipts.map((r) => [r.tick, r.epoch])).toEqual([[2, 1]]);
    expect(trace.views.map((v) => v.epoch)).toEqual([0, 0, 1]);
  });

  it.each([30, 60, 144])("samples changing controls once per crossed tick at %i fps", (fps) => {
    const recorder = capture(); recorder.start(0);
    const requested: number[] = [];
    const source = (tick: number) => {
      requested.push(tick);
      return { input: { step: tick % 2 ? 0.03 : 0.05, turn: tick % 2 ? 0.01 : -0.01 }, sprint: tick % 2 === 0 };
    };
    recorder.advance(1_000, source);
    expect(requested).toEqual([]);
    for (let frame = 1; frame <= fps; frame++) recorder.advance(Math.round(frame * 1_000_000 / fps), source);
    const trace = recorder.decide();
    expect(requested).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
    expect(trace.views.map((v) => v.sprint)).toEqual([false, ...Array.from({ length: 60 }, (_, i) => (i + 1) % 2 === 0)]);
    trace.views.forEach((record) => {
      expect(record.view.refereePosition.x).toBeCloseTo(Math.ceil(record.tick / 2) * 0.03 + Math.floor(record.tick / 2) * 0.05, 10);
      expect(record.view.lookYaw).toBeCloseTo(record.tick % 2 ? 0.01 : 0, 10);
    });
  });
});
