# Academy Law depth and topic-guide review

## Result

ACA-REQ-007 and ACA-REQ-008 / RV-029A: **PASS** for the expanded 17-Law scope. Every Law page has original bilingual sections with concrete conditions, procedures, exceptions or outcomes, nearby IFAB 2026/27 section/page links, and an annotated bilingual SVG. The guide routes do not require a lesson or database.

ACA-REQ-009 / RV-029B: **PASS for the six existing topic slugs**, while additional topics across the other Laws remain the next slice. The six routes now have three substantive bilingual sections each, their own source-linked diagram, anchored reading navigation, and adjacent-topic links. The static topic route no longer reads the lesson catalog or shows empty lesson/real-play areas. Publication-gated catalog and lesson routes were not changed.

The content uses Nicolas's local Spanish IFAB 2026/27 single-page PDF and the official English edition as factual sources. Explanations and SVGs are original; no PDF text or artwork is embedded as an asset. The application links to the official edition-pinned PDFs, with the online Law link labelled as edition-variable.

## Independent review and corrections

- Astra/high read-only source audit identified missing measurements, conditions, consequences, and misleading Law 1/8/9/11/14/17 geometry. Luna/high read-only diagram audit specified the visual corrections. Requested identities were `gpt-6-astra`/high and `gpt-6-luna`/high; runtime-confirmed identities were `unconfirmed`.
- Bounded Sol/medium implementation produced Laws 1–8 (25 sections), Laws 9–17 (26 sections), six topic guides (18 sections), six topic SVGs, and replacement SVGs for all 17 Laws. Runtime-confirmed identities were `unconfirmed`.
- Independent Sol/high content review found a goalkeeper handling exception, the goalkeeper-coincident offence exception for accidental penalty double contact, and two page ranges. All were corrected and rechecked against the official Spanish and English PDFs. It found no remaining material content or publication-boundary issue.
- Independent Sol/high diagram review found the Law 1 goal-mouth scale, topic penalty-arc sweep, and missing visual handball contact/motion. All were corrected and rechecked in code. It found no remaining source-sensitive geometry or accessibility blocker. Runtime-confirmed reviewer identities were `unconfirmed`.
- After changing SVG labels to the incumbent Source Sans 3, the same independent reviewer measured the tightest labels against the actual font file and returned a follow-up **PASS**. Desktop Playwright screenshots of Law 1 and the handball topic after the font change showed no label clipping.

## Final observed checks

- `pnpm --filter @refview/web typecheck` exited 0 after the content, geometry, and font edits.
- `pnpm --filter @refview/web exec eslint src/features/academy/LawIllustration.tsx src/features/academy/TopicIllustration.tsx src/features/academy/AcademyRulesViews.tsx src/features/academy/LawDetailSections.tsx src/features/academy/law-depth-1-8.ts src/features/academy/law-depth-9-17.ts src/features/academy/topic-depth-v1.ts` exited 0 after those edits.
- `git diff --check -- docs/features/04-academy/requirements.md docs/specs/tasks.md apps/web/src/app/[locale]/academy/rules/[lawNumber]/page.tsx apps/web/src/app/[locale]/academy/rules/[lawNumber]/topics/[topicSlug]/page.tsx` exited 0; Git reported only documentation line-ending notices.
- Playwright CLI loaded Spanish Laws 1, 8, 14 and 17 and Spanish handball topic at desktop width. Screenshots of their figures were visually inspected, including the corrected field, kick-off, penalty, corner, and handball relationships.
- Playwright CLI loaded English Law 1 and navigated its adjacent link to Law 2. English Law 1 showed three source-linked depth sections and no horizontal overflow or console errors.
- Playwright CLI loaded the English penalty topic at 390 px: three source-linked sections, a 620 px diagram in a 350 px scrollable figure, and document width 390 px. At 390 px, the figure accepted focus and ArrowRight moved its horizontal scroll position 40 px. The Spanish handball topic also had no document overflow at 390 px.
- An unknown topic slug returned 404. The static topic routes loaded while the local publication database was unavailable.
- The Impeccable detector reported font and palette advisories. SVG labels were changed from Arial to the incumbent Source Sans 3. The remaining palette values match the established Academy visual surface; no new visual system was introduced.

## Next slice

Extend substantive topic guides and original diagrams beyond the current six, beginning with Law 8 restarts, Law 9 boundary decisions, and Law 15–17 restart procedures. Keep edition-pinned sources beside claims and maintain the static guide versus published-lesson boundary.
