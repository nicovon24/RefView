import { createActor } from "xstate";
import { describe, expect, it } from "vitest";
import { createSessionWorkflow } from "./session-workflow";

const gate = { opensAtTick: 2, closesAtTick: 5, forcePauseAtTick: 5 };
const decision = { decisionTick: 3, stopPlay: true, restart: "penaltyKick" as const,
  discipline: "none" as const, offenderActorHandle: null };
const key = "opaque-key";
const durable = { attemptId: "attempt-1", runRevision: 0, decisionId: "decision-1",
  evaluationId: "evaluation-1", finalizedAt: "2026-11-03T12:00:00.000Z" };
const pinnedHash = `sha256:${"a".repeat(64)}`;
const binding = { attemptId: "attempt-1", runRevision: 0, scenarioContentHash: pinnedHash,
  durationTicks: 10, fieldBounds: { minX: -50, maxX: 50, minZ: -60, maxZ: 60 },
  actorHandles: ["actor-001", "actor-002"], entryState: "new" as const, decisionGate: gate };
const runStart = { attemptId: "attempt-1", runRevision: 0,
  scenarioContentHash: pinnedHash, initialView: { tick: 0,
    refereePosition: { x: 1, y: 0, z: 2 }, lookYaw: 0, lookPitch: 0,
    cameraMode: "thirdPerson", cameraDistanceM: 5, cameraLateralOffsetM: 0,
    viewportAspectRatio: 16 / 9, verticalFovRad: 1 } } as const;

function actor() {
  const service = createActor(createSessionWorkflow(binding)).start();
  service.send({ type: "LOAD" });
  service.send({ type: "LOADED" });
  service.send({ type: "BRIEFING_DONE" });
  return service;
}

function playing() {
  const service = actor();
  service.send({ type: "SERVER_RUN_STARTED", result: runStart });
  return service;
}

function deciding() {
  const service = playing();
  service.send({ type: "SERVER_DECIDING_CONFIRMED", attemptId: "attempt-1", runRevision: 0, tick: 3 });
  return service;
}

describe("session workflow", () => {
  it("moves through briefing, pause, decision, durable debrief, replay, and completion", () => {
    const service = actor();
    expect(service.getSnapshot().value).toBe("ready");
    service.send({ type: "SERVER_RUN_STARTED", result: runStart });
    service.send({ type: "FOCUS_LOST" });
    expect(service.getSnapshot().value).toBe("paused");
    service.send({ type: "RESUME" });
    expect(service.getSnapshot().value).toBe("playing");
    service.send({ type: "SERVER_DECIDING_CONFIRMED", attemptId: "attempt-1", runRevision: 0, tick: 3 });
    expect(service.getSnapshot().value).toBe("deciding");
    service.send({ type: "CONFIRM_DECISION", decision, idempotencyKey: key });
    expect(service.getSnapshot().value).toBe("finalizing");
    service.send({ type: "SERVER_FINALIZED", result: durable });
    expect(service.getSnapshot().value).toBe("debrief");
    service.send({ type: "REPLAY" });
    expect(service.getSnapshot().value).toBe("replay");
    service.send({ type: "BACK_TO_DEBRIEF" });
    service.send({ type: "COMPLETE" });
    expect(service.getSnapshot().value).toBe("completed");
  });

  it("guards decision gate, binding, and debrief authority", () => {
    const service = playing();
    service.send({ type: "REPLAY" });
    service.send({ type: "SERVER_DECIDING_CONFIRMED", attemptId: "wrong", runRevision: 0, tick: 3 });
    service.send({ type: "SERVER_DECIDING_CONFIRMED", attemptId: "attempt-1", runRevision: 0, tick: 1 });
    expect(service.getSnapshot().value).toBe("playing");
    service.send({ type: "SERVER_DECIDING_CONFIRMED", attemptId: "attempt-1", runRevision: 0, tick: 3 });
    service.send({ type: "CONFIRM_DECISION", decision: { ...decision, decisionTick: 4 }, idempotencyKey: key });
    expect(service.getSnapshot().value).toBe("deciding");
    service.send({ type: "CONFIRM_DECISION", decision, idempotencyKey: key });
    service.send({ type: "SERVER_FINALIZED", result: { ...durable, runRevision: 1 } });
    expect(service.getSnapshot().value).toBe("finalizing");
    service.send({ type: "SERVER_FINALIZED", result: durable });
    expect(service.getSnapshot().context.durableResult).toEqual(durable);
  });

  it("does not enter play until the server returns a bound run start", () => {
    const service = actor();
    // @ts-expect-error START is not part of the public workflow event contract.
    service.send({ type: "START" });
    service.send({ type: "SERVER_RUN_STARTED", result: { ...runStart, attemptId: "other" } });
    service.send({ type: "SERVER_RUN_STARTED", result: { ...runStart, runRevision: 1 } });
    service.send({ type: "SERVER_RUN_STARTED", result: { ...runStart, scenarioContentHash: "sha256:other" } });
    service.send({ type: "SERVER_RUN_STARTED", result: { ...runStart,
      // @ts-expect-error Incomplete transport payload must be rejected at runtime too.
      initialView: { tick: 0, cameraMode: "thirdPerson" } } });
    expect(service.getSnapshot().value).toBe("ready");
    service.send({ type: "SERVER_RUN_STARTED", result: runStart });
    expect(service.getSnapshot().value).toBe("playing");
    expect(service.getSnapshot().context.runStart).toEqual(runStart);
  });

  it("recovers errors to safe states and retains the attempt after finalization failure", () => {
    const service = deciding();
    service.send({ type: "CONFIRM_DECISION", decision, idempotencyKey: key });
    service.send({ type: "FAILED", message: "server unavailable" });
    expect(service.getSnapshot().value).toBe("recoverableError");
    service.send({ type: "RETRY" });
    expect(service.getSnapshot().value).toBe("finalizing");
    expect(service.getSnapshot().context.decision).toEqual(decision);
    expect(service.getSnapshot().context.idempotencyKey).toBe(key);
    expect(service.getSnapshot().context.attemptId).toBe("attempt-1");
    expect(service.getSnapshot().context.durableResult).toBeNull();
    service.send({ type: "REPLAY" });
    expect(service.getSnapshot().value).toBe("finalizing");
  });

  it("restores an active run only with a bound server revision and tick zero", () => {
    const service = playing();
    service.send({ type: "SERVER_RESTORED_ACTIVE", attemptId: "attempt-1", previousRunRevision: 0,
      runRevision: 1, scenarioContentHash: pinnedHash, previousState: "playing", state: "ready", tick: 1 });
    expect(service.getSnapshot().value).toBe("playing");
    service.send({ type: "SERVER_RESTORED_ACTIVE", attemptId: "attempt-1", previousRunRevision: 0,
      runRevision: 1, scenarioContentHash: pinnedHash, previousState: "playing", state: "ready", tick: 0 });
    expect(service.getSnapshot().value).toBe("ready");
    expect(service.getSnapshot().context.runRevision).toBe(1);
    expect(service.getSnapshot().context.decisionTick).toBeNull();
    service.send({ type: "SERVER_RESTORED_ACTIVE", attemptId: "attempt-1", previousRunRevision: 0,
      runRevision: 1, scenarioContentHash: pinnedHash, previousState: "playing", state: "ready", tick: 0 });
    expect(service.getSnapshot().context.runRevision).toBe(1);
  });

  it("requires server recovery after a playing error before retrying the run", () => {
    const service = playing();
    service.send({ type: "FAILED", message: "render failure" });
    expect(service.getSnapshot().value).toBe("recoverableError");
    service.send({ type: "RETRY" });
    expect(service.getSnapshot().value).toBe("recoverableError");
    service.send({ type: "SERVER_RESTORED_ACTIVE", attemptId: "attempt-1", previousRunRevision: 0,
      runRevision: 1, scenarioContentHash: pinnedHash, previousState: "playing", state: "ready", tick: 0 });
    expect(service.getSnapshot().value).toBe("ready");
    expect(service.getSnapshot().context.runRevision).toBe(1);
    expect(service.getSnapshot().context.runStart).toBeNull();
  });

  it("returns a loading error to loading and pauses on pointer loss", () => {
    const service = createActor(createSessionWorkflow(binding)).start();
    service.send({ type: "LOAD" });
    service.send({ type: "FAILED", message: "asset unavailable" });
    expect(service.getSnapshot().value).toBe("recoverableError");
    service.send({ type: "RETRY" });
    expect(service.getSnapshot().value).toBe("loading");
    service.send({ type: "LOADED" });
    service.send({ type: "BRIEFING_DONE" });
    service.send({ type: "SERVER_RUN_STARTED", result: runStart });
    service.send({ type: "POINTER_LOST" });
    expect(service.getSnapshot().value).toBe("paused");
  });

  it("permits abandonment only from safe pre-decision states", () => {
    const service = actor();
    service.send({ type: "ABANDON" });
    expect(service.getSnapshot().value).toBe("abandoned");
    const active = playing();
    active.send({ type: "ABANDON" });
    expect(active.getSnapshot().value).toBe("playing");
  });

  it("rejects invalid bindings and detaches nested binding data", () => {
    for (const override of [
      { scenarioContentHash: "sha256:bad" }, { runRevision: Number.MAX_SAFE_INTEGER + 1 },
      { durationTicks: 481 }, { fieldBounds: { minX: 2, maxX: 1, minZ: -1, maxZ: 1 } },
      { fieldBounds: { minX: -1, maxX: Infinity, minZ: -1, maxZ: 1 } },
      { decisionGate: { opensAtTick: 2, closesAtTick: 5, forcePauseAtTick: 11 } },
      { actorHandles: ["actor-001", "actor-001"] }, { actorHandles: ["canonical-id"] },
    ]) expect(() => createSessionWorkflow({ ...binding, ...override })).toThrow();
    const mutable = { ...binding, fieldBounds: { ...binding.fieldBounds },
      decisionGate: { ...gate }, actorHandles: [...binding.actorHandles] };
    const service = createActor(createSessionWorkflow(mutable)).start();
    mutable.fieldBounds.maxX = 0;
    mutable.decisionGate.closesAtTick = 2;
    mutable.actorHandles.pop();
    service.send({ type: "LOAD" }); service.send({ type: "LOADED" }); service.send({ type: "BRIEFING_DONE" });
    service.send({ type: "SERVER_RUN_STARTED", result: runStart });
    service.send({ type: "SERVER_DECIDING_CONFIRMED", attemptId: "attempt-1", runRevision: 0, tick: 3 });
    service.send({ type: "CONFIRM_DECISION", decision: { ...decision, offenderActorHandle: "actor-002" }, idempotencyKey: key });
    expect(service.getSnapshot().value).toBe("finalizing");
    expect(Object.isFrozen(service.getSnapshot().context.fieldBounds)).toBe(true);
    expect(Object.isFrozen(service.getSnapshot().context.actorHandles)).toBe(true);
  });

  it("uses exact C1 run-start framing and field bounds, then freezes the retained view", () => {
    const service = actor();
    const invalid = [
      { ...runStart, initialView: { ...runStart.initialView, lookPitch: 1.3 } },
      { ...runStart, initialView: { ...runStart.initialView, cameraDistanceM: 1 } },
      { ...runStart, initialView: { ...runStart.initialView, refereePosition: { x: 51, y: 0, z: 2 } } },
      { ...runStart, initialView: { ...runStart.initialView, refereePosition: { x: 1, y: 1, z: 2 } } },
      { ...runStart, initialView: { ...runStart.initialView, verticalFovRad: 1.4 } },
      { ...runStart, extra: true },
      { ...runStart, initialView: { ...runStart.initialView, extra: true } },
    ];
    for (const result of invalid) {
      service.send({ type: "SERVER_RUN_STARTED", result: result as typeof runStart });
      expect(service.getSnapshot().value).toBe("ready");
    }
    const mutable = { ...runStart, initialView: { ...runStart.initialView,
      refereePosition: { x: runStart.initialView.refereePosition.x as number,
        y: runStart.initialView.refereePosition.y as number,
        z: runStart.initialView.refereePosition.z as number } } };
    service.send({ type: "SERVER_RUN_STARTED", result: mutable });
    mutable.initialView.refereePosition.x = 99;
    expect(service.getSnapshot().context.runStart?.initialView.refereePosition.x).toBe(1);
    expect(Object.isFrozen(service.getSnapshot().context.runStart?.initialView.refereePosition)).toBe(true);
  });

  it("accepts structurally valid wrong choices and rejects unknown or private decision fields", () => {
    const service = deciding();
    const rejected = [
      { decision: { ...decision, decisionTick: 3.5 }, idempotencyKey: key },
      { decision: { ...decision, restart: "playOn" }, idempotencyKey: key },
      { decision: { ...decision, discipline: "red" }, idempotencyKey: key },
      { decision: { ...decision, offenderActorHandle: "actor-999" }, idempotencyKey: key },
      { decision: { ...decision, offenderActorId: "secret" }, idempotencyKey: key },
      { decision, idempotencyKey: "" }, { decision, idempotencyKey: "x".repeat(129) },
      { decision, idempotencyKey: key, score: 100 },
    ];
    for (const payload of rejected) {
      service.send({ type: "CONFIRM_DECISION", ...payload } as never);
      expect(service.getSnapshot().value).toBe("deciding");
    }
    service.send({ type: "CONFIRM_DECISION", decision: { decisionTick: 3, stopPlay: false,
      restart: "playOn", discipline: "none", offenderActorHandle: null }, idempotencyKey: key });
    expect(service.getSnapshot().value).toBe("finalizing");
  });

  it("retains exact choice and key through uncertain finalization and rejects invalid durable replies", () => {
    const service = deciding();
    const mutable = { ...decision, offenderActorHandle: "actor-001" };
    service.send({ type: "CONFIRM_DECISION", decision: mutable, idempotencyKey: key });
    mutable.offenderActorHandle = "actor-002";
    service.send({ type: "FAILED", message: "timeout" });
    service.send({ type: "RETRY" });
    expect(service.getSnapshot().context.decision?.offenderActorHandle).toBe("actor-001");
    expect(service.getSnapshot().context.idempotencyKey).toBe(key);
    for (const result of [
      { ...durable, decisionId: "" }, { ...durable, finalizedAt: "yesterday" },
      { ...durable, finalizedAt: "2026-02-30T12:00:00.000Z" }, { ...durable, extra: true },
    ]) { service.send({ type: "SERVER_FINALIZED", result }); expect(service.getSnapshot().value).toBe("finalizing"); }
    service.send({ type: "SERVER_FINALIZED", result: durable });
    expect(service.getSnapshot().value).toBe("debrief");
  });

  it("routes finalized recovery only from bound loading and active recovery only with exact revision", () => {
    const finalized = createActor(createSessionWorkflow({ ...binding, entryState: "finalizedRecovery" })).start();
    finalized.send({ type: "LOAD" }); finalized.send({ type: "LOADED" });
    expect(finalized.getSnapshot().value).toBe("loading");
    const result = { ...durable, scenarioContentHash: pinnedHash, state: "completed" as const };
    finalized.send({ type: "SERVER_RESTORED_FINALIZED", result: { ...result, scenarioContentHash: "bad" } });
    expect(finalized.getSnapshot().value).toBe("loading");
    finalized.send({ type: "SERVER_RESTORED_FINALIZED", result });
    expect(finalized.getSnapshot().value).toBe("completed");
    expect(finalized.getSnapshot().context.durableResult).toEqual(durable);
    const fresh = createActor(createSessionWorkflow(binding)).start();
    fresh.send({ type: "LOAD" }); fresh.send({ type: "SERVER_RESTORED_FINALIZED", result });
    expect(fresh.getSnapshot().value).toBe("loading");
    const active = createActor(createSessionWorkflow({ ...binding, entryState: "activeRecovery" })).start();
    active.send({ type: "LOAD" }); active.send({ type: "LOADED" });
    expect(active.getSnapshot().value).toBe("loading");
    const restored = { type: "SERVER_RESTORED_ACTIVE" as const, attemptId: "attempt-1", previousRunRevision: 0,
      runRevision: 1, scenarioContentHash: pinnedHash, previousState: "playing" as const,
      state: "ready" as const, tick: 0 };
    for (const invalid of [{ ...restored, scenarioContentHash: "bad" }, { ...restored, runRevision: 2 },
      { ...restored, previousState: "paused" }, { ...restored, extra: true }]) {
      active.send(invalid as typeof restored); expect(active.getSnapshot().value).toBe("loading");
    }
    active.send(restored);
    expect(active.getSnapshot().value).toBe("ready");
    expect(active.getSnapshot().context.runRevision).toBe(1);
  });

  it("isolates the top-level context of two actors before and after XState assignments", () => {
    const machine = createSessionWorkflow(binding);
    const first = createActor(machine).start();
    const second = createActor(machine).start();
    expect(Object.isFrozen(first.getSnapshot().context)).toBe(true);
    expect(Object.isFrozen(second.getSnapshot().context)).toBe(true);
    expect(() => { (first.getSnapshot().context as { runRevision: number }).runRevision = 8; }).toThrow();
    first.send({ type: "LOAD" }); first.send({ type: "LOADED" }); first.send({ type: "BRIEFING_DONE" });
    second.send({ type: "LOAD" }); second.send({ type: "LOADED" }); second.send({ type: "BRIEFING_DONE" });
    first.send({ type: "SERVER_RUN_STARTED", result: runStart });
    expect(Object.isFrozen(first.getSnapshot().context)).toBe(true);
    expect(() => { (first.getSnapshot().context as { decisionTick: number | null }).decisionTick = 3; }).toThrow();
    expect(second.getSnapshot().context.decisionTick).toBeNull();
    first.send({ type: "SERVER_DECIDING_CONFIRMED", attemptId: "attempt-1", runRevision: 0, tick: 3 });
    expect(Object.isFrozen(first.getSnapshot().context)).toBe(true);
    expect(() => { (first.getSnapshot().context as { decisionTick: number | null }).decisionTick = 4; }).toThrow();
    first.send({ type: "CONFIRM_DECISION", decision, idempotencyKey: key });
    expect(first.getSnapshot().value).toBe("finalizing");
    expect(Object.isFrozen(first.getSnapshot().context)).toBe(true);
    expect(second.getSnapshot().value).toBe("ready");
  });

  it("keeps restored and durable contexts immutable after assignment", () => {
    const active = createActor(createSessionWorkflow({ ...binding, entryState: "activeRecovery" })).start();
    active.send({ type: "LOAD" });
    active.send({ type: "SERVER_RESTORED_ACTIVE", attemptId: "attempt-1", previousRunRevision: 0,
      runRevision: 1, scenarioContentHash: pinnedHash, previousState: "playing", state: "ready", tick: 0 });
    expect(Object.isFrozen(active.getSnapshot().context)).toBe(true);
    expect(() => { (active.getSnapshot().context as { runRevision: number }).runRevision = 2; }).toThrow();
    const service = deciding();
    service.send({ type: "CONFIRM_DECISION", decision, idempotencyKey: key });
    service.send({ type: "SERVER_FINALIZED", result: durable });
    expect(Object.isFrozen(service.getSnapshot().context)).toBe(true);
    expect(() => { (service.getSnapshot().context as { durableResult: null }).durableResult = null; }).toThrow();
    expect(service.getSnapshot().context.durableResult).toEqual(durable);
  });
});
