# Player model refresh review

Canonical task status is in `../../specs/tasks.md`. This review covers only the original procedural player-model slice, not training publication or the complete playable incident.

## Result

MODEL-REQ-001 through MODEL-REQ-005 passed after one visual correction and one evidence correction. Authoring and the unsaved local playtest construct the same per-actor model; the production authoring adapter and exact playtest renderer produce identical mesh world transforms, vertex counts and kit colors for the contact actor at public canonical tick 366. The model remains deliberately stylized. A still shows the contact and fall, while B continues to screen the decisive contact.

## Implementation and boundaries

- `player-model.ts` owns original procedural jersey, limb, boot and kit geometry and materials. Both renderers instantiate it and dispose per-instance resources on unmount. No external asset, texture, sound, animation or rule excerpt was introduced.
- The existing authored rig/clip modules still supply all joints, segments and poses. `applyAuthoringPlayerFrame` delegates to the same `applyPlayerPose` transform function used by the exact playtest renderer. The exact renderer retains frame validation before scene mutation.
- No content source, public asset, event, camera, evidence anchor, occluder box, contact ground, scoring or persistence file was intentionally edited in this slice. Asset directories predate this work as untracked files, so Git cannot independently attest their historical byte identity. Current source/public asset integrity and digests pass the content and web tests. Renderer code changed, so historical capture or training approval does not bind this candidate.

## Verification

- Before implementation: `pnpm --filter @refview/web exec vitest run src/features/simulator/incident/playtest/exact-scene.test.ts src/features/simulator/incident/asset-integrity.test.ts` passed 9/9 baseline tests.
- Delegated worker RED: the real-tick parity test failed 1/5 before `applyAuthoringPlayerFrame` existed. GREEN: focused model/exact-scene/asset tests passed 14/14. Worker requested `gpt-6-sol` / `medium`; runtime-confirmed identity `unconfirmed`.
- After the final code correction: `pnpm test` passed domain 87/87, simulation 78/78, content 77/77 and web 63/63: **305/305**. `pnpm lint`, `pnpm typecheck` and `pnpm --filter @refview/web build` passed. The build regenerated `apps/web/next-env.d.ts`; its prior development references were restored, `git diff -- apps/web/next-env.d.ts` was empty, and web typecheck passed afterward.
- Playwright CLI at 1440×900 inspected A/B first- and third-person contact at tick 366, A fall at tick 386 and the authoring pass view at tick 120. Final post-correction captures include `artifacts/models-v2-a-third-contact.png`, `models-v2-a-first-contact.png`, `models-v2-b-first-contact.png`, `models-v2-b-third-contact.png`, `models-v2-a-third-fall.png` and `models-v2-pass.png`. A normal-speed fullscreen A recording from tick 345 to 480 is `artifacts/models-v2-motion.webm`; frames at seconds 2, 4, 6, 8 and 10 were visually inspected. The extraction correction changed the authoring adapter without changing geometry; A/B/fall stills were recaptured after it. Browser showed zero page errors and one existing Three.js `Clock` deprecation warning.
- The local playtest started and restarted in Playwright CLI. Escape paused at tick 17, which remained 17 after 500 ms; `Reanudar con mouse` advanced it to tick 36 after 350 ms. `artifacts/models-v2-playtest.png` records the ready state. The unsaved run creates no scored attempt.

## Independent review

Read-only review requested `gpt-6-sol` / `high`, runtime-confirmed identity `unconfirmed`. Its first disposition was **FIX** because the parity test used a synthetic pose. Following the real public tick 366 regression and production authoring-adapter extraction, re-review returned **PASS** for MODEL-REQ-001 through MODEL-REQ-005, subject to the coordinator's final full suite and build, both recorded above. The reviewer inspected A/B, fall, playtest and sampled motion images, and found no implementation defect. It noted that untracked historical asset bytes cannot be independently diffed.

## Remaining limits

The visual improvement is a stylized procedural footballer, not a full character-rig or mocap pipeline. This review does not approve the incident for training, bind captures to an immutable running build, or complete saved/scored gameplay.
