<a id="06-assessments"></a>

<a id="06-assessments--assessments-task-contracts"></a>
## Assessments task contracts

<a id="06-assessments--rv-040-freeze-assessment-scoring-and-secrecy-contracts"></a>
## RV-040 - Freeze assessment, scoring, and secrecy contracts

- Requirements: all ASM requirements.
- Dependencies: RV-020 and a reviewed owner/answer-key authority boundary. Community acceptance is independent.
- Deliver: item types, immutable submissions, applicability, reveal timing, ownership/retry, reasoning treatment, correction/recommendation refs, and public/private projections.
- Acceptance: independent scoring/persistence review and valid/invalid examples.

<a id="06-assessments--rv-041-author-reviewed-starter-exercise-set"></a>
## RV-041 - Author reviewed starter exercise set

- Requirements: ASM-REQ-002, ASM-REQ-004, ASM-REQ-005.
- Dependencies: RV-040.
- Deliver: one bilingual item of each accepted type with rationale, source, allowed alternatives, and review record.
- Acceptance: Nicolas approves football interpretation; catalog size remains explicit.

<a id="06-assessments--rv-042-implement-assessment-attempt-and-evaluation-core"></a>
## RV-042 - Implement assessment attempt and evaluation core

- Requirements: ASM-REQ-003, ASM-REQ-004, ASM-REQ-006.
- Dependencies: RV-040, RV-041.
- Red/green evidence: correct/incorrect/interpretative answers, malformed input, answer-key exclusion, reveal guard, retry conflict, immutable initial answer, wrong owner, and transaction rollback against PostgreSQL.

<a id="06-assessments--rv-043-implement-practice-and-correction-journey"></a>
## RV-043 - Implement practice and correction journey

- Requirements: ASM-REQ-001, ASM-REQ-005.
- Dependencies: RV-042 and one published compatible next assessment.
- Deliver: topic selection -> answer/reasoning -> confirm -> correction -> actual next assessment. A separately reviewed text exercise may discuss an authored incident; simulator-derived positioning evidence waits for RV-011.
- Acceptance: Playwright CLI verifies Spanish/English, refresh/retry, keyboard use, secrecy, and scored/unscored/not-applicable dimensions.

<a id="06-assessments--rv-044-assessments-acceptance"></a>
## RV-044 - Assessments acceptance

- Requirements: all ASM requirements.
- Dependencies: RV-043.
- Acceptance: complete provider-free journey plus independent review of scoring authority, reviewed content, ownership, secrecy, and persistence.

---

<a id="19-content-publication"></a>

<a id="19-content-publication--publication-task-contracts"></a>
## Publication task contracts

Status is tracked only in [`../../specs/tasks.md`](../../../specs/tasks.md).

1. Freeze and independently review the administrator admission contract and migration/role design.
2. Add immutable content/review/publication/event tables and PostgreSQL role enforcement with synthetic test fixtures.
3. Implement draft import, source recompilation, eligibility, and audited publish/retire CLI against the isolated test database.
4. After exact Nicolas approval and trusted principal setup, admit real receipts and perform only the authorized local transitions.
5. Build Academy catalog/lesson/prepared follow-ups from verified published reads; keep practice unavailable until its exact target qualifies.
6. Add Assessment public DTO boundaries and leak tests before active-attempt routes, then connect the separate owner-bound scoring lifecycle.

Each stage records commands, observed outcomes, and independent review before the next authority boundary relies on it.

---

<a id="21-learning-ui-first"></a>

<a id="21-learning-ui-first--learning-interface-first-task-contracts"></a>
## Learning interface-first task contracts

Status is tracked only in `../../specs/tasks.md`.

<a id="21-learning-ui-first--lui-01-academy-presentation"></a>
## LUI-01: Academy presentation

- Dependencies: existing `CatalogLesson` and `PublicLesson` projections; approved unpublished lesson.
- Deliver: bilingual reusable catalog/lesson views, published route composition, and clearly unpublished direct-only interface preview.
- Acceptance: exact lesson/source content unchanged; public empty/unavailable behavior retained; focused desktop/mobile visual inspection and independent read-only review.

<a id="21-learning-ui-first--lui-02-assessment-presentation"></a>
## LUI-02: Assessment presentation

- Dependencies: existing allowlisted catalog/active/result DTOs and local editorial preview gate.
- Deliver: bilingual reusable catalog/question/result views; published route composition; gated UI preview of approved drafts with separate example correction request.
- Acceptance: active question contains no accepted-answer/correction data or markup; public ownership/publication behavior retained; focused desktop/mobile visual inspection and independent read-only review.

<a id="21-learning-ui-first--lui-03-integration"></a>
## LUI-03: Integration

- Dependencies: LUI-01 and LUI-02.
- Deliver: coherent navigation and honest links between available learning surfaces, final visual inspection, scoped typecheck/lint, tracker and review record.
- Acceptance: ES/EN desktop/mobile paths, no horizontal overflow or browser errors, and independent milestone review. No broad new tests.
