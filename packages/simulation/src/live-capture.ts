import type { ViewSample } from "./observation-geometry";
import type { ObservationTraceV1 } from "./observation-trace";

export type CaptureClock = {
  readonly tick: number;
  readonly status: "idle" | "running" | "paused" | "performancePaused";
  start(timestampUs: number): unknown;
  advance(timestampUs: number): unknown;
  pause(): void;
  hide(): void;
  losePointerLock(): void;
  resume(timestampUs: number): void;
};
export type CaptureIntegrator<TInput> = (prior: ViewSample, tick: number, input: TInput) => ViewSample;
export type TickInputSource<TInput> = (tick: number, prior: ViewSample) => Readonly<{ input: TInput; sprint: boolean }>;
export type CaptureIdentity = Pick<ObservationTraceV1, "scenarioRef" | "scenarioContentHash" | "attemptId" |
  "runRevision" | "traceVersion" | "visibilityModelVersion" | "cameraRigVersion" |
  "eyeCalibrationVersion" | "observationRubricVersion" | "role">;
type BreakReason = Exclude<ObservationTraceV1["breaks"][number]["reason"], "deciding">;
export type RenderLifecycle = Pick<ObservationTraceV1["renderReceipts"][number],
  "workflowState" | "documentVisible" | "pointerLocked" | "paused">;

function copyView(view: ViewSample): ViewSample {
  return Object.freeze({ ...view, refereePosition: Object.freeze({ ...view.refereePosition }) });
}

export class LiveCapture<TInput> {
  private readonly identity: CaptureIdentity;
  private readonly views: ObservationTraceV1["views"] = [];
  private readonly renderReceipts: ObservationTraceV1["renderReceipts"] = [];
  private readonly breaks: ObservationTraceV1["breaks"] = [];
  private epoch = 0;
  private sequence = 0;
  private lifecycle: "idle" | "active" | "inactive" | "finalized" | "abandoned" = "idle";
  private needsNextTick = false;
  private submittedView: ViewSample;

  constructor(private readonly clock: CaptureClock, identity: CaptureIdentity,
    initial: ViewSample, private readonly integrate: CaptureIntegrator<TInput>) {
    if (clock.tick !== 0 || clock.status !== "idle" || initial.tick !== 0) {
      throw new Error("capture requires a fresh clock and tick-zero view");
    }
    this.identity = Object.freeze({ ...identity, scenarioRef: Object.freeze({ ...identity.scenarioRef }) });
    this.submittedView = copyView(initial);
  }

  get currentView(): ViewSample { return this.submittedView; }

  private assertOpen(): void {
    if (this.lifecycle === "finalized" || this.lifecycle === "abandoned") throw new Error(`capture ${this.lifecycle}`);
  }

  start(timestampUs: number): void {
    this.assertOpen();
    if (this.lifecycle !== "idle") throw new Error("capture already started");
    this.clock.start(timestampUs);
    if (this.clock.status !== "running") throw new Error("clock did not start");
    this.views.push(Object.freeze({ tick: 0, epoch: 0, sprint: false, view: this.submittedView }));
    this.lifecycle = "active";
  }

  advance(timestampUs: number, inputAtTick: TickInputSource<TInput>): void {
    this.assertOpen();
    if (this.lifecycle !== "active") throw new Error("capture is not active");
    const from = this.clock.tick;
    this.clock.advance(timestampUs);
    const to = this.clock.tick;
    if (to < from || to > 480) throw new Error("clock tick is outside the trace bound");
    if (this.clock.status === "performancePaused") {
      if (to !== from) throw new Error("performance pause advanced the clock");
      this.pause("performancePause");
      return;
    }
    if (this.clock.status !== "running") throw new Error("clock stopped without a capture break");
    for (let tick = from + 1; tick <= to; tick++) {
      const { input, sprint } = inputAtTick(tick, this.submittedView);
      const next = this.integrate(this.submittedView, tick, input);
      if (next.tick !== tick) throw new Error("integrator returned the wrong canonical tick");
      this.submittedView = copyView(next);
      this.views.push(Object.freeze({ tick, epoch: this.epoch, sprint, view: this.submittedView }));
      this.needsNextTick = false;
    }
  }

  submitExact(lifecycle: RenderLifecycle, submit: (canonicalView: ViewSample) => void): void {
    this.assertOpen();
    if (this.lifecycle !== "active" || this.needsNextTick || this.clock.status !== "running") {
      throw new Error("no active tick is eligible for a render receipt");
    }
    if (lifecycle.workflowState !== "playing" || lifecycle.documentVisible !== true
      || lifecycle.pointerLocked !== true || lifecycle.paused !== false) {
      const reason: BreakReason = lifecycle.documentVisible !== true ? "hidden"
        : lifecycle.pointerLocked !== true ? "pointerReleased" : "pause";
      this.pause(reason);
      throw new Error("inactive render submission");
    }
    if (typeof submit !== "function") throw new TypeError("render submission callback is required");
    if (this.renderReceipts.length >= 1024) throw new Error("render receipt bound exceeded");
    const view = this.submittedView;
    const sequence = this.sequence;
    submit(view);
    if (this.lifecycle !== "active" || this.clock.status !== "running" || this.needsNextTick
      || this.submittedView !== view || this.sequence !== sequence) {
      throw new Error("render submission crossed a lifecycle boundary");
    }
    this.renderReceipts.push(Object.freeze({ sequence: this.sequence++, tick: view.tick, epoch: this.epoch,
      source: "live", workflowState: "playing", documentVisible: true, pointerLocked: true, paused: false }));
  }

  pause(reason: BreakReason): void {
    this.assertOpen();
    if (this.lifecycle !== "active") return;
    if (!this.needsNextTick && this.breaks.length >= 63) throw new Error("trace break bound exceeded");
    if (reason === "hidden") this.clock.hide();
    else if (reason === "pointerReleased") this.clock.losePointerLock();
    else this.clock.pause();
    if (this.clock.status !== "paused" && this.clock.status !== "performancePaused") {
      throw new Error("clock did not pause");
    }
    if (this.needsNextTick) {
      this.lifecycle = "inactive";
      return;
    }
    this.breaks.push(Object.freeze({ sequence: this.sequence++, afterTick: this.clock.tick,
      nextEpoch: ++this.epoch, reason }));
    this.lifecycle = "inactive";
    this.needsNextTick = true;
  }

  resume(timestampUs: number): void {
    this.assertOpen();
    if (this.lifecycle !== "inactive") throw new Error("capture is not paused");
    this.clock.resume(timestampUs);
    if (this.clock.status !== "running") throw new Error("clock did not resume");
    this.lifecycle = "active";
  }

  decide(): ObservationTraceV1 {
    this.assertOpen();
    if (this.lifecycle !== "active" || this.needsNextTick) throw new Error("cannot finalize an inactive or empty epoch");
    this.breaks.push(Object.freeze({ sequence: this.sequence++, afterTick: this.clock.tick,
      nextEpoch: null, reason: "deciding" }));
    this.lifecycle = "finalized";
    return Object.freeze({ ...this.identity, scenarioRef: Object.freeze({ ...this.identity.scenarioRef }),
      stopTick: this.clock.tick, views: Object.freeze([...this.views]),
      renderReceipts: Object.freeze([...this.renderReceipts]), breaks: Object.freeze([...this.breaks]) }) as ObservationTraceV1;
  }

  abandon(): void {
    this.assertOpen();
    this.lifecycle = "abandoned";
  }
}
