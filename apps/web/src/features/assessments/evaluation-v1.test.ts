import { describe, expect, it } from "vitest";
import { canonicalJsonV2 } from "@refview/content";
import { createHash } from "node:crypto";
import { assessmentDraftsV1 } from "./source-v1";
import { evaluateAssessmentAnswerV1, normalizeAssessmentAnswerV1 } from "./evaluation-v1";

const [restartItem, ruleItem, analysisItem] = assessmentDraftsV1;
const restartCorrect = { kind: "restartDiscipline", stopPlay: true, restart: "penaltyKick",
  discipline: "none", offenderHandle: "defence-04" };
const analysisCorrect = { kind: "authoredIncidentAnalysis", stopPlay: true,
  restart: "directFreeKick", discipline: "yellow", offenderHandle: "defence-07" };

describe("assessment evaluation v1", () => {
  it("scores an accepted option and preserves exact immutable content provenance", () => {
    const answer = { kind: "ruleQuestion", optionId: "choice-a" };
    const evaluated = evaluateAssessmentAnswerV1(ruleItem, answer);
    const expectedDigest = `sha256:${createHash("sha256").update(canonicalJsonV2([
      "refview-assessment-submission-v1", ruleItem.source.itemId, ruleItem.source.version,
      ruleItem.contentHash, answer,
    ]), "utf8").digest("hex")}`;
    expect(evaluated.normalizedAnswer).toEqual(answer);
    expect(evaluated.submissionDigest).toBe(expectedDigest);
    expect(evaluated.result).toEqual({
      itemId: ruleItem.source.itemId, version: 1, contentHash: ruleItem.contentHash,
      rubricVersion: 1, rubricHash: ruleItem.rubricHash, algorithmVersion: 1,
      correctionVersion: 1,
      structuredDecision: { status: "scored", score: 100, reasonCodes: [],
        evidenceIds: ["severity-thresholds"] },
      reasoning: { status: "notApplicable", score: null, dimensions: [] },
      positioning: { status: "notApplicable", score: null },
      communication: { status: "notApplicable", score: null },
      protocol: { status: "notApplicable", score: null },
    });
    expect(JSON.stringify(evaluated)).not.toContain("acceptedAnswers");
    expect(JSON.stringify(evaluated)).not.toContain("privateRubric");
  });

  it("accepts valid wrong options and structured choices with zero score", () => {
    const wrongOption = evaluateAssessmentAnswerV1(ruleItem,
      { kind: "ruleQuestion", optionId: "choice-b" });
    expect(wrongOption.result.structuredDecision).toEqual({ status: "scored", score: 0,
      reasonCodes: ["answerMismatch"], evidenceIds: ["severity-thresholds"] });
    const wrongStructured = evaluateAssessmentAnswerV1(restartItem,
      { kind: "restartDiscipline", stopPlay: false, restart: "playOn",
        discipline: "none", offenderHandle: null });
    expect(wrongStructured.result.structuredDecision.score).toBe(0);
    expect(evaluateAssessmentAnswerV1(restartItem, restartCorrect)
      .result.structuredDecision.score).toBe(100);
  });

  it("normalizes required reasoning, leaves every prose dimension unscored, and binds digest to text", () => {
    const raw = { ...analysisCorrect, reasoning: "  Cafe\u0301\r\n\rSecond line  " };
    const evaluated = evaluateAssessmentAnswerV1(analysisItem, raw);
    expect(evaluated.normalizedAnswer).toEqual({ ...analysisCorrect,
      reasoning: "Café\n\nSecond line" });
    expect(evaluated.result.structuredDecision.score).toBe(100);
    expect(evaluated.result.reasoning).toEqual({ status: "unscored", score: null,
      dimensions: [
        { dimensionId: "decisionJustification", status: "unscored", score: null },
        { dimensionId: "relevantFact", status: "unscored", score: null },
        { dimensionId: "ruleConnection", status: "unscored", score: null },
      ] });
    expect(evaluateAssessmentAnswerV1(analysisItem, { ...analysisCorrect,
      reasoning: "Café\n\nSecond line" }).submissionDigest).toBe(evaluated.submissionDigest);
    expect(evaluateAssessmentAnswerV1(analysisItem, { ...analysisCorrect,
      reasoning: "Different" }).submissionDigest).not.toBe(evaluated.submissionDigest);
    const wrong = evaluateAssessmentAnswerV1(analysisItem, { ...analysisCorrect,
      discipline: "none", reasoning: "Fact and law" });
    expect(wrong.result.structuredDecision.score).toBe(0);
    expect(wrong.result.reasoning.status).toBe("unscored");
  });

  it("rejects undeclared fields, unknown IDs, impossible combinations, and client-supplied authority", () => {
    const invalid = [
      [ruleItem, { kind: "ruleQuestion", optionId: "choice-z" }],
      [ruleItem, { kind: "ruleQuestion", optionId: "choice-a", score: 100 }],
      [ruleItem, { kind: "ruleQuestion", optionId: "choice-a", ownerId: "owner" }],
      [ruleItem, { kind: "ruleQuestion", optionId: "choice-a", privateRubric: {} }],
      [restartItem, { ...restartCorrect, stopPlay: false }],
      [restartItem, { ...restartCorrect, offenderHandle: "unknown" }],
      [restartItem, { ...restartCorrect, discipline: "yellow", offenderHandle: null }],
      [restartItem, { ...restartCorrect, reasoning: "extra" }],
      [analysisItem, { ...analysisCorrect }],
      [analysisItem, { ...analysisCorrect, reasoning: "  \r\n " }],
      [analysisItem, { ...analysisCorrect, reasoning: "x".repeat(601) }],
      [analysisItem, { ...analysisCorrect, reasoning: "x\u0000y" }],
      [analysisItem, { ...analysisCorrect, reasoning: "x\ty" }],
      [analysisItem, { ...analysisCorrect, reasoning: "x\u007fy" }],
      [analysisItem, { ...analysisCorrect, reasoning: "x\ud800y" }],
    ] as const;
    for (const [item, answer] of invalid) {
      expect(() => normalizeAssessmentAnswerV1(item.source, answer)).toThrow();
    }
    expect(() => normalizeAssessmentAnswerV1(ruleItem.source,
      { kind: "ruleQuestion", optionId: "choice-a", extra: undefined })).toThrow();
  });

  it("accepts exactly 600 Unicode code points and rejects a forged compiled hash", () => {
    const normalized = normalizeAssessmentAnswerV1(analysisItem.source,
      { ...analysisCorrect, reasoning: "⚽".repeat(600) });
    if (normalized.kind !== "authoredIncidentAnalysis") throw new Error("wrong answer type");
    expect([...normalized.reasoning].length).toBe(600);
    expect(() => evaluateAssessmentAnswerV1({ ...ruleItem,
      contentHash: "sha256:bad" }, { kind: "ruleQuestion", optionId: "choice-a" })).toThrow();
  });
});
