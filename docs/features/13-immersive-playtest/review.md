# Immersive local incident verification

## Scope and provenance

RV-019C changes only presentation of the unsaved, unscored local incident and its authored inspection view. The local playtest now fills the viewport from entry, enters pointer capture and requests fullscreen from one deliberate action, removes interactive controls during active play, and keeps pause and completion menus inside the stage. One shared original procedural environment supplies the field, two regulation goals and nets, runoff, boards and stepped stands to both routes. One shared original procedural player factory supplies softer silhouettes and fixed shirt numbers. All meshes, numerals, materials and stadium elements were authored in this repository for this feature; no external model, texture, animation, sound, font or likeness was imported.

The coordinator requested `gpt-6-astra` / `xhigh` for read-only fundamental direction, `gpt-6-sol` / `medium` for the three bounded immersive UI, environment and player implementation slices, and `gpt-6-sol` / `high` for independent read-only final review. The runtime did not expose an effective model/effort identity for any delegate; runtime-confirmed identity is `unconfirmed`. The coordinator owned the contracts, both scene-adapter integration, final browser checks, corrections and task tracker.

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

## Browser, WebGL and motion evidence

Playwright CLI in local Chrome checked the 1280x720 ready stage and canvas at exactly 1280x720 with a single `Entrar a la cancha` button. The first click entered fullscreen and pointer lock; active play had **zero visible buttons**, no tick counter or transport, and only noninteractive preview/pause labels. Escape paused at tick 80 and remained at tick 80 after 350 ms. A synthetic focus-loss check paused at tick 16 and stayed at tick 16 after 300 ms. At 1440x900, resume, restart to tick 0 and fullscreen exit passed; the latter paused and released pointer lock. A complete local run reached tick 480 in fullscreen, released pointer lock and showed Restart/Return actions without disabled Start. Synthetic pointer and fullscreen denials showed Spanish recovery; fullscreen denial remained playable inline, and a successful retry cleared the alert in pause and subsequent play. English 390x844 showed the desktop-only notice with no horizontal overflow. These checks reported zero page errors. Scripts and captures are `artifacts/rv019c-browser-smoke.js`, `rv019c-focus-pause.js`, `rv019c-playtest-flow.js`, `rv019c-completion-check.js`, `rv019c-fullscreen-fallback.js`, and their `rv019c-*.png` outputs.

The goalward 1280x720 capture `artifacts/rv019c-goalward-1280.png` visibly shows the real goal, subdued net and goalkeeper after turning the camera; the initial canonical yaw does not point directly toward that goal. The shared geometry tests measure goals at `z = ±52.5`, 7.32 m clear width and 2.44 m clear height, and prove stands/boards stay beyond play. The environment owns and disposes its resources, and the scene mount/unmount test restores the previous background and fog. The shared player-model tests include public-handle shirt mapping, the original joint/boot contract and canonical authoring/playtest parity at tick 366.

The coordinator inspected authored A/B first- and third-person tick-366 captures at 1440x900 and 1280x720, A fall at tick 386, the tick-120 pass, and the 390x844 authored layout. Contact, B screening and fall remain readable; the updated shirt numbers are attached to the jersey. `artifacts/rv019c-motion.webm` records normal-speed authored playback from tick 345 through the fall and tick 480; sampled frames `rv019c-motion-frame-3.png`, `-5.png`, `-7.png`, and `-9.png` were inspected. The recording's captured video is 800x450 even though the authoring browser viewport was larger, so the fixed-tick full-size captures remain the stronger pixel evidence.

The coordinator measured 120 active `requestAnimationFrame` intervals at each size in Chrome on Windows with ANGLE/D3D11 and AMD Radeon RX 6700 XT, device pixel ratio 1. At 1280x720, canvas ready took 679 ms, median/p95/max intervals were 16.7/16.8/16.8 ms, and canvas CSS/pixel sizes both matched 1280x720. At 1440x900, ready took 593 ms, intervals were 16.7/16.8/16.9 ms, and both canvas sizes matched 1440x900. `artifacts/rv019c-performance.js` is the measurement script. This is a scoped local observation, not a general FPS guarantee. The environment test bounds its direct drawable children below 80.

## Acceptance and limits

IMM-REQ-001 through IMM-REQ-005 have source, focused test and browser/visual evidence above. IMM-REQ-006 is bounded by the changed-file review: no canonical tracks, events, source assets, joint positions, evidence anchors, observation, evaluation, scoring, persistence or publication code changed for this feature; viewport aspect is sampled from the actual settled canvas. IMM-REQ-007 has the full checks, browser, motion and cost evidence above. Independent read-only review inspected the integration and reported no high-severity findings; its fullscreen-alert recovery note was corrected and rechecked with Playwright CLI. The final re-review disposition is recorded below.

The players remain stylized procedural meshes, not photoreal footballers. The fixed authored rig limits anatomical realism. This presentation candidate requires renewed exact source/build/capture binding and Nicolas's training approval under RV-008/RV-011 before any scored or published use; earlier visual approvals are not reused.

## Independent review

The independent `gpt-6-sol` / `high` reviewer returned **PASS** after targeted read-only re-review of the fullscreen-alert correction. The reviewer independently ran the three focused environment/player/entry-flow test files: 14/14 passed, and found no new lifecycle, disposal, parity or canonical-boundary issue. Runtime-confirmed identity remains `unconfirmed`.
