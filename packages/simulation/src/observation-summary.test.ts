import { createTimelineFixture } from "@refview/domain";
import { describe, expect, it } from "vitest";
import { createObservationFixture, type ViewSample } from "./observation-geometry";
import { summarizeObservationTraceV1, type TrustedObservationScoringContextV1 } from "./observation-summary";
import type { ObservationTraceV1, TrustedTraceContextV1 } from "./observation-trace";

const hash = `sha256:${"a".repeat(64)}`;
const durationTicks = 12;
const timeline = createTimelineFixture({ ref: { scenarioId: "summary", version: 1 }, durationTicks,
  samples: Array.from({ length: durationTicks + 1 }, (_, tick) => ({ tick, actors: [],
    ball: { position: { x: 0, y: 0, z: 0 }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })), events: [] });
const fixture = createObservationFixture({ ref: { scenarioId: "summary", version: 1 }, scenarioContentHash: hash,
  durationTicks, visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
  cameraColliders: [], evidence: [
    { evidenceId: "contact", fromTick: 0, toTick: 8, requiredAnchorIds: ["foot"],
      samples: Array.from({ length: 9 }, (_, tick) => ({ tick,
        anchors: [{ anchorId: "foot", position: { x: 0, y: 1.7, z: 10 } }], occluders: [] })) },
    { evidenceId: "late", fromTick: 10, toTick: 12, requiredAnchorIds: ["foot"],
      samples: Array.from({ length: 3 }, (_, i) => ({ tick: i + 10,
        anchors: [{ anchorId: "foot", position: { x: 0, y: 1.7, z: 10 } }], occluders: [] })) },
  ] }, timeline, hash);
const view = (tick: number, lookYaw = 0): ViewSample => ({ tick, refereePosition: { x: 0, y: 0, z: 0 },
  lookYaw, lookPitch: 0, cameraMode: "firstPerson", cameraDistanceM: 4,
  cameraLateralOffsetM: 0, viewportAspectRatio: 1.5, verticalFovRad: 1 });
function trace(stopTick = 8, liveTicks: readonly number[] = [0, 2, 4], yawAt: (tick: number) => number = () => 0): ObservationTraceV1 {
  return { scenarioRef: { scenarioId: "summary", version: 1 }, scenarioContentHash: hash,
    attemptId: "attempt", runRevision: 0, traceVersion: 1, visibilityModelVersion: 1,
    cameraRigVersion: 1, eyeCalibrationVersion: 1, observationRubricVersion: 1,
    role: "mainReferee", stopTick,
    views: Array.from({ length: stopTick + 1 }, (_, tick) => ({ tick, epoch: 0, sprint: false, view: view(tick, yawAt(tick)) })),
    renderReceipts: liveTicks.map((tick, i) => ({ sequence: i + 1, tick, epoch: 0, source: "live" as const,
      workflowState: "playing" as const, documentVisible: true, pointerLocked: true, paused: false })),
    breaks: [{ sequence: liveTicks.length + 1, afterTick: stopTick, nextEpoch: null, reason: "deciding" }] };
}
const context = (candidate: ObservationTraceV1): TrustedTraceContextV1 => ({ fixture, attemptId: "attempt",
  runRevision: 0, role: "mainReferee", initialView: candidate.views[0]!.view,
  fieldBounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, decisionTick: candidate.stopTick,
  decisionWindow: { fromTick: 0, toTick: 12 }, eligibleDecidingTransition: true });
function fixtureWithContactAt(positionAt: (tick: number) => { x: number; y: number; z: number }) {
  return createObservationFixture({ ref: { scenarioId: "summary", version: 1 }, scenarioContentHash: hash,
    durationTicks, visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
    cameraColliders: [], evidence: [
      { evidenceId: "contact", fromTick: 0, toTick: 8, requiredAnchorIds: ["foot"],
        samples: Array.from({ length: 9 }, (_, tick) => ({ tick,
          anchors: [{ anchorId: "foot", position: positionAt(tick) }], occluders: [] })) },
      { evidenceId: "late", fromTick: 10, toTick: 12, requiredAnchorIds: ["foot"],
        samples: Array.from({ length: 3 }, (_, i) => ({ tick: i + 10,
          anchors: [{ anchorId: "foot", position: { x: 0, y: 1.7, z: 10 } }], occluders: [] })) },
    ] }, timeline, hash);
}
const scoringContext = (candidate: ObservationTraceV1, required = ["contact"]): TrustedObservationScoringContextV1 => ({
  ...context(candidate), rubric: { scenarioRef: { scenarioId: "summary", version: 1 },
    scenarioContentHash: hash, observationRubricVersion: 1, requiredEvidenceIds: required },
});
const summarize = (candidate: ObservationTraceV1, required = ["contact"]) =>
  summarizeObservationTraceV1(candidate, scoringContext(candidate, required));

describe("RV-005 C2-B eligible live observation summary", () => {
  it("scores supported from three distinct live receipts spanning four ticks", () => {
    expect(summarize(trace())).toMatchObject({ status: "scored", score: 100,
      evidence: [{ evidenceId: "contact", band: "supported", eligibleJointTicks: [0, 2, 4] }] });
  });
  it("excludes replay receipts and distinguishes no live rendering from scored zero", () => {
    const noLive = trace(8, []);
    noLive.renderReceipts = [0, 2, 4].map((tick, i) => ({ sequence: i + 1, tick, epoch: 0,
      source: "replay", workflowState: "other", documentVisible: false, pointerLocked: false, paused: true }));
    noLive.breaks[0]!.sequence = 4;
    expect(summarize(noLive)).toMatchObject({ status: "insufficientEvidence", score: null });
    expect(summarize(trace(8, [0]), ["late"])).toMatchObject({ status: "scored", score: 0,
      evidence: [{ evidenceId: "late", band: "none", sampledTicks: 0 }] });
  });
  it("splits intermittent joint geometry and receipt gaps", () => {
    const gaps = trace(8, [0, 1, 4, 5]);
    expect(summarize(gaps)).toMatchObject({ status: "scored", score: 40,
      evidence: [{ band: "weak" }] });
    const intermittent = trace(8, [0, 2, 4]);
    const intermittentFixture = fixtureWithContactAt((tick) => ({ x: 0, y: 1.7, z: tick === 2 ? -10 : 10 }));
    expect(summarizeObservationTraceV1(intermittent, { ...scoringContext(intermittent), fixture: intermittentFixture }))
      .toMatchObject({ status: "scored", score: 0,
      evidence: [{ band: "none" }] });
  });
  it("coalesces duplicate receipts and never joins chains across epochs", () => {
    const duplicate = trace(8, [0, 2, 4]);
    duplicate.renderReceipts = [
      { ...duplicate.renderReceipts[0]!, sequence: 1 },
      { ...duplicate.renderReceipts[0]!, sequence: 2 },
      { ...duplicate.renderReceipts[1]!, sequence: 3 },
      { ...duplicate.renderReceipts[2]!, sequence: 4 },
    ];
    duplicate.breaks[0]!.sequence = 5;
    expect(summarize(duplicate)).toMatchObject({ score: 100, eligibleLiveTicks: 3,
      evidence: [{ eligibleJointTicks: [0, 2, 4], strongestChainReceipts: 3 }] });

    const split = trace(8, []);
    split.views = split.views.map((record) => ({ ...record, epoch: record.tick < 3 ? 0 : 1 }));
    split.renderReceipts = [0, 2, 3, 4].map((tick, i) => ({ sequence: i < 2 ? i + 1 : i + 2,
      tick, epoch: tick < 3 ? 0 : 1, source: "live", workflowState: "playing",
      documentVisible: true, pointerLocked: true, paused: false }));
    split.breaks = [{ sequence: 3, afterTick: 2, nextEpoch: 1, reason: "pause" },
      { sequence: 6, afterTick: 8, nextEpoch: null, reason: "deciding" }];
    expect(summarize(split)).toMatchObject({ score: 40,
      evidence: [{ band: "weak", eligibleJointTicks: [0, 2, 3, 4] }] });
  });
  it("keeps good and poor positions and camera-only diagnostics separate", () => {
    const poor = trace(8, [0, 2, 4], () => Math.PI);
    expect(summarize(poor)).toMatchObject({ status: "scored", score: 0,
      evidence: [{ band: "none", jointTicks: 0, neitherTicks: 9 }] });
    const good = summarize(trace());
    expect(good).toMatchObject({ score: 100, evidence: [{ jointTicks: 9 }] });
    const cameraOnly = trace();
    cameraOnly.views = cameraOnly.views.map((record) => ({ ...record,
      view: { ...record.view, cameraMode: "thirdPerson" } }));
    const behindEye = fixtureWithContactAt(() => ({ x: 0, y: 1.7, z: -3 }));
    expect(summarizeObservationTraceV1(cameraOnly, { ...scoringContext(cameraOnly), fixture: behindEye }))
      .toMatchObject({ score: 0, evidence: [{ jointTicks: 0, cameraOnlyTicks: 9, band: "none" }] });
  });
  it("takes the minimum required band and rejects an empty or unknown rubric", () => {
    expect(summarize(trace(), ["contact", "late"])).toMatchObject({ status: "scored", score: 0 });
    expect(() => summarize(trace(), [])).toThrow();
    expect(() => summarize(trace(), ["unknown"])).toThrow();
  });
  it("binds private rubric identity and version to the validated trace", () => {
    const candidate = trace();
    const trusted = scoringContext(candidate, ["contact", "late"]);
    expect(summarizeObservationTraceV1(candidate, trusted)).toMatchObject({ score: 0 });
    expect(() => summarizeObservationTraceV1(candidate, { ...trusted,
      rubric: { ...trusted.rubric, scenarioRef: { scenarioId: "other", version: 1 } } })).toThrow();
    expect(() => summarizeObservationTraceV1(candidate, { ...trusted,
      rubric: { ...trusted.rubric, scenarioContentHash: `sha256:${"b".repeat(64)}` } })).toThrow();
    expect(() => summarizeObservationTraceV1(candidate, { ...trusted,
      rubric: { ...trusted.rubric, observationRubricVersion: 2 as 1 } })).toThrow();
    expect(summarizeObservationTraceV1(candidate, trusted)).toMatchObject({ score: 0 });
    expect(Reflect.apply(summarizeObservationTraceV1, undefined, [candidate, trusted, ["contact"]]))
      .toMatchObject({ score: 0, evidence: [{ evidenceId: "contact" }, { evidenceId: "late" }] });
  });
  it("cannot be raised by an answer or client score and validates the trace", () => {
    const candidate = trace(8, [0]);
    expect(summarize(candidate)).toMatchObject({ score: 0 });
    expect(() => summarize({ ...candidate, score: 100 } as ObservationTraceV1)).toThrow();
  });
});
