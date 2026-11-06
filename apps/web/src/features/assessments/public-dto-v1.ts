import 'server-only';
import { canonicalJsonV2 } from "@refview/content";
import { compileAssessmentSourceV1 } from "./source-v1";
import { type AssessmentNormalizedAnswerV1, evaluateAssessmentAnswerV1 } from "./evaluation-v1";

type CompiledAssessment = ReturnType<typeof compileAssessmentSourceV1>;
type EvaluatedAssessment = ReturnType<typeof evaluateAssessmentAnswerV1>;
type Locale = "es" | "en";
type NextPractice = { targetItemId: string; targetVersion: number;
  availability: "available" | "unavailable" };

function verifiedSource(compiled: CompiledAssessment) {
  const verified = compileAssessmentSourceV1(compiled.source);
  if (verified.contentHash !== compiled.contentHash || verified.rubricHash !== compiled.rubricHash) {
    throw new Error("assessment source hash mismatch");
  }
  return verified.source;
}

// These projections format already authorized, reviewed records. Callers enforce publication and ownership.
export function projectAssessmentCatalogItemV1(compiled: CompiledAssessment, locale: Locale) {
  const source = verifiedSource(compiled);
  return { itemId: source.itemId, version: source.version, lawsEdition: source.lawsEdition,
    topicId: source.topicId, level: source.level, type: source.type,
    title: source.localized[locale].title, availability: "available" as const };
}

export function projectAssessmentActiveAttemptV1(compiled: CompiledAssessment,
  attemptId: string, locale: Locale) {
  const source = verifiedSource(compiled);
  const inputSpec = source.type === "ruleQuestion"
    ? { kind: "ruleQuestion" as const, options: source.inputSpec.options.map((option) => ({
      optionId: option.optionId, label: option.label[locale],
    })) }
    : source.type === "authoredIncidentAnalysis"
      ? { kind: "authoredIncidentAnalysis" as const,
        offenderHandles: [...source.inputSpec.offenderHandles],
        reasoningRequired: true as const, reasoningMaxCodePoints: 600 as const }
      : { kind: "restartDiscipline" as const,
        offenderHandles: [...source.inputSpec.offenderHandles] };
  return { attemptId, itemId: source.itemId, version: source.version,
    lawsEdition: source.lawsEdition, topicId: source.topicId, type: source.type,
    title: source.localized[locale].title, prompt: source.localized[locale].prompt,
    inputSpec, publicEvidence: source.publicEvidence.map((evidence) => ({
      evidenceId: evidence.evidenceId, text: evidence.text[locale],
    })) };
}

function publicAcceptedOutcome(answer: CompiledAssessment["source"]["privateRubric"]["acceptedAnswers"][number]) {
  return answer.kind === "ruleQuestion"
    ? { kind: answer.kind, optionId: answer.optionId }
    : { kind: answer.kind, stopPlay: answer.stopPlay, restart: answer.restart,
      discipline: answer.discipline, offenderHandle: answer.offenderHandle };
}

function publicSubmittedAnswer(answer: AssessmentNormalizedAnswerV1) {
  return answer.kind === "ruleQuestion"
    ? { kind: answer.kind, optionId: answer.optionId }
    : answer.kind === "authoredIncidentAnalysis"
      ? { kind: answer.kind, stopPlay: answer.stopPlay, restart: answer.restart,
        discipline: answer.discipline, offenderHandle: answer.offenderHandle,
        reasoning: answer.reasoning }
      : { kind: answer.kind, stopPlay: answer.stopPlay, restart: answer.restart,
        discipline: answer.discipline, offenderHandle: answer.offenderHandle };
}

export function projectAssessmentFinalizedResultV1(compiled: CompiledAssessment,
  attemptId: string, locale: Locale, evaluated: EvaluatedAssessment,
  eligibleNextPractice: readonly NextPractice[]) {
  const source = verifiedSource(compiled);
  const result = evaluated.result;
  if (result.itemId !== source.itemId || result.version !== source.version
    || result.contentHash !== compiled.contentHash || result.rubricHash !== compiled.rubricHash
    || evaluated.normalizedAnswer.kind !== source.type) {
    throw new Error("assessment result provenance mismatch");
  }
  const recomputed = evaluateAssessmentAnswerV1(compiled, evaluated.normalizedAnswer);
  if (recomputed.submissionDigest !== evaluated.submissionDigest
    || canonicalJsonV2(recomputed.result) !== canonicalJsonV2(result)) {
    throw new Error("assessment result evaluation mismatch");
  }
  const evidenceIds = new Set(source.correction.evidenceIds);
  const sourceIds = new Set(source.correction.sourceIds[locale]);
  const nextPractice = eligibleNextPractice.map((next) => {
    if (!source.recommendationRefs.some((ref) => ref.targetItemId === next.targetItemId
      && ref.targetVersion === next.targetVersion)
      || !["available", "unavailable"].includes(next.availability)) {
      throw new Error("unreviewed next practice");
    }
    return { targetItemId: next.targetItemId, targetVersion: next.targetVersion,
      availability: next.availability };
  });
  return { attemptId, itemId: source.itemId, version: source.version,
    lawsEdition: source.lawsEdition, title: source.localized[locale].title,
    submittedAnswer: publicSubmittedAnswer(evaluated.normalizedAnswer),
    acceptedOutcomes: source.privateRubric.acceptedAnswers.map(publicAcceptedOutcome),
    correction: { summary: source.correction.summary[locale],
      explanation: source.correction.explanation[locale],
      evidence: source.publicEvidence.filter((evidence) => evidenceIds.has(evidence.evidenceId))
        .map((evidence) => ({ evidenceId: evidence.evidenceId, text: evidence.text[locale] })),
      sources: source.officialSources.filter((entry) => sourceIds.has(entry.sourceId))
        .map((entry) => ({ sourceId: entry.sourceId, publisher: entry.publisher,
          edition: entry.edition, documentUrl: entry.documentUrl, lawNumber: entry.lawNumber,
          sectionCode: entry.sectionCode, displayLabel: entry.displayLabel,
          printedPage: entry.printedPage })) },
    evaluation: { structuredDecision: { status: result.structuredDecision.status,
      score: result.structuredDecision.score,
      reasonCodes: [...result.structuredDecision.reasonCodes],
      evidenceIds: [...result.structuredDecision.evidenceIds] },
      reasoning: { status: result.reasoning.status, score: result.reasoning.score,
        dimensions: result.reasoning.dimensions.map((dimension) => ({
          dimensionId: dimension.dimensionId, status: dimension.status, score: dimension.score,
        })) },
      positioning: { status: result.positioning.status, score: result.positioning.score },
      communication: { status: result.communication.status, score: result.communication.score },
      protocol: { status: result.protocol.status, score: result.protocol.score } },
    reasoningReview: source.privateRubric.reasoningDimensions.map((dimension) => ({
      dimensionId: dimension.dimensionId, prompt: dimension.prompt[locale],
      status: "unscored" as const, score: null,
    })), nextPractice };
}
