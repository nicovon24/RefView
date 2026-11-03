export type Vec3m = { x: number; y: number; z: number };
export type Quaternion = { qx: number; qy: number; qz: number; qw: number };
export type ActorSample = {
  actorId: string;
  position: Vec3m;
  yawRad: number;
  clipId: string;
  phaseQ: number;
};
export type BallSample = { position: Vec3m; orientation: Quaternion };
export type CanonicalEvent = {
  eventId: string;
  tick: number;
  ordinal: number;
  kind: "ballTouch" | "contact" | "offence" | "whistleWindow" | "phaseMarker";
  actorIds: string[];
  payload: Record<string, unknown>;
};
export type TimelineFixtureInput = {
  ref: { scenarioId: string; version: number };
  durationTicks: number;
  samples: Array<{ tick: number; actors: ActorSample[]; ball: BallSample }>;
  events: CanonicalEvent[];
};
export type WorldState = Readonly<{
  ref: Readonly<{ scenarioId: string; version: number }>;
  tick: number;
  actors: readonly Readonly<ActorSample>[];
  ball: Readonly<BallSample>;
}>;
export type ImmutableCanonicalEvent = Readonly<Omit<CanonicalEvent, "actorIds" | "payload"> & {
  actorIds: readonly string[];
  payload: Readonly<Record<string, unknown>>;
}>;
export type TimelineFixture = Readonly<{
  ref: WorldState["ref"];
  durationTicks: number;
  events: readonly ImmutableCanonicalEvent[];
  snapshot(tick: number): WorldState;
}>;

function integer(value: number, minimum: number, maximum: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be an integer in ${minimum}..${maximum}`);
  }
}

function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  return Object.is(value, -0) ? 0 : value;
}

function id(value: string, name: string): void {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${name} must be nonempty`);
}

function vector(value: Vec3m): Readonly<Vec3m> {
  return Object.freeze({
    x: finite(value.x, "x"),
    y: finite(value.y, "y"),
    z: finite(value.z, "z"),
  });
}

function compareId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function freezePayload(value: unknown): unknown {
  if (Array.isArray(value)) return Object.freeze(value.map(freezePayload));
  if (value !== null && typeof value === "object") {
    const copied: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const [key, child] of Object.entries(value)) copied[key] = freezePayload(child);
    return Object.freeze(copied);
  }
  return value;
}

export function createTimelineFixture(input: TimelineFixtureInput): TimelineFixture {
  id(input.ref.scenarioId, "scenarioId");
  integer(input.ref.version, 1, Number.MAX_SAFE_INTEGER, "version");
  integer(input.durationTicks, 0, Number.MAX_SAFE_INTEGER, "durationTicks");
  const durationTicks = input.durationTicks;
  const ref = Object.freeze({ scenarioId: input.ref.scenarioId, version: input.ref.version });
  if (input.samples.length !== durationTicks + 1) throw new RangeError("all ticks require a sample");
  const samples: WorldState[] = new Array(input.samples.length);
  const actorIds = new Set<string>();
  for (const sample of [...input.samples].sort((a, b) => a.tick - b.tick)) {
    integer(sample.tick, 0, durationTicks, "sample tick");
    if (samples[sample.tick]) throw new Error(`duplicate sample tick ${sample.tick}`);
    const seen = new Set<string>();
    const actors = sample.actors.map((actor) => {
      id(actor.actorId, "actorId");
      id(actor.clipId, "clipId");
      if (seen.has(actor.actorId)) throw new Error(`duplicate actor ID ${actor.actorId}`);
      seen.add(actor.actorId);
      integer(actor.phaseQ, 0, 999_999, "phaseQ");
      return Object.freeze({
        actorId: actor.actorId,
        position: vector(actor.position),
        yawRad: finite(actor.yawRad, "yawRad"),
        clipId: actor.clipId,
        phaseQ: actor.phaseQ,
      });
    }).sort((a, b) => compareId(a.actorId, b.actorId));
    if (sample.tick === 0) for (const actor of actors) actorIds.add(actor.actorId);
    else if (seen.size !== actorIds.size || [...seen].some((actorId) => !actorIds.has(actorId))) {
      throw new Error("actor IDs must be stable at every tick");
    }
    const orientation = Object.freeze({
      qx: finite(sample.ball.orientation.qx, "qx"),
      qy: finite(sample.ball.orientation.qy, "qy"),
      qz: finite(sample.ball.orientation.qz, "qz"),
      qw: finite(sample.ball.orientation.qw, "qw"),
    });
    samples[sample.tick] = Object.freeze({
      ref,
      tick: sample.tick,
      actors: Object.freeze(actors),
      ball: Object.freeze({ position: vector(sample.ball.position), orientation }),
    });
  }
  if (samples.some((sample) => !sample)) throw new Error("all ticks require a sample");
  const eventIds = new Set<string>();
  const tickOrdinals = new Set<string>();
  const eventKinds = new Set<string>(["ballTouch", "contact", "offence", "whistleWindow", "phaseMarker"]);
  const events = input.events.map((event) => {
    id(event.eventId, "eventId");
    integer(event.tick, 0, durationTicks, "event tick");
    integer(event.ordinal, 0, Number.MAX_SAFE_INTEGER, "event ordinal");
    if (!eventKinds.has(event.kind)) throw new TypeError(`invalid event kind ${event.kind}`);
    if (!Array.isArray(event.actorIds)) throw new TypeError("event actorIds must be an array");
    if (event.payload === null || typeof event.payload !== "object" || Array.isArray(event.payload)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(event.payload) as object | null)) {
      throw new TypeError("event payload must be a plain object");
    }
    const eventActorIds = new Set<string>();
    for (const actorId of event.actorIds) {
      id(actorId, "event actorId");
      if (!actorIds.has(actorId)) throw new Error(`unknown event actor ID ${actorId}`);
      if (eventActorIds.has(actorId)) throw new Error(`duplicate event actor ID ${actorId}`);
      eventActorIds.add(actorId);
    }
    if (eventIds.has(event.eventId)) throw new Error(`duplicate event ID ${event.eventId}`);
    eventIds.add(event.eventId);
    const ordinalKey = `${event.tick}:${event.ordinal}`;
    if (tickOrdinals.has(ordinalKey)) throw new Error(`duplicate ordinal at tick ${event.tick}`);
    tickOrdinals.add(ordinalKey);
    return Object.freeze({
      eventId: event.eventId,
      tick: event.tick,
      ordinal: event.ordinal,
      kind: event.kind,
      actorIds: Object.freeze([...event.actorIds]),
      payload: freezePayload(event.payload) as Readonly<Record<string, unknown>>,
    });
  }).sort((a, b) => a.tick - b.tick || a.ordinal - b.ordinal || compareId(a.eventId, b.eventId));
  return Object.freeze({
    ref,
    durationTicks,
    events: Object.freeze(events),
    snapshot(tick: number): WorldState {
      integer(tick, 0, durationTicks, "requested tick");
      return samples[tick]!;
    },
  });
}

export function serializeWorldState(state: WorldState): string {
  const actors = [...state.actors]
    .sort((a, b) => compareId(a.actorId, b.actorId))
    .map((actor) => [
      actor.actorId,
      finite(actor.position.x, "x"), finite(actor.position.y, "y"), finite(actor.position.z, "z"),
      finite(actor.yawRad, "yawRad"), actor.clipId, actor.phaseQ,
    ]);
  const ball = state.ball;
  return JSON.stringify([
    "refview-world-v1", state.ref.scenarioId, state.ref.version, state.tick, actors,
    [finite(ball.position.x, "x"), finite(ball.position.y, "y"), finite(ball.position.z, "z"),
      finite(ball.orientation.qx, "qx"), finite(ball.orientation.qy, "qy"),
      finite(ball.orientation.qz, "qz"), finite(ball.orientation.qw, "qw")],
  ]);
}

export function worldStateChecksum(state: WorldState): string {
  let hash = 14695981039346656037n;
  for (const byte of new TextEncoder().encode(serializeWorldState(state))) {
    hash = ((hash ^ BigInt(byte)) * 1099511628211n) & 0xffffffffffffffffn;
  }
  return `fnv64:${hash.toString(16).padStart(16, "0")}`;
}
