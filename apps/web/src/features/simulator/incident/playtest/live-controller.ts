import type { WorldState } from "@refview/domain";
import { LiveCapture, type ObservationTraceV1, type ViewSample } from "@refview/simulation";
import { createActor, createMachine } from "xstate";
import { IncidentInput, integrateIncidentView, type IncidentTickInput } from "./input";
import { createPublicPlayback, type PublicPlaybackSource } from "./public-playback";
import { advanceRefereeLocomotion, createRefereeLocomotion,
  type RefereeLocomotionState, type RefereeMotionSample } from "../../rigged-player/pose/referee-locomotion";

export type LocalLifecycle = "loading" | "ready" | "playing" | "paused" | "sealed" | "error";
export type ActiveSurface = Readonly<{ documentVisible: boolean; pointerLocked: boolean; focused: boolean }>;
export type LocalRenderFrame = Readonly<{ tick: number; view: ViewSample; world: WorldState;
  refereeMotion: RefereeMotionSample }>;
type CameraChange = Partial<Pick<ViewSample, "cameraMode" | "cameraDistanceM" | "cameraLateralOffsetM" | "verticalFovRad">>;
type BreakReason = Exclude<ObservationTraceV1["breaks"][number]["reason"], "deciding">;
const machine = createMachine({ initial: "loading", states: {
  loading: { on: { READY: "ready" } }, ready: { on: { START: "playing", RESTART: "loading" } },
  playing: { on: { PAUSE: "paused", SEAL: "sealed", FAIL: "error", RESTART: "loading" } },
  paused: { on: { RESUME: "playing", FAIL: "error", RESTART: "loading" } },
  sealed: { on: { RESTART: "loading" } }, error: { on: { RESTART: "loading" } },
} });

function validateView(view: ViewSample): void {
  const p = view.refereePosition;
  if (view.tick !== 0 || p.y !== 0 || [p.x, p.z, view.lookYaw, view.lookPitch, view.cameraDistanceM,
    view.cameraLateralOffsetM, view.viewportAspectRatio, view.verticalFovRad].some((n) => !Number.isFinite(n))
    || Math.abs(p.x) > 34 || Math.abs(p.z) > 52.5 || Math.abs(view.lookPitch) > 1.2
    || !["firstPerson", "thirdPerson"].includes(view.cameraMode)
    || view.cameraDistanceM < 2 || view.cameraDistanceM > 8
    || Math.abs(view.cameraLateralOffsetM) > 3 || view.viewportAspectRatio < 0.75
    || view.viewportAspectRatio > 2.5 || view.verticalFovRad < 0.785 || view.verticalFovRad > 1.31)
    throw new RangeError("view outside C1 bounds");
}

function validateRunId(runId: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId))
    throw new RangeError("diagnostic run ID must be a UUID");
}

function freezeTrace(trace: ObservationTraceV1): ObservationTraceV1 {
  for (const r of trace.views) { Object.freeze(r.view.refereePosition); Object.freeze(r.view); Object.freeze(r); }
  for (const r of trace.renderReceipts) Object.freeze(r);
  for (const r of trace.breaks) Object.freeze(r);
  Object.freeze(trace.scenarioRef);
  return Object.freeze(trace);
}

/** Local diagnostics only: no persistence, scoring, or server workflow transition. */
export class LocalIncidentController {
  private actor = createActor(machine).start();
  private playback: ReturnType<typeof createPublicPlayback>;
  private input = new IncidentInput();
  private capture: LiveCapture<IncidentTickInput>;
  private refereeLocomotion: RefereeLocomotionState;
  private lastFrameUs = 0;
  private lastReceiptTick = -1;
  private needsNextTick = false;
  private pending: CameraChange & Partial<Pick<ViewSample, "viewportAspectRatio">> = {};
  private epoch = 0;
  private views: ObservationTraceV1["views"] = [];
  private receipts: ObservationTraceV1["renderReceipts"] = [];
  private breaks: ObservationTraceV1["breaks"] = [];
  private sealed: ObservationTraceV1 | null = null;
  private sequence = 0;
  private identity: string;
  private revision = 0;

  constructor(private readonly options: { source: PublicPlaybackSource; initialView: ViewSample;
    scenarioContentHash: string; runId?: string }) {
    validateView(options.initialView);
    this.identity = options.runId ?? crypto.randomUUID();
    validateRunId(this.identity);
    this.playback = createPublicPlayback(options.source);
    this.refereeLocomotion = createRefereeLocomotion({ tick: 0,
      position: options.initialView.refereePosition, lookYaw: options.initialView.lookYaw });
    this.capture = this.makeCapture();
  }
  private makeCapture() {
    return new LiveCapture<IncidentTickInput>(this.playback.clock, {
      scenarioRef: this.options.source.ref, scenarioContentHash: this.options.scenarioContentHash,
      attemptId: this.identity, runRevision: this.revision, traceVersion: 1, visibilityModelVersion: 1,
      cameraRigVersion: 1, eyeCalibrationVersion: 1, observationRubricVersion: 1, role: "mainReferee",
    }, this.options.initialView, (prior, tick, input) => {
      const next = integrateIncidentView({ ...prior, ...this.pending }, tick, input);
      this.refereeLocomotion = advanceRefereeLocomotion(this.refereeLocomotion, {
        tick, position: next.refereePosition, lookYaw: next.lookYaw,
      });
      this.pending = {};
      this.needsNextTick = false;
      this.views.push(Object.freeze({ tick, epoch: this.epoch, sprint: !!input.sprint,
        view: Object.freeze({ ...next, refereePosition: Object.freeze({ ...next.refereePosition }) }) }));
      return next;
    });
  }
  get state(): LocalLifecycle { return this.actor.getSnapshot().value as LocalLifecycle; }
  get runId() { return this.identity; }
  get runRevision() { return this.revision; }
  get currentView() { return this.capture.currentView; }
  get currentRefereeMotion() { return this.refereeLocomotion.sample; }
  get currentTick() { return this.playback.clock.tick; }
  get publicFrameChecksum() { return this.playback.publicFrameChecksum; }
  get trace() { return this.sealed; }
  get diagnosticViews() { return [...this.views]; }
  get diagnosticReceipts() { return [...this.receipts]; }
  get diagnosticBreaks() { return [...this.breaks]; }
  private isActive(surface: ActiveSurface) { return surface.documentVisible && surface.pointerLocked && surface.focused; }
  ready(): void {
    if (this.state !== "loading") throw new Error("run is not loading");
    this.actor.send({ type: "READY" });
  }
  start(timestampUs: number, surface: ActiveSurface): void {
    if (this.state !== "ready" || !this.isActive(surface)) throw new Error("active ready surface required");
    this.capture.start(timestampUs);
    this.input.setActive(true, timestampUs);
    this.lastFrameUs = timestampUs;
    this.views.push(Object.freeze({ tick: 0, epoch: 0, sprint: false, view: this.capture.currentView }));
    this.actor.send({ type: "START" });
  }
  key(code: string, pressed: boolean, timestampUs: number) { this.input.key(code, pressed, timestampUs); }
  mouse(dx: number, dy: number, timestampUs: number) { this.input.mouse(dx, dy, timestampUs); }
  private pause(reason: BreakReason): void {
    if (this.state !== "playing") return;
    try {
      this.capture.pause(reason);
    } catch (error) {
      this.input.setActive(false);
      this.capture.abandon();
      this.actor.send({ type: "FAIL" });
      throw error;
    }
    this.input.setActive(false);
    if (!this.needsNextTick) {
      this.breaks.push(Object.freeze({ sequence: this.sequence++, afterTick: this.currentTick,
        nextEpoch: ++this.epoch, reason }));
    }
    this.needsNextTick = true;
    this.actor.send({ type: "PAUSE" });
  }
  suspend(surface: ActiveSurface): void {
    this.pause(!surface.documentVisible ? "hidden" : !surface.pointerLocked ? "pointerReleased" : "pause");
  }
  resume(timestampUs: number, surface: ActiveSurface): void {
    if (this.state !== "paused" || !this.isActive(surface)) throw new Error("active paused surface required");
    this.capture.resume(timestampUs);
    this.input.setActive(true, timestampUs);
    this.lastFrameUs = timestampUs;
    this.lastReceiptTick = this.currentTick;
    this.actor.send({ type: "RESUME" });
  }
  setCamera(change: CameraChange): void {
    if (this.state !== "playing" && this.state !== "paused")
      throw new Error("camera change requires an active or paused run");
    const effective = { ...this.currentView, ...this.pending };
    validateView({ ...effective, ...change, tick: 0 });
    if ((Object.keys(change) as (keyof CameraChange)[]).every((key) => change[key] === effective[key])) return;
    if (this.state === "playing") this.pause("cameraChanged");
    this.pending = { ...this.pending, ...change };
  }
  setViewport(aspectRatio: number): void {
    if (this.state !== "playing" && this.state !== "paused")
      throw new Error("viewport change requires an active or paused run");
    if (!Number.isFinite(aspectRatio) || aspectRatio < 0.75 || aspectRatio > 2.5)
      throw new RangeError("viewport aspect outside C1 bounds");
    if (aspectRatio === (this.pending.viewportAspectRatio ?? this.currentView.viewportAspectRatio)) return;
    if (this.state === "playing") this.pause("viewportChanged");
    this.pending = { ...this.pending, viewportAspectRatio: aspectRatio };
  }
  frame(timestampUs: number, surface: ActiveSurface, render: (frame: LocalRenderFrame) => void,
    releasePointer?: () => void): void {
    if (this.state !== "playing") return;
    if (!this.isActive(surface)) { this.suspend(surface); return; }
    const from = this.currentTick, remainder = BigInt(this.playback.clock.remainder), base = this.lastFrameUs;
    try {
      this.capture.advance(timestampUs, (tick) => {
        const offsetUs = (BigInt(tick - from) * 4_000_000n - remainder + 239n) / 240n;
        const input = this.input.sampleTick(tick, base + Number(offsetUs));
        return { input, sprint: !!input.sprint };
      });
    } catch (error) {
      this.input.setActive(false);
      this.capture.abandon();
      this.actor.send({ type: "FAIL" });
      throw error;
    }
    if (this.playback.clock.status === "performancePaused") {
      this.input.setActive(false);
      if (!this.needsNextTick) {
        this.breaks.push(Object.freeze({ sequence: this.sequence++, afterTick: this.currentTick,
          nextEpoch: ++this.epoch, reason: "performancePause" }));
      }
      this.needsNextTick = true;
      this.actor.send({ type: "FAIL" });
      return;
    }
    this.lastFrameUs = timestampUs;
    if (this.currentTick === this.lastReceiptTick) return;
    try {
      this.capture.submitExact({ workflowState: "playing", documentVisible: true,
        pointerLocked: true, paused: false }, (view) => render(Object.freeze({
        tick: this.currentTick, view, world: this.playback.clock.state,
        refereeMotion: this.currentRefereeMotion,
      })));
    } catch (error) {
      this.input.setActive(false);
      this.capture.abandon();
      this.actor.send({ type: "FAIL" });
      throw error;
    }
    this.lastReceiptTick = this.currentTick;
    this.receipts.push(Object.freeze({ sequence: this.sequence++, tick: this.currentTick,
      epoch: this.epoch, source: "live", workflowState: "playing", documentVisible: true,
      pointerLocked: true, paused: false }));
    if (this.currentTick === 480) {
      this.sealed = freezeTrace(this.capture.decide());
      this.playback.clock.pause();
      this.input.setActive(false);
      this.actor.send({ type: "SEAL" });
      releasePointer?.();
    }
  }
  restart(runId = crypto.randomUUID()): void {
    validateRunId(runId);
    this.actor.send({ type: "RESTART" });
    this.identity = runId; this.revision++;
    this.playback = createPublicPlayback(this.options.source);
    this.refereeLocomotion = createRefereeLocomotion({ tick: 0,
      position: this.options.initialView.refereePosition, lookYaw: this.options.initialView.lookYaw });
    this.input = new IncidentInput();
    this.views = []; this.receipts = []; this.breaks = []; this.pending = {};
    this.epoch = 0; this.sequence = 0; this.lastReceiptTick = -1; this.needsNextTick = false;
    this.sealed = null;
    this.capture = this.makeCapture();
  }
}

export function createLocalIncidentController(options: { source: PublicPlaybackSource; initialView: ViewSample;
  scenarioContentHash: string; runId?: string }): LocalIncidentController {
  return new LocalIncidentController(options);
}
