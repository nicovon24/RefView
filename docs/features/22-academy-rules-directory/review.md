# Academy rules directory review

## Result

ARD-REQ-001..005 pass for the local site. Academy lists all 17 IFAB 2026/27 rules, and each route presents original bilingual orientation, an online IFAB law link, the edition-pinned PDF, and a published-only RefView topic area. The approved lesson and three Assessment drafts remain outside public catalogs. This feature did not change their source files, hashes, DTOs, review state, or scoring.

The implementation was delegated with requested `gpt-6-sol`/medium; an independent read-only review used requested `gpt-6-sol`/high. Upper coordination requested `gpt-6-astra`/medium. Runtime-confirmed model/effort was not exposed for these agents and remains unconfirmed.

## Evidence

- `pnpm --filter @refview/web typecheck`: passed after implementation.
- Scoped Academy ESLint: passed after implementation.
- Playwright CLI: Spanish index had 17 links; each law route 1–17 returned 200 with two official references; invalid values `0`, `18`, `01`, and `abc` returned 404. English index had 17 links. Law 12 locale switching and external reference links worked. ES/EN index and Law 12 at 390px had no horizontal overflow; first Tab reached the skip link; console had zero errors.
- Coordinator visually inspected `artifacts/academy-rules-index-es.png`, `artifacts/academy-rule-12-es.png`, and `artifacts/academy-rule-12-mobile-es.png` captured with Playwright CLI.
- Independent reviewer verified all 17 Spanish online IFAB law URLs returned HTTP 200; both edition-pinned ES/EN PDF URLs returned HTTP 200 with `application/pdf`. Bilingual titles matched the official IFAB 2026/27 index. Static review confirmed canonical route validation, edition and primary-law filtering, verified-publication reader, and distinct empty/unavailable states. Final result: PASS.

## Remaining boundary

No real Academy lesson is published, so a positive Law 12 topic card has not been exercised in the browser. The page will link a topic only after the existing trusted publication path admits it. Assessment media slots remain a future content/DTO change: curated images or external links used for a decision must be in the initial evidence projection; correction-only media may appear only after finalization.
