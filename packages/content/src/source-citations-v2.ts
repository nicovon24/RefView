import { canonicalJsonV2 } from "./source-core-v2";

export type OfficialSourceV2 = Readonly<{
  sourceId: string;
  edition: "IFAB-2026-27";
  documentUrl: string;
  lawAndSection: string;
  inspectedArtifactSha256: `sha256:${string}`;
  provenance: string;
}>;

export type PreparedDebriefSectionV2 = Readonly<{
  sectionId: string;
  es: string;
  en: string;
  evidenceIds: readonly string[];
  sourceIds: readonly string[];
}>;

export type SourceCitationsV2 = Readonly<{
  officialSources: readonly OfficialSourceV2[];
  preparedDebrief: Readonly<{
    contentId: string;
    sections: readonly PreparedDebriefSectionV2[];
  }>;
}>;

const SOURCE_KEYS = ["sourceId", "edition", "documentUrl", "lawAndSection", "inspectedArtifactSha256", "provenance"];
const DEBRIEF_KEYS = ["contentId", "sections"];
const SECTION_KEYS = ["sectionId", "es", "en", "evidenceIds", "sourceIds"];
const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const compareId = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;

function exactRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) {
    throw new TypeError(`${label} has invalid fields`);
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim() !== value) {
    throw new TypeError(`invalid ${label}`);
  }
  return value;
}

function id(value: unknown, label: string): string {
  const result = text(value, label);
  if (!ID.test(result)) throw new TypeError(`invalid ${label}`);
  return result;
}

function sortedUniqueIds(value: unknown, label: string): readonly string[] {
  const items = array(value, label).map((entry) => id(entry, label));
  if (new Set(items).size !== items.length) throw new TypeError(`duplicate ${label}`);
  return Object.freeze(items.sort(compareId));
}

function sortedUniqueEvidenceIds(value: unknown, label: string): readonly string[] {
  const items = array(value, label).map((entry) => text(entry, label));
  if (new Set(items).size !== items.length) throw new TypeError(`duplicate ${label}`);
  return Object.freeze(items.sort(compareId));
}

function officialDocumentUrl(value: unknown): string {
  const input = text(value, "official document URL");
  let parsed: URL;
  try { parsed = new URL(input); } catch { throw new TypeError("invalid official document URL"); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
      (parsed.hostname !== "theifab.com" && !parsed.hostname.endsWith(".theifab.com"))) {
    throw new TypeError("invalid official document URL");
  }
  return input;
}

/** Normalizes one immutable source/debrief slice; the final compiler owns the full content hash. */
export function normalizeSourceCitationsV2(
  officialSources: unknown,
  preparedDebrief: unknown,
  declaredEvidenceIds: unknown,
): SourceCitationsV2 {
  // The shared canonical serializer rejects accessors, hidden/symbol keys, decorated and sparse arrays
  // before any author-controlled property is read. JSON parsing yields a detached plain data tree.
  const detached = JSON.parse(canonicalJsonV2({ officialSources, preparedDebrief,
    declaredEvidenceIds })) as Record<string, unknown>;
  const declared = new Set(sortedUniqueEvidenceIds(detached.declaredEvidenceIds, "declared evidence ID"));
  const sources = array(detached.officialSources, "official sources").map((entry): OfficialSourceV2 => {
    const record = exactRecord(entry, SOURCE_KEYS, "official source");
    if (record.edition !== "IFAB-2026-27") throw new TypeError("unsupported source edition");
    const fingerprint = text(record.inspectedArtifactSha256, "inspected artifact fingerprint");
    if (!DIGEST.test(fingerprint)) throw new TypeError("invalid inspected artifact fingerprint");
    return Object.freeze({
      sourceId: id(record.sourceId, "source ID"),
      edition: record.edition,
      documentUrl: officialDocumentUrl(record.documentUrl),
      lawAndSection: text(record.lawAndSection, "law and section"),
      inspectedArtifactSha256: fingerprint as `sha256:${string}`,
      provenance: text(record.provenance, "source provenance"),
    });
  });
  if (sources.length === 0 || new Set(sources.map((entry) => entry.sourceId)).size !== sources.length) {
    throw new TypeError("missing or duplicate official source ID");
  }
  sources.sort((a, b) => compareId(a.sourceId, b.sourceId));
  const sourceIds = new Set(sources.map((entry) => entry.sourceId));
  const debrief = exactRecord(detached.preparedDebrief, DEBRIEF_KEYS, "prepared debrief");
  const sections = array(debrief.sections, "debrief sections").map((entry): PreparedDebriefSectionV2 => {
    const section = exactRecord(entry, SECTION_KEYS, "debrief section");
    const evidenceIds = sortedUniqueEvidenceIds(section.evidenceIds, "debrief evidence ID");
    const sectionSourceIds = sortedUniqueIds(section.sourceIds, "debrief source ID");
    if (evidenceIds.some((value) => !declared.has(value))) {
      throw new TypeError("unknown debrief evidence ID");
    }
    if (sectionSourceIds.some((value) => !sourceIds.has(value))) {
      throw new TypeError("unknown debrief source ID");
    }
    return Object.freeze({
      sectionId: id(section.sectionId, "section ID"),
      es: text(section.es, "Spanish debrief text"),
      en: text(section.en, "English debrief text"),
      evidenceIds,
      sourceIds: sectionSourceIds,
    });
  });
  if (sections.length === 0 || new Set(sections.map((section) => section.sectionId)).size !== sections.length) {
    throw new TypeError("missing or duplicate debrief section ID");
  }
  return Object.freeze({
    officialSources: Object.freeze(sources),
    preparedDebrief: Object.freeze({ contentId: id(debrief.contentId, "debrief content ID"),
      sections: Object.freeze(sections) }),
  });
}
