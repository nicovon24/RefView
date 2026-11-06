import { createHash } from "node:crypto";
import { canonicalJsonV2 } from "@refview/content";
import { z } from "zod";
import { editorialLesson } from "./editorial-lesson";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const text = z.string().min(1).max(4096).refine((value) => value === value.trim() && !/[<>]/u.test(value));
const positive = z.number().int().refine(Number.isSafeInteger).positive();
const locale = z.enum(["es", "en"]);
const translated = z.strictObject({ es: text, en: text });
const sourceIdList = z.array(slug).min(1);
const sourceSchema = z.strictObject({
  sourceId: slug,
  publisher: z.literal("IFAB"),
  edition: z.literal("IFAB-2026-27"),
  language: locale,
  documentUrl: z.enum([
    "https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en",
    "https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es",
  ]),
  lawNumber: positive.max(17),
  sectionCode: z.string().regex(/^[0-9]{1,2}\.(?:[0-9]+|[a-z]+)$/).max(30),
  displayLabel: text,
  printedPage: positive,
  inspectedAt: z.iso.date(),
  inspectedArtifactSha256: z.string().regex(/^sha256:[0-9a-f]{64}$/),
});
const followUpSchema = z.strictObject({
  followUpId: slug,
  question: translated,
  answer: translated,
  sourceIds: z.strictObject({ es: sourceIdList, en: sourceIdList }),
});
const practiceSchema = z.strictObject({
  kind: z.enum(["assessment", "scenario"]),
  targetId: slug,
  targetVersion: positive,
  topicId: z.literal("challenge"),
  lawsEdition: z.literal("IFAB-2026-27"),
});
const lessonSchema = z.strictObject({
  schemaVersion: z.literal(1),
  lessonId: slug,
  version: positive,
  lawsEdition: z.literal("IFAB-2026-27"),
  topicId: z.literal("challenge"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  localized: z.strictObject({
    es: z.strictObject({ title: text, lead: text, plainExplanation: text, technicalExplanation: text }),
    en: z.strictObject({ title: text, lead: text, plainExplanation: text, technicalExplanation: text }),
  }),
  example: z.strictObject({ facts: translated, evidence: translated, interpretation: translated, ruleApplication: translated }),
  officialSources: z.array(sourceSchema).min(2),
  preparedFollowUps: z.array(followUpSchema),
  practiceRefs: z.array(practiceSchema),
});

export type AcademyLessonSourceV1 = Readonly<z.infer<typeof lessonSchema>>;

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

const compareId = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;

export function compileAcademyLessonSourceV1(input: unknown): {
  source: AcademyLessonSourceV1;
  contentHash: `sha256:${string}`;
} {
  // Canonical JSON checks descriptors and prototypes before Zod reads author-controlled properties.
  const detached = JSON.parse(canonicalJsonV2(input)) as unknown;
  const source = lessonSchema.parse(detached);
  if (!unique(source.officialSources.map(({ sourceId }) => sourceId))) throw new Error("duplicate source ID");
  if (!unique(source.preparedFollowUps.map(({ followUpId }) => followUpId))) throw new Error("duplicate follow-up ID");
  const sourceById = new Map(source.officialSources.map((item) => [item.sourceId, item]));
  const enUrl = "https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en";
  const esUrl = "https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es";
  for (const item of source.officialSources) {
    if (item.documentUrl !== (item.language === "en" ? enUrl : esUrl)) throw new Error("source URL/language mismatch");
  }
  const locators = (language: "es" | "en") => source.officialSources
    .filter((item) => item.language === language)
    .map((item) => `${item.lawNumber}:${item.sectionCode}`).sort();
  if (locators("es").length === 0 || locators("en").length === 0
    || !unique(locators("es")) || !unique(locators("en"))
    || JSON.stringify(locators("es")) !== JSON.stringify(locators("en"))) {
    throw new Error("official source locale coverage mismatch");
  }
  for (const followUp of source.preparedFollowUps) {
    for (const language of ["es", "en"] as const) {
      const ids = followUp.sourceIds[language];
      if (!unique(ids) || ids.some((id) => sourceById.get(id)?.language !== language)) {
        throw new Error("invalid follow-up source IDs");
      }
      ids.sort();
    }
  }
  const practiceKeys = source.practiceRefs.map((ref) => `${ref.kind}:${ref.targetId}:${ref.targetVersion}`);
  if (!unique(practiceKeys)) throw new Error("duplicate practice reference");
  source.officialSources.sort((a, b) => compareId(a.sourceId, b.sourceId));
  source.preparedFollowUps.sort((a, b) => compareId(a.followUpId, b.followUpId));
  source.practiceRefs.sort((a, b) =>
    compareId(a.kind, b.kind) || compareId(a.targetId, b.targetId) || a.targetVersion - b.targetVersion);
  const contentHash = `sha256:${createHash("sha256")
    .update(canonicalJsonV2(["refview-academy-lesson-v1", source]), "utf8").digest("hex")}` as const;
  return { source: freezeDeep(source), contentHash };
}

const digest = {
  en: "sha256:89398520b353c6d995a1bb2557c97dc3c5aa1712c1d3009589f580a5a23c6a7d",
  es: "sha256:5c4d4795af674701c934030416132835357d039fd6a68b248baf738714ebe7ab",
} as const;
const url = { en: editorialLesson.sources.en.url, es: editorialLesson.sources.es.url };
const reference = (language: "es" | "en", sourceId: string, lawNumber: number,
  sectionCode: string, displayLabel: string, printedPage: number) => ({
    sourceId: `${sourceId}-${language}`,
    publisher: "IFAB" as const,
    edition: "IFAB-2026-27" as const,
    language,
    documentUrl: url[language],
    lawNumber,
    sectionCode,
    displayLabel,
    printedPage,
    inspectedAt: language === "en" ? "2026-11-03" : "2026-11-04",
    inspectedArtifactSha256: digest[language],
  });

const draft = {
  schemaVersion: 1,
  lessonId: editorialLesson.lessonId,
  version: editorialLesson.version,
  lawsEdition: "IFAB-2026-27",
  topicId: "challenge",
  level: "beginner",
  localized: {
    es: { title: editorialLesson.localized.es.title, lead: editorialLesson.localized.es.introduction,
      plainExplanation: editorialLesson.localized.es.plain, technicalExplanation: editorialLesson.localized.es.technical },
    en: { title: editorialLesson.localized.en.title, lead: editorialLesson.localized.en.introduction,
      plainExplanation: editorialLesson.localized.en.plain, technicalExplanation: editorialLesson.localized.en.technical },
  },
  example: {
    facts: { es: editorialLesson.localized.es.facts, en: editorialLesson.localized.en.facts },
    evidence: { es: editorialLesson.localized.es.evidence, en: editorialLesson.localized.en.evidence },
    interpretation: { es: editorialLesson.localized.es.interpretation, en: editorialLesson.localized.en.interpretation },
    ruleApplication: { es: editorialLesson.localized.es.application, en: editorialLesson.localized.en.application },
  },
  officialSources: [
    reference("en", "law-1-area-boundary", 1, "1.2", "Law 1 §2, p. 45", 45),
    reference("es", "law-1-area-boundary", 1, "1.2", "Regla 1 §2, p. 49", 49),
    reference("en", "law-1-lines", 1, "1.6", "Law 1 §6, p. 48", 48),
    reference("es", "law-1-lines", 1, "1.6", "Regla 1 §6, p. 52", 52),
    reference("en", "law-12-direct-free-kick", 12, "12.1", "Law 12 §12.1, pp. 115–116", 115),
    reference("es", "law-12-direct-free-kick", 12, "12.1", "Regla 12 §12.1, pp. 123–124", 123),
    reference("en", "law-12-dogso", 12, "12.dogso", "Law 12 DOGSO, p. 124", 124),
    reference("es", "law-12-dogso", 12, "12.dogso", "Regla 12 DOGSO, p. 133", 133),
    reference("en", "law-14-penalty", 14, "14.intro", "Law 14 opening rule, p. 135", 135),
    reference("es", "law-14-penalty", 14, "14.intro", "Regla 14 disposición inicial, p. 145", 145),
  ],
  preparedFollowUps: editorialLesson.localized.en.followUps.map((en, index) => ({
    followUpId: ["why-penalty", "why-no-card", "on-area-line", "reckless-challenge"][index],
    question: { es: editorialLesson.localized.es.followUps[index].question, en: en.question },
    answer: { es: editorialLesson.localized.es.followUps[index].answer, en: en.answer },
    sourceIds: {
      es: [["law-12-direct-free-kick-es", "law-14-penalty-es"], ["law-12-direct-free-kick-es"],
        ["law-1-area-boundary-es", "law-1-lines-es"], ["law-12-direct-free-kick-es"]][index],
      en: [["law-12-direct-free-kick-en", "law-14-penalty-en"], ["law-12-direct-free-kick-en"],
        ["law-1-area-boundary-en", "law-1-lines-en"], ["law-12-direct-free-kick-en"]][index],
    },
  })),
  practiceRefs: [{ kind: "assessment", targetId: "careless-trip-penalty-restart", targetVersion: 1,
    topicId: "challenge", lawsEdition: "IFAB-2026-27" }],
};

export const academyLessonSourceV1 = compileAcademyLessonSourceV1(draft).source;
export const academyLessonContentHashV1 = compileAcademyLessonSourceV1(draft).contentHash;
