# Academy 17-Law guide review

## Result

RV-029A / ACA-REQ-007 and ACA-REQ-008: **PASS**. All 17 Law pages in Spanish and English now contain an original introduction, explanation, three key points, one locally authored SVG diagram with bilingual accessible title/description, available topic links, directory and adjacent-Law navigation, and a visible IFAB 2026/27 PDF source locator. The Law guides render without a lesson or database. No official text, IFAB artwork, or real-play evidence was copied into the diagrams. Existing published-only lesson boundaries were not changed.

Nicolas supplied `C:\Users\Nicolas\Downloads\Reglas de Juego 2026_27_paginas individuales.pdf` (IFAB 2026/27, 276 pages). A focused read-only research task compared the Spanish and official English (260-page) single-page PDFs and verified the physical first page of all 17 Laws. The official PDF URLs are `https://www.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es` and `https://www.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en`; the application's existing `downloads.theifab.com` host resolves the same files. The PDFs are source references, not assets copied into RefView.

## Evidence

- `pnpm --filter @refview/web typecheck` exited 0 after the final content and diagram corrections.
- `pnpm --filter @refview/web exec eslint src/features/academy/AcademyRulesViews.tsx src/features/academy/LawIllustration.tsx src/features/academy/law-guide-v1.ts` exited 0 after the final corrections.
- `git diff --check -- apps/web/src/features/academy/AcademyRulesViews.tsx apps/web/src/features/academy/catalog-ui-v1.css docs/features/04-academy/requirements.md docs/features/04-academy/tasks.md docs/specs/tasks.md` exited 0, with only Git CRLF notices on documentation.
- Playwright CLI Chrome visited all 34 `/es|en/academy/rules/1..17` routes: every response was 200 with one heading, three key points, one accessible SVG, and an edition-pinned PDF link to the checked first page. At 390×844, none of the 34 pages overflowed horizontally. Focused checks found correct adjacent-Law links at Laws 1, 11, 12, 14, and 17 and 0/1/4/1/0 topic links respectively. Desktop Law 11 and mobile Law 12 screenshots were visually inspected. After correction, Spanish/English Laws 14–17 returned 200 with correct source labels and no overflow; the Law 14 and 16 diagrams were visually inspected.
- An independent read-only Sol/high review initially failed on Law 15–17 delay-award wording, the ball placement in Law 14 and 16 diagrams, and PDF ranges including the next Law's title page. The coordinator corrected content and ranges; the bounded SVG implementer corrected the diagrams. The same independent reviewer re-inspected those changes against the official Spanish and English PDFs and returned **PASS**. It noted that a few ranges still include a blank separator page, without obscuring the correct first-page link.

Requested model/effort: focused source research `gpt-6-luna`/high; diagram implementation `gpt-6-sol`/medium; independent review `gpt-6-sol`/high. Runtime-confirmed model/effort: `unconfirmed` for all, because the runtime did not expose the effective identity. Source research and review were read-only. The delegated implementer changed only `LawIllustration.tsx`.

## Next

Nicolas directed the next Academy work toward the Rules themselves, not the lesson editorial flow. RV-029B maps and builds detailed topic-level bilingual guides and original diagrams across the Laws, using the six already verified topics as the starting point. The approved unpublished lesson and assessments remain outside these public guide pages.
