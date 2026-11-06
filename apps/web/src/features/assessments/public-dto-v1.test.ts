import { describe, expect, it } from "vitest";
import { assessmentDraftsV1 } from "./source-v1";
import { evaluateAssessmentAnswerV1 } from "./evaluation-v1";
import { projectAssessmentCatalogItemV1, projectAssessmentActiveAttemptV1,
  projectAssessmentFinalizedResultV1 } from "./public-dto-v1";

const [restart, rule, analysis] = assessmentDraftsV1;

describe("assessment public DTO v1", () => {
  it("serializes only catalog metadata and no answer-bearing content", () => {
    const dto = projectAssessmentCatalogItemV1(rule, "es");
    expect(dto).toEqual({ itemId: "challenge-severity-rule", version: 1,
      lawsEdition: "IFAB-2026-27", topicId: "challenge", level: "beginner",
      type: "ruleQuestion", title: rule.source.localized.es.title, availability: "available" });
    const serialized = JSON.stringify(dto);
    expect(serialized).not.toContain("choice-a");
    expect(serialized).not.toContain("privateRubric");
    expect(serialized).not.toContain("correction");
  });

  it("serializes an active attempt with only public prompt, input and evidence", () => {
    if (rule.source.type !== "ruleQuestion") throw new Error("wrong fixture type");
    const dto = projectAssessmentActiveAttemptV1(rule, "opaque-attempt-id", "en");
    expect(dto).toEqual({ attemptId: "opaque-attempt-id", itemId: "challenge-severity-rule",
      version: 1, lawsEdition: "IFAB-2026-27", topicId: "challenge",
      type: "ruleQuestion", title: rule.source.localized.en.title,
      prompt: rule.source.localized.en.prompt,
      inputSpec: { kind: "ruleQuestion", options: rule.source.inputSpec.options.map((option) => ({
        optionId: option.optionId, label: option.label.en,
      })) },
      publicEvidence: rule.source.publicEvidence.map((evidence) => ({
        evidenceId: evidence.evidenceId, text: evidence.text.en,
      })) });
    const serialized = JSON.stringify(dto);
    for (const marker of ["acceptedAnswers", "privateRubric", "correction", "rubricHash",
      "reasoningDimensions", "recommendationRefs", "sourceIds"] as const) {
      expect(serialized).not.toContain(marker);
    }
    expect(projectAssessmentActiveAttemptV1(analysis, "another-attempt", "es").inputSpec)
      .toEqual({ kind: "authoredIncidentAnalysis", offenderHandles: ["defence-07"],
        reasoningRequired: true, reasoningMaxCodePoints: 600 });
  });

  it("reveals only reviewed correction, accepted outcomes and separate results after finalization", () => {
    const evaluated = evaluateAssessmentAnswerV1(restart, { kind: "restartDiscipline",
      stopPlay: false, restart: "playOn", discipline: "none", offenderHandle: null });
    const dto = projectAssessmentFinalizedResultV1(restart, "owned-attempt", "es", evaluated,
      [{ targetItemId: "reckless-challenge-not-dogso", targetVersion: 1,
        availability: "available" }]);
    expect(dto).toEqual({ attemptId: "owned-attempt", itemId: restart.source.itemId,
      version: 1, lawsEdition: "IFAB-2026-27", title: restart.source.localized.es.title,
      submittedAnswer: evaluated.normalizedAnswer,
      acceptedOutcomes: [{ kind: "restartDiscipline", stopPlay: true, restart: "penaltyKick",
        discipline: "none", offenderHandle: "defence-04" }],
      correction: { summary: restart.source.correction.summary.es,
        explanation: restart.source.correction.explanation.es,
        evidence: [{ evidenceId: "authored-facts", text: restart.source.publicEvidence[0].text.es }],
        sources: restart.source.officialSources.filter((entry) =>
          restart.source.correction.sourceIds.es.includes(entry.sourceId)).map((entry) => ({
            sourceId: entry.sourceId, publisher: "IFAB", edition: "IFAB-2026-27",
            documentUrl: entry.documentUrl, lawNumber: entry.lawNumber,
            sectionCode: entry.sectionCode, displayLabel: entry.displayLabel,
            printedPage: entry.printedPage,
          })) },
      evaluation: { structuredDecision: evaluated.result.structuredDecision,
        reasoning: evaluated.result.reasoning, positioning: evaluated.result.positioning,
        communication: evaluated.result.communication, protocol: evaluated.result.protocol },
      reasoningReview: [], nextPractice: [{ targetItemId: "reckless-challenge-not-dogso",
        targetVersion: 1, availability: "available" }] });
    const serialized = JSON.stringify(dto);
    for (const marker of ["privateRubric", "acceptedAnswers", "rubricHash", "inspectedArtifactSha256",
      "recommendationRefs", "reasonCodesForRecommendation"] as const) {
      expect(serialized).not.toContain(marker);
    }
  });

  it("returns unscored reasoning prompts for self-review and no invented grade", () => {
    const evaluated = evaluateAssessmentAnswerV1(analysis, { kind: "authoredIncidentAnalysis",
      stopPlay: true, restart: "directFreeKick", discipline: "yellow",
      offenderHandle: "defence-07", reasoning: "The contact was reckless." });
    const dto = projectAssessmentFinalizedResultV1(analysis, "owned-analysis", "en", evaluated, []);
    expect(dto.reasoningReview).toEqual(analysis.source.privateRubric.reasoningDimensions.map((entry) => ({
      dimensionId: entry.dimensionId, prompt: entry.prompt.en, status: "unscored", score: null,
    })));
    expect(dto.submittedAnswer).toEqual(evaluated.normalizedAnswer);
    expect(dto.evaluation.reasoning.score).toBeNull();
    expect(JSON.stringify(dto)).not.toContain("privateRubric");
  });

  it("rejects a forged score or unreviewed next practice before revealing a result", () => {
    const evaluated = evaluateAssessmentAnswerV1(rule,
      { kind: "ruleQuestion", optionId: "choice-b" });
    expect(() => projectAssessmentFinalizedResultV1(rule, "owned-rule", "en",
      { ...evaluated, result: { ...evaluated.result,
        structuredDecision: { ...evaluated.result.structuredDecision, score: 100 } } }, [])).toThrow();
    expect(() => projectAssessmentFinalizedResultV1(rule, "owned-rule", "en", evaluated,
      [{ targetItemId: "unreviewed-item", targetVersion: 1,
        availability: "available" }])).toThrow();
  });
});
