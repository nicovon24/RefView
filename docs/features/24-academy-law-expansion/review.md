# Academy Law expansion review

## Result

ALE-REQ-001..005 passed independent read-only review. The Academy directory has 17 distinct, locally authored, decorative SVG icons while retaining visible Law numbers, titles, one-line scopes, and links. Laws 11, 12, and 14 provide six bilingual topic hubs with original explanation, three key concepts, section/page source locators, and edition-pinned PDF links that jump to the first cited physical page. The topic route still validates locale, canonical Law number, slug, and primary-Law membership. Verified published catalog results are filtered by exact topic and `IFAB-2026-27`; no draft fixture or invented real play is shown. The approved lesson and Assessment candidates remain unpublished.

## Source check

Nicolas supplied the local IFAB Spanish 2026/27 single-pages PDF (276 pages). The implementer checked its physical page indices, and the independent reviewer checked all six Spanish ranges: Law 11 sections 1–2 pp.117–119; Law 12 section 1 contact pp.123–124 and handball pp.124–126, section 2 indirect free kick pp.126–128, section 4 discipline pp.128–136; Law 14 section 1 penalty procedure pp.145–146. The implementer downloaded the official English PDF temporarily, verified that its 260 physical pages use different indices, and removed the temporary file. English links use pp.109–111, 115–116, 116–118, 118–119, 119–127, and 135–136 for the corresponding topics. The reviewer found the mappings consistent. The source PDF's page 4 prohibits reproduction without prior consent, so the site uses original RefView copy, locally drawn icons, and official links; no rule paragraphs or illustrations were copied.

## Commands and observed outcomes

- `pnpm --filter @refview/web typecheck` ran `tsc --noEmit` and exited 0 after the final page-link and mobile-spacing edits.
- `pnpm --filter @refview/web exec eslint src/features/academy/AcademyRulesViews.tsx src/features/academy/LawIcon.tsx src/features/academy/rules-directory-v1.ts` exited 0 without findings after the final edits.
- `git diff --check -- README.md CHECKLOG.md docs/specs/tasks.md apps/web/src/features/academy/AcademyRulesViews.tsx apps/web/src/features/academy/catalog-ui-v1.css apps/web/src/features/academy/rules-directory-v1.ts` exited 0. Git printed only CRLF conversion notices for existing documentation.
- `playwright-cli open http://127.0.0.1:3000/es/academy`, followed by a `playwright-cli run-code` count of `.rv-academy__rules-grid li` and `svg[aria-hidden=true]`, found 17 cards, 17 icons, 17 unique SVG motifs, and no horizontal overflow.
- A Playwright CLI navigation loop opened the six slugs in both `es` and `en`: all 12 routes returned 200 with localized titles, three concepts, and source locators. A separate loop got 404 for `/es/academy/rules/11/topics/handball`, `/es/academy/rules/12/topics/not-a-topic`, and `/es/academy/rules/14/topics/challenge`. Law 12/11/14 pages exposed 4/1/1 topic links.
- `playwright-cli open http://127.0.0.1:3000/es/academy#rules-directory-title`, `playwright-cli resize 390 844`, and a `playwright-cli run-code` geometry check found no overflow and clear separation between title, edition label, and intro (`titleBottom` 417.34, `editionTop` 425.34, `introTop` 462.34). `playwright-cli screenshot --filename=artifacts/academy-law-icons-mobile-final.png` was visually inspected by implementer, reviewer, and coordinator.
- `playwright-cli goto http://127.0.0.1:3000/en/academy/rules/12/topics/handball` plus reference-link inspection showed English pages 116–118 and a PDF URL ending `#page=116`, with no overflow. The corresponding Spanish Law 11 topic showed pages 117–119 and `#page=117`. Earlier EN mobile checks found 17 cards/icons, no overflow, no draft link, an empty real-play area, and a keyboard-reachable skip link.

Independent reviewer verdict: **PASS** after the mobile-spacing and PDF-page corrections. Requested identities: upper coordination `gpt-6-astra`/`medium`, PDF research `gpt-6-luna`/`high`, UI implementation `gpt-6-sol`/`medium`, read-only review `gpt-6-sol`/`high`. Runtime-confirmed identities: `unconfirmed` for all. No broad UI tests, database changes, simulator work, or Git publication were part of this pass.

## Remaining boundaries

The static topic selection is the first slice, not complete coverage of the Laws. No real cases or additional reviewed/published lessons exist yet. The current authored-lesson topic contract still recognizes only `challenge`; future topic lessons require a separately reviewed contract and content-publication step. Some external PDF viewers may ignore `#page` fragments, while the section and page labels remain visible on the site.
