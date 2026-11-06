# Local rigged calibration pilot v1

This RFP-REQ-004 continuation uses the independently reviewed posed geometry and surface-query kernel after the corrected left-leg pose is frozen. Planning requested Astra xhigh; runtime identity is unconfirmed. Own only `rigged-player/evidence/calibration.ts` and its tests. Do not change pose, geometry/query modules, canonical sources, resolver, routes, scoring, persistence or publication.

## API and diagnostic authority

Export `seedRiggedContactBindings({ geometrySampler, compiledSource, rendererInputFingerprint })` and `runRiggedCalibrationPilot({ geometrySampler, compiledSource, rendererInputFingerprint, bindings })`, both async. Use the actual compiler return shape and a narrow borrowed sampler interface derived from `createCandidateGeometrySampler`. Never dispose that borrowed sampler. Outputs must be deeply immutable detached plain data with purpose `local-rigged-calibration-candidate`, never Three objects or dense surface snapshots. No scores, rubric bands, admission receipts or EvidenceBundleV1. Caller fingerprint is local input metadata, never running-build attestation.

Frozen return wrappers: seed returns `{ bindings, metrics: { seedPairProductCount, elapsedMs } }`; pilot returns `{ report, metrics: { triangleCount, rayCount, elapsedMs } }`. Timings stay outside deterministic bindings/report. Sampler type is a Pick of its factory result containing `identity` and `sample`. Rows sort by tick, then contact/area evidence, A/B preset, first/third camera mode. The coordinator-owned local report adapter may be delegated as a separate exclusive slice once this API is frozen; it may not alter the pilot or query kernel.

Resolve actor handles using compiled canonical-to-public mapping. Validate source/sampler hash agreement, required geometry policies and exactly the supported authored observation structure; reject unsupported camera colliders/configuration instead of silently approximating them. Do not treat labels as authenticated provenance.

## Fixed candidate bindings

At authored contact tick 366, select all defender leftBoot region triangles against all attacker leftBoot/leftShin triangles, deduplicating mesh/triangle IDs. Run `nearestSurfacePair` once per seed operation, without selecting a result based on desired A/B visibility. Freeze actor/mesh/triangle IDs, declared triangle vertex IDs and barycentric weights for both witnesses. Record seed separation and each seed's distance to the authored contact point; zero distance may indicate penetration, not correct football contact. At every later tick evaluate those same witnesses, never reselect the nearest pair.

Bind to canonical content hash, resource digest, detached actor timeline hash, geometry identity, renderer input fingerprint, stable topology hash and posed-surface hashes of both actors at 366. Recompute and compare these at pilot start: changed geometry behind unchanged labels must fail. Validate barycentrics/IDs and topology when evaluating witnesses. Deterministic hashes use fixed numeric/key ordering; exclude runtime timing. Ground/line area anchors remain the exact canonical ground root and bound field point, not boot witnesses.

## Views and rows

Derive and validate EV-TRIP-CONTACT 364–371 (8 ticks) and EV-INSIDE-AREA 360–374 (15 ticks) from the source. Produce exactly 92 rows: 23 evidence/tick pairs × A/B × first/third person. Use only 15 distinct tick snapshots, all seven actors at each tick. The three remaining evidence items are explicitly uncalibrated; this pilot does not replace the separate 54-tick geometry coverage.

Use existing `reconstructViewpoints`, testing parity with production `cameraPose`: A referee ground `(6,0,32)`, B `(12,0,26.5)`, yaw toward authored `(13.8,36.8)`, pitch `atan2(0.8-1.7,horizontalDistance)`, camera distance 2 m/lateral 0, vertical FOV 50 degrees, aspect 16:9, near 1.1 m/far 160 m. Record eye/camera bases and view/projection matrices. Reject version/configuration drift.

For each anchor independently report distance/angles, C1 geometric gates (front, 30 m, FOV and central ±30 horizontal/±25 vertical degrees), camera depth gate, raw eye-to-anchor and camera-to-anchor triangle hits, and a camera-near-clipped hit starting where that ray crosses the near plane. Skip clipped rays whose target is behind/before the near plane. Use the kernel's 1 mm endpoint policy unchanged. Name all these diagnostics explicitly; a raw clear ray is not readability. Candidate availability requires every relevant gate plus no hit (eye uses eye ray, camera uses near-clipped ray). Row classification joint/cameraOnly/eyeOnly/neither requires all anchors at that same tick/view; never combine across frames/cameras. These are candidate geometric classifications, not training bands.

All player surfaces participate as double-sided geometry, including target owners. Do not automatically ignore the attachment's actor. Exclude the translucent referee from this declared policy. Alpha, material culling, illumination and human perception are not simulated; do not claim renderer parity.

## Cost and verification

Retain only one dense tick at a time. Prepare conservative per-mesh bounds and triangle selections once per tick; bounds may discard ray candidates only, never stand in for a hit. Reuse identical rays. Preserve exact results relative to unfiltered queries. Record triangle counts, seed pair-product count, ray counts and elapsed time separately from deterministic report content. Do not silently reduce regions or triangles to meet a budget. Nearest-pair runs only at seeding; if actual cost is excessive, request a separate measured optimization, without changing the reviewed kernel inside this assignment.

TDD: frozen seeds despite a new nearer pair; identity/topology/peak-pose mismatch rejection; transformed barycentrics with nonzero yaw; self-occlusion; leg gap; free ray outside FOV; near-plane clipping and target rejection; camera parity; exact 92-row coverage and row ordering; direct/reverse input order producing identical normalized content; conservative filtering equivalent to full surfaces; immutable inputs/output. Actual-resource assertions must not force A=joint or B=neither. Run focused tests, typecheck, scoped lint and independent review. The coordinator owns any subsequent actual-resource runner and durable report artifacts.
