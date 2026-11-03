import { worldStateChecksum, type ImmutableCanonicalEvent, type TimelineFixture } from "@refview/domain";

export type PlaybackStatus = "idle" | "running" | "paused" | "performancePaused";
export type ReplaySpeed = 0.25 | 0.5 | 1 | 2;
export type PlaybackOptions = Readonly<{ maxCatchUpTicks: number }>;
export type LivePlaybackOptions = PlaybackOptions;

const TICK_UNITS = 4_000_000n;
const NO_EVENTS: readonly ImmutableCanonicalEvent[] = Object.freeze([]);

function validInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a nonnegative safe integer`);
}

function quarters(speed: ReplaySpeed): bigint {
  switch (speed) {
    case 0.25: return 1n;
    case 0.5: return 2n;
    case 1: return 4n;
    case 2: return 8n;
    default: throw new RangeError("unsupported replay speed");
  }
}

abstract class PlaybackClock {
  protected currentTick = 0;
  protected remainderUnits = 0n;
  protected lastTimestampUs: number | undefined;
  protected currentStatus: PlaybackStatus = "idle";
  protected speedQuarters = 4n;

  constructor(protected readonly fixture: TimelineFixture, readonly maxCatchUpTicks: number) {
    validInteger(maxCatchUpTicks, "maxCatchUpTicks");
    if (maxCatchUpTicks === 0) throw new RangeError("maxCatchUpTicks must be positive");
  }

  get tick(): number { return this.currentTick; }
  get remainder(): number { return Number(this.remainderUnits); }
  get status(): PlaybackStatus { return this.currentStatus; }
  get isInputActive(): boolean { return this.currentStatus === "running"; }
  get state() { return this.fixture.snapshot(this.currentTick); }
  get checksum(): string { return worldStateChecksum(this.state); }

  protected begin(timestampUs: number): void {
    validInteger(timestampUs, "timestampUs");
    if (this.currentStatus !== "idle") return;
    this.lastTimestampUs = timestampUs;
    this.currentStatus = "running";
  }

  pause(): void { this.suspend("paused"); }
  losePointerLock(): void { this.suspend("paused"); }
  hide(): void { this.suspend("paused"); }

  private suspend(status: "paused" | "performancePaused"): void {
    if (this.currentStatus === "running") {
      this.currentStatus = status;
      this.lastTimestampUs = undefined;
    }
  }

  resume(timestampUs: number): void {
    validInteger(timestampUs, "timestampUs");
    if (this.currentStatus !== "paused" && this.currentStatus !== "performancePaused") {
      throw new Error("playback must be paused before resume");
    }
    this.lastTimestampUs = timestampUs;
    this.currentStatus = "running";
  }

  advance(timestampUs: number): readonly ImmutableCanonicalEvent[] {
    validInteger(timestampUs, "timestampUs");
    if (this.currentStatus !== "running") return NO_EVENTS;
    const previous = this.lastTimestampUs!;
    if (timestampUs < previous) throw new RangeError("timestampUs must be monotonic");
    if (this.currentTick === this.fixture.durationTicks) {
      this.lastTimestampUs = timestampUs;
      return NO_EVENTS;
    }
    const deltaUs = timestampUs - previous;
    const accumulated = this.remainderUnits + BigInt(deltaUs) * 60n * this.speedQuarters;
    const requestedTicks = accumulated / TICK_UNITS;
    if (requestedTicks > BigInt(this.maxCatchUpTicks)) {
      this.suspend("performancePaused");
      return NO_EVENTS;
    }
    this.lastTimestampUs = timestampUs;
    this.remainderUnits = accumulated % TICK_UNITS;
    const from = this.currentTick;
    this.currentTick = Math.min(this.fixture.durationTicks, from + Number(requestedTicks));
    return this.deliver(from, this.currentTick);
  }

  protected eventsBetween(from: number, to: number): readonly ImmutableCanonicalEvent[] {
    if (to <= from) return NO_EVENTS;
    return Object.freeze(this.fixture.events.filter((event) => event.tick > from && event.tick <= to));
  }

  protected abstract deliver(from: number, to: number): readonly ImmutableCanonicalEvent[];
}

export class LivePlayback extends PlaybackClock {
  constructor(fixture: TimelineFixture, options: LivePlaybackOptions) {
    super(fixture, options.maxCatchUpTicks);
  }

  start(timestampUs: number): readonly ImmutableCanonicalEvent[] {
    if (this.currentStatus !== "idle") return NO_EVENTS;
    this.begin(timestampUs);
    return Object.freeze(this.fixture.events.filter((event) => event.tick === 0));
  }

  protected deliver(from: number, to: number): readonly ImmutableCanonicalEvent[] {
    return this.eventsBetween(from, to);
  }
}

export class ReplayPlayback extends PlaybackClock {
  start(timestampUs: number): readonly ImmutableCanonicalEvent[] {
    this.begin(timestampUs);
    return NO_EVENTS;
  }

  setSpeed(speed: ReplaySpeed): void { this.speedQuarters = quarters(speed); }

  seek(tick: number): void {
    validInteger(tick, "tick");
    if (tick > this.fixture.durationTicks) throw new RangeError("tick exceeds durationTicks");
    this.currentTick = tick;
    this.remainderUnits = 0n;
    this.lastTimestampUs = undefined;
    if (this.currentStatus === "running") this.currentStatus = "paused";
  }

  step(direction: -1 | 1): readonly ImmutableCanonicalEvent[] {
    if (direction !== -1 && direction !== 1) throw new RangeError("step direction must be -1 or 1");
    const from = this.currentTick;
    this.currentTick = Math.max(0, Math.min(this.fixture.durationTicks, from + direction));
    this.remainderUnits = 0n;
    this.lastTimestampUs = undefined;
    if (this.currentStatus === "running") this.currentStatus = "paused";
    return this.deliver(from, this.currentTick);
  }

  protected deliver(from: number, to: number): readonly ImmutableCanonicalEvent[] {
    return this.eventsBetween(from, to);
  }
}

export function createLivePlayback(fixture: TimelineFixture, options: LivePlaybackOptions): LivePlayback {
  return new LivePlayback(fixture, options);
}

export function createReplayPlayback(fixture: TimelineFixture, options: PlaybackOptions): ReplayPlayback {
  return new ReplayPlayback(fixture, options.maxCatchUpTicks);
}
