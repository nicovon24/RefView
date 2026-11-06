import { describe, expect, it } from "vitest";
import { assessmentDraftsV1, compileAssessmentSourceV1, type AssessmentSourceV1 } from "./source-v1";

const clone = (item: AssessmentSourceV1): AssessmentSourceV1 => structuredClone(item);

describe("unpublished assessment source v1", () => {
  it("has one exact bilingual candidate per required type with pinned deterministic hashes", () => {
    expect(assessmentDraftsV1.map(({ source }) => [source.itemId, source.type, source.level])).toEqual([
      ["careless-trip-penalty-restart", "restartDiscipline", "beginner"],
      ["challenge-severity-rule", "ruleQuestion", "beginner"],
      ["reckless-challenge-not-dogso", "authoredIncidentAnalysis", "intermediate"],
    ]);
    const next = ["reckless-challenge-not-dogso", "careless-trip-penalty-restart", "challenge-severity-rule"];
    for (const [index, { source, contentHash, rubricHash }] of assessmentDraftsV1.entries()) {
      expect(compileAssessmentSourceV1(clone(source))).toEqual({ source, contentHash, rubricHash });
      expect(contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(rubricHash).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(Object.isFrozen(source)).toBe(true);
      expect(source.recommendationRefs).toEqual([{ targetItemId: next[index], targetVersion: 1,
        topicId: "challenge", lawsEdition: "IFAB-2026-27" }]);
      expect(source.officialSources.some((entry) => entry.language === "es")).toBe(true);
      expect(source.officialSources.some((entry) => entry.language === "en")).toBe(true);
      for (const entry of source.officialSources) {
        expect(entry.inspectedArtifactSha256).toBe(entry.language === "es"
          ? "sha256:5c4d4795af674701c934030416132835357d039fd6a68b248baf738714ebe7ab"
          : "sha256:89398520b353c6d995a1bb2557c97dc3c5aa1712c1d3009589f580a5a23c6a7d");
      }
    }
    expect(assessmentDraftsV1.map(({ contentHash }) => contentHash)).toEqual([
      "sha256:cfd82af1ae1d01b0fc54b79290945ecfeb3a7cf2b91124480cb0df22143bef7f",
      "sha256:dc5bb1d47f34a86a0112c411e3109a51ec743822fcfcfc8453232bf38c7fa7cf",
      "sha256:cc16f97584047ec7ae6fd88873f3343846e848cc5e12e1ee53bf931d8dcdd124",
    ]);
  });

  it("keeps exact proposed answers private in source and binds edits to the hash", () => {
    const [penalty, rule, analysis] = assessmentDraftsV1.map(({ source }) => source);
    expect(rule.privateRubric.acceptedAnswers).toEqual([{ kind: "ruleQuestion", optionId: "choice-a" }]);
    expect(penalty.privateRubric.acceptedAnswers).toEqual([{ kind: "restartDiscipline", stopPlay: true,
      restart: "penaltyKick", discipline: "none", offenderHandle: "defence-04" }]);
    expect(analysis.privateRubric.acceptedAnswers).toEqual([{ kind: "authoredIncidentAnalysis", stopPlay: true,
      restart: "directFreeKick", discipline: "yellow", offenderHandle: "defence-07" }]);
    expect(analysis.privateRubric.reasoningDimensions.map((entry) => [entry.dimensionId, entry.status])).toEqual([
      ["decisionJustification", "unscored"], ["relevantFact", "unscored"], ["ruleConnection", "unscored"],
    ]);
    for (const { source, contentHash } of assessmentDraftsV1) {
      const copy = clone(source);
      copy.localized.es.prompt += " Revisión.";
      expect(compileAssessmentSourceV1(copy).contentHash).not.toBe(contentHash);
      const correction = clone(source);
      correction.correction.explanation.en += " Revision.";
      expect(compileAssessmentSourceV1(correction).contentHash).not.toBe(contentHash);
    }
    const changed = clone(rule);
    changed.privateRubric.acceptedAnswers = [{ kind: "ruleQuestion", optionId: "choice-b" }];
    expect(compileAssessmentSourceV1(changed).contentHash).not.toBe(assessmentDraftsV1[1].contentHash);
    expect(compileAssessmentSourceV1(changed).rubricHash).not.toBe(assessmentDraftsV1[1].rubricHash);
  });

  it("normalizes sorted sets, rejects extra fields and broken authority", () => {
    const sample = clone(assessmentDraftsV1[1].source);
    if (sample.type !== "ruleQuestion") throw new Error("unexpected candidate type");
    sample.officialSources.reverse();
    sample.inputSpec.options.reverse();
    expect(compileAssessmentSourceV1(sample).contentHash).toBe(assessmentDraftsV1[1].contentHash);
    const changes: Array<(source: AssessmentSourceV1) => void> = [
      (source) => { Object.assign(source.localized.es, { extra: "no" }); },
      (source) => { source.officialSources.push({ ...source.officialSources[0] }); },
      (source) => { source.officialSources[0].edition = "IFAB-2025-26" as "IFAB-2026-27"; },
      (source) => { source.officialSources[0].inspectedArtifactSha256 = "sha256:bad"; },
      (source) => { source.correction.sourceIds.en = ["law-12-direct-free-kick-es"]; },
      (source) => { source.correction.evidenceIds = ["missing"]; },
      (source) => { if (source.type !== "ruleQuestion") throw new Error("unexpected type");
        source.inputSpec.options.push({ ...source.inputSpec.options[0] }); },
      (source) => { source.privateRubric.acceptedAnswers = [{ kind: "ruleQuestion", optionId: "unknown" }]; },
      (source) => { Object.assign(source, { publicationState: "reviewed" }); },
      (source) => { source.version = Number.POSITIVE_INFINITY; },
      (source) => { source.publicEvidence.push({ ...source.publicEvidence[0] }); },
      (source) => { source.correction.sourceIds.es = ["law-12-direct-free-kick-en"]; },
      (source) => { source.officialSources.splice(source.officialSources.findIndex((entry) => entry.language === "es"), 1); },
      (source) => { if (source.type !== "ruleQuestion") throw new Error("unexpected type");
        source.privateRubric.acceptedAnswers.push({ ...source.privateRubric.acceptedAnswers[0] }); },
    ];
    for (const mutate of changes) {
      const copy = clone(assessmentDraftsV1[1].source);
      mutate(copy);
      expect(() => compileAssessmentSourceV1(copy)).toThrow();
    }
  });
});
