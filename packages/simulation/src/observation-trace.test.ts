import { describe, expect, it } from "vitest";
import { createTimelineFixture } from "@refview/domain";
import { createObservationFixture, type ViewSample } from "./observation-geometry";
import { validateObservationTraceV1, type ObservationTraceV1, type TrustedTraceContextV1 } from "./observation-trace";

const hash = `sha256:${"a".repeat(64)}`;
const durationTicks = 6;
const timeline = createTimelineFixture({
  ref: { scenarioId: "case", version: 1 }, durationTicks,
  samples: Array.from({ length: durationTicks + 1 }, (_, tick) => ({ tick, actors: [],
    ball: { position: { x: 0, y: 0, z: 0 }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })), events: [],
});
const fixture = createObservationFixture({ ref: { scenarioId: "case", version: 1 }, scenarioContentHash: hash,
  durationTicks, visibilityModelVersion: 1, cameraRigVersion: 1, eyeCalibrationVersion: 1,
  cameraColliders: [], evidence: [] }, timeline, hash);
const view = (tick: number, overrides: Partial<ViewSample> = {}): ViewSample => ({
  tick, refereePosition: { x: 0, y: 0, z: 0 }, lookYaw: 0, lookPitch: 0,
  cameraMode: "thirdPerson", cameraDistanceM: 4, cameraLateralOffsetM: 0,
  viewportAspectRatio: 1.6, verticalFovRad: 1, ...overrides,
});
const context = (overrides: Partial<TrustedTraceContextV1> = {}): TrustedTraceContextV1 => ({
  fixture, attemptId: "attempt-1", runRevision: 2, role: "mainReferee", initialView: view(0),
  fieldBounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
  decisionTick: 2, decisionWindow: { fromTick: 1, toTick: 5 }, eligibleDecidingTransition: true,
  ...overrides,
});
const trace = (overrides: Partial<ObservationTraceV1> = {}): ObservationTraceV1 => ({
  scenarioRef: { scenarioId: "case", version: 1 }, scenarioContentHash: hash,
  attemptId: "attempt-1", runRevision: 2, traceVersion: 1, visibilityModelVersion: 1,
  cameraRigVersion: 1, eyeCalibrationVersion: 1, observationRubricVersion: 1,
  role: "mainReferee", stopTick: 2,
  views: [0, 1, 2].map((tick) => ({ tick, epoch: 0, sprint: false, view: view(tick) })),
  renderReceipts: [0, 1, 2].map((tick) => ({ sequence: tick + 1, tick, epoch: 0, source: "live" as const,
    workflowState: "playing" as const, documentVisible: true, pointerLocked: true, paused: false })),
  breaks: [{ sequence: 4, afterTick: 2, nextEpoch: null, reason: "deciding" }], ...overrides,
});
const accepts = (candidate: ObservationTraceV1, trusted = context()) =>
  expect(() => validateObservationTraceV1(candidate, trusted)).not.toThrow();
const rejects = (candidate: ObservationTraceV1, trusted = context()) =>
  expect(() => validateObservationTraceV1(candidate, trusted)).toThrow();

describe("C2-A observation trace validation", () => {
  it("accepts a bounded complete live trace and replay diagnostics without replay credit", () => {
    accepts(trace());
    accepts(trace({ renderReceipts: [...trace().renderReceipts, { sequence: 4, tick: 1, epoch: 0,
      source: "replay", workflowState: "other", documentVisible: false, pointerLocked: false, paused: true }],
      breaks: [{ sequence: 5, afterTick: 2, nextEpoch: null, reason: "deciding" }] }));
    rejects(trace({ renderReceipts: [...trace().renderReceipts, { sequence: 4, tick: 1, epoch: 1,
      source: "replay", workflowState: "other", documentVisible: false, pointerLocked: false, paused: true }],
      breaks: [{ sequence: 5, afterTick: 2, nextEpoch: null, reason: "deciding" }] }));
  });
  it("rejects wrong identity, versions, role, and stale run revision", () => {
    rejects(trace({ attemptId: "other" }));
    rejects(trace({ scenarioRef: { scenarioId: "other", version: 1 } }));
    rejects(trace({ scenarioContentHash: `sha256:${"b".repeat(64)}` }));
    rejects(trace({ runRevision: 1 }));
    rejects(trace({ traceVersion: 2 }));
    rejects(trace({ observationRubricVersion: 2 }));
    rejects(trace({ role: "assistantReferee" as "mainReferee" }));
  });
  it("binds stop tick to decision, window, fixture, and deciding transition", () => {
    rejects(trace({ stopTick: 1, views: trace().views.slice(0, 2), breaks: [{ sequence: 4, afterTick: 1, nextEpoch: null, reason: "deciding" }] }));
    rejects(trace(), context({ decisionWindow: { fromTick: 3, toTick: 5 } }));
    rejects(trace(), context({ eligibleDecidingTransition: false }));
    rejects(trace({ stopTick: 7 }));
  });
  it("rejects missing, duplicate, reversed, or mismatched views", () => {
    rejects(trace({ views: trace().views.slice(0, 2) }));
    rejects(trace({ views: [trace().views[0]!, trace().views[1]!, trace().views[1]!] }));
    rejects(trace({ views: [trace().views[1]!, trace().views[0]!, trace().views[2]!] }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v, view: view(2) } : v) }));
  });
  it("checks initial run view, C1 bounds, field, and per-tick displacement", () => {
    rejects(trace({ views: trace().views.map((v, i) => i === 0 ? { ...v, view: view(0, { lookYaw: 0.1 }) } : v) }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v, view: view(1, { cameraDistanceM: 9 }) } : v) }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v, view: view(1, { refereePosition: { x: 11, y: 0, z: 0 } }) } : v) }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v, view: view(1, { refereePosition: { x: 0.2, y: 0, z: 0 } }) } : v) }));
    accepts(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v, sprint: true,
      view: view(1, { refereePosition: { x: 0.15, y: 0, z: 0 } }) } : i === 2 ? { ...v,
      view: view(2, { refereePosition: { x: 0.15, y: 0, z: 0 } }) } : v) }));
  });
  it("uses shortest wrapped yaw and limits same-epoch look/framing rates", () => {
    const wrapped = trace({ views: [
      { tick: 0, epoch: 0, sprint: false, view: view(0, { lookYaw: Math.PI - 0.05 }) },
      { tick: 1, epoch: 0, sprint: false, view: view(1, { lookYaw: -Math.PI + 0.05 }) },
      { tick: 2, epoch: 0, sprint: false, view: view(2, { lookYaw: -Math.PI + 0.05 }) },
    ] });
    accepts(wrapped, context({ initialView: view(0, { lookYaw: Math.PI - 0.05 }) }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v, view: view(1, { lookYaw: 0.3 }) } : v) }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v, view: view(1, { lookPitch: 0.2 }) } : v) }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v, view: view(1, { cameraDistanceM: 4.3 }) } : v) }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v, view: view(1, { verticalFovRad: 1.1 }) } : v) }));
  });
  it("orders breaks and receipts globally and excludes old-epoch same-tick receipts", () => {
    const split = trace({ views: [trace().views[0]!, { ...trace().views[1]!, epoch: 1 }, { ...trace().views[2]!, epoch: 1 }],
      renderReceipts: [{ ...trace().renderReceipts[0]!, sequence: 1 },
        { ...trace().renderReceipts[1]!, sequence: 3, epoch: 1 }],
      breaks: [{ sequence: 2, afterTick: 0, nextEpoch: 1, reason: "pause" },
        { sequence: 4, afterTick: 2, nextEpoch: null, reason: "deciding" }] });
    accepts(split);
    rejects({ ...split, renderReceipts: [...split.renderReceipts, { ...split.renderReceipts[0]!, sequence: 3, tick: 0 }] });
    rejects({ ...split, renderReceipts: [...split.renderReceipts, { ...split.renderReceipts[0]!, sequence: 5, tick: 0 }] });
    rejects({ ...split, breaks: [{ ...split.breaks[0]!, sequence: 3 }, split.breaks[1]!] });
  });
  it("rejects inactive live receipts and malformed terminal breaks", () => {
    rejects(trace({ renderReceipts: trace().renderReceipts.map((r, i) => i === 1 ? { ...r, paused: true } : r) }));
    rejects(trace({ renderReceipts: trace().renderReceipts.map((r, i) => i === 1 ? { ...r, pointerLocked: false } : r) }));
    rejects(trace({ renderReceipts: trace().renderReceipts.map((r, i) => i === 1 ? { ...r, documentVisible: false } : r) }));
    rejects(trace({ renderReceipts: trace().renderReceipts.map((r, i) => i === 1 ? { ...r, workflowState: "other" as const } : r) }));
    rejects(trace({ breaks: [{ sequence: 4, afterTick: 2, nextEpoch: null, reason: "pause" }] }));
    rejects(trace({ breaks: [{ sequence: 4, afterTick: 2, nextEpoch: 1, reason: "deciding" }] }));
    rejects(trace({ breaks: [] }));
  });
  it("rejects undeclared client fields at every trace layer", () => {
    rejects({ ...trace(), score: 100 } as ObservationTraceV1);
    rejects(trace({ scenarioRef: { ...trace().scenarioRef, evidenceIds: ["private"] } as ObservationTraceV1["scenarioRef"] }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v, score: 100 } : v) }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v,
      view: { ...v.view, cameraWorldPosition: { x: 0, y: 2, z: 0 } } } : v) }));
    rejects(trace({ views: trace().views.map((v, i) => i === 1 ? { ...v,
      view: { ...v.view, refereePosition: { ...v.view.refereePosition, hiddenEvidenceId: "private" } } } : v) }));
    rejects(trace({ renderReceipts: trace().renderReceipts.map((r, i) => i === 1 ? { ...r, score: 100 } : r) }));
    const injectedBreak = { ...trace().breaks[0]!, evidenceIds: ["private"] };
    rejects(trace({ breaks: [injectedBreak] }));
  });
  it("enforces raw resource bounds and coalescible valid live receipts", () => {
    const repeated = trace({ renderReceipts: [
      { ...trace().renderReceipts[0]!, sequence: 1 },
      { ...trace().renderReceipts[0]!, sequence: 2 },
      { ...trace().renderReceipts[1]!, sequence: 3 },
      { ...trace().renderReceipts[2]!, sequence: 4 },
    ], breaks: [{ sequence: 5, afterTick: 2, nextEpoch: null, reason: "deciding" }] });
    accepts(repeated);
    rejects(trace({ renderReceipts: Array.from({ length: 1025 }, (_, i) => ({
      ...trace().renderReceipts[0]!, sequence: i + 1,
    })) }));
    rejects(trace({ breaks: Array.from({ length: 65 }, (_, i) => ({
      sequence: i + 4, afterTick: 2, nextEpoch: null, reason: "deciding" as const,
    })) }));
    rejects(trace({ renderReceipts: [...trace().renderReceipts,
      { ...trace().renderReceipts[2]!, sequence: 5 }],
      breaks: [{ sequence: 4, afterTick: 2, nextEpoch: null, reason: "deciding" }] }));
  });
});
