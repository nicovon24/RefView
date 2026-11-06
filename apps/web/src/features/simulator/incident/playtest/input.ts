import type { ViewSample } from "@refview/simulation";

export type IncidentTickInput = Readonly<{ tick: number; forward?: boolean; backward?: boolean;
  left?: boolean; right?: boolean; sprint?: boolean; mouseDx: number; mouseDy: number }>;

type InputEvent = Readonly<
  | { kind: "key"; timestampUs: number; code: string; pressed: boolean }
  | { kind: "mouse"; timestampUs: number; dx: number; dy: number }
>;

export class IncidentInput {
  private active = false;
  private held = new Set<string>();
  private events: InputEvent[] = [];
  private lastTick = 0;
  private lastBoundaryUs = -1;
  private lastEventUs = -1;

  /** Activation time is the first unsampled boundary, including after a pause. */
  setActive(active: boolean, boundaryUs?: number): void {
    if (!active) {
      this.held.clear(); this.events = []; this.active = false;
      return;
    }
    if (!Number.isSafeInteger(boundaryUs) || boundaryUs! < 0 || boundaryUs! < this.lastBoundaryUs
      || boundaryUs! < this.lastEventUs) throw new RangeError("stale activation timestamp");
    if (this.active) throw new Error("input already active");
    this.held.clear(); this.events = [];
    this.lastBoundaryUs = boundaryUs!;
    this.lastEventUs = boundaryUs!;
    this.active = true;
  }
  private assertEventTime(timestampUs: number): void {
    if (!Number.isSafeInteger(timestampUs) || timestampUs <= this.lastBoundaryUs
      || timestampUs < this.lastEventUs) throw new RangeError("stale input timestamp");
    this.lastEventUs = timestampUs;
  }
  key(code: string, pressed: boolean, timestampUs: number): void {
    if (!this.active) return;
    this.assertEventTime(timestampUs);
    this.events.push({ kind: "key", timestampUs, code, pressed });
  }
  mouse(dx: number, dy: number, timestampUs: number): void {
    if (!this.active) return;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new RangeError("mouse delta must be finite");
    this.assertEventTime(timestampUs);
    this.events.push({ kind: "mouse", timestampUs, dx, dy });
  }
  sampleTick(tick: number, boundaryUs: number): IncidentTickInput {
    if (!this.active) throw new Error("input is inactive");
    if (!Number.isSafeInteger(tick) || tick !== this.lastTick + 1) throw new RangeError("input ticks must be consecutive");
    if (!Number.isSafeInteger(boundaryUs) || boundaryUs <= this.lastBoundaryUs)
      throw new RangeError("tick boundary must advance");
    let dx = 0, dy = 0, consumed = 0;
    for (const event of this.events) {
      if (event.timestampUs > boundaryUs) break;
      consumed++;
      if (event.kind === "key") {
        if (event.pressed) this.held.add(event.code); else this.held.delete(event.code);
      } else { dx += event.dx; dy += event.dy; }
    }
    this.events.splice(0, consumed);
    this.lastTick = tick;
    this.lastBoundaryUs = boundaryUs;
    const sample = Object.freeze({ tick, forward: this.held.has("KeyW") || this.held.has("ArrowUp"),
      backward: this.held.has("KeyS") || this.held.has("ArrowDown"),
      left: this.held.has("KeyA") || this.held.has("ArrowLeft"),
      right: this.held.has("KeyD") || this.held.has("ArrowRight"),
      sprint: this.held.has("ShiftLeft") || this.held.has("ShiftRight"), mouseDx: dx, mouseDy: dy });
    return sample;
  }
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/** Three's +z view makes screen-right field -x; C1 positive yaw points toward +x. */
export function integrateIncidentView(prior: ViewSample, tick: number, input: IncidentTickInput): ViewSample {
  if (tick !== prior.tick + 1 || input.tick !== tick) throw new RangeError("input/view tick mismatch");
  if (!Number.isFinite(input.mouseDx) || !Number.isFinite(input.mouseDy)) throw new RangeError("nonfinite look input");
  const yaw = prior.lookYaw - clamp(input.mouseDx * 0.002, -12 / 60, 12 / 60);
  const pitch = clamp(prior.lookPitch - clamp(input.mouseDy * 0.002, -6 / 60, 6 / 60), -1.2, 1.2);
  const forward = Number(!!input.forward) - Number(!!input.backward);
  const right = Number(!!input.right) - Number(!!input.left);
  const magnitude = Math.hypot(forward, right);
  const step = magnitude ? (input.sprint ? 7 : 4.2) / 60 / magnitude : 0;
  return { ...prior, tick, lookYaw: yaw, lookPitch: pitch,
    refereePosition: { x: clamp(prior.refereePosition.x + (Math.sin(yaw) * forward - Math.cos(yaw) * right) * step, -34, 34),
      y: 0, z: clamp(prior.refereePosition.z + (Math.cos(yaw) * forward + Math.sin(yaw) * right) * step, -52.5, 52.5) } };
}
