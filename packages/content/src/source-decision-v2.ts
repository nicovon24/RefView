import { z } from "zod";
import { canonicalJsonV2 } from "./source-core-v2";

const id = z.string().min(1);
const optionsSchema = z.array(z.strictObject({
  optionId: z.string().regex(/^opt-[0-9]{3}$/),
  kind: z.enum(["stopPlay", "restart", "discipline"]),
  value: z.union([z.boolean(), z.enum(["playOn", "penaltyKick", "directFreeKick",
    "indirectFreeKick", "droppedBall", "none", "yellow", "red"])]),
}));
const rubricSchema = z.strictObject({
  evaluationVersion: z.literal(1), classification: z.literal("clear"), role: z.literal("mainReferee"),
  decision: z.strictObject({
    mode: z.literal("exactSemanticMatch"),
    expected: z.strictObject({ stopPlay: z.literal(true), restart: z.literal("penaltyKick"),
      discipline: z.literal("none"), offenderActorId: id }),
    allowUnspecifiedOffenderWhenNoCard: z.literal(true),
    evidenceIds: z.array(id).min(1),
  }),
  observation: z.strictObject({ observationRubricVersion: z.literal(1),
    requiredEvidenceIds: z.array(id).min(1) }),
  communication: z.strictObject({ mode: z.literal("notApplicable"),
    reason: z.literal("noAuthoredCommunicationInput") }),
  protocol: z.strictObject({ mode: z.literal("notApplicable"),
    reason: z.literal("initialMainRefereeNoVar") }),
  debriefContentId: id,
});
export type NormalizedDecisionSourceV2 = Readonly<{
  decisionOptions: z.infer<typeof optionsSchema>;
  rubric: z.infer<typeof rubricSchema>;
}>;
const requiredChoices = ["stopPlay:false", "stopPlay:true", "restart:playOn",
  "restart:directFreeKick", "restart:indirectFreeKick", "restart:droppedBall",
  "restart:penaltyKick", "discipline:none", "discipline:yellow", "discipline:red"];
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${label}`);
}

/** Binds neutral public choices to the first incident's private decision rubric. */
export function normalizeDecisionSourceV2(
  optionsInput: unknown, rubricInput: unknown, evidenceIds: readonly string[],
  canonicalActorIds: readonly string[], preparedDebriefContentId: string,
): NormalizedDecisionSourceV2 {
  const decisionOptions = optionsSchema.parse(JSON.parse(canonicalJsonV2(optionsInput)));
  const rubric = rubricSchema.parse(JSON.parse(canonicalJsonV2(rubricInput)));
  unique(decisionOptions.map((option) => option.optionId), "option ID");
  const choices = decisionOptions.map((option) => `${option.kind}:${option.value}`);
  if (choices.length !== requiredChoices.length || new Set(choices).size !== requiredChoices.length ||
    requiredChoices.some((choice) => !choices.includes(choice))) {
    throw new Error("incomplete neutral decision options");
  }
  if (decisionOptions.some((option) => option.kind === "stopPlay" ? typeof option.value !== "boolean"
    : option.kind === "restart" ? !["playOn", "penaltyKick", "directFreeKick",
      "indirectFreeKick", "droppedBall"].includes(String(option.value))
      : !["none", "yellow", "red"].includes(String(option.value)))) {
    throw new Error("invalid decision option pairing");
  }
  if (!canonicalActorIds.includes(rubric.decision.expected.offenderActorId) ||
    rubric.debriefContentId !== preparedDebriefContentId) {
    throw new Error("rubric identity mismatch");
  }
  for (const ids of [rubric.decision.evidenceIds, rubric.observation.requiredEvidenceIds]) {
    unique(ids, "rubric evidence ID");
    if (ids.some((item) => !evidenceIds.includes(item))) throw new Error("unknown rubric evidence ID");
    ids.sort();
  }
  if (!rubric.observation.requiredEvidenceIds.includes("EV-TRIP-CONTACT") ||
    !rubric.observation.requiredEvidenceIds.includes("EV-INSIDE-AREA")) {
    throw new Error("missing decisive evidence");
  }
  decisionOptions.sort((a, b) => a.optionId < b.optionId ? -1 : a.optionId > b.optionId ? 1 : 0);
  return freeze({ decisionOptions, rubric });
}
