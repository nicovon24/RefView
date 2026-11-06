import { reconstructViewpoints, type ObservationFixture, type ViewSample } from "./observation-geometry";

export type ObservationTraceV1 = {
  scenarioRef: { scenarioId: string; version: number };
  scenarioContentHash: string;
  attemptId: string;
  runRevision: number;
  traceVersion: number;
  visibilityModelVersion: number;
  cameraRigVersion: number;
  eyeCalibrationVersion: number;
  observationRubricVersion: number;
  role: "mainReferee";
  stopTick: number;
  views: Array<{ tick: number; epoch: number; sprint: boolean; view: ViewSample }>;
  renderReceipts: Array<{ sequence: number; tick: number; epoch: number; source: "live" | "replay";
    workflowState: "playing" | "other"; documentVisible: boolean; pointerLocked: boolean; paused: boolean }>;
  breaks: Array<{ sequence: number; afterTick: number; nextEpoch: number | null;
    reason: "pause" | "hidden" | "pointerReleased" | "performancePause" | "viewportChanged" | "cameraChanged" | "deciding" }>;
};

export type TrustedTraceContextV1 = {
  fixture: ObservationFixture;
  attemptId: string;
  runRevision: number;
  role: "mainReferee";
  initialView: ViewSample;
  fieldBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  decisionTick: number;
  decisionWindow: { fromTick: number; toTick: number };
  eligibleDecidingTransition: boolean;
};

function integer(value: number, minimum: number, maximum: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be an integer in ${minimum}..${maximum}`);
  }
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`);
}

function fail(message: string): never { throw new Error(message); }

function exactObject(value: unknown, keys: readonly string[], label: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value) as object | null)) {
    fail(`${label} must be a plain object`);
  }
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some((key) => typeof key !== "string" || !keys.includes(key))) {
    fail(`${label} has missing or undeclared fields`);
  }
}

function exactArray(value: unknown, maximum: number, label: string): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length > maximum) fail(`${label} must be a bounded array`);
}

function validateShape(trace: ObservationTraceV1): void {
  exactObject(trace, ["scenarioRef", "scenarioContentHash", "attemptId", "runRevision", "traceVersion",
    "visibilityModelVersion", "cameraRigVersion", "eyeCalibrationVersion", "observationRubricVersion",
    "role", "stopTick", "views", "renderReceipts", "breaks"], "trace");
  exactObject(trace.scenarioRef, ["scenarioId", "version"], "scenarioRef");
  exactArray(trace.views, 481, "views");
  for (const record of trace.views) {
    exactObject(record, ["tick", "epoch", "sprint", "view"], "view record");
    exactObject(record.view, ["tick", "refereePosition", "lookYaw", "lookPitch", "cameraMode",
      "cameraDistanceM", "cameraLateralOffsetM", "viewportAspectRatio", "verticalFovRad"], "view sample");
    exactObject(record.view.refereePosition, ["x", "y", "z"], "referee position");
  }
  exactArray(trace.renderReceipts, 1024, "renderReceipts");
  for (const receipt of trace.renderReceipts) {
    exactObject(receipt, ["sequence", "tick", "epoch", "source", "workflowState", "documentVisible",
      "pointerLocked", "paused"], "render receipt");
  }
  exactArray(trace.breaks, 64, "breaks");
  for (const segmentBreak of trace.breaks) {
    exactObject(segmentBreak, ["sequence", "afterTick", "nextEpoch", "reason"], "trace break");
  }
}

function sameView(a: ViewSample, b: ViewSample): boolean {
  return a.tick === b.tick && a.refereePosition.x === b.refereePosition.x
    && a.refereePosition.y === b.refereePosition.y && a.refereePosition.z === b.refereePosition.z
    && a.lookYaw === b.lookYaw && a.lookPitch === b.lookPitch && a.cameraMode === b.cameraMode
    && a.cameraDistanceM === b.cameraDistanceM && a.cameraLateralOffsetM === b.cameraLateralOffsetM
    && a.viewportAspectRatio === b.viewportAspectRatio && a.verticalFovRad === b.verticalFovRad;
}

function yawDifference(a: number, b: number): number {
  const turn = Math.PI * 2;
  const wrapped = ((a - b) % turn + turn) % turn;
  return Math.min(wrapped, turn - wrapped);
}

export function validateObservationTraceV1(trace: ObservationTraceV1, context: TrustedTraceContextV1): void {
  validateShape(trace);
  const { fixture } = context;
  if (trace.scenarioRef.scenarioId !== fixture.ref.scenarioId || trace.scenarioRef.version !== fixture.ref.version
    || trace.scenarioContentHash !== fixture.scenarioContentHash || trace.attemptId !== context.attemptId
    || trace.runRevision !== context.runRevision || trace.role !== context.role || trace.role !== "mainReferee") {
    fail("trace identity does not match trusted run");
  }
  integer(context.runRevision, 0, Number.MAX_SAFE_INTEGER, "trusted run revision");
  for (const key of ["traceVersion", "visibilityModelVersion", "cameraRigVersion", "eyeCalibrationVersion", "observationRubricVersion"] as const) {
    if (trace[key] !== 1) fail(`unsupported ${key}`);
  }
  if (trace.visibilityModelVersion !== fixture.visibilityModelVersion
    || trace.cameraRigVersion !== fixture.cameraRigVersion || trace.eyeCalibrationVersion !== fixture.eyeCalibrationVersion) {
    fail("observation fixture version mismatch");
  }
  integer(trace.stopTick, 0, Math.min(480, fixture.durationTicks), "stopTick");
  integer(context.decisionTick, 0, fixture.durationTicks, "decisionTick");
  integer(context.decisionWindow.fromTick, 0, fixture.durationTicks, "decision window start");
  integer(context.decisionWindow.toTick, context.decisionWindow.fromTick, fixture.durationTicks, "decision window end");
  if (trace.stopTick !== context.decisionTick || trace.stopTick < context.decisionWindow.fromTick
    || trace.stopTick > context.decisionWindow.toTick || context.eligibleDecidingTransition !== true) {
    fail("stopTick is not an eligible deciding transition");
  }
  const bounds = context.fieldBounds;
  for (const [name, value] of Object.entries(bounds)) finite(value, name);
  if (bounds.minX > bounds.maxX || bounds.minZ > bounds.maxZ) fail("invalid field bounds");
  if (trace.views.length !== trace.stopTick + 1 || trace.views.length > 481) fail("incomplete view ticks");

  for (let tick = 0; tick <= trace.stopTick; tick++) {
    const record = trace.views[tick]!;
    if (record.tick !== tick || record.view.tick !== tick) fail("view ticks must be complete and ordered");
    integer(record.epoch, 0, 64, "view epoch");
    if (typeof record.sprint !== "boolean") fail("invalid sprint flag");
    reconstructViewpoints(fixture, record.view); // C1 validates finite pose and framing.
    const position = record.view.refereePosition;
    if (position.x < bounds.minX || position.x > bounds.maxX || position.z < bounds.minZ || position.z > bounds.maxZ) {
      fail("referee outside field bounds");
    }
    if (tick === 0) {
      if (record.epoch !== 0 || !sameView(record.view, context.initialView)) fail("initial view differs from run start");
      continue;
    }
    const prior = trace.views[tick - 1]!;
    if (record.epoch < prior.epoch || record.epoch > prior.epoch + 1) fail("invalid epoch progression");
    const movement = Math.hypot(position.x - prior.view.refereePosition.x, position.z - prior.view.refereePosition.z);
    if (movement > (record.sprint ? 9 : 5) / 60 + 1e-6) fail("implausible referee movement");
    if (record.epoch !== prior.epoch) continue;
    if (record.view.cameraMode !== prior.view.cameraMode) fail("camera mode changed within epoch");
    if (yawDifference(record.view.lookYaw, prior.view.lookYaw) > 12 / 60 + 1e-9
      || Math.abs(record.view.lookPitch - prior.view.lookPitch) > 6 / 60 + 1e-9) fail("look rate exceeded");
    if (Math.abs(record.view.cameraDistanceM - prior.view.cameraDistanceM) > 12 / 60 + 1e-9
      || Math.abs(record.view.cameraLateralOffsetM - prior.view.cameraLateralOffsetM) > 12 / 60 + 1e-9) fail("framing rate exceeded");
    if (record.view.verticalFovRad !== prior.view.verticalFovRad
      || record.view.viewportAspectRatio !== prior.view.viewportAspectRatio) fail("FOV or viewport changed within epoch");
  }

  if (trace.renderReceipts.length > 1024 || trace.breaks.length > 64) fail("trace event bound exceeded");
  const events: Array<{ sequence: number; type: "receipt" | "break"; index: number }> = [];
  for (const [type, records] of [["receipt", trace.renderReceipts], ["break", trace.breaks]] as const) {
    let priorSequence = -1;
    records.forEach((record, index) => {
      integer(record.sequence, 0, Number.MAX_SAFE_INTEGER, "event sequence");
      if (record.sequence <= priorSequence) fail(`${type} sequences must increase`);
      priorSequence = record.sequence;
      events.push({ sequence: record.sequence, type, index });
    });
  }
  events.sort((a, b) => a.sequence - b.sequence);
  let currentEpoch = 0;
  let epochStartTick = 0;
  let lastLiveTick = -1;
  let terminal = false;
  let eligibleCount = 0;
  const eligibleTicks = new Set<string>();
  let previousSequence = -1;
  for (const event of events) {
    if (event.sequence === previousSequence) fail("duplicate global event sequence");
    previousSequence = event.sequence;
    if (event.type === "receipt") {
      const receipt = trace.renderReceipts[event.index]!;
      integer(receipt.tick, 0, trace.stopTick, "receipt tick");
      integer(receipt.epoch, 0, 64, "receipt epoch");
      if (receipt.source !== "live" && receipt.source !== "replay") fail("invalid receipt source");
      if (receipt.workflowState !== "playing" && receipt.workflowState !== "other") fail("invalid workflow state");
      if ([receipt.documentVisible, receipt.pointerLocked, receipt.paused].some((flag) => typeof flag !== "boolean")) fail("invalid receipt flags");
      if (trace.views[receipt.tick]!.epoch !== receipt.epoch) fail("receipt epoch differs from its view");
      if (receipt.source === "replay") continue;
      if (terminal || receipt.epoch !== currentEpoch || receipt.tick < epochStartTick
        || trace.views[receipt.tick]!.epoch !== currentEpoch || receipt.tick < lastLiveTick) fail("live receipt outside active segment");
      if (receipt.workflowState !== "playing" || !receipt.documentVisible || !receipt.pointerLocked || receipt.paused) {
        fail("inactive live receipt");
      }
      lastLiveTick = receipt.tick;
      const key = `${receipt.epoch}:${receipt.tick}`;
      if (!eligibleTicks.has(key)) { eligibleTicks.add(key); eligibleCount++; }
      if (eligibleCount > 481) fail("eligible receipt bound exceeded");
      continue;
    }
    const segmentBreak = trace.breaks[event.index]!;
    integer(segmentBreak.afterTick, epochStartTick, trace.stopTick, "break afterTick");
    if (terminal || trace.views[segmentBreak.afterTick]!.epoch !== currentEpoch) fail("break outside active segment");
    if (segmentBreak.reason === "deciding") {
      if (segmentBreak.afterTick !== trace.stopTick || segmentBreak.nextEpoch !== null) fail("invalid deciding break");
      terminal = true;
      continue;
    }
    if (!["pause", "hidden", "pointerReleased", "performancePause", "viewportChanged", "cameraChanged"].includes(segmentBreak.reason)) {
      fail("invalid break reason");
    }
    if (segmentBreak.nextEpoch !== currentEpoch + 1 || segmentBreak.afterTick >= trace.stopTick
      || trace.views[segmentBreak.afterTick + 1]!.epoch !== segmentBreak.nextEpoch) fail("invalid epoch successor");
    currentEpoch = segmentBreak.nextEpoch;
    epochStartTick = segmentBreak.afterTick + 1;
    lastLiveTick = -1;
  }
  if (!terminal || trace.breaks.at(-1)?.reason !== "deciding") fail("missing terminal deciding break");
  if (currentEpoch !== trace.views[trace.stopTick]!.epoch) fail("missing epoch break");
}
