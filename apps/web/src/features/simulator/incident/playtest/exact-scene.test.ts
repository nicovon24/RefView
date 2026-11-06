import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { createExactSceneRenderer, JOINT_NAMES, SEGMENT_NAMES, type ActorSceneNodes, type RiggedSceneActor, type RiggedRefereeScene } from "./exact-scene";
import { createLocalIncidentController } from "./live-controller";
import { stationaryRefereeMotion } from "../../rigged-player/pose/referee-locomotion";

const point = (x: number, y: number, z: number) => ({ x, y, z });
const makeFrame = (tick = 1, phaseQ = 1) => ({ tick,
  refereeMotion: stationaryRefereeMotion(tick),
  view: { tick, refereePosition: point(2, 0, 3), lookYaw: 0, lookPitch: 0,
    cameraMode: "thirdPerson" as const, cameraDistanceM: 5, cameraLateralOffsetM: 0,
    viewportAspectRatio: 2, verticalFovRad: 1 },
  world: { ref: { scenarioId: "case", version: 1 }, tick,
    actors: [{ actorId: "actor-001", position: point(tick, 0, 7), yawRad: 0.3,
      clipId: "asset-002", phaseQ }],
    ball: { position: point(5, 0.1, tick), orientation: { qx: 0, qy: 0.5, qz: 0, qw: Math.sqrt(0.75) } } },
});
function setup() {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
  const root = new THREE.Group(), ball = new THREE.Group(), referee = new THREE.Group();
  const joints = Object.fromEntries(JOINT_NAMES.map((name) => [name, new THREE.Group()])) as unknown as ActorSceneNodes["joints"];
  const segments = Object.fromEntries(SEGMENT_NAMES.map((name) => [name, new THREE.Group()])) as unknown as ActorSceneNodes["segments"];
  const boots = { left: new THREE.Group(), right: new THREE.Group() };
  scene.add(root, ball, referee);
  root.add(...Object.values(joints), ...Object.values(segments), boots.left, boots.right);
  const geometry = (pose: { leftLegPitchRad: number }) => ({
    joints: Object.fromEntries(JOINT_NAMES.map((name) => [name,
      point(name === "leftAnkle" ? pose.leftLegPitchRad : 0, name === "leftAnkle" ? 0.2 : 1, 0)])),
    segments: Object.fromEntries(SEGMENT_NAMES.map((name) => [name,
      { start: point(0, 0, 0), end: point(0, name === "leftShin" ? 1 + pose.leftLegPitchRad : 1, 0) }])),
  });
  const render = vi.fn(() => {
    expect(root.position.x).toBe(1);
    expect(ball.position.z).toBe(1);
    expect(camera.position.toArray()).toEqual([2, 2.1, -2]);
    expect((joints.leftAnkle as THREE.Group).position.x).toBe(1);
  });
  const gl = { domElement: { getBoundingClientRect: () => ({ width: 800, height: 400 }) },
    getContext: () => ({ isContextLost: () => false }), render };
  const options = { scene, camera, gl, actors: new Map([["actor-001", { root, joints, segments, boots }]]),
    ball, referee, rigBindings: new Map([["actor-001", "asset-001"]]),
    modules: new Map<string, unknown>([["asset-001", { samplePlayerGeometry: geometry }],
      ["asset-002", { samplePose: (phaseQ: number) => ({ leftLegPitchRad: phaseQ }) }]]) };
  return { options, render, joints, segments, boots, root, ball, referee, camera };
}

describe("exact scene submission", () => {
  it("samples a rigged referee at the public tick without changing ball or camera", () => {
    const s = setup();
    const applyFrame = vi.fn((frame) => {
      s.referee.position.set(frame.position.x, frame.position.y, frame.position.z);
      s.referee.rotation.set(0, frame.lookYaw, 0);
      s.referee.visible = frame.cameraMode === 'thirdPerson' && !frame.elevatedReview;
    });
    const referee: RiggedRefereeScene = { kind: 'rigged-referee', root: s.referee, applyFrame };
    const motion = { ...stationaryRefereeMotion(1), phaseCycles: 1.25,
      idleWeight: 0, walkWeight: 0.25, jogWeight: 0.75, bodyYawOffsetRad: 0.2 };
    createExactSceneRenderer({ ...s.options, referee })({ ...makeFrame(), refereeMotion: motion });
    expect(applyFrame).toHaveBeenCalledWith({ tick: 1, position: point(2, 0, 3), lookYaw: 0,
      cameraMode: 'thirdPerson', elevatedReview: false, motion });
    expect(s.referee.position.toArray()).toEqual([2, 0, 3]);
    expect(s.ball.position.toArray()).toEqual([5, 0.1, 1]);
    expect(s.camera.position.toArray()).toEqual([2, 2.1, -2]);
    s.render.mockImplementation(() => {});
    createExactSceneRenderer({ ...s.options, referee })({ ...makeFrame(),
      view: { ...makeFrame().view, cameraMode: 'firstPerson' } });
    expect(s.referee.visible).toBe(false);
  });

  it("rejects a rigged referee that moves its canonical root", () => {
    const s = setup();
    const referee: RiggedRefereeScene = { kind: 'rigged-referee', root: s.referee,
      applyFrame: () => { s.referee.position.set(99, 0, 3); } };
    expect(() => createExactSceneRenderer({ ...s.options, referee })(makeFrame())).toThrow(/referee.*canonical root/);
    expect(s.render).not.toHaveBeenCalled();
  });

  it("rejects a non-finite rigged referee quaternion before GPU submission", () => {
    const s = setup();
    const referee: RiggedRefereeScene = { kind: 'rigged-referee', root: s.referee,
      applyFrame: (frame) => {
        s.referee.position.set(frame.position.x, frame.position.y, frame.position.z);
        s.referee.quaternion.set(Number.NaN, 0, 0, 1);
        s.referee.visible = true;
      } };
    expect(() => createExactSceneRenderer({ ...s.options, referee })(makeFrame())).toThrow(/referee.*canonical root/);
    expect(s.render).not.toHaveBeenCalled();
  });
  it("samples a rigged actor from the exact canonical frame before submission", () => {
    const s = setup();
    const applyFrame = vi.fn((frame) => {
      s.root.position.set(frame.rootPosition.x, frame.rootPosition.y, frame.rootPosition.z);
      s.root.rotation.set(0, frame.yawRad, 0);
    });
    const actor: RiggedSceneActor = { kind: "rigged", root: s.root, applyFrame };
    s.render.mockImplementation(() => {
      expect(applyFrame).toHaveBeenCalledOnce();
      expect(s.root.position.x).toBe(1);
    });
    const render = createExactSceneRenderer({ ...s.options, actors: new Map([["actor-001", actor]]) });
    render(makeFrame());
    expect(applyFrame).toHaveBeenCalledWith({ tick: 1, actorHandle: "actor-001",
      rootPosition: point(1, 0, 7), yawRad: 0.3, clipHandle: "asset-002", phaseQ: 1 });
    expect(s.render).toHaveBeenCalledOnce();
    expect(s.ball.position.toArray()).toEqual([5, 0.1, 1]);
  });

  it("does not submit a rigged frame when sampling fails or changes the canonical root", () => {
    for (const failure of ["throw", "root"] as const) {
      const s = setup();
      const actor: RiggedSceneActor = { kind: "rigged", root: s.root, applyFrame: () => {
        if (failure === "throw") throw new Error("pose unavailable");
        s.root.position.set(99, 0, 7);
      } };
      const render = createExactSceneRenderer({ ...s.options, actors: new Map([["actor-001", actor]]) });
      expect(() => render(makeFrame())).toThrow(/pose unavailable|canonical root/);
      expect(s.render).not.toHaveBeenCalled();
    }
  });

  it("applies one tick's actors, articulation, ball, referee, and camera before render", () => {
    const s = setup();
    createExactSceneRenderer(s.options)(makeFrame());
    expect(s.render).toHaveBeenCalledOnce();
    expect(s.root.rotation.y).toBe(0.3);
    expect(s.boots.left.position.x).toBe(1);
    expect(s.ball.quaternion.y).toBe(0.5);
    expect(s.referee.position.toArray()).toEqual([2, 0, 3]);
    expect(s.referee.visible).toBe(true);
    expect(s.camera.aspect).toBe(2);
    expect(s.camera.fov).toBeCloseTo(180 / Math.PI);
    expect(s.camera.getWorldDirection(new THREE.Vector3()).z).toBeGreaterThan(0);
  });
  it("changes articulated challenge pose at the next tick", () => {
    const s = setup(); const submit = createExactSceneRenderer(s.options);
    submit(makeFrame());
    const before = (s.joints.leftAnkle as THREE.Group).position.x;
    s.render.mockImplementation(() => {});
    submit(makeFrame(2, 2));
    expect((s.joints.leftAnkle as THREE.Group).position.x).toBe(2);
    expect((s.joints.leftAnkle as THREE.Group).position.x).not.toBe(before);
    expect((s.segments.leftShin as THREE.Group).scale.y).toBe(3);
  });
  it("rejects missing assets or nodes before rendering", () => {
    const s = setup(); const submit = createExactSceneRenderer(s.options);
    s.options.modules.delete("asset-002");
    expect(() => submit(makeFrame())).toThrow(/asset-002/);
    expect(s.render).not.toHaveBeenCalled();
    s.options.modules.set("asset-002", { samplePose: () => ({ leftLegPitchRad: 1 }) });
    delete (s.options.actors.get("actor-001")!.joints as Partial<ActorSceneNodes["joints"]>).leftAnkle;
    expect(() => submit(makeFrame())).toThrow(/leftAnkle/);
    expect(s.render).not.toHaveBeenCalled();
  });
  it("rejects a detached articulation node before rendering", () => {
    const s = setup();
    s.root.remove(s.joints.leftAnkle);
    expect(() => createExactSceneRenderer(s.options)(makeFrame())).toThrow(/leftAnkle.*scene|leftAnkle.*root/);
    expect(s.render).not.toHaveBeenCalled();
  });
  it("rejects detached actor, ball, or referee roots", () => {
    for (const name of ["actor", "ball", "referee"] as const) {
      const s = setup();
      s.options.scene.remove(name === "actor" ? s.root : name === "ball" ? s.ball : s.referee);
      expect(() => createExactSceneRenderer(s.options)(makeFrame())).toThrow(/detached/);
      expect(s.render).not.toHaveBeenCalled();
    }
  });
  it("rejects a stale tick, wrong canvas aspect, and lost context before rendering", () => {
    const s = setup(); const submit = createExactSceneRenderer(s.options);
    expect(() => submit({ ...makeFrame(), view: { ...makeFrame().view, tick: 0 } })).toThrow(/tick/);
    expect(() => submit({ ...makeFrame(), refereeMotion: stationaryRefereeMotion(0) })).toThrow(/tick/);
    expect(() => submit({ ...makeFrame(), view: { ...makeFrame().view, viewportAspectRatio: 1 } })).toThrow(/aspect/);
    s.options.gl.getContext = () => ({ isContextLost: () => true });
    expect(() => submit(makeFrame())).toThrow(/context/);
    expect(s.render).not.toHaveBeenCalled();
  });
  it("propagates render failure to the receipt owner", () => {
    const s = setup(); s.render.mockImplementation(() => { throw Error("GPU failure"); });
    expect(() => createExactSceneRenderer(s.options)(makeFrame())).toThrow("GPU failure");
  });
  it("leaves no receipt when a node detaches before the controller's render callback", () => {
    const s = setup();
    const source = { ref: { scenarioId: "case", version: 1 }, durationTicks: 480, tickRateHz: 60,
      actors: Array.from({ length: 481 }, (_, tick) => ({ tick, actors: [{ actorHandle: "actor-001",
        position: point(tick, 0, 7), yawRad: 0.3, clipHandle: "asset-002", phaseQ: 1 }] })),
      ball: Array.from({ length: 481 }, (_, tick) => ({ tick,
        ball: { position: point(5, 0.1, tick), orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })),
    };
    const controller = createLocalIncidentController({ source, initialView: {
      ...makeFrame(0).view, refereePosition: point(2, 0, 3) }, scenarioContentHash: "public-only",
      runId: "00000000-0000-4000-8000-000000000001" });
    const active = { documentVisible: true, pointerLocked: true, focused: true };
    controller.ready(); controller.start(0, active);
    s.root.remove(s.joints.leftAnkle);
    expect(() => controller.frame(17_000, active, createExactSceneRenderer(s.options))).toThrow(/detached/);
    expect(controller.state).toBe("error");
    expect(controller.diagnosticReceipts).toEqual([]);
  });
});
