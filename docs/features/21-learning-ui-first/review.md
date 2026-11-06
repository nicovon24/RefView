# Learning interface-first review

## Scope and result

The Academy and Assessment presentation pass meets LUI-REQ-001..005 as a local UI slice. Public routes still require verified publication and owned Assessment attempts. Approved source text, answer keys, rubrics, and provenance were not changed. The Academy preview is direct-only and noindex; the Assessment preview stays behind the local, unreviewed-draft editorial gate. No preview writes, saves, or scores.

The delegated Academy and Assessment implementations each received independent Sol/high read-only reviews. Academy source-label duplication and hover styling, and one Spanish Assessment typo, were corrected and re-reviewed PASS. A separate final Sol/high read-only milestone review found no actionable code finding for LUI-REQ-001..004. Its reviewer did not run a browser, so the coordinator supplied LUI-REQ-005 browser evidence below. Requested models/efforts were Sol/medium for implementation and Sol/high for reviews; runtime-confirmed identities were not exposed and remain unconfirmed. Astra/medium supplied read-only upper coordination; its runtime-confirmed identity was also unconfirmed.

## Verification after final code edits

- `pnpm --filter @refview/web typecheck`: exit 0.
- `pnpm --dir apps/web exec eslint src/features/academy/AcademyViews.tsx src/features/assessments/assessment-views.tsx`: exit 0. Earlier implementation checks covered the changed route files. A later attempted ESLint glob containing `[locale]` matched no files because ESLint interpreted the brackets as glob syntax; that invocation is not counted as passing evidence.
- Playwright CLI: Academy preview rendered the approved lesson, with `robots=noindex, nofollow` and no desktop overflow. First Tab focused its "Ir al contenido" skip link.
- Playwright CLI: Assessment Spanish correction preview rendered only at a separate `?interface=correction&item=...` request, showed unpublished labeling and noindex, and had no 390px overflow. English question preview at `?interface=question&item=...` showed no example correction text, had no 390px overflow, and first Tab focused "Skip to content".
- Playwright CLI: 390px public `/es/academy` and `/es/assessments` catalogs had no horizontal overflow and excluded the unpublished lesson/item. Earlier delegated checks covered ES/EN desktop/mobile catalog and question types. The inspected browser console logs contained only React DevTools and HMR informational entries, no errors.

## Remaining boundaries

The exact approved Academy lesson and three Assessment drafts have not passed trusted reviewer admission and publication. The public catalogs are therefore empty. A real public lesson-to-practice path, owned answer submission, scoring, persisted result, and subsequent browser correction remain pending under their original feature tasks. This pass did not touch the simulator or add a broad test suite.
