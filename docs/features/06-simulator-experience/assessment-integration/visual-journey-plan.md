# Assessment visual journey before account and persistence integration

## Objective and route

Use a proportional direct SDD slice to make the three approved bilingual draft exercises navigable as a local visual preview. The current catalog, question, and example-correction components already exist under the direct-only editorial preview; this slice connects their presentation and permits unsaved local input exploration. The public catalog remains publication-gated and empty while the drafts are unpublished.

## Observable acceptance

- **AVJ-REQ-001:** The local-only preview lists exactly the three approved draft types and preserves their titles, facts, options, source references, and version identities.
- **AVJ-REQ-002:** A visitor can select or type an example answer in each question view without an account, database attempt, grading, or persistence. The view states these limits clearly.
- **AVJ-REQ-003:** The prepared example correction is a separate request and explicitly does not evaluate the visitor's selection. From it, a visitor can open an approved suggested next draft or return to the preview catalog.
- **AVJ-REQ-004:** Spanish and English, keyboard use, desktop and 390-pixel layouts, and the unpublished/direct-only boundary remain clear.

## Tasks and later boundary

1. Keep the existing server-side draft and local-origin gate. Reuse its allowlisted question DTO and separate correction projection.
2. Make preview-only fields interactive without submitting them; clarify the sample correction action and next-draft navigation.
3. Inspect the three question types and correction flow in both locales at desktop and mobile sizes. Run typecheck and scoped lint. Do not add or run automated tests for this presentation slice.

After visual approval, handle real access and persistence as a separate reviewed stage: choose account authentication and its relationship to the existing anonymous owner; reconcile the already present PostgreSQL Assessment tables and migrations with that owner model; then connect trusted publication, private answer evaluation, idempotent attempts, saved results, and a real next-practice journey. Existing tables are local implementation, not evidence that this browser flow is complete. No account, schema, migration, publication, scoring, or saved-attempt changes belong to the visual slice.
