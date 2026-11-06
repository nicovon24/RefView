/** The first authored incident. All positions are metres in the canonical field frame. */
import { sampleAttachment, sampleGeometryPart } from "../assets/asset-001.mjs";
// @ts-expect-error The bundled JavaScript clip has no TypeScript declaration.
import { samplePose as samplePoseA } from "../assets/asset-002.mjs";
// @ts-expect-error The bundled JavaScript clip has no TypeScript declaration.
import { samplePose as samplePoseB } from "../assets/asset-003.mjs";
// @ts-expect-error The bundled JavaScript clip has no TypeScript declaration.
import { samplePose as samplePoseC } from "../assets/asset-004.mjs";

const roster = ["attack-08", "attack-09", "attack-10", "defence-01", "defence-02", "defence-04", "defence-05"] as const;
type Point = { x: number; y: number; z: number };
type Knot = readonly [number, number, number];

const paths: Record<typeof roster[number], readonly Knot[]> = {
  "attack-08": [[0, 7.2, 27.8], [120, 8, 29], [300, 8.4, 30.2], [480, 8.8, 30.8]],
  "attack-09": [[0, 9.3, 28.4], [120, 10, 30], [300, 12.65, 35.1], [366, 13.8, 36.8], [390, 14.03, 37.14], [480, 14.05, 37.16]],
  "attack-10": [[0, 3.5, 25.4], [120, 5, 27.3], [300, 2, 29.5], [480, 1, 32]],
  "defence-01": [[0, 0, 51], [120, 0.2, 50.8], [300, 1, 50.2], [480, 1.4, 49.8]],
  "defence-02": [[0, 10, 31], [120, 11, 31.5], [300, 12.8, 32.6], [366, 13.1, 32.8], [480, 13.4, 33.2]],
  "defence-04": [[0, 12.4, 29.3], [120, 12.5, 30.8], [300, 13.2, 34.9],
    [356, 14.42, 35.7], [366, 14.55, 35.9], [390, 14.8, 36.2], [480, 15.5, 37.5]],
  "defence-05": [[0, 10.8, 29.8], [120, 11.2, 31.2], [300, 11.9, 38.8], [366, 12.1, 41.3], [480, 12.3, 41.5]],
};
const ballPath: readonly Knot[] = [[0, 7.2, 27.9], [120, 8, 29], [180, 10.5, 31.8],
  [300, 13.15, 35.8], [366, 13.5, 37.65], [420, 15.7, 40], [480, 16.1, 40.7]];

function pointAt(path: readonly Knot[], tick: number, y = 0, linear = false): Point {
  const right = path.findIndex((knot) => knot[0] >= tick);
  if (right <= 0) return { x: path[0]![1], y, z: path[0]![2] };
  const next = path[right]!;
  const previous = path[right - 1]!;
  const fraction = (tick - previous[0]) / (next[0] - previous[0]);
  const smooth = linear ? fraction : fraction * fraction * (3 - 2 * fraction);
  return { x: previous[1] + (next[1] - previous[1]) * smooth,
    y, z: previous[2] + (next[2] - previous[2]) * smooth };
}

const outfield = roster.filter((actorId) => actorId !== "defence-01");
const runStart = 0;
const runBlendStart = 270;
const runEnd = 330;
const runPositions = Object.fromEntries(outfield.map((actorId) => {
  const path = paths[actorId];
  const previous = pointAt(path, 120, 0, actorId === "attack-09");
  const endpoint = pointAt(path, runEnd, 0, actorId === "attack-09");
  const next = pointAt(path, runEnd + 1, 0, actorId === "attack-09");
  const endVelocity = { x: 60 * (next.x - endpoint.x), z: 60 * (next.z - endpoint.z) };
  const runVelocity = {
    x: (60 * (endpoint.x - previous.x) - 30 * endVelocity.x) / 180,
    z: (60 * (endpoint.z - previous.z + 10) - 30 * endVelocity.z) / 180,
  };
  const positions = Array<Point>(runEnd + 1);
  positions[runEnd] = endpoint;
  for (let step = runEnd - 1; step >= runStart; step--) {
    const fraction = Math.max(0, Math.min(1, (step + 0.5 - runBlendStart) / (runEnd - runBlendStart)));
    const weight = fraction * fraction * (3 - 2 * fraction);
    const current = positions[step + 1]!;
    positions[step] = {
      x: current.x - ((1 - weight) * runVelocity.x + weight * endVelocity.x) / 60,
      y: 0,
      z: current.z - ((1 - weight) * runVelocity.z + weight * endVelocity.z) / 60,
    };
  }
  return [actorId, positions];
})) as Record<(typeof outfield)[number], Point[]>;

function actorAt(actorId: typeof roster[number], tick: number): Point {
  if (actorId !== "defence-01" && tick < runEnd) return runPositions[actorId][tick]!;
  return pointAt(paths[actorId], tick, 0, actorId === "attack-09");
}

function hermite(start: Point, end: Point, startVelocity: Point, endVelocity: Point,
  fraction: number, durationSeconds: number): Point {
  const t2 = fraction * fraction;
  const t3 = t2 * fraction;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + fraction;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return {
    x: h00 * start.x + h10 * durationSeconds * startVelocity.x +
      h01 * end.x + h11 * durationSeconds * endVelocity.x,
    y: 0.11,
    z: h00 * start.z + h10 * durationSeconds * startVelocity.z +
      h01 * end.z + h11 * durationSeconds * endVelocity.z,
  };
}

const oldBall = (tick: number) => pointAt(ballPath, tick, 0.11);
const ballAtPass = actorAt("attack-08", 120);
const ballAtReceive = (() => {
  const oldReceiver = pointAt(paths["attack-09"], 180, 0, true);
  const receiver = actorAt("attack-09", 180);
  const ball = oldBall(180);
  return { x: receiver.x + ball.x - oldReceiver.x, y: 0.11,
    z: receiver.z + ball.z - oldReceiver.z };
})();
const ballReceiveVelocity = (() => {
  const receiver = actorAt("attack-09", 0);
  const receiverNext = actorAt("attack-09", 1);
  const receiver180 = pointAt(paths["attack-09"], 180, 0, true);
  const receiver300 = pointAt(paths["attack-09"], 300, 0, true);
  const ball180 = oldBall(180);
  const ball300 = oldBall(300);
  return { x: 60 * (receiverNext.x - receiver.x) +
    ((ball300.x - receiver300.x) - (ball180.x - receiver180.x)) / 2,
    y: 0,
    z: 60 * (receiverNext.z - receiver.z) +
      ((ball300.z - receiver300.z) - (ball180.z - receiver180.z)) / 2 };
})();

function ballAt(tick: number): Point {
  if (tick <= 120) {
    const ball = oldBall(tick);
    const oldPasser = pointAt(paths["attack-08"], tick);
    const passer = actorAt("attack-08", tick);
    return { x: passer.x + ball.x - oldPasser.x, y: 0.11,
      z: passer.z + ball.z - oldPasser.z };
  }
  if (tick <= 180) {
    const passVelocity = { x: 1.1 * (ballAtReceive.x - ballAtPass.x), y: 0,
      z: 1.1 * (ballAtReceive.z - ballAtPass.z) };
    return hermite(ballAtPass, ballAtReceive, passVelocity, ballReceiveVelocity,
      (tick - 120) / 60, 1);
  }
  if (tick < runEnd) {
    const end = oldBall(runEnd);
    const after = oldBall(runEnd + 1);
    const endVelocity = { x: 60 * (after.x - end.x), y: 0,
      z: 60 * (after.z - end.z) };
    return hermite(ballAtReceive, end, ballReceiveVelocity, endVelocity,
      (tick - 180) / 150, 2.5);
  }
  return oldBall(tick);
}
function clipAt(actorId: typeof roster[number], tick: number) {
  if (actorId === "attack-09" && tick >= 366) {
    return { clipId: "trip-clip", phaseQ: tick - 366 };
  }
  if (actorId === "defence-04" && tick >= 356) {
    return { clipId: "challenge-clip", phaseQ: tick - 356 };
  }
  return { clipId: "run-clip", phaseQ: tick };
}
function poseFor(clipAssetId: string, phaseQ: number) {
  if (clipAssetId === "run-clip") return samplePoseA(phaseQ);
  if (clipAssetId === "trip-clip") return samplePoseB(phaseQ);
  if (clipAssetId === "challenge-clip") return samplePoseC(phaseQ);
  throw new Error(`unknown authored clip ${clipAssetId}`);
}

/** The server resolves private clip IDs before calling the public pose-based rig ABI. */
export function createIncident001GeometryResolverV2() {
  return {
    sampleAttachment: (rigAssetId: string, clipAssetId: string, phaseQ: number, name: string) =>
      rigAssetId === "player-rig" ? sampleAttachment(poseFor(clipAssetId, phaseQ), name) : undefined,
    sampleGeometryPart: (rigAssetId: string, clipAssetId: string, phaseQ: number, name: string) =>
      rigAssetId === "player-rig" ? sampleGeometryPart(poseFor(clipAssetId, phaseQ), name) : undefined,
  };
}
function attachment(actorId: typeof roster[number], tick: number, name: string): Point {
  const { clipId, phaseQ } = clipAt(actorId, tick);
  const local = sampleAttachment(poseFor(clipId, phaseQ), name);
  if (!local) throw new Error(`missing authored attachment ${name}`);
  const root = actorAt(actorId, tick);
  return { x: root.x + local.x, y: root.y + local.y, z: root.z + local.z };
}
function bodyScreenBox(actorId: typeof roster[number], tick: number) {
  const { clipId, phaseQ } = clipAt(actorId, tick);
  const local = sampleGeometryPart(poseFor(clipId, phaseQ), "body");
  if (!local) throw new Error("missing authored body geometry");
  const { x, z } = actorAt(actorId, tick);
  return { boxId: "screen", min: { x: x + local.min.x, y: local.min.y, z: z + local.min.z },
    max: { x: x + local.max.x, y: local.max.y, z: z + local.max.z } };
}
function evidence(evidenceId: string, fromTick: number, toTick: number,
  anchorAt: (tick: number) => { anchorId: string; position: Point }[], screen = false) {
  return { evidenceId, fromTick, toTick,
    requiredAnchorIds: anchorAt(fromTick).map((anchor) => anchor.anchorId),
    samples: Array.from({ length: toTick - fromTick + 1 }, (_, offset) => {
      const tick = fromTick + offset;
      return { tick, anchors: anchorAt(tick), occluders: screen ? [bodyScreenBox("defence-02", tick)] : [] };
    }) };
}
const asset = (assetId: string, path: string, sha256: `sha256:${string}`,
  attachmentNames: string[] = [], geometryPartNames: string[] = []) => ({
  assetId, kind: "proceduralModule" as const, neutralClientPath: path, sha256,
  creator: "RefView project", origin: "Original local procedural JavaScript source in packages/content/assets",
  licenseId: "RefView-owned", licenseEvidence: "Original source authored in this repository; no third-party asset bytes",
  attachmentNames, geometryPartNames,
});
const digest = "sha256:89398520b353c6d995a1bb2557c97dc3c5aa1712c1d3009589f580a5a23c6a7d" as const;
const official = (sourceId: string, lawAndSection: string) => ({ sourceId, edition: "IFAB-2026-27" as const,
  documentUrl: "https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en",
  lawAndSection, inspectedArtifactSha256: digest,
  provenance: "Downloaded the English 2026/27 IFAB single-pages PDF on 2026-11-03; SHA-256 of 23,437,157 bytes; inspected extracted law text." });

export function createIncident001SourceV2() {
  return {
    schemaVersion: 2, purpose: "authoredTraining", ref: { scenarioId: "incident-001", version: 1 },
    classification: "clear", supportedRoles: ["mainReferee"], lawsEdition: "IFAB-2026-27",
    competitionProfile: { profileId: "senior-standard", version: 1, settings: {
      matchKind: "fictionalTraining", format: "senior11v11", durationMinutes: 90,
      fieldLengthM: 105, fieldWidthM: 68, goalWidthM: 7.32, goalHeightM: 2.44,
      modifications: [], varEnabled: true } },
    field: { lengthM: 105, widthM: 68, goalWidthM: 7.32, penaltyAreaDepthM: 16.5,
      penaltyAreaExtraWidthEachSideM: 16.5, lineWidthM: 0.12, attackDirection: "positiveZ" },
    timeline: { ref: { scenarioId: "incident-001", version: 1 }, durationTicks: 480,
      samples: Array.from({ length: 481 }, (_, tick) => ({ tick,
        actors: roster.map((actorId) => ({ actorId, position: actorAt(actorId, tick), yawRad: 0,
          ...clipAt(actorId, tick) })),
        ball: { position: ballAt(tick),
          orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })),
      events: [
        { eventId: "pass", tick: 120, ordinal: 0, kind: "ballTouch", actorIds: ["attack-08"], payload: {} },
        { eventId: "contact", tick: 366, ordinal: 0, kind: "contact", actorIds: ["attack-09", "defence-04"], payload: {} },
        { eventId: "offence", tick: 366, ordinal: 1, kind: "offence", actorIds: ["attack-09", "defence-04"], payload: {} },
        { eventId: "whistle", tick: 372, ordinal: 0, kind: "whistleWindow", actorIds: [], payload: {} },
      ] },
    decisionGate: { opensAtTick: 360, closesAtTick: 480, forcePauseAtTick: 480 },
    initialRefereePose: { position: { x: 3, y: 0, z: 4 }, lookYaw: 0.8, lookPitch: 0 },
    rendering: {
      assets: [
        asset("player-rig", "/assets/asset-001.mjs", "sha256:8f99e4ec7219e1cd1291fa7aa708793b07a158de61a660390d30badb06bb92a0", ["contactFoot", "ground", "head", "torso"], ["body", "lowerLeg"]),
        asset("run-clip", "/assets/asset-002.mjs", "sha256:b0929af7e3c978f50c53fa59459552b9be0ff3f512a5d8ffd13cdc9f4a768ab9"),
        asset("trip-clip", "/assets/asset-003.mjs", "sha256:7af2bdc5a6201572b49f4974afd8986707132011f68a442dd61486fc2db6c528"),
        asset("challenge-clip", "/assets/asset-004.mjs", "sha256:bbb5804a692bdc4d04f2161cc7f6c3d34d422fb91eb6a399f9ebf296c30a0e1b"),
      ],
      actorBindings: roster.map((actorId) => ({ actorId, rigAssetId: "player-rig",
        clipAssetIds: actorId === "attack-09" ? ["run-clip", "trip-clip"] :
          actorId === "defence-04" ? ["run-clip", "challenge-clip"] : ["run-clip"] })),
      safeCues: [
        { cueId: "challenge-motion", tick: 356, ordinal: 0, kind: "animationCue", assetId: "challenge-clip" },
        { cueId: "trip-motion", tick: 366, ordinal: 0, kind: "animationCue", assetId: "trip-clip" },
      ],
    },
    decisionOptions: ([false, true].map((value) => ({ kind: "stopPlay", value })) as
      { kind: string; value: string | boolean }[]).concat(
      ["playOn", "penaltyKick", "directFreeKick", "indirectFreeKick", "droppedBall"].map((value) => ({ kind: "restart", value })),
      ["none", "yellow", "red"].map((value) => ({ kind: "discipline", value })))
      .map((option, index) => ({ optionId: `opt-${String(index + 1).padStart(3, "0")}`, ...option })),
    officialSources: [official("ifab-law-11", "Law 11 / Offside position and moment of touch, PDF p. 109"),
      official("ifab-law-12", "Law 12 / Direct free kick, careless challenge, disciplinary sanctions, PDF pp. 115-127"),
      official("ifab-law-14", "Law 14 / Penalty kick, PDF p. 135")],
    facts: { passTick: 120, passerActorId: "attack-08", receiverActorId: "attack-09", onsideMarginM: 1.5,
      contactTick: 366, offenderActorId: "defence-04", contactGround: { x: 13.8, y: 0, z: 36.8 },
      ballInPlay: true, defenderPlayedBall: false, contactIntensity: "careless",
      coveringDefenderActorId: "defence-05", obviousGoalOpportunity: false,
      separateMisconduct: false, expectedRestart: "penaltyKick", expectedDiscipline: "none" },
    observation: { visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
      cameraColliders: [], evidence: [
        evidence("EV-PASS-SNAPSHOT", 116, 124, (tick) => [
          { anchorId: "receiver", position: attachment("attack-09", tick, "head") },
          { anchorId: "secondLast", position: attachment("defence-02", tick, "head") },
          { anchorId: "ball", position: ballAt(tick) }]),
        evidence("EV-NO-BALL-TOUCH", 356, 366, (tick) => [
          { anchorId: "challengerFoot", position: attachment("defence-04", tick, "contactFoot") },
          { anchorId: "ball", position: ballAt(tick) }]),
        evidence("EV-TRIP-CONTACT", 364, 371, (tick) => [
          { anchorId: "contactFoot", position: attachment("attack-09", tick, "contactFoot") },
          { anchorId: "challengerFoot", position: attachment("defence-04", tick, "contactFoot") }], true),
        evidence("EV-INSIDE-AREA", 360, 374, (tick) => [
          { anchorId: "ground", position: attachment("attack-09", tick, "ground") },
          { anchorId: "line", position: { x: 13.8, y: 0, z: 36 } }], true),
        evidence("EV-NON-DOGSO", 330, 371, (tick) => [
          { anchorId: "cover", position: attachment("defence-05", tick, "torso") },
          { anchorId: "keeper", position: attachment("defence-01", tick, "torso") },
          { anchorId: "ball", position: ballAt(tick) }]),
      ] },
    geometryBindings: { anchors: [
      { evidenceId: "EV-PASS-SNAPSHOT", anchorId: "receiver", target: { kind: "actorAttachment", actorId: "attack-09", attachmentName: "head" } },
      { evidenceId: "EV-PASS-SNAPSHOT", anchorId: "secondLast", target: { kind: "actorAttachment", actorId: "defence-02", attachmentName: "head" } },
      { evidenceId: "EV-PASS-SNAPSHOT", anchorId: "ball", target: { kind: "ballCenter" } },
      { evidenceId: "EV-NO-BALL-TOUCH", anchorId: "challengerFoot", target: { kind: "actorAttachment", actorId: "defence-04", attachmentName: "contactFoot" } },
      { evidenceId: "EV-NO-BALL-TOUCH", anchorId: "ball", target: { kind: "ballCenter" } },
      { evidenceId: "EV-TRIP-CONTACT", anchorId: "contactFoot", target: { kind: "actorAttachment", actorId: "attack-09", attachmentName: "contactFoot" } },
      { evidenceId: "EV-TRIP-CONTACT", anchorId: "challengerFoot", target: { kind: "actorAttachment", actorId: "defence-04", attachmentName: "contactFoot" } },
      { evidenceId: "EV-INSIDE-AREA", anchorId: "ground", target: { kind: "actorAttachment", actorId: "attack-09", attachmentName: "ground" } },
      { evidenceId: "EV-INSIDE-AREA", anchorId: "line", target: { kind: "fieldPoint", feature: "nearPenaltyAreaLine", xM: 13.8 } },
      { evidenceId: "EV-NON-DOGSO", anchorId: "cover", target: { kind: "actorAttachment", actorId: "defence-05", attachmentName: "torso" } },
      { evidenceId: "EV-NON-DOGSO", anchorId: "keeper", target: { kind: "actorAttachment", actorId: "defence-01", attachmentName: "torso" } },
      { evidenceId: "EV-NON-DOGSO", anchorId: "ball", target: { kind: "ballCenter" } },
    ], occluders: [
      { evidenceId: "EV-TRIP-CONTACT", boxId: "screen", actorId: "defence-02", geometryPartName: "body" },
      { evidenceId: "EV-INSIDE-AREA", boxId: "screen", actorId: "defence-02", geometryPartName: "body" },
    ] },
    rubric: { evaluationVersion: 1, classification: "clear", role: "mainReferee",
      decision: { mode: "exactSemanticMatch", expected: { stopPlay: true, restart: "penaltyKick",
        discipline: "none", offenderActorId: "defence-04" }, allowUnspecifiedOffenderWhenNoCard: true,
        evidenceIds: ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"] },
      observation: { observationRubricVersion: 1, requiredEvidenceIds: ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"] },
      communication: { mode: "notApplicable", reason: "noAuthoredCommunicationInput" },
      protocol: { mode: "notApplicable", reason: "initialMainRefereeNoVar" },
      debriefContentId: "debrief-001" },
    preparedDebrief: { contentId: "debrief-001", sections: [
      { sectionId: "ruling", es: "Penal sin tarjeta: el defensor zancadillea de forma imprudente al atacante dentro del área.",
        en: "Penalty, no card: the defender carelessly trips the attacker inside the area.",
        evidenceIds: ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"], sourceIds: ["ifab-law-12", "ifab-law-14"] },
      { sectionId: "context", es: "El atacante estaba habilitado en el pase. Había cobertura defensiva hacia la portería.",
        en: "The attacker was onside at the pass. A covering defender remained goal-side.",
        evidenceIds: ["EV-PASS-SNAPSHOT", "EV-NON-DOGSO"], sourceIds: ["ifab-law-11", "ifab-law-12"] },
    ] },
  };
}
