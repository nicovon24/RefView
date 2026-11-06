import { createHash } from "node:crypto";
import { z } from "zod";
import { createTimelineFixture, normalizeCanonicalEventsV2, type TimelineFixtureInput } from "@refview/domain";

const safePositive = z.number().int().refine(Number.isSafeInteger).positive();
const safeTick = z.number().int().refine(Number.isSafeInteger).nonnegative();
const finite = z.number().finite();
const nonempty = z.string().min(1);
const refSchema = z.strictObject({ scenarioId: z.literal("incident-001"), version: safePositive });
const vector = z.strictObject({ x: finite, y: finite, z: finite });
const groundVector = z.strictObject({ x: finite, y: z.literal(0), z: finite });
const actor = z.strictObject({ actorId: nonempty, position: vector, yawRad: finite,
  clipId: nonempty, phaseQ: safeTick.max(999_999) });
const sample = z.strictObject({ tick: safeTick.max(480), actors: z.array(actor), ball: z.strictObject({
  position: vector, orientation: z.strictObject({ qx: finite, qy: finite, qz: finite, qw: finite }),
}) });
const event = z.strictObject({ eventId: nonempty, tick: safeTick.max(480), ordinal: safeTick,
  kind: z.enum(["ballTouch", "contact", "offence", "whistleWindow", "phaseMarker"]),
  actorIds: z.array(nonempty), payload: z.strictObject({}),
});
const coreSchema = z.strictObject({
  schemaVersion: z.literal(2), purpose: z.literal("authoredTraining"), ref: refSchema,
  classification: z.literal("clear"), supportedRoles: z.tuple([z.literal("mainReferee")]),
  lawsEdition: z.literal("IFAB-2026-27"),
  competitionProfile: z.strictObject({ profileId: nonempty, version: safePositive,
    settings: z.strictObject({ matchKind: z.literal("fictionalTraining"), format: z.literal("senior11v11"),
      durationMinutes: z.literal(90), fieldLengthM: z.literal(105), fieldWidthM: z.literal(68),
      goalWidthM: z.literal(7.32), goalHeightM: z.literal(2.44), modifications: z.tuple([]),
      varEnabled: z.literal(true),
    }),
  }),
  field: z.strictObject({ lengthM: z.literal(105), widthM: z.literal(68), goalWidthM: z.literal(7.32),
    penaltyAreaDepthM: z.literal(16.5), penaltyAreaExtraWidthEachSideM: z.literal(16.5),
    lineWidthM: z.literal(0.12), attackDirection: z.literal("positiveZ"),
  }),
  timeline: z.strictObject({ ref: refSchema, durationTicks: z.literal(480),
    samples: z.array(sample).length(481), events: z.array(event).min(4),
  }),
  decisionGate: z.strictObject({ opensAtTick: z.literal(360), closesAtTick: z.literal(480),
    forcePauseAtTick: z.literal(480) }),
  initialRefereePose: z.strictObject({ position: groundVector, lookYaw: finite,
    lookPitch: finite.min(-1.2).max(1.2) }),
  facts: z.strictObject({ passTick: z.literal(120), passerActorId: z.literal("attack-08"),
    receiverActorId: z.literal("attack-09"), onsideMarginM: finite.min(1.5),
    contactTick: z.literal(366), offenderActorId: z.literal("defence-04"),
    contactGround: z.strictObject({ x: z.literal(13.8), y: z.literal(0), z: z.literal(36.8) }),
    ballInPlay: z.literal(true), defenderPlayedBall: z.literal(false), contactIntensity: z.literal("careless"),
    coveringDefenderActorId: z.literal("defence-05"), obviousGoalOpportunity: z.literal(false),
    separateMisconduct: z.literal(false), expectedRestart: z.literal("penaltyKick"),
    expectedDiscipline: z.literal("none"),
  }),
});

export type NormalizedCoreSourceV2 = Readonly<z.infer<typeof coreSchema> & { competitionProfileHash: `sha256:${string}` }>;

// Inspect descriptors before reading any author-controlled property, including nested array elements.
function detachedJson(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("nonfinite JSON number");
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== "object") throw new TypeError("non-JSON value");
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError("invalid array prototype");
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(value);
    const length = Object.getOwnPropertyDescriptor(value, "length")?.value;
    if (!Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1) {
      throw new TypeError("sparse or decorated array");
    }
    return Array.from({ length }, (_, index) => {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
        throw new TypeError("invalid array element");
      }
      return detachedJson(descriptor.value);
    });
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError("non-plain JSON object");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) throw new TypeError("symbol JSON key");
  const copy: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of (keys as string[]).sort()) {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      throw new TypeError("hidden or accessor JSON property");
    }
    copy[key] = detachedJson(descriptor.value);
  }
  return copy;
}

function canonicalObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalObject);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) =>
      [key, canonicalObject((value as Record<string, unknown>)[key])]));
  }
  return value;
}

export function canonicalJsonV2(value: unknown): string {
  return JSON.stringify(canonicalObject(detachedJson(value)));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

const roster = ["attack-08", "attack-09", "attack-10", "defence-01", "defence-02", "defence-04", "defence-05"];
const compareId = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;

export function normalizeCoreSourceV2(input: unknown): NormalizedCoreSourceV2 {
  const data = coreSchema.parse(detachedJson(input));
  if (data.timeline.ref.scenarioId !== data.ref.scenarioId || data.timeline.ref.version !== data.ref.version) {
    throw new Error("timeline ref mismatch");
  }
  const samples = [...data.timeline.samples].sort((a, b) => a.tick - b.tick);
  for (let tick = 0; tick <= 480; tick++) {
    const sample = samples[tick];
    if (!sample || sample.tick !== tick) throw new Error("incomplete or duplicate timeline tick");
    sample.actors.sort((a, b) => compareId(a.actorId, b.actorId));
    if (sample.actors.length !== roster.length || sample.actors.some((actor, index) => actor.actorId !== roster[index])) {
      throw new Error("invalid seven-player roster");
    }
  }
  const events = normalizeCanonicalEventsV2(data.timeline.events, { durationTicks: 480, canonicalActorIds: roster });
  const marker = (kind: string, tick: number, actors: readonly string[]) => events.filter((event) =>
    event.kind === kind && event.tick === tick && event.actorIds.join("|") === actors.join("|"));
  if (marker("ballTouch", 120, ["attack-08"]).length !== 1
    || marker("contact", 366, ["attack-09", "defence-04"]).length !== 1
    || marker("offence", 366, ["attack-09", "defence-04"]).length !== 1
    || marker("whistleWindow", 372, []).length !== 1
    || events.some((event) => (event.kind === "contact" || event.kind === "offence")
      && (event.tick !== 366 || event.actorIds.join("|") !== "attack-09|defence-04"))
    || events.some((event) => event.kind === "whistleWindow" && event.tick !== 372)
    || events.some((event) => event.kind === "ballTouch" && event.tick === 120
      && event.actorIds[0] !== "attack-08")
    || events.some((event) => event.kind === "ballTouch" && event.tick >= 356 && event.tick <= 371
      && event.actorIds.includes("defence-04"))) {
    throw new Error("event/fact mismatch");
  }
  const timelineInput: TimelineFixtureInput = { ref: { ...data.timeline.ref }, durationTicks: 480,
    samples: samples.map((sample) => ({ tick: sample.tick, actors: sample.actors.map((actor) => ({
      actorId: actor.actorId, position: { ...actor.position }, yawRad: actor.yawRad,
      clipId: actor.clipId, phaseQ: actor.phaseQ,
    })), ball: { position: { ...sample.ball.position }, orientation: { ...sample.ball.orientation } } })),
    events: events.map((event) => ({ ...event, actorIds: [...event.actorIds], payload: {} })),
  };
  createTimelineFixture(timelineInput);
  if (Math.abs(data.initialRefereePose.position.x) > 34 || Math.abs(data.initialRefereePose.position.z) > 52.5) {
    throw new Error("initial referee pose outside field");
  }
  const competitionProfileHash = `sha256:${createHash("sha256")
    .update(canonicalJsonV2(["refview-competition-profile-v1", data.competitionProfile]), "utf8")
    .digest("hex")}` as const;
  return deepFreeze({ ...data, timeline: { ...data.timeline, samples, events: events.map((event) => ({
    ...event, actorIds: [...event.actorIds], payload: {},
  })) }, competitionProfileHash });
}
