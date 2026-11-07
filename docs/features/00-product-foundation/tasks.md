<a id="02-product-concept"></a>

<a id="02-product-concept--full-product-concept-task-contracts"></a>
## Full-product concept task contracts

<a id="02-product-concept--rv-018-visual-direction-and-interactive-product-concept"></a>
## RV-018 - Visual direction and interactive product concept

- Requirements: CON-REQ-001 through CON-REQ-007.
- Dependencies: current product journeys and reference register for the static concept; RV-004 runnable workspace for application integration.
- Ownership: coordinator owns the visual-direction decision and shared design system; bounded implementation may be delegated only after the direction is approved.
- Deliver: `DESIGN.md`, design tokens, bilingual responsive shell, and navigable principal screens for all product areas with honest fixture labels.
- Acceptance: Playwright CLI verifies journeys and responsive states; `web-design-guidelines` audit passes after fixes; visual review compares the result with the approved direction.
- Stop conditions: no approved visual direction, invented real-world claims, or concept code that presents mocked behavior as implemented.

The static concept was completed before RV-004 and remains in review for missing supporting states. Its design system must be integrated before RV-010 finalizes the simulator interface and before production Academy/Community surfaces inherit it.

---

<a id="17-app-first-delivery"></a>

<a id="17-app-first-delivery--app-first-coordination-tasks"></a>
## App-first coordination tasks

Task status is tracked only in `../../specs/tasks.md`.

<a id="17-app-first-delivery--app-01-freeze-independent-contracts"></a>
## APP-01: Freeze independent contracts

- Covers APP-REQ-001 through APP-REQ-004.
- Maps to RV-020, RV-030A, RV-030, RV-040, and RV-050 contract slices in the canonical tracker.
- Coordinator owns source identity, publication, production owner scope, moderator authority, answer-key authority, preference scope, and availability contracts.
- Evidence: concrete valid/invalid examples and independent read-only contract review before persistence or scoring implementation.

<a id="17-app-first-delivery--app-02-deliver-academy-law-summaries-and-a-published-lesson"></a>
## APP-02: Deliver Academy Law summaries and a published lesson

- Covers APP-REQ-001 and APP-REQ-005.
- Maps to RV-020B Academy scope, RV-021, RV-022, RV-024A, RV-029A, and the published-lesson save portion of RV-052. RV-026/RV-027/RV-029 provide verified navigation.
- Dependencies: APP-01 content identity, edition-pinned IFAB references, and Nicolas's exact content/source approval. Trusted reviewer admission and database publication remain required.
- Evidence: useful bilingual summaries for all 17 Laws; repeatable trusted review, publication, and retirement of exact lesson versions; discovery, reading, sources, prepared answers, and real owner-bound save/reload/unsave of one published lesson. The absent practice target is explicit until APP-03.

<a id="17-app-first-delivery--app-03-deliver-assessments-and-connect-academy-practice"></a>
## APP-03: Deliver Assessments and connect Academy practice

- Covers APP-REQ-003 and APP-REQ-005; completes Academy's ACA-REQ-004.
- Maps to RV-041 through RV-044, then RV-023 and RV-024.
- Dependencies: APP-02 published Academy lesson, reviewed content/source and answer-key contracts, and trusted Assessment-scoped publication of the approved items.
- Evidence: private answer keys, owned PostgreSQL results, bilingual answer/correction/next-practice browser flows, compatible Academy link, and independent scoring review.

<a id="17-app-first-delivery--app-04-accept-the-fictional-community-visual-journey"></a>
## APP-04: Accept the fictional Community visual journey

- Covers the current visual-only portion of APP-REQ-002 and APP-REQ-005.
- Maps to the current RV-036 visual slice and `../20-community-social/`; RV-032..035 remain superseded fictional-only interaction paths.
- Dependencies: APP-03 as a delivery-order gate, not a data dependency; existing fictional fixture provenance and reviewed visual scope.
- Evidence: bilingual responsive and keyboard review of the clearly labeled fictional post, selected play opinion, illustration/link/file treatment, reactions, comments/replies, and secondary match referee rating. No publishing or reaction write is claimed.
- Later functional social work requires durable contributor identity, owned match/play/review/discussion persistence, media handling, moderation, privacy review, and an explicit exposure decision.

<a id="17-app-first-delivery--app-05-deliver-early-profile"></a>
## APP-05: Deliver early Profile

- Covers the early preference/save portion of APP-REQ-004 and APP-REQ-005.
- Maps to RV-050, RV-052, and scoped RV-054.
- Dependencies: APP-04 as a delivery-order gate, reviewed production owner/preference/deletion contract, and available published content for saves.
- Evidence: owner-isolated reads/mutations, honest empty history, browser flows, and independent privacy review.

<a id="17-app-first-delivery--app-06-complete-first-incident-and-integrate-profile-history"></a>
## APP-06: Complete first incident and integrate Profile history

- Covers APP-REQ-006 and the history/progress portion of APP-REQ-004.
- Maps to RV-005 through RV-011 and RV-051.
- Dependencies: APP-05 as a delivery-order gate; exact source/build/capture review and observation calibration before training publication.
- Evidence: trusted visual publication, browser-to-PostgreSQL scored flow, real history, and independent integrated review.

<a id="17-app-first-delivery--app-07-refine-simulator-presentation"></a>
## APP-07: Refine simulator presentation

- Cosmetic work after APP-06; evidence-critical corrections remain in APP-06.
- Maps to a later scoped visual task; it does not close APP-REQ-006 by itself.
- Evidence: fixed-tick and normal-speed contact/ball/fall/camera captures, renewed observation calibration and source/build binding where affected, named-device performance, and Nicolas's football review.
