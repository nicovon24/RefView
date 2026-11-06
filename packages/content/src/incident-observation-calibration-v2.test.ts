import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { measureEvidenceAtTick, summarizeObservationTraceV1,
  validateObservationTraceV1, type ObservationTraceV1, type ViewSample } from "@refview/simulation";
import { compileCanonicalScenarioSourceV2 } from "./source-compiler-v2";
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from "./authored-incident-v2";

const assetFiles = new Map([["player-rig", "asset-001.mjs"], ["run-clip", "asset-002.mjs"],
  ["trip-clip", "asset-003.mjs"], ["challenge-clip", "asset-004.mjs"]]);
const compiled = compileCanonicalScenarioSourceV2(createIncident001SourceV2(), {
  ...createIncident001GeometryResolverV2(),
  resolveAssetBytes: (id, path) => {
    const file = assetFiles.get(id);
    return file && path === `/assets/${file}`
      ? readFileSync(new URL(`../assets/${file}`, import.meta.url)) : undefined;
  },
});
const fixture = compiled.privateContext.observationFixture;
const requiredEvidenceIds = compiled.privateContext.boundRubric.rubric.observation.requiredEvidenceIds;
const targets = { A: { x: 6, z: 32 }, B: { x: 12, z: 26.5 } } as const;
const windows = ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"] as const;
const initial = createIncident001SourceV2().initialRefereePose;
const fullscreenAspectRatio = 1280 / 720;
const historicalInlineAspectRatio = 1100 / 460;

describe("fullscreen authoring canvas calibration", () => {
  it("samples the actual 1280 by 720 canvas aspect rather than the historical inline preview", () => {
    expect(runStartView("thirdPerson", fullscreenAspectRatio).viewportAspectRatio).toBe(fullscreenAspectRatio);
    expect(view(366, targets.A, "thirdPerson", fullscreenAspectRatio).viewportAspectRatio).toBe(fullscreenAspectRatio);
  });
});

function runStartView(mode: ViewSample["cameraMode"], aspectRatio = historicalInlineAspectRatio): ViewSample {
  return { tick: 0, refereePosition: { ...initial.position }, lookYaw: initial.lookYaw,
    lookPitch: initial.lookPitch, cameraMode: mode, cameraDistanceM: 2, cameraLateralOffsetM: 0,
    viewportAspectRatio: aspectRatio, verticalFovRad: 50 * Math.PI / 180 };
}

function view(tick: number, position: { x: number; z: number }, mode: ViewSample["cameraMode"],
  aspectRatio = historicalInlineAspectRatio): ViewSample {
  const target = { x: 13.8, z: 36.8 };
  const distance = Math.hypot(target.x - position.x, target.z - position.z);
  return { tick, refereePosition: { ...position, y: 0 },
    lookYaw: Math.atan2(target.x - position.x, target.z - position.z),
    lookPitch: Math.atan2(0.8 - 1.7, distance), cameraMode: mode,
    cameraDistanceM: 2, cameraLateralOffsetM: 0,
    viewportAspectRatio: aspectRatio, verticalFovRad: 50 * Math.PI / 180 };
}

function classificationRows(aspectRatio = historicalInlineAspectRatio) {
  return Object.entries(targets).flatMap(([positionName, position]) =>
    (["firstPerson", "thirdPerson"] as const).flatMap((mode) =>
      windows.map((evidenceId) => {
        const evidence = fixture.evidence.find((entry) => entry.evidenceId === evidenceId)!;
        return { positionName, mode, evidenceId, ticks: Array.from(
          { length: evidence.toTick - evidence.fromTick + 1 }, (_, offset) => {
            const tick = evidence.fromTick + offset;
            return [tick, measureEvidenceAtTick(fixture, evidenceId, tick,
              view(tick, position, mode, aspectRatio)).classification] as const;
          }) };
      })));
}

function liveTrace(position: { x: number; z: number }, mode: ViewSample["cameraMode"], fps: 30 | 60 | 144,
  aspectRatio = historicalInlineAspectRatio): ObservationTraceV1 {
  const stopTick = 380;
  const start = { x: initial.position.x, z: initial.position.z };
  const initialView = runStartView(mode, aspectRatio);
  const destination = view(0, position, mode, aspectRatio);
  const travelTicks = 242;
  const views = Array.from({ length: stopTick + 1 }, (_, tick) => {
    const fraction = Math.min(tick / travelTicks, 1);
    const sample = tick === 0 ? initialView : { ...view(tick, {
      x: start.x + (position.x - start.x) * fraction,
      z: start.z + (position.z - start.z) * fraction,
    }, mode, aspectRatio), lookYaw: initial.lookYaw + (destination.lookYaw - initial.lookYaw) * fraction,
    lookPitch: initial.lookPitch + (destination.lookPitch - initial.lookPitch) * fraction };
    return { tick, epoch: 0, sprint: tick > 0 && tick <= travelTicks, view: sample };
  });
  const receiptTicks = fps === 30
    ? Array.from({ length: Math.floor(stopTick / 2) + 1 }, (_, index) => index * 2)
    : Array.from({ length: stopTick + 1 }, (_, tick) => tick);
  const renderReceipts = receiptTicks.map((tick, index) => ({ sequence: index,
    tick, epoch: 0, source: "live" as const, workflowState: "playing" as const,
    documentVisible: true, pointerLocked: true, paused: false }));
  if (fps === 144) {
    // Two or three exact submissions per tick approximate 144/60; C2 coalesces repeated ticks.
    renderReceipts.length = 0;
    for (const tick of receiptTicks) {
      for (let submission = 0; submission < (tick % 5 < 2 ? 3 : 2); submission++) {
        renderReceipts.push({ sequence: renderReceipts.length, tick, epoch: 0,
          source: "live", workflowState: "playing", documentVisible: true, pointerLocked: true, paused: false });
      }
    }
  }
  return { scenarioRef: fixture.ref, scenarioContentHash: compiled.contentHash,
    attemptId: "calibration-attempt", runRevision: 0, traceVersion: 1, visibilityModelVersion: 1,
    cameraRigVersion: 1, eyeCalibrationVersion: 1, observationRubricVersion: 1,
    role: "mainReferee", stopTick, views, renderReceipts,
    breaks: [{ sequence: renderReceipts.length, afterTick: stopTick, nextEpoch: null, reason: "deciding" }] };
}
function context(mode: ViewSample["cameraMode"], aspectRatio = historicalInlineAspectRatio) {
  return { fixture, attemptId: "calibration-attempt", runRevision: 0, role: "mainReferee" as const,
    initialView: runStartView(mode, aspectRatio), fieldBounds: { minX: -34, maxX: 34, minZ: -52.5, maxZ: 52.5 },
    decisionTick: 380, decisionWindow: { fromTick: 360, toTick: 480 },
    eligibleDecidingTransition: true,
    rubric: { scenarioRef: fixture.ref, scenarioContentHash: compiled.contentHash,
      observationRubricVersion: 1 as const, requiredEvidenceIds } };
}

describe("historical inline authored incident C2 calibration evidence", () => {
  it("rejects a submitted tick-zero pose that differs from the authored run start", () => {
    const trace = liveTrace(targets.A, "firstPerson", 60);
    trace.views[0] = { ...trace.views[0]!, view: { ...trace.views[0]!.view,
      refereePosition: { ...trace.views[0]!.view.refereePosition, x: initial.position.x + 0.01 } } };
    expect(() => validateObservationTraceV1(trace, context("firstPerson"))).toThrow(/initial view differs/);
  });
  it("measures every private evidence-window tick at candidate A and B in both modes", () => {
    const rows = classificationRows();
    expect(rows).toHaveLength(8);
    expect([...requiredEvidenceIds].sort()).toEqual([...windows].sort());
    for (const row of rows) {
      const [fromTick, toTick] = row.evidenceId === "EV-TRIP-CONTACT" ? [364, 371] : [360, 374];
      expect(row.ticks.map(([tick]) => tick)).toEqual(Array.from(
        { length: toTick - fromTick + 1 }, (_, offset) => fromTick + offset));
      expect(row.ticks.every(([, classification]) => classification === (row.positionName === "A" ? "joint" : "neither")))
        .toBe(true);
    }
  });
  it.each([30, 60, 144] as const)("validates and summarizes plausible %i fps live traces", (fps) => {
    const expected = { 30: { raw: 191, distinct: 191, area: [8, 14], contact: [4, 6] },
      60: { raw: 381, distinct: 381, area: [15, 14], contact: [8, 7] },
      144: { raw: 915, distinct: 381, area: [15, 14], contact: [8, 7] } }[fps];
    for (const mode of ["firstPerson", "thirdPerson"] as const) {
      const good = liveTrace(targets.A, mode, fps);
      const poor = liveTrace(targets.B, mode, fps);
      expect(good.renderReceipts).toHaveLength(expected.raw);
      expect(poor.renderReceipts).toHaveLength(expected.raw);
      validateObservationTraceV1(good, context(mode));
      validateObservationTraceV1(poor, context(mode));
      const goodSummary = summarizeObservationTraceV1(good, context(mode));
      const poorSummary = summarizeObservationTraceV1(poor, context(mode));
      expect(goodSummary).toMatchObject({ status: "scored", score: 100 });
      expect(poorSummary).toMatchObject({ status: "scored", score: 0 });
      expect(goodSummary.eligibleLiveTicks).toBe(expected.distinct);
      expect(poorSummary.eligibleLiveTicks).toBe(expected.distinct);
      expect(goodSummary.evidence.map((entry) => entry.band)).toEqual(["supported", "supported"]);
      expect(poorSummary.evidence.map((entry) => entry.band)).toEqual(["none", "none"]);
      expect(goodSummary.evidence.map((entry) => [entry.evidenceId,
        entry.strongestChainReceipts, entry.strongestChainSpanTicks])).toEqual([
        ["EV-INSIDE-AREA", ...expected.area], ["EV-TRIP-CONTACT", ...expected.contact],
      ]);
    }
  });
  it("excludes replay receipts from a geometrically joint window", () => {
    const trace = liveTrace(targets.A, "thirdPerson", 60);
    trace.renderReceipts = trace.renderReceipts.map((receipt) => receipt.tick >= 360 && receipt.tick <= 374
      ? { ...receipt, source: "replay" as const, workflowState: "other" as const,
        documentVisible: false, pointerLocked: false, paused: true }
      : receipt);
    validateObservationTraceV1(trace, context("thirdPerson"));
    const summary = summarizeObservationTraceV1(trace, context("thirdPerson"));
    expect(summary).toMatchObject({ status: "scored", score: 0 });
    expect(summary.evidence.map((entry) => [entry.jointTicks, entry.band])).toEqual([[15, "none"], [8, "none"]]);
  });
  it("keeps a camera-only live view out of joint observation credit", () => {
    const trace = liveTrace(targets.A, "thirdPerson", 60);
    trace.views = trace.views.map((record) => {
      const fraction = Math.min(record.tick / 180, 1);
      return { ...record, view: { ...record.view,
        lookYaw: record.view.lookYaw - 0.8 * fraction,
        cameraDistanceM: 2 + 4 * fraction,
        cameraLateralOffsetM: -2.4 * fraction } };
    });
    validateObservationTraceV1(trace, context("thirdPerson"));
    expect(measureEvidenceAtTick(fixture, "EV-TRIP-CONTACT", 366, trace.views[366]!.view).classification)
      .toBe("cameraOnly");
    const summary = summarizeObservationTraceV1(trace, context("thirdPerson"));
    expect(summary).toMatchObject({ status: "scored", score: 0 });
    expect(summary.evidence.find((entry) => entry.evidenceId === "EV-TRIP-CONTACT"))
      .toMatchObject({ band: "none", jointTicks: 0, cameraOnlyTicks: 8 });
  });
});

describe("1280 by 720 fullscreen authored incident calibration evidence", () => {
  it("classifies all 92 C1 evidence samples at A and B in both camera modes", () => {
    const rows = classificationRows(fullscreenAspectRatio);
    expect(rows).toHaveLength(8);
    expect(rows.reduce((sum, row) => sum + row.ticks.length, 0)).toBe(92);
    expect([...requiredEvidenceIds].sort()).toEqual([...windows].sort());
    for (const row of rows) {
      const evidence = fixture.evidence.find((entry) => entry.evidenceId === row.evidenceId)!;
      expect(row.ticks.map(([tick]) => tick)).toEqual(Array.from(
        { length: evidence.toTick - evidence.fromTick + 1 }, (_, offset) => evidence.fromTick + offset));
      expect(row.ticks.map(([, classification]) => classification)).toEqual(
        Array.from({ length: row.ticks.length }, () => row.positionName === "A" ? "joint" : "neither"));
    }
  });

  it.each([30, 60, 144] as const)("validates and scores fullscreen %i fps traces for both modes", (fps) => {
    const expected = { 30: { raw: 191, distinct: 191, area: [8, 14], contact: [4, 6] },
      60: { raw: 381, distinct: 381, area: [15, 14], contact: [8, 7] },
      144: { raw: 915, distinct: 381, area: [15, 14], contact: [8, 7] } }[fps];
    const expectedTicks = fps === 30
      ? Array.from({ length: 191 }, (_, index) => index * 2)
      : fps === 60
        ? Array.from({ length: 381 }, (_, tick) => tick)
        : Array.from({ length: 381 }, (_, tick) =>
          Array.from({ length: tick % 5 < 2 ? 3 : 2 }, () => tick)).flat();
    const expectedReceipts = expectedTicks.map((tick, sequence) => ({ tick, sequence, epoch: 0 }));
    for (const mode of ["firstPerson", "thirdPerson"] as const) {
      const trustedContext = context(mode, fullscreenAspectRatio);
      const good = liveTrace(targets.A, mode, fps, fullscreenAspectRatio);
      const poor = liveTrace(targets.B, mode, fps, fullscreenAspectRatio);
      for (const trace of [good, poor]) {
        expect(trace.renderReceipts).toHaveLength(expected.raw);
        expect(trace.renderReceipts.map(({ tick, sequence, epoch }) => ({ tick, sequence, epoch })))
          .toEqual(expectedReceipts);
        expect(new Set(trace.renderReceipts.map((receipt) => receipt.tick)).size).toBe(expected.distinct);
        expect(trace.breaks).toEqual([{ sequence: expected.raw, afterTick: 380,
          nextEpoch: null, reason: "deciding" }]);
        expect(trace.views).toHaveLength(381);
        expect(trace.views.every((record) => record.view.viewportAspectRatio === fullscreenAspectRatio)).toBe(true);
        validateObservationTraceV1(trace, trustedContext);
      }
      const goodSummary = summarizeObservationTraceV1(good, trustedContext);
      const poorSummary = summarizeObservationTraceV1(poor, trustedContext);
      expect(goodSummary).toMatchObject({ status: "scored", score: 100, eligibleLiveTicks: expected.distinct });
      expect(poorSummary).toMatchObject({ status: "scored", score: 0, eligibleLiveTicks: expected.distinct });
      expect(goodSummary.evidence.map((entry) => [entry.evidenceId, entry.band,
        entry.strongestChainReceipts, entry.strongestChainSpanTicks])).toEqual([
        ["EV-INSIDE-AREA", "supported", ...expected.area],
        ["EV-TRIP-CONTACT", "supported", ...expected.contact],
      ]);
      expect(poorSummary.evidence.map((entry) => [entry.evidenceId, entry.band,
        entry.jointTicks])).toEqual([
        ["EV-INSIDE-AREA", "none", 0], ["EV-TRIP-CONTACT", "none", 0],
      ]);
    }
  });

  it("denies fullscreen A credit when the evidence-window submissions are replay", () => {
    const trace = liveTrace(targets.A, "thirdPerson", 60, fullscreenAspectRatio);
    trace.renderReceipts = trace.renderReceipts.map((receipt) => receipt.tick >= 360 && receipt.tick <= 374
      ? { ...receipt, source: "replay" as const, workflowState: "other" as const,
        documentVisible: false, pointerLocked: false, paused: true }
      : receipt);
    const trustedContext = context("thirdPerson", fullscreenAspectRatio);
    validateObservationTraceV1(trace, trustedContext);
    const summary = summarizeObservationTraceV1(trace, trustedContext);
    expect(summary).toMatchObject({ status: "scored", score: 0 });
    expect(summary.evidence.map((entry) => [entry.jointTicks, entry.band])).toEqual([[15, "none"], [8, "none"]]);
  });

  it("denies fullscreen camera-only trip evidence despite live receipts", () => {
    const trace = liveTrace(targets.A, "thirdPerson", 60, fullscreenAspectRatio);
    trace.views = trace.views.map((record) => {
      const fraction = Math.min(record.tick / 180, 1);
      return { ...record, view: { ...record.view,
        lookYaw: record.view.lookYaw - 0.8 * fraction,
        cameraDistanceM: 2 + 4 * fraction,
        cameraLateralOffsetM: -2.4 * fraction } };
    });
    const trustedContext = context("thirdPerson", fullscreenAspectRatio);
    validateObservationTraceV1(trace, trustedContext);
    expect(measureEvidenceAtTick(fixture, "EV-TRIP-CONTACT", 366, trace.views[366]!.view).classification)
      .toBe("cameraOnly");
    const summary = summarizeObservationTraceV1(trace, trustedContext);
    expect(summary).toMatchObject({ status: "scored", score: 0 });
    expect(summary.evidence.find((entry) => entry.evidenceId === "EV-TRIP-CONTACT"))
      .toMatchObject({ band: "none", jointTicks: 0, cameraOnlyTicks: 8 });
  });
});
