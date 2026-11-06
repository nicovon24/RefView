# Academy topic hub review

## Scope and result

ATH-01 satisfies ATH-REQ-001..006. The 17 Law cards now include their original one-line overviews. Law 12 has one static, bilingual `challenge` topic card; the other Laws show an honest no-topics state. The topic route validates locale, canonical Law number, slug, and Law membership. It offers orientation, official Law 12 and pinned 2026/27 sources, verified published lessons only, and an empty real-play area. Nicolas chose to wait for his real cases. No fictional plays, empty media cards, or draft links were added.

The approved Academy lesson and three Assessment drafts remain unpublished. Static topic navigation does not change their approved hashes or reveal their content. The topic route filters `readAcademyCatalog(locale)` by exact topic ID and edition. A successful empty catalog and an unavailable read have distinct lesson states. No published lesson exists locally, so the positive public lesson link could be checked in code only.

## Verification

- From `apps/web`, `pnpm typecheck` ran `tsc --noEmit` and exited 0.
- From `apps/web`, `pnpm exec eslint src/features/academy/AcademyRulesViews.tsx src/features/academy/rules-directory-v1.ts 'src/app/[locale]/academy/rules/[lawNumber]/topics/[topicSlug]/page.tsx'` exited 0 without findings.
- Playwright CLI opened `http://127.0.0.1:3000/es/academy`. `playwright-cli eval "({cards:document.querySelectorAll('.rv-academy__rules-grid li').length,overviews:document.querySelectorAll('.rv-academy__rules-overview').length,overflow:document.documentElement.scrollWidth>window.innerWidth})"` returned 17 cards, 17 overviews, and no overflow.
- `playwright-cli goto http://127.0.0.1:3000/es/academy/rules/12` and topic-link click reached `/es/academy/rules/12/topics/challenge`. Topic DOM inspection showed an empty published-lesson state, an empty real-play section, and only the back, official Law, and pinned PDF links. The locale switch reached the English topic route and English references.
- `playwright-cli resize 390 844` and a width/section evaluation returned `width: 390`, `scrollWidth: 390`, two topic sections, and two official references. The English Academy directory showed 17 cards and 17 overviews at the same width.
- Keyboard Tab and Enter reached and opened the Law 12 topic link with a visible solid focus outline. The English Academy skip link also had visible focus.
- A Playwright CLI navigation loop returned 404 for `/es/academy/rules/11/topics/challenge`, `/es/academy/rules/12/topics/unknown`, `/es/academy/rules/012/topics/challenge`, `/es/academy/rules/18/topics/challenge`, and `/fr/academy/rules/12/topics/challenge`. Law 11 showed no topic links and the empty state.
- Desktop and 390px screenshots of the directory, Law 12, and topic were visually inspected. They are stored locally in `artifacts/academy-topic-*.png`. The Impeccable detector reported advisory palette/type-ramp entries only.
- `git diff --check` on changed project documentation found no whitespace error.

Independent read-only review returned **PASS** after inspecting code and the four desktop/mobile screenshots. The reviewer confirmed route validation, database-independent Law navigation, publication filtering, official sources, empty real-play state, and the focused browser evidence. Requested reviewer identity was `gpt-6-sol`/`high`; runtime-confirmed identity was `unconfirmed`. Requested implementer identity was `gpt-6-sol`/`medium`; runtime-confirmed identity was `unconfirmed`. Requested upper coordination identity was `gpt-6-astra`/`medium`; runtime-confirmed identity was `unconfirmed`.

## Remaining input

ATH-02 remains planned. Nicolas will supply real cases and media rights/provenance before any play examples are authored, reviewed, or published. This pass did not change the simulator or add broad tests.
