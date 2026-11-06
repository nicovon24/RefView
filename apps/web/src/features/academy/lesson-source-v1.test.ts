import { describe, expect, it } from "vitest";
import { academyLessonContentHashV1, academyLessonSourceV1, compileAcademyLessonSourceV1, type AcademyLessonSourceV1 } from "./lesson-source-v1";

type Mutable<T> = { -readonly [P in keyof T]: T[P] extends readonly (infer U)[] ? Mutable<U>[] :
  T[P] extends object ? Mutable<T[P]> : T[P] };
type Input = Mutable<AcademyLessonSourceV1>;
const clone = (): Input => structuredClone(academyLessonSourceV1) as Input;

describe("Academy lesson source v1", () => {
  it("normalizes the bilingual draft and derives a stable hash", () => {
    const compiled = compileAcademyLessonSourceV1(clone());
    expect(compiled.source).toEqual(academyLessonSourceV1);
    expect(compiled.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(compiled.contentHash).toBe(academyLessonContentHashV1);
    expect(compiled.contentHash).toBe("sha256:4056b7d5cac8d8886003602464dd82cb633fbc74e198c49597049a52cdf59f6b");
    expect(Object.isFrozen(compiled.source)).toBe(true);
    expect(compiled.source.practiceRefs).toEqual([{ kind: "assessment", targetId: "careless-trip-penalty-restart",
      targetVersion: 1, topicId: "challenge", lawsEdition: "IFAB-2026-27" }]);
    const reordered = clone();
    reordered.officialSources.reverse();
    reordered.preparedFollowUps.reverse();
    expect(compileAcademyLessonSourceV1(reordered).contentHash).toBe(compiled.contentHash);
  });

  it("hashes each localized explanation and authored example category", () => {
    const baseline = compileAcademyLessonSourceV1(clone()).contentHash;
    const localizedFields = ["title", "lead", "plainExplanation", "technicalExplanation"] as const;
    const exampleFields = ["facts", "evidence", "interpretation", "ruleApplication"] as const;
    for (const language of ["es", "en"] as const) {
      for (const field of localizedFields) {
        const input = clone();
        input.localized[language][field] += " Revision.";
        expect(compileAcademyLessonSourceV1(input).contentHash, `${language} localized ${field}`).not.toBe(baseline);
      }
      for (const field of exampleFields) {
        const input = clone();
        input.example[field][language] += " Revision.";
        expect(compileAcademyLessonSourceV1(input).contentHash, `${language} example ${field}`).not.toBe(baseline);
      }
    }
  });

  it("hashes valid source, follow-up, and practice changes", () => {
    const baseline = compileAcademyLessonSourceV1(clone()).contentHash;
    const cases: Array<[string, (source: Input) => void]> = [
      ["source page", (source) => { source.officialSources[0].printedPage += 1; }],
      ["source digest", (source) => { const item = source.officialSources[0];
        item.inspectedArtifactSha256 = item.inspectedArtifactSha256.slice(0, -1) + "0"; }],
      ["source ID", (source) => { source.officialSources.find((item) => item.sourceId === "law-12-dogso-en")!.sourceId = "law-12-dogso-reviewed-en"; }],
      ["source display label", (source) => { source.officialSources[0].displayLabel += " (reviewed)"; }],
      ["source inspection date", (source) => { source.officialSources[0].inspectedAt = "2026-11-05"; }],
      ["follow-up question", (source) => { source.preparedFollowUps[0].question.es += " Revisión."; }],
      ["follow-up answer", (source) => { source.preparedFollowUps[0].answer.en += " Revision."; }],
      ["follow-up ID", (source) => { source.preparedFollowUps[0].followUpId = "why-penalty-reviewed"; }],
      ["follow-up source ID", (source) => { source.preparedFollowUps[0].sourceIds.en = ["law-12-dogso-en"]; }],
      ["practice mapping", (source) => { source.practiceRefs.push({ kind: "assessment", targetId: "practice-001",
        targetVersion: 1, topicId: "challenge", lawsEdition: "IFAB-2026-27" }); }],
    ];
    for (const [label, mutate] of cases) {
      const input = clone();
      mutate(input);
      const compiled = compileAcademyLessonSourceV1(input);
      expect(compiled.contentHash, label).not.toBe(baseline);
      expect(compiled.source.practiceRefs).toHaveLength(label === "practice mapping" ? 2 : 1);
    }
  });

  it("rejects missing fields, unknown fields, duplicate IDs, mixed editions, and incomplete sources", () => {
    const cases: Array<(source: Input) => void> = [
      (source) => { Reflect.deleteProperty(source.localized.es, "lead"); },
      (source) => { Object.assign(source.example.facts, { extra: "hidden" }); },
      (source) => { source.officialSources.push({ ...source.officialSources[0] }); },
      (source) => { source.preparedFollowUps.push({ ...source.preparedFollowUps[0] }); },
      (source) => { Object.assign(source.officialSources[0], { edition: "IFAB-2025-26" }); },
      (source) => { Reflect.deleteProperty(source.officialSources[0], "printedPage"); },
      (source) => { Object.assign(source.officialSources[0], { documentUrl: "https://downloads.theifab.com/downloads/latest?l=en" }); },
      (source) => { Object.assign(source.officialSources.find((entry) => entry.language === "en")!,
        { documentUrl: "https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es" }); },
      (source) => { Object.assign(source.officialSources[0], { inspectedArtifactSha256: "sha256:bad" }); },
      (source) => { source.preparedFollowUps[0].sourceIds.en = [source.officialSources.find((entry) => entry.language === "es")!.sourceId]; },
      (source) => { source.preparedFollowUps[0].sourceIds.en.push(source.preparedFollowUps[0].sourceIds.en[0]); },
      (source) => { source.officialSources.splice(source.officialSources.findIndex((entry) => entry.language === "en"), 1); },
      (source) => { Object.assign(source, { version: Number.POSITIVE_INFINITY }); },
      (source) => { source.practiceRefs.push({ kind: "assessment", targetId: "practice-001", targetVersion: 1,
        topicId: "challenge", lawsEdition: "IFAB-2026-27" }); source.practiceRefs.push({ ...source.practiceRefs[0] }); },
      (source) => { source.practiceRefs.push({ kind: "assessment", targetId: "practice-001", targetVersion: 1,
        topicId: "challenge", lawsEdition: "IFAB-2026-27" }); Object.assign(source.practiceRefs[0], { lawsEdition: "IFAB-2025-26" }); },
    ];
    for (const mutate of cases) {
      const input = clone();
      mutate(input);
      expect(() => compileAcademyLessonSourceV1(input)).toThrow();
    }
  });
});
