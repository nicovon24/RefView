# Academy content and publication contract v1

## Authority and identity

- A lesson is addressed by stable `lessonId` and positive integer `version`; its immutable source has a server-derived canonical content hash. A changed translation, explanation, reference, example, answer, or practice mapping creates a new version.
- The v1 hash input is the normalized exact record `{ schemaVersion: 1, lessonId, version, lawsEdition, topicId, level, localized: { es, en }, example, officialSources, preparedFollowUps, practiceRefs }`. `localized` contains the full visible explanation/technical text; `example` contains separately labelled facts, observable evidence, interpretation, and rule application in both languages. Source and follow-up arrays are sorted by stable IDs before hashing. Unknown fields, duplicate IDs, nonfinite values, and missing locale fields are rejected. Publication state, reviewer metadata, and timestamps are excluded from the immutable source.
- The server computes `sha256:` plus lowercase SHA-256 of UTF-8 `canonicalJsonV2(["refview-academy-lesson-v1", normalizedSource])`, using the existing canonical JSON semantics in `packages/content/src/source-core-v2.ts`. It recomputes and compares that value on stored reads; caller-supplied hashes are never authority. The implementation must prove canonicalization and payload coverage with tests before publication.
- Every lesson declares one exact Laws edition, topic and difficulty. Official references include the publisher, edition, language, direct edition-pinned document URL, law/section and printed page, inspection date, and inspected artifact digest. Mutable `latest` URLs may be convenience links but do not establish version identity.
- Spanish and English share the same reviewed facts, interpretation boundaries, rule application, and references. Copy differences are editorial, never separate answer keys.
- The lesson source separates scenario/example facts, evidence available to the learner, referee interpretation, and rule application. A rule citation never asserts that an illustrated animation establishes an incident fact.

### Executable v1 source shape

The normalized exact record uses these nested shapes; all text is nonempty, trimmed, bounded to an implementation-declared length, and stored as authored UTF-8 without HTML. Arrays reject duplicate IDs and are sorted before hashing. A schema change requires a new `schemaVersion` and hash domain tag.

| Field | Exact v1 shape and validation |
| --- | --- |
| `lessonId` | lowercase ASCII slug `[a-z0-9]+(?:-[a-z0-9]+)*` |
| `version` | positive safe integer |
| `lawsEdition` | literal `IFAB-2026-27`; a later edition needs an explicit schema/edition update |
| `topicId` | v1 literal `challenge`; a later taxonomy expansion is versioned |
| `level` | `beginner`, `intermediate`, or `advanced` |
| `localized` | exact `{ es: { title, lead, plainExplanation, technicalExplanation }, en: { title, lead, plainExplanation, technicalExplanation } }` with string fields |
| `example` | exact `{ facts, evidence, interpretation, ruleApplication }`, each a `{ es: string, en: string }` pair; facts are explicitly labelled as authored in the UI |
| `officialSources` | nonempty array of exact `{ sourceId, publisher: "IFAB", edition: "IFAB-2026-27", language: "es" \| "en", documentUrl, lawNumber, sectionCode, displayLabel, printedPage, inspectedAt, inspectedArtifactSha256 }`; `lawNumber` is an integer 1–17 and `sectionCode` is a language-neutral ASCII locator such as `12.1`, `1.6`, or `14.intro`. `displayLabel` is localized text only; coverage compares `(lawNumber,sectionCode)` pairs, requiring the same set in both languages. `sourceId` is a stable slug unique within the lesson, `printedPage` is a positive integer, digest is `sha256:` plus 64 lowercase hex digits, and URL must be an edition-pinned HTTPS IFAB document. Require at least one source per locale; sort by `sourceId` |
| `preparedFollowUps` | array of exact `{ followUpId, question: { es, en }, answer: { es, en }, sourceIds: { es: string[], en: string[] } }`; each locale's nonempty source IDs resolve only to same-language `officialSources`, sorted uniquely; sort entries by `followUpId` |
| `practiceRefs` | array of exact `{ kind: "assessment" \| "scenario", targetId, targetVersion, topicId, lawsEdition }`; stable target slug/positive version, `topicId` and `lawsEdition` equal the lesson's values, sort by `(kind,targetId,targetVersion)` and reject duplicates |

The document URLs for the initial lesson are exact allowlisted edition-pinned IFAB URLs recorded below. A future source URL requires review and schema validation before publication. Normalization does not silently drop unknown keys or invent missing translation fields. Cross-locale semantic equivalence is a human review assertion bound to the hash, not something a string validator can prove.

## Publication

- Draft content is available only in an explicitly labelled editorial preview and is excluded from public Academy discovery, recommendations, and scoring.
- Publication requires a persisted review record bound to `lessonId`, `version`, and the server-derived content hash, with Nicolas's trusted reviewer principal, review time, source/provenance evidence, translation-equivalence decision, and football-content decision. Importing that record requires a separately reviewed administrator attribution path; a client assertion or approval boolean is insufficient. No automatic promotion from draft is allowed.
- Publication and retirement are authenticated administrator transitions that reference an existing valid bound review record, use monotonically increasing revisions, and append events recording actor, time, reason, prior/next state, version, and content hash. The mutation revalidates the stored source and review binding in one transaction. A retired lesson leaves historical references resolvable but is not newly discoverable or recommendable.
- The persistence plan uses PostgreSQL `LessonVersion` keyed by `(lessonId, version)` and additionally unique on `(lessonId, version, contentHash)`, with normalized source JSON and creation time; `LessonReviewRecord` keyed by review ID and foreign-keyed to that unique triple with trusted reviewer principal and review evidence; `LessonPublication` keyed by `(lessonId, version)` with state/revision and optional bound review ID; and append-only `LessonPublicationEvent` unique on `(lessonId, version, nextRevision)`. The publish/retire transaction locks publication state, recompiles the stored source, verifies its hash and bound review, enforces expected revision and allowed transition, then updates state and appends one event. Published source rows are never updated in place. Exact Prisma migration and administrator admission still require independent persistence/authority review before implementation.

## Prepared follow-ups and practice

- Prepared follow-up questions and answers are versioned lesson content. They cite the lesson's source IDs and are visibly labelled as prepared responses; they need no AI provider and cannot modify any attempt or score.
- A related-practice reference stores only target kind, stable ID/version, topic, and Laws edition. Current eligibility is derived at read time from the target's reviewed publication/retirement state and topic/edition compatibility; no stored eligibility flag is trusted. Only a currently eligible target appears as a working link. The local unsaved simulator playtest is ineligible.
- When no compatible target exists, the UI states that practice is not available yet. It never routes to an unrelated or unpublished exercise.

## Initial lesson candidate

`careless-trip-in-penalty-area` version 1 uses IFAB Laws of the Game 2026/27. The edition-pinned English and Spanish single-page PDFs are:

- https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en
- https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es

The English PDF's relevant printed pages are Law 1 §2 (p. 45) and §6 (p. 48), Law 12 §12.1 (pp. 115–116) and DOGSO (p. 124), and Law 14 opening rule (p. 135). Its inspected 23,437,157 bytes have SHA-256 `89398520b353c6d995a1bb2557c97dc3c5aa1712c1d3009589f580a5a23c6a7d`. The Spanish PDF has different pagination: Regla 1 §2 (p. 49) and §6 (p. 52), Regla 12 §12.1 (pp. 123–124) and DOGSO (p. 133), and Regla 14 opening rule (p. 145). The exact Spanish `?l=es` URL was inspected on 2026-11-04: 24,422,871 bytes, SHA-256 `5c4d4795af674701c934030416132835357d039fd6a68b248baf738714ebe7ab`. IFAB owns the source material; the lesson paraphrases and links it rather than reproducing long excerpts. The authored incident already pins an inspected English PDF digest in `packages/content/src/authored-incident-v2.ts`; lesson-specific bilingual review and Nicolas's football approval remain required.

## Required negative cases

- Reject duplicate lesson ID/version or a changed payload under an existing hash.
- Reject missing source edition, section, page, attribution, inspection digest, or divergent locale meaning.
- Reject mixed-edition references and practice targets, unpublished/retired target links, and draft lesson discovery.
- Reject publication without bound content and review records; reject a stale revision or attempted mutation of published bytes.
