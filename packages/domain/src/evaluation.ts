import type { NormalizedDecision } from "./initial-decision";

export type DimensionResult = Readonly<{
  status: "scored" | "notApplicable" | "insufficientEvidence";
  score: number | null; reasonCodes: readonly string[]; evidenceIds: readonly string[];
}>;
export type EvaluationResult = Readonly<{
  evaluationVersion: 1; decisionQuality: DimensionResult;
  observationAndPositioning: DimensionResult; communication: DimensionResult;
  protocolApplication: DimensionResult; debriefContentId: string;
}>;
export type ClearPenaltyMainRefereeRubricV1 = Readonly<{
  evaluationVersion: 1; classification: "clear"; role: "mainReferee";
  decision: Readonly<{ mode: "exactSemanticMatch"; expected: Readonly<{
    stopPlay: true; restart: "penaltyKick"; discipline: "none"; offenderActorId: string;
  }>; allowUnspecifiedOffenderWhenNoCard: true; evidenceIds: readonly string[] }>;
  observation: Readonly<{ observationRubricVersion: 1; requiredEvidenceIds: readonly string[] }>;
  communication: Readonly<{ mode: "notApplicable"; reason: "noAuthoredCommunicationInput" }>;
  protocol: Readonly<{ mode: "notApplicable"; reason: "initialMainRefereeNoVar" }>;
  debriefContentId: string;
}>;
export type TrustedObservationSummaryV1 = Readonly<{
  status: "scored" | "insufficientEvidence"; score: 0 | 40 | 100 | null;
  eligibleLiveTicks: number;
  evidence: readonly Readonly<{ evidenceId: string; band: "none" | "weak" | "supported" }>[];
}>;
export type TrustedEvaluationContextV1 = Readonly<{
  rubric: ClearPenaltyMainRefereeRubricV1; canonicalActorIds: readonly string[];
  privateEvidenceIds: readonly string[]; preparedDebriefContentIds: readonly string[];
  observationSummary: TrustedObservationSummaryV1;
}>;

function exact(value: unknown, keys: readonly string[], name: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join("|") !== [...keys].sort().join("|"))
    throw new TypeError(`invalid ${name}`);
}
function evidenceIds(ids: unknown, known: readonly string[]): asserts ids is readonly string[] {
  if (!Array.isArray(ids) || ids.length === 0 || new Set(ids).size !== ids.length
    || ids.some((id) => typeof id !== "string" || !known.includes(id)))
    throw new TypeError("invalid rubric evidence IDs");
}
function validateRubric(context: TrustedEvaluationContextV1): void {
  const r = context.rubric;
  exact(r, ["evaluationVersion", "classification", "role", "decision", "observation",
    "communication", "protocol", "debriefContentId"], "rubric");
  if (r.evaluationVersion !== 1 || r.classification !== "clear" || r.role !== "mainReferee")
    throw new TypeError("unsupported rubric");
  exact(r.decision, ["mode", "expected", "allowUnspecifiedOffenderWhenNoCard", "evidenceIds"], "decision rubric");
  exact(r.decision.expected, ["stopPlay", "restart", "discipline", "offenderActorId"], "expected decision");
  if (r.decision.mode !== "exactSemanticMatch" || r.decision.allowUnspecifiedOffenderWhenNoCard !== true
    || r.decision.expected.stopPlay !== true || r.decision.expected.restart !== "penaltyKick"
    || r.decision.expected.discipline !== "none"
    || !context.canonicalActorIds.includes(r.decision.expected.offenderActorId))
    throw new TypeError("invalid decision rubric");
  exact(r.observation, ["observationRubricVersion", "requiredEvidenceIds"], "observation rubric");
  if (r.observation.observationRubricVersion !== 1) throw new TypeError("unsupported observation rubric");
  evidenceIds(r.decision.evidenceIds, context.privateEvidenceIds);
  evidenceIds(r.observation.requiredEvidenceIds, context.privateEvidenceIds);
  exact(r.communication, ["mode", "reason"], "communication rubric");
  exact(r.protocol, ["mode", "reason"], "protocol rubric");
  if (r.communication.mode !== "notApplicable" || r.communication.reason !== "noAuthoredCommunicationInput"
    || r.protocol.mode !== "notApplicable" || r.protocol.reason !== "initialMainRefereeNoVar"
    || !context.preparedDebriefContentIds.includes(r.debriefContentId))
    throw new TypeError("invalid rubric applicability or debrief");
}
function validateSummary(summary: TrustedObservationSummaryV1, required: readonly string[]): void {
  exact(summary, ["status", "score", "eligibleLiveTicks", "evidence"], "observation summary");
  if (!Number.isSafeInteger(summary.eligibleLiveTicks) || summary.eligibleLiveTicks < 0
    || !Array.isArray(summary.evidence) || summary.evidence.length !== required.length)
    throw new TypeError("invalid observation summary");
  const bands = summary.evidence.map((entry, index) => {
    if (entry.evidenceId !== required[index] || !["none", "weak", "supported"].includes(entry.band))
      throw new TypeError("observation evidence mismatch");
    return { none: 0, weak: 40, supported: 100 }[entry.band as "none" | "weak" | "supported"];
  });
  const expectedScore = Math.min(...bands);
  if (summary.eligibleLiveTicks === 0 ? summary.status !== "insufficientEvidence" || summary.score !== null
    : summary.status !== "scored" || summary.score !== expectedScore)
    throw new TypeError("observation score mismatch");
}

/** Caller must bind the private rubric and recomputed C2 summary to the same pinned server scenario/trace. */
export function evaluateClearPenaltyMainRefereeV1(
  decision: NormalizedDecision, context: TrustedEvaluationContextV1,
): EvaluationResult {
  validateRubric(context);
  const { rubric, observationSummary } = context;
  validateSummary(observationSummary, rubric.observation.requiredEvidenceIds);
  const expected = rubric.decision.expected;
  const mismatches = [
    decision.stopPlay !== expected.stopPlay ? "stopMismatch" : null,
    decision.restart !== expected.restart ? "restartMismatch" : null,
    decision.discipline !== expected.discipline ? "disciplineMismatch" : null,
    decision.offenderActorId !== null && decision.offenderActorId !== expected.offenderActorId ? "offenderMismatch" : null,
  ].filter((code): code is string => code !== null);
  const decisionQuality: DimensionResult = Object.freeze({ status: "scored", score: mismatches.length ? 0 : 100,
    reasonCodes: Object.freeze(mismatches), evidenceIds: Object.freeze([...rubric.decision.evidenceIds]) });
  const observationAndPositioning: DimensionResult = Object.freeze({ status: observationSummary.status,
    score: observationSummary.score,
    reasonCodes: Object.freeze(observationSummary.status === "insufficientEvidence"
      ? ["noEligibleLiveReceipt"] : []),
    evidenceIds: Object.freeze(observationSummary.status === "scored"
      ? [...rubric.observation.requiredEvidenceIds] : []) });
  const communication: DimensionResult = Object.freeze({ status: "notApplicable", score: null,
    reasonCodes: Object.freeze(["noAuthoredCommunicationInput"]), evidenceIds: Object.freeze([]) });
  const protocolApplication: DimensionResult = Object.freeze({ status: "notApplicable", score: null,
    reasonCodes: Object.freeze(["initialMainRefereeNoVar"]), evidenceIds: Object.freeze([]) });
  return Object.freeze({ evaluationVersion: 1, decisionQuality, observationAndPositioning,
    communication, protocolApplication, debriefContentId: rubric.debriefContentId });
}
