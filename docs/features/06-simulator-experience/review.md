<a id="10-visual-motion-refresh"></a>

<a id="10-visual-motion-refresh--visual-and-motion-refinement-evidence"></a>
## Visual and motion refinement evidence

<a id="10-visual-motion-refresh--scope-and-delegation"></a>
## Scope and delegation

User requested orchestration and confirmed 3D/simulator first, with home/navigation improvements. The coordinator preserved pre-existing local work and owns this record. Runtime creation and handoffs were observed for:

| Agent task | Scope | Requested identity | Runtime-confirmed identity |
| --- | --- | --- | --- |
| `/root/animation_assessment` | Read-only motion diagnosis | gpt-6-luna / high | unconfirmed |
| `/root/home_refresh` | Home and navigation, exclusive home paths | gpt-6-sol / medium | unconfirmed |
| `/root/motion_implementation` | Original procedural assets, mirrors, hash bindings and TDD | gpt-6-sol / medium | unconfirmed |
| `/root/impeccable_finish_reviewer` | Independent final read-only review | gpt-6-sol / high | unconfirmed |

The coordinator changed authoring UI/CSS and player mesh appearance in authoring/playtest. Body joints, canonical roots, events, facts and clip schedule remain unchanged. New clip/rig bytes change the source hash; old calibration/render approval does not approve this candidate.

<a id="10-visual-motion-refresh--tdd-and-integration-commands"></a>
## TDD and integration commands

- Worker: new articulated motion assertions first failed in three cases (foot lift, support-knee bend, hand brace). Implementation also exposed and corrected an onside-depth regression and a run-to-fall wrist discontinuity. `pnpm --filter @refview/content test`: 77/77 after correction; content and web typecheck passed; public/source asset bytes matched.
- Coordinator: `pnpm test` passed domain 87, simulation 78 and content 77; web initially failed 8 fingerprint checks because authoring CSS referenced fonts outside the renderer manifest. Removed that new dependency from the authoring workspace; operational controls retain system typography. Home uses the already bundled OFL fonts with existing notices.
- After correction, `pnpm --filter @refview/web test`: 58/58. Combined current package suites: 300 passed.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: passed. Build generated both locales and all existing preview routes.
- No persistence/schema change; PostgreSQL tests were not repeated for this presentation-only iteration.

<a id="10-visual-motion-refresh--browser-and-visual-evidence"></a>
## Browser and visual evidence

Playwright CLI, local development server, Chrome, Windows; desktop 1440x900, mobile 390x844, fullscreen 1280x720. No FPS claim. `artifacts/refresh-browser-check.js` contains the executed interaction/capture sequence.

- `playwright-cli -s=visual-refresh run-code --filename=artifacts/refresh-browser-check.js`: ES/EN home desktop/mobile, no horizontal overflow, A/B viewpoints, first/third person, pass tick 120, reset tick 0, contact tick 366, fall tick 386, fullscreen and reduced-motion assertions completed without errors.
- Home captures: `artifacts/refresh-final-home-{es,en}-{desktop,mobile}.png`. Keyboard Tab reached the skip link; reduced-motion primary transition was `0s`.
- Scene captures: `refresh-final-a-first-contact.png`, `refresh-final-a-third-contact.png`, `refresh-final-b-first-contact.png`, `refresh-final-pass.png`, `refresh-final-fall-en.png`, `refresh-final-workspace-en-mobile.png` under `artifacts/`.
- Fullscreen captures: `refresh-final-fullscreen-contact.png`, `refresh-final-fullscreen-end.png`. The earlier `refresh-final-fullscreen.png` was taken before the resize render settled and is invalid/superseded; it is not acceptance evidence.
- `playwright-cli -s=visual-refresh video-start artifacts/refresh-final-motion.webm`, play from tick 345, wait for tick 480, `video-stop`: recorded at normal playback speed. Chromium-decoded samples at 0.8..3.0 seconds in 0.2-second steps are in `refresh-motion-sample-00.png` through `-11.png`; `refresh-motion-sequence.png` is the contact sheet. The coordinator visually inspected the sequence, contact and fall. This is sampled visual inspection of a normal-speed recording, not a claim of watching every video frame.
- Browser console reported zero errors for the refreshed home/authoring routes; existing development warnings remain. No saved attempt or training publication was created.

<a id="10-visual-motion-refresh--limitations"></a>
## Limitations

Procedural characters remain stylized; this iteration does not provide motion-capture animation, root-speed-coupled gait, new actor heading trajectories or a final photorealistic character system. Full training acceptance, source/build/evidence attestation and scoring remain separate milestones. Existing DESIGN.md describes the prototype and contains pre-existing historical drift; this refinement does not replace its token system.

<a id="10-visual-motion-refresh--independent-review"></a>
## Independent review

`/root/impeccable_finish_reviewer` returned **SHIP** for this iteration. The reviewer inspected every requested desktop/mobile/camera/fullscreen capture, the sampled motion contact sheet and three original video frames. It found contact readable in A, screening retained in B, and continuous fall, with no material regression. It independently verified all four source/public/manifest asset hashes and ran `pnpm --filter @refview/content exec vitest run src/articulated-asset-v2.test.ts`: 7/7.

The sole P3 note is the 10px home scene badge (`apps/web/src/features/home/home.css`), smaller than the documented 0.75rem label. This nonblocking polish item remains unchanged after review. The reviewer ran one Impeccable detector pass; palette/type-ramp advisories did not become material visual findings. Broader integration gates were reported by the coordinator, not rerun by the reviewer. The reviewed scope is this presentation/motion iteration, not MVP or training acceptance.

Additional local playtest smoke: Playwright clicked `Iniciar con mouse`, pressed Escape, and verified `En pausa` at tick 59 with zero console errors; `artifacts/refresh-playtest-paused.png`. This exercises existing local-run integration with the updated asset bytes and mesh appearance without creating a saved attempt.

Canonical task status remains in `../../specs/tasks.md`.


<a id="10-visual-motion-refresh--design-documentation-verification"></a>
## Design documentation verification

`/root/impeccable_documenter` completed an independent read-only comparison against PRODUCT.md, DESIGN.md, `.impeccable/design.json`, final home/authoring styles and bundled asset notices. Requested gpt-6-sol / high; runtime-confirmed unconfirmed. It found no material documentation gap and confirmed this is an extension of the established system. It verified OFL font provenance, RefView-owned procedural assets, bilingual routes and unpublished/unsaved/unscored disclosures. The historical statement that the production app is absent in DESIGN.md is pre-existing prototype documentation drift, recorded without rewriting the design system. No design-system file was changed.


Reviewer detector command (PowerShell, repository root; stdout only, no saved output artifact):

```powershell
& 'C:/Users/Nicolas/.codex/skills/impeccable/scripts/impeccable.cmd' detect --json 'apps/web/src/app/[locale]/page.tsx' 'apps/web/src/features/home/home.css' 'apps/web/src/features/home/copy.ts' 'apps/web/src/features/simulator/incident/IncidentPreview.tsx' 'apps/web/src/features/simulator/incident/incident.css'
```

The build-generated `next-env.d.ts` route import paths were restored to their pre-task development form; `pnpm --filter @refview/web typecheck` passed again afterward. Temporary browser evidence sessions and the artifact-only HTTP server were closed; the existing application server was preserved.

---

<a id="11-player-model-refresh"></a>

<a id="11-player-model-refresh--player-model-refresh-review"></a>
## Player model refresh review

Canonical task status is in `../../specs/tasks.md`. This review covers only the original procedural player-model slice, not training publication or the complete playable incident.

<a id="11-player-model-refresh--result"></a>
## Result

MODEL-REQ-001 through MODEL-REQ-005 passed after one visual correction and one evidence correction. Authoring and the unsaved local playtest construct the same per-actor model; the production authoring adapter and exact playtest renderer produce identical mesh world transforms, vertex counts and kit colors for the contact actor at public canonical tick 366. The model remains deliberately stylized. A still shows the contact and fall, while B continues to screen the decisive contact.

<a id="11-player-model-refresh--implementation-and-boundaries"></a>
## Implementation and boundaries

- `player-model.ts` owns original procedural jersey, limb, boot and kit geometry and materials. Both renderers instantiate it and dispose per-instance resources on unmount. No external asset, texture, sound, animation or rule excerpt was introduced.
- The existing authored rig/clip modules still supply all joints, segments and poses. `applyAuthoringPlayerFrame` delegates to the same `applyPlayerPose` transform function used by the exact playtest renderer. The exact renderer retains frame validation before scene mutation.
- No content source, public asset, event, camera, evidence anchor, occluder box, contact ground, scoring or persistence file was intentionally edited in this slice. Asset directories predate this work as untracked files, so Git cannot independently attest their historical byte identity. Current source/public asset integrity and digests pass the content and web tests. Renderer code changed, so historical capture or training approval does not bind this candidate.

<a id="11-player-model-refresh--verification"></a>
## Verification

- Before implementation: `pnpm --filter @refview/web exec vitest run src/features/simulator/incident/playtest/exact-scene.test.ts src/features/simulator/incident/asset-integrity.test.ts` passed 9/9 baseline tests.
- Delegated worker RED: the real-tick parity test failed 1/5 before `applyAuthoringPlayerFrame` existed. GREEN: focused model/exact-scene/asset tests passed 14/14. Worker requested `gpt-6-sol` / `medium`; runtime-confirmed identity `unconfirmed`.
- After the final code correction: `pnpm test` passed domain 87/87, simulation 78/78, content 77/77 and web 63/63: **305/305**. `pnpm lint`, `pnpm typecheck` and `pnpm --filter @refview/web build` passed. The build regenerated `apps/web/next-env.d.ts`; its prior development references were restored, `git diff -- apps/web/next-env.d.ts` was empty, and web typecheck passed afterward.
- Playwright CLI at 1440×900 inspected A/B first- and third-person contact at tick 366, A fall at tick 386 and the authoring pass view at tick 120. Final post-correction captures include `artifacts/models-v2-a-third-contact.png`, `models-v2-a-first-contact.png`, `models-v2-b-first-contact.png`, `models-v2-b-third-contact.png`, `models-v2-a-third-fall.png` and `models-v2-pass.png`. A normal-speed fullscreen A recording from tick 345 to 480 is `artifacts/models-v2-motion.webm`; frames at seconds 2, 4, 6, 8 and 10 were visually inspected. The extraction correction changed the authoring adapter without changing geometry; A/B/fall stills were recaptured after it. Browser showed zero page errors and one existing Three.js `Clock` deprecation warning.
- The local playtest started and restarted in Playwright CLI. Escape paused at tick 17, which remained 17 after 500 ms; `Reanudar con mouse` advanced it to tick 36 after 350 ms. `artifacts/models-v2-playtest.png` records the ready state. The unsaved run creates no scored attempt.

<a id="11-player-model-refresh--independent-review"></a>
## Independent review

Read-only review requested `gpt-6-sol` / `high`, runtime-confirmed identity `unconfirmed`. Its first disposition was **FIX** because the parity test used a synthetic pose. Following the real public tick 366 regression and production authoring-adapter extraction, re-review returned **PASS** for MODEL-REQ-001 through MODEL-REQ-005, subject to the coordinator's final full suite and build, both recorded above. The reviewer inspected A/B, fall, playtest and sampled motion images, and found no implementation defect. It noted that untracked historical asset bytes cannot be independently diffed.

<a id="11-player-model-refresh--remaining-limits"></a>
## Remaining limits

The visual improvement is a stylized procedural footballer, not a full character-rig or mocap pipeline. This review does not approve the incident for training, bind captures to an immutable running build, or complete saved/scored gameplay.

---

<a id="12-site-interface-refinement"></a>

<a id="12-site-interface-refinement--interface-refinement-verification"></a>
## Interface refinement verification

<a id="12-site-interface-refinement--scope-and-orchestration"></a>
## Scope and orchestration

RV-019B improves the implemented home, authored incident preview, local unsaved playtest, and neutral controls routes. The shared `SiteHeader` presents implemented destinations and preserves locale. Route-specific CSS and copy give the 3D field priority, keep immediate simulator actions in view, and distinguish the three simulator modes. No canonical incident asset, timeline, evidence geometry, scoring, persistence or publication code was edited for this feature.

The coordinator requested `gpt-6-astra` at `xhigh` for read-only site direction and shared-contract planning, then `gpt-6-sol` at `medium` for three bounded implementation slices (authoring, playtest, home/controls). A separate `gpt-6-sol` at `high` performed read-only final review. The runtime did not expose effective model/effort identity for any delegate; runtime-confirmed identity is `unconfirmed`. The coordinator owned the shared header, integration, tracker and this evidence record.

<a id="12-site-interface-refinement--command-evidence"></a>
## Command evidence

After the integrated presentation edits, from the repository root:

| Command | Observed result |
| --- | --- |
| `pnpm test` | Passed after the final playtest correction: domain 87, simulation 78, content 77, web 63 = 305 tests. |
| `pnpm lint` | Passed across all four packages. |
| `pnpm typecheck` | Passed across all four packages. |
| `pnpm --filter @refview/web build` | Passed after the final playtest correction; Spanish/English static routes and dynamic incident preview generated. |
| `pnpm --filter @refview/web typecheck` | Passed after restoring Next's generated `next-env.d.ts` reference to its prior development value. |
| `git diff --check` | Exit 0; Git reported only LF/CRLF conversion warnings on existing working files. |

<a id="12-site-interface-refinement--browser-and-webgl-evidence"></a>
## Browser and WebGL evidence

Playwright CLI on the local Chrome preview checked Spanish and English navigation, current-route indication, no mobile horizontal overflow, reduced-motion transition removal, authoring transport/seek/A/B/first-/third-person/pass/fullscreen, and local playtest start/pause/resume/restart/fullscreen/completion with zero page errors. The normal playtest flow was rerun after the final API-rejection correction and passed (playing tick 25, paused/stable tick 30, resumed tick 56, restart tick 0, complete tick 480). Scripts: `artifacts/rv020-browser-check.js`, `rv020-playtest-check.js`, and `rv020-fullscreen-diagnostic.js`.

- Before/after desktop and mobile captures: `artifacts/rv020-baseline-*`, `artifacts/rv020-final-*`; settled captures `artifacts/rv019b-playtest-ready-settled.png`, `rv019b-incident-mobile-settled.png`, and `rv019b-controls-mobile-settled.png`.
- Authoring at 1440x900 and 1280x720: scene measured 1013x570 and 693x390. The A first- and third-person tick-366 contact and tick-386 fall, B screening, and tick-120 elevated pass were visually inspected. At 390x844 the authoring scene measured 390x219 (16:9) and controls stayed reachable without horizontal overflow.
- Local playtest at 1280x720: stage measured 880x495 and all primary buttons were inside the initial viewport; start reached tick 26, Escape paused at tick 29 and remained there, camera settings did not resume playback, resume reached tick 55, restart returned tick 0, and a full run reached tick 480. A 1440x900 check also kept actions in view. In fullscreen the stage and canvas both measured 1280x720 after browser layout settled; `artifacts/rv020-final-playtest-fullscreen-settled.png` shows the field and persistent actions.
- Normal-speed authoring segment: `artifacts/rv020-final-motion.webm` from tick 345 through the fall and end. Sampled frames `rv020-motion-2.png`, `rv020-motion-4.png`, and `rv020-motion-6.png` were visually inspected. This is a scoped readability check, not a frame-rate measurement or training attestation.

<a id="12-site-interface-refinement--acceptance-and-limits"></a>
## Acceptance and limits

UI-REQ-001 through UI-REQ-004 have direct route, interaction and screenshot evidence. UI-REQ-005 has responsive, focus, reduced-motion and ordinary loading/disabled behavior evidence. Browser pointer-lock and fullscreen rejection or synchronous exceptions now show a bilingual `role=alert` with retry guidance, including inside fullscreen; a successful retry clears it. The implementation worker reported Playwright CLI synthetic denial checks for Spanish pointer lock and fullscreen entry/exit and English pointer lock. The independent reviewer inspected this correction but did not independently rerun those synthetic denials. UI-REQ-006 has source-scope and passing package checks. Independent read-only Sol-high review returned **PASS**, with no P1/P2 findings after correction. A P3 polish note remains: a sealed run displays a disabled Start button beside the clear completed state and active Restart button.

This remains a local, unsaved, unscored preview. The static product concept and gated session test route were outside the implemented public-route pass. No renewed exact source/build/capture attestation or human training approval was claimed. Those remain RV-008/RV-011 work.

---

<a id="13-immersive-playtest"></a>

<a id="13-immersive-playtest--immersive-local-incident-verification"></a>
## Immersive local incident verification

<a id="13-immersive-playtest--scope-and-provenance"></a>
## Scope and provenance

RV-019C changes only presentation of the unsaved, unscored local incident and its authored inspection view. The local playtest now fills the viewport from entry, enters pointer capture and requests fullscreen from one deliberate action, removes interactive controls during active play, and keeps pause and completion menus inside the stage. One shared original procedural environment supplies the field, two regulation goals and nets, runoff, boards and stepped stands to both routes. One shared original procedural player factory supplies softer silhouettes and fixed shirt numbers. All meshes, numerals, materials and stadium elements were authored in this repository for this feature; no external model, texture, animation, sound, font or likeness was imported.

The coordinator requested `gpt-6-astra` / `xhigh` for read-only fundamental direction, `gpt-6-sol` / `medium` for the three bounded immersive UI, environment and player implementation slices, and `gpt-6-sol` / `high` for independent read-only final review. The runtime did not expose an effective model/effort identity for any delegate; runtime-confirmed identity is `unconfirmed`. The coordinator owned the contracts, both scene-adapter integration, final browser checks, corrections and task tracker.

<a id="13-immersive-playtest--commands-and-observed-results"></a>
## Commands and observed results

From the repository root after integration and the scene/model corrections:

| Command | Observed result |
| --- | --- |
| `pnpm test` | Passed: domain 87, simulation 78, content 77, web 72; **314/314** tests. Includes five environment, seven player-model and two entry-flow focused tests. |
| `pnpm lint` | Passed across four packages. Focused web ESLint also passed after the fullscreen-alert recovery correction. |
| `pnpm typecheck` | Passed across four packages; focused web typecheck also passed after the recovery correction. |
| `pnpm --filter @refview/web build` | Passed with Spanish/English static playtest routes and dynamic authored incident route. |
| `git diff --check` | Exit 0; Git emitted only existing working-tree LF/CRLF conversion warnings. |

The production build regenerated `apps/web/next-env.d.ts` references; the coordinator restored their prior development values and reran `pnpm typecheck` successfully.

<a id="13-immersive-playtest--browser-webgl-and-motion-evidence"></a>
## Browser, WebGL and motion evidence

Playwright CLI in local Chrome checked the 1280x720 ready stage and canvas at exactly 1280x720 with a single `Entrar a la cancha` button. The first click entered fullscreen and pointer lock; active play had **zero visible buttons**, no tick counter or transport, and only noninteractive preview/pause labels. Escape paused at tick 80 and remained at tick 80 after 350 ms. A synthetic focus-loss check paused at tick 16 and stayed at tick 16 after 300 ms. At 1440x900, resume, restart to tick 0 and fullscreen exit passed; the latter paused and released pointer lock. A complete local run reached tick 480 in fullscreen, released pointer lock and showed Restart/Return actions without disabled Start. Synthetic pointer and fullscreen denials showed Spanish recovery; fullscreen denial remained playable inline, and a successful retry cleared the alert in pause and subsequent play. English 390x844 showed the desktop-only notice with no horizontal overflow. These checks reported zero page errors. Scripts and captures are `artifacts/rv019c-browser-smoke.js`, `rv019c-focus-pause.js`, `rv019c-playtest-flow.js`, `rv019c-completion-check.js`, `rv019c-fullscreen-fallback.js`, and their `rv019c-*.png` outputs.

The goalward 1280x720 capture `artifacts/rv019c-goalward-1280.png` visibly shows the real goal, subdued net and goalkeeper after turning the camera; the initial canonical yaw does not point directly toward that goal. The shared geometry tests measure goals at `z = ±52.5`, 7.32 m clear width and 2.44 m clear height, and prove stands/boards stay beyond play. The environment owns and disposes its resources, and the scene mount/unmount test restores the previous background and fog. The shared player-model tests include public-handle shirt mapping, the original joint/boot contract and canonical authoring/playtest parity at tick 366.

The coordinator inspected authored A/B first- and third-person tick-366 captures at 1440x900 and 1280x720, A fall at tick 386, the tick-120 pass, and the 390x844 authored layout. Contact, B screening and fall remain readable; the updated shirt numbers are attached to the jersey. `artifacts/rv019c-motion.webm` records normal-speed authored playback from tick 345 through the fall and tick 480; sampled frames `rv019c-motion-frame-3.png`, `-5.png`, `-7.png`, and `-9.png` were inspected. The recording's captured video is 800x450 even though the authoring browser viewport was larger, so the fixed-tick full-size captures remain the stronger pixel evidence.

The coordinator measured 120 active `requestAnimationFrame` intervals at each size in Chrome on Windows with ANGLE/D3D11 and AMD Radeon RX 6700 XT, device pixel ratio 1. At 1280x720, canvas ready took 679 ms, median/p95/max intervals were 16.7/16.8/16.8 ms, and canvas CSS/pixel sizes both matched 1280x720. At 1440x900, ready took 593 ms, intervals were 16.7/16.8/16.9 ms, and both canvas sizes matched 1440x900. `artifacts/rv019c-performance.js` is the measurement script. This is a scoped local observation, not a general FPS guarantee. The environment test bounds its direct drawable children below 80.

<a id="13-immersive-playtest--acceptance-and-limits"></a>
## Acceptance and limits

IMM-REQ-001 through IMM-REQ-005 have source, focused test and browser/visual evidence above. IMM-REQ-006 is bounded by the changed-file review: no canonical tracks, events, source assets, joint positions, evidence anchors, observation, evaluation, scoring, persistence or publication code changed for this feature; viewport aspect is sampled from the actual settled canvas. IMM-REQ-007 has the full checks, browser, motion and cost evidence above. Independent read-only review inspected the integration and reported no high-severity findings; its fullscreen-alert recovery note was corrected and rechecked with Playwright CLI. The final re-review disposition is recorded below.

The players remain stylized procedural meshes, not photoreal footballers. The fixed authored rig limits anatomical realism. This presentation candidate requires renewed exact source/build/capture binding and Nicolas's training approval under RV-008/RV-011 before any scored or published use; earlier visual approvals are not reused.

<a id="13-immersive-playtest--independent-review"></a>
## Independent review

The independent `gpt-6-sol` / `high` reviewer returned **PASS** after targeted read-only re-review of the fullscreen-alert correction. The reviewer independently ran the three focused environment/player/entry-flow test files: 14/14 passed, and found no new lifecycle, disposal, parity or canonical-boundary issue. Runtime-confirmed identity remains `unconfirmed`.

---

<a id="14-stadium-character-motion"></a>

<a id="14-stadium-character-motion--rv-019d-review-evidence"></a>
## RV-019D review evidence

This is an unsaved, unscored local visual candidate. It is not approved or published for training. Requested direction model/effort: `gpt-6-astra` / `xhigh`; runtime-confirmed identity: unconfirmed. Bounded environment and character implementation requested `gpt-6-sol` / `medium`; independent read-only review requested `gpt-6-sol` / `high`; runtime-confirmed identity for each: unconfirmed.

<a id="14-stadium-character-motion--result"></a>
## Result

- **SCM-REQ-001–003:** The same original procedural stadium and character factories serve authored and playtest routes. The stadium now encloses the pitch with two seating tiers, a concourse, roof/corner structure, aisles and four static instanced crowd-color batches. Grass uses a fixed seeded 256 × 256 RGBA texture and greener mowing palette. All seven players retain their authored kit and back numbers; the human-shaped transparent referee is shared by both routes. The original regulation goals, nets, pitch bounds and contact geometry remain in place. Visual inspection: [ready](../../../artifacts/rv019d-ready-1280.png), [A first-person contact](../../../artifacts/rv019d-a-first-366-1280.png), [A third-person contact](../../../artifacts/rv019d-a-third-366-1280.png), [B first-person contact](../../../artifacts/rv019d-b-first-366-1280.png), [B third-person contact](../../../artifacts/rv019d-b-third-366-1280.png), [elevated pass](../../../artifacts/rv019d-pass-review-120-1280.png), [fall](../../../artifacts/rv019d-a-fall-386-1280.png), and [goalward local play](../../../artifacts/rv019d-goalward-1280.png). B still screens part of contact as intended. The goal is visible when looking goalward, not at the default starting yaw.
- **SCM-REQ-004 and 006:** Original run, challenge and fall clips have stronger arm/leg swing, brace and follow-through. `asset-001.mjs` and its rig ABI remain unchanged. Test-first frozen hashes confirm all five evidence sample windows, canonical facts, public actor/ball tracks and clip phases, and events unchanged. Source and public copies of all four assets match byte for byte, and the changed clip hashes match the manifest. The clip changes define a new source candidate; no historical rendering approval is reused. Live authored playback from tick 345 produced successive captures at ticks 370, 410, 440, 471 and 480 (see `artifacts/rv019d-motion-live-*.png`) and a 1280 × 720 recording at `artifacts/rv019d-motion-full.webm`. The turf showed no obvious moving grain in the inspected playback. The fixed rig retains a visible leg-pitch discontinuity at the protected run-to-challenge and run-to-fall handoffs (0.162 and 0.373 rad); removing it would reopen evidence geometry and calibration.
- **SCM-REQ-005:** Ready/pause controls now use a compact side panel. Playwright CLI at 1280 × 720 confirmed fullscreen and pointer lock after entry, a 1280 × 720 canvas, zero visible buttons/inputs during play, stable paused tick, restart at tick 0 and completion at tick 480 with pointer lock released. Spanish and English ready/pause captures and English 390 × 844 unsupported-mobile state were inspected. Synthetic fullscreen denial kept inline play available; retry cleared the warning. Synthetic focus loss paused at a stable tick. No page errors were observed. [Playing](../../../artifacts/rv019d-playing-1280.png), [pause](../../../artifacts/rv019d-paused-1280.png), [completion](../../../artifacts/rv019d-complete-1280.png), [English pause](../../../artifacts/rv019d-paused-en-1440.png), [English mobile](../../../artifacts/rv019d-mobile-en-390.png).
- **SCM-REQ-007:** The environment has 117 drawable objects, less than 15,000 static environment triangles, and four crowd draw batches. An independent review found seven `InstancedMesh` instance-buffer disposal calls missing; a focused test failed before the fix and passed after it. Browser instrumentation on Chrome/Windows ANGLE D3D11, AMD Radeon RX 6700 XT, DPR 1 measured about 251 draw calls and 45,674 triangles per frame at 1280 × 720; about 239 draw calls and 44,038 triangles per frame at 1440 × 900. Six WebGL texture objects were observed; the added turf source alone is 262,144 RGBA8 bytes, about 349,524 bytes with the full mip chain (source-derived estimate, not GPU memory accounting). Approximate request-to-canvas-ready was 566/517 ms and sampled rAF median/p95 16.7/16.8 ms at both sizes. These are local device observations, not a universal frame-rate guarantee. See `artifacts/rv019d-render-cost.js` and its captured output.
- **SCM-REQ-008:** `pnpm test` passed 325/325 (domain 87, simulation 78, content 80, web 80); `pnpm lint`, `pnpm typecheck` and `pnpm build` passed after implementation. `git diff --check` passed. The independent Sol-high read-only reviewer found the instance-buffer leak, verified the correction and found no remaining authority or asset-parity regression. The reviewer explicitly retained the measured-memory and inherited leg-transition limits above.

All geometry, crowd marks, turf pixels, character meshes and motion clips in this feature are original repository-authored work. The supplied screenshot was visual direction only; no pixels, logos, sounds, animations or external assets were imported.

---

<a id="15-rigged-football-presentation"></a>

<a id="15-rigged-football-presentation--rigged-player-integration-evidence"></a>
## Rigged player integration evidence

Task status is recorded only in `../../specs/tasks.md`. This document records observations, not training approval.

<a id="15-rigged-football-presentation--scope-and-direction"></a>
## Scope and direction

On 2026-11-03 Nicolas selected the existing `/es/simulator/player-audition` players for use in the simulator. The previous alternative-base plan was stopped without implementation changes. The selected appearance is the Quaternius athletic audition variant, existing hair/face treatment, generic kits and numbers. The shared contract is `../../contracts/simulator-presentation.md#rigged-presentation-candidate-v1`.

Requested planning model/effort: `gpt-6-astra` / `xhigh`; observed tool task: `/root/player_plan`, creation acknowledged and final read-only handoff received. Requested implementation model/effort: `gpt-6-sol` / `high`; `/root/regular_player` creation and extraction handoff were observed, then the same task received the pose implementation. `/root/player_resources` was separately created for resource loading. Runtime-confirmed model/effort: `unconfirmed` for each. A task name is not model confirmation.

<a id="15-rigged-football-presentation--incremental-evidence"></a>
## Incremental evidence

- Baseline browser: `playwright-cli -s=rvfield goto http://127.0.0.1:3000/es/simulator/player-audition` and `playwright-cli -s=rvfield screenshot --filename=artifacts/selected-audition-baseline.png`. The screenshot was visually inspected: three existing numbered yellow/blue athletes jogging, with the athletic and classic-kit defaults. No errors; existing Three.js warnings were present.
- Factory handoff: `createRiggedPlayer` extracts the original appearance and creates independent skeletons. Implementer reported 2/2 focused tests, web typecheck and scoped ESLint passing after an ownership/idempotency red test. Later pose/cleanup changes require fresh final verification.
- Coordinator integration seam: `pnpm --filter @refview/web exec vitest run src/features/simulator/incident/playtest/exact-scene.test.ts` first failed the two new tests because the renderer required procedural joints. After adding a typed rigged adapter, the same command passed 10/10. It checks exact-frame sampling before drawing, preserved canonical actor/ball placement, and rejection of pose failures or modified roots. This is submission correctness, not rendered readability.
- Verified-resource handoff: `pnpm --filter @refview/web exec vitest run src/features/simulator/rigged-player/resources/loader.test.ts` passed 7/7 after the missing-module red stage. Scoped ESLint passed. The loader verifies all 14 existing files, rejects undeclared dependencies and changed bytes, decodes from verified buffers, and supports a fresh retry. Each load owns its resources; this slice deliberately does not add a global cache.
- Fingerprint integration: the new selected-texture test initially failed because skinned resources were omitted. After fixed-manifest membership was added and raw manifest digests were explicitly converted to the fingerprint's `sha256:` format, `pnpm --filter @refview/web exec vitest run src/lib/authoring/renderer-fingerprint-v1.test.ts` passed 10/10. A subsequent same-length texture-byte corruption test passed using `-t 'binds the selected'` (1 passed, 9 skipped).
- Procedural reference performance, before replacing the players: `playwright-cli -s=rvplay run-code --filename=artifacts/rig-player-frame-sample.js` at tick 366 sampled 481 post-warmup intervals, median 16.7 ms, p95 16.8 ms and zero over 25 ms. Named platform: Windows 10, HeadlessChrome 156, AMD Radeon RX 6700 XT / ANGLE Direct3D11, 1920 x 1080, DPR 1. This rAF proxy is a baseline, not a measurement of the new rig.

<a id="15-rigged-football-presentation--first-integration-review-and-browser-observations"></a>
## First integration review and browser observations

The independent task `/root/rig_review` requested `gpt-6-sol` / `high` with fresh context and returned **PASS** for the frozen model/resource/sampler/exact-renderer/fingerprint core. It ran five targeted test files, 32/32 passing, plus web typecheck and scoped ESLint. Runtime-confirmed model/effort: `unconfirmed`. It explicitly left RFP-REQ-002 planted-foot quality and RFP-REQ-004 calibration open. Routes were assigned a separate follow-up review. No scoring/publication authority was changed.

Actual-source tests caught an incorrect assumption about neutral asset handles: the compiled mapping is challenge `asset-001`, rig `asset-002`, run `asset-003`, fall `asset-004`. The corrected sampler tests the real 481-tick public timeline and all seven actors. Paired skinned foot-bone origins at tick 366 are 0.0198 m apart after anticipation/contact constraints; this is a geometry diagnostic rather than proof of skin-surface contact. Source asset hashes and authored timeline bytes remain unchanged.

Playwright CLI exercised both routes with a 503 response for `**/Superhero_Male_FullBody.bin`: loading stopped, localized Retry appeared, and removing the route override then retrying loaded the scene. The injected request deliberately produced console errors; ordinary navigation after the StrictMode cancellation fix had zero errors. English mobile playtest showed its desktop requirement and no horizontal overflow at 390 x 844; English mobile authoring also had no horizontal overflow. Playtest start acquired pointer lock/fullscreen, and M paused at tick 69 while retaining fullscreen.

The initial fixed-tick capture script waited only for the canvas and captured one uninitialized frame; those first captures are not final evidence. It now waits for `data-scene-ready="true"`, set only after the ball is actually rendered. The normal-speed attempt also exposed that closing authoring tools paused playback. Starting Play now closes the panel without pausing; a rerun of `artifacts/rig-player-motion-capture.js` advanced from tick 320 through 480, recorded in `artifacts/rig-player-motion.webm`. Its sampled frames 0, 1 and 2 were inspected and show approach, contact and fall. A subsequent velocity-sync slice is needed because ordinary jog motion is faster than several canonical actor tracks.

<a id="15-rigged-football-presentation--frozen-route-review"></a>
## Frozen route review

The same independent Sol-high reviewer returned **PASS** for the frozen route integration. It independently verified Spanish playtest completion, restart and M pause; injected UAL GLB failures and retry recovery in Spanish playtest and English authoring; and English 390 px mobile fallback without a canvas or horizontal overflow. `pnpm --filter @refview/web exec vitest run src/features/simulator/rigged-player/scene-actor.test.ts src/features/simulator/incident/playtest/exact-scene.test.ts` passed 11/11 and scoped ESLint passed. A subsequent typecheck encountered the concurrent locomotion task's missing-module RED stage, so it is not recorded as a final green gate. Requested model/effort: `gpt-6-sol` / `high`; runtime confirmation: `unconfirmed`.

`pnpm build` passed for this route revision, before the subsequent locomotion changes. The final candidate requires fresh gates.

<a id="15-rigged-football-presentation--distance-based-locomotion-integration"></a>
## Distance-based locomotion integration

Astra-xhigh planned public-distance gait phase using measured UAL cycle distances (Walk 1.23582 m, Jog 4.90824 m). Sol-high implemented immutable per-actor plans, Idle/Walk/Jog blends, and protected legacy windows without changing the canonical roots or football facts. Pure locomotion tests went RED on an abrupt transition, then 5/5 GREEN. The reviewer returned PASS with a P3 request to extend protected baseline comparisons over every named tick; that coverage and absolute idle breathing are a subsequent correction. Requested identities are recorded separately from runtime confirmation, which remains `unconfirmed`.

After route wiring, `pnpm test` passed 353/353 tests (domain 87, simulation 78, content 80, web 108); `pnpm typecheck` and `pnpm lint` passed. These results precede the selected-skeleton referee and idle-breathing edits and must be refreshed for final acceptance.

`playwright-cli -s=rvplay run-code --filename=artifacts/rig-player-captures.js` regenerated initialized fixed-tick captures with zero console errors. The A-third tick-366 and tick-386, plus B-first tick-366 images were visually inspected: selected athletes, contact/fall and B screening are visible. `playwright-cli -s=rvplay run-code --filename=artifacts/rig-player-live-check.js` acquired fullscreen and pointer lock with zero stage buttons during active play, paused at tick 72 with no advance over 300 ms, released pointer lock while retaining fullscreen, then resumed to 480/480. Zero console errors, two existing Three.js warnings.

`playwright-cli -s=rvfield run-code --filename=artifacts/rig-player-walking-capture.js` sampled normal-speed B-first playback from tick 80 to 452 at roughly 0.5-second intervals. Frames 0, 1 and 2 were inspected: backline and keeper no longer share the same jog cadence. Canonical fixed yaw still disagrees with some travel directions; this is not a planted-foot acceptance claim. The first recording command incorrectly used `video-start --filename` and was rejected; no video exists from that attempt. Final recording uses the documented positional filename.

<a id="15-rigged-football-presentation--protected-range-and-idle-correction"></a>
## Protected-range and idle correction

The follow-up Sol-high implementation extended actual-asset comparison to all 65 bone signatures at every attacker tick 350?480 and defender tick 356?386. Modern-plan sampling matches the legacy sampler throughout, alongside the retained pre-edit fixed signatures. A new stationary-idle test failed before the change and passed after Idle sampling was tied to absolute tick/60; walk/jog retain distance phase. Reverse/repeat samples reproduce the same pose. Implementer ran scoped pose tests 9/9, web typecheck and scoped ESLint successfully. Independent re-review is combined with the next referee appearance slice.

A direct SHA-256 comparison against `artifacts/rig-integration-canonical-before.json` found all four authored source modules and `authored-incident-v2.ts` unchanged after the player and locomotion integration.

<a id="15-rigged-football-presentation--remaining-evidence-geometry-dependency"></a>
## Remaining evidence-geometry dependency

Astra's read-only follow-up found that the old `GeometryResolverV2(rigAssetId, clipAssetId, phaseQ)` cannot represent the new actor-specific distance plan and world-contact constraints. Candidate geometry needs an actor/tick/source/resource/sampler identity or immutable bake. Current head/torso/ankle diagnostics are not boot surface attachments or posed regional occluders. Complete evidence windows contain 85 rows across 54 distinct ticks (116?124 and 330?374). A future diagnostic geometry slice must use the actual final skinning and validate regions against posed vertices before A/B calibration; existing procedural approval cannot be reused.

<a id="15-rigged-football-presentation--referee-appearance-and-visual-review"></a>
## Referee appearance and visual review

The selected-skeleton referee added an explicitly unnumbered (`number: null`, no canvas texture) variant, independently owned materials, absolute Idle sampling and the exact-scene adapter. Sol-high reported RED for the missing adapter/module and numberless canvas creation, then 115 web tests, web typecheck and scoped ESLint GREEN. This is appearance-only; moving-referee gait remains separate.

Independent review returned FIX: double-sided transparent facial meshes showed through the rear head, and a NaN referee quaternion bypassed an angle-only guard. FrontSide materials and finite/unit quaternion checks passed new red/green tests (16 focused tests), but fresh visual review still saw facial detail. The orientation was correct; transparency lacks self-occlusion between separate facial meshes. Astra-xhigh reduced the referee to a simpler ghost material, with a body-only unlit fallback if necessary, in the shared contract. No camera or canonical transform correction was warranted. This redesign requires final visual re-review.

`artifacts/rig-referee-camera-check.js` passed at 1920 x 1080 with distance 2 m, lateral offsets +3/-3 m and first-/third-person switching, ending at tick 80. The first script wrongly assumed the advanced controls stayed open across pause-panel remounts; reopening the details fixed the test. One elevated pass capture during source HMR showed only the ball; a fresh reload on frozen code showed the actors, ball and no referee. Investigation found no reproducible culling failure and made no code changes. Only the regenerated `artifacts/rig-player-pass-final.png` is evidence.

The final-motion first-person recording uses the documented command `playwright-cli -s=rvfield video-start artifacts/rig-player-walking.webm --size=1920x1080`, then the walking-capture script and `video-stop`. It advanced from tick 80 to 480; screenshot samples are roughly 0.5?0.7 seconds apart. Referee materials do not affect this first-person recording.

A post-locomotion/referee rAF sample at B third person, tick 366, returned 481 intervals: median 16.7 ms, p95 16.8 ms, zero over 25 ms on the previously named Windows 10 / RX 6700 XT / Chrome 156 device at 1920 x 1080 DPR 1. This remains a frame-cadence proxy, not GPU timing; the subsequent referee material reduction requires fresh final measurement.

<a id="15-rigged-football-presentation--diagnostic-surfaces-implementation"></a>
## Diagnostic surfaces implementation

The isolated `rigged-player/evidence/geometry.ts` implementation follows `../../contracts/simulator-presentation.md#rigged-diagnostic-geometry-v1`. Its actual-asset suite verifies the 14 resource hashes, 378 source-derived actor/tick samples, independent linear-blend skinning at nonzero yaw/translation, triangle/region coverage, a ray through separated legs, deterministic detached snapshots, fixed toe vertices and disposal. A malformed NaN skin weight test failed then passed after validation. The final implementer-reported scoped suite passed 6/6 with typecheck and lint. Independent review found mutable nested roster identity values. A regression test first failed because the entry was not frozen; each value is now cloned and frozen. The regression proves mutation fails and a second sampler retains the original color. The full geometry suite passed 7/7, typecheck and lint; independent Sol-high re-review reran 7/7 and returned PASS. Requested identity was `gpt-6-sol` / `high`, runtime confirmation `unconfirmed`.

The actual posed toe diagnostic exposes a 0.466 m defender left-toe step at tick 359. This is an unresolved motion-quality finding, not evidence that contact or planted feet are calibrated. The ankle-origin gap remains a separate diagnostic. No new geometry is connected to scoring, persistence, source resolvers or training admission.

<a id="15-rigged-football-presentation--selected-player-integration-checkpoint"></a>
## Selected-player integration checkpoint

After the final reduced referee implementation, `pnpm test` passed **369/369** tests (domain 87, simulation 78, content 80, web 124); `pnpm typecheck` and `pnpm lint` passed across the workspace. The independent Sol-high reviewer accepted the reduced body-only referee orientation ghost after 4/4 focused tests and image inspection. It explicitly noted faint front-face relief/internal contours through transparency: this is not a self-occluding detailed referee kit. The seven complete player appearances are unchanged. The earlier P2 geometry identity correction independently passed 7/7 and review.

`playwright-cli -s=rvplay run-code --filename=artifacts/rig-player-final-matrix.js` produced all 16 A/B first-/third-person captures at ticks 360, 366, 371 and 386 with zero console errors. The final local lifecycle script paused at 71/480, retained fullscreen/released pointer lock, held the tick during the menu, and resumed to 480/480. `rig-player-motion.webm` was regenerated at 1920 x 1080 from tick 320 to 480, with sampled frames spanning approach/contact/fall. Normal startup still reports two existing Three.js deprecation warnings.

These are a checkpoint before the newly authorized defender continuity candidate. Full RFP-REQ-002/004/007 and training acceptance remain open; do not reuse these results after relevant pose edits without rerunning checks.

<a id="15-rigged-football-presentation--defender-continuity-continuation"></a>
## Defender continuity continuation

The next bounded implementation is frozen in `../../contracts/simulator-presentation.md#rigged-defender-continuity-v1`. Astra-xhigh found that tick 358?359 moves the target approximately 0.25 m, the ankle approximately 0.28 m and the foot orientation roughly 56 degrees; fixing CCD alone cannot remove the 0.466 m toe step. The new candidate uses fixed-reference absolute trajectory plus analytic fixed-length left-leg IK and explicit foot orientation. It intentionally supersedes historical defender pose signatures while preserving attacker poses, canonical tracks/facts and tick-366 timing. Required toe step is at most 0.20 m/tick over 344?388 and ankle residual at contact at most 0.03 m, with actual-surface visual review.

<a id="15-rigged-football-presentation--defender-continuity-measured-result"></a>
## Defender continuity measured result

Sol-high froze the five assigned files after RED `pnpm --dir apps/web exec vitest run src/features/simulator/rigged-player/evidence/geometry.test.ts -t "keeps the defender fixed boot-toe surface step"` reproduced 0.4657598305 m at tick 359. The analytic solver and fixed-reference trajectory reduced the maximum left-toe step to 0.1225616637 m at tick 355 over 344–388. The tick-366 ankle gap is 0.00008193 m; the nearest sampled left-boot region vertices are 0.001985 m apart. That vertex gap is not triangle collision or football-contact proof. Segment lengths, exact roots and protected attacker poses pass. The three focused files pass 14/14 tests, scoped ESLint and web TypeScript. Independent Sol-high review reran 14/14 and returned scoped PASS. Both requested identities are `gpt-6-sol` / `high`, runtime confirmation `unconfirmed`.

`playwright-cli -s=rvplay run-code --filename=artifacts/rig-defender-continuity-captures.js` generated eight fresh A-first captures at 350, 356, 358, 359, 360, 366, 374 and 386. All eight were visually inspected; the former 358→359 toe pop is absent and tick-366 contact remains plausible. `rig-player-final-matrix.js` regenerated all 16 A/B first-/third-person captures with zero errors. `rig-player-motion-capture.js` regenerated `rig-player-motion.webm` from tick 320 to 480; sampled playback images 0–2 were inspected. These coarse samples alone do not prove every joint transition is smooth.

The final-code local lifecycle script paused at 72/480, retained fullscreen and released pointer lock, held the tick for 300 ms and resumed to 480/480 with zero errors. The B-third tick-386 rAF sample returned 481 intervals, median 16.7 ms, p95 16.8 ms and zero above 25 ms on Windows 10 / HeadlessChrome 156 / AMD RX 6700 XT, 1920×1080 DPR 1. This is a cadence proxy, not GPU timing.

The review leaves a calf local rotation of 0.8521463 rad at tick 370 for focused explanation; knee position changes at most 0.1219266 m and boot world orientation at most 0.2381052 rad. The untouched right boot reaches 0.23153 m at tick 365. Full planted-foot/motion acceptance remains open. Astra-xhigh is examining the knee transition before accepting the complete motion slice.

<a id="15-rigged-football-presentation--surface-query-continuation"></a>
## Surface-query continuation

Astra-xhigh confirmed the old rig/clip/phase AABB resolver cannot represent the new actor/tick/trajectory-dependent surfaces. The next bounded pure-query slice is frozen in `../../contracts/simulator-presentation.md#rigged-surface-query-v1`, implemented by Sol-high in two new exclusive files. It computes triangle witnesses and segment hits without closing limb gaps or connecting scoring. Actual contact seeds and the 92-row A/B calibration pilot remain subsequent work. Runtime identity confirmation is unavailable.

The first implementation passed 5/5 focused tests, root typecheck and scoped lint after a missing-module RED. Independent Sol-high review reproduced a coplanar false negative: segment `(0.1, 0.2, 0)` to `(0.6, 0.2, 0)` inside triangle `[(0,0,0), (2,0,0), (0,2,0)]` returned null because the endpoint nudge was rejected by a later endpoint check. It also found repeated full vertex-map construction per selected triangle, making preprocessing O(T×V). Review returned FIX; the bounded correction requires a shared endpoint policy and per-query sample/mesh normalization cache. The 5-test result does not approve this version.

Correction round one added RED fixtures for the false-negative overlap and repeated vertex reads, then passed 6/6 with a shared open interval and per-query mesh cache. Re-review found serialized object property order incorrectly changed duplicate signatures, and a fixed 1 nm nudge skipped a narrower eligible interval. Round two first reproduced both failures, then used fixed numeric root/index/vertex signature ordering and IEEE-754 `nextUp(minT)` constrained to the overlap interval. `pnpm --dir apps/web exec vitest run src/features/simulator/rigged-player/evidence/surface-query.test.ts` passes 6/6; root typecheck and scoped ESLint pass. Independent Sol-high re-review reran 6/6 and direct probes for reordered roots, a 0.0020000005 m coplanar segment, ordinary ray/witness distance and unchanged source vertices: scoped PASS. No material/culling parity, real-resource cost or 92-row calibration claim follows from this pure-query result. Requested implementer/reviewer identity `gpt-6-sol` / `high`; effective identity `unconfirmed`.

<a id="15-rigged-football-presentation--recovery-orientation-diagnosis"></a>
## Recovery-orientation diagnosis

Astra-xhigh's read-only actual-asset probe found no knee-plane reversal: normal dot products remain at least 0.99827 over ticks 368–372. At 368 the calf rotates 0.9436 rad in world space while its axis moves only 0.0532 rad, leaving 0.9422 rad of axial twist from shortest-swing orientation on the animated base. Requested reach crosses the approximately 0.830 m leg length at 371, abruptly straightening the knee. The contract now requires full reference frames anchored to the existing tick-366 pose plus soft reach, with explicit per-tick rotation/flexion/displacement guards over 344–388. Sol-high owns this bounded correction; previous motion captures are historical until regenerated.

<a id="15-rigged-football-presentation--final-selected-player-motion-checkpoint"></a>
## Final selected-player motion checkpoint

The recovery correction now uses complete segment/plane frames and a soft extension beginning 0.09 m below the segment sum, capped 0.015 m below it. A smooth 5% entry-progress lag over 358–366 (maximum approximately 0.076 m nominal target offset) disappears at contact. Peak tick 366 retains the exact prior pose signature `2aa792abccba54c8c57690f804e35d8f0a531d6b24fb55942b96c87f171e3bc9` and full posed-surface signature `070fa94eddfddc1abe1f3495c996b0f1846990dc4706c3122b80492ed250acff`.

Actual-asset maxima over every step 344–388: calf world rotation 0.21210952 rad, residual axial twist 0.15717612 rad, flexion change 0.20615316 rad, knee displacement 0.09962943 m, boot rotation 0.22525923 rad and left-toe displacement 0.13752847 m. All contract guards pass. The paired ankle gap remains 0.00008193 m and nearest sampled left-boot vertices 0.00198523 m. Roots, segment lengths, protected attacker signatures, reverse/repeat sampling and all 54×7 evidence samples pass. Independent Sol-high review reran 16/16 focused tests and inspected fresh entry/contact/recovery/exit images: scoped PASS. Requested implementer/reviewer models are Sol high, runtime identity unconfirmed.

After these final pose and surface-query edits, **`pnpm test` passed 380/380** (domain 87, simulation 78, content 80, web 135); **`pnpm typecheck`, `pnpm lint` and `pnpm build` passed**. The production build generated all 16 pages. All four canonical source asset hashes and `authored-incident-v2.ts` still match `artifacts/rig-integration-canonical-before.json`.

`playwright-cli -s=rvplay run-code --filename=artifacts/rig-defender-recovery-captures.js` produced 13 fresh recovery/entry/exit captures. Coordinator inspected 345/346/366/368/370/372 and reviewer additionally inspected 376/386/387: no obvious transition discontinuity, peak contact retained. `rig-player-final-matrix.js` regenerated all 16 A/B first-/third-person captures with zero console errors. Final normal-speed `rig-player-motion.webm` and sampled playback images were regenerated; frames 0–2 were inspected. The final B-third tick-386 rAF sample measured 481 intervals, median 16.7 ms/p95 16.8 ms/zero above 25 ms on Windows 10, HeadlessChrome 156, RX 6700 XT at 1920×1080 DPR 1. Two pre-existing Three.js deprecation warnings remain.

Right-boot motion (0.23153 m maximum), detailed self-occluding referee appearance and full RFP-REQ-002 remain open. This checkpoint verifies the selected-player integration and bounded corrections, not the full feature or a published/scored training attempt. The next isolated diagnostic pilot follows `../../contracts/simulator-presentation.md#rigged-calibration-pilot-v1`.

The post-build local lifecycle rerun paused at 70/480, retained fullscreen/released pointer lock, held its tick for 300 ms and resumed to 480/480; zero console errors. The two pilot implementation paths are now assigned separately: Sol-high owns pure `evidence/calibration.ts`/tests against the frozen API; another Sol-high owns a local actual-resource report adapter and tests. The adapter cannot execute dependent verification until the pilot handoff. Neither slice may change the reviewed pose/query modules, source, scoring or routes.

<a id="15-rigged-football-presentation--local-report-adapter-boundary-review"></a>
## Local report adapter boundary review

The separate Sol-high adapter verifies all 14 declared resource lengths/hashes before GLTF parsing, compiles unchanged canonical/served source bytes, fingerprints renderer inputs before and after computation, and only then writes under `artifacts/rigged-calibration`. Geometry-only decoding deliberately omits images/materials; it does not claim material or renderer parity. Owned sampler/source geometry, materials and skeletons are disposed in finally paths. A coordinator review found final output filenames could follow existing links; a new confinement RED failed before the correction, then 4/4 focused tests and scoped ESLint passed. The adapter rejects destination symlinks/junctions, non-files and hardlinks. Independent Sol-high review reran 4/4 and returned scoped PASS for these boundaries. Actual dynamic pilot execution and complete report content remain pending the calibration-module handoff. Requested identity Sol high; runtime identity unconfirmed.

<a id="15-rigged-football-presentation--pilot-implementation-and-actual-resource-evidence"></a>
## Pilot implementation and actual-resource evidence

The bounded `evidence/calibration.ts` implementation freezes triangle/barycentric witnesses at 366, validates source/resource/timeline/topology/peak-pose identity, derives 92 contact/area rows and separates raw rays, camera near clipping and geometric gates. Its borrowed sampler is never disposed. Five initial fixture tests passed; independent review found the authored-contact distance incorrectly used visual ankle height 0.34 m and deserialized string triangle IDs could pass array indexing. Both RED regressions failed before correction. The corrected six focused tests pass with typecheck and scoped lint; independent Sol-high re-review reran 6/6 and returned scoped PASS. The distance now uses exact canonical ground y=0; actor/mesh names, triangle/vertex IDs and barycentric tuples are runtime-validated.

The first actual-resource report was provisional because of that distance-label bug. After correction, PowerShell set `$env:REFVIEW_RIGGED_CALIBRATION_INTEGRATION='1'`, ran `pnpm --dir apps/web exec vitest run src/lib/authoring/rigged-calibration-report.test.ts --silent=false --reporter=verbose`, and removed the variable afterward. All **5/5 adapter tests passed**, including the real-resource integration case (91.818 s; suite 92.97 s), integrity before/after, source immutability, output confinement and fingerprint stability. Web TypeScript and scoped adapter ESLint also passed. Only the selected 14 verified local files were used; image/material stripping is explicitly recorded as geometry-only decoding.

Corrected output: `artifacts/rigged-calibration/{bindings,report,metrics}.json`. Renderer input fingerprint `sha256:73233d28532025478328b3ca3a723c22892e50a1363f88b0f4c3145ee8e8cbf1`; source content `sha256:af3d339b32788db17d9b4fe1b7ce9aa880312fca57a26dd04ecde090f89edc76`; resource digest `4b9d88f8bfd5a066d7786585d5c684f4e9b8b56f6003a559b3f72e3bb53afdaa`. These are local diagnostic input identities, not attestation or publication approval. Metrics are outside deterministic report content: 2,709,528 seed triangle pairs (23.217 s), 2,034,165 triangle samples over 15 ticks, 360 ray casts/192 reuses (66.375 s).

The candidate seeds have zero separation and each is 0.3399662333 m from canonical contact ground. The nearest pair uses defender `2:SuperHero_Male` triangle 1490 and attacker `6:AuditionBoots` triangle 115. All 32 contact rows classify neither, including A. Area has A joint 26/30 rows and B neither 30/30. Total classifications are joint 26, cameraOnly 0, eyeOnly 0, neither 66. These observations expose an unsuitable or occluded automatic contact witness; they must not be forced into historical A/B expectations or claimed as calibrated training evidence.

After the final pilot correction, **`pnpm test` passed 386/386** (domain 87, simulation 78, content 80, web 141), plus the separate **5/5 adapter suite** above. **Root `pnpm typecheck`, `pnpm lint`, and `pnpm build` passed**. The new diagnostic modules do not change rendered pose or routes; the preceding final-motion browser evidence remains applicable. Independent final artifact review and Astra's next-gate assessment are recorded subsequently. Requested implementation/review Sol high and planning Astra xhigh; runtime-confirmed identities remain unconfirmed.

<a id="15-rigged-football-presentation--final-diagnostic-artifact-review-and-next-gate"></a>
## Final diagnostic artifact review and next gate

Independent Sol-high artifact review returned scoped PASS. A separate read-only validator confirmed 92 unique rows in exact tick/evidence/view/mode order (32 contact, 60 area), 15 ticks and no anchor/row classification inconsistencies. Bindings/report/metrics identities agree. This approves reproducible local diagnostics only; all contact rows remain unavailable for the chosen automatic witnesses and no training approval follows.

Astra-xhigh's read-only layer diagnosis found that defender body triangle 1490 has a corresponding boot-shell triangle 34, raised 0.013 m along bind normals by the model. At 366 from A, all gates pass, but both coincident seed points lie 0.02228 m behind defender boot-shell triangle 207. B is blocked by actor-005 shorts approximately 4.27 m before the seeds. The zero-distance pair selected an internal/inter-layer intersection rather than a reviewed exterior contact attachment. This explains the candidate's contact result; it does not establish that the whole incident is unreadable. Do not change canonical facts or force A/B outputs to repair this diagnostic.

<a id="15-rigged-football-presentation--outstanding-acceptance-current"></a>
## Outstanding acceptance (current)

The selected-player local integration and bounded left-leg/query slices have final-code checks above. Full planted-foot quality, detailed referee appearance, candidate calibration, renderer/material parity and training publication remain separate open requirements. Later relevant edits reopen their associated checks.

<a id="15-rigged-football-presentation--contact-layer-comparison-and-final-workspace-checkpoint"></a>
## Contact layer comparison and final workspace checkpoint

The bounded Sol-high implementation of `../../contracts/simulator-presentation.md#rigged-contact-layer-comparison-v1` is complete and independently reviewed. A missing-module RED preceded two passing fixture tests. The first opt-in execution exposed premature sampler disposal in its test callback; `return await` now keeps resources alive through the asynchronous comparison. The final explicit `REFVIEW_RIGGED_LAYER_INTEGRATION=1 pnpm --dir apps/web exec vitest run src/features/simulator/rigged-player/evidence/contact-layer-comparison.test.ts` run passed **3/3 in 135.61 s**. Scoped ESLint and web TypeScript passed. Independent Sol-high review reran the two fixture tests (one opt-in skipped), inspected the corrected lifetime and actual artifacts, and returned **scoped PASS, diagnostic only**.

New artifacts are `artifacts/rigged-calibration-layers/comparison.json` and `metrics.json`. The three historical pilot files remain byte-identical; their hashes are embedded as historical metadata. Both candidates use renderer input fingerprint `sha256:830a10f80e0d3b1dd5207456449058db506695bb970674e342f962fbf5c5a986` and equal source/resource/timeline/topology/peak/kernel identities. The baseline body triangle 1490 maps to boot-shell triangle 34 with posed separation **0.0123467214 m**. Excluding only proven covered skin reduces candidate pair products from 2,709,528 to 850,506. Defender selection retains 687 of 1,374 triangles; attacker selection retains 1,238 of 1,972, including 504 unmatched skin triangles. Every original occluder remains active.

The alternative nearest pair uses defender boot triangle 20 and attacker boot triangle 21, still with zero separation. Both reports contain 92 rows; all **60 area rows are identical**, while all **32 contact rows remain neither**. A is blocked by defender boots and B by actor-005 shorts. The run took 131.357 s inside the comparison: baseline seeding 16.605 s, baseline pilot 53.744 s and alternative pilot 55.418 s. This result demonstrates that layer exclusion alone does not select a suitable visible contact feature. It does not establish global exteriority, penetration depth or whole-incident unreadability. The next calibration decision is which observable feature represents contact, followed by fixed and moving rendered review; no attachment or training publication was adopted.

After the final implementation and test-lifetime correction, **`pnpm test` passed 388 tests** (domain 87, simulation 78, content 80, web 143; one opt-in integration skipped). The explicit real-layer suite above and the separate 5/5 actual-resource adapter suite provide additional integration evidence, with overlapping fixture tests not counted twice. **`pnpm typecheck`, `pnpm lint` and `pnpm build` all passed**; all 16 pages generated. The five canonical source files still match `artifacts/rig-integration-canonical-before.json`; `prompt.md` remains untouched. These diagnostic-only changes do not alter the previously verified rendered pose/routes, so their final-motion browser evidence remains applicable. Planning requested Astra xhigh; implementation and independent review requested Sol high; runtime-confirmed identities remain `unconfirmed`.

<a id="15-rigged-football-presentation--active-animation-audit-2026-11-04-before-refresh"></a>
## Active-animation audit (2026-11-04, before refresh)

The user rejected the current fall quality and requested a faster running start. Source inspection and fresh Playwright screenshots at 0/60/180/350/366/378/396/450/480 show these issues:

- Opening locomotion: attack-09 covers only about 1.75 m in two seconds; other tracks use smoothstep at path knots and start with zero velocity. The gait planner correctly chooses walking/idle for much of this source. Speeding only the clip would increase skating.
- Locomotion and stops: absolute distance-driven Idle/Walk/Jog blending exists. Sprint is available in the bundled library but is not used in the incident. Static canonical yaw can disagree with travel direction, and phases begin synchronized. These are separate from the model's mesh quality.
- Pass: the ball has an authored pass event; the selected rig has no dedicated kicking clip. Do not describe the generic running pose as a finished football pass animation.
- Challenge: the corrected defender left leg and tick-366 contact exist; the right support foot and transition quality still warrant review. Do not replace the corrected leg merely because the attacker fall is poor.
- Fall: the sampler always evaluates Jog, then lowers and inclines the body with additive joint rotations. After the fall weight reaches one, the base gait still cycles. At tick 420 one leg is visibly lifted while the body is on the ground. There is no independent settled pose.
- Referee: the selected-body ghost uses idle animation and is an orientation aid, not an animated locomotion implementation.

The actual bundled GLB has 43 clips. Only the relevant locomotion clips are used in this scene; combat, dance, swimming and generic Death/Roll clips are not football-specific alternatives. Recommendation: keep the selected athletic rig, improve source/gait synchronization, and author a one-shot trip/brace/landing/settle. Three.js supports independent action weights and one-shot final-frame holding; project playback remains absolute-tick rather than free-running ([AnimationAction](https://threejs.org/docs/pages/AnimationAction.html), [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html)).

Baseline browser command: `playwright-cli -s=motionaudit run-code --filename=artifacts/motion-audit-before.js`, with `video-start artifacts/motion-audit-before.webm` / `video-stop`. Nine fixed captures and full playback were recorded at 1600x900; coordinator inspected 0/378/420/480. Recording is retained as evidence, not a claim of frame-by-frame video inspection. No console errors; the existing Three.js Clock and shadow-map deprecation warnings remain. The next implementation follows `../../contracts/simulator-presentation.md#rigged-motion-refresh-v2`.
<a id="15-rigged-football-presentation--running-opening-implementation-and-independent-review"></a>
## Running-opening implementation and independent review

Sol high implemented MOT-REQ-002 in `authored-incident-v2.ts` and its test, plus the historical whole-timeline assertion in `motion-refinement.test.ts`. RED reproduced a first-step passer speed of 0.0149167 m/s below the requested running threshold. The new source applies the prescribed common 3.3 m/s forward increment through step 59, tapering smoothly through 95, to six outfield actors and the ball; the keeper is unchanged. The added starting displacement is approximately 4.29 m. The initial referee position changes only from z=29 to z=22.

Worker checks: focused authored tests 3/3; content tests 81/81; content typecheck/lint pass; public locomotion tests 5/5. An isolated real compiled-gait probe found jogWeight=1 for all six outfield actors at ticks 0/30/60, with the keeper retaining idle/walk. Source content identity intentionally changes from `sha256:af3d339b32788db17d9b4fe1b7ce9aa880312fca57a26dd04ecde090f89edc76` to `sha256:94054c79adc5c07789650548bcf789738e6fc6bb9f978ffa76025a6378bade8a`. The source file SHA-256 changes from `F2E46FAEEE9A606AFA980145D1B8676D5A7400FE3D58063D976DA8C0E5AC80F6` to `FC0F76D3C31214E454C4C02A796F1D3F400CCF1266A2479F2B6ED0AD95983471`.

Independent Sol-high read-only review returned scoped PASS. It transpiled/imported both the saved prior source and current source: every sample from 96..480 is JSON-identical (suffix SHA-256 `e1115baff17f6c655910710e281c0ac9da6df937b02535d74ca487b59c6e771f`), all 481 keeper samples match, and events/facts/rubric/sources/observation data match. Actor and ball opening offsets agree within 3.55e-15 m. First-second forward speeds range from 3.306 to 4.725 m/s; the preliminary 4.2 estimate was imprecise because the common increment adds to each actor's original speed. The contract wording now reflects the measured range without changing its formula. Reviewer reran focused 6/6 and full 81/81 content tests, typecheck and lint. Runtime identity remains unconfirmed.

Fresh Playwright initial-view captures `artifacts/motion-refresh-opening0.png` and `motion-refresh-opening60.png` at 1600x900 show the passer, receiver and ball inside the frame with running poses. The coordinator inspected both. Fall implementation was still active, so these are opening-only checks, not final integrated animation acceptance.
<a id="15-rigged-football-presentation--first-fall-candidate-rejected-transition-redesign"></a>
## First fall candidate rejected; transition redesign

The first Sol one-shot candidate passed six focused tests for stable local pose, actual posed mesh bounds, seek parity and exact entry. Independent Sol review reproduced those results, with minimum vertex y=-0.03033 m at408 and final body minimum y=0.03571 m. However, both coordinator and reviewer inspected `motion-refresh-rejected-A-378.png`, `-398.png` and `-420.png` and rejected the visible backward seated/rolling pose, raised legs and missing protective forearm brace. B views largely occluded the player and could not establish the intended staging. The implementation also interpolated scalar joint angles rather than the specified quaternion keys. Verdict: FIX, not visual acceptance. A separate bounded correction now addresses direction, quaternion keys and hand/forearm grounding.

The real faster prefix also changed accumulated gait phase. Two speculative defender-transition adjustments did not converge and were reverted rather than relaxing the existing guards. At the frozen intermediate state, maximum boot rotation was 0.305058 rad and flexion change 0.340394 rad against 0.25 rad bounds; knee displacement, calf rotation and axial twist passed. Exact contact hashes remained unchanged. Astra xhigh is redesigning this boundary using explicit authored starting-foot phases and the original absolute boot-orientation curve; Sol will implement the frozen redesign. No claim of a passing integrated motion gate is made at this intermediate point.
Astra's bounded read-only redesign compared the baseline and revised distance phases, preserving every increment and choosing only each actor's initial foot phase. The seven authored origins are recorded in the motion-refresh contract; modulo-phase difference from baseline after104 is at most approximately 1.1e-14. Its experiment isolated the second moving foot blend as unnecessary: restoring the original absolute foot curve with aligned origins recovers the established continuity bounds. This is a source-specific authored phase choice, not a clock reset, changed velocity or fake distance. Both local routes retain one public locomotion planner. The subsequent Sol implementation must prove exact source-leg joins and all guards independently of the planning probe.

The final MOT-REQ-003 implementation passed independent Sol-high read-only review. The seven authored phase origins exactly match the contract; distance increments, filters, cycle lengths and weights remain unchanged, with unknown actors retaining zero origin. Tests freeze baseline modulo-phase references at ticks 104/353/366/386 without importing the historical source at runtime. The complete source leg is restored at joins 346/386 and the authored absolute foot curve owns the intermediate orientation. Focused tests passed 11/11 (four unrelated skipped), plus 2/2 toe-focused tests. Measured maxima: boot rotation 0.225259235 rad, flexion 0.206153160 rad, knee travel 0.099629427 m, calf rotation 0.212109521 rad and axial twist 0.157176123 rad. Exact defender tick-366 SHA-256 remains `2aa792abccba54c8c57690f804e35d8f0a531d6b24fb55942b96c87f171e3bc9`; reverse/repeated seeks pass. Verdict: scoped PASS for phase/transition behavior; rendered integration remains pending the corrected fall.

<a id="15-rigged-football-presentation--corrected-fall-referee-and-steady-run-integration"></a>
## Corrected fall, referee and steady-run integration

The corrected authored fall removes the raised right leg and preserves an arms-braced forward landing. Actual selected-asset indexed vertices remain above the -0.04 m grass tolerance, tick 366 is unchanged, and the final local pose is identical from 420 through 480. Focused fall/locomotion/sampler verification passed 20/20. Fresh A captures at 380 and 420 show forward loss of balance followed by a low supported rest. Independent Sol-high review inspected those images and returned PASS; its broader fall/referee integration run passed 42 focused tests and web typecheck. `artifacts/final-fall-transition.webm` records the normal-speed 350..480 transition.

The referee now uses the complete selected rig with visible body, face, hair and garments, an opaque lit black kit, depth writes and shadows. First-person and elevated-review hiding remain unchanged. Preview and playtest share 4.5 m distance / -1.5 m lateral third-person defaults and restore them on reset. `artifacts/final-fall-referee-420.png` and `final-fall-A-420.png` were inspected: the referee is readable and no longer overlays the scene as a translucent ghost. Referee/default tests passed 5/5; exact-scene/live-controller integration added 24/24. Independent review verdict: PASS.

Nicolas then rejected the remaining fast-slow-fast opening. Astra-xhigh measured stops at the old smoothstep knots and designed a bounded canonical rewrite. Six outfield actors now hold constant per-actor velocities through tick 270 and use one smooth slowdown through 330; the keeper is unchanged. The pass formation is shifted 10 m toward negative Z with relative geometry and the 1.5 m onside margin preserved. The ball uses deterministic Hermite joins and remains within 0.738 m of the receiver. Every actor and ball sample from 330 through 480 remains byte-identical (`4fdfd2379eaef6dddac26e931c8f5c8b7adf73de60b769c41262dc8ce26b277e`), including contact and fall. Events, facts, rubric and sources remain unchanged.

The initial referee starts at (3,0,4) so the shifted run is visible. The synthetic calibration trace takes a plausible 242-tick sprint to its review position; full content tests remain green. `artifacts/final-steady-run-visible-0-ready.png` shows all six runners, ball and opaque referee in the initial frame. `artifacts/final-steady-run-visible.webm` records the complete normal-speed 0..480 playback. The coordinator observed zero console errors and the two existing Three.js deprecation warnings. Final checks at this checkpoint: content 81/81, integrated web motion/referee/default tests 26/26, and content/web typecheck pass. Independent final steady-run review is recorded after this entry.

Planning requested Astra xhigh. Implementations and independent reviews requested Sol high. Runtime-confirmed identities remain `unconfirmed`. This remains a local unpublished, unsaved and unscored candidate; observation calibration and training publication remain open.

Independent Sol-high final steady-run review returned **PASS**. It measured constant outfield speeds of 3.722, 5.110, 4.129, 3.728, 4.637 and 5.666 m/s through tick 269, followed by the single authored slowdown. It independently confirmed the exact suffix, keeper and authority hashes; jog weight above 0.99 through the steady segment; ball attachment/pass joins; contact phase; and fall regressions. Its checks passed content 81/81, focused motion 18/18, content/web typecheck and content lint. A single unused-local web lint warning found by review was removed without behavioral change; the affected sampler/fall tests then passed 13/13, web typecheck/lint passed cleanly and the production build generated all 16 pages.

The final root gate before that cleanup passed **402 tests** (domain 87, simulation 78, content 81, web 156, with one opt-in integration skipped), typecheck and build; the warning-only lint result was superseded by the clean web lint above. Independent review could inspect the still captures but not the WebM because its environment lacked a video playback tool. The deterministic speed tests and complete local recording remain the motion evidence for this checkpoint.

<a id="15-rigged-football-presentation--distance-driven-referee-locomotion"></a>
## Distance-driven referee locomotion

Nicolas requested referee movement comparable to the selected players. Astra-xhigh diagnosed that the live controller translated the referee at 4.2 or 7 m/s while the rig always sampled `Idle_Loop`. The accepted design retains the opaque black selected model and uses the verified Idle, Walk and Jog clips, player gait thresholds and calibrated cycle distances. A causal five-tick presentation reducer advances on every canonical integration tick, accumulates phase from actual horizontal distance and remains independent of render frequency. The canonical outer root continues to own view position and look yaw; only the visual child turns toward displacement, capped at 0.2 rad per tick. Authoring A/B teleports remain stationary Idle samples.

Sol-high implemented the pure reducer and rig sampler, then a separate Sol-high task integrated immutable motion samples through the local controller, exact renderer and both routes. Tests cover causal prefix invariance, builder/reducer equality, walking/running/sprint cadence, stop, lateral/backward facing, reverse/repeated skeletal sampling, 30/60/144 render parity, pause/camera hold, restart, exact forwarding, root authority, black kit, visibility and disposal. The coordinator corrected one additional exact-scene test caller after the new required frame field.

Playwright CLI exercised the actual Spanish playtest in fullscreen/pointer-lock mode. Fresh captures `artifacts/referee-motion-{w,shift,a,s,stop,pause}.png` show distinct running phases, direction-aware lateral/backward movement and return to Idle. First-person camera switching hides the body; restart returns to tick zero. `artifacts/referee-locomotion-inputs.webm` records the sequence. Browser console had zero errors and the two existing Three.js deprecation warnings. Independent Sol-high review inspected all six images and returned **PASS**; its focused gate passed 57/57.

Final workspace verification after integration passed **410 tests** (domain 87, simulation 78, content 81, web 164; one opt-in integration skipped), root typecheck, root lint and the 16-page production build. Requested planning identity: Astra xhigh. Requested implementation and review identities: Sol high. Runtime-confirmed identities remain `unconfirmed`. No scenario facts, observation trace schema, scoring or publication state changed.

<a id="15-rigged-football-presentation--leaner-selected-silhouette-continuation-2026-11-04"></a>
## Leaner selected silhouette continuation (2026-11-04)

Nicolas requested a slightly less muscular version of the selected characters. The pending local `athletic` body taper narrows the upper torso and shoulders by up to 15% laterally and 20% in depth, preserving Y coordinates, bones, source variant and generated kit binding. A Sol-medium implementation task added a focused fixture proving that a real shirt triangle follows the tapered cloned body, with the same skeleton/bind matrix and intended outward lift. An independent Sol-high review initially returned FIX because the fixture created no shirt triangle; the corrected test received PASS. Both requested model identities have runtime confirmation `unconfirmed`.

The coordinator inspected Playwright CLI captures `artifacts/rigged-silhouette-{game-distance,close-front,original-front,contact-a-third,contact-a-first,contact-b-first,fall-a-420}.png`. The audition comparison shows a visibly leaner athletic torso at close and game distance; the selected kit stays joined in those sampled views. At canonical tick 366, A third/first and B first retain their expected view composition and the referee's black kit remains opaque. At A third tick 420 the attacker rests on the ground without a visible new clothing seam. These stills do not establish continuous motion quality, complete A/B evidence availability or human acceptance of the final football contact. Browser console had zero errors and the existing Three.js Clock/shadow warnings.

Playwright CLI also played A third-person from tick 350 through tick 480 at normal speed and recorded `artifacts/rigged-silhouette-a-playback.webm`; the transport ended at tick 480 with no console errors. The recording was retained but not inspected frame by frame, so this is lifecycle evidence rather than a full motion-quality verdict.

The diagnostic geometry test initially failed only its whole-surface signature: the historical defender tick-366 hash `070fa94eddfddc1abe1f3495c996b0f1846990dc4706c3122b80492ed250acff` changed to `de6b5b3f02a5d2302388b2f5be06156a5bae792842aa7a43d0f318a7d06c5b9b` with the leaner mesh. Before moving the expected checkpoint, the focused test confirmed the defender left boot-toe maximum step remains 0.13752847 m and the nearest left-boot vertices remain 0.00198523 m apart at tick 366, matching the prior reviewed values. The checkpoint now records the new local candidate; historical calibration bindings/reports remain historical and are not reattached by this test.

After the last test edit, `pnpm --filter @refview/web exec vitest run src/features/simulator/rigged-player/model.test.ts src/features/simulator/rigged-player/scene-actor.test.ts src/features/simulator/rigged-player/referee.test.ts src/features/simulator/rigged-player/pose/sampler.test.ts src/features/simulator/rigged-player/pose/fall-grounding.test.ts src/features/simulator/rigged-player/evidence/geometry.test.ts` passed **28/28**. `pnpm --filter @refview/web typecheck` and scoped ESLint over the changed model/geometry tests passed. This is a scoped silhouette checkpoint; the full production gate, continuous playback and new contact calibration remain open before RV-019E acceptance.

<a id="15-rigged-football-presentation--anatomical-contact-feature-diagnostic-2026-11-04"></a>
## Anatomical contact feature diagnostic (2026-11-04)

RV-019E now has a camera-independent, diagnostic-only contact feature defined in `../../contracts/simulator-presentation.md#rigged-contact-feature-v1`. The pure selector probes every surface of each owner from opposite sides along the fixed world-space ankle approach axis at tick 350, accepts only first-entry anatomical regions at tick 366, and follows fixed triangle/barycentric bindings through ticks 364 to 371. A translated and rotated fixture exposed and corrected an initial local/world ankle mismatch. Focused selector, surface-query and geometry tests passed 17/17; typecheck and scoped lint passed. Independent Sol-high read-only review returned PASS after the correction. Requested worker model/effort: Sol/medium; reviewer: Sol/high; runtime-confirmed identities: unconfirmed.

The opt-in actual-resource test produced `artifacts/rigged-contact-feature/report.json` from the verified 14-file local player set and current canonical source. It preserved source, resource, historical report, and renderer fingerprints. It selected defender `actor-006` `AuditionBoots/leftBoot` and attacker `actor-002` `SuperHero_Male/leftShin`; all fixed bindings tracked from 364 through 371. At tick 366 their Euclidean separation is 0.1636609518583328 m and their signed separation on the frozen axis is -0.16366093143027338 m. The negative sign reports reversed patch order, not certified penetration depth. The opt-in test passed 1/1; typecheck and scoped lint passed. An independent Sol-high read-only review returned PASS for the diagnostic's provenance and arithmetic. Requested worker/reviewer model/effort: Sol/medium and Sol/high; runtime-confirmed identities: unconfirmed.

After the final diagnostic edits, the root `pnpm test` passed 414 tests with two opt-in tests skipped; root `pnpm typecheck` and `pnpm lint` passed. The actual-resource contact test was run separately with `REFVIEW_RIGGED_CONTACT_FEATURE_INTEGRATION=1` and passed 1/1. The local audition route continued returning HTTP 200. No production build was run after these edits while the development server was active.

`accepted` in the report means that the anatomical first-hit probe found qualifying surfaces. It does not approve the patch as a training contact. A paired marked/unmarked visual review at 364/366/370/371 from opposing close-up directions, plus unmarked normal-speed A/B first-/third-person inspection at current camera settings, remains necessary. If that review confirms excessive overlap, adjust the defender's left-leg presentation constraint under a revised pose contract; if it shows an unsuitable feature, revise the anatomical selection. Preserve canonical actor roots, ball, contact tick, facts, scoring and historical calibration reports. Do not adopt an observation attachment or publish training from this diagnostic.

<a id="15-rigged-football-presentation--contact-visual-review-and-next-correction-2026-11-04"></a>
## Contact visual review and next correction (2026-11-04)

The pure sidecar `evidence/contact-visualization.ts` freezes the report's defender and attacker triangle IDs, vertex order and barycentric points at ticks 364, 366, 370 and 371, converting them to world space once. Four fixture tests passed; an independent Sol-high review returned PASS for the pure transformation. The opt-in actual-resource reconstruction passed 1/1 after the latest diagnostic-camera source edit and wrote `artifacts/rigged-contact-feature/visualization.json` plus `visualization-attestation.json`. The attestation binds the historical report byte hash `sha256:8d4513298d15f6c04b449c3e26b14afa1e1dc4b577dc2fa2dcbc85966cd7f123`, current visualization hash `sha256:c86ee91c7796985360fa477f476c8f098455206baa95f70985f501cfec07b547` and current renderer fingerprint `sha256:816a43523f6f8de517dbbbf26837adece467325baa9bab1d89afca4052ac81f7`. The first integration attempt earlier in this work accidentally regenerated the report once; the corrected reconstruction now preserves the resulting report bytes and does not reselect patches. An independent Sol-high integration review returned PASS for that corrected boundary. This is a local visual reconstruction, not historical renderer equivalence or training approval.

The development-only, explicit-query authoring overlay validates source, report, sidecar digest, frozen bindings and current renderer fingerprint before loading. It starts with markers off. Two later fixed low cameras use the tick-366 patch midpoint and frozen approach axis, independent of the referee's A/B pose; close-view markers are small and depth-tested. Independent Sol-high code reviews returned PASS after an initial identity-validation correction and for the later camera extension. The final camera code passed web typecheck and scoped ESLint; the reviewer also passed 10/10 renderer-fingerprint tests.

Playwright CLI captured 32 paired clean/marked A/B first-/third-person images, 16 opposing axis-close images and 16 opposing lateral images at 364, 366, 370 and 371. Every capture waited for its exact settled-frame receipt; the lateral run returned 16 files and zero page errors. Unmarked normal-speed A-first and B-first WebM recordings cover the challenge; extracted A frames show the lunge and fall, but the 800×450 recording cannot certify the exact surface meeting. A-first reads as a plausible trip at match view; B-first remains genuinely screened by blue #2. The axis-close reverse view is screened by blue #4 itself.

The lateral clean views expose a pose defect: the defender's extended left boot visibly merges with the attacker's ankle/low shin at 366–371, especially `artifacts/rigged-contact-feature/lateral-right-370-clean.png` and `lateral-right-371-clean.png`; the opposing left view partly hides the seam. The marked right view shows the frozen patches are 0.16366 m apart at 366 rather than a precise exterior meeting. Two independent Sol-high visual reviewers and Astra-high planning agree that marker or feature reselection alone cannot fix the visible overlap. The images do not measure certified penetration depth. The sampler targets both ankles at essentially the same world point (about 0.000082 m apart at 366), explaining the overlap. `../../contracts/simulator-presentation.md#rigged-contact-pose-correction-v1` now scopes a defender-left-leg correction and explicitly supersedes the old frozen defender peak while retaining continuity and canonical authority. Its surface-clearance RED diagnostic is the next implementation dependency. No observation attachment, training approval or publication was adopted.

After the final lateral-camera edit, `pnpm test` passed 418 tests (domain 87, simulation 78, content 81, web 172; two opt-in tests skipped). Root `pnpm typecheck` and `pnpm lint` passed. Requested planning Astra/high, bounded implementation Sol/medium and independent reviews Sol/high; runtime-confirmed identities remain `unconfirmed`.

The first surface-clearance diagnostic now measures a fixed-axis whole-region plane and actual nearest exterior surface distance using verified player resources. Its initial positive-acceptance assertion failed RED on the old pose: the fixed-axis signed gap is -0.52597567 m, with nearest surface distance 0 m. A synthetic disjoint fixture also fails that axis, so the helper was corrected to say `not-separated-by-declared-plane` rather than `overlap`. Default focused tests passed 2 with one opt-in skipped; the opt-in baseline passed 3/3, web typecheck and scoped lint passed. Independent Sol-high review found the helper sound as a sufficient *single-plane* diagnostic but returned FIX for using it as the full pose-correction acceptance proof: a failed plane and zero surface distance do not distinguish crossing from tangency or identify the intended seam. The contract now explicitly requires a separate whole-part certificate and an actual-resource RED acceptance test before pose edits. No pose change has been made at this checkpoint.

The whole-part `contact-separation` diagnostic now builds separate complete left-boot/left-shin parts for both owners, retaining ordered triangle connectivity and checking hull candidate axes against every original vertex. Its old-pose actual-resource RED at tick 366 found zero triangle-surface distance in all four cross-actor pairs; best signed candidate gaps were -0.05670793, -0.07398640, -0.04273688 and -0.08536689 m. These values are failed certificates, not measured penetration. Seven synthetic tests passed after a reviewer-requested topology and aggregate-gap correction; independent Sol-high rereview returned PASS for the diagnostic. A second certificate-only API proves at least 1 mm separation without exact triangle queries, passed nine synthetic tests and independent Sol-high review. The exterior-witness threshold query uses deterministic triangle AABB pruning and outside-in first hits across all owner meshes. Independent review first returned FIX for same-mesh ties and nearest-only false negatives. The corrected strict first-hit rule plus fixed interior barycentric probes passed 11 focused tests, typecheck, lint and Sol-high rereview. Its `null` means no sampled witness was certified, not absence of any possible exterior contact.

The opt-in actual-resource pose gate fixed the approach axis at tick 350 and checked the exact source/resource/timeline/topology identities. Peak mode failed RED at tick 366 with first uncertified boot/boot pair gap -0.05670793 m; full-window mode certified ticks 346–359 and first failed at tick 360 on defender boot/attacker shin gap -0.01900676 m in 262.03 s. A reviewer-requested failure-report correction separated the prior verified gap from the failing signed gap; independent Sol-high rereview returned PASS. Default opt-in tests skip; web typecheck and scoped lint passed. This is an authority-preserving diagnostic and has not changed training observation or scoring.

The first bounded defender-target trial found a feasible **peak**: local target `(-0.55, 0.34, 1.044)` yielded a minimum +0.0042359504 m whole-part certificate, and the updated exterior-witness peak gate passed within the 20 mm threshold. A separately measured nearest eligible pair was 0.0164753245 m at a shared vertex, which required the subsequently reviewed interior probes; it is not the returned final witness distance. Continuity remained RED: the maximum consecutive world-knee displacement was 0.1075477244 m at tick 361 against the retained 0.10 m limit; manual lag tuning reached only 0.1050958521 m. Toe displacement 0.1433671 m, boot rotation 0.2252586 rad, calf rotation 0.243505 rad, axial twist 0.089687 rad and flexion change 0.154182 rad stayed within their bounds for that trial. The implementer reverted all trial pose/test edits; the original focused tests passed 16/16. No pose correction is accepted yet. `../../contracts/simulator-presentation.md#rigged-contact-pose-correction-v1` now specifies a measured, compact-support vector entry-curve fit that preserves the passing peak and all protected canonical data. Requested implementation Sol/medium, independent reviews Sol/high and redesign Astra/high; runtime-confirmed identities remain `unconfirmed`.

The compact-support nine-parameter entry fit reproduced the trial RED at 0.1075477227 m/tick at tick 361. The best admissible archived fit reached 0.1025547731 m/tick at tick 361 with 0.0549766728 m maximum integer-tick ankle correction, still above the 0.10 m limit. `artifacts/rigged-contact-pose-fit/trial-entry-fit.json` records **baseline-trial** solved hip/knee/ankle positions, target reach, pole direction and ±1 mm target Jacobians, plus the best-fit coefficients and scalar maximum. Its joint rows 360→361 reproduce the baseline 0.1075477227 m step, not the fitted 0.1025547731 m step; therefore they cannot establish pole sensitivity for the best fit. `node artifacts/rigged-contact-pose-fit/audit-fit.mjs` passed; a dense support scan found a 0.0553212637 m correction maximum, below the 0.06 m exploration cap, and confirmed zero endpoint values/slopes. The actual-solver fitting harness was temporary and removed, so this archive is a diagnostic of a rejected candidate, not a replayable pose implementation. Other continuity bounds and full geometry were not rerun for the rejected fit. The original runtime pose was restored; focused sampler tests passed 8/8, web typecheck and lint passed. A separate knee-pole trajectory redesign requires fitted-pose sensitivity evidence before implementation.

<a id="15-rigged-football-presentation--bounded-contact-entry-experiments-and-recovery-limit-2026-11-04"></a>
## Bounded contact-entry experiments and recovery limit (2026-11-04)

The follow-up reconstructed the polynomial candidate on the actual sampler and measured world-knee movement of 0.10255477309483214 m at tick 361. Its fitted-pose pole sensitivity and bounded two-tick grid reached only 0.101564697 m, so pole adjustment was not adopted. The first archive's preliminary target helper failed to clamp a negative smooth input at ticks 360 and 361; those target/reach/pole rows are now marked invalid, while the actual-rig joint and Jacobian samples remain valid. An independent Sol-high review verified the fitted knee scalar, segment/reach/pole arithmetic and derivative sensitivity, but the archive does not establish full-window continuity.

The final bounded entry experiment used seven fixed Hermite knots over ticks 352..366, a continuous 0.06 m correction certificate from Bezier controls, and one 900-trial coordinate search. The archived polynomial reproduced RED at 0.10255477309483214 m/tick. The best Hermite candidate reached 0.10031926178113107 m/tick at tick 361 with a maximum control norm of 0.059952318005523246 m: better, but still above the 0.10 m bound. The first full 344..388 audit of this trial peak also found calf world rotation 0.8425559002767611 rad and axial twist 0.8423683078977333 rad at tick 367, exceeding the 0.35/0.20 rad recovery limits. The earlier entry-only statement that the peak trial failed only its knee bound was incomplete. Toe probe 0.1926195 m, boot orientation 0.2252590 rad, flexion 0.2040986 rad and segment deviation 1.77e-7 m stayed within their measured limits; rendered-toe geometry was not independently bounded.

`artifacts/rigged-contact-pose-fit/hermite-entry/report.json` and logs preserve this rejected experiment. The worker restored the original runtime pose and removed the temporary fit hook. Focused sampler tests passed 8/8, web typecheck and scoped lint passed after restoration. Independent Sol-high read-only review returned scoped PASS for the rejected-result arithmetic and restored sampler; the transient optimizer source and historical protected-fact identity were not independently replayable. No new contact gate or visual acceptance was run because continuity failed. RFP-REQ-002/004/007 and training calibration remain open. Requested planner Astra/high, fit implementer Sol/medium and reviewer Sol/high; runtime-confirmed identities remain `unconfirmed`.

---

<a id="16-coherent-match-experience"></a>

<a id="16-coherent-match-experience--independent-review-evidence"></a>
## Independent review evidence

Task status remains in `../../specs/tasks.md`. This review accepts RV-019F against CME-REQ-001..007, not the separate rig replacement, full CME-REQ-008, or training content.

<a id="16-coherent-match-experience--site-shell-and-immersive-controls"></a>
## Site shell and immersive controls

The delegated CME-04 and CME-05 implementation requested `gpt-6-sol`/`medium`; runtime-confirmed identity was unavailable. Independent read-only review requested `gpt-6-sol`/`high`; runtime-confirmed identity was unavailable.

The review confirmed browser fullscreen and pointer lock on entry, `M` pausing tick 17 to 17 while releasing pointer, resume advancing to tick 36, and Escape pausing again. Entry-flow and live-controller tests passed 13/13. The mobile home had no horizontal overflow at 390 x 844. It found one keyboard issue: the authoring skip link targeted a hidden review panel. The coordinator changed it to open and focus that panel; fresh Playwright Tab/Enter placed focus on `#incident-workspace`, and the next Tab reached the timeline. Targeted read-only re-review passed.

<a id="16-coherent-match-experience--field-lighting-and-stadium"></a>
## Field, lighting and stadium

The stadium implementation requested `gpt-6-sol`/`medium`; runtime-confirmed identity was unavailable. Independent read-only review requested `gpt-6-sol`/`high`; runtime-confirmed identity was unavailable. The reviewer verified the penalty mark at 41.56 m against [IFAB Law 1](https://www.theifab.com/laws/latest/the-field-of-play/).

The first review found a 5.275 m vertical corner-to-roof opening, crowd-head instances clustered on one side, a shadow-map disposal omission, and no ball shadow. Red tests reproduced the corner, crowd and disposal issues. The coordinator enclosed the corner, distributed the heads, disposed the sun shadow resource exactly once, and enabled ball shadows in authoring and playtest. The final-code image review inspected [A third person](../../../artifacts/cme-final-a-third-366.png), [A first person](../../../artifacts/cme-final-a-first-366.png), [B first person with goal](../../../artifacts/cme-final-b-first-goal-366.png), and [live play](../../../artifacts/cme-final-playtest-live.png). It found no regression in contact/line readability and passed the bounded CME-03 candidate.

After the latest implementation edit, `pnpm --filter @refview/web test` passed 82/82, `pnpm --filter @refview/web typecheck` passed, `pnpm --filter @refview/web lint` passed, and `pnpm --filter @refview/web build` generated all routes. Final-code fixed-view frame sampling at 1920 x 1080, DPR 1, on HeadlessChrome 156 / AMD RX 6700 XT recorded 481 intervals with 16.7 ms median and 16.9 ms p95. Live play sampled 439 intervals with 16.7 ms median and 16.8 ms p95. An instrumented WebGL2 sample counted 529 draw calls and 95,032 triangle submissions per frame including shadow pass. These are browser/API proxies, not GPU timings.

The above was an earlier bounded candidate. Its sky, grass, crowd-distance and goalward gaps were addressed in the final RV-019F pass; its screenshots and measurements predate that pass and are historical evidence only.

<a id="16-coherent-match-experience--final-rv-019f-review"></a>
## Final RV-019F review

The final grass implementation requested `gpt-6-sol`/`medium` and the stadium refinement requested `gpt-6-sol`/`medium`; runtime-confirmed identity was unavailable for both. The coordinator integrated the grass module, closed the concourse-corner slit found in the delegate's first visual captures, and added integration assertions for three owned turf maps and the corner bridge. The independent final read-only review requested `gpt-6-sol`/`high`; runtime-confirmed identity was unavailable. It inspected the final environment/resource paths and reported no code blocker. Its focused environment/grass test command passed 15/15.

The reviewer inspected all 11 fresh `cme-final-2026-*` Playwright CLI captures: [A third-person contact](../../../artifacts/cme-final-2026-a-third-contact.png), [A first-person contact](../../../artifacts/cme-final-2026-a-first-contact.png), [B first-person goalward](../../../artifacts/cme-final-2026-b-first-goal-contact.png), [before contact](../../../artifacts/cme-final-2026-a-third-before.png), [fall](../../../artifacts/cme-final-2026-a-third-fall.png), [elevated pass](../../../artifacts/cme-final-2026-elevated-pass.png), [live approach](../../../artifacts/cme-final-2026-playtest-approach.png), [live contact](../../../artifacts/cme-final-2026-playtest-contact.png), [live fall](../../../artifacts/cme-final-2026-playtest-fall.png), [playtest menu](../../../artifacts/cme-final-2026-playtest-menu.png), and [mobile authoring](../../../artifacts/cme-final-2026-authoring-mobile.png). It found A contact/ball/penalty boundary readable, B appropriately weaker, a continuous sky/roof join, a matte grass still response without apparent tiling, and coherent menu/mobile layout. In a follow-up, it inspected the [eight-frame forward-motion sheet](../../../artifacts/cme-grass-motion-contact-sheet.png) and full-resolution frames 0, 3 and 7, finding no visible grass shimmer, glitter, tiling or line-readability regression in those sampled views. Approximately 220-ms frame spacing does not prove every intervening 60-Hz frame or camera path. The upper enclosure and crowd remain intentionally stylized.

After the final relevant edit, the coordinator ran `pnpm --filter @refview/web test` (87/87), `pnpm --filter @refview/web typecheck` (pass), `pnpm --filter @refview/web lint` (pass), and `pnpm --filter @refview/web build` (pass). At 1920 x 1080 DPR 1 on Windows 10 / AMD RX 6700 XT / HeadlessChrome 156, 481 authoring rAF intervals measured A third 16.7 ms median / 16.9 ms p95 and B first 16.7 / 16.8 ms, both zero over 25 ms. Normal-speed play sampled 424 intervals at 16.7 / 16.8 ms with six over 25 ms and p99 33.3 ms. The frozen acceptance budget is median <=16.7 ms and p95 <=25 ms; the observed rounded medians meet it. A 180-frame WebGL2 wrapper sampled 532 draws and 95,790 triangle submissions per frame including shadows. These are browser/API proxies rather than GPU timing. A fresh `M`-menu browser check held tick 34 for 500 ms within native fullscreen, released pointer lock, and regained lock on resume; the mobile playtest showed the explicit unsupported-controls state. The read-only reviewer returned **PASS for bounded CME-REQ-001..007**. RV-019E rig replacement, derived evidence recalibration and training attestation remain open.
