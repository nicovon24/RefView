import { describe, expect, it, vi } from "vitest";
import { createObservationFixture, validateObservationTraceV1 } from "@refview/simulation";
import { createLocalIncidentController } from "./live-controller";
import { createPublicPlayback, type PublicPlaybackSource } from "./public-playback";
import { buildRefereeLocomotionPlan, type RefereeMotionSample } from "../../rigged-player/pose/referee-locomotion";

const source: PublicPlaybackSource = {
  ref: { scenarioId: "incident-001", version: 2 }, durationTicks: 480, tickRateHz: 60,
  actors: Array.from({ length: 481 }, (_, tick) => ({ tick, actors: [{ actorHandle: "actor",
    position: { x: tick, y: 0, z: 0 }, yawRad: 0, clipHandle: "clip", phaseQ: 0 }] })),
  ball: Array.from({ length: 481 }, (_, tick) => ({ tick, ball: { position: { x: 0, y: 0, z: tick },
    orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })),
};
const initial = { tick: 0, refereePosition: { x: 0, y: 0, z: 0 }, lookYaw: 0, lookPitch: 0,
  cameraMode: "thirdPerson" as const, cameraDistanceM: 5, cameraLateralOffsetM: 0,
  viewportAspectRatio: 16 / 9, verticalFovRad: 1 };
const active = { documentVisible: true, pointerLocked: true, focused: true };
function make() {
  const controller = createLocalIncidentController({ source, initialView: initial,
    scenarioContentHash: "diagnostic-public-only", runId: "00000000-0000-4000-8000-000000000001" });
  controller.ready(); controller.start(0, active);
  return controller;
}

describe("local incident controller", () => {
  it("derives identical referee motion from canonical movement at 30, 60 and 144 fps", () => {
    const atRates = [30, 60, 144].map((fps) => {
      const controller = make();
      const rendered = new Map<number, RefereeMotionSample>();
      controller.key("KeyW", true, 1);
      for (let frame = 1; frame <= fps * 2; frame++) {
        controller.frame(Math.ceil(frame * 1_000_000 / fps), active, ({ tick, refereeMotion }) => {
          expect(refereeMotion.tick).toBe(tick);
          rendered.set(tick, refereeMotion);
        });
      }
      const plan = buildRefereeLocomotionPlan(controller.diagnosticViews.map(({ view }) => ({
        tick: view.tick, position: view.refereePosition, lookYaw: view.lookYaw,
      })));
      for (const [tick, motion] of rendered) expect(motion).toEqual(plan[tick]);
      expect(controller.currentRefereeMotion).toEqual(plan[controller.currentTick]);
      expect(plan[120]!.phaseCycles).toBeGreaterThan(0);
      return plan[120];
    });
    expect(atRates[1]).toEqual(atRates[0]);
    expect(atRates[2]).toEqual(atRates[0]);
  });

  it("advances referee motion at every crossed tick, holds it on pause and camera change, and resets it", () => {
    const controller = make();
    expect(controller.currentRefereeMotion).toMatchObject({ tick: 0, phaseCycles: 0, idleWeight: 1 });
    controller.key("KeyW", true, 1);
    controller.frame(50_000, active, ({ tick, refereeMotion }) => {
      expect(tick).toBe(3);
      expect(refereeMotion.tick).toBe(3);
    });
    const before = controller.currentRefereeMotion;
    expect(before.tick).toBe(3);
    expect(before.phaseCycles).toBeGreaterThan(0);
    controller.setCamera({ cameraMode: "firstPerson" });
    expect(controller.currentRefereeMotion).toBe(before);
    controller.resume(60_000, active);
    controller.frame(60_000, active, () => {});
    expect(controller.currentRefereeMotion).toBe(before);
    controller.frame(77_000, active, ({ refereeMotion }) => {
      expect(refereeMotion.tick).toBe(4);
      expect(refereeMotion.phaseCycles).toBe(before.phaseCycles);
    });
    controller.suspend(active);
    expect(controller.currentRefereeMotion.phaseCycles).toBe(before.phaseCycles);
    controller.restart("00000000-0000-4000-8000-000000000002");
    expect(controller.currentRefereeMotion).toMatchObject({ tick: 0, phaseCycles: 0, idleWeight: 1 });
    controller.ready(); controller.start(100_000, active);
    controller.frame(117_000, active, ({ refereeMotion }) => {
      expect(refereeMotion.tick).toBe(1);
      expect(refereeMotion.phaseCycles).toBe(0);
    });
  });

  for (const fps of [30, 60, 144]) it(`records every tick and exact receipts at ${fps} fps`, () => {
    const controller = make();
    const rendered: number[] = [];
    for (let frame = 1; frame <= fps * 8 + 1 && controller.state === "playing"; frame++) {
      controller.frame(Math.ceil(frame * 1_000_000 / fps), active, ({ tick, world }) => {
        expect(world.tick).toBe(tick); rendered.push(tick);
      });
    }
    expect(controller.state).toBe("sealed");
    expect(controller.trace?.views.map((item) => item.tick)).toEqual(Array.from({ length: 481 }, (_, i) => i));
    expect(controller.trace?.renderReceipts.map((item) => item.tick)).toEqual([...new Set(rendered)]);
    expect(controller.trace?.renderReceipts.at(-1)?.tick).toBe(480);
    expect(controller.trace?.breaks.at(-1)?.reason).toBe("deciding");
  });

  it("samples event timestamps at each crossed integer-microsecond boundary", () => {
    const controller = make();
    controller.key("KeyW", true, 20_000);
    controller.frame(50_000, active, () => {});
    expect(controller.currentView.tick).toBe(3);
    expect(controller.trace).toBeNull();
    const views = controller.diagnosticViews;
    expect(views[1]?.view.refereePosition.z).toBe(0);
    expect(views[2]?.view.refereePosition.z).toBeGreaterThan(0);
    expect(views[3]?.view.refereePosition.z).toBeGreaterThan(views[2]!.view.refereePosition.z);
  });

  it("pauses on pointer, focus, or visibility loss and resumes in a fresh epoch", () => {
    const controller = make();
    controller.key("KeyW", true, 1);
    controller.frame(17_000, active, () => {});
    controller.frame(18_000, { ...active, pointerLocked: false }, () => { throw Error("inactive render"); });
    expect(controller.state).toBe("paused");
    expect(controller.diagnosticBreaks).toMatchObject([{ afterTick: 1, nextEpoch: 1, reason: "pointerReleased" }]);
    controller.resume(100_000, active);
    controller.frame(117_000, active, () => {});
    expect(controller.diagnosticViews[2]?.epoch).toBe(1);
    expect(controller.diagnosticViews[2]?.view.refereePosition.z).toBe(controller.diagnosticViews[1]?.view.refereePosition.z);
    controller.frame(118_000, { ...active, focused: false }, () => {});
    expect(controller.state).toBe("paused");
    expect(controller.diagnosticBreaks.at(-1)?.reason).toBe("pause");
  });

  it("changes camera and viewport only at a new active tick and enforces C1 bounds", () => {
    const controller = make();
    controller.frame(17_000, active, () => {});
    controller.setViewport(initial.viewportAspectRatio);
    controller.setCamera({ cameraMode: initial.cameraMode });
    expect(controller.state).toBe("playing");
    controller.setCamera({ cameraMode: "firstPerson", verticalFovRad: 1.1, cameraDistanceM: 6 });
    expect(controller.state).toBe("paused");
    expect(controller.currentView.cameraMode).toBe("thirdPerson");
    controller.setViewport(1.2);
    expect(controller.diagnosticBreaks).toHaveLength(1);
    controller.resume(20_000, active);
    controller.frame(37_000, active, ({ view }) => {
      expect(view.cameraMode).toBe("firstPerson"); expect(view.viewportAspectRatio).toBe(1.2);
    });
    expect(controller.diagnosticViews[2]?.view.verticalFovRad).toBe(1.1);
    expect(() => controller.setViewport(0.5)).toThrow(/aspect/);
    expect(() => controller.setCamera({ cameraLateralOffsetM: 4 })).toThrow(/C1 bounds/);
  });

  it("does not receipt failed rendering and enters error; restart replaces local identity", () => {
    const controller = make();
    expect(() => controller.frame(17_000, active, () => { throw Error("webgl failed"); })).toThrow(/webgl failed/);
    expect(controller.state).toBe("error");
    expect(controller.diagnosticReceipts).toHaveLength(0);
    const old = controller.runId;
    controller.restart("00000000-0000-4000-8000-000000000002");
    expect(controller.state).toBe("loading");
    expect(controller.runId).not.toBe(old);
    expect(controller.runRevision).toBe(1);
    const reloaded = createLocalIncidentController({ source, initialView: initial,
      scenarioContentHash: "diagnostic-public-only", runId: "00000000-0000-4000-8000-000000000003" });
    expect(reloaded.runRevision).toBe(0);
    expect(reloaded.runId).not.toBe(controller.runId);
    reloaded.ready();
    expect(() => reloaded.setViewport(1.2)).toThrow(/active or paused/);
  });

  it("errors on the six-tick catch-up ceiling and seals before pointer release", () => {
    const controller = make();
    controller.frame(120_000, active, () => {});
    expect(controller.state).toBe("error");
    expect(controller.diagnosticBreaks[0]?.reason).toBe("performancePause");
    const complete = make(); const release = vi.fn(() => expect(complete.state).toBe("sealed"));
    for (let frame = 1; frame <= 481 && complete.state === "playing"; frame++)
      complete.frame(Math.ceil(frame * 1_000_000 / 60), active, () => {}, release);
    expect(release).toHaveBeenCalledOnce();
    expect(Object.isFrozen(complete.trace)).toBe(true);
    expect(Object.isFrozen(complete.trace?.views[0]?.view.refereePosition)).toBe(true);
    expect("seek" in complete).toBe(false);
    expect("setSpeed" in complete).toBe(false);
  });

  it("does not invent a second break or epoch before the next resumed tick", () => {
    const controller = make();
    controller.frame(17_000, active, () => {});
    controller.suspend(active);
    controller.resume(20_000, active);
    controller.suspend(active);
    expect(controller.state).toBe("paused");
    expect(controller.diagnosticBreaks).toHaveLength(1);
    controller.resume(30_000, active);
    controller.frame(47_000, active, () => {});
    expect(controller.diagnosticViews[2]?.epoch).toBe(1);
  });

  it("enters error when the 64th nonterminal break exceeds the capture limit", () => {
    const controller = make();
    let baseline = 0;
    for (let i = 1; i <= 63; i++) {
      baseline += 17_000;
      controller.frame(baseline, active, () => {});
      controller.suspend(active);
      expect(controller.diagnosticBreaks).toHaveLength(i);
      controller.resume(baseline + 1, active);
      baseline += 1;
    }
    baseline += 17_000;
    controller.frame(baseline, active, () => {});
    expect(() => controller.suspend(active)).toThrow(/break bound/);
    expect(controller.state).toBe("error");
    expect(controller.diagnosticBreaks).toHaveLength(63);
    expect(() => controller.key("KeyW", true, -1)).not.toThrow();
    expect(controller.trace).toBeNull();
  });

  it("emits a full trace accepted by the trusted C2 validator", () => {
    const hash = `sha256:${"a".repeat(64)}`;
    const controller = createLocalIncidentController({ source, initialView: initial,
      scenarioContentHash: hash, runId: "00000000-0000-4000-8000-000000000004" });
    const publicFixture = createPublicPlayback(source).fixture;
    const trustedFixture = createObservationFixture({ ref: source.ref, scenarioContentHash: hash,
      durationTicks: 480, visibilityModelVersion: 1, cameraRigVersion: 1,
      eyeCalibrationVersion: 1, cameraColliders: [], evidence: [] }, publicFixture, hash);
    controller.ready(); controller.start(0, active);
    controller.frame(17_000, active, () => {});
    controller.suspend(active);
    controller.resume(20_000, active);
    controller.suspend(active);
    controller.resume(30_000, active);
    for (let frame = 1; frame <= 480 && controller.state === "playing"; frame++)
      controller.frame(30_000 + Math.ceil(frame * 1_000_000 / 60), active, () => {});
    expect(controller.state).toBe("sealed");
    const trace = controller.trace!;
    expect(controller.diagnosticBreaks).toEqual(trace.breaks.filter((item) => item.reason !== "deciding"));
    expect(controller.diagnosticReceipts).toEqual(trace.renderReceipts);
    expect(controller.diagnosticViews).toEqual(trace.views);
    expect(() => validateObservationTraceV1(trace, { fixture: trustedFixture,
      attemptId: controller.runId, runRevision: controller.runRevision, role: "mainReferee",
      initialView: initial, fieldBounds: { minX: -34, maxX: 34, minZ: -52.5, maxZ: 52.5 },
      decisionTick: 480, decisionWindow: { fromTick: 0, toTick: 480 },
      eligibleDecidingTransition: true })).not.toThrow();
  });
});
