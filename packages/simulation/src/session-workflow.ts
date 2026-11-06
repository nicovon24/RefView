import { assign, setup } from "xstate";
import type { DecisionGate, Discipline, Restart } from "@refview/domain";
import { validateView, type ViewSample } from "./observation-geometry";

export type PublicDecision = Readonly<{ decisionTick: number; stopPlay: boolean; restart: Restart;
  discipline: Discipline; offenderActorHandle: string | null }>;
export type FieldBounds = Readonly<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
export type WorkflowBinding = Readonly<{ attemptId: string; runRevision: number; scenarioContentHash: string;
  durationTicks: number; fieldBounds: FieldBounds; actorHandles: readonly string[];
  entryState: "new" | "activeRecovery" | "finalizedRecovery"; decisionGate: DecisionGate }>;
export type DurableFinalization = Readonly<{ attemptId: string; runRevision: number; decisionId: string;
  evaluationId: string; finalizedAt: string }>;
export type ServerRunStart = Readonly<{ attemptId: string; runRevision: number;
  scenarioContentHash: string; initialView: Readonly<ViewSample> }>;
export type FinalizedRestore = DurableFinalization & Readonly<{ scenarioContentHash: string;
  state: "debrief" | "completed" }>;
export type ActiveRestore = Readonly<{ attemptId: string; previousRunRevision: number; runRevision: number;
  scenarioContentHash: string; previousState: "playing" | "deciding"; state: "ready"; tick: number }>;
export type SessionWorkflowContext = WorkflowBinding & Readonly<{ runStart: ServerRunStart | null;
  decisionTick: number | null; decision: PublicDecision | null; idempotencyKey: string | null;
  durableResult: DurableFinalization | null; error: string | null;
  errorReturn: "loading" | "serverRestore" | "finalizing" | null }>;
export type SessionWorkflowEvent =
  | { type: "LOAD" | "LOADED" | "BRIEFING_DONE" | "PAUSE" | "RESUME" | "FOCUS_LOST"
    | "POINTER_LOST" | "REPLAY" | "BACK_TO_DEBRIEF" | "COMPLETE" | "ABANDON" | "RETRY" }
  | { type: "SERVER_DECIDING_CONFIRMED"; attemptId: string; runRevision: number; tick: number }
  | { type: "SERVER_RUN_STARTED"; result: ServerRunStart }
  | { type: "CONFIRM_DECISION"; decision: PublicDecision; idempotencyKey: string }
  | { type: "SERVER_FINALIZED"; result: DurableFinalization }
  | { type: "SERVER_RESTORED_FINALIZED"; result: FinalizedRestore }
  | ({ type: "SERVER_RESTORED_ACTIVE" } & ActiveRestore)
  | { type: "FAILED"; message: string };

function exact(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}
function nonempty(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function safeTick(value: unknown, min: number, max: number): value is number {
  return Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
}
function validTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}
function validDurable(value: unknown, context: SessionWorkflowContext): value is DurableFinalization {
  return exact(value, ["attemptId", "runRevision", "decisionId", "evaluationId", "finalizedAt"])
    && value.attemptId === context.attemptId && value.runRevision === context.runRevision
    && nonempty(value.decisionId) && nonempty(value.evaluationId) && validTime(value.finalizedAt);
}
function validRunStart(event: SessionWorkflowEvent, context: SessionWorkflowContext): boolean {
  if (event.type !== "SERVER_RUN_STARTED" || !exact(event, ["type", "result"])
    || !exact(event.result, ["attemptId", "runRevision", "scenarioContentHash", "initialView"])
    || event.result.attemptId !== context.attemptId || event.result.runRevision !== context.runRevision
    || event.result.scenarioContentHash !== context.scenarioContentHash) return false;
  const view = event.result.initialView;
  if (!exact(view, ["tick", "refereePosition", "lookYaw", "lookPitch", "cameraMode",
    "cameraDistanceM", "cameraLateralOffsetM", "viewportAspectRatio", "verticalFovRad"])
    || !exact(view.refereePosition, ["x", "y", "z"]) || view.tick !== 0) return false;
  try { validateView(view, context.durationTicks); } catch { return false; }
  const { x, z } = view.refereePosition;
  return x >= context.fieldBounds.minX && x <= context.fieldBounds.maxX
    && z >= context.fieldBounds.minZ && z <= context.fieldBounds.maxZ;
}
function validChoice(event: SessionWorkflowEvent, context: SessionWorkflowContext): boolean {
  if (event.type !== "CONFIRM_DECISION" || !exact(event, ["type", "decision", "idempotencyKey"])
    || !nonempty(event.idempotencyKey) || event.idempotencyKey.length > 128
    || !exact(event.decision, ["decisionTick", "stopPlay", "restart", "discipline", "offenderActorHandle"])) return false;
  const d = event.decision;
  return safeTick(d.decisionTick, context.decisionGate.opensAtTick, context.decisionGate.closesAtTick)
    && d.decisionTick === context.decisionTick && d.decisionTick <= context.durationTicks
    && typeof d.stopPlay === "boolean"
    && ["playOn", "penaltyKick", "directFreeKick", "indirectFreeKick", "droppedBall"].includes(d.restart)
    && ["none", "yellow", "red"].includes(d.discipline)
    && d.stopPlay === (d.restart !== "playOn")
    && (d.offenderActorHandle === null || context.actorHandles.includes(d.offenderActorHandle))
    && (d.discipline === "none" || d.offenderActorHandle !== null);
}
function validActive(event: SessionWorkflowEvent, context: SessionWorkflowContext): boolean {
  return event.type === "SERVER_RESTORED_ACTIVE"
    && exact(event, ["type", "attemptId", "previousRunRevision", "runRevision", "scenarioContentHash", "previousState", "state", "tick"])
    && context.durableResult === null && event.attemptId === context.attemptId
    && event.previousRunRevision === context.runRevision && Number.isSafeInteger(event.runRevision)
    && event.runRevision === context.runRevision + 1 && event.scenarioContentHash === context.scenarioContentHash
    && (event.previousState === "playing" || event.previousState === "deciding")
    && event.state === "ready" && event.tick === 0;
}
function validFinalizedRestore(event: SessionWorkflowEvent, context: SessionWorkflowContext): boolean {
  if (event.type !== "SERVER_RESTORED_FINALIZED" || !exact(event, ["type", "result"])
    || !exact(event.result, ["attemptId", "runRevision", "decisionId", "evaluationId", "finalizedAt", "scenarioContentHash", "state"])) return false;
  const { scenarioContentHash, state, ...durable } = event.result;
  return scenarioContentHash === context.scenarioContentHash
    && (state === "debrief" || state === "completed") && validDurable(durable, context);
}
function copyRunStart(result: ServerRunStart): ServerRunStart {
  return Object.freeze({ attemptId: result.attemptId, runRevision: result.runRevision,
    scenarioContentHash: result.scenarioContentHash,
    initialView: Object.freeze({ ...result.initialView,
      refereePosition: Object.freeze({ ...result.initialView.refereePosition }) }) });
}
function copyDurable(result: DurableFinalization): DurableFinalization { return Object.freeze({ ...result }); }

/** Presentation routing only; server operations establish ownership and authoritative facts. */
export function createSessionWorkflow(initial: WorkflowBinding) {
  if (!exact(initial, ["attemptId", "runRevision", "scenarioContentHash", "durationTicks", "fieldBounds", "actorHandles", "entryState", "decisionGate"])
    || !nonempty(initial.attemptId) || !/^sha256:[0-9a-f]{64}$/.test(initial.scenarioContentHash)
    || !safeTick(initial.runRevision, 0, Number.MAX_SAFE_INTEGER)
    || !safeTick(initial.durationTicks, 0, 480)
    || !["new", "activeRecovery", "finalizedRecovery"].includes(initial.entryState))
    throw new TypeError("invalid workflow identity");
  const bounds = initial.fieldBounds;
  if (!exact(bounds, ["minX", "maxX", "minZ", "maxZ"])
    || ![bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ].every(Number.isFinite)
    || bounds.minX > bounds.maxX || bounds.minZ > bounds.maxZ) throw new TypeError("invalid field bounds");
  const gate = initial.decisionGate;
  if (!exact(gate, ["opensAtTick", "closesAtTick", "forcePauseAtTick"])
    || !safeTick(gate.opensAtTick, 0, initial.durationTicks)
    || !safeTick(gate.closesAtTick, gate.opensAtTick, initial.durationTicks)
    || !safeTick(gate.forcePauseAtTick, gate.closesAtTick, initial.durationTicks))
    throw new TypeError("invalid decision gate");
  if (!Array.isArray(initial.actorHandles) || initial.actorHandles.length === 0
    || new Set(initial.actorHandles).size !== initial.actorHandles.length
    || !initial.actorHandles.every((handle) => typeof handle === "string" && /^actor-[0-9]{3}$/.test(handle)))
    throw new TypeError("invalid actor handles");
  const binding = Object.freeze({ attemptId: initial.attemptId, runRevision: initial.runRevision,
    scenarioContentHash: initial.scenarioContentHash, durationTicks: initial.durationTicks,
    fieldBounds: Object.freeze({ ...bounds }), actorHandles: Object.freeze([...initial.actorHandles]),
    entryState: initial.entryState, decisionGate: Object.freeze({ ...gate }) });
  return setup({
    types: {} as { context: SessionWorkflowContext; events: SessionWorkflowEvent },
    guards: {
      newEntry: ({ context }) => context.entryState === "new",
      boundRunStart: ({ context, event }) => validRunStart(event, context),
      boundDecisionGate: ({ context, event }) => event.type === "SERVER_DECIDING_CONFIRMED"
        && exact(event, ["type", "attemptId", "runRevision", "tick"])
        && event.attemptId === context.attemptId && event.runRevision === context.runRevision
        && safeTick(event.tick, context.decisionGate.opensAtTick, context.decisionGate.closesAtTick)
        && event.tick <= context.decisionGate.forcePauseAtTick && event.tick <= context.durationTicks,
      validDecision: ({ context, event }) => validChoice(event, context),
      boundDurableResult: ({ context, event }) => event.type === "SERVER_FINALIZED"
        && exact(event, ["type", "result"]) && validDurable(event.result, context),
      boundActiveRestore: ({ context, event }) => validActive(event, context),
      retryLoading: ({ context }) => context.errorReturn === "loading",
      retryFinalizing: ({ context }) => context.errorReturn === "finalizing",
    },
    actions: {
      freezeContext: ({ context }) => { Object.freeze(context); },
      recordRunStart: assign({ runStart: ({ event }) => event.type === "SERVER_RUN_STARTED" ? copyRunStart(event.result) : null }),
      recordDecisionTick: assign({ decisionTick: ({ event }) => event.type === "SERVER_DECIDING_CONFIRMED" ? event.tick : null }),
      recordDecision: assign({ decision: ({ event }) => event.type === "CONFIRM_DECISION" ? Object.freeze({ ...event.decision }) : null,
        idempotencyKey: ({ event }) => event.type === "CONFIRM_DECISION" ? event.idempotencyKey : null }),
      recordDurableResult: assign({ durableResult: ({ event }) => event.type === "SERVER_FINALIZED" ? copyDurable(event.result) : null }),
      recordRestoredResult: assign({ durableResult: ({ event }) => event.type === "SERVER_RESTORED_FINALIZED"
        ? copyDurable({ attemptId: event.result.attemptId, runRevision: event.result.runRevision,
          decisionId: event.result.decisionId, evaluationId: event.result.evaluationId,
          finalizedAt: event.result.finalizedAt }) : null }),
      restoreActive: assign({ runRevision: ({ event }) => event.type === "SERVER_RESTORED_ACTIVE" ? event.runRevision : binding.runRevision,
        runStart: null, decisionTick: null, decision: null, idempotencyKey: null, durableResult: null,
        error: null, errorReturn: null }),
      errorFromLoading: assign({ error: ({ event }) => event.type === "FAILED" ? event.message : null,
        errorReturn: "loading" as const }),
      errorFromPlaying: assign({ error: ({ event }) => event.type === "FAILED" ? event.message : null,
        errorReturn: "serverRestore" as const }),
      errorFromFinalizing: assign({ error: ({ event }) => event.type === "FAILED" ? event.message : null,
        errorReturn: "finalizing" as const }),
      clearError: assign({ error: null, errorReturn: null }),
    },
  }).createMachine({
    id: "sessionWorkflow", initial: "created",
    context: Object.freeze({ ...binding, runStart: null, decisionTick: null, decision: null, idempotencyKey: null,
      durableResult: null, error: null, errorReturn: null }),
    states: {
      created: { on: { LOAD: "loading", ABANDON: "abandoned" } },
      loading: { on: {
        LOADED: { target: "briefing", guard: "newEntry" },
        SERVER_RESTORED_ACTIVE: { target: "ready", guard: ({ context, event }) => context.entryState === "activeRecovery" && validActive(event, context), actions: ["restoreActive", "freezeContext"] },
        SERVER_RESTORED_FINALIZED: [
          { target: "debrief", guard: ({ context, event }) => context.entryState === "finalizedRecovery" && validFinalizedRestore(event, context) && event.result.state === "debrief", actions: ["recordRestoredResult", "freezeContext"] },
          { target: "completed", guard: ({ context, event }) => context.entryState === "finalizedRecovery" && validFinalizedRestore(event, context) && event.result.state === "completed", actions: ["recordRestoredResult", "freezeContext"] },
        ],
        FAILED: { target: "recoverableError", actions: ["errorFromLoading", "freezeContext"] }, ABANDON: "abandoned",
      } },
      briefing: { on: { BRIEFING_DONE: "ready", ABANDON: "abandoned" } },
      ready: { on: { SERVER_RUN_STARTED: { target: "playing", guard: "boundRunStart", actions: ["recordRunStart", "freezeContext"] }, ABANDON: "abandoned" } },
      playing: { on: { PAUSE: "paused", FOCUS_LOST: "paused", POINTER_LOST: "paused",
        SERVER_DECIDING_CONFIRMED: { target: "deciding", guard: "boundDecisionGate", actions: ["recordDecisionTick", "freezeContext"] },
        SERVER_RESTORED_ACTIVE: { target: "ready", guard: "boundActiveRestore", actions: ["restoreActive", "freezeContext"] },
        FAILED: { target: "recoverableError", actions: ["errorFromPlaying", "freezeContext"] } } },
      paused: { on: { RESUME: "playing", ABANDON: "abandoned",
        SERVER_RESTORED_ACTIVE: { target: "ready", guard: "boundActiveRestore", actions: ["restoreActive", "freezeContext"] } } },
      deciding: { on: { CONFIRM_DECISION: { target: "finalizing", guard: "validDecision", actions: ["recordDecision", "freezeContext"] },
        SERVER_RESTORED_ACTIVE: { target: "ready", guard: "boundActiveRestore", actions: ["restoreActive", "freezeContext"] } } },
      finalizing: { on: { SERVER_FINALIZED: { target: "debrief", guard: "boundDurableResult", actions: ["recordDurableResult", "freezeContext"] },
        FAILED: { target: "recoverableError", actions: ["errorFromFinalizing", "freezeContext"] } } },
      debrief: { on: { REPLAY: "replay", COMPLETE: "completed" } },
      replay: { on: { BACK_TO_DEBRIEF: "debrief", COMPLETE: "completed" } },
      recoverableError: { on: { RETRY: [
        { target: "loading", guard: "retryLoading", actions: ["clearError", "freezeContext"] },
        { target: "finalizing", guard: "retryFinalizing", actions: ["clearError", "freezeContext"] },
      ], SERVER_RESTORED_ACTIVE: { target: "ready", guard: ({ context, event }) => context.errorReturn === "serverRestore" && validActive(event, context), actions: ["restoreActive", "freezeContext"] } } },
      completed: { type: "final" }, abandoned: { type: "final" },
    },
  });
}
