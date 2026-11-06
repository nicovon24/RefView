# Source-backed Academy Law depth

## Scope and route

This is a substantial refinement of RV-029A and the first delivery of RV-029B. Nicolas asked for more faithful text and images and substantive text on navigable Academy topic pages. The requested experience is an original learning guide to IFAB 2026/27, not a copy of IFAB's publication. The existing visual system stays: paper reading surface, condensed headings, dark field diagrams, accessible blue focus, and Spanish-first bilingual content. The mode is **Read**.

The 17 Law pages retain their stable routes and gain sections with concrete conditions, procedure, exceptions, outcomes, and nearby official section/page links. Existing topic slugs remain stable; their routes become substantive static guides with their own text, diagrams, section sources, and local navigation. Later topic coverage extends to the other Laws. The approved unpublished lesson, answer keys, and real-play cases do not enter this static guidance.

## Content contract

`law-depth-contract.ts` defines one bilingual `LawDepth` per Law. Each section has a stable anchor, original bilingual paragraphs, optional facts/steps/caution, and an IFAB 2026/27 source section with verified ES/EN physical PDF page targets. The content is split into disjoint Law groups for bounded implementation and composed by the Law view. A static topic-guide contract uses the same source and block pattern. Every claim remains source traceable; the online IFAB page is labelled edition-variable.

The original diagrams are instructional geometry, not generic football decoration. Replacements must use consistent scale for field markings, label illustrated roles and ball state, distinguish position from offence, and avoid showing prohibited player placements. Do not trace or import IFAB PDF artwork. Diagrams and text carry equivalent meaning in both languages, with useful SVG title/description and visible figure labels.

## Publication boundary

The rule-guide route itself is static and does not need the publication database. Its existing catalog read and empty lesson/real-play sections distract from reading the Laws and fail during a local database outage. The publication-gated lesson catalog and lesson route remain separate; removing this read from static topic guidance does not expose drafts. Any future connection from a rule topic to a published lesson requires its own reviewed integration.

## Acceptance and evidence

Use the supplied Spanish IFAB PDF and official English 2026/27 PDF to verify numbers, exceptions, timing, section names, and physical page targets. Browser inspection must cover ES/EN Law and topic routes, desktop/mobile figures and navigation, keyboard focus, invalid routes, and absence of overflow. Deterministic geometry helpers, if added, need focused tests. Delegated implementation and the revised publication boundary require independent read-only review. Prior RV-029A verification remains historical evidence for its earlier introductory scope.
