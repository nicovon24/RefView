import type { CanonicalEvent } from "./timeline";

export type CanonicalEventV2 = Readonly<Omit<CanonicalEvent, "actorIds" | "payload"> & {
  actorIds: readonly string[];
  payload: Readonly<Record<string, never>>;
}>;

export type CanonicalEventsV2Context = Readonly<{
  durationTicks: number;
  canonicalActorIds: readonly string[];
}>;

const eventFields = ["eventId", "tick", "ordinal", "kind", "actorIds", "payload"] as const;
const participantCounts = {
  ballTouch: 1,
  contact: 2,
  offence: 2,
  whistleWindow: 0,
  phaseMarker: 0,
} as const;

function plainObject(value: unknown, name: string): object {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${name} must be a plain object`);
  }
  return value;
}

function exactDataFields(value: unknown, fields: readonly string[], name: string): Record<string, unknown> {
  const object = plainObject(value, name);
  const keys = Reflect.ownKeys(object);
  if (keys.length !== fields.length || keys.some((key) => typeof key !== "string" || !fields.includes(key))) {
    throw new TypeError(`${name} has invalid fields`);
  }
  const descriptors = Object.getOwnPropertyDescriptors(object);
  for (const key of fields) {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      throw new TypeError(`${name}.${key} must be an enumerable data field`);
    }
  }
  const copy: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of fields) {
    copy[key] = descriptors[key]!.value;
  }
  return copy;
}

function exactArray(value: unknown, name: string): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${name} must be an array`);
  }
  const length = value.length;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== length + 1) throw new TypeError(`${name} must be dense and undecorated`);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (let index = 0; index < length; index++) {
    const key = String(index);
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      throw new TypeError(`${name} must be dense data fields`);
    }
  }
  if (keys.some((key) => key !== "length" && (typeof key !== "string" || !/^(0|[1-9]\d*)$/.test(key)
    || Number(key) >= length))) {
    throw new TypeError(`${name} must be undecorated`);
  }
  return Array.from({ length }, (_, index) => descriptors[String(index)]!.value);
}

function compareId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function normalizeCanonicalEventsV2(
  value: unknown,
  context: CanonicalEventsV2Context,
): readonly CanonicalEventV2[] {
  if (!Number.isSafeInteger(context.durationTicks) || context.durationTicks < 0) {
    throw new RangeError("durationTicks must be a nonnegative safe integer");
  }
  const roster = new Set<string>();
  for (const actorId of exactArray(context.canonicalActorIds, "canonicalActorIds")) {
    if (typeof actorId !== "string" || actorId.length === 0 || roster.has(actorId)) {
      throw new TypeError("canonicalActorIds must contain unique nonempty IDs");
    }
    roster.add(actorId);
  }
  const eventIds = new Set<string>();
  const tickOrdinals = new Set<string>();
  const normalized: CanonicalEventV2[] = [];
  for (const item of exactArray(value, "events")) {
    const fields = exactDataFields(item, eventFields, "event");
    const { eventId, tick, ordinal, kind, actorIds, payload } = fields;
    if (typeof eventId !== "string" || eventId.length === 0) {
      throw new TypeError("eventId must be nonempty");
    }
    if (typeof tick !== "number" || !Number.isSafeInteger(tick) || tick < 0 || tick > context.durationTicks) {
      throw new RangeError("event tick is outside the timeline");
    }
    if (typeof ordinal !== "number" || !Number.isSafeInteger(ordinal) || ordinal < 0) {
      throw new RangeError("event ordinal must be a nonnegative safe integer");
    }
    if (typeof kind !== "string" || !Object.hasOwn(participantCounts, kind)) {
      throw new TypeError("invalid event kind");
    }
    const participants = exactArray(actorIds, "event actorIds");
    if (participants.length !== participantCounts[kind as keyof typeof participantCounts]) {
      throw new TypeError("invalid event participant count");
    }
    const seen = new Set<string>();
    for (const actorId of participants) {
      if (typeof actorId !== "string" || actorId.length === 0 || !roster.has(actorId)) {
        throw new TypeError("unknown event actor ID");
      }
      if (seen.has(actorId)) throw new TypeError("duplicate event actor ID");
      seen.add(actorId);
    }
    exactDataFields(payload, [], "event payload");
    if (eventIds.has(eventId)) throw new TypeError("duplicate event ID");
    const tickOrdinal = `${tick}:${ordinal}`;
    if (tickOrdinals.has(tickOrdinal)) throw new TypeError("duplicate event ordinal at tick");
    eventIds.add(eventId);
    tickOrdinals.add(tickOrdinal);
    normalized.push(Object.freeze({
      eventId,
      tick,
      ordinal,
      kind: kind as CanonicalEventV2["kind"],
      actorIds: Object.freeze((participants as string[]).sort(compareId)),
      payload: Object.freeze({}),
    }));
  }
  normalized.sort((a, b) => a.tick - b.tick || a.ordinal - b.ordinal || compareId(a.eventId, b.eventId));
  return Object.freeze(normalized);
}
