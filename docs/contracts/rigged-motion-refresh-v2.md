# Selected-player motion refresh v2

Nicolas requested a review and improvement of the current animations, a visibly running opening, and a better fall. Keep the selected Quaternius models. This request supersedes the previous protection of the attacker's post-contact pose; it does not authorize changing the football interpretation or scoring. Requested planning is Astra xhigh, implementation/review Sol high; effective runtime identities are unconfirmed.

## Diagnosis and scope

The current fall is a continuing Jog loop with fixed additive rotations and pelvis lowering. It never settles into a separate grounded pose. The opening source trajectories are slow and most ease from rest, so faster animation alone would create sliding. Use the existing versioned canonical timeline and shared route adapter. No new assets, provider, physics authority, dependency, publication, or model replacement.

## MOT-REQ-001: Authored one-shot fall

Preserve the exact full selected-player tick-366 contact pose and every defender pose. Replace only attacker actor-002 after contact with an absolutely sampled authored fall: stumble and protective arms through 378, hands/forearms and knee/hip lowering through 398, grounded settling through 420, and a stable final local pose through 480. These staging ticks are design targets; bounded adjustments may improve visual quality without moving contact. Preserve public root position/yaw at each tick and fixed bone segment lengths. Use quaternion key interpolation and local pelvis movement; no history-dependent simulation, continuing jog beneath the final pose, or resetting the contact pose at a later tick.

The immutable entry pose must come from the exact existing tick-366 sampler, independent of prior playback or seek. Own and release any sampler resources; do not recurse through the new fall path. All seven actors still share the production sampler. Old attacker post-366 snapshots must be replaced by behavioral acceptance, not blindly updated hashes.

Tests first: reproduce continuing late-fall movement, then prove stable final local transforms, direct/sequential/reverse/repeated seeks, exact 366, unchanged defender, fixed lengths/finite transforms, bounded adjacent-frame travel/rotation, and grounding measured from actual posed body/boot/hand geometry rather than ankle height alone. Inspect normal-speed and fixed A/B first-/third-person rendered views including contact, bracing, landing and final rest. Numeric bounds alone do not prove a credible fall.

## Ownership and evidence

The fall worker owns `rigged-player/pose/sampler.ts`, its tests, and new `pose/fall.ts`/tests only. Coordinator owns shared contracts, source trajectory coordination, task status and integration. Do not edit model/resources/scene adapters, source, or old diagnostic report artifacts from this slice. Earlier contact calibration reports are historical after pose changes; no automatic contact-witness search is required for this animation pass.

## MOT-REQ-002: Steady authored run and pass

Nicolas's follow-up request for an even run supersedes the short 3.3 m/s prefix boost. The prior boost joined the original smoothstep knots at ticks 120 and 300, causing visible fast-slow-fast motion. Revise the local canonical trajectory itself. Six outfield actors use a constant per-actor velocity through tick 270, then one midpoint-sampled smooth velocity blend over ticks 270..330 into the protected incident trajectory. Preserve the keeper and every actor and ball sample from tick 330 through 480 byte for byte.

At tick 120, shift the complete pass formation and ball 10 m toward negative Z while preserving every actor-relative formation measurement and the 1.5 m onside margin. Keep the ball attached to the passer through tick 120, use deterministic cubic Hermite segments from 120..180 and 180..330, and join the original ball position and velocity at tick 330. The ball must continue forward without an artificial stop and remain within 0.75 m of the receiver during the controlled phase. Preserve pass tick 120, contact tick 366, events, facts, rubric, official sources and scoring authority.

The steady segment must have negligible per-tick speed variance and public Jog weight one for all six outfield actors. The 270..330 transition permits one bounded slowdown; it must not introduce a second restart. Update only authored initial gait phases needed to preserve the established contact-transition phase from tick 338 onward. Keep filters, gait thresholds, distance increments, cycle lengths and protected contact/fall behavior unchanged.

Set the canonical initial referee position to (3,0,4), yaw 0.8 and pitch 0, so the shifted opening is visible with the shared 4.5 m / -1.5 m third-person camera. Any deterministic calibration trace starting there must use a physically plausible sprint path. Browser acceptance covers the normal-speed opening, pass, slowdown, contact and final fall. The source remains local, unpublished, unsaved and unscored; historical rendered reports remain historical.

## MOT-REQ-003: Complete defender transition blending

Integration with the faster source prefix legitimately changes accumulated distance-based gait phase. A regression test exposed a 0.977 rad boot orientation jump at defender tick 346: the old transition blended thigh/calf back to the source gait but unconditionally forced the foot to a fixed reference orientation, even at source weight one. Correct this at the narrow transition boundary, rather than disguising changed distance or resetting gait phase. Capture the pre-IK source foot world orientation and blend it with the authored world orientation using the same source weight as the thigh/calf at entry and exit. Preserve exact tick366, fixed lengths and every established displacement/rotation limit; source-weight-one must restore the complete source leg, including foot orientation. The fall worker may make this additional sampler/test correction after the source handoff. The old mandate to preserve every defender pose applies to the fall-only slice; it does not forbid this explicitly diagnosed transition fix. Independent review must assess this addition separately.

## Visual correction acceptance

The first one-shot candidate failed independent rendered review: its negative pelvis pitch produced a backward seated/rolling pose with raised legs, despite passing ground-minimum tests. Correct the authored joint directions and actual protective landing. Fixed A views must show forward loss of balance, arms reaching to brace, a low torso and head with a plausible hand/forearm support, and resting legs rather than a vertical-leg pose. Add actual-asset hand/forearm and body/leg grounding assertions; global mesh minimum alone is insufficient. Interpolate authored quaternion keys (including multi-axis pelvis rotation), while preserving zero correction at366 and a fixed final local pose420..480. The visual-fix worker owns only fall.ts, fall.test.ts and a new fall-grounding.test.ts. Review after the corrected rendered captures is mandatory.

## MOT-REQ-004: Opaque referee and readable third-person framing

Nicolas's rendered review supersedes the reduced 25%-opaque referee fallback. Use the complete selected rigged model with visible face, hair, body and garment meshes, a lit opaque black referee kit, depth writes and shadows. Do not assign a number. Preserve absolute Idle sampling, canonical root position/yaw, independent resource ownership and hidden visibility in first-person and elevated review.

Both incident routes share a third-person default of 4.5 m distance and -1.5 m lateral offset and restore it on restart. Preserve camera formulas, bounds, FOV, eye height and user adjustments. Browser acceptance must show an opaque readable referee that leaves the play visible; a translucent body overlay or centered two-metre framing is a failure.

## MOT-REQ-005: Distance-driven referee locomotion

Nicolas's request for referee movement comparable to the selected players supersedes MOT-REQ-004's moving-referee Idle sampling. Live referee presentation must use the same verified `Idle_Loop`, `Walk_Loop` and `Jog_Fwd_Loop` clips, the same 1.23582 m walk cycle and 4.90824 m jog cycle, and the same 0.05..0.25 m/s movement and 2..3.2 m/s walk-to-jog thresholds as player locomotion. Sprint advances Jog phase from actual covered distance; no uncalibrated Sprint clip is introduced.

Derive an immutable presentation sample at every canonical integration tick using a causal five-tick triangular speed filter. Accumulate phase only from actual horizontal displacement and weighted cycle distance. Rendering frequency, elapsed wall time and skipped render frames must not affect the result. Pause freezes the pose, restart begins from phase zero, and direct/repeated application of the same sample is identical. Keep this presentation data outside `ViewSample`, observation traces, world state, scoring and authored scenario content.

The canonical referee root retains exact position, camera look yaw, scale and visibility. Because the bundle has no backward or strafe clips, rotate only the selected visual child toward actual displacement through the shortest angular path, capped at 0.2 rad per canonical tick. Stationary turning does not advance gait phase. The authoring preview passes stationary motion samples so playback and A/B review changes remain Idle.

Tests must cover reducer/builder equality, prefix invariance, walking, ordinary running, sprint cadence, stopping, diagonal/backward/lateral direction, pause/restart/camera changes, render-rate independence, absolute/reverse/repeated skeletal sampling, root authority, clip drift removal, resource ownership and player contact/fall regressions. Playwright acceptance must inspect normal-speed idle, W, W+Shift, release, A/D/S, pause/resume, camera toggle and restart with the opaque black referee visible.
## MOT-REQ-003 redesign after two unsuccessful corrections

This supersedes the moving source-world foot-orientation blend proposed above. Read-only actual-asset diagnosis identified two overlapping transition blends: modern gait to legacy Jog (344..356), and source leg to authored IK (346..358). The requested prefix changes the incoming distance phase. A second moving foot-orientation blend adds angular motion; it does not repair the flexion mismatch.

Initialize each actor's phase accumulator once from these authored starting-foot choices: actor-001 0.7150254472560991; actor-002 0.7472138104684658; actor-003 0.29101186349226826; actor-004 0; actor-005 0.5764152763697518; actor-006 0.7272217150136315; actor-007 0.7056730699061904. Preserve every distance-derived increment, cycle length, velocity filter and gait weight. This is an initial pose selection, not a time reset or replacement distance. Both routes and geometry use the same planner. Unknown handles retain the existing zero origin. Do not import a historical source at runtime. The constants restore the baseline phase modulo one from104 onward, while preserving the faster real opening.

Restore the fixed defender start quaternion (0.9586700283415625,-0.022047644142548405,-0.01480374238759661,0.2832781801401118), and the original absolute start-to-contact-to-end foot-orientation curve. Remove the extra moving source-world slerp. At the exact source-weight-one joins346/386 restore the captured source local foot quaternion, so the complete source leg is restored; between joins, the authored absolute curve owns foot orientation. Keep ankle path, IK, roots, legacy blending and exact366 unchanged.

Sol owns locomotion.ts/tests and sampler.ts/tests for this redesign, disjoint from the visual-fall worker's files. Tests must prove constant initial phase, unchanged increments and speed weights, baseline modulo-phase references after104, full source-leg equality at joins, exact peak hashes, all existing rotation/flexion/displacement guards, unchanged geometry toe-travel guard and seek parity. Astra's in-memory experiment measured boot0.225259rad, flexion0.206153rad, knee0.099629m, calf0.212110rad, axial0.157176rad with unchanged366; these are planning evidence, not final-code acceptance. Final rendered review remains required.
