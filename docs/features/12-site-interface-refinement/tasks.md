# Task contracts

Canonical status is in `../../specs/tasks.md`.

1. Capture current desktop/mobile home, authoring, local playtest and neutral-controls baselines. Freeze existing route, renderer and camera constraints.
2. Coordinator creates the shared presentation-only header contract and route labels. Verify both locales and no authoring font/asset dependency.
3. Refine authoring field/timeline/transport/viewpoint hierarchy, without changing WebGL camera or canonical state.
4. Refine local playtest ready/playing/paused/end states and make immediate controls visible at desktop target sizes. Keep diagnostics secondary and controller unchanged.
5. Refine home and neutral controls to the shared shell, product truth and mobile limitations.
6. Integrate, visually inspect fixed A/B contact and fall, verify route interactions and responsive/reduced-motion behavior, run tests/lint/typecheck/build, obtain independent read-only review and record evidence.
