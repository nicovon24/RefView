# Academy task contracts

## RV-020 - Freeze lesson, source, and publication contracts

- Requirements: ACA-REQ-001 through ACA-REQ-006; the later 17-Law summaries are RV-029A.
- Dependencies: RV-018 design direction. The content contract is independent of simulator expansion acceptance.
- Deliver: taxonomy, immutable lesson/source refs, translation equivalence, lifecycle, related-practice eligibility, valid/invalid examples, and persistence plan.
- Acceptance: independent content/contract review; wrong-edition, missing attribution, unpublished target, and retired content tests are specified.

## RV-021 - Author one complete reviewed lesson

- Requirements: ACA-REQ-002, ACA-REQ-003, ACA-REQ-005, ACA-REQ-006.
- Dependencies: RV-020.
- Deliver: one bilingual lesson related to the accepted incident, example, technical explanation, official source, prepared questions, and review record.
- Acceptance: Nicolas approves football meaning; source and asset provenance are complete; draft cannot enter discovery.

## RV-021A - Prepare a bounded editorial draft

- Requirements: draft portions of ACA-REQ-002, ACA-REQ-003, and ACA-REQ-005.
- Dependencies: independently reviewed RV-020 editorial boundary and the source-checked `lesson-brief.md`. Full executable publication contract remains RV-020 work.
- Deliver: bilingual version-labelled lesson text, explicit facts/evidence/interpretation/rule sections, exact edition-pinned IFAB source links, and labelled prepared follow-ups in an editorial preview route.
- Acceptance: no discovery, score, publication claim, or live practice link; both languages and direct-route/mobile browser review. Nicolas's football-content approval is still required before RV-021 publication.

## RV-022 - Implement Academy catalog and lesson experience

- Requirements: ACA-REQ-001 through ACA-REQ-003, ACA-REQ-006.
- Dependencies: RV-020 and RV-021.
- Deliver: responsive browse/detail journey using only published content, including labelled prepared lesson follow-ups without an AI provider.
- Acceptance: tests for edition/taxonomy/publication filters; Playwright CLI verifies both languages, deep links, keyboard use, empty/unavailable states, and responsive layout.

## RV-023 - Connect real compatible practice

- Requirements: ACA-REQ-004.
- Dependencies: RV-022 and one published compatible assessment under RV-044 or simulator incident under RV-011.
- Deliver: lesson -> available compatible practice. The first target may be an assessment; an unscored local simulator preview is never offered as scored practice.
- Acceptance: reference/edition preserved; missing or retired practice produces an honest unavailable state.

## RV-024A - Accept the first Academy stage

- Requirements: ACA-REQ-001 through ACA-REQ-003, ACA-REQ-005 through ACA-REQ-007; scoped PRO-REQ-004 for published-lesson saving.
- Dependencies: RV-020B Academy-scoped admission, RV-021, RV-022, RV-029A, and the positive published-lesson save path in RV-052.
- Deliver: 17 useful bilingual Law summaries with official references, navigable topic pages, a repeatable reviewed lesson admission/publication/retirement procedure, one controlled published lesson, prepared follow-ups, and a real save/unsave journey. Related practice remains unavailable until a compatible published target exists.
- Acceptance: discover, read, cite, save, reload, and unsave the published lesson in both languages; verify that only a trusted reviewer can publish exact approved versions or retire them, plus source links, truthful empty practice, responsive navigation, and independent review.

## RV-024 - Academy acceptance

- Requirements: all ACA requirements.
- Dependencies: RV-024A and RV-023 after a compatible Assessment or simulator incident is published.
- Acceptance: complete bilingual learning loop, publication/source boundaries, prepared-mode labeling, responsive/accessibility checks, and independent review pass.

## RV-029A - Build useful guides for all 17 Laws

- Requirements: ACA-REQ-007 and ACA-REQ-008.
- Dependencies: RV-026 and RV-029; edition-pinned official sources.
- Deliver: original bilingual explanations and key points, one original visual per Law, precise 2026/27 IFAB references, previous/next/directory navigation, and topic links where topics exist.
- Acceptance: all 17 pages are useful without a lesson or database; Spanish/English meaning and official page locators receive source review. Inspect desktop/mobile and keyboard navigation. Do not reproduce official Law text or invent real-play cases. This route is scoped to the Law pages; lesson publication is separate.

## RV-029B - Extend topic-level Law navigation

- Requirements: ACA-REQ-009.
- Dependencies: RV-029A and the verified six-topic foundation under RV-029.
- Deliver: a source-mapped topic outline for all 17 Laws, followed by original bilingual topic guides and explanatory diagrams in bounded Law groups.
- Acceptance: topic links resolve in both languages, each guide explains a distinct decision or procedure and cites its precise 2026/27 section, and no guide claims a lesson or real case exists. Review source meaning and inspect desktop/mobile navigation. Do not copy IFAB artwork or full Law text.

## RV-029C - Make Academy Law imagery more realistic

- Requirements: ACA-REQ-008 and the existing six-topic portion of ACA-REQ-009.
- Dependencies: RV-029A visual/source contract and the six existing topic routes.
- Deliver: original photorealistic generated scenes for all 17 Laws and the handball topic, bilingual accessible scene descriptions, explicit generated-scene disclosure, and the precise original diagrams available on demand.
- Acceptance: each Law and existing topic route loads its intended scene; photos do not assert a match fact or decision; diagrams remain keyboard-accessible; desktop/mobile presentation and asset origin receive independent review. This visual task does not expand topic coverage or lesson publication.

## RV-029B-1 - Add restart and boundary topic guides

- Requirements: ACA-REQ-009; six new topic routes under Laws 8, 9, 15, 16, and 17.
- Dependencies: verified 2026/27 source matrix and the shared `TopicDepth`/metadata/diagram contract in `restart-topics-design.md`.
- Content implementer: author six bilingual metadata entries and 18 source-linked sections in the exclusive file `restart-topic-content-v1.ts`.
- Visual implementer: author six accessible bilingual instructional diagrams in the exclusive file `RestartTopicIllustration.tsx`.
- Coordinator: integrate metadata, depth, diagram and photo registries; record the dedicated dropped-ball photo source; verify navigation and static rendering; arrange independent content/visual review.
- Acceptance: all 12 new ES/EN routes render substantive teaching, correct 2026/27 references, photo and diagram; Law 8 sibling and global adjacent navigation work; invalid Law/slug pairs remain unavailable; desktop/mobile layout and keyboard access are inspected. Remaining topic expansion stays under RV-029B.

## RV-029B-2 - Add outcome and free-kick topic guides

- Requirements: ACA-REQ-009; four new topic routes under Laws 10 and 13.
- Dependencies: verified 2026/27 source matrix and shared contract in `outcome-free-kick-topics-design.md`.
- Content implementer: four bilingual metadata records and twelve source-linked sections in the exclusive file `outcome-free-kick-topic-content-v1.ts`.
- Visual implementer: four original accessible bilingual diagrams in the exclusive file `OutcomeFreeKickTopicIllustration.tsx`.
- Coordinator: integrate registries and photo observation cues, verify route/navigation/static rendering, and arrange independent source/visual review.
- Acceptance: all eight ES/EN routes render substantive teaching, source links, photo and diagram; Law 10/13 sibling and global adjacent navigation work; wrong Law/slug pairs return 404; desktop/mobile layout and keyboard access are inspected. Other Law topic coverage remains under RV-029B.

## RV-029B-3 - Add player, referee and time topic guides

- Requirements: ACA-REQ-009; six new topic routes under Laws 3, 5 and 7.
- Dependencies: verified 2026/27 PDF and protocol source matrix, plus the shared contract in `players-referee-time-topics-design.md`.
- Content implementer: six bilingual metadata records and eighteen source-linked sections in the exclusive file `players-referee-time-topic-content-v1.ts`.
- Visual implementer: six accessible original bilingual diagrams in the exclusive file `PlayersRefereeTimeTopicIllustration.tsx`.
- Coordinator: integrate registries/photos, correct the existing Law 3 seven-player statement against the official live update, verify static navigation and arrange independent source/visual review.
- Acceptance: all twelve ES/EN routes render substantive teaching, exact PDF/protocol links, contextual photo and diagram; Law 3/5/7 sibling and global adjacent navigation work; wrong Law/slug pairs return 404; desktop/mobile layout and keyboard access are inspected. Other Law topic coverage remains under RV-029B.

## RV-029B-4 - Complete foundation and match-official topic coverage

- Requirements: ACA-REQ-009; eight new topic routes under Laws 1, 2, 4 and 6.
- Dependencies: verified 2026/27 Spanish/English PDF source matrix and the shared contract in `final-laws-topics-design.md`.
- Content implementer: eight bilingual metadata records and twenty-four source-linked sections in the exclusive file `foundation-officials-topic-content-v1.ts`.
- Visual implementer: eight original accessible bilingual diagrams in the exclusive file `FoundationOfficialsTopicIllustration.tsx`.
- Coordinator: integrate registries and existing photo observations, verify static navigation and source links, and arrange independent source/visual review.
- Acceptance: all sixteen ES/EN routes render substantive teaching, precise pinned sources, contextual photo and diagram; all four Law listings and sibling/adjacent navigation work; wrong Law/slug pairs return 404; desktop/mobile geometry and keyboard access are inspected. Reconcile the completed topic inventory before changing RV-029B status.
