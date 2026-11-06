import { describe, expect, it } from "vitest";
import { normalizeDecisionSourceV2 } from "./source-decision-v2";

const choices: Array<{ optionId: string; kind: string; value: string | boolean }> = [
  ["stopPlay", false], ["stopPlay", true],
  ...["playOn", "penaltyKick", "directFreeKick", "indirectFreeKick", "droppedBall"].map((value) => ["restart", value]),
  ...["none", "yellow", "red"].map((value) => ["discipline", value]),
].map(([kind, value], index) => ({ optionId: `opt-${String(index + 1).padStart(3, "0")}`,
  kind: String(kind), value: value as string | boolean }));
function fixture() {
  return {
    options: structuredClone(choices),
    rubric: {
      evaluationVersion: 1, classification: "clear", role: "mainReferee",
      decision: { mode: "exactSemanticMatch", expected: { stopPlay: true, restart: "penaltyKick",
        discipline: "none", offenderActorId: "defence-04" },
      allowUnspecifiedOffenderWhenNoCard: true, evidenceIds: ["EV-INSIDE-AREA", "EV-TRIP-CONTACT"] },
      observation: { observationRubricVersion: 1, requiredEvidenceIds: ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"] },
      communication: { mode: "notApplicable", reason: "noAuthoredCommunicationInput" },
      protocol: { mode: "notApplicable", reason: "initialMainRefereeNoVar" },
      debriefContentId: "debrief-001",
    },
  };
}
const evidence = ["EV-INSIDE-AREA", "EV-TRIP-CONTACT"];
const actors = ["attack-09", "defence-04"];

describe("v2 decision source", () => {
  it("normalizes complete neutral options and private rubric with immutable output", () => {
    const input = fixture();
    input.options.reverse();
    const result = normalizeDecisionSourceV2(input.options, input.rubric, evidence, actors, "debrief-001");
    expect(result.decisionOptions.map((option) => option.optionId)).toEqual(choices.map((option) => option.optionId));
    expect(result.rubric.observation.requiredEvidenceIds).toEqual(evidence);
    input.rubric.decision.expected.offenderActorId = "attack-09";
    expect(result.rubric.decision.expected.offenderActorId).toBe("defence-04");
    expect(Object.isFrozen(result.rubric.decision.expected)).toBe(true);
  });
  it("rejects answer-revealing incomplete options and unknown evidence", () => {
    const input = fixture(); input.options.pop();
    expect(() => normalizeDecisionSourceV2(input.options, input.rubric, evidence, actors, "debrief-001")).toThrow();
    const bad = fixture(); bad.rubric.decision.evidenceIds = ["EV-UNKNOWN"];
    expect(() => normalizeDecisionSourceV2(bad.options, bad.rubric, evidence, actors, "debrief-001")).toThrow();
  });
  it("rejects unknown offender, debrief, and accessors without reading getters", () => {
    const bad = fixture(); bad.rubric.decision.expected.offenderActorId = "unknown";
    expect(() => normalizeDecisionSourceV2(bad.options, bad.rubric, evidence, actors, "debrief-001")).toThrow();
    const wrong = fixture();
    expect(() => normalizeDecisionSourceV2(wrong.options, wrong.rubric, evidence, actors, "wrong")).toThrow();
    let read = false;
    const accessor = fixture();
    Object.defineProperty(accessor.rubric.decision.expected, "restart", { enumerable: true, get() { read = true; return "penaltyKick"; } });
    expect(() => normalizeDecisionSourceV2(accessor.options, accessor.rubric, evidence, actors, "debrief-001")).toThrow();
    expect(read).toBe(false);
  });
});
