# Outcome and free-kick topics: RV-029B-2 review

## Scope and source evidence

Four new static topic guides under Laws 10 and 13 cover ACA-REQ-009. They add twelve original bilingual depth sections, four bilingual technical SVGs, generated-photo context with topic-specific observation cues, and existing edition-pinned source/navigation components. No lesson publication or database dependency was added. Existing twelve topic slugs remain unchanged. The Spanish local and official English IFAB 2026/27 PDFs were checked at Law 10.1–2 ES 111–112 / EN 103–104, Law 10.3 ES 113–115 / EN 105–107, Law 13.1 ES 141 / EN 131, and Law 13.2–3 ES 141–143 / EN 131–133. The 2026/27 accidental double-touch shoot-out clarification was checked at ES 194 / EN 179 in the change summaries and against Law 10.3. The live online Law links may advance edition; the teaching citations link to the pinned PDFs.

## Delegation and independent review

- Read-only planning: requested `gpt-6-astra` / `high`, runtime-confirmed `unconfirmed`; returned the four-slug content/diagram split, integration and visual invariants, with no edits.
- Read-only source research: requested `gpt-6-luna` / `high`, runtime-confirmed `unconfirmed`; extracted both official PDFs, checked the page matrix and source-sensitive exceptions, with no edits.
- Content implementation: requested `gpt-6-sol` / `medium`, runtime-confirmed `unconfirmed`; changed only `outcome-free-kick-topic-content-v1.ts`, delivered four metadata entries and twelve sections; scoped ESLint and TypeScript exited 0, no tests.
- Diagram implementation: requested `gpt-6-sol` / `medium`, runtime-confirmed `unconfirmed`; changed only `OutcomeFreeKickTopicIllustration.tsx`, delivered four accessible SVGs; scoped ESLint exited 0, no tests.
- Independent read-only review: requested `gpt-6-sol` / `high`, runtime-confirmed `unconfirmed`; checked final content, diagrams, photos, registries and route boundary against both PDFs and returned **PASS** with no actionable findings. Coordinator visual inspection then changed one ambiguous indirect-kick diagram label from “direct to goal” to “no other touch.” The same reviewer examined that final label against Law 13.1 and returned a focused **PASS**. Reviewer made no edits or test claims.

## Coordinator verification after final code edit

- `pnpm --filter @refview/web typecheck` exited 0.
- `pnpm --filter @refview/web exec eslint src/features/academy/outcome-free-kick-topic-content-v1.ts src/features/academy/OutcomeFreeKickTopicIllustration.tsx src/features/academy/rules-directory-v1.ts src/features/academy/topic-depth-v1.ts src/features/academy/TopicIllustration.tsx src/features/academy/academy-photo-v1.ts` exited 0.
- Playwright CLI opened all eight ES/EN routes at desktop width and confirmed localized titles. At 390 px all eight showed three depth sections, a photo, and no document overflow. The Law 10 and Law 13 pages listed both new topic links. An invalid Law 10 / `free-kick-procedure` pair returned 404.
- Playwright CLI opened the technical disclosure and inspected screenshots of all four diagrams at desktop; the wall diagram was also inspected at mobile width. On mobile, the SVG figure was horizontally scrollable while the document did not overflow, and keyboard ArrowRight advanced the focused figure's scroll position to 40 px. The language switch retained the Law 13 topic slug; its sibling topic link resolved. Checked new pages had no console errors; a Next development warning was present.
- `git diff --check` on tracked documentation returned exit 0, with only line-ending notices. No automated tests were added or run. No files were staged or committed.

## Remaining work

RV-029B stays in progress: Laws 1–7 and other unexpanded Laws still lack topic-level guides. The photographic scenes remain labeled generated illustrations, not evidence of real match facts or decisions.
