import 'server-only';
import { createHash } from "node:crypto";
import { canonicalJsonV2 } from "@refview/content";
import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const prose = z.string().min(1).max(4096).refine((value) => value === value.trim() && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value));
const positive = z.number().int().refine(Number.isSafeInteger).positive();
const language = z.enum(["es", "en"]);
const translated = z.strictObject({ es: prose, en: prose });
const edition = z.literal("IFAB-2026-27");
const topic = z.literal("challenge");
const sourceIdList = z.array(slug).min(1).max(16);
const sourceSchema = z.strictObject({
  sourceId: slug, publisher: z.literal("IFAB"), edition, language,
  documentUrl: z.enum([
    "https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en",
    "https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es",
  ]),
  lawNumber: positive.max(17), sectionCode: z.string().regex(/^[0-9]{1,2}\.(?:[0-9]+|[a-z]+)$/).max(30),
  displayLabel: prose, printedPage: positive, inspectedAt: z.iso.date(),
  inspectedArtifactSha256: z.string().regex(/^sha256:[0-9a-f]{64}$/),
});
const answerRule = z.strictObject({ kind: z.literal("ruleQuestion"), optionId: slug });
const restart = z.enum(["playOn", "penaltyKick", "directFreeKick", "indirectFreeKick", "droppedBall"]);
const discipline = z.enum(["none", "yellow", "red"]);
const structuredAnswer = <K extends "restartDiscipline" | "authoredIncidentAnalysis">(kind: K) => z.strictObject({
  kind: z.literal(kind), stopPlay: z.boolean(), restart, discipline, offenderHandle: slug.nullable(),
});
const reasoningDimension = z.strictObject({
  dimensionId: z.enum(["relevantFact", "ruleConnection", "decisionJustification"]),
  prompt: translated, status: z.literal("unscored"),
});
const rubric = <A extends z.ZodType>(answer: A) => z.strictObject({
  rubricVersion: z.literal(1), acceptedAnswers: z.array(answer).min(1).max(8),
  reasoningDimensions: z.array(reasoningDimension).max(3),
});
const common = {
  schemaVersion: z.literal(1), itemId: slug, version: positive, lawsEdition: edition,
  topicId: topic, level: z.enum(["beginner", "intermediate", "advanced"]),
  localized: z.strictObject({ es: z.strictObject({ title: prose, prompt: prose }),
    en: z.strictObject({ title: prose, prompt: prose }) }),
  publicEvidence: z.array(z.strictObject({ evidenceId: slug, text: translated })).min(1).max(16),
  correction: z.strictObject({ correctionVersion: z.literal(1), summary: translated,
    explanation: translated, evidenceIds: sourceIdList,
    sourceIds: z.strictObject({ es: sourceIdList, en: sourceIdList }) }),
  officialSources: z.array(sourceSchema).min(2).max(16),
  recommendationRefs: z.array(z.strictObject({ targetItemId: slug, targetVersion: positive,
    topicId: topic, lawsEdition: edition })).max(16),
};
const ruleItem = z.strictObject({ ...common, type: z.literal("ruleQuestion"),
  inputSpec: z.strictObject({ kind: z.literal("ruleQuestion"), options: z.array(z.strictObject({
    optionId: slug, label: translated,
  })).min(2).max(5) }), privateRubric: rubric(answerRule) });
const restartItem = z.strictObject({ ...common, type: z.literal("restartDiscipline"),
  inputSpec: z.strictObject({ kind: z.literal("restartDiscipline"), offenderHandles: z.array(slug).max(16) }),
  privateRubric: rubric(structuredAnswer("restartDiscipline")) });
const analysisItem = z.strictObject({ ...common, type: z.literal("authoredIncidentAnalysis"),
  inputSpec: z.strictObject({ kind: z.literal("authoredIncidentAnalysis"), offenderHandles: z.array(slug).max(16),
    reasoningRequired: z.literal(true), reasoningMaxCodePoints: z.literal(600) }),
  privateRubric: rubric(structuredAnswer("authoredIncidentAnalysis")) });
const itemSchema = z.discriminatedUnion("type", [ruleItem, restartItem, analysisItem]);
export type AssessmentSourceV1 = z.infer<typeof itemSchema>;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const unique = (values: readonly string[]) => new Set(values).size === values.length;
function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}
function hash(value: unknown): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(canonicalJsonV2(value), "utf8").digest("hex")}`;
}
export function compileAssessmentSourceV1(input: unknown): {
  source: AssessmentSourceV1; contentHash: `sha256:${string}`; rubricHash: `sha256:${string}`;
} {
  const source = itemSchema.parse(JSON.parse(canonicalJsonV2(input)));
  const ids = source.officialSources.map((entry) => entry.sourceId);
  if (!unique(ids)) throw new Error("duplicate source ID");
  const sourceById = new Map(source.officialSources.map((entry) => [entry.sourceId, entry]));
  for (const entry of source.officialSources) {
    const suffix = entry.language === "en" ? "laws-of-the-game-202627-single-pages?l=en"
      : "reglas-de-juego-202627-paginas-individuales?l=es";
    if (!entry.documentUrl.endsWith(suffix)) throw new Error("source URL/language mismatch");
  }
  const locators = (locale: "es" | "en") => source.officialSources.filter((entry) => entry.language === locale)
    .map((entry) => `${entry.lawNumber}:${entry.sectionCode}`).sort();
  if (!locators("es").length || !locators("en").length || !unique(locators("es"))
    || !unique(locators("en")) || canonicalJsonV2(locators("es")) !== canonicalJsonV2(locators("en"))) {
    throw new Error("official source locale coverage mismatch");
  }
  const evidenceIds = source.publicEvidence.map((entry) => entry.evidenceId);
  if (!unique(evidenceIds) || !unique(source.correction.evidenceIds)
    || source.correction.evidenceIds.some((id) => !evidenceIds.includes(id))) throw new Error("invalid evidence ID");
  for (const locale of ["es", "en"] as const) {
    const refs = source.correction.sourceIds[locale];
    if (!unique(refs) || refs.some((id) => sourceById.get(id)?.language !== locale)) {
      throw new Error("invalid correction source ID");
    }
    refs.sort(compare);
  }
  const handles = source.type === "ruleQuestion" ? [] : source.inputSpec.offenderHandles;
  if (!unique(handles)) throw new Error("duplicate offender handle");
  if (source.type === "ruleQuestion") {
    const options = source.inputSpec.options.map((entry) => entry.optionId);
    if (!unique(options) || source.privateRubric.acceptedAnswers.some((answer) => !options.includes(answer.optionId))) {
      throw new Error("invalid accepted option");
    }
    source.inputSpec.options.sort((a, b) => compare(a.optionId, b.optionId));
  } else {
    source.inputSpec.offenderHandles.sort(compare);
    for (const answer of source.privateRubric.acceptedAnswers) {
      if (answer.stopPlay !== (answer.restart !== "playOn")
        || (answer.discipline !== "none" && answer.offenderHandle === null)
        || (answer.offenderHandle !== null && !handles.includes(answer.offenderHandle))) {
        throw new Error("impossible accepted answer");
      }
    }
  }
  const dimensions = source.privateRubric.reasoningDimensions;
  if (source.type === "authoredIncidentAnalysis") {
    if (dimensions.length !== 3 || !unique(dimensions.map((entry) => entry.dimensionId))
      || dimensions.map((entry) => entry.dimensionId).sort().join("|")
        !== "decisionJustification|relevantFact|ruleConnection") throw new Error("invalid reasoning dimensions");
  } else if (dimensions.length) throw new Error("unexpected reasoning dimensions");
  dimensions.sort((a, b) => compare(a.dimensionId, b.dimensionId));
  source.privateRubric.acceptedAnswers.sort((a, b) => compare(canonicalJsonV2(a), canonicalJsonV2(b)));
  if (!unique(source.privateRubric.acceptedAnswers.map(canonicalJsonV2))) throw new Error("duplicate accepted answer");
  source.publicEvidence.sort((a, b) => compare(a.evidenceId, b.evidenceId));
  source.correction.evidenceIds.sort(compare);
  source.officialSources.sort((a, b) => compare(a.sourceId, b.sourceId));
  const refs = source.recommendationRefs;
  const refKey = (ref: typeof refs[number]) => `${ref.targetItemId}:${ref.targetVersion}`;
  if (!unique(refs.map(refKey))) throw new Error("duplicate recommendation");
  refs.sort((a, b) => compare(refKey(a), refKey(b)));
  return { source: freezeDeep(source), contentHash: hash(["refview-assessment-item-v1", source]),
    rubricHash: hash(["refview-assessment-rubric-v1", source.privateRubric]) };
}

const digest = {
  en: "sha256:89398520b353c6d995a1bb2557c97dc3c5aa1712c1d3009589f580a5a23c6a7d",
  es: "sha256:5c4d4795af674701c934030416132835357d039fd6a68b248baf738714ebe7ab",
};
const url = {
  en: "https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en",
  es: "https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es",
};
const source = (locale: "es" | "en", name: string, lawNumber: number, sectionCode: string,
  displayLabel: string, printedPage: number) => ({
  sourceId: `${name}-${locale}`, publisher: "IFAB", edition: "IFAB-2026-27", language: locale,
  documentUrl: url[locale], lawNumber, sectionCode, displayLabel, printedPage,
  inspectedAt: locale === "en" ? "2026-11-03" : "2026-11-04",
  inspectedArtifactSha256: digest[locale],
});
const law12 = [source("es", "law-12-direct-free-kick", 12, "12.1", "Regla 12 §1, p. 123", 123),
  source("en", "law-12-direct-free-kick", 12, "12.1", "Law 12 §1, p. 115", 115)];
const law14 = [source("es", "law-14-penalty", 14, "14.intro", "Regla 14 disposición inicial, p. 145", 145),
  source("en", "law-14-penalty", 14, "14.intro", "Law 14 opening rule, p. 135", 135)];
const dogso = [source("es", "law-12-dogso", 12, "12.dogso", "Regla 12 DOGSO, p. 133", 133),
  source("en", "law-12-dogso", 12, "12.dogso", "Law 12 DOGSO, p. 124", 124)];
const commonDraft = { schemaVersion: 1, version: 1, lawsEdition: "IFAB-2026-27", topicId: "challenge",
  recommendationRefs: [] };
const drafts = [
  { ...commonDraft, itemId: "careless-trip-penalty-restart", level: "beginner", type: "restartDiscipline",
    recommendationRefs: [{ targetItemId: "reckless-challenge-not-dogso", targetVersion: 1,
      topicId: "challenge", lawsEdition: "IFAB-2026-27" }],
    localized: { es: { title: "Zancadilla imprudente en el área", prompt: "Según los hechos escritos, ¿debe detenerse el juego, cuál es la reanudación, hay sanción disciplinaria y quién cometió la infracción?" },
      en: { title: "Careless trip in the penalty area", prompt: "Using the written facts, should play be stopped, what is the restart, is there a disciplinary sanction, and who committed the offence?" } },
    publicEvidence: [{ evidenceId: "authored-facts", text: {
      es: "Caso ficticio escrito: el balón está en juego. defence-04 disputa el balón, no lo toca y zancadillea de forma imprudente a attack-09 dentro de su propia área penal. La acción no es temeraria ni usa fuerza excesiva. No hay otra conducta sancionable y los hechos no establecen una ocasión manifiesta de gol.",
      en: "Written fictional case: the ball is in play. defence-04 challenges for the ball, does not touch it, and carelessly trips attack-09 inside the defender's own penalty area. The action is neither reckless nor excessive. There is no other card-worthy conduct, and the facts do not establish an obvious goal-scoring opportunity." } }],
    inputSpec: { kind: "restartDiscipline", offenderHandles: ["defence-04"] },
    privateRubric: { rubricVersion: 1, acceptedAnswers: [{ kind: "restartDiscipline", stopPlay: true,
      restart: "penaltyKick", discipline: "none", offenderHandle: "defence-04" }], reasoningDimensions: [] },
    correction: { correctionVersion: 1,
      summary: { es: "Penalti sin tarjeta para defence-04.", en: "Penalty kick without a card for defence-04." },
      explanation: { es: "La zancadilla imprudente con el balón en juego es una infracción de tiro libre directo. Al cometerse dentro de la propia área penal, se sanciona con penalti. La imprudencia, sin otra conducta sancionable, no exige tarjeta; los hechos escritos tampoco establecen DOGSO.",
        en: "A careless trip while the ball is in play is a direct-free-kick offence. Because it occurs inside the offender's own penalty area, the restart is a penalty kick. Carelessness alone, with no other card-worthy conduct, does not require a card; the written facts also do not establish DOGSO." },
      evidenceIds: ["authored-facts"], sourceIds: { es: ["law-12-direct-free-kick-es", "law-14-penalty-es"],
        en: ["law-12-direct-free-kick-en", "law-14-penalty-en"] } }, officialSources: [...law12, ...law14] },
  { ...commonDraft, itemId: "challenge-severity-rule", level: "beginner", type: "ruleQuestion",
    recommendationRefs: [{ targetItemId: "careless-trip-penalty-restart", targetVersion: 1,
      topicId: "challenge", lawsEdition: "IFAB-2026-27" }],
    localized: { es: { title: "Entrada temeraria", prompt: "Un defensor disputa el balón y el árbitro juzga que la entrada fue temeraria; hubo contacto con un adversario. ¿Qué combinación describe correctamente la Regla 12?" },
      en: { title: "Reckless challenge", prompt: "A defender challenges for the ball and the referee judges the challenge reckless; it involved contact with an opponent. Which combination correctly applies Law 12?" } },
    publicEvidence: [{ evidenceId: "severity-thresholds", text: {
      es: "La Regla 12 distingue una entrada imprudente, una temeraria que desatiende el peligro para un adversario y el uso de fuerza excesiva que pone en peligro su integridad.",
      en: "Law 12 distinguishes a careless challenge, a reckless one that disregards danger to an opponent, and excessive force that endangers an opponent's safety." } }],
    inputSpec: { kind: "ruleQuestion", options: [
      { optionId: "choice-a", label: { es: "Tiro libre directo y amonestación.", en: "Direct free kick and caution." } },
      { optionId: "choice-b", label: { es: "Tiro libre directo sin sanción disciplinaria.", en: "Direct free kick without discipline." } },
      { optionId: "choice-c", label: { es: "Tiro libre directo y expulsión en toda entrada temeraria.", en: "Direct free kick and sending-off for every reckless challenge." } },
      { optionId: "choice-d", label: { es: "Tiro libre indirecto.", en: "Indirect free kick." } },
    ] }, privateRubric: { rubricVersion: 1, acceptedAnswers: [{ kind: "ruleQuestion", optionId: "choice-a" }], reasoningDimensions: [] },
    correction: { correctionVersion: 1,
      summary: { es: "Tiro libre directo y amonestación.", en: "Direct free kick and caution." },
      explanation: { es: "Una entrada temeraria con contacto se sanciona con tiro libre directo y amonestación. Una entrada solo imprudente no exige tarjeta; el uso de fuerza excesiva corresponde a la expulsión.",
        en: "A reckless challenge involving contact is punished by a direct free kick and caution. A merely careless challenge needs no card; excessive force calls for a sending-off." },
      evidenceIds: ["severity-thresholds"], sourceIds: { es: ["law-12-direct-free-kick-es"], en: ["law-12-direct-free-kick-en"] } },
    officialSources: [...law12] },
  { ...commonDraft, itemId: "reckless-challenge-not-dogso", level: "intermediate", type: "authoredIncidentAnalysis",
    recommendationRefs: [{ targetItemId: "challenge-severity-rule", targetVersion: 1,
      topicId: "challenge", lawsEdition: "IFAB-2026-27" }],
    localized: { es: { title: "Entrada temeraria sin DOGSO", prompt: "Según los hechos escritos, decide si detener el juego, la reanudación, la sanción y el infractor. Explica brevemente por qué corresponde una amonestación aunque no haya DOGSO. La explicación se guarda para autoevaluación y no recibe puntuación automática." },
      en: { title: "Reckless challenge without DOGSO", prompt: "Using the written facts, decide whether to stop play, the restart, the sanction, and the offender. Briefly explain why a caution applies even without DOGSO. Your explanation is saved for self-review and receives no automatic score." } },
    publicEvidence: [{ evidenceId: "authored-facts", text: {
      es: "Caso ficticio escrito: defence-07 contacta a attack-11 al disputar el balón fuera del área penal de defence-07. Los hechos establecen una infracción temeraria de tiro libre directo, sin fuerza excesiva. La dirección no es directa hacia la portería, el control del balón es incierto y hay dos defensores que pueden intervenir: no hay ocasión manifiesta de gol. No existe otra conducta sancionable.",
      en: "Written fictional case: defence-07 contacts attack-11 while challenging for the ball outside defence-07's penalty area. The facts establish a reckless direct-free-kick offence without excessive force. The direction is not directly towards goal, ball control is uncertain, and two covering defenders can intervene: there is no obvious goal-scoring opportunity. There is no other misconduct." } }],
    inputSpec: { kind: "authoredIncidentAnalysis", offenderHandles: ["defence-07"], reasoningRequired: true, reasoningMaxCodePoints: 600 },
    privateRubric: { rubricVersion: 1, acceptedAnswers: [{ kind: "authoredIncidentAnalysis", stopPlay: true,
      restart: "directFreeKick", discipline: "yellow", offenderHandle: "defence-07" }], reasoningDimensions: [
      { dimensionId: "relevantFact", status: "unscored", prompt: { es: "Identifica el contacto temerario y los hechos que descartan DOGSO.", en: "Identify the reckless contact and facts excluding DOGSO." } },
      { dimensionId: "ruleConnection", status: "unscored", prompt: { es: "Relaciona la temeridad con la amonestación, independientemente de DOGSO.", en: "Connect recklessness to the caution independently of DOGSO." } },
      { dimensionId: "decisionJustification", status: "unscored", prompt: { es: "Justifica la reanudación y la sanción con los hechos escritos.", en: "Justify the restart and sanction using the written facts." } },
    ] }, correction: { correctionVersion: 1,
      summary: { es: "Tiro libre directo y amonestación a defence-07.", en: "Direct free kick and caution for defence-07." },
      explanation: { es: "La infracción temeraria fuera del área exige tiro libre directo y amonestación. La tarjeta se debe a la temeridad por sí misma. La dirección, el control incierto y los dos defensores que pueden intervenir descartan DOGSO en estos hechos escritos; eso no elimina la amonestación.",
        en: "The reckless offence outside the penalty area requires a direct free kick and caution. Recklessness itself warrants the card. The direction, uncertain control, and two covering defenders exclude DOGSO in these written facts; that does not remove the caution." },
      evidenceIds: ["authored-facts"], sourceIds: { es: ["law-12-direct-free-kick-es", "law-12-dogso-es"],
        en: ["law-12-direct-free-kick-en", "law-12-dogso-en"] } }, officialSources: [...law12, ...dogso] },
];

// Server-only editorial candidates. No publication state or trusted review record is created here.
export const assessmentDraftsV1 = drafts.map((draft) => compileAssessmentSourceV1(draft));
