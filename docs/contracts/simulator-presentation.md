# Simulator presentation and diagnostics

This document groups reusable system contracts by domain. Stable contract IDs are preserved in section anchors; implementation and task status remain in [`../specs/tasks.md`](../specs/tasks.md). Feature-specific acceptance remains under `docs/features/`.

## Contents

- [rigged presentation candidate v1](simulator-presentation.md#rigged-presentation-candidate-v1)
- [rigged motion refresh v2](simulator-presentation.md#rigged-motion-refresh-v2)
- [rigged defender continuity v1](simulator-presentation.md#rigged-defender-continuity-v1)
- [rigged calibration pilot v1](simulator-presentation.md#rigged-calibration-pilot-v1)
- [rigged contact axial frame v1](simulator-presentation.md#rigged-contact-axial-frame-v1)
- [rigged contact feature v1](simulator-presentation.md#rigged-contact-feature-v1)
- [rigged contact layer comparison v1](simulator-presentation.md#rigged-contact-layer-comparison-v1)
- [rigged contact pose correction v1](simulator-presentation.md#rigged-contact-pose-correction-v1)
- [rigged contact visual review v1](simulator-presentation.md#rigged-contact-visual-review-v1)
- [rigged diagnostic geometry v1](simulator-presentation.md#rigged-diagnostic-geometry-v1)
- [rigged surface query v1](simulator-presentation.md#rigged-surface-query-v1)

<a id="rigged-presentation-candidate-v1"></a>
## Rigged local presentation candidate v1

This is the shared integration contract for RV-019E after Nicolas selected the existing player audition models. It authorizes an unsaved, unscored local visual candidate, not a reviewed training publication. Authored facts, actor roots, ball tracks, clip transitions and contact tick 366 remain unchanged.

### Resource ownership and integrity

Use the existing Quaternius Standard body, short parted hair and non-root-motion Universal Animation Library under `apps/web/public/assets/player-audition/`. Exact bundled licenses are retained in `docs/features/06-simulator-experience/`. Do not fetch new assets or remote decoders. A fixed versioned manifest records every required glTF, binary buffer, GLB and texture path, byte length and SHA-256. Validate every dependency against this allowlist and verify bytes before decoding; reject undeclared external glTF buffers/images and unsupported compression. Parse verified bytes without a second unverified fetch. Failure is visible and retry starts a fresh attempt, without poisoning a shared promise cache.

The loader returns `{ bodyScene, hairScene, clips, dispose }`. The loading consumer owns these decoded shared resources and disposes them after all actor instances are disposed. The actor factory `createRiggedPlayer({ bodyScene, hairScene, color, number, silhouette, kitStyle })` returns `{ root, bones, dispose }`, with independently cloned skeletons and only instance-owned geometry, material and number textures disposed by the instance. Cached source geometry and image textures must survive one actor's disposal. Disposal is idempotent.

### Absolute pose boundary

Both local routes use the same pose adapter. Inputs are the canonical integer tick and public actor frame (handle, position, yaw, clip handle and phase), plus verified clips and the existing procedural pose/geometry only as authored target data. Preserve actor-root position and yaw exactly. Reset bones to stored bind transforms before every absolute sample; no previous render, mixer delta, wall clock, route or seek order may affect the result. Remove imported root translation from locomotion. Normal locomotion samples the selected UAL clip at absolute time, while authored challenge/fall overlays blend deterministically at their existing transition ticks.

Use fixed-length limb rotations and constrained IK for contact targets; never stretch the skin to the procedural rig's variable segment lengths. Derive candidate attachment diagnostics from final bone transforms. Existing procedural geometry remains historical calibration and cannot be asserted as the new rendered skeleton's evidence. Candidate diagnostics and exact-frame submission are local only and confer no score, reviewed catalog admission or publication permission.

### Public-trajectory locomotion amendment

Precompute a detached, immutable 481-tick locomotion plan from the public actor positions, independently of render history. The plan provides continuous gait phase, Idle/Walk/Jog weights and a protected legacy-pose blend. Use a centered nine-tick triangular speed filter; smooth Idle-to-Walk at 0.05–0.25 m/s and Walk-to-Jog at 2.0–3.2 m/s. Advance the shared gait phase by traveled distance and blended nominal cycle distance; freeze it at rest. Absolute tick time may drive idle breathing. No actor-root movement or yaw is derived from animation.

Versioned local calibration for the existing UAL bytes estimates Walk cycle distance 1.23582 m (duration 1.333333 s) and Jog cycle distance 4.90824 m (duration 0.933333 s). The Astra-xhigh planner measured 240 samples per cycle and median backward ankle velocity within 4 cm of the cycle minimum, restoring the imported skeleton root. These are visual estimates, not football facts or proof of perfect foot planting.

Preserve the prior sampler's exact base/overlay poses for attacker `actor-002` at ticks 350–480 and defender `actor-006` at ticks 356–386. Blend into these windows over the preceding 12 ticks and blend the defender back over 387–398. Record protected bone signatures before editing, assert seek/repeat parity and the existing tick-366 paired-foot gap below 0.03 m after the change. Both routes pass the same per-actor plan into their shared factory. Canonical fixed yaw can still disagree with travel direction; directional animation and final observation calibration remain explicit follow-up work.

### Route integration and acceptance

#### Selected-skeleton referee appearance

Both local routes may use `createRiggedReferee(resources)` from the same selected athletic model, with an explicitly unnumbered dark solid kit (`number: null`). Its independent instance samples Idle at absolute tick/60, removes imported root drift and applies the supplied referee position/look yaw exactly. Every owned material remains transparent at opacity 0.25, depthWrite false and depthTest true; no referee shadow is cast. Hide it in first person and elevated authoring review. Keep all camera reconstruction, eye height and movement inputs unchanged; the camera never follows an animated bone. Instance disposal precedes shared resource disposal. Retain the procedural referee only for the procedural comparison. This appearance slice does not claim moving-referee gait or planted feet; recorded view-dependent locomotion remains separate.

After transparent facial features remained visible through the rear head, Astra-xhigh reduced this slice to a referee-only ghost: hide Eyes/Eyebrows, remove owned texture maps, use neutral dark rough materials and FrontSide while keeping the body kit shader. If a single visual recheck still shows facial or distracting layered detail, render only the selected modified skinned body with an owned untextured neutral MeshBasicMaterial and hide hair/garments/facial meshes. Keep opacity 0.25, depthWrite false, depthTest true and all transforms/cameras unchanged. The reduced fallback is an orientation silhouette, not a detailed referee kit. Do not add depth prepasses or change the seven player materials. Runtime-confirmed planning identity remains `unconfirmed`.

The rigged candidate becomes the default appearance of both `incident-preview` and `incident-playtest`. Both retain the shared field, cameras, canonical timeline and existing immersive lifecycle. Preserve a clearly labeled procedural comparison in authoring if needed for review. Loading prevents an invisible active run; failure/retry is localized, and unmount releases all owned resources. The new candidate is explicitly awaiting visual calibration in the local-preview status.

Tests must establish actual-asset independence, absolute seek/repeat parity, fixed limb lengths, authoritative root/ball preservation, route adapter parity, missing/tampered dependency rejection and cleanup. Browser acceptance includes front/match inspection, A/B first/third person at ticks 360/366/371/386, elevated pass, normal-speed motion, start/pause/resume/restart, retry, English and mobile fallback. Record current performance and independent read-only review. Remaining foot-contact or calibration defects keep RFP-REQ-002/004/007 open; do not represent a skin swap as completion of those requirements.

<a id="rigged-motion-refresh-v2"></a>
## Selected-player motion refresh v2

Nicolas requested a review and improvement of the current animations, a visibly running opening, and a better fall. Keep the selected Quaternius models. This request supersedes the previous protection of the attacker's post-contact pose; it does not authorize changing the football interpretation or scoring. Requested planning is Astra xhigh, implementation/review Sol high; effective runtime identities are unconfirmed.

### Diagnosis and scope

The current fall is a continuing Jog loop with fixed additive rotations and pelvis lowering. It never settles into a separate grounded pose. The opening source trajectories are slow and most ease from rest, so faster animation alone would create sliding. Use the existing versioned canonical timeline and shared route adapter. No new assets, provider, physics authority, dependency, publication, or model replacement.

### MOT-REQ-001: Authored one-shot fall

Preserve the exact full selected-player tick-366 contact pose and every defender pose. Replace only attacker actor-002 after contact with an absolutely sampled authored fall: stumble and protective arms through 378, hands/forearms and knee/hip lowering through 398, grounded settling through 420, and a stable final local pose through 480. These staging ticks are design targets; bounded adjustments may improve visual quality without moving contact. Preserve public root position/yaw at each tick and fixed bone segment lengths. Use quaternion key interpolation and local pelvis movement; no history-dependent simulation, continuing jog beneath the final pose, or resetting the contact pose at a later tick.

The immutable entry pose must come from the exact existing tick-366 sampler, independent of prior playback or seek. Own and release any sampler resources; do not recurse through the new fall path. All seven actors still share the production sampler. Old attacker post-366 snapshots must be replaced by behavioral acceptance, not blindly updated hashes.

Tests first: reproduce continuing late-fall movement, then prove stable final local transforms, direct/sequential/reverse/repeated seeks, exact 366, unchanged defender, fixed lengths/finite transforms, bounded adjacent-frame travel/rotation, and grounding measured from actual posed body/boot/hand geometry rather than ankle height alone. Inspect normal-speed and fixed A/B first-/third-person rendered views including contact, bracing, landing and final rest. Numeric bounds alone do not prove a credible fall.

### Ownership and evidence

The fall worker owns `rigged-player/pose/sampler.ts`, its tests, and new `pose/fall.ts`/tests only. Coordinator owns shared contracts, source trajectory coordination, task status and integration. Do not edit model/resources/scene adapters, source, or old diagnostic report artifacts from this slice. Earlier contact calibration reports are historical after pose changes; no automatic contact-witness search is required for this animation pass.

### MOT-REQ-002: Steady authored run and pass

Nicolas's follow-up request for an even run supersedes the short 3.3 m/s prefix boost. The prior boost joined the original smoothstep knots at ticks 120 and 300, causing visible fast-slow-fast motion. Revise the local canonical trajectory itself. Six outfield actors use a constant per-actor velocity through tick 270, then one midpoint-sampled smooth velocity blend over ticks 270..330 into the protected incident trajectory. Preserve the keeper and every actor and ball sample from tick 330 through 480 byte for byte.

At tick 120, shift the complete pass formation and ball 10 m toward negative Z while preserving every actor-relative formation measurement and the 1.5 m onside margin. Keep the ball attached to the passer through tick 120, use deterministic cubic Hermite segments from 120..180 and 180..330, and join the original ball position and velocity at tick 330. The ball must continue forward without an artificial stop and remain within 0.75 m of the receiver during the controlled phase. Preserve pass tick 120, contact tick 366, events, facts, rubric, official sources and scoring authority.

The steady segment must have negligible per-tick speed variance and public Jog weight one for all six outfield actors. The 270..330 transition permits one bounded slowdown; it must not introduce a second restart. Update only authored initial gait phases needed to preserve the established contact-transition phase from tick 338 onward. Keep filters, gait thresholds, distance increments, cycle lengths and protected contact/fall behavior unchanged.

Set the canonical initial referee position to (3,0,4), yaw 0.8 and pitch 0, so the shifted opening is visible with the shared 4.5 m / -1.5 m third-person camera. Any deterministic calibration trace starting there must use a physically plausible sprint path. Browser acceptance covers the normal-speed opening, pass, slowdown, contact and final fall. The source remains local, unpublished, unsaved and unscored; historical rendered reports remain historical.

### MOT-REQ-003: Complete defender transition blending

Integration with the faster source prefix legitimately changes accumulated distance-based gait phase. A regression test exposed a 0.977 rad boot orientation jump at defender tick 346: the old transition blended thigh/calf back to the source gait but unconditionally forced the foot to a fixed reference orientation, even at source weight one. Correct this at the narrow transition boundary, rather than disguising changed distance or resetting gait phase. Capture the pre-IK source foot world orientation and blend it with the authored world orientation using the same source weight as the thigh/calf at entry and exit. Preserve exact tick366, fixed lengths and every established displacement/rotation limit; source-weight-one must restore the complete source leg, including foot orientation. The fall worker may make this additional sampler/test correction after the source handoff. The old mandate to preserve every defender pose applies to the fall-only slice; it does not forbid this explicitly diagnosed transition fix. Independent review must assess this addition separately.

### Visual correction acceptance

The first one-shot candidate failed independent rendered review: its negative pelvis pitch produced a backward seated/rolling pose with raised legs, despite passing ground-minimum tests. Correct the authored joint directions and actual protective landing. Fixed A views must show forward loss of balance, arms reaching to brace, a low torso and head with a plausible hand/forearm support, and resting legs rather than a vertical-leg pose. Add actual-asset hand/forearm and body/leg grounding assertions; global mesh minimum alone is insufficient. Interpolate authored quaternion keys (including multi-axis pelvis rotation), while preserving zero correction at366 and a fixed final local pose420..480. The visual-fix worker owns only fall.ts, fall.test.ts and a new fall-grounding.test.ts. Review after the corrected rendered captures is mandatory.

### MOT-REQ-004: Opaque referee and readable third-person framing

Nicolas's rendered review supersedes the reduced 25%-opaque referee fallback. Use the complete selected rigged model with visible face, hair, body and garment meshes, a lit opaque black referee kit, depth writes and shadows. Do not assign a number. Preserve absolute Idle sampling, canonical root position/yaw, independent resource ownership and hidden visibility in first-person and elevated review.

Both incident routes share a third-person default of 4.5 m distance and -1.5 m lateral offset and restore it on restart. Preserve camera formulas, bounds, FOV, eye height and user adjustments. Browser acceptance must show an opaque readable referee that leaves the play visible; a translucent body overlay or centered two-metre framing is a failure.

### MOT-REQ-005: Distance-driven referee locomotion

Nicolas's request for referee movement comparable to the selected players supersedes MOT-REQ-004's moving-referee Idle sampling. Live referee presentation must use the same verified `Idle_Loop`, `Walk_Loop` and `Jog_Fwd_Loop` clips, the same 1.23582 m walk cycle and 4.90824 m jog cycle, and the same 0.05..0.25 m/s movement and 2..3.2 m/s walk-to-jog thresholds as player locomotion. Sprint advances Jog phase from actual covered distance; no uncalibrated Sprint clip is introduced.

Derive an immutable presentation sample at every canonical integration tick using a causal five-tick triangular speed filter. Accumulate phase only from actual horizontal displacement and weighted cycle distance. Rendering frequency, elapsed wall time and skipped render frames must not affect the result. Pause freezes the pose, restart begins from phase zero, and direct/repeated application of the same sample is identical. Keep this presentation data outside `ViewSample`, observation traces, world state, scoring and authored scenario content.

The canonical referee root retains exact position, camera look yaw, scale and visibility. Because the bundle has no backward or strafe clips, rotate only the selected visual child toward actual displacement through the shortest angular path, capped at 0.2 rad per canonical tick. Stationary turning does not advance gait phase. The authoring preview passes stationary motion samples so playback and A/B review changes remain Idle.

Tests must cover reducer/builder equality, prefix invariance, walking, ordinary running, sprint cadence, stopping, diagonal/backward/lateral direction, pause/restart/camera changes, render-rate independence, absolute/reverse/repeated skeletal sampling, root authority, clip drift removal, resource ownership and player contact/fall regressions. Playwright acceptance must inspect normal-speed idle, W, W+Shift, release, A/D/S, pause/resume, camera toggle and restart with the opaque black referee visible.
### MOT-REQ-003 redesign after two unsuccessful corrections

This supersedes the moving source-world foot-orientation blend proposed above. Read-only actual-asset diagnosis identified two overlapping transition blends: modern gait to legacy Jog (344..356), and source leg to authored IK (346..358). The requested prefix changes the incoming distance phase. A second moving foot-orientation blend adds angular motion; it does not repair the flexion mismatch.

Initialize each actor's phase accumulator once from these authored starting-foot choices: actor-001 0.7150254472560991; actor-002 0.7472138104684658; actor-003 0.29101186349226826; actor-004 0; actor-005 0.5764152763697518; actor-006 0.7272217150136315; actor-007 0.7056730699061904. Preserve every distance-derived increment, cycle length, velocity filter and gait weight. This is an initial pose selection, not a time reset or replacement distance. Both routes and geometry use the same planner. Unknown handles retain the existing zero origin. Do not import a historical source at runtime. The constants restore the baseline phase modulo one from104 onward, while preserving the faster real opening.

Restore the fixed defender start quaternion (0.9586700283415625,-0.022047644142548405,-0.01480374238759661,0.2832781801401118), and the original absolute start-to-contact-to-end foot-orientation curve. Remove the extra moving source-world slerp. At the exact source-weight-one joins346/386 restore the captured source local foot quaternion, so the complete source leg is restored; between joins, the authored absolute curve owns foot orientation. Keep ankle path, IK, roots, legacy blending and exact366 unchanged.

Sol owns locomotion.ts/tests and sampler.ts/tests for this redesign, disjoint from the visual-fall worker's files. Tests must prove constant initial phase, unchanged increments and speed weights, baseline modulo-phase references after104, full source-leg equality at joins, exact peak hashes, all existing rotation/flexion/displacement guards, unchanged geometry toe-travel guard and seek parity. Astra's in-memory experiment measured boot0.225259rad, flexion0.206153rad, knee0.099629m, calf0.212110rad, axial0.157176rad with unchanged366; these are planning evidence, not final-code acceptance. Final rendered review remains required.

<a id="rigged-defender-continuity-v1"></a>
## Defender leg continuity candidate v1

This bounded continuation of RFP-REQ-002 follows the reviewed diagnostic geometry slice. Planning requested `gpt-6-astra` / `xhigh`; runtime-confirmed identity is `unconfirmed`. The existing selected-player integration passed 369 tests, root lint/typecheck and scoped independent review before this new pose candidate.

### Observed defect and scope

The stable defender left boot-toe surface vertex moves 0.466 m from tick 358 to 359. The current moving target changes about 0.25 m, while unconstrained CCD moves the ankle about 0.28 m and rotates the foot roughly 56 degrees. Legacy locomotion protection is fully active, so changing gait blends cannot correct this defect.

Only defender left-leg presentation changes. Preserve attacker poses and the defender support leg initially. Actor roots/yaw, ball, authored facts, clip transitions and contact tick 366 remain exact. This intentionally replaces the defender's previous protected visual pose; historical defender pose hashes must not be represented as preserved approval. The previous attacker protected window remains unchanged.

### Bounded implementation

Own `pose/two-bone-ik.ts` and tests, `pose/sampler.ts` and tests, and affected assertions in `evidence/geometry.test.ts`. Do not change model resources, referee, canonical sources, routes, observation scoring or persistence.

Use analytic two-bone solving with a fixed actor-local knee pole and deterministic pole-degeneracy fallback. Clamp reach between absolute segment-length difference plus epsilon and sum minus epsilon. Rotate joints only: preserve sampled segment lengths, translations and scale. Derive lengths from the imported animation reference, not guessed bind dimensions. Resolve foot orientation separately from arbitrary CCD rotation.

Replace the frame-varying animated-foot-to-contact lerp with an absolute-tick curve from fixed root-local reference poses. Prepare from approximately tick 346, reach the existing world ankle target at tick 366 and recover by tick 386. Blend entry/exit positions and orientations continuously into the existing animation. Keep the current peak boot orientation as the initial orientation target. The ankle target is not a reviewed boot-surface contact attachment.

### Required evidence

1. Reproduce the 0.466 m surface-vertex step in a RED test before editing.
2. Require defender boot-toe step at most 0.20 m per tick throughout 344–388, including entry and recovery. Inspect knee-plane/orientation continuity, not only ankle distance.
3. Preserve sampled segment lengths within 1e-5 m, exact canonical actor transforms, all non-defender pose assertions and unchanged football source hashes.
4. Keep tick-366 ankle residual at most 0.03 m and compare actual boot surfaces/visual contact. Numeric ankle agreement alone is insufficient.
5. Prove direct, sequential, reverse and repeated sampling parity without render history.
6. Run all 54 current evidence-window ticks plus expanded continuity diagnostics. Inspect fresh Playwright CLI captures at 350, 356, 358, 359, 360, 366, 374 and 386 and normal-speed motion. Run scoped/full relevant gates and independent read-only review after final edits.

If continuity and contact cannot both pass, revise the target curve instead of changing canonical facts or weakening the acceptance bound. Training calibration remains separate.

### Recovery orientation correction

The first correction passed the toe bound, but independent review exposed rapid calf rotation. Astra-xhigh measured no knee-plane reversal (consecutive normal dot at least 0.99827 over 368–372). At tick 368 the calf world orientation changes 0.9436 rad while its segment axis changes only 0.0532 rad; the residual axial twist is 0.9422 rad. The shortest-swing solver preserves unwanted source-animation roll. Requested reach then crosses the approximately 0.830 m segment sum at 371, causing abrupt extension. This is not accepted as complete motion quality.

Keep the same exclusive paths, nominal ankle trajectory, pelvis, support leg and protected attacker. Orient thigh and calf using complete orthonormal frames: segment direction plus a stable knee-plane normal, mapped from fixed bone-local reference frames. Freeze the current tick-366 reference pose rather than reading any prior render. Measured local axes are both `[0, 1, 0]`; local plane normals are thigh `[-0.9991588786338783, 0, -0.04100637755801442]` and calf `[-0.9833050993880055, 0, -0.18196440503846162]`. Normalize/orthogonalize and verify provenance against the frozen peak pose.

Soften reach before full extension. Initial candidate: `softStart = upper + lower - 0.07`, `softCap = upper + lower - 0.01`; below softStart retain the ordinary clamped distance, above it use `softStart + (softCap - softStart) * (1 - exp(-(distance - softStart) / (softCap - softStart)))`. Apply to requested distance before maximum clamping. Peak reach 0.72354 m is below softStart and must stay unchanged. Handle smaller fixture segments without invalid reach intervals.

Write a RED regression for the measured world/axial rotation before editing. Across every consecutive step 344–388 require calf world rotation at most 0.35 rad, axial twist residual after minimum axis transport at most 0.20 rad, anatomical flexion change at most 0.25 rad, knee world displacement at most 0.10 m, boot world rotation at most 0.25 rad, and the existing toe displacement at most 0.20 m. These are candidate-specific guards, not universal anatomical thresholds. Preserve complete left-leg peak pose and posed surfaces at 366 within 1e-5, contact residual at most 0.03 m, segment lengths and deterministic seek parity. Capture the pre-correction peak signature before editing.

Inspect entry 345–346 and recovery 376–386. Any blend must use absolute ticks and stable references, never previous-frame smoothing. Run focused tests and final visual review after the edit. If these guards cannot converge in this correction, report the failing measure and redesign the trajectory instead of weakening the bounds or expanding into canonical motion.

The measured correction RED also exposed a 0.41677 rad flexion change at tick 356. The coordinator permits retuning only the absolute left-ankle presentation curve at entry/recovery if full-frame orientation and soft reach alone cannot satisfy these guards. Preserve the frozen tick-366 pose/surface, actor roots, pelvis, right support leg and canonical facts; document the changed curve explicitly. This supersedes the preference above to retain the nominal ankle curve, without permitting history-dependent damping or relaxed bounds.

<a id="rigged-calibration-pilot-v1"></a>
## Local rigged calibration pilot v1

This RFP-REQ-004 continuation uses the independently reviewed posed geometry and surface-query kernel after the corrected left-leg pose is frozen. Planning requested Astra xhigh; runtime identity is unconfirmed. Own only `rigged-player/evidence/calibration.ts` and its tests. Do not change pose, geometry/query modules, canonical sources, resolver, routes, scoring, persistence or publication.

### API and diagnostic authority

Export `seedRiggedContactBindings({ geometrySampler, compiledSource, rendererInputFingerprint })` and `runRiggedCalibrationPilot({ geometrySampler, compiledSource, rendererInputFingerprint, bindings })`, both async. Use the actual compiler return shape and a narrow borrowed sampler interface derived from `createCandidateGeometrySampler`. Never dispose that borrowed sampler. Outputs must be deeply immutable detached plain data with purpose `local-rigged-calibration-candidate`, never Three objects or dense surface snapshots. No scores, rubric bands, admission receipts or EvidenceBundleV1. Caller fingerprint is local input metadata, never running-build attestation.

Frozen return wrappers: seed returns `{ bindings, metrics: { seedPairProductCount, elapsedMs } }`; pilot returns `{ report, metrics: { triangleCount, rayCount, elapsedMs } }`. Timings stay outside deterministic bindings/report. Sampler type is a Pick of its factory result containing `identity` and `sample`. Rows sort by tick, then contact/area evidence, A/B preset, first/third camera mode. The coordinator-owned local report adapter may be delegated as a separate exclusive slice once this API is frozen; it may not alter the pilot or query kernel.

Resolve actor handles using compiled canonical-to-public mapping. Validate source/sampler hash agreement, required geometry policies and exactly the supported authored observation structure; reject unsupported camera colliders/configuration instead of silently approximating them. Do not treat labels as authenticated provenance.

### Fixed candidate bindings

At authored contact tick 366, select all defender leftBoot region triangles against all attacker leftBoot/leftShin triangles, deduplicating mesh/triangle IDs. Run `nearestSurfacePair` once per seed operation, without selecting a result based on desired A/B visibility. Freeze actor/mesh/triangle IDs, declared triangle vertex IDs and barycentric weights for both witnesses. Record seed separation and each seed's distance to the authored contact point; zero distance may indicate penetration, not correct football contact. At every later tick evaluate those same witnesses, never reselect the nearest pair.

Bind to canonical content hash, resource digest, detached actor timeline hash, geometry identity, renderer input fingerprint, stable topology hash and posed-surface hashes of both actors at 366. Recompute and compare these at pilot start: changed geometry behind unchanged labels must fail. Validate barycentrics/IDs and topology when evaluating witnesses. Deterministic hashes use fixed numeric/key ordering; exclude runtime timing. Ground/line area anchors remain the exact canonical ground root and bound field point, not boot witnesses.

### Views and rows

Derive and validate EV-TRIP-CONTACT 364–371 (8 ticks) and EV-INSIDE-AREA 360–374 (15 ticks) from the source. Produce exactly 92 rows: 23 evidence/tick pairs × A/B × first/third person. Use only 15 distinct tick snapshots, all seven actors at each tick. The three remaining evidence items are explicitly uncalibrated; this pilot does not replace the separate 54-tick geometry coverage.

Use existing `reconstructViewpoints`, testing parity with production `cameraPose`: A referee ground `(6,0,32)`, B `(12,0,26.5)`, yaw toward authored `(13.8,36.8)`, pitch `atan2(0.8-1.7,horizontalDistance)`, camera distance 2 m/lateral 0, vertical FOV 50 degrees, aspect 16:9, near 1.1 m/far 160 m. Record eye/camera bases and view/projection matrices. Reject version/configuration drift.

For each anchor independently report distance/angles, C1 geometric gates (front, 30 m, FOV and central ±30 horizontal/±25 vertical degrees), camera depth gate, raw eye-to-anchor and camera-to-anchor triangle hits, and a camera-near-clipped hit starting where that ray crosses the near plane. Skip clipped rays whose target is behind/before the near plane. Use the kernel's 1 mm endpoint policy unchanged. Name all these diagnostics explicitly; a raw clear ray is not readability. Candidate availability requires every relevant gate plus no hit (eye uses eye ray, camera uses near-clipped ray). Row classification joint/cameraOnly/eyeOnly/neither requires all anchors at that same tick/view; never combine across frames/cameras. These are candidate geometric classifications, not training bands.

All player surfaces participate as double-sided geometry, including target owners. Do not automatically ignore the attachment's actor. Exclude the translucent referee from this declared policy. Alpha, material culling, illumination and human perception are not simulated; do not claim renderer parity.

### Cost and verification

Retain only one dense tick at a time. Prepare conservative per-mesh bounds and triangle selections once per tick; bounds may discard ray candidates only, never stand in for a hit. Reuse identical rays. Preserve exact results relative to unfiltered queries. Record triangle counts, seed pair-product count, ray counts and elapsed time separately from deterministic report content. Do not silently reduce regions or triangles to meet a budget. Nearest-pair runs only at seeding; if actual cost is excessive, request a separate measured optimization, without changing the reviewed kernel inside this assignment.

TDD: frozen seeds despite a new nearer pair; identity/topology/peak-pose mismatch rejection; transformed barycentrics with nonzero yaw; self-occlusion; leg gap; free ray outside FOV; near-plane clipping and target rejection; camera parity; exact 92-row coverage and row ordering; direct/reverse input order producing identical normalized content; conservative filtering equivalent to full surfaces; immutable inputs/output. Actual-resource assertions must not force A=joint or B=neither. Run focused tests, typecheck, scoped lint and independent review. The coordinator owns any subsequent actual-resource runner and durable report artifacts.

<a id="rigged-contact-axial-frame-v1"></a>
## Defender axial-frame diagnostic v1

RV-019E's trial defender target `(-0.55, 0.34, 1.044)` passed the tick-366 contact certificate and exterior-witness gate but remains rejected. The complete 344..388 continuity audit found tick-367 calf world rotation 0.8425559003 rad and residual axial twist 0.8423683079 rad, against 0.35/0.20 rad limits. The best bounded entry Hermite fit also missed the knee limit: 0.1003192618 m against 0.10 m. No pose or training attachment is approved by this diagnostic.

### Authority and diagnostic scope

Preserve canonical actor roots/yaw, ball, attacker, referee, contact tick, event order, facts, scoring, camera defaults, material/resources and protected source behavior. The production sampler's old target and output must remain unchanged unless a separately reviewed correction passes all guards. Work only with defender actor-006 left-leg presentation in ticks 344..388. The reviewed player resources and timeline must be identified by hashes in the diagnostic report.

Reconstruct the exact trial peak and archived Hermite candidate using a permanent, opt-in actual-rig diagnostic so a reviewer can replay the measurements. Record hip, knee, ankle, thigh/calf segment axes, bend-plane normal, projected pole, world quaternions and signed local axial-frame offsets at each tick 364..368. Compare (a) the historical peak-only omission of `localPlaneNormals`, (b) old fixed normals on every tick, and (c) normals derived from the trial peak world frames. At the peak, derive each bone-local normal by transforming the measured world bend-plane normal through that bone's inverse world quaternion; verify local +Y segment alignment and reconstruction of the historical trial peak within fixed numerical tolerances. Report whether changing only the frame selection leaves solved joints and explicit boot world orientation unchanged. A failure or inconclusive result must remain labelled as such.

Do not optimize the entry curve or add runtime interpolation in this diagnostic slice. Before any bridge implementation, require an independently reviewed report reproducing the RED tick-367 rotation/twist and tick-361 knee measurements. If frame mismatch is confirmed, a later narrowly scoped bridge may interpolate signed axial rotations around local +Y between the old reference at tick 358, peak-compatible reference at 366, and old reference at 376 with zero endpoint derivatives. Preserve exact trial peak and samples outside support. This would relax only defender-left-leg axial orientation inside the support, not joint positions, boot orientation, solver, soft reach, pole or any incident authority.

Any later candidate must meet all reviewed 344..388 continuity bounds, actual rendered boot-toe displacement, direct/sequential/reverse parity, exact peak, 346..386 four-part clearance, a peak exterior witness and fresh unmarked/marked visual review. Recovery-only success is not pose acceptance while the entry knee is still RED. Stop rather than broaden the scope if consistent frames move protected joints or fail to reproduce the contact-passing peak.

<a id="rigged-contact-feature-v1"></a>
## Rigged contact surface feature v1 (diagnostic only)

RV-019E needs a football-meaningful exterior contact candidate before observation calibration can be repeated. The current tick-366 nearest pair is not such a candidate: both left ankle joints are intentionally coincident, and the selected zero-distance body triangles may be buried beneath the boot shell. This contract changes no authored fact, answer key, camera, or training attachment.

At fixed tick 350, take the world-space vector from defender left ankle to attacker left ankle. Reject a non-finite or degenerate vector. At tick 366, use that fixed axis for two outside-in probes. For the defender, start beyond every owner vertex on the attacker-facing side and cast toward its left ankle. For the attacker, start beyond every owner vertex on the defender-facing side and cast toward its left ankle. The start margin is explicit and must exceed the segment endpoint exclusion. Query every mesh and triangle of the respective owner, including body and garment shells. Keep the first hit; do not skip an intervening surface to reach a desired anatomical region. The defender hit must be on `AuditionBoots` in `leftBoot`; the attacker hit must be in `leftBoot` or `leftShin`. Missing, blocked, wrong-region, or ambiguous hits are reported as diagnostic failures.

Freeze actor, mesh, triangle, vertex IDs, and barycentric coordinates for each accepted hit. Follow those same surface points through ticks 364–371; never reselect by proximity or camera visibility. Record world coordinates, Euclidean separation, signed separation on the fixed axis, first-entry metadata, topology/pose identity, and failure reasons. A negative signed separation means the patches have reversed order on this axis; it is not a certified penetration depth. Exteriority is established only along the declared probe direction.

The first implementation batch is a pure candidate selector and tests. An actual-resource detached report and paired marked/unmarked visual review are separate gates before adopting an attachment. Preserve the original calibration reports as historical evidence; the leaner selected silhouette changed posed-surface hashes. Review must establish that the chosen patches represent the intended careless trip, do not substantially interpenetrate, and remain legible without markers in A/B perspectives at actual camera defaults. Failure is evidence to repair the pose or contact feature, not a reason to adjust the answer key or hide an occluder.

<a id="rigged-contact-layer-comparison-v1"></a>
## Contact layer diagnostic comparison v1

This follows the reviewed 92-row pilot and does not adopt a training attachment. Astra xhigh planning is requested; runtime identity is unconfirmed. The v1 nearest pair selected defender `SuperHero_Male` triangle 1490, whose vertex IDs `[1329,799,861]` also define raised `AuditionBoots` triangle 34. At 366, A's rays hit defender boot triangle 207 approximately 0.02228 m before that point. B is screened by actor-005 shorts. These facts motivate a camera-independent layer comparison, not forced A/B results.

### Exclusive scope

Add only `rigged-player/evidence/contact-layer-comparison.ts` and `.test.ts`. Leave the v1 seeder, pilot, query kernel, geometry/model/pose, report adapter, source, routes and scoring unchanged. Tests may write only new comparison artifacts under `artifacts/rigged-calibration-layers`; retain every historical file under `artifacts/rigged-calibration` unchanged. No external assets or dependencies.

Export async `compareRiggedContactLayers({ geometrySampler, compiledSource, rendererInputFingerprint, historicalBaselineHashes })`, using the pilot's borrowed sampler/compiler types. Return deeply immutable detached `{ comparison, metrics }`. Purpose is `local-rigged-contact-layer-comparison`. Timing stays outside deterministic comparison data. Caller historical hashes are labelled historical metadata, not attestation.

### Layer correspondence and selection

Use the same anatomical regions and tick-366 source mappings as v1: defender leftBoot versus attacker leftBoot/leftShin. On the known selected model, prove body-to-boot correspondence by equal sets of the three vertex IDs, preserving the permutation between declared triangle vertex orders. Require one unambiguous matching body/shell pair. Reject duplicate/ambiguous matching triangles rather than silently selecting one. Mesh identity must explicitly distinguish `SuperHero_Male` and `AuditionBoots`; no whole-body bounds or camera inputs participate in this choice.

For the baseline seed's body triangle, report its shell counterpart, the same physical barycentric point mapped through that permutation, posed separation and world positions. Do not assume bind-space 0.013 m is the current posed distance. A fixture with reordered winding must prove the mapping, and a duplicate shell fixture must fail.

Create the alternate nearest-pair selection from the same region triangles, excluding only body triangles with demonstrated boot-shell counterparts. Keep boot shells and remaining unmatched skin; explicitly call the latter unmatched skin, not proven globally exterior skin. Never remove any actor/mesh from occlusion. Freeze the new nearest pair at 366 independent of A/B results. If the pair remains intersecting or hidden, report that result; do not search for a more favorable witness.

### Comparable reports

Regenerate v1 bindings/report under the current renderer fingerprint, then run the same pilot with alternate fixed bindings. All source/resource/timeline/topology/peak hashes and kernel policies remain equal; only contact witness IDs/barycentrics/separation/canonical-ground distances differ. Preserve v1 seeder output. The comparison contains both binding sets/reports, correspondence details, selected/excluded triangle counts and per-row differences (positions, separation, first blockers and classification). Verify all 60 area rows are identical and all 32 contact rows are present; no expected visibility classification is prescribed.

The diagnostic does not certify exteriority, watertight volume or penetration depth. A zero nearest distance can be an intersection. Adoption still requires choosing the observable feature that contact evidence represents and reviewing it in fixed and moving rendered views.

### Verification and artifacts

TDD fixtures: buried body point versus raised shell; exact correspondence and barycentric permutation; ambiguity rejection; selection independent of cameras; all original self-occluders retained; unchanged area rows; alternate pair frozen across ticks; deterministic reversed input ordering; immutable borrowed inputs/output and no sampler disposal.

Use an opt-in actual-resource integration test after the module is frozen (`REFVIEW_RIGGED_LAYER_INTEGRATION=1`). Reuse verified resource/source helpers from the report adapter without modifying it; geometry-only GLTF parsing may follow the existing geometry test. Verify all 14 source hashes and canonical hashes before/after. Compute renderer fingerprint before/after the complete comparison and write no accepted output if it drifts. Hash the existing historical baseline artifacts before/after and require them unchanged. Write comparison JSON and separate metrics only into `artifacts/rigged-calibration-layers`, with confined output and no following destination links. Record triangle counts, seed/pilot cost and actual outcomes without timing assertions.

Focused Vitest, typecheck, scoped lint and independent read-only review are required. The coordinator owns tracker/docs/integration. If this layer-only comparison does not yield a suitable witness, keep it as diagnostic evidence and identify the next acceptance decision rather than changing football facts or hiding blockers.

<a id="rigged-contact-pose-correction-v1"></a>
## Defender contact pose correction v1 (local candidate)

RV-019E's marked and clean lateral review at ticks 364, 366, 370 and 371 found the defender's left boot visibly merged with the attacker's lower leg/boot. The old left-ankle target places both ankle landmarks about 0.000082 m apart at tick 366. The selected historical exterior patches are 0.16366095 m apart and their signed order is reversed, but that signed distance is not a penetration depth. The historical first-hit report and captures remain diagnostic history, not an accepted attachment.

### Scope and authority

Change only the defender (`actor-006`) left-leg presentation in the existing 346–386 challenge envelope. A new absolute-tick ankle target and boot orientation are allowed. This explicitly supersedes the previous frozen defender tick-366 peak pose, surface hash, and shared-ankle residual guard in `simulator-presentation.md#rigged-defender-continuity-v1`; it does not supersede its continuity requirements. Preserve the attacker and all other actor poses, the defender pelvis, right support leg and upper body, canonical actor roots and yaw, ball track, contact tick, event order, facts, scoring, resources, materials, camera defaults and occluders. Outside the envelope, preserve the old pose exactly.

Keep analytic two-bone IK with fixed references and deterministic absolute-tick interpolation. Do not use prior render state or translate the boot mesh independently of its skeleton. A trial retreat of the defender target by about 0.164 m opposite the fixed approach axis at tick 366 may guide exploration; it is neither an acceptance target nor a penetration estimate. The actual objective is an intact exterior boot-to-lower-leg meeting.

### Entry-curve redesign after peak trial

A trial defender local ankle target `(-0.55, 0.34, 1.044)` passed the tick-366 four-part certificate with a minimum +0.0042359504 m gap and passed the exterior-witness gate after deterministic interior probes. The initial entry-only continuity review found a knee-step failure: 0.1075477244 m at tick 361 versus 0.10 m; manual scalar-lag tuning reached 0.1050958521 m but did not converge. A later complete 344..388 audit of this same trial peak found additional recovery failures at tick 367: calf world rotation 0.8425559003 rad versus 0.35 and axial twist 0.8423683079 rad versus 0.20. The earlier claim that the peak trial failed only the knee bound was incomplete. That trial was reverted and cannot be accepted without a separately scoped recovery correction. Preserve the exact trial peak pose/orientation in historical comparisons; do not treat the reverted old pose as a contact candidate.

Before another pose edit, measure actual solved hip/knee/ankle positions, requested/effective reach, bend height and pole direction around ticks 356–365. Estimate central-difference knee response to ±0.001 m perturbations of each actor-local target coordinate at ticks 358–363. This distinguishes target-curve conditioning from a solver or pole defect.

Retain the accepted peak target and the existing two-bone solver. Fit a compact-support **actor-local vector** correction to the entry target only, with `u = clamp((tick - 352)/14, 0, 1)`, `s = 2u - 1`, and `correction = 16u²(1-u)² × (c0 + c1 s + c2 s²)`, where each coefficient is a three-component constant. Correction and first derivative vanish at ticks 352 and 366; all recovery samples and the accepted peak remain exact. Limit the correction magnitude to 0.06 m throughout the support. Fit offline against solved world-knee positions using a fixed iteration budget and regularization for small correction and target acceleration. Evaluate all integer ticks 344–388 and keep the other continuity limits as hard constraints. Aim for knee movement at most 0.095 m to leave margin; the required gate remains 0.10 m. Runtime contains only final fixed coefficients and the absolute-tick formula, never the optimizer or render-history smoothing.

Write a RED regression for the exact trial candidate (approximately 0.107548 m at tick 361), then prove knee movement at most 0.10 m, all other reviewed movement bounds, exact peak and recovery, unchanged poses through 352, segment lengths, canonical transforms, attacker/pelvis/support leg, and direct/sequential/reverse sampling parity. If fitting cannot satisfy all guards within 0.06 m, report Jacobian conditioning and best admissible failure; a separate pole/plane redesign then needs a new contract. Do not change the solver, soft-reach constants, pole, protected actors or acceptance bounds in this slice.

The first fixed-budget fit did not converge: best knee step 0.102554773 m, and the archived detailed joint rows belong to the unfitted 0.107547723 m baseline. A pole-angle correction is **not authorized** from those baseline rows. Reconstruct the exact best-fit candidate and export its own solved joints, target, reach, pole and all continuity maxima; recomputed knee steps must match the archived scalar maximum. Measure actual ±0.001 rad projected-pole sensitivity at ticks 360–361 and compare with the analytic two-bone derivative. If bounded angular changes plausibly close the remaining gap without moving failure to neighboring ticks, a separate small angular-fit contract may be written. If sensitivity remains weak, redesign the ankle correction as a fixed-knot C¹ timing curve within the same 0.06 m budget and unchanged protected geometry. Neither route may be implemented solely from the unfitted baseline measurements.

### Required proof

#### Final bounded entry-curve experiment

The reconstructed polynomial fit reproduces a 0.102554773 m knee step at tick 361. A bounded projected-pole trial reaches only 0.101564697 m, so this experiment keeps the pole and solver unchanged. Replace the polynomial correction with a piecewise cubic Hermite actor-local correction at fixed knots 352, 356, 358, 360, 362, 364 and 366. Each knot has a value and derivative in metres per tick. Both are zero at the first and last knot. Interior values and derivatives are fitted offline; shared derivatives make the correction C1. The base entry curve and exact accepted peak `(-0.55, 0.34, 1.044)` stay fixed. No correction applies outside ticks 352..366.

For each interval of length `h`, use cubic Hermite interpolation and certify a continuous 0.06 m correction cap through its equivalent Bezier controls `v_i`, `v_i + h*m_i/3`, `v_(i+1) - h*m_(i+1)/3`, `v_(i+1)`: each control's Euclidean norm must be at most 0.06 m. Initialize from the archived polynomial fit, but independently evaluate the Hermite candidate. Use deterministic trial order and a fixed termination budget. Hard constraints are all reviewed 344..388 continuity limits, segment lengths, unchanged protected poses, exact peak/recovery, and the correction cap; aim for knee step <=0.099 m, require <=0.10 m. Secondary preferences are smaller correction and smoother target/knee acceleration. Record best rejected candidate and limiting constraints if no admissible fit is found. Do not add knots, increase the cap, or change the pole, IK soft reach, boot orientation, protected actors or source blending in this run.

Before fitting, reproduce the archived polynomial RED result and measure its other continuity bounds. For a successful candidate, test C1 joins, endpoint value and derivative, the continuous cap, all continuity bounds, direct/reverse/repeated sampling, exact peak/recovery, and the full 346..386 contact certificates and peak exterior witness. The runtime must contain only frozen coefficients and absolute-tick evaluation. Fresh visual captures and independent review remain required before acceptance.

The initial fixed-axis whole-region diagnostic records a missing certificate (signed gap -0.52597567 m) and zero nearest surface distance in the old pose. A negative gap for one axis does **not** prove overlap: a disjoint fixture also fails that axis. Its opt-in baseline test is not the required RED acceptance test. Before changing the pose, implement the following camera-independent whole-part certificate and run an actual-resource RED acceptance assertion.

Freeze complete anatomical triangle membership for defender left boot/shin and attacker left boot/shin as separate parts, including seam triangles. For nonintersection certificates include every rendered mesh carrying a region, including underlying body skin; for the intended contact-distance query use the exterior defender `AuditionBoots` boot and attacker boot shell or shin. No camera, per-tick radius or nearest-only filtering is allowed. Record membership/topology identity.

For each cross-actor part pair, search for a separating plane using both parts' convex-hull face normals, cross products of nonparallel hull-edge pairs, and the historical approach axis as an additional diagnostic. Project **every original part vertex** onto each candidate axis, test both orientations, and retain the widest verified gap with limiting actor/mesh/triangle/vertex IDs and plane offset. A verified positive whole-part gap certifies nonintersection; a nonpositive best gap is only **uncertified**, not penetration depth. An exact triangle-surface query on selected failing ticks can diagnose intersection or tangency but is not required to reject an uncertified candidate. Zero surface distance is intersection or tangency within tolerance, not certified volumetric penetration. Never label a failed single-axis test as overlap.

At every sampled tick 346–386, require at least 0.001 m of verified separating-plane gap for all four cross-actor boot/shin part pairs. This full-vertex certificate itself proves every included triangle pair is at least 1 mm apart; do **not** perform an exhaustive nearest-surface query at certified noncontact ticks. Fail immediately and report the first uncertified pair. At tick 366, after all four certificates pass, find one exact eligible exterior defender-boot/attacker-shin-or-boot triangle witness no farther than 0.020 m. The certificate supplies the lower bound; the witness supplies the upper bound. Call the latter `contactDistanceUpperBoundM`, not the exact global minimum. A deterministic triangle-AABB threshold search may prune a pair only when its box-distance lower bound exceeds 0.020 m plus numerical allowance; interrupted traversal is `incomplete`, never a negative result. Record worst verified gap, exact contact witness and first failing pair. The 1 mm minimum deliberately avoids ambiguous mathematical tangency. These integer-tick checks do not certify continuous time between ticks. If a visibly correct pose has positive actual distance but no convex-hull certificate, stop this certification approach and revise the contract; do not crop anatomy or change the protected attacker merely to pass. Fixtures must cover disjoint shapes failing the historical axis but passing another, crossing and tangent surfaces, containment with positive surface distance, separate boot/shin versus their combined hull, complete-vertex verification, yaw/world conversion, identity validation, deterministic witnesses and zero triangle-distance calls for certified noncontact ticks.

The contact witness must be exterior **on both owners**, not merely close. For each candidate pair of surface points, take the direction from defender point to attacker point. Cast outside-in along that segment direction from beyond all vertices of each complete owner, using a margin greater than the existing endpoint tolerance, and query every rendered owner mesh. The first defender hit must be `AuditionBoots/leftBoot`; the first attacker hit must be `AuditionBoots/leftBoot` or an uncovered body `leftShin`, coinciding with the candidate witness within the geometry tolerance. An intervening boot shell or other body/garment surface rejects the candidate. Collect every owner-triangle hit tied at the first depth and reject multiple distinct triangles, even within one mesh; deduplicate only repeated references to the same actor/mesh/triangle. This conservatively rejects shared-edge ties as well as coincident layers. Do not bypass a blocker or select by camera. Once the qualifying peak witness is chosen, freeze its triangle/barycentric bindings and follow them through the window. Fixtures must cover a boot-shell-blocked body shin, exposed interior shin, same-mesh coincident layers and legitimate shared-edge ties.

The threshold traversal is a **conservative witness search**, not a complete search over all continuously varying exposed point pairs. Its finite deterministic candidates may include exact nearest pairs and a fixed barycentric pattern on each eligible triangle. Every positive candidate must satisfy exact distance and outside-in checks. Exhausting candidates returns `no-certified-witness-found`; it does not prove no exterior contact exists. An incomplete or interrupted traversal is a distinct result and cannot approve or disprove contact. A regression must place a blocker over the nearest corner while leaving an exposed interior point within threshold; the search may find that interior witness or return the honest no-certified-witness result, but must never accept the covered point.

A cleared tick-366 trial exposed a specific finite-search false negative: the nearest defender boot witness lay exactly on a vertex shared by triangles 234 and 237; the required strict tie rule rejected it even though the nearest eligible pair was 0.0164753 m apart. Preserve the strict tie rule and add a frozen deterministic interior-candidate pattern: move each nearest witness barycentric toward its own triangle centroid by fractions 0.001, 0.01 and 0.05, trying each endpoint separately and both together. Recompute exact world positions and distance and repeat full-owner first-hit validation; no probe outside the 1–20 mm interval or with ambiguous/covered first hits qualifies. This pattern improves discovery without making a `null` result exhaustive. It changes no mesh or report.

Part membership identity must include actor, mesh, region, triangle ID and its **ordered vertex triple**, plus resource and geometry-sampler identity at the actual-resource report boundary. Preserve the minimum signed best-plane gap across the four pairs even on failure, separately from a positive verified-certificate minimum. Neither a negative gap nor the zero-distance RED baseline is a measured penetration depth.

Retain the reviewed 344–388 consecutive-tick bounds: boot-toe displacement at most 0.20 m, knee displacement at most 0.10 m, boot orientation change at most 0.25 rad, calf world rotation at most 0.35 rad, residual axial twist at most 0.20 rad and flexion change at most 0.25 rad. Preserve segment lengths within 1e-5 m and direct, sequential, reverse and repeated sampling parity. The defender's `contactResidualM` is distance to its new presentation target; it must not imply proximity to the attacker ankle. Recheck all 54 existing evidence-window ticks and inspect every tick 364–371 for crossing.

After geometry and continuity pass, generate a **new** actual-resource first-hit report in a versioned directory. Do not rewrite `artifacts/rigged-contact-feature/report.json` or its historical captures. Freeze new bindings once; never select by camera or per-frame proximity. The new report is still diagnostic. Capture clean/marked opposing lateral views at every tick 364–371, A/B first- and third-person at the existing defaults at the required review ticks, entry/recovery checkpoints and unmarked normal-speed tick-350-through-fall playback. Require an externally meeting intact silhouette, credible trip timing and unchanged genuine B screening. Review A readability independently. Observation calibration, training attachment and publication remain open.

Implementation is split into a whole-part certificate under `evidence/` and a dependent defender pose correction in `pose/sampler.ts`, its tests and affected `evidence/geometry.test.ts` assertions. The existing fixed-axis `contact-clearance` helper remains a bounded diagnostic, not an acceptance certificate. Coordinator owns this contract, artifact versioning, integration, task status and final acceptance. Independent read-only review follows each delegated implementation and the final edit.

<a id="rigged-contact-visual-review-v1"></a>
## Rigged contact visual review v1 (local diagnostic)

This review follows `simulator-presentation.md#rigged-contact-feature-v1` and the actual-resource report in `artifacts/rigged-contact-feature/report.json`. A qualifying first-hit selection does not establish an approved football contact. The frozen defender/attacker bindings from that report are the only candidate patches in this review. Do not reselect by proximity, camera visibility, or tick.

Produce a compact sidecar for ticks 364, 366, 370 and 371 from the same verified geometry sampler. Each row contains both selected triangles' three world-space vertices in bound vertex order, their barycentric points, both world-space left-ankle landmarks, the fixed axis, Euclidean and signed patch separation, and source/resource/timeline/geometry/renderer identities. Verify reconstructed points against the fixed tracker. Reject identity, tick, actor, triangle, vertex-order or barycentric disagreement. Convert the sampler's actor-local landmarks and mesh vertices to world coordinates exactly once. Keep the full historical report separate and unchanged.

The authoring overlay changes the renderer fingerprint. Retain the historical report bytes and frozen bindings; do not reselect contact patches or rewrite the report. A separate local `visualization-attestation.json` binds the historical report SHA-256, its historical renderer fingerprint, the current stable renderer fingerprint, the generated sidecar SHA-256, and the checks that reconstructed the same fixed bindings and eight tracked rows against current resources/source/geometry. The sidecar carries the **current** renderer fingerprint. The attestation explicitly states that it is a visual diagnostic reconstruction, not a recertification of historical first-hit selection, renderer equivalence, observation calibration or training acceptance. The development-only page must reject the sidecar if its digest or current renderer fingerprint differs from this attestation or the running source tree. A source edit after generation requires regeneration and review.

The existing authoring renderer alone supplies review images. A development-only overlay may draw colored triangle outlines, point markers and ankle markers from the sidecar; it starts off, casts no shadows and does not alter actors, materials, camera, lights, occluders or authored data. Present an explicit marker toggle. A settled-frame receipt must identify tick, A/B preset, first-/third-person camera and marker state before capture. Unmarked images at the same state are the readability evidence; marked images explain anatomy. Any close camera is diagnostic only and cannot replace actual A/B views.

Capture marked/unmarked pairs at four ticks from A and B in both camera modes at current defaults (4.5 m distance, -1.5 m lateral offset for third person): 32 actual-view images. Inspect an additional reproducible close-up from opposing directions. Capture normal-speed unmarked motion from tick 350 through the fall. Record whether the selected boot/shin patches depict the intended careless trip, whether visible substantial interpenetration occurs, and what A/B viewers can actually see. An inconclusive view remains inconclusive. A negative signed axis separation is not a certified penetration depth. No training attachment, observation calibration, answer-key change or publication follows from this visual review alone.

### Lateral diagnostic refinement

The first opposing close cameras placed the contact patches almost along the viewing axis; the reverse view was screened by the defender's body. Add two fixed low cameras perpendicular to the horizontal projection of the frozen tick-350 axis, roughly 1.5 m to either side of the tick-366 patch midpoint and about 0.6 m above the field, looking at that midpoint. These are diagnostic cameras, not A/B referee positions. Keep their transforms fixed while stepping the four review ticks and leave actor meshes, camera defaults, occluders and facts unchanged. Use small surface-point and ankle markers in these close views so they do not cover the seam. Capture clean/marked pairs from both lateral cameras at all four ticks. The acceptance question is whether intact boot and lower-leg silhouettes meet externally or visibly cross through one another; a hidden patch remains inconclusive.

<a id="rigged-diagnostic-geometry-v1"></a>
## Rigged diagnostic geometry v1

This bounded continuation of RFP-REQ-004 creates diagnostic surfaces only. It does not connect observation scoring, persistence, publication, the old GeometryResolverV2, or route rendering. Planning requested `gpt-6-astra` / `xhigh`; runtime-confirmed identity is `unconfirmed`.

### API and authority boundary

`createCandidateGeometrySampler({ resources, playable, implementationLabel })` asynchronously returns `{ identity, sample(actorHandle, tick), dispose() }`. Validate and detach the complete public timeline, build the production public locomotion plan, and construct private selected athletic solid-kit models with `number: null` and the production pose sampler. Select frames internally; callers cannot override roots, phases or clips. Reject unknown actors, invalid ticks and calls after disposal.

Identity records `purpose: diagnostic-only`, geometry/region-policy versions, selected resource digest, canonical content hash, digest of the complete detached public actor timeline, appearance settings and the implementation revision label. Recompute the resource-manifest digest using the loader's exact algorithm and reject mismatches. These labels are diagnostic metadata, not build attestation, authenticated Three objects, source approval or publication credentials.

### Surfaces and regions

Return detached plain numeric meshes with stable mesh IDs, actor-local posed positions and original indexed triangles, plus the exact actor-root transform. Extract each referenced vertex using `mesh.getVertexPosition`, transform by `mesh.matrixWorld`, then inverse actor-root matrix. This must include body, eyes, eyebrows, head-parented hair, the athletic silhouette edit and raised garments. Unreferenced shell buffer vertices are not drawn geometry.

Use fixed skeleton-name mappings and triangle vertices' dominant skin influences to partition head, torso, left/right upper arm, forearm/hand, thigh, shin and boot regions. Boundary triangles belong to every region selected by their vertices. Eyes, eyebrows and parented hair belong to head. Reject unknown mesh/skin structures. Every drawn triangle must occur in at least one region.

Optional region bounds are named `broadPhaseBounds`; they are not approved occluders. Preserve triangle surfaces and limb gaps. Never substitute one solid whole-body box. Cache only immutable topology; retain dense posed coordinates for the requested actor/tick without accumulating snapshots.

### Landmarks

Expose distinct `headBone`, `torsoBone`, `leftAnkleBone`, `rightAnkleBone`, canonical ground root, and `leftBootToeSurface` / `rightBootToeSurface`. Select each boot surface landmark once in the modified bind mesh using maximal forward coordinate in that boot's referenced region, with a stable index tie-break; record mesh and vertex IDs. Sample that fixed vertex at subsequent ticks. Never call it `contactFoot`: the previous 0.0198 m ankle-origin gap does not establish boot-surface contact. A reviewed contact attachment remains separate work.

### Ownership and evidence

The sampler owns its private instances, never the supplied shared resources. Dispose instances idempotently; preserve source geometry, weights, textures and other actors. Return no live Three objects or mutable buffer views. Later samples must not mutate earlier output.

TDD must prove independent linear-blend skinning agreement within 1e-5 m (nonzero yaw/translation and deformed limb), immutable source/snapshots, direct/forward/reverse/repeat parity, actor independence, complete triangle coverage, referenced-vertex bounds, and a separated-leg fixture whose gap ray misses actual triangles despite intersecting combined bounds. Verify actual local resource hashes. Reject digest mismatch, missing boot regions and invalid inputs.

Derive the current five evidence windows from the actual authored source and cover all seven actors at all 54 unique ticks (116–124 and 330–374). Retain compact signatures/counts/landmarks, not 378 dense snapshots. Include 355–386 continuity and retain production contact/fall regressions. Exact commands and observed results belong in the feature review, followed by independent read-only review.

This proves repeatable posed surfaces and explicit landmark semantics. Visibility, human readability, reviewed contact, calibrated occlusion and training acceptance remain unimplemented by this slice.

<a id="rigged-surface-query-v1"></a>
## Diagnostic triangle surface queries v1

This independent continuation of RFP-REQ-004 implements pure queries over existing candidate geometry. Astra xhigh planning is requested; runtime-confirmed identity is unconfirmed. It does not alter the pose, geometry sampler, canonical source, scoring, routes, persistence or publication.

### Input and output

Own only `rigged-player/evidence/surface-query.ts` and its test. Export explicit triangle selections containing a `CandidateGeometrySample` and mesh/triangle IDs. Resolve sparse `vertexId` values by ID, not array offset. Deduplicate repeated selections; reject conflicting definitions for the same actor/tick/mesh/triangle. Samples in a query must have compatible integer ticks. Reject nonfinite coordinates/transforms, missing IDs, invalid indices and empty nearest-pair selections. Empty occluder selections return no hit.

`nearestSurfacePair(a, b)` returns the real world-space triangle-to-triangle minimum distance and two detached witnesses: actor handle, tick, mesh ID, triangle ID, barycentric weights in declared vertex order, and world position. Apply the exact actor-root yaw/translation. Include point-to-triangle, edge-to-edge and crossing cases; coplanar overlap and tangency must work. Handle degenerate triangles explicitly as their remaining segments/points, without NaN or invented area. Distances and witnesses must agree.

`castSurfaceSegment({ start, end, surfaces })` returns the closest detached hit witness and distance from start, or null. Use geometric double-sided triangles and a versioned 0.001 m endpoint exclusion at each end. A segment no longer than twice this exclusion has no interior hit. Reject nonfinite endpoints. Coplanar overlap is a hit at the earliest eligible overlap; document the numeric tolerance separately from the endpoint exclusion. Degenerate surfaces have no area and do not occlude. Do not ignore any actor automatically, including the target's own body.

Both queries return plain numeric data, never Three objects or shared buffers. Stable ties use actor handle, mesh ID and triangle ID, then a documented deterministic witness order; result must not depend on selection order. AABB may reject candidates only. An AABB intersection never proves a surface hit. No candidate search may move canonical facts or assert football contact.

### Verification

Write RED tests before implementation. Fixtures must cover separated-leg gaps despite intersecting combined bounds, a blocking limb, front/back rays, endpoint policy, sparse IDs, rotations/translations, triangle interior crossings, coplanar overlap, tangency, degeneracy, nearest points on edges/interiors, stable reordering/deduplication, detached output and malformed input. Use independently calculable coordinates and independent ray checks, not merely the implementation's helper as oracle. Verify barycentric reconstruction and distance equality. Include query counters only if useful; no timing threshold in tests.

Run focused Vitest, typecheck and scoped lint, then independent read-only review. Worst-case nearest-pair cost is quadratic; rays are linear. Keep this a diagnostic primitive. Actual attachment selection, the 92-row A/B pilot and real-resource cost measurements follow after the corrected pose is frozen. Human readability, renderer material/culling parity and training acceptance remain separate.
