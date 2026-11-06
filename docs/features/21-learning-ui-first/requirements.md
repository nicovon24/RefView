# Learning interface-first pass

Task status is tracked only in `../../specs/tasks.md`.

## Objective

Make Academy and Assessments visually understandable and navigable before their approved content is admitted to the production publication database. Keep public routes truthful and prepare reusable presentation components for the existing published readers and attempt lifecycle.

## Observable acceptance

- **LUI-REQ-001:** Academy has a bilingual, responsive catalog, lesson, example, source, prepared follow-up, and related-practice presentation. A separate visibly unpublished interface preview can show the exact approved lesson without adding it to the public catalog.
- **LUI-REQ-002:** Assessments have a bilingual, responsive catalog, question, and correction presentation for the three approved draft exercise types. The question screen receives only an active-attempt public projection; correction appears only on a separate request or finalized result view.
- **LUI-REQ-003:** Public Academy and Assessment routes keep their existing publication, ownership, eligibility, save, start, and finalize boundaries. Unavailable data never falls back to draft content. Preview links do not claim saved or scored attempts.
- **LUI-REQ-004:** An Academy interface preview is direct-only, visibly marked unpublished, and noindex. Assessment interface preview is available only through the existing local draft-only editorial gate; each question/correction request passes that gate. Original editorial review pages remain available.
- **LUI-REQ-005:** Spanish and English, desktop and 390px mobile layouts, keyboard navigation, and clear empty/unavailable states receive focused visual inspection. No broad new test suite is part of this UI pass.

## Boundaries

Approved Academy and Assessment source texts, answers, rubrics, hashes, and source provenance are unchanged. This pass does not publish content, create a reviewer credential, score a demo answer, save a demo attempt, or alter the simulator. The final public learning journeys remain open until trusted publication and real end-to-end acceptance.
