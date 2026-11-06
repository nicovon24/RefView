# Interface refinement verification

## Scope and orchestration

RV-019B improves the implemented home, authored incident preview, local unsaved playtest, and neutral controls routes. The shared `SiteHeader` presents implemented destinations and preserves locale. Route-specific CSS and copy give the 3D field priority, keep immediate simulator actions in view, and distinguish the three simulator modes. No canonical incident asset, timeline, evidence geometry, scoring, persistence or publication code was edited for this feature.

The coordinator requested `gpt-6-astra` at `xhigh` for read-only site direction and shared-contract planning, then `gpt-6-sol` at `medium` for three bounded implementation slices (authoring, playtest, home/controls). A separate `gpt-6-sol` at `high` performed read-only final review. The runtime did not expose effective model/effort identity for any delegate; runtime-confirmed identity is `unconfirmed`. The coordinator owned the shared header, integration, tracker and this evidence record.

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

## Browser and WebGL evidence

Playwright CLI on the local Chrome preview checked Spanish and English navigation, current-route indication, no mobile horizontal overflow, reduced-motion transition removal, authoring transport/seek/A/B/first-/third-person/pass/fullscreen, and local playtest start/pause/resume/restart/fullscreen/completion with zero page errors. The normal playtest flow was rerun after the final API-rejection correction and passed (playing tick 25, paused/stable tick 30, resumed tick 56, restart tick 0, complete tick 480). Scripts: `artifacts/rv020-browser-check.js`, `rv020-playtest-check.js`, and `rv020-fullscreen-diagnostic.js`.

- Before/after desktop and mobile captures: `artifacts/rv020-baseline-*`, `artifacts/rv020-final-*`; settled captures `artifacts/rv019b-playtest-ready-settled.png`, `rv019b-incident-mobile-settled.png`, and `rv019b-controls-mobile-settled.png`.
- Authoring at 1440x900 and 1280x720: scene measured 1013x570 and 693x390. The A first- and third-person tick-366 contact and tick-386 fall, B screening, and tick-120 elevated pass were visually inspected. At 390x844 the authoring scene measured 390x219 (16:9) and controls stayed reachable without horizontal overflow.
- Local playtest at 1280x720: stage measured 880x495 and all primary buttons were inside the initial viewport; start reached tick 26, Escape paused at tick 29 and remained there, camera settings did not resume playback, resume reached tick 55, restart returned tick 0, and a full run reached tick 480. A 1440x900 check also kept actions in view. In fullscreen the stage and canvas both measured 1280x720 after browser layout settled; `artifacts/rv020-final-playtest-fullscreen-settled.png` shows the field and persistent actions.
- Normal-speed authoring segment: `artifacts/rv020-final-motion.webm` from tick 345 through the fall and end. Sampled frames `rv020-motion-2.png`, `rv020-motion-4.png`, and `rv020-motion-6.png` were visually inspected. This is a scoped readability check, not a frame-rate measurement or training attestation.

## Acceptance and limits

UI-REQ-001 through UI-REQ-004 have direct route, interaction and screenshot evidence. UI-REQ-005 has responsive, focus, reduced-motion and ordinary loading/disabled behavior evidence. Browser pointer-lock and fullscreen rejection or synchronous exceptions now show a bilingual `role=alert` with retry guidance, including inside fullscreen; a successful retry clears it. The implementation worker reported Playwright CLI synthetic denial checks for Spanish pointer lock and fullscreen entry/exit and English pointer lock. The independent reviewer inspected this correction but did not independently rerun those synthetic denials. UI-REQ-006 has source-scope and passing package checks. Independent read-only Sol-high review returned **PASS**, with no P1/P2 findings after correction. A P3 polish note remains: a sealed run displays a disabled Start button beside the clear completed state and active Restart button.

This remains a local, unsaved, unscored preview. The static product concept and gated session test route were outside the implemented public-route pass. No renewed exact source/build/capture attestation or human training approval was claimed. Those remain RV-008/RV-011 work.
