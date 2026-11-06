# Pitch-first site interface refinement

Status is tracked only in `../../specs/tasks.md`.

## Objective

Substantially improve the interface of all implemented public routes, led by the authored 3D incident and local playtest. Make the field the focal point, make the next action obvious, and keep the RefView visual world consistent from home through simulator controls. The established field-ink/lime DESIGN.md direction remains authoritative. This is a local, unsaved, unscored prototype iteration.

## Acceptance

- **UI-REQ-001:** Spanish and English home, authoring, local playtest and neutral controls have a consistent brand/navigation pattern and honest route labels. Every visible route link resolves to an implemented destination; keyboard focus and the current route are visible.
- **UI-REQ-002:** At desktop 1440×900 and 1280×720, authoring places the incident field, tick/time, transport, A/B/camera and fullscreen controls in a clear hierarchy. Contact at tick 366 and fall at tick 386 remain readable in A; B retains meaningful screening. Playback, seek, pass review, first/third person, A/B and fullscreen still work.
- **UI-REQ-003:** Local playtest shows start/pause/resume/restart and current state without controls being hidden beneath the initial desktop viewport. Advanced camera sliders and diagnostics remain available but secondary. The local run still starts, pauses, resumes and restarts without changing canonical ticks or authority.
- **UI-REQ-004:** Neutral controls and home give the same clear path into the authored incident and local test, while accurately distinguishing a neutral movement preview, an authoring review and an unsaved playtest. Mobile routes have no horizontal overflow and make desktop-only input limits clear.
- **UI-REQ-005:** The interface has responsive layouts, legible labels, visible focus, loading/error/disabled states and reduced-motion behavior. Motion guides attention and never changes evidence or causes camera movement during canonical incident review.
- **UI-REQ-006:** No canonical asset, rig, clip, event, camera pose/FOV/near/far/DPR, observation, evaluation, scoring, persistence or publication contract changes. Tests, lint, typecheck, build, Playwright CLI browser checks and independent read-only review pass. New authoring renderer code requires renewed training evidence separately.

## Evidence

Before captures: `artifacts/rv020-baseline-{home,incident,playtest,controls}.png` and mobile equivalents. Post-change command and visual evidence belongs in `review.md`.
