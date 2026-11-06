import { describe, expect, it } from "vitest";
import { normalizeSourceCitationsV2 } from "./source-citations-v2";

const digest = `sha256:${"a".repeat(64)}`;
const source = (sourceId: string) => ({
  sourceId, edition: "IFAB-2026-27", documentUrl: "https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en",
  lawAndSection: "Law 12, Fouls and Misconduct", inspectedArtifactSha256: digest,
  provenance: "Inspected IFAB 2026/27 PDF, English edition",
});
const debrief = () => ({ contentId: "debrief-incident-001", sections: [
  { sectionId: "decision", es: "Tiro penal.", en: "Penalty kick.", evidenceIds: ["contact", "onside"], sourceIds: ["law-12", "law-11"] },
  { sectionId: "positioning", es: "Revisa el contacto.", en: "Review the contact.", evidenceIds: ["contact"], sourceIds: ["law-12"] },
] });
const normalize = (sources: unknown, preparedDebrief: unknown, evidenceIds: unknown = ["contact", "onside"]) =>
  normalizeSourceCitationsV2(sources, preparedDebrief, evidenceIds);

describe("normalizeSourceCitationsV2", () => {
  it("sorts declared sets, preserves section order, and returns detached deeply frozen content", () => {
    const sources = [source("law-12"), source("law-11")];
    const preparedDebrief = debrief();
    const result = normalize(sources, preparedDebrief, ["onside", "contact"]);
    expect(result.officialSources.map(({ sourceId }) => sourceId)).toEqual(["law-11", "law-12"]);
    expect(result.preparedDebrief.sections.map(({ sectionId }) => sectionId)).toEqual(["decision", "positioning"]);
    expect(result.preparedDebrief.sections[0]?.evidenceIds).toEqual(["contact", "onside"]);
    expect(result.preparedDebrief.sections[0]?.sourceIds).toEqual(["law-11", "law-12"]);
    expect(normalize([...sources].reverse(), debrief(), ["contact", "onside"])).toEqual(result);
    const reorderedDebrief = debrief(); reorderedDebrief.sections.reverse();
    expect(normalize(sources, reorderedDebrief, ["contact", "onside"])).not.toEqual(result);
    preparedDebrief.sections[0]!.es = "Changed";
    sources[0]!.provenance = "Changed";
    expect(result.preparedDebrief.sections[0]?.es).toBe("Tiro penal.");
    expect(result.officialSources[1]?.provenance).toBe("Inspected IFAB 2026/27 PDF, English edition");
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.officialSources)).toBe(true);
    expect(Object.isFrozen(result.officialSources[0])).toBe(true);
    expect(Object.isFrozen(result.preparedDebrief.sections[0]?.sourceIds)).toBe(true);
  });

  it("keeps authored bilingual text and source provenance as immutable content", () => {
    const a = normalize([source("law-12")], { contentId: "debrief", sections: [
      { sectionId: "decision", es: "Penal.", en: "Penalty.", evidenceIds: [], sourceIds: ["law-12"] },
    ] });
    const b = normalize([source("law-12")], { contentId: "debrief", sections: [
      { sectionId: "decision", es: "Penal claro.", en: "Penalty.", evidenceIds: [], sourceIds: ["law-12"] },
    ] });
    expect(a).not.toEqual(b);
    expect(a.officialSources[0]?.inspectedArtifactSha256).toBe(digest);
  });

  it("rejects duplicate and missing IDs, unsupported edition, malformed fingerprint, and incomplete bilingual text", () => {
    expect(() => normalize([source("law-12"), source("law-12")], debrief())).toThrow();
    expect(() => normalize([source("law-12")], { contentId: "debrief", sections: [
      { sectionId: "same", es: "SÃ­", en: "Yes", evidenceIds: [], sourceIds: [] },
      { sectionId: "same", es: "SÃ­", en: "Yes", evidenceIds: [], sourceIds: [] },
    ] })).toThrow();
    expect(() => normalize([{ ...source("law-12"), sourceId: "" }], debrief())).toThrow();
    expect(() => normalize([{ ...source("law-12"), edition: "IFAB-2025-26" }], debrief())).toThrow();
    expect(() => normalize([{ ...source("law-12"), inspectedArtifactSha256: "sha256:abc" }], debrief())).toThrow();
    expect(() => normalize([{ ...source("law-12"), documentUrl: "https://other.example/law-12" }], debrief())).toThrow();
    expect(() => normalize([source("law-12")], { contentId: "debrief", sections: [
      { sectionId: "one", es: "SÃ­", en: "", evidenceIds: [], sourceIds: [] },
    ] })).toThrow();
  });

  it("rejects duplicate and unknown evidence/source references", () => {
    const sources = [source("law-11"), source("law-12")];
    const duplicateEvidence = debrief(); duplicateEvidence.sections[0]!.evidenceIds = ["contact", "contact"];
    expect(() => normalize(sources, duplicateEvidence, ["contact", "onside"])).toThrow();
    const unknownEvidence = debrief(); unknownEvidence.sections[0]!.evidenceIds = ["missing"];
    expect(() => normalize(sources, unknownEvidence, ["contact", "onside"])).toThrow();
    const unknownSource = debrief(); unknownSource.sections[0]!.sourceIds = ["missing"];
    expect(() => normalize(sources, unknownSource)).toThrow();
    expect(() => normalize(sources, debrief(), ["contact", "contact"])).toThrow();
  });

  it("requires a trusted evidence roster and accepts canonical uppercase evidence IDs", () => {
    const sources = [source("law-11"), source("law-12")];
    expect(() => (normalizeSourceCitationsV2 as (...args: unknown[]) => unknown)(sources, debrief())).toThrow();
    const canonical = debrief();
    canonical.sections[0]!.evidenceIds = ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"];
    canonical.sections[1]!.evidenceIds = ["EV-TRIP-CONTACT"];
    expect(normalize(sources, canonical, ["EV-TRIP-CONTACT", "EV-INSIDE-AREA"])
      .preparedDebrief.sections[0]?.evidenceIds).toEqual(["EV-INSIDE-AREA", "EV-TRIP-CONTACT"]);
    expect(() => normalize(sources, canonical, ["EV-TRIP-CONTACT"])).toThrow();
  });

  it("rejects unknown, hidden, symbol, accessor, sparse, and inherited input without getter reads", () => {
    let reads = 0;
    const badSource = source("law-12");
    Object.defineProperty(badSource, "provenance", { enumerable: true, get() { reads++; return "bad"; } });
    expect(() => normalize([badSource], debrief())).toThrow();
    expect(reads).toBe(0);
    const hidden = debrief(); Object.defineProperty(hidden.sections[0], "hidden", { value: true });
    expect(() => normalize([source("law-12")], hidden)).toThrow();
    const symbol = source("law-12") as Record<string | symbol, unknown>; symbol[Symbol("secret")] = 1;
    expect(() => normalize([symbol], debrief())).toThrow();
    expect(() => normalize([Object.assign(Object.create({ inherited: true }), source("law-12"))], debrief())).toThrow();
    const decorated = [source("law-12")]; Object.defineProperty(decorated, "metadata", { value: true });
    expect(() => normalize(decorated, debrief())).toThrow();
    expect(() => normalize(new Array(1), debrief())).toThrow();
    expect(() => normalize([{ ...source("law-12"), contentHash: "forged" }], debrief())).toThrow();
  });
});
