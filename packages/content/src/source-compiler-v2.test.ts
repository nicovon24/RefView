import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalJsonV2 } from "./source-core-v2";
import { compileCanonicalScenarioSourceV2, recompileStoredCanonicalSourceV2 } from "./source-compiler-v2";
import * as authoringEntry from "./index";

const roster = ["attack-08", "attack-09", "attack-10", "defence-01", "defence-02", "defence-04", "defence-05"];
const bytes = new Map([["player-rig", new TextEncoder().encode("RefView owned player rig v1")],
  ["run-clip", new TextEncoder().encode("RefView owned run clip v1")]]);
const digest = (data: Uint8Array | string) => `sha256:${createHash("sha256").update(data).digest("hex")}`;
const asset = (assetId: string, path: string, attachmentNames: string[]) => ({
  assetId, kind: "proceduralModule", neutralClientPath: path, sha256: digest(bytes.get(assetId)!),
  creator: "RefView", origin: "RefView local procedural source", licenseId: "RefView-owned",
  licenseEvidence: "Authored for this repository", attachmentNames, geometryPartNames: [],
});
const options: Array<{ optionId: string; kind: string; value: string | boolean }> = [
  ["stopPlay", false], ["stopPlay", true],
  ...["playOn", "penaltyKick", "directFreeKick", "indirectFreeKick", "droppedBall"].map((value) => ["restart", value]),
  ...["none", "yellow", "red"].map((value) => ["discipline", value]),
].map(([kind, value], index) => ({ optionId: `opt-${String(index + 1).padStart(3, "0")}`,
  kind: String(kind), value: value as string | boolean }));

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
      samples: Array.from({ length: 481 }, (_, tick) => ({
        tick, actors: roster.map((actorId) => ({ actorId,
          position: actorId === "attack-09" ? { x: 13.8, y: 0, z: 36.8 }
            : actorId === "defence-04" ? { x: 13.65, y: 0, z: 36.8 } : { x: 0, y: 0, z: 20 },
          yawRad: 0, clipId: "run-clip", phaseQ: tick })),
        ball: { position: { x: 8, y: 0.11, z: 29 },
          orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } },
      })),
      events: [
        { eventId: "pass", tick: 120, ordinal: 0, kind: "ballTouch", actorIds: ["attack-08"], payload: {} },
        { eventId: "contact", tick: 366, ordinal: 0, kind: "contact", actorIds: ["attack-09", "defence-04"], payload: {} },
        { eventId: "offence", tick: 366, ordinal: 1, kind: "offence", actorIds: ["attack-09", "defence-04"], payload: {} },
        { eventId: "whistle", tick: 372, ordinal: 0, kind: "whistleWindow", actorIds: [], payload: {} },
      ],
    },
    decisionGate: { opensAtTick: 360, closesAtTick: 480, forcePauseAtTick: 480 },
    initialRefereePose: { position: { x: 3, y: 0, z: 29 }, lookYaw: 0, lookPitch: 0 },
    rendering: {
      assets: [asset("player-rig", "/assets/asset-001.mjs", ["foot", "ground"]),
        asset("run-clip", "/assets/asset-002.mjs", [])],
      actorBindings: roster.map((actorId) => ({ actorId, rigAssetId: "player-rig", clipAssetIds: ["run-clip"] })),
      safeCues: [],
    },
    decisionOptions: structuredClone(options),
    officialSources: [{ sourceId: "ifab-law-12", edition: "IFAB-2026-27",
      documentUrl: "https://www.theifab.com/laws/latest/fouls-and-misconduct/",
      lawAndSection: "Law 12 / Direct free kick", inspectedArtifactSha256: digest("inspected IFAB artifact"),
      provenance: "IFAB 2026/27 English Laws inspected for the brief" }],
    facts: { passTick: 120, passerActorId: "attack-08", receiverActorId: "attack-09", onsideMarginM: 1.5,
      contactTick: 366, offenderActorId: "defence-04", contactGround: { x: 13.8, y: 0, z: 36.8 },
      ballInPlay: true, defenderPlayedBall: false, contactIntensity: "careless",
      coveringDefenderActorId: "defence-05", obviousGoalOpportunity: false,
      separateMisconduct: false, expectedRestart: "penaltyKick", expectedDiscipline: "none" },
    observation: { visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
      cameraColliders: [] as Array<{ boxId: string; min: { x: number; y: number; z: number };
        max: { x: number; y: number; z: number } }>, evidence: [
        { evidenceId: "EV-TRIP-CONTACT", fromTick: 366, toTick: 366, requiredAnchorIds: ["foot", "challengerFoot"],
          samples: [{ tick: 366, anchors: [{ anchorId: "foot", position: { x: 13.8, y: 0.34, z: 36.8 } },
            { anchorId: "challengerFoot", position: { x: 13.65, y: 0.34, z: 36.8 } }],
            occluders: [] }] },
        { evidenceId: "EV-INSIDE-AREA", fromTick: 366, toTick: 366,
          requiredAnchorIds: ["ground", "line"], samples: [{ tick: 366,
            anchors: [{ anchorId: "ground", position: { x: 13.8, y: 0, z: 36.8 } },
              { anchorId: "line", position: { x: 13.8, y: 0, z: 36 } }], occluders: [] }] },
      ] },
    geometryBindings: { anchors: [
      { evidenceId: "EV-TRIP-CONTACT", anchorId: "foot",
        target: { kind: "actorAttachment", actorId: "attack-09", attachmentName: "foot" } },
      { evidenceId: "EV-TRIP-CONTACT", anchorId: "challengerFoot",
        target: { kind: "actorAttachment", actorId: "defence-04", attachmentName: "foot" } },
      { evidenceId: "EV-INSIDE-AREA", anchorId: "ground",
        target: { kind: "actorAttachment", actorId: "attack-09", attachmentName: "ground" } },
      { evidenceId: "EV-INSIDE-AREA", anchorId: "line",
        target: { kind: "fieldPoint", feature: "nearPenaltyAreaLine", xM: 13.8 } },
    ], occluders: [] },
    rubric: { evaluationVersion: 1, classification: "clear", role: "mainReferee",
      decision: { mode: "exactSemanticMatch", expected: { stopPlay: true, restart: "penaltyKick",
        discipline: "none", offenderActorId: "defence-04" },
      allowUnspecifiedOffenderWhenNoCard: true, evidenceIds: ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"] },
      observation: { observationRubricVersion: 1, requiredEvidenceIds: ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"] },
      communication: { mode: "notApplicable", reason: "noAuthoredCommunicationInput" },
      protocol: { mode: "notApplicable", reason: "initialMainRefereeNoVar" },
      debriefContentId: "debrief-001" },
    preparedDebrief: { contentId: "debrief-001", sections: [{ sectionId: "ruling",
      es: "Penal sin tarjeta: zancadilla imprudente dentro del área.",
      en: "Penalty, no card: careless trip inside the area.",
      evidenceIds: ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"], sourceIds: ["ifab-law-12"] }] },
  };
}
const dependencies = {
  resolveAssetBytes: (assetId: string) => bytes.get(assetId),
  sampleAttachment: (_rig: string, _clip: string, _phase: number, name: string) =>
    name === "foot" ? { x: 0, y: 0.34, z: 0 } : name === "ground" ? { x: 0, y: 0, z: 0 } : undefined,
  sampleGeometryPart: () => undefined,
};

describe("v2 full-source compiler", () => {
  it("requires both sampled contact feet within a plausible trip distance", () => {
    const missing = source();
    missing.observation.evidence[0]!.samples[0]!.anchors.pop();
    missing.observation.evidence[0]!.requiredAnchorIds.pop();
    missing.geometryBindings.anchors.splice(1, 1);
    expect(() => compileCanonicalScenarioSourceV2(missing, dependencies)).toThrow(/trip contact/);
    const separated = source();
    separated.timeline.samples[366]!.actors.find((actor) => actor.actorId === "defence-04")!
      .position.x = 12.5;
    separated.observation.evidence[0]!.samples[0]!.anchors[1]!.position.x = 12.5;
    expect(() => compileCanonicalScenarioSourceV2(separated, dependencies)).toThrow(/trip contact/);
  });
  it("derives the complete hash and private/public projections from one detached source", () => {
    const input = source();
    const result = compileCanonicalScenarioSourceV2(input, dependencies);
    expect(result.contentHash).toBe(digest(canonicalJsonV2(["refview-scenario-content-v2", result.canonicalSource])));
    expect(result.playable.contentHash).toBe(result.contentHash);
    expect(result.privateContext.observationFixture.ref).toEqual(result.canonicalSource.ref);
    expect(result.privateContext.observationFixture.scenarioContentHash).toBe(result.contentHash);
    expect(result.privateContext.observationFixture.durationTicks).toBe(480);
    expect(result.privateContext.boundRubric.ref).toEqual(result.canonicalSource.ref);
    expect(result.privateContext.boundRubric.scenarioContentHash).toBe(result.contentHash);
    expect(result.playable.actors).toHaveLength(481);
    expect(JSON.stringify(result.playable)).not.toMatch(/defence-04|EV-TRIP|penaltyKick.*expectedRestart|preparedDebrief/);
    input.preparedDebrief.sections[0]!.es = "changed after compile";
    expect(result.canonicalSource.preparedDebrief.sections[0]?.es).toContain("Penal sin tarjeta");
    expect(Object.isFrozen(result.canonicalSource)).toBe(true);
  });
  it("changes the hash for private content and provenance edits, while set order is stable", () => {
    const base = compileCanonicalScenarioSourceV2(source(), dependencies).contentHash;
    for (const mutate of [
      (value: ReturnType<typeof source>) => { value.competitionProfile.version = 2; },
      (value: ReturnType<typeof source>) => { value.officialSources[0]!.inspectedArtifactSha256 = digest("other"); },
      (value: ReturnType<typeof source>) => { value.initialRefereePose.lookYaw = 0.1; },
      (value: ReturnType<typeof source>) => { value.observation.cameraColliders.push({
        boxId: "post", min: { x: 20, y: 0, z: 20 }, max: { x: 21, y: 2, z: 21 } }); },
      (value: ReturnType<typeof source>) => { value.rendering.assets[0]!.licenseEvidence = "new evidence"; },
      (value: ReturnType<typeof source>) => { value.preparedDebrief.sections[0]!.es += " Revisado."; },
    ]) {
      const changed = source(); mutate(changed);
      expect(compileCanonicalScenarioSourceV2(changed, dependencies).contentHash).not.toBe(base);
    }
    const reordered = source();
    reordered.timeline.samples.reverse();
    reordered.timeline.samples.forEach((sample) => sample.actors.reverse());
    reordered.rendering.assets.reverse();
    reordered.rendering.actorBindings.reverse();
    reordered.observation.evidence.reverse();
    reordered.decisionOptions.reverse();
    expect(compileCanonicalScenarioSourceV2(reordered, dependencies).contentHash).toBe(base);
  });
  it("rejects caller-derived fields and contradictory authority", () => {
    const forged = source() as Record<string, unknown>; forged.contentHash = digest("forged");
    expect(() => compileCanonicalScenarioSourceV2(forged, dependencies)).toThrow();
    const wrong = source(); wrong.rubric.decision.expected.offenderActorId = "attack-09";
    expect(() => compileCanonicalScenarioSourceV2(wrong, dependencies)).toThrow();
    const missing = { ...dependencies, resolveAssetBytes: () => undefined };
    expect(() => compileCanonicalScenarioSourceV2(source(), missing)).toThrow();
  });
  it("recompiles stored canonical content while rejecting caller-supplied derived fields", () => {
    const compiled = compileCanonicalScenarioSourceV2(source(), dependencies);
    expect(recompileStoredCanonicalSourceV2(compiled.canonicalSource, dependencies).contentHash)
      .toBe(compiled.contentHash);
    const tampered = structuredClone(compiled.canonicalSource) as unknown as Record<string, unknown>;
    tampered.competitionProfileHash = digest("forged");
    expect(() => recompileStoredCanonicalSourceV2(tampered, dependencies)).toThrow();
    expect(() => compileCanonicalScenarioSourceV2(compiled.canonicalSource, dependencies)).toThrow();
  });
  it("rejects decisive evidence rebound to an unrelated tick or field point", () => {
    const offTick = source();
    const trip = offTick.observation.evidence[0]!;
    trip.fromTick = 0; trip.toTick = 0; trip.samples[0]!.tick = 0;
    expect(() => compileCanonicalScenarioSourceV2(offTick, dependencies)).toThrow();
    const offLine = source();
    offLine.geometryBindings.anchors[2]!.target.xM = 10;
    offLine.observation.evidence[1]!.samples[0]!.anchors[1]!.position.x = 10;
    expect(() => compileCanonicalScenarioSourceV2(offLine, dependencies)).toThrow();
  });
  it("exposes only the source compiler and stored-source verifier at the package entrypoint", () => {
    expect(Object.keys(authoringEntry).sort()).toEqual([
      "compileCanonicalScenarioSourceV2", "recompileStoredCanonicalSourceV2",
    ]);
  });
});
