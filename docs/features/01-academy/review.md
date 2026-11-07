<a id="04-academy"></a>

<a id="04-academy--academy-review-evidence"></a>
## Academy review evidence

Task status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

<a id="04-academy--rv-020-contract"></a>
## RV-020 contract

The coordinator froze [`../../contracts/learning-publication.md#academy-content-v1`](../../contracts/learning-publication.md#academy-content-v1) after two correction rounds. Independent read-only Sol/high review returned PASS on the final exact source shape, bilingual citation coverage keys, canonical hash, hash-bound Nicolas review, authenticated publication and retirement transitions, PostgreSQL review binding, and read-time practice eligibility. The runtime-confirmed model/effort was unconfirmed. This is contract approval only; no lesson is published or persisted by this review.

<a id="04-academy--rv-021a-editorial-preview"></a>
## RV-021A editorial preview

The bilingual version-1 editorial preview is directly reachable at `/es/academy/editorial-preview` and `/en/academy/editorial-preview`. It is marked unpublished and excluded from discovery, scoring, and practice. The content distinguishes authored facts, observable evidence, interpretation, and application, links the edition-pinned IFAB 2026/27 PDF in each language, and labels prepared answers. Independent read-only Sol/high review returned PASS for the draft scope; runtime-confirmed identity was unconfirmed. The reviewer independently downloaded both PDFs, matched the recorded sizes and SHA-256 digests, and checked the cited printed pages and paraphrases. The English source note lacks the Spanish note's inspection date; this is nonblocking for a draft and must be resolved when building the exact published source record.

After the final code edit, the coordinator observed:

- `pnpm --filter @refview/web test`: 37 files passed, 3 skipped; 197 tests passed, 6 skipped.
- `pnpm --filter @refview/web typecheck`: passed.
- `pnpm --filter @refview/web lint`: passed.
- `pnpm --filter @refview/web build`: passed; both editorial-preview locale routes generated.
- `playwright-cli -s=refview-academy open http://localhost:3000/es/academy/editorial-preview`: Spanish draft title, source, and unpublished label visible; no console warnings or errors on the initial route.
- `playwright-cli -s=refview-academy resize 390 844`: no horizontal overflow; the draft label and notice remain visible.
- `playwright-cli -s=refview-academy click e9`: English route and localized title loaded while preserving the preview path.
- `playwright-cli -s=refview-academy click "getByText('Why no yellow card?')"`: the native details panel opened with a visibly labelled prepared answer.
- Browser DOM inspection: `noindex, nofollow`; four prepared details; zero practice/simulator links. Source search found no discovery link to the editorial preview.

Visual captures: [`../../../artifacts/academy-draft-desktop.png`](../../../artifacts/academy-draft-desktop.png) and [`../../../artifacts/academy-draft-mobile.png`](../../../artifacts/academy-draft-mobile.png). These show the readable desktop and mobile draft layout.

This does not approve the football meaning or translations for publication. Nicolas's content review and the executable source/publication flow remain RV-021/RV-022 work.

<a id="04-academy--exact-rv-021-candidate-for-nicolas"></a>
## Exact RV-021 candidate for Nicolas

The source fixture in `apps/web/src/features/academy/lesson-source-v1.ts` is the normalized bilingual draft at `(careless-trip-in-penalty-area, version 1)`. The first server-derived candidate hash was `sha256:b7f69d659c1ed66f7de0a96fba75c3b4c407d8e6dfcca4d52869d8e6b057703d`. It bound provisional wording and empty practice mappings. That candidate is superseded. The current draft hash is `sha256:4056b7d5cac8d8886003602464dd82cb633fbc74e198c49597049a52cdf59f6b`: the hashed lesson conclusion no longer says it awaits review, while the separate preview notice still does, and the source refers to `careless-trip-penalty-restart` v1 Assessment practice. Read-time publication eligibility still determines whether any eventual practice link works. The preview renders lesson source fields from this exact draft.

Bounded Sol/medium implementation used red/green TDD: the source test initially failed before the module existed, then four focused tests passed after expanding hash coverage for both locales, citations, follow-ups, ordering, and a valid nonempty practice mapping. Independent Sol/high read-only review first returned FIX for source-rendering and coverage gaps; after corrections it returned PASS for presenting this exact draft to Nicolas. Runtime-confirmed identities were unconfirmed. Both PDF digests and printed-page locators were independently rechecked. This is a review candidate, not a trusted approval or published lesson.

Final integration gate after the source-rendering edit: `pnpm --filter @refview/web test` passed 39 files/207 tests (3 files/6 tests skipped); web typecheck, web lint, content typecheck, and web production build all passed. Playwright CLI reloaded the Spanish preview and confirmed the five canonical source locators, the official Spanish PDF URL/digest, the draft label, and no score/practice link. The desktop capture is [`../../../artifacts/academy-draft-canonical-desktop.png`](../../../artifacts/academy-draft-canonical-desktop.png).

After the later draft revision, focused Academy source tests passed 4/4. Independent Sol/high read-only re-review returned PASS for the revised unpublished candidate and its exact Assessment practice reference; the combined Academy/Assessment focused suite passed 7/7, web typecheck and targeted lint passed. Reviewer runtime identity was unconfirmed. The prior Nicolas approval request referred to the superseded hash; a new request names the current hash. Browser recheck, exact-hash approval, trusted admission, and publication remain open.

<a id="04-academy--published-reader-preparation"></a>
## Published-reader preparation

The server-only Academy reader verifies a reviewed publication, the mapped reviewer, evidence and timestamp binding, exact source hash, and retirement/withdrawal history before exposing lesson data. A distinctly named `synthetic-academy-publication-test` source was admitted and published solely in `refview_test` by `refview_reviewer_test` under the synthetic test principal. It is not the editorial lesson. Focused PostgreSQL tests passed 5/5, including positive published read and rolled-back retired/revoked cases. Independent Sol/high read-only review returned PASS after the real PostgreSQL fixture was added; the test-suite registration also passed independent review. Requested model/effort: Sol/medium for implementation and Sol/high for review; runtime-confirmed identities: unconfirmed. The full PostgreSQL suite then passed 82/82, and web typecheck, lint, and production build passed. The real lesson remains draft with no Nicolas review or public catalog; synthetic tests do not authorize publication.

<a id="04-academy--public-academy-read-journey"></a>
## Public Academy read journey

A bounded Sol/medium implementation added dynamic bilingual `/[locale]/academy` catalog and `/[locale]/academy/[lessonId]` detail pages. Candidate IDs come only from reviewed publications; every candidate is reloaded through the verified server-only reader before a locale-specific public projection. No editorial draft, raw source/review record, or practice target is serialized. Empty, missing, and database-unavailable states are distinct. The shared navigation now links Academy. Independent Sol/high code review returned PASS for this bounded scope, with an optional HTTP 404 improvement for unknown shaped IDs. Requested model/effort Sol/medium and Sol/high; runtime-confirmed identities unconfirmed.

The first Chrome load showed the fail-closed unavailable state and a PostgreSQL `42501` error: the newly restricted app role lacked content table SELECT. A separately reviewed migration granted app SELECT on exactly 11 verified Academy/Assessment content tables and EXECUTE on the Assessment eligibility lock, without content writes; it applied to `refview_test` and `refview` under their migration logins. A separate-login test confirmed Academy SELECT, direct content DELETE denial, and eligibility EXECUTE. After migration, Playwright CLI Chrome showed the honest empty Spanish catalog with zero console errors, changed to English, found no overflow at 390x844, and showed an unavailable detail for the unpublished editorial lesson without its content. The app database still contains no real review or publication event; this is a working publication-gated read surface, not a published lesson.

Nicolas then explicitly approved the football interpretation, Spanish/English equivalence, and sources/provenance of the current exact lesson hash `sha256:4056b7d5cac8d8886003602464dd82cb633fbc74e198c49597049a52cdf59f6b` in this conversation on 2026-11-04. His earlier approval of the superseded hash is recorded as history only. These statements are not yet a trusted database admission: the reviewed v1 contract requires a distinct Nicolas-bound reviewer credential, exact evidence digest, all-true receipt, and authenticated CLI confirmation. The public catalog correctly remains empty.

The coordinator generated `review-evidence-v1.json` from the compiled current source and checked its exact-file digest `sha256:59b6703690e8f961d9c806a625c8a200f00c4c9b14c44dc113b6bbde527b452a` against `review-receipt-candidate-v1.json`. The artifact embeds the approved source hash and both locales. This is a candidate evidence package, not a trusted review row. The reviewed local CLI can verify the same hash in `refview_test`; it must be run by Nicolas with his separately claimed reviewer credential for real admission and publication.

<a id="04-academy--local-publication-outcome"></a>
## Local publication outcome

The earlier paragraphs record the prepublication state. On 2026-11-06, Nicolas separately attested the v2 reviewer issuance receipt and authorized the assistant to verify and publish this exact lesson locally. Under the narrow documented delegation, the restricted reviewer CLI admitted its exact review and transitioned `careless-trip-in-penalty-area` v1 to `reviewed` revision one. Read-only SQL and independent Sol/high review confirmed the exact review/evidence binding and one publication event. Playwright CLI showed the Spanish catalog and full lesson detail, the English catalog, and a save into an anonymous Profile session. The test session was deleted. See [`../19-content-publication/review.md`](../06-simulator-experience/assessment-integration/review.md#19-content-publication) for IDs, digests, commands, and remaining limits.

<a id="04-academy--law-and-topic-evidence"></a>
## Law and topic evidence

The following sections preserve the original slice reviews and their observed commands. Later publication evidence above supersedes older statements about an empty Academy catalog.

<a id="04-academy--law-guides"></a>
## Law guides

<a id="04-academy--result"></a>
### Result

RV-029A / ACA-REQ-007 and ACA-REQ-008: **PASS**. All 17 Law pages in Spanish and English now contain an original introduction, explanation, three key points, one locally authored SVG diagram with bilingual accessible title/description, available topic links, directory and adjacent-Law navigation, and a visible IFAB 2026/27 PDF source locator. The Law guides render without a lesson or database. No official text, IFAB artwork, or real-play evidence was copied into the diagrams. Existing published-only lesson boundaries were not changed.

Nicolas supplied `C:\Users\Nicolas\Downloads\Reglas de Juego 2026_27_paginas individuales.pdf` (IFAB 2026/27, 276 pages). A focused read-only research task compared the Spanish and official English (260-page) single-page PDFs and verified the physical first page of all 17 Laws. The official PDF URLs are `https://www.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es` and `https://www.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en`; the application's existing `downloads.theifab.com` host resolves the same files. The PDFs are source references, not assets copied into RefView.

<a id="04-academy--evidence"></a>
### Evidence

- `pnpm --filter @refview/web typecheck` exited 0 after the final content and diagram corrections.
- `pnpm --filter @refview/web exec eslint src/features/academy/AcademyRulesViews.tsx src/features/academy/LawIllustration.tsx src/features/academy/law-guide-v1.ts` exited 0 after the final corrections.
- `git diff --check -- apps/web/src/features/academy/AcademyRulesViews.tsx apps/web/src/features/academy/catalog-ui-v1.css docs/features/01-academy/requirements.md#04-academy docs/features/01-academy/tasks.md#04-academy docs/specs/tasks.md` exited 0, with only Git CRLF notices on documentation.
- Playwright CLI Chrome visited all 34 `/es|en/academy/rules/1..17` routes: every response was 200 with one heading, three key points, one accessible SVG, and an edition-pinned PDF link to the checked first page. At 390×844, none of the 34 pages overflowed horizontally. Focused checks found correct adjacent-Law links at Laws 1, 11, 12, 14, and 17 and 0/1/4/1/0 topic links respectively. Desktop Law 11 and mobile Law 12 screenshots were visually inspected. After correction, Spanish/English Laws 14–17 returned 200 with correct source labels and no overflow; the Law 14 and 16 diagrams were visually inspected.
- An independent read-only Sol/high review initially failed on Law 15–17 delay-award wording, the ball placement in Law 14 and 16 diagrams, and PDF ranges including the next Law's title page. The coordinator corrected content and ranges; the bounded SVG implementer corrected the diagrams. The same independent reviewer re-inspected those changes against the official Spanish and English PDFs and returned **PASS**. It noted that a few ranges still include a blank separator page, without obscuring the correct first-page link.

Requested model/effort: focused source research `gpt-6-luna`/high; diagram implementation `gpt-6-sol`/medium; independent review `gpt-6-sol`/high. Runtime-confirmed model/effort: `unconfirmed` for all, because the runtime did not expose the effective identity. Source research and review were read-only. The delegated implementer changed only `LawIllustration.tsx`.

<a id="04-academy--next"></a>
### Next

Nicolas directed the next Academy work toward the Rules themselves, not the lesson editorial flow. RV-029B maps and builds detailed topic-level bilingual guides and original diagrams across the Laws, using the six already verified topics as the starting point. The approved unpublished lesson and assessments remain outside these public guide pages.

<a id="04-academy--law-depth"></a>
## Law depth

<a id="04-academy--result-2"></a>
### Result

ACA-REQ-007 and ACA-REQ-008 / RV-029A: **PASS** for the expanded 17-Law scope. Every Law page has original bilingual sections with concrete conditions, procedures, exceptions or outcomes, nearby IFAB 2026/27 section/page links, and an annotated bilingual SVG. The guide routes do not require a lesson or database.

ACA-REQ-009 / RV-029B: **PASS for the six existing topic slugs**, while additional topics across the other Laws remain the next slice. The six routes now have three substantive bilingual sections each, their own source-linked diagram, anchored reading navigation, and adjacent-topic links. The static topic route no longer reads the lesson catalog or shows empty lesson/real-play areas. Publication-gated catalog and lesson routes were not changed.

The content uses Nicolas's local Spanish IFAB 2026/27 single-page PDF and the official English edition as factual sources. Explanations and SVGs are original; no PDF text or artwork is embedded as an asset. The application links to the official edition-pinned PDFs, with the online Law link labelled as edition-variable.

<a id="04-academy--independent-review-and-corrections"></a>
### Independent review and corrections

- Astra/high read-only source audit identified missing measurements, conditions, consequences, and misleading Law 1/8/9/11/14/17 geometry. Luna/high read-only diagram audit specified the visual corrections. Requested identities were `gpt-6-astra`/high and `gpt-6-luna`/high; runtime-confirmed identities were `unconfirmed`.
- Bounded Sol/medium implementation produced Laws 1–8 (25 sections), Laws 9–17 (26 sections), six topic guides (18 sections), six topic SVGs, and replacement SVGs for all 17 Laws. Runtime-confirmed identities were `unconfirmed`.
- Independent Sol/high content review found a goalkeeper handling exception, the goalkeeper-coincident offence exception for accidental penalty double contact, and two page ranges. All were corrected and rechecked against the official Spanish and English PDFs. It found no remaining material content or publication-boundary issue.
- Independent Sol/high diagram review found the Law 1 goal-mouth scale, topic penalty-arc sweep, and missing visual handball contact/motion. All were corrected and rechecked in code. It found no remaining source-sensitive geometry or accessibility blocker. Runtime-confirmed reviewer identities were `unconfirmed`.
- After changing SVG labels to the incumbent Source Sans 3, the same independent reviewer measured the tightest labels against the actual font file and returned a follow-up **PASS**. Desktop Playwright screenshots of Law 1 and the handball topic after the font change showed no label clipping.

<a id="04-academy--final-observed-checks"></a>
### Final observed checks

- `pnpm --filter @refview/web typecheck` exited 0 after the content, geometry, and font edits.
- `pnpm --filter @refview/web exec eslint src/features/academy/LawIllustration.tsx src/features/academy/TopicIllustration.tsx src/features/academy/AcademyRulesViews.tsx src/features/academy/LawDetailSections.tsx src/features/academy/law-depth-1-8.ts src/features/academy/law-depth-9-17.ts src/features/academy/topic-depth-v1.ts` exited 0 after those edits.
- `git diff --check -- docs/features/01-academy/requirements.md#04-academy docs/specs/tasks.md apps/web/src/app/[locale]/academy/rules/[lawNumber]/page.tsx apps/web/src/app/[locale]/academy/rules/[lawNumber]/topics/[topicSlug]/page.tsx` exited 0; Git reported only documentation line-ending notices.
- Playwright CLI loaded Spanish Laws 1, 8, 14 and 17 and Spanish handball topic at desktop width. Screenshots of their figures were visually inspected, including the corrected field, kick-off, penalty, corner, and handball relationships.
- Playwright CLI loaded English Law 1 and navigated its adjacent link to Law 2. English Law 1 showed three source-linked depth sections and no horizontal overflow or console errors.
- Playwright CLI loaded the English penalty topic at 390 px: three source-linked sections, a 620 px diagram in a 350 px scrollable figure, and document width 390 px. At 390 px, the figure accepted focus and ArrowRight moved its horizontal scroll position 40 px. The Spanish handball topic also had no document overflow at 390 px.
- An unknown topic slug returned 404. The static topic routes loaded while the local publication database was unavailable.
- The Impeccable detector reported font and palette advisories. SVG labels were changed from Arial to the incumbent Source Sans 3. The remaining palette values match the established Academy visual surface; no new visual system was introduced.

<a id="04-academy--next-slice"></a>
### Next slice

Extend substantive topic guides and original diagrams beyond the current six, beginning with Law 8 restarts, Law 9 boundary decisions, and Law 15–17 restart procedures. Keep edition-pinned sources beside claims and maintain the static guide versus published-lesson boundary.

<a id="04-academy--photographic-scenes"></a>
## Photographic scenes

<a id="04-academy--result-3"></a>
### Result

RV-029C / ACA-REQ-008 and the existing six-topic portion of ACA-REQ-009: **PASS**. The 17 Law pages and six existing topic routes now lead with original photorealistic generated scenes. Each scene has bilingual alt text and a visible generated-scene disclosure. The source-checked SVG diagrams remain available in keyboard-accessible disclosures for exact geometry and rule distinctions. This delivery does not expand topic coverage or publish lessons.

The asset origin and scene map are recorded in `academy-photo-assets.md`. Photos are illustrative; they are not evidence from real matches and do not establish rulings.

<a id="04-academy--independent-review"></a>
### Independent review

- Astra/high read-only art direction recommended 18 scenes, shared visual treatment, and preserving technical diagrams. Requested identity `gpt-6-astra`/high; runtime-confirmed identity `unconfirmed`.
- Sol/medium implemented the bilingual photo mapping and component in two exclusive files. Requested identity `gpt-6-sol`/medium; runtime-confirmed identity `unconfirmed`.
- Sol/high independent read-only review inspected all 18 assets and the integration. It identified imprecise handball imagery/description, generic alt text for the substitution, card and raised-arm scenes, and a topic caption focused on the wrong indirect-free-kick teaching point. The handball scene was regenerated, alt text and topic cue corrected, and the reviewer rechecked the final files with a **PASS**. Requested identity `gpt-6-sol`/high; runtime-confirmed identity `unconfirmed`.

<a id="04-academy--observed-checks-after-the-final-correction"></a>
### Observed checks after the final correction

- `pnpm --filter @refview/web typecheck` exited 0.
- `pnpm --filter @refview/web exec eslint src/features/academy/AcademyPhoto.tsx src/features/academy/academy-photo-v1.ts src/features/academy/AcademyRulesViews.tsx` exited 0.
- Playwright CLI loaded Spanish Law 13 at desktop width: photo loaded, generated-scene caption displayed, diagram disclosure initially closed, no document overflow and no console errors. Its screenshot was visually inspected.
- Playwright CLI loaded the Spanish handball topic at 390 px: photo loaded, diagram disclosure opened by click, SVG appeared, no document overflow and no console errors. A mobile screenshot was visually inspected. After replacing the handball asset, the same route loaded `handball-v3.png`, with matching alt and no overflow.
- Playwright CLI loaded English Law 17 at 390 px: photo loaded, English caption and diagram summary displayed, no document overflow and no console errors.
- The local development server remained available at `http://127.0.0.1:3000`.

No domain tests were added or run for this visual/content change.

<a id="04-academy--restart-and-boundary-topics"></a>
## Restart and boundary topics

<a id="04-academy--result-4"></a>
### Result

**PASS for RV-029B-1 / ACA-REQ-009.** Six bilingual static topic guides were added under Laws 8, 9, 15, 16 and 17, bringing Academy from six to twelve navigable topics. Each new guide has three substantive original sections with nearby edition-pinned IFAB 2026/27 references, a generated illustrative photo and an accessible technical SVG. This is a bounded portion of RV-029B; the remaining Laws still need topic coverage. No lesson publication or database read was added to these routes.

<a id="04-academy--source-and-delegation"></a>
### Source and delegation

- Astra/high read-only planning chose six topics, separated Law 8 kick-off from dropped ball, and defined disjoint content/diagram ownership. Requested identity `gpt-6-astra`/high; runtime-confirmed identity `unconfirmed`.
- Luna/high read-only source mapping checked Nicolas's 276-page Spanish IFAB 2026/27 PDF against the official 260-page English edition, including Law 8's clarified dropped-ball recipient and the conditional five-second protocol for Laws 15 and 16. Requested identity `gpt-6-luna`/high; runtime-confirmed identity `unconfirmed`.
- Sol/medium content implementation wrote only `restart-topic-content-v1.ts`; Sol/medium diagram implementation wrote only `RestartTopicIllustration.tsx`. Both reported scoped lint passing and the content implementer reported typecheck passing. Requested identities `gpt-6-sol`/medium; runtime-confirmed identities `unconfirmed`.
- Independent Sol/high read-only review compared all 18 sections with the Spanish and English official PDFs, inspected six diagram screenshots, registries, route guards and provenance. It found two source-sensitive corrections: the countdown exception while already in the act of taking the restart, and Law 16 opponent intervention before the ball is in play. Both were corrected. The reviewer returned final **PASS** after rechecking the corrected text and supplemental protocol links. Requested identity `gpt-6-sol`/high; runtime-confirmed identity `unconfirmed`.

The new `dropped-ball.png` was generated for RefView, not copied from IFAB or a match. Its origin and prompt are recorded in `academy-photo-assets.md`. All photos are visibly identified as generated illustrative scenes. The exact instructional relationships are in the original diagrams and prose.

<a id="04-academy--observed-implementation-and-browser-checks"></a>
### Observed implementation and browser checks

- `pnpm --filter @refview/web typecheck` exited 0 after the final source and diagram corrections.
- `pnpm --filter @refview/web exec eslint src/features/academy/restart-topic-content-v1.ts src/features/academy/RestartTopicIllustration.tsx src/features/academy/rules-directory-v1.ts src/features/academy/topic-depth-v1.ts src/features/academy/TopicIllustration.tsx src/features/academy/academy-photo-v1.ts src/features/academy/law-depth-contract.ts src/features/academy/LawDetailSections.tsx` exited 0 after those corrections.
- Playwright CLI visited all six new Spanish routes at desktop width and all six English routes at 390 px. Each route showed its title, three depth sections, photo and SVG; none had document horizontal overflow.
- Spanish Law 8 listed both new topics, its dropped-ball page linked to its sibling and next topic, and its language link retained the slug. An invalid Law/slug pair returned 404.
- Playwright CLI screenshots of all six opened diagrams were visually inspected. A corner-arc label overlap was corrected and the final mobile English corner diagram was re-inspected. Its 620 px SVG stayed within a 350 px scrollable figure while the document width remained 390 px; focusing the figure and pressing ArrowRight changed its scroll position from 0 to 40 px.
- After the source corrections, Spanish Law 15 showed the in-act-of-throwing exception and separate PDF links to Law 15 page 153 and protocol page 28. English Law 16 showed the in-act-of-kicking exception and separate links to Law 16 page 145 and protocol page 26. Spanish Law 17 showed separate Law 17 page 161 and protocol page 28 links. These checked routes had no document overflow or browser console errors.

No new automated tests were added or run for this static content and visual slice.

<a id="04-academy--outcome-and-free-kick-topics"></a>
## Outcome and free-kick topics

<a id="04-academy--scope-and-source-evidence"></a>
### Scope and source evidence

Four new static topic guides under Laws 10 and 13 cover ACA-REQ-009. They add twelve original bilingual depth sections, four bilingual technical SVGs, generated-photo context with topic-specific observation cues, and existing edition-pinned source/navigation components. No lesson publication or database dependency was added. Existing twelve topic slugs remain unchanged. The Spanish local and official English IFAB 2026/27 PDFs were checked at Law 10.1–2 ES 111–112 / EN 103–104, Law 10.3 ES 113–115 / EN 105–107, Law 13.1 ES 141 / EN 131, and Law 13.2–3 ES 141–143 / EN 131–133. The 2026/27 accidental double-touch shoot-out clarification was checked at ES 194 / EN 179 in the change summaries and against Law 10.3. The live online Law links may advance edition; the teaching citations link to the pinned PDFs.

<a id="04-academy--delegation-and-independent-review"></a>
### Delegation and independent review

- Read-only planning: requested `gpt-6-astra` / `high`, runtime-confirmed `unconfirmed`; returned the four-slug content/diagram split, integration and visual invariants, with no edits.
- Read-only source research: requested `gpt-6-luna` / `high`, runtime-confirmed `unconfirmed`; extracted both official PDFs, checked the page matrix and source-sensitive exceptions, with no edits.
- Content implementation: requested `gpt-6-sol` / `medium`, runtime-confirmed `unconfirmed`; changed only `outcome-free-kick-topic-content-v1.ts`, delivered four metadata entries and twelve sections; scoped ESLint and TypeScript exited 0, no tests.
- Diagram implementation: requested `gpt-6-sol` / `medium`, runtime-confirmed `unconfirmed`; changed only `OutcomeFreeKickTopicIllustration.tsx`, delivered four accessible SVGs; scoped ESLint exited 0, no tests.
- Independent read-only review: requested `gpt-6-sol` / `high`, runtime-confirmed `unconfirmed`; checked final content, diagrams, photos, registries and route boundary against both PDFs and returned **PASS** with no actionable findings. Coordinator visual inspection then changed one ambiguous indirect-kick diagram label from “direct to goal” to “no other touch.” The same reviewer examined that final label against Law 13.1 and returned a focused **PASS**. Reviewer made no edits or test claims.

<a id="04-academy--coordinator-verification-after-final-code-edit"></a>
### Coordinator verification after final code edit

- `pnpm --filter @refview/web typecheck` exited 0.
- `pnpm --filter @refview/web exec eslint src/features/academy/outcome-free-kick-topic-content-v1.ts src/features/academy/OutcomeFreeKickTopicIllustration.tsx src/features/academy/rules-directory-v1.ts src/features/academy/topic-depth-v1.ts src/features/academy/TopicIllustration.tsx src/features/academy/academy-photo-v1.ts` exited 0.
- Playwright CLI opened all eight ES/EN routes at desktop width and confirmed localized titles. At 390 px all eight showed three depth sections, a photo, and no document overflow. The Law 10 and Law 13 pages listed both new topic links. An invalid Law 10 / `free-kick-procedure` pair returned 404.
- Playwright CLI opened the technical disclosure and inspected screenshots of all four diagrams at desktop; the wall diagram was also inspected at mobile width. On mobile, the SVG figure was horizontally scrollable while the document did not overflow, and keyboard ArrowRight advanced the focused figure's scroll position to 40 px. The language switch retained the Law 13 topic slug; its sibling topic link resolved. Checked new pages had no console errors; a Next development warning was present.
- `git diff --check` on tracked documentation returned exit 0, with only line-ending notices. No automated tests were added or run. No files were staged or committed.

<a id="04-academy--remaining-work"></a>
### Remaining work

RV-029B stays in progress: Laws 1–7 and other unexpanded Laws still lack topic-level guides. The photographic scenes remain labeled generated illustrations, not evidence of real match facts or decisions.

<a id="04-academy--players-referee-and-time-topics"></a>
## Players, referee and time topics

<a id="04-academy--scope-and-result"></a>
### Scope and result

RV-029B-3 satisfies ACA-REQ-009 for six additional static bilingual topic guides: Law 3 substitutions and extra persons, Law 5 referee authority/advantage and injuries/return, and Law 7 periods/intervals and added time/period end. Each topic has three source-linked explanatory sections, an original bilingual SVG and a generated illustrative photo. The guides keep existing topic slugs and render without lesson publication or a database read. RV-029B remains in progress because Laws 1, 2, 4 and 6 have no topic guides.

The new injury-assessment image is original synthetic media with bilingual scene labeling. Its prompt and file provenance are recorded in `academy-photo-assets.md`. The image does not assert an injury type, elapsed time or match fact.

<a id="04-academy--source-review"></a>
### Source review

The edition-pinned 2026/27 IFAB PDFs were checked for Law 3 (ES 63–70 / EN 59–65), Law 5 (ES 81–91 / EN 73–82), Law 7 (ES 101–102 / EN 93–94), the substitution protocol (ES/EN 22–23), the off-field treatment protocol (ES 24–26 / EN 24–25), and the Law 12.4 consequence after advantage for an offence denying an obvious goal-scoring opportunity (ES 129 / EN 120). The Spanish PDF was the local supplied file; the English PDF came from the official download endpoint. Individual sections cite narrower pages and link directly to the appropriate edition PDF page. The exact source matrix and official URLs are in `design.md#players-referee-and-time-topics`.

The official live Law 3 page states temporary exceptions to the fewer-than-seven-player minimum that the downloadable edition PDF does not contain. The Law 3 general guide now qualifies its minimum-seven summary and offers a separately labeled online-update link beside its edition-pinned PDF link. The live page may change editions independently of the downloaded PDF.

<a id="04-academy--corrections-and-independent-review"></a>
### Corrections and independent review

The first independent Sol/high read-only review returned FIX for three issues: substitution arrows did not cross the boundary and one arrowhead pointed the wrong way; the advantage/DOGSO text used an imprecise condition without Law 12.4 citation; English injury-protocol references included p26, which belongs to a different protocol. These were corrected. The design source matrix was also tightened to substantive English Law 3/5 page ranges. The second independent Sol/high read-only review returned PASS after PDF/source checks and rendered inspection of the Spanish substitution SVG and Law 3 online-update link. Requested agent identities were Astra/high for planning, Luna/high for focused source research, Sol/medium for each bounded implementation, and Sol/high for review; runtime-confirmed model and effort were not exposed and remain unconfirmed.

<a id="04-academy--local-verification"></a>
### Local verification

- `pnpm --filter @refview/web typecheck`: passed after the final code changes.
- `pnpm --filter @refview/web exec eslint src/features/academy/players-referee-time-topic-content-v1.ts src/features/academy/PlayersRefereeTimeTopicIllustration.tsx src/features/academy/rules-directory-v1.ts src/features/academy/topic-depth-v1.ts src/features/academy/TopicIllustration.tsx src/features/academy/academy-photo-v1.ts src/features/academy/law-depth-1-8.ts src/features/academy/law-depth-contract.ts src/features/academy/LawDetailSections.tsx`: passed after the final code changes.
- `git diff --check`: exited 0; Git printed only existing working-tree LF/CRLF conversion notices.
- Playwright CLI opened all 24 combinations of six topic slugs, ES/EN and 1280/390 pixel viewport widths: each returned HTTP 200, had its localized title, three substantive sections, an accessible SVG and a loaded labeled photo, and had no document-level horizontal overflow. Desktop screenshots of all twelve ES/EN SVGs were visually inspected for clipping and meaning. The mobile SVG container was focusable and scrolled horizontally by ArrowRight while the document remained 390 pixels wide.
- Playwright CLI opened the ES/EN Law 3, 5 and 7 pages: each listed both new topic links. A wrong Law/slug combination returned HTTP 404. The language switch retained the topic slug. The Law 3 page rendered a distinct official online-update link. Browser console had zero errors and one Next.js image LCP loading hint, unrelated to content correctness.

No automated tests were added or run for this static content slice.

<a id="04-academy--foundation-and-match-official-topics"></a>
## Foundation and match-official topics

<a id="04-academy--scope-and-result-2"></a>
### Scope and result

RV-029B-4 satisfies ACA-REQ-009 for eight static bilingual topic guides under Laws 1, 2, 4 and 6. Each guide has three original source-linked sections, an accessible bilingual instructional SVG, a labeled generated contextual photo with a topic-specific observation cue, and sibling and adjacent navigation. The full registry now has 30 unique topic guides and at least one guide under each of the 17 Laws. The original 22 slugs remain available. These static pages need no lesson publication or database read.

The content and diagrams are in `foundation-officials-topic-content-v1.ts` and `FoundationOfficialsTopicIllustration.tsx`; the design and source matrix are in `design.md#foundation-and-match-official-topics`. The eight guides reuse existing generated Law photos, whose origin is recorded in `academy-photo-assets.md`. A photo illustrates observation context and does not certify a ball, field, item of equipment, official decision, or match fact.

<a id="04-academy--source-and-correction-review"></a>
### Source and correction review

The supplied Spanish and official English IFAB 2026/27 single-page PDFs were checked against the Law and section/page matrix in the design. The focused source-research handoff incorrectly treated Law 4 as retaining a universal jewellery prohibition. Independent review and coordinator comparison with the operative PDF text found that non-dangerous accessories, including jewellery, may be allowed when safely and securely covered, while dangerous items must be removed. The Law 4 topic text, diagram and design were corrected. The live IFAB Law 4 page still has the older blanket wording; both Law 4 views now disclose this discrepancy next to that link and direct edition-specific claims to the pinned PDFs.

The review also narrowed a Law 1 line-boundary explanation to what Law 1 actually establishes, qualified the Law 1 measurement summary for the penalty mark's specified measurement, and distinguished mandatory FIFA/confederation ball quality marks from competition-dependent national requirements in Law 2. Law 6's video-official text stays within the operative Law and does not infer review authority from a disputed call alone. An independent Sol/high read-only re-review of the corrected source, diagrams, and integration returned **PASS** with no remaining source or visual semantics blocker. Requested identities were Astra/high for coordination, Luna/high for source research, Sol/medium for bounded content and diagram work, and Sol/high for read-only review. Runtime-confirmed model and effort were not exposed and remain unconfirmed.

<a id="04-academy--local-verification-2"></a>
### Local verification

- `pnpm --filter @refview/web typecheck`: passed after the final code changes.
- `pnpm --filter @refview/web exec eslint src/features/academy/AcademyRulesViews.tsx src/features/academy/FoundationOfficialsTopicIllustration.tsx src/features/academy/TopicIllustration.tsx src/features/academy/academy-photo-v1.ts src/features/academy/foundation-officials-topic-content-v1.ts src/features/academy/law-depth-1-8.ts src/features/academy/rules-directory-v1.ts src/features/academy/topic-depth-v1.ts`: passed after the final code changes.
- Playwright CLI opened all 32 combinations of eight slugs, ES/EN, and 1280/390 pixel viewport widths after the corrections. Each returned HTTP 200, had the localized title, three explanatory sections and three edition PDF links, an accessible SVG and loaded photo, and no document-level horizontal overflow. All 16 ES/EN desktop diagram screenshots were visually inspected; corrected Law 1, 2 and 4 variants were inspected again after editing.
- Playwright CLI opened the ES/EN Law 1, 2, 4 and 6 listings. Each returned HTTP 200 and linked both topics. A wrong Law/slug combination returned HTTP 404. The language switch retained its slug, the sibling and global adjacent links resolved, and the diagram was focusable and keyboard-scrollable at 390 pixels without widening the document. The Law 4 discrepancy note appeared beside the live link. Browser console had zero errors and one Next.js image LCP hint.

No automated tests were added or run for this static content slice.

---

<a id="22-academy-rules-directory"></a>

<a id="22-academy-rules-directory--academy-rules-directory-review"></a>
## Academy rules directory review

<a id="22-academy-rules-directory--result"></a>
## Result

ARD-REQ-001..005 pass for the local site. Academy lists all 17 IFAB 2026/27 rules, and each route presents original bilingual orientation, an online IFAB law link, the edition-pinned PDF, and a published-only RefView topic area. The approved lesson and three Assessment drafts remain outside public catalogs. This feature did not change their source files, hashes, DTOs, review state, or scoring.

The implementation was delegated with requested `gpt-6-sol`/medium; an independent read-only review used requested `gpt-6-sol`/high. Upper coordination requested `gpt-6-astra`/medium. Runtime-confirmed model/effort was not exposed for these agents and remains unconfirmed.

<a id="22-academy-rules-directory--evidence"></a>
## Evidence

- `pnpm --filter @refview/web typecheck`: passed after implementation.
- Scoped Academy ESLint: passed after implementation.
- Playwright CLI: Spanish index had 17 links; each law route 1–17 returned 200 with two official references; invalid values `0`, `18`, `01`, and `abc` returned 404. English index had 17 links. Law 12 locale switching and external reference links worked. ES/EN index and Law 12 at 390px had no horizontal overflow; first Tab reached the skip link; console had zero errors.
- Coordinator visually inspected `artifacts/academy-rules-index-es.png`, `artifacts/academy-rule-12-es.png`, and `artifacts/academy-rule-12-mobile-es.png` captured with Playwright CLI.
- Independent reviewer verified all 17 Spanish online IFAB law URLs returned HTTP 200; both edition-pinned ES/EN PDF URLs returned HTTP 200 with `application/pdf`. Bilingual titles matched the official IFAB 2026/27 index. Static review confirmed canonical route validation, edition and primary-law filtering, verified-publication reader, and distinct empty/unavailable states. Final result: PASS.

<a id="22-academy-rules-directory--remaining-boundary"></a>
## Remaining boundary

No real Academy lesson is published, so a positive Law 12 topic card has not been exercised in the browser. The page will link a topic only after the existing trusted publication path admits it. Assessment media slots remain a future content/DTO change: curated images or external links used for a decision must be in the initial evidence projection; correction-only media may appear only after finalization.

---

<a id="23-academy-topic-hubs"></a>

<a id="23-academy-topic-hubs--academy-topic-hub-review"></a>
## Academy topic hub review

<a id="23-academy-topic-hubs--scope-and-result"></a>
## Scope and result

ATH-01 satisfies ATH-REQ-001..006. The 17 Law cards now include their original one-line overviews. Law 12 has one static, bilingual `challenge` topic card; the other Laws show an honest no-topics state. The topic route validates locale, canonical Law number, slug, and Law membership. It offers orientation, official Law 12 and pinned 2026/27 sources, verified published lessons only, and an empty real-play area. Nicolas chose to wait for his real cases. No fictional plays, empty media cards, or draft links were added.

The approved Academy lesson and three Assessment drafts remain unpublished. Static topic navigation does not change their approved hashes or reveal their content. The topic route filters `readAcademyCatalog(locale)` by exact topic ID and edition. A successful empty catalog and an unavailable read have distinct lesson states. No published lesson exists locally, so the positive public lesson link could be checked in code only.

<a id="23-academy-topic-hubs--verification"></a>
## Verification

- From `apps/web`, `pnpm typecheck` ran `tsc --noEmit` and exited 0.
- From `apps/web`, `pnpm exec eslint src/features/academy/AcademyRulesViews.tsx src/features/academy/rules-directory-v1.ts 'src/app/[locale]/academy/rules/[lawNumber]/topics/[topicSlug]/page.tsx'` exited 0 without findings.
- Playwright CLI opened `http://127.0.0.1:3000/es/academy`. `playwright-cli eval "({cards:document.querySelectorAll('.rv-academy__rules-grid li').length,overviews:document.querySelectorAll('.rv-academy__rules-overview').length,overflow:document.documentElement.scrollWidth>window.innerWidth})"` returned 17 cards, 17 overviews, and no overflow.
- `playwright-cli goto http://127.0.0.1:3000/es/academy/rules/12` and topic-link click reached `/es/academy/rules/12/topics/challenge`. Topic DOM inspection showed an empty published-lesson state, an empty real-play section, and only the back, official Law, and pinned PDF links. The locale switch reached the English topic route and English references.
- `playwright-cli resize 390 844` and a width/section evaluation returned `width: 390`, `scrollWidth: 390`, two topic sections, and two official references. The English Academy directory showed 17 cards and 17 overviews at the same width.
- Keyboard Tab and Enter reached and opened the Law 12 topic link with a visible solid focus outline. The English Academy skip link also had visible focus.
- A Playwright CLI navigation loop returned 404 for `/es/academy/rules/11/topics/challenge`, `/es/academy/rules/12/topics/unknown`, `/es/academy/rules/012/topics/challenge`, `/es/academy/rules/18/topics/challenge`, and `/fr/academy/rules/12/topics/challenge`. Law 11 showed no topic links and the empty state.
- Desktop and 390px screenshots of the directory, Law 12, and topic were visually inspected. They are stored locally in `artifacts/academy-topic-*.png`. The Impeccable detector reported advisory palette/type-ramp entries only.
- `git diff --check` on changed project documentation found no whitespace error.

Independent read-only review returned **PASS** after inspecting code and the four desktop/mobile screenshots. The reviewer confirmed route validation, database-independent Law navigation, publication filtering, official sources, empty real-play state, and the focused browser evidence. Requested reviewer identity was `gpt-6-sol`/`high`; runtime-confirmed identity was `unconfirmed`. Requested implementer identity was `gpt-6-sol`/`medium`; runtime-confirmed identity was `unconfirmed`. Requested upper coordination identity was `gpt-6-astra`/`medium`; runtime-confirmed identity was `unconfirmed`.

<a id="23-academy-topic-hubs--remaining-input"></a>
## Remaining input

ATH-02 remains planned. Nicolas will supply real cases and media rights/provenance before any play examples are authored, reviewed, or published. This pass did not change the simulator or add broad tests.

---

<a id="24-academy-law-expansion"></a>

<a id="24-academy-law-expansion--academy-law-expansion-review"></a>
## Academy Law expansion review

<a id="24-academy-law-expansion--result"></a>
## Result

ALE-REQ-001..005 passed independent read-only review. The Academy directory has 17 distinct, locally authored, decorative SVG icons while retaining visible Law numbers, titles, one-line scopes, and links. Laws 11, 12, and 14 provide six bilingual topic hubs with original explanation, three key concepts, section/page source locators, and edition-pinned PDF links that jump to the first cited physical page. The topic route still validates locale, canonical Law number, slug, and primary-Law membership. Verified published catalog results are filtered by exact topic and `IFAB-2026-27`; no draft fixture or invented real play is shown. The approved lesson and Assessment candidates remain unpublished.

<a id="24-academy-law-expansion--source-check"></a>
## Source check

Nicolas supplied the local IFAB Spanish 2026/27 single-pages PDF (276 pages). The implementer checked its physical page indices, and the independent reviewer checked all six Spanish ranges: Law 11 sections 1–2 pp.117–119; Law 12 section 1 contact pp.123–124 and handball pp.124–126, section 2 indirect free kick pp.126–128, section 4 discipline pp.128–136; Law 14 section 1 penalty procedure pp.145–146. The implementer downloaded the official English PDF temporarily, verified that its 260 physical pages use different indices, and removed the temporary file. English links use pp.109–111, 115–116, 116–118, 118–119, 119–127, and 135–136 for the corresponding topics. The reviewer found the mappings consistent. The source PDF's page 4 prohibits reproduction without prior consent, so the site uses original RefView copy, locally drawn icons, and official links; no rule paragraphs or illustrations were copied.

<a id="24-academy-law-expansion--commands-and-observed-outcomes"></a>
## Commands and observed outcomes

- `pnpm --filter @refview/web typecheck` ran `tsc --noEmit` and exited 0 after the final page-link and mobile-spacing edits.
- `pnpm --filter @refview/web exec eslint src/features/academy/AcademyRulesViews.tsx src/features/academy/LawIcon.tsx src/features/academy/rules-directory-v1.ts` exited 0 without findings after the final edits.
- `git diff --check -- README.md CHECKLOG.md docs/specs/tasks.md apps/web/src/features/academy/AcademyRulesViews.tsx apps/web/src/features/academy/catalog-ui-v1.css apps/web/src/features/academy/rules-directory-v1.ts` exited 0. Git printed only CRLF conversion notices for existing documentation.
- `playwright-cli open http://127.0.0.1:3000/es/academy`, followed by a `playwright-cli run-code` count of `.rv-academy__rules-grid li` and `svg[aria-hidden=true]`, found 17 cards, 17 icons, 17 unique SVG motifs, and no horizontal overflow.
- A Playwright CLI navigation loop opened the six slugs in both `es` and `en`: all 12 routes returned 200 with localized titles, three concepts, and source locators. A separate loop got 404 for `/es/academy/rules/11/topics/handball`, `/es/academy/rules/12/topics/not-a-topic`, and `/es/academy/rules/14/topics/challenge`. Law 12/11/14 pages exposed 4/1/1 topic links.
- `playwright-cli open http://127.0.0.1:3000/es/academy#rules-directory-title`, `playwright-cli resize 390 844`, and a `playwright-cli run-code` geometry check found no overflow and clear separation between title, edition label, and intro (`titleBottom` 417.34, `editionTop` 425.34, `introTop` 462.34). `playwright-cli screenshot --filename=artifacts/academy-law-icons-mobile-final.png` was visually inspected by implementer, reviewer, and coordinator.
- `playwright-cli goto http://127.0.0.1:3000/en/academy/rules/12/topics/handball` plus reference-link inspection showed English pages 116–118 and a PDF URL ending `#page=116`, with no overflow. The corresponding Spanish Law 11 topic showed pages 117–119 and `#page=117`. Earlier EN mobile checks found 17 cards/icons, no overflow, no draft link, an empty real-play area, and a keyboard-reachable skip link.

Independent reviewer verdict: **PASS** after the mobile-spacing and PDF-page corrections. Requested identities: upper coordination `gpt-6-astra`/`medium`, PDF research `gpt-6-luna`/`high`, UI implementation `gpt-6-sol`/`medium`, read-only review `gpt-6-sol`/`high`. Runtime-confirmed identities: `unconfirmed` for all. No broad UI tests, database changes, simulator work, or Git publication were part of this pass.

<a id="24-academy-law-expansion--remaining-boundaries"></a>
## Remaining boundaries

The static topic selection is the first slice, not complete coverage of the Laws. No real cases or additional reviewed/published lessons exist yet. The current authored-lesson topic contract still recognizes only `challenge`; future topic lessons require a separately reviewed contract and content-publication step. Some external PDF viewers may ignore `#page` fragments, while the section and page labels remain visible on the site.
