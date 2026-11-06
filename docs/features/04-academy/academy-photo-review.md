# Academy photographic refresh review

## Result

RV-029C / ACA-REQ-008 and the existing six-topic portion of ACA-REQ-009: **PASS**. The 17 Law pages and six existing topic routes now lead with original photorealistic generated scenes. Each scene has bilingual alt text and a visible generated-scene disclosure. The source-checked SVG diagrams remain available in keyboard-accessible disclosures for exact geometry and rule distinctions. This delivery does not expand topic coverage or publish lessons.

The asset origin and scene map are recorded in `academy-photo-assets.md`. Photos are illustrative; they are not evidence from real matches and do not establish rulings.

## Independent review

- Astra/high read-only art direction recommended 18 scenes, shared visual treatment, and preserving technical diagrams. Requested identity `gpt-6-astra`/high; runtime-confirmed identity `unconfirmed`.
- Sol/medium implemented the bilingual photo mapping and component in two exclusive files. Requested identity `gpt-6-sol`/medium; runtime-confirmed identity `unconfirmed`.
- Sol/high independent read-only review inspected all 18 assets and the integration. It identified imprecise handball imagery/description, generic alt text for the substitution, card and raised-arm scenes, and a topic caption focused on the wrong indirect-free-kick teaching point. The handball scene was regenerated, alt text and topic cue corrected, and the reviewer rechecked the final files with a **PASS**. Requested identity `gpt-6-sol`/high; runtime-confirmed identity `unconfirmed`.

## Observed checks after the final correction

- `pnpm --filter @refview/web typecheck` exited 0.
- `pnpm --filter @refview/web exec eslint src/features/academy/AcademyPhoto.tsx src/features/academy/academy-photo-v1.ts src/features/academy/AcademyRulesViews.tsx` exited 0.
- Playwright CLI loaded Spanish Law 13 at desktop width: photo loaded, generated-scene caption displayed, diagram disclosure initially closed, no document overflow and no console errors. Its screenshot was visually inspected.
- Playwright CLI loaded the Spanish handball topic at 390 px: photo loaded, diagram disclosure opened by click, SVG appeared, no document overflow and no console errors. A mobile screenshot was visually inspected. After replacing the handball asset, the same route loaded `handball-v3.png`, with matching alt and no overflow.
- Playwright CLI loaded English Law 17 at 390 px: photo loaded, English caption and diagram summary displayed, no document overflow and no console errors.
- The local development server remained available at `http://127.0.0.1:3000`.

No domain tests were added or run for this visual/content change.
