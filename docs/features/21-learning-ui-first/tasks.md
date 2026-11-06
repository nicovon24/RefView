# Learning interface-first task contracts

Status is tracked only in `../../specs/tasks.md`.

## LUI-01: Academy presentation

- Dependencies: existing `CatalogLesson` and `PublicLesson` projections; approved unpublished lesson.
- Deliver: bilingual reusable catalog/lesson views, published route composition, and clearly unpublished direct-only interface preview.
- Acceptance: exact lesson/source content unchanged; public empty/unavailable behavior retained; focused desktop/mobile visual inspection and independent read-only review.

## LUI-02: Assessment presentation

- Dependencies: existing allowlisted catalog/active/result DTOs and local editorial preview gate.
- Deliver: bilingual reusable catalog/question/result views; published route composition; gated UI preview of approved drafts with separate example correction request.
- Acceptance: active question contains no accepted-answer/correction data or markup; public ownership/publication behavior retained; focused desktop/mobile visual inspection and independent read-only review.

## LUI-03: Integration

- Dependencies: LUI-01 and LUI-02.
- Deliver: coherent navigation and honest links between available learning surfaces, final visual inspection, scoped typecheck/lint, tracker and review record.
- Acceptance: ES/EN desktop/mobile paths, no horizontal overflow or browser errors, and independent milestone review. No broad new tests.
