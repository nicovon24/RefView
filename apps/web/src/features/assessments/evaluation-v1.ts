import 'server-only';
import { createHash } from "node:crypto";
import { canonicalJsonV2 } from "@refview/content";
import { z } from "zod";
import { compileAssessmentSourceV1, type AssessmentSourceV1 } from "./source-v1";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const restart = z.enum(["playOn", "penaltyKick", "directFreeKick", "indirectFreeKick", "droppedBall"]);
const discipline = z.enum(["none", "yellow", "red"]);
const ruleAnswer = z.strictObject({ kind: z.literal("ruleQuestion"), optionId: slug });
const structuredFields = { stopPlay: z.boolean(), restart, discipline,
  offenderHandle: slug.nullable() };
const restartAnswer = z.strictObject({ kind: z.literal("restartDiscipline"), ...structuredFields });
const analysisAnswer = z.strictObject({ kind: z.literal("authoredIncidentAnalysis"),
  ...structuredFields, reasoning: z.string() });

export type AssessmentNormalizedAnswerV1 = z.infer<typeof ruleAnswer>
  | z.infer<typeof restartAnswer> | z.infer<typeof analysisAnswer>;
type CompiledAssessmentV1 = ReturnType<typeof compileAssessmentSourceV1>;

function normalizeReasoning(raw: string, maxCodePoints: number): string {
  if (raw.length > 4096) throw new Error("reasoning input too large");
  const normalized = raw.replace(/\r\n?/g, "\n").normalize("NFC").trim();
  const codePoints = [...normalized];
  if (codePoints.length < 1 || codePoints.length > maxCodePoints) {
    throw new Error("reasoning length out of range");
  }
  if (codePoints.some((character) => {
    const point = character.codePointAt(0)!;
    return (point < 0x20 && point !== 0x0a) || (point >= 0x7f && point <= 0x9f)
      || (point >= 0xd800 && point <= 0xdfff);
  })) throw new Error("reasoning contains disallowed control or invalid Unicode");
  return normalized;
}

export function normalizeAssessmentAnswerV1(source: AssessmentSourceV1,
  input: unknown): AssessmentNormalizedAnswerV1 {
  // Canonical JSON rejects accessors, decorated objects, undefined, and nonfinite values.
  const detached = JSON.parse(canonicalJsonV2(input)) as unknown;
  if (source.type === "ruleQuestion") {
    const answer = ruleAnswer.parse(detached);
    if (!source.inputSpec.options.some((option) => option.optionId === answer.optionId)) {
      throw new Error("unknown option ID");
    }
    return answer;
  }
  const answer = source.type === "authoredIncidentAnalysis"
    ? analysisAnswer.parse(detached) : restartAnswer.parse(detached);
  if (answer.kind !== source.type || answer.stopPlay !== (answer.restart !== "playOn")
    || (answer.discipline !== "none" && answer.offenderHandle === null)
    || (answer.offenderHandle !== null
      && !source.inputSpec.offenderHandles.includes(answer.offenderHandle))) {
    throw new Error("invalid structured assessment answer");
  }
  if (answer.kind === "authoredIncidentAnalysis" && source.type === "authoredIncidentAnalysis") {
    return { ...answer, reasoning: normalizeReasoning(answer.reasoning,
      source.inputSpec.reasoningMaxCodePoints) };
  }
  return answer;
}

export function evaluateAssessmentAnswerV1(compiled: CompiledAssessmentV1, input: unknown) {
  const verified = compileAssessmentSourceV1(compiled.source);
  if (verified.contentHash !== compiled.contentHash || verified.rubricHash !== compiled.rubricHash) {
    throw new Error("assessment source hash mismatch");
  }
  const { source, contentHash, rubricHash } = verified;
  const normalizedAnswer = normalizeAssessmentAnswerV1(source, input);
  const semanticAnswer = normalizedAnswer.kind === "authoredIncidentAnalysis"
    ? { kind: normalizedAnswer.kind, stopPlay: normalizedAnswer.stopPlay,
      restart: normalizedAnswer.restart, discipline: normalizedAnswer.discipline,
      offenderHandle: normalizedAnswer.offenderHandle }
    : normalizedAnswer;
  const accepted = source.privateRubric.acceptedAnswers.some((answer) =>
    canonicalJsonV2(answer) === canonicalJsonV2(semanticAnswer));
  const submissionDigest = `sha256:${createHash("sha256").update(canonicalJsonV2([
    "refview-assessment-submission-v1", source.itemId, source.version,
    contentHash, normalizedAnswer,
  ]), "utf8").digest("hex")}` as const;
  const notApplicable = { status: "notApplicable", score: null } as const;
  return {
    normalizedAnswer,
    submissionDigest,
    result: {
      itemId: source.itemId,
      version: source.version,
      contentHash,
      rubricVersion: source.privateRubric.rubricVersion,
      rubricHash,
      algorithmVersion: 1 as const,
      correctionVersion: source.correction.correctionVersion,
      structuredDecision: { status: "scored" as const, score: accepted ? 100 as const : 0 as const,
        reasonCodes: accepted ? [] : ["answerMismatch"],
        evidenceIds: [...source.correction.evidenceIds] },
      reasoning: source.type === "authoredIncidentAnalysis"
        ? { status: "unscored" as const, score: null,
          dimensions: source.privateRubric.reasoningDimensions.map((dimension) => ({
            dimensionId: dimension.dimensionId, status: "unscored" as const, score: null,
          })) }
        : { ...notApplicable, dimensions: [] },
      positioning: { ...notApplicable },
      communication: { ...notApplicable },
      protocol: { ...notApplicable },
    },
  };
}
