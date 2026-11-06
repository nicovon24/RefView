# Laws 3, 5 and 7 topic slice review

## Scope and result

RV-029B-3 satisfies ACA-REQ-009 for six additional static bilingual topic guides: Law 3 substitutions and extra persons, Law 5 referee authority/advantage and injuries/return, and Law 7 periods/intervals and added time/period end. Each topic has three source-linked explanatory sections, an original bilingual SVG and a generated illustrative photo. The guides keep existing topic slugs and render without lesson publication or a database read. RV-029B remains in progress because Laws 1, 2, 4 and 6 have no topic guides.

The new injury-assessment image is original synthetic media with bilingual scene labeling. Its prompt and file provenance are recorded in `academy-photo-assets.md`. The image does not assert an injury type, elapsed time or match fact.

## Source review

The edition-pinned 2026/27 IFAB PDFs were checked for Law 3 (ES 63–70 / EN 59–65), Law 5 (ES 81–91 / EN 73–82), Law 7 (ES 101–102 / EN 93–94), the substitution protocol (ES/EN 22–23), the off-field treatment protocol (ES 24–26 / EN 24–25), and the Law 12.4 consequence after advantage for an offence denying an obvious goal-scoring opportunity (ES 129 / EN 120). The Spanish PDF was the local supplied file; the English PDF came from the official download endpoint. Individual sections cite narrower pages and link directly to the appropriate edition PDF page. The exact source matrix and official URLs are in `players-referee-time-topics-design.md`.

The official live Law 3 page states temporary exceptions to the fewer-than-seven-player minimum that the downloadable edition PDF does not contain. The Law 3 general guide now qualifies its minimum-seven summary and offers a separately labeled online-update link beside its edition-pinned PDF link. The live page may change editions independently of the downloaded PDF.

## Corrections and independent review

The first independent Sol/high read-only review returned FIX for three issues: substitution arrows did not cross the boundary and one arrowhead pointed the wrong way; the advantage/DOGSO text used an imprecise condition without Law 12.4 citation; English injury-protocol references included p26, which belongs to a different protocol. These were corrected. The design source matrix was also tightened to substantive English Law 3/5 page ranges. The second independent Sol/high read-only review returned PASS after PDF/source checks and rendered inspection of the Spanish substitution SVG and Law 3 online-update link. Requested agent identities were Astra/high for planning, Luna/high for focused source research, Sol/medium for each bounded implementation, and Sol/high for review; runtime-confirmed model and effort were not exposed and remain unconfirmed.

## Local verification

- `pnpm --filter @refview/web typecheck`: passed after the final code changes.
- `pnpm --filter @refview/web exec eslint src/features/academy/players-referee-time-topic-content-v1.ts src/features/academy/PlayersRefereeTimeTopicIllustration.tsx src/features/academy/rules-directory-v1.ts src/features/academy/topic-depth-v1.ts src/features/academy/TopicIllustration.tsx src/features/academy/academy-photo-v1.ts src/features/academy/law-depth-1-8.ts src/features/academy/law-depth-contract.ts src/features/academy/LawDetailSections.tsx`: passed after the final code changes.
- `git diff --check`: exited 0; Git printed only existing working-tree LF/CRLF conversion notices.
- Playwright CLI opened all 24 combinations of six topic slugs, ES/EN and 1280/390 pixel viewport widths: each returned HTTP 200, had its localized title, three substantive sections, an accessible SVG and a loaded labeled photo, and had no document-level horizontal overflow. Desktop screenshots of all twelve ES/EN SVGs were visually inspected for clipping and meaning. The mobile SVG container was focusable and scrolled horizontally by ArrowRight while the document remained 390 pixels wide.
- Playwright CLI opened the ES/EN Law 3, 5 and 7 pages: each listed both new topic links. A wrong Law/slug combination returned HTTP 404. The language switch retained the topic slug. The Law 3 page rendered a distinct official online-update link. Browser console had zero errors and one Next.js image LCP loading hint, unrelated to content correctness.

No automated tests were added or run for this static content slice.
