# Incident 001 C2 technical calibration evidence

This note records a deterministic prototype measurement against the compiled authored v2 source, its private observation fixture, and its bound private rubric. The executable evidence is `packages/content/src/incident-observation-calibration-v2.test.ts`. It is not publication approval or a production observation score.

## Fixture and candidate views

The test compiles `createIncident001SourceV2()` with the four actual local procedural asset bytes and geometry resolver. It reads `privateContext.observationFixture` and the rubric's required evidence IDs, `EV-INSIDE-AREA` and `EV-TRIP-CONTACT`. The candidate views use A `(6, 32)` and B `(12, 26.5)` in metres, first and third person, a 50 degree vertical FOV, aspect `1100/460`, third-person distance 2 m and lateral offset 0. Both look toward `(13.8, 36.8)` with pitch toward a 0.8 m target. These are fixed diagnostic views, not sampled human gaze.

| Evidence window | Tick range | A first/third | B first/third |
| --- | ---: | --- | --- |
| Trip contact | 364–371 | `joint` at all 8 ticks | `neither` at all 8 ticks |
| Inside area | 360–374 | `joint` at all 15 ticks | `neither` at all 15 ticks |

There were no per-tick classification exceptions in these four mode/position pairs. This extends the earlier single-tick C1 check; it does not independently validate rendered pixels.

## Plausible live traces and C2 result

Each trace begins at the authored referee spawn `(3, 29)`, yaw `0.8`, pitch `0`, then linearly reaches A or B and its look direction by tick 180. Ground movement stays below the 5/60 m walking ceiling per tick, and yaw/pitch/framing changes stay within C2 bounds. The trusted context builds its initial view independently from the authored pose and selected run-start camera mode, rather than copying tick zero from the submitted trace. Its field bounds use the canonical centered field frame, x `−34..34` and z `−52.5..52.5`. A 1 cm tick-zero submission change is rejected. All ticks `0..380` have a view; the terminal deciding break is at tick 380, inside the authored 360–480 decision window. Every test trace passes the real `validateObservationTraceV1` before `summarizeObservationTraceV1` runs with the compiled fixture and required-evidence rubric.

| Nominal render cadence | Exact-state live receipts | A first/third: inside area | A first/third: trip contact | B first/third |
| --- | ---: | --- | --- | --- |
| 30 fps | 191, one every 2 ticks | 8 receipts, 14 tick span, `supported` | 4 receipts, 6 tick span, `supported` | Both `none`; score 0 |
| 60 fps | 381, one every tick | 15 receipts, 14 tick span, `supported` | 8 receipts, 7 tick span, `supported` | Both `none`; score 0 |
| 144 fps | 915, two or three per tick | 15 distinct ticks, 14 tick span, `supported` | 8 distinct ticks, 7 tick span, `supported` | Both `none`; score 0 |

For A the synthetic observation summary is `scored`, score 100; for B it is `scored`, score 0. These are model outputs only. Duplicate 144 fps receipts coalesce by tick. The cadence examples submit exact canonical states by construction; they are not measured browser frame rates or proof of compositor presentation.

The executable assertions check the raw receipt counts `191/381/915`, distinct eligible ticks `191/381/381`, each required evidence window's exact tick range, and the strongest-chain receipt counts and spans shown in the table.

Replacing all 360–374 live receipts with replay receipts leaves the A geometry jointly readable but yields both required bands `none` and score 0. A separate continuous third-person A trace moves yaw by −0.8 rad, distance to 6 m, and lateral framing to −2.4 m by tick 180; its trip-contact window is `cameraOnly` at all 8 ticks, with no joint credit and score 0. The C2 summary takes no decision choice, so a correct penalty guess cannot increase its observation band; this test does not exercise the separate decision evaluator.

## Limits and gate

The `supported` threshold of 3 distinct receipts across at least 4 ticks is a synthetic engineering heuristic pending independent review. A ray/anchor classification and renderer submission receipt cannot prove that a person saw or interpreted contact. The test does not inspect browser frames, screen occlusion beyond the authored boxes, gaze, visual attention, or human judgement. The 144 fps pattern is representative receipt density, not a measured device cadence. Nicolas's scoped positive scene feedback and independent WebGL preview review do not approve this observation score for production. Keep the scenario in draft and `observationCalibrationApproved` unset until exact source/build/capture binding, rendered evidence review, and the remaining training gate are completed.

## Verification

- `pnpm --filter @refview/content exec vitest run src/incident-observation-calibration-v2.test.ts --reporter=verbose` — the added tick-zero trust assertion initially failed at assertion level (`expected [Function] to throw an error`), then 7 tests passed after the context correction and exact receipt/span assertions.
- `pnpm --filter @refview/content lint` — passed.
- `pnpm --filter @refview/content typecheck` — passed.

These checks cover the test and pure model only. No browser, PostgreSQL, publication, or production scoring path was exercised here.

## 2026-11-03 fullscreen 16:9 follow-up

After the authoring canvas gained a 1280x720 fullscreen mode, the same executable diagnostic was parameterized by aspect. The original 1100/460 cases remain explicitly historical. The new 16:9 cases classify all 92 C1 evidence ticks across A/B and first/third person: A is `joint` and B is `neither` throughout both required windows. Twelve authored-spawn-to-tick-380 traces at nominal 30/60/144 fps pass `validateObservationTraceV1`; in both modes A has both bands `supported` and model score 100, while B has both bands `none` and model score 0. Replay-only replacement in the evidence window and a camera-only third-person trip both yield no joint credit and score 0.

The fullscreen tests assert each exact receipt tick, sequence and epoch, not only totals: 30 fps has ticks 0,2,...,380; 60 fps has all 0..380; 144 fps has two or three raw receipts per tick. Raw receipt counts are 191/381/915 and eligible distinct ticks 191/381/381. The terminal break is `deciding` after tick 380, at the next sequence and with no next epoch. The 144 fps duplicate pattern is a synthetic trace-density check; the new browser controller is designed to emit at most one receipt per canonical tick over its complete 0..480 run.

An assertion-level 16:9 RED first found the old 1100/460 view. A same-count tick mutation later failed the exact-cadence assertion; after restoration, `pnpm --filter @refview/content exec vitest run src/incident-observation-calibration-v2.test.ts` passed 14/14, and content lint/typecheck passed. Independent read-only review requested `gpt-6-sol` / `high` (runtime-confirmed `unconfirmed`) first returned FIX for missing exact receipt/epoch assertions, then PASS after correction and reran 14/14, lint and typecheck. This remains synthetic geometry/trace evidence. It does not bind an emitted build, prove a human saw the incident, or set `observationCalibrationApproved`.
