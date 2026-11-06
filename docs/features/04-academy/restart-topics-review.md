# Restart and boundary topic review

## Result

**PASS for RV-029B-1 / ACA-REQ-009.** Six bilingual static topic guides were added under Laws 8, 9, 15, 16 and 17, bringing Academy from six to twelve navigable topics. Each new guide has three substantive original sections with nearby edition-pinned IFAB 2026/27 references, a generated illustrative photo and an accessible technical SVG. This is a bounded portion of RV-029B; the remaining Laws still need topic coverage. No lesson publication or database read was added to these routes.

## Source and delegation

- Astra/high read-only planning chose six topics, separated Law 8 kick-off from dropped ball, and defined disjoint content/diagram ownership. Requested identity `gpt-6-astra`/high; runtime-confirmed identity `unconfirmed`.
- Luna/high read-only source mapping checked Nicolas's 276-page Spanish IFAB 2026/27 PDF against the official 260-page English edition, including Law 8's clarified dropped-ball recipient and the conditional five-second protocol for Laws 15 and 16. Requested identity `gpt-6-luna`/high; runtime-confirmed identity `unconfirmed`.
- Sol/medium content implementation wrote only `restart-topic-content-v1.ts`; Sol/medium diagram implementation wrote only `RestartTopicIllustration.tsx`. Both reported scoped lint passing and the content implementer reported typecheck passing. Requested identities `gpt-6-sol`/medium; runtime-confirmed identities `unconfirmed`.
- Independent Sol/high read-only review compared all 18 sections with the Spanish and English official PDFs, inspected six diagram screenshots, registries, route guards and provenance. It found two source-sensitive corrections: the countdown exception while already in the act of taking the restart, and Law 16 opponent intervention before the ball is in play. Both were corrected. The reviewer returned final **PASS** after rechecking the corrected text and supplemental protocol links. Requested identity `gpt-6-sol`/high; runtime-confirmed identity `unconfirmed`.

The new `dropped-ball.png` was generated for RefView, not copied from IFAB or a match. Its origin and prompt are recorded in `academy-photo-assets.md`. All photos are visibly identified as generated illustrative scenes. The exact instructional relationships are in the original diagrams and prose.

## Observed implementation and browser checks

- `pnpm --filter @refview/web typecheck` exited 0 after the final source and diagram corrections.
- `pnpm --filter @refview/web exec eslint src/features/academy/restart-topic-content-v1.ts src/features/academy/RestartTopicIllustration.tsx src/features/academy/rules-directory-v1.ts src/features/academy/topic-depth-v1.ts src/features/academy/TopicIllustration.tsx src/features/academy/academy-photo-v1.ts src/features/academy/law-depth-contract.ts src/features/academy/LawDetailSections.tsx` exited 0 after those corrections.
- Playwright CLI visited all six new Spanish routes at desktop width and all six English routes at 390 px. Each route showed its title, three depth sections, photo and SVG; none had document horizontal overflow.
- Spanish Law 8 listed both new topics, its dropped-ball page linked to its sibling and next topic, and its language link retained the slug. An invalid Law/slug pair returned 404.
- Playwright CLI screenshots of all six opened diagrams were visually inspected. A corner-arc label overlap was corrected and the final mobile English corner diagram was re-inspected. Its 620 px SVG stayed within a 350 px scrollable figure while the document width remained 390 px; focusing the figure and pressing ArrowRight changed its scroll position from 0 to 40 px.
- After the source corrections, Spanish Law 15 showed the in-act-of-throwing exception and separate PDF links to Law 15 page 153 and protocol page 28. English Law 16 showed the in-act-of-kicking exception and separate links to Law 16 page 145 and protocol page 26. Spanish Law 17 showed separate Law 17 page 161 and protocol page 28 links. These checked routes had no document overflow or browser console errors.

No new automated tests were added or run for this static content and visual slice.
