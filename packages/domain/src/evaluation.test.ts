import { describe, expect, it } from "vitest";
import { evaluateClearPenaltyMainRefereeV1 } from "./evaluation";

const rubric = { evaluationVersion: 1, classification: "clear", role: "mainReferee",
  decision: { mode: "exactSemanticMatch", expected: { stopPlay: true,
    restart: "penaltyKick", discipline: "none", offenderActorId: "defence-04" },
    allowUnspecifiedOffenderWhenNoCard: true, evidenceIds: ["EV-TRIP-CONTACT"] },
  observation: { observationRubricVersion: 1, requiredEvidenceIds: ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"] },
  communication: { mode: "notApplicable", reason: "noAuthoredCommunicationInput" },
  protocol: { mode: "notApplicable", reason: "initialMainRefereeNoVar" },
  debriefContentId: "debrief-v1" } as const;
const context = { rubric, canonicalActorIds: ["defence-04", "defence-05"],
  privateEvidenceIds: ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"],
  preparedDebriefContentIds: ["debrief-v1"] };
const decision = { decisionTick: 400, stopPlay: true, restart: "penaltyKick",
  discipline: "none", offenderActorId: null } as const;
const observation = { status: "scored", score: 100, eligibleLiveTicks: 4,
  evidence: [{ evidenceId: "EV-TRIP-CONTACT", band: "supported" },
    { evidenceId: "EV-INSIDE-AREA", band: "supported" }] } as const;

describe("evaluateClearPenaltyMainRefereeV1", () => {
  it("scores exact decision independently of observed evidence", () => {
    const result = evaluateClearPenaltyMainRefereeV1(decision, { ...context,
      observationSummary: { ...observation, status: "insufficientEvidence", score: null,
        eligibleLiveTicks: 0, evidence: observation.evidence.map((item) => ({ ...item, band: "none" })) } });
    expect(result.decisionQuality).toEqual({ status: "scored", score: 100,
      reasonCodes: [], evidenceIds: ["EV-TRIP-CONTACT"] });
    expect(result.observationAndPositioning).toEqual({ status: "insufficientEvidence",
      score: null, reasonCodes: ["noEligibleLiveReceipt"], evidenceIds: [] });
    expect(result.communication).toEqual({ status: "notApplicable", score: null,
      reasonCodes: ["noAuthoredCommunicationInput"], evidenceIds: [] });
    expect(result.protocolApplication.score).toBeNull();
    expect(result).not.toHaveProperty("aggregateScore");
  });
  it("emits ordered mismatches and observation minimum band", () => {
    const result = evaluateClearPenaltyMainRefereeV1({ ...decision, stopPlay: false,
      restart: "playOn", discipline: "yellow", offenderActorId: "defence-05" },
      { ...context, observationSummary: { ...observation, score: 40, evidence: [
        { evidenceId: "EV-TRIP-CONTACT", band: "supported" },
        { evidenceId: "EV-INSIDE-AREA", band: "weak" }] } });
    expect(result.decisionQuality.score).toBe(0);
    expect(result.decisionQuality.reasonCodes).toEqual(["stopMismatch", "restartMismatch",
      "disciplineMismatch", "offenderMismatch"]);
    expect(result.observationAndPositioning.score).toBe(40);
  });
  it("gives zero observation credit to a correct guess when live receipts missed required evidence", () => {
    const result = evaluateClearPenaltyMainRefereeV1(decision, { ...context,
      observationSummary: { ...observation, score: 0, evidence: [
        { evidenceId: "EV-TRIP-CONTACT", band: "none" },
        { evidenceId: "EV-INSIDE-AREA", band: "supported" }] } });
    expect(result.decisionQuality.score).toBe(100);
    expect(result.observationAndPositioning).toMatchObject({ status: "scored", score: 0 });
  });
  it("rejects invalid rubric bindings and forged summary shape", () => {
    expect(() => evaluateClearPenaltyMainRefereeV1(decision, { ...context,
      rubric: { ...rubric, decision: { ...rubric.decision, mode: "weighted" } } as never,
      observationSummary: observation })).toThrow();
    expect(() => evaluateClearPenaltyMainRefereeV1(decision, { ...context,
      observationSummary: { ...observation, score: 100, evidence: [
        { evidenceId: "EV-TRIP-CONTACT", band: "none" },
        { evidenceId: "EV-INSIDE-AREA", band: "supported" }] } })).toThrow();
  });
});
