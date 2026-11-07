<a id="04-academy"></a>

<a id="04-academy--academy-foundation"></a>
## Academy foundation

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

**Delegated SDD.** Content contracts, publication, translations, official references, and practice compatibility precede UI implementation.

<a id="04-academy--objective"></a>
## Objective

Deliver a bilingual Academy organized around original summaries of the 17 Laws of the Game, navigable topics, precise official references, and a repeatable controlled workflow for publishing reviewed lesson versions. The first Academy stage closes when the Law summaries and one published lesson can be discovered and read, while the reviewed publication and retirement boundary is verified for future lessons. The complete learning loop adds a real related-practice link after a compatible Assessment or simulator incident is published.

Nicolas first prioritized the Rules of the Game pages, illustrations, and topic navigation. He later approved the first exact lesson and authorized its reviewed local publication; see [`review.md`](review.md#04-academy) and [`../19-content-publication/review.md`](../06-simulator-experience/assessment-integration/review.md#19-content-publication).

<a id="04-academy--observable-acceptance"></a>
## Observable acceptance

- **ACA-REQ-001:** Browse by Law or situation while showing the selected rules edition; editions are never mixed silently.
- **ACA-REQ-002:** A reviewed lesson contains plain explanation, authored example, technical detail, precise versioned official reference, and equivalent Spanish/English meaning.
- **ACA-REQ-003:** The example separates facts, available evidence, interpretation, and rule application.
- **ACA-REQ-004:** Related practice resolves only to compatible published simulator/assessment content and never advertises nonexistent variety.
- **ACA-REQ-005:** Prepared follow-up answers work without provider credentials and are labelled as prepared content.
- **ACA-REQ-006:** Immutable lesson/source versions and audited publication/retirement preserve historical references.
- **ACA-REQ-007:** Every Law has substantive, original bilingual guidance that states its principal conditions, procedure, exceptions, and consequences where applicable, with nearby section/page references to the 2026/27 edition. The 17 pages work without a published lesson or database. They do not reproduce the official text or imply that a reviewed lesson exists for every Law.
- **ACA-REQ-008:** Each Law page has an original, annotated visual whose measurements, roles, positions, timing, and ball state agree with the teaching text and the pinned Law. Visuals have equivalent accessible Spanish/English descriptions and do not present invented match evidence. Previous/next Law and directory navigation remain available.
- **ACA-REQ-009:** Navigable topic pages contain substantive original bilingual explanations of their decisions and procedures, at least one instructional visual when geometry or body position matters, section-level 2026/27 sources beside the relevant claims, and previous/next topic navigation. Existing six slugs remain stable. Topic guides render without a database and do not imply a published lesson, assessment, or real-play case.

<a id="04-academy--limits"></a>
## Limits

- One excellent published lesson is a valid first-stage foundation; related practice remains a separate integration gate.
- No CMS, search service, vector database, external ingestion, or hosted AI is required.
- Official sources are linked and summarized within copyright limits, not reproduced wholesale.

---

<a id="22-academy-rules-directory"></a>

<a id="22-academy-rules-directory--academy-rules-directory"></a>
## Academy rules directory

Task status is tracked only in `../../specs/tasks.md`.

<a id="22-academy-rules-directory--objective"></a>
## Objective

Publish a bilingual, navigable 2026/27 IFAB law directory within the local Academy site. The directory is navigation and original RefView orientation copy, not a reviewed lesson or a reproduction of the official Laws. Keep the approved unpublished Academy lesson and Assessment items out of public catalogs until the existing controlled publication process completes.

<a id="22-academy-rules-directory--observable-acceptance"></a>
## Observable acceptance

- **ARD-REQ-001:** `/[locale]/academy` lists all 17 numbered IFAB 2026/27 laws, with bilingual official titles and working internal law links.
- **ARD-REQ-002:** `/[locale]/academy/rules/[lawNumber]` validates canonical numbers 1–17, preserves locale switching/back navigation, displays a brief original overview and an explicit official IFAB reference for that law and edition.
- **ARD-REQ-003:** Only published Academy lessons for the 2026/27 edition may appear as lesson cards. An explicit topic-to-primary-law mapping assigns `challenge` to Law 12; citations to other laws do not recategorize the lesson. The subsequent topic-hub feature adds separate static topic navigation without exposing lesson content. Published-lesson empty and database-unavailable states are distinct on the topic hub.
- **ARD-REQ-004:** The directory remains browsable without the database. It neither exposes approved draft lessons/assessments nor introduces save, score, or publication mutations.
- **ARD-REQ-005:** ES/EN desktop and 390px mobile navigation, all law links, invalid-law 404, keyboard access, and truthful public empty states receive focused Playwright CLI verification. No broad test suite is required for this interface pass.

<a id="22-academy-rules-directory--future-media-boundary"></a>
## Future media boundary

Assessment evidence may later include curator-supplied images and external video links. Evidence available for the decision belongs to the active-attempt projection; any correction-only media stays private until finalization. External video opens its source in a new tab. This feature does not change the approved item hashes, media schema, attempt DTOs, or assessment routes.

---

<a id="23-academy-topic-hubs"></a>

<a id="23-academy-topic-hubs--academy-topic-navigation-and-real-play-slots"></a>
## Academy topic navigation and real-play slots

Task status is tracked only in `../../specs/tasks.md`.

<a id="23-academy-topic-hubs--objective"></a>
## Objective

Make the 2026/27 Academy directory useful before lesson publication: each law card explains its scope in one line, and a law can lead to navigable topic hubs. The first hub is Law 12's `challenge` topic. User-supplied real plays are a later editorial input; no invented plays or fake media are shown.

<a id="23-academy-topic-hubs--observable-acceptance"></a>
## Observable acceptance

- **ATH-REQ-001:** The 17 Academy law cards show their existing bilingual one-line original overviews without hiding their links.
- **ATH-REQ-002:** Law 12 shows one bilingual navigable topic card for `challenge`; other laws show an honest no-topics state. Static topic metadata has only identity, edition, primary law, title, and a brief scope sentence. Its presence does not claim a lesson is published.
- **ATH-REQ-003:** `/[locale]/academy/rules/12/topics/challenge` shows the topic orientation, official Law 12 and pinned 2026/27 references, a published-lesson area, and a real-play area. Locale/back navigation works; invalid law/topic combinations return 404.
- **ATH-REQ-004:** Only the verified publication catalog can provide lesson links, filtered by exact topic and edition. A successful empty catalog and an unavailable database have distinct copy. The approved unpublished lesson and Assessment drafts are not discoverable from these pages.
- **ATH-REQ-005:** Real-play area says no real plays are available yet. It does not render two empty faux cards, fictional incidents, images, or links. A later content review can add up to two user-supplied examples per topic without changing this publication boundary.
- **ATH-REQ-006:** ES/EN desktop/mobile navigation, keyboard focus, invalid routes, public draft exclusion, and no horizontal overflow receive focused Playwright CLI inspection. No broad test suite is added for this UI pass.

<a id="23-academy-topic-hubs--boundaries"></a>
## Boundaries

The exact approved Academy lesson source/hash, Assessment source/rubric hashes, PostgreSQL publication process, and simulator are unchanged. This pass changes local application UI only. Existing ARD-REQ-003's published-only rule continues to apply to **lesson cards**; static topic navigation is a separate layer and cannot expose lesson text.

---

<a id="24-academy-law-expansion"></a>

<a id="24-academy-law-expansion--academy-law-topic-expansion"></a>
## Academy law topic expansion

Task status is tracked only in `../../specs/tasks.md`.

<a id="24-academy-law-expansion--objective"></a>
## Objective

Extend the Academy's 2026/27 Law navigation using the supplied IFAB PDF as a source map. Add icons to all 17 directory cards, select useful topic clusters for Laws 11, 12, and 14, and make those topics navigable with original bilingual orientation, key concepts, and precise official source references. Real match cases and reviewed lessons remain separate later inputs.

<a id="24-academy-law-expansion--observable-acceptance"></a>
## Observable acceptance

- **ALE-REQ-001:** All 17 Law cards have a distinct, locally authored, decorative icon with accessible text still supplied by the Law title and link. Cards preserve their one-line scope, links, and desktop/mobile layout.
- **ALE-REQ-002:** Law 12 offers the existing `challenge` topic plus `handball`, `indirect-free-kick`, and `disciplinary-sanctions`; Law 11 offers `offside-position-and-involvement`; Law 14 offers `penalty-procedure`. Each card links to its exact bilingual topic route. Other Laws retain honest no-topics states.
- **ALE-REQ-003:** Each of these six topic pages has an original bilingual scope, a short explanation, two or three key concepts, and a specific 2026/27 IFAB PDF section/page reference. The official online Law remains a convenience link and is labelled as edition-variable.
- **ALE-REQ-004:** Topic metadata contains no invented plays, media, lesson IDs, answer keys, scoring, or draft fixture content. The real-play area remains empty until Nicolas supplies real cases with source/rights. Only the verified catalog may provide lesson links, filtered by exact topic and edition; the approved unpublished lesson and Assessment drafts remain undiscoverable.
- **ALE-REQ-005:** ES/EN desktop/mobile navigation, icons, precise source links, keyboard focus, invalid routes, public draft exclusion, and no horizontal overflow receive focused Playwright CLI inspection. No broad UI test suite is added.

<a id="24-academy-law-expansion--source-and-rights"></a>
## Source and rights

Source: Nicolas's local `Reglas de Juego 2026_27_paginas individuales.pdf`, IFAB 2026/27, 276 pages. The PDF's page 4 prohibits reproduction without prior consent. RefView writes original orientation and links to the official publication; it does not copy rule paragraphs or diagrams. Spanish physical PDF page numbers match printed pages for the selected sections. Verify English PDF page targets before adding page-fragment links in that locale.
