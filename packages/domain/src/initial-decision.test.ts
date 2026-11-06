import { describe, expect, it } from "vitest";
import { normalizeDecision } from "./initial-decision";

const context = {
  decisionGate: { opensAtTick: 360, closesAtTick: 480, forcePauseAtTick: 480 },
  decidingTick: 400, traceStopTick: 400,
  canonicalActorIds: ["defence-04", "defence-05"],
  resolveActorHandle: (handle: string) => {
    if (handle === "actor-001") return "defence-04";
    if (handle === "actor-002") return "defence-05";
    throw new Error("unknown handle");
  },
};
const penalty = { decisionTick: 400, stopPlay: true, restart: "penaltyKick",
  discipline: "none", offenderActorHandle: "actor-001" };

describe("normalizeDecision", () => {
  it("resolves only the public handle and returns canonical semantic fields", () => {
    expect(normalizeDecision(penalty, context)).toEqual({ decisionTick: 400, stopPlay: true,
      restart: "penaltyKick", discipline: "none", offenderActorId: "defence-04" });
  });
  it("accepts structurally valid wrong answers and null no-card offender", () => {
    expect(normalizeDecision({ ...penalty, stopPlay: false, restart: "playOn",
      offenderActorHandle: null }, context).offenderActorId).toBeNull();
    expect(normalizeDecision({ ...penalty, restart: "directFreeKick",
      offenderActorHandle: "actor-002" }, context).restart).toBe("directFreeKick");
  });
  it.each([
    { ...penalty, score: 100 },
    { ...penalty, offenderActorId: "defence-04" },
    { ...penalty, offenderActorHandle: "defence-04" },
    { ...penalty, offenderActorHandle: "actor-999" },
    { ...penalty, decisionTick: 399 },
    { ...penalty, decisionTick: 400.5 },
    { ...penalty, stopPlay: false },
    { ...penalty, discipline: "yellow", offenderActorHandle: null },
  ])("rejects malformed transport %#", (candidate) => {
    expect(() => normalizeDecision(candidate, context)).toThrow();
  });
  it("rejects a decision outside the pinned gate and an untrusted resolver result", () => {
    expect(() => normalizeDecision(penalty, { ...context, decisionGate: {
      ...context.decisionGate, opensAtTick: 401 } })).toThrow();
    expect(() => normalizeDecision(penalty, { ...context,
      resolveActorHandle: () => "outside-roster" })).toThrow();
  });
});
