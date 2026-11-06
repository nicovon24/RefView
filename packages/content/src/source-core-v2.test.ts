import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalJsonV2, normalizeCoreSourceV2 } from "./source-core-v2";

const roster = ["attack-08", "attack-09", "attack-10", "defence-01", "defence-02", "defence-04", "defence-05"];

function source() {
  return {
    schemaVersion: 2, purpose: "authoredTraining", ref: { scenarioId: "incident-001", version: 1 },
    classification: "clear", supportedRoles: ["mainReferee"], lawsEdition: "IFAB-2026-27",
    competitionProfile: { profileId: "senior-standard", version: 1, settings: {
      matchKind: "fictionalTraining", format: "senior11v11", durationMinutes: 90,
      fieldLengthM: 105, fieldWidthM: 68, goalWidthM: 7.32, goalHeightM: 2.44,
      modifications: [], varEnabled: true,
    } },
    field: { lengthM: 105, widthM: 68, goalWidthM: 7.32, penaltyAreaDepthM: 16.5,
      penaltyAreaExtraWidthEachSideM: 16.5, lineWidthM: 0.12, attackDirection: "positiveZ" },
    timeline: { ref: { scenarioId: "incident-001", version: 1 }, durationTicks: 480,
      samples: Array.from({ length: 481 }, (_, tick) => ({ tick,
        actors: roster.map((actorId) => ({ actorId, position: { x: 0, y: 0, z: tick / 100 },
          yawRad: 0, clipId: "run", phaseQ: tick })),
        ball: { position: { x: 8, y: 0.11, z: 29 }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } },
      })),
      events: [
        { eventId: "pass", tick: 120, ordinal: 0, kind: "ballTouch", actorIds: ["attack-08"], payload: {} },
        { eventId: "contact", tick: 366, ordinal: 0, kind: "contact", actorIds: ["defence-04", "attack-09"], payload: {} },
        { eventId: "offence", tick: 366, ordinal: 1, kind: "offence", actorIds: ["attack-09", "defence-04"], payload: {} },
        { eventId: "whistle", tick: 372, ordinal: 0, kind: "whistleWindow", actorIds: [], payload: {} },
      ] },
    decisionGate: { opensAtTick: 360, closesAtTick: 480, forcePauseAtTick: 480 },
    initialRefereePose: { position: { x: 3, y: 0, z: 29 }, lookYaw: 0, lookPitch: 0 },
    facts: { passTick: 120, passerActorId: "attack-08", receiverActorId: "attack-09", onsideMarginM: 1.5,
      contactTick: 366, offenderActorId: "defence-04", contactGround: { x: 13.8, y: 0, z: 36.8 },
      ballInPlay: true, defenderPlayedBall: false, contactIntensity: "careless",
      coveringDefenderActorId: "defence-05", obviousGoalOpportunity: false,
      separateMisconduct: false, expectedRestart: "penaltyKick", expectedDiscipline: "none" },
  };
}

describe("normalizeCoreSourceV2", () => {
  it("derives the profile digest from normalized identity/settings and freezes detached data", () => {
    const input = source();
    const normalized = normalizeCoreSourceV2(input);
    const payload = ["refview-competition-profile-v1", normalized.competitionProfile];
    expect(normalized.competitionProfileHash).toBe(`sha256:${createHash("sha256").update(canonicalJsonV2(payload)).digest("hex")}`);
    input.timeline.samples[0]!.actors[0]!.position.x = 12;
    expect(normalized.timeline.samples[0]!.actors[0]!.position.x).toBe(0);
    expect(Object.isFrozen(normalized.timeline.samples[0]!.actors[0]!.position)).toBe(true);
    expect(Object.isFrozen(normalized)).toBe(true);
  });

  it("normalizes declared set order, negative zero, and profile version", () => {
    const a = source();
    const b = source();
    b.timeline.samples.reverse();
    b.timeline.samples.forEach((sample) => sample.actors.reverse());
    b.timeline.events.reverse();
    b.timeline.events[1]!.actorIds.reverse();
    b.initialRefereePose.lookYaw = -0;
    expect(normalizeCoreSourceV2(b)).toEqual(normalizeCoreSourceV2(a));
    b.competitionProfile.version = 2;
    expect(normalizeCoreSourceV2(b).competitionProfileHash).not.toBe(normalizeCoreSourceV2(a).competitionProfileHash);
  });

  it("rejects contradictory facts, missing markers, and defender touch in challenge interval", () => {
    const a = source(); a.facts.onsideMarginM = 1.49;
    expect(() => normalizeCoreSourceV2(a)).toThrow();
    const b = source(); b.timeline.events.splice(2, 1);
    expect(() => normalizeCoreSourceV2(b)).toThrow();
    const c = source(); c.timeline.events.push({ eventId: "defender-touch", tick: 356, ordinal: 0,
      kind: "ballTouch", actorIds: ["defence-04"], payload: {} });
    expect(() => normalizeCoreSourceV2(c)).toThrow();
    const d = source(); d.timeline.events[1]!.actorIds = ["attack-08", "defence-04"];
    expect(() => normalizeCoreSourceV2(d)).toThrow();
    const e = source(); e.timeline.samples[20]!.tick = 19;
    expect(() => normalizeCoreSourceV2(e)).toThrow();
    const f = source(); f.competitionProfile.settings.fieldWidthM = 70;
    expect(() => normalizeCoreSourceV2(f)).toThrow();
  });

  it("accepts inclusive C1 pitch limits and rejects values just beyond either limit", () => {
    for (const pitch of [-1.2, 1.2]) {
      const input = source(); input.initialRefereePose.lookPitch = pitch;
      expect(normalizeCoreSourceV2(input).initialRefereePose.lookPitch).toBe(pitch);
    }
    for (const pitch of [-1.200001, 1.200001]) {
      const input = source(); input.initialRefereePose.lookPitch = pitch;
      expect(() => normalizeCoreSourceV2(input)).toThrow();
    }
  });

  it("rejects an absent roster actor or an absent timeline tick", () => {
    const missingActor = source(); missingActor.timeline.samples[366]!.actors.splice(0, 1);
    expect(() => normalizeCoreSourceV2(missingActor)).toThrow();
    const missingTick = source(); missingTick.timeline.samples.splice(366, 1);
    expect(() => normalizeCoreSourceV2(missingTick)).toThrow();
  });

  it("rejects unknown, hidden, accessor, symbol, and sparse input without reading getters", () => {
    const a = source() as Record<string | symbol, unknown>; a.contentHash = "forged";
    expect(() => normalizeCoreSourceV2(a)).toThrow();
    const b = source(); Object.defineProperty(b.facts, "hidden", { value: true });
    expect(() => normalizeCoreSourceV2(b)).toThrow();
    const c = source(); let reads = 0;
    Object.defineProperty(c.facts, "passTick", { get() { reads++; throw new Error("read"); } });
    expect(() => normalizeCoreSourceV2(c)).toThrow(); expect(reads).toBe(0);
    const d = source() as Record<string | symbol, unknown>; d[Symbol("extra")] = true;
    expect(() => normalizeCoreSourceV2(d)).toThrow();
    const e = source(); delete e.timeline.samples[5];
    expect(() => normalizeCoreSourceV2(e)).toThrow();
  });
});
