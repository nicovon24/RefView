# Academy task contracts

## RV-020 - Freeze lesson, source, and publication contracts

- Requirements: all ACA requirements.
- Dependencies: RV-017 and RV-018.
- Deliver: taxonomy, immutable lesson/source refs, translation equivalence, lifecycle, related-practice eligibility, valid/invalid examples, and persistence plan.
- Acceptance: independent content/contract review; wrong-edition, missing attribution, unpublished target, and retired content tests are specified.

## RV-021 - Author one complete reviewed lesson

- Requirements: ACA-REQ-002, ACA-REQ-003, ACA-REQ-005, ACA-REQ-006.
- Dependencies: RV-020.
- Deliver: one bilingual lesson related to the accepted incident, example, technical explanation, official source, prepared questions, and review record.
- Acceptance: Nicolas approves football meaning; source and asset provenance are complete; draft cannot enter discovery.

## RV-022 - Implement Academy catalog and lesson experience

- Requirements: ACA-REQ-001 through ACA-REQ-003, ACA-REQ-006.
- Dependencies: RV-020, RV-021, RV-050.
- Deliver: responsive browse/detail journey using only published content.
- Acceptance: tests for edition/taxonomy/publication filters; Playwright CLI verifies both languages, deep links, keyboard use, empty/unavailable states, and responsive layout.

## RV-023 - Connect prepared follow-ups and real practice

- Requirements: ACA-REQ-004, ACA-REQ-005.
- Dependencies: RV-022 and accepted provider-free prepared-response contract from RV-061.
- Deliver: explanation -> prepared answer -> compatible simulator practice. Assessment recommendations remain disabled until RV-044.
- Acceptance: no AI key; reference/edition preserved; missing or retired practice produces an honest alternative.

## RV-024 - Academy acceptance

- Requirements: all ACA requirements.
- Dependencies: RV-023.
- Acceptance: complete bilingual learning loop, publication/source boundaries, prepared-mode labeling, responsive/accessibility checks, and independent review pass.
