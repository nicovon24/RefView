# Defender leg continuity candidate v1

This bounded continuation of RFP-REQ-002 follows the reviewed diagnostic geometry slice. Planning requested `gpt-6-astra` / `xhigh`; runtime-confirmed identity is `unconfirmed`. The existing selected-player integration passed 369 tests, root lint/typecheck and scoped independent review before this new pose candidate.

## Observed defect and scope

The stable defender left boot-toe surface vertex moves 0.466 m from tick 358 to 359. The current moving target changes about 0.25 m, while unconstrained CCD moves the ankle about 0.28 m and rotates the foot roughly 56 degrees. Legacy locomotion protection is fully active, so changing gait blends cannot correct this defect.

Only defender left-leg presentation changes. Preserve attacker poses and the defender support leg initially. Actor roots/yaw, ball, authored facts, clip transitions and contact tick 366 remain exact. This intentionally replaces the defender's previous protected visual pose; historical defender pose hashes must not be represented as preserved approval. The previous attacker protected window remains unchanged.

## Bounded implementation

Own `pose/two-bone-ik.ts` and tests, `pose/sampler.ts` and tests, and affected assertions in `evidence/geometry.test.ts`. Do not change model resources, referee, canonical sources, routes, observation scoring or persistence.

Use analytic two-bone solving with a fixed actor-local knee pole and deterministic pole-degeneracy fallback. Clamp reach between absolute segment-length difference plus epsilon and sum minus epsilon. Rotate joints only: preserve sampled segment lengths, translations and scale. Derive lengths from the imported animation reference, not guessed bind dimensions. Resolve foot orientation separately from arbitrary CCD rotation.

Replace the frame-varying animated-foot-to-contact lerp with an absolute-tick curve from fixed root-local reference poses. Prepare from approximately tick 346, reach the existing world ankle target at tick 366 and recover by tick 386. Blend entry/exit positions and orientations continuously into the existing animation. Keep the current peak boot orientation as the initial orientation target. The ankle target is not a reviewed boot-surface contact attachment.

## Required evidence

1. Reproduce the 0.466 m surface-vertex step in a RED test before editing.
2. Require defender boot-toe step at most 0.20 m per tick throughout 344–388, including entry and recovery. Inspect knee-plane/orientation continuity, not only ankle distance.
3. Preserve sampled segment lengths within 1e-5 m, exact canonical actor transforms, all non-defender pose assertions and unchanged football source hashes.
4. Keep tick-366 ankle residual at most 0.03 m and compare actual boot surfaces/visual contact. Numeric ankle agreement alone is insufficient.
5. Prove direct, sequential, reverse and repeated sampling parity without render history.
6. Run all 54 current evidence-window ticks plus expanded continuity diagnostics. Inspect fresh Playwright CLI captures at 350, 356, 358, 359, 360, 366, 374 and 386 and normal-speed motion. Run scoped/full relevant gates and independent read-only review after final edits.

If continuity and contact cannot both pass, revise the target curve instead of changing canonical facts or weakening the acceptance bound. Training calibration remains separate.

## Recovery orientation correction

The first correction passed the toe bound, but independent review exposed rapid calf rotation. Astra-xhigh measured no knee-plane reversal (consecutive normal dot at least 0.99827 over 368–372). At tick 368 the calf world orientation changes 0.9436 rad while its segment axis changes only 0.0532 rad; the residual axial twist is 0.9422 rad. The shortest-swing solver preserves unwanted source-animation roll. Requested reach then crosses the approximately 0.830 m segment sum at 371, causing abrupt extension. This is not accepted as complete motion quality.

Keep the same exclusive paths, nominal ankle trajectory, pelvis, support leg and protected attacker. Orient thigh and calf using complete orthonormal frames: segment direction plus a stable knee-plane normal, mapped from fixed bone-local reference frames. Freeze the current tick-366 reference pose rather than reading any prior render. Measured local axes are both `[0, 1, 0]`; local plane normals are thigh `[-0.9991588786338783, 0, -0.04100637755801442]` and calf `[-0.9833050993880055, 0, -0.18196440503846162]`. Normalize/orthogonalize and verify provenance against the frozen peak pose.

Soften reach before full extension. Initial candidate: `softStart = upper + lower - 0.07`, `softCap = upper + lower - 0.01`; below softStart retain the ordinary clamped distance, above it use `softStart + (softCap - softStart) * (1 - exp(-(distance - softStart) / (softCap - softStart)))`. Apply to requested distance before maximum clamping. Peak reach 0.72354 m is below softStart and must stay unchanged. Handle smaller fixture segments without invalid reach intervals.

Write a RED regression for the measured world/axial rotation before editing. Across every consecutive step 344–388 require calf world rotation at most 0.35 rad, axial twist residual after minimum axis transport at most 0.20 rad, anatomical flexion change at most 0.25 rad, knee world displacement at most 0.10 m, boot world rotation at most 0.25 rad, and the existing toe displacement at most 0.20 m. These are candidate-specific guards, not universal anatomical thresholds. Preserve complete left-leg peak pose and posed surfaces at 366 within 1e-5, contact residual at most 0.03 m, segment lengths and deterministic seek parity. Capture the pre-correction peak signature before editing.

Inspect entry 345–346 and recovery 376–386. Any blend must use absolute ticks and stable references, never previous-frame smoothing. Run focused tests and final visual review after the edit. If these guards cannot converge in this correction, report the failing measure and redesign the trajectory instead of weakening the bounds or expanding into canonical motion.

The measured correction RED also exposed a 0.41677 rad flexion change at tick 356. The coordinator permits retuning only the absolute left-ankle presentation curve at entry/recovery if full-frame orientation and soft reach alone cannot satisfy these guards. Preserve the frozen tick-366 pose/surface, actor roots, pelvis, right support leg and canonical facts; document the changed curve explicitly. This supersedes the preference above to retain the nominal ankle curve, without permitting history-dependent damping or relaxed bounds.
