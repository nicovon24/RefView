# Rigged diagnostic geometry v1

This bounded continuation of RFP-REQ-004 creates diagnostic surfaces only. It does not connect observation scoring, persistence, publication, the old GeometryResolverV2, or route rendering. Planning requested `gpt-6-astra` / `xhigh`; runtime-confirmed identity is `unconfirmed`.

## API and authority boundary

`createCandidateGeometrySampler({ resources, playable, implementationLabel })` asynchronously returns `{ identity, sample(actorHandle, tick), dispose() }`. Validate and detach the complete public timeline, build the production public locomotion plan, and construct private selected athletic solid-kit models with `number: null` and the production pose sampler. Select frames internally; callers cannot override roots, phases or clips. Reject unknown actors, invalid ticks and calls after disposal.

Identity records `purpose: diagnostic-only`, geometry/region-policy versions, selected resource digest, canonical content hash, digest of the complete detached public actor timeline, appearance settings and the implementation revision label. Recompute the resource-manifest digest using the loader's exact algorithm and reject mismatches. These labels are diagnostic metadata, not build attestation, authenticated Three objects, source approval or publication credentials.

## Surfaces and regions

Return detached plain numeric meshes with stable mesh IDs, actor-local posed positions and original indexed triangles, plus the exact actor-root transform. Extract each referenced vertex using `mesh.getVertexPosition`, transform by `mesh.matrixWorld`, then inverse actor-root matrix. This must include body, eyes, eyebrows, head-parented hair, the athletic silhouette edit and raised garments. Unreferenced shell buffer vertices are not drawn geometry.

Use fixed skeleton-name mappings and triangle vertices' dominant skin influences to partition head, torso, left/right upper arm, forearm/hand, thigh, shin and boot regions. Boundary triangles belong to every region selected by their vertices. Eyes, eyebrows and parented hair belong to head. Reject unknown mesh/skin structures. Every drawn triangle must occur in at least one region.

Optional region bounds are named `broadPhaseBounds`; they are not approved occluders. Preserve triangle surfaces and limb gaps. Never substitute one solid whole-body box. Cache only immutable topology; retain dense posed coordinates for the requested actor/tick without accumulating snapshots.

## Landmarks

Expose distinct `headBone`, `torsoBone`, `leftAnkleBone`, `rightAnkleBone`, canonical ground root, and `leftBootToeSurface` / `rightBootToeSurface`. Select each boot surface landmark once in the modified bind mesh using maximal forward coordinate in that boot's referenced region, with a stable index tie-break; record mesh and vertex IDs. Sample that fixed vertex at subsequent ticks. Never call it `contactFoot`: the previous 0.0198 m ankle-origin gap does not establish boot-surface contact. A reviewed contact attachment remains separate work.

## Ownership and evidence

The sampler owns its private instances, never the supplied shared resources. Dispose instances idempotently; preserve source geometry, weights, textures and other actors. Return no live Three objects or mutable buffer views. Later samples must not mutate earlier output.

TDD must prove independent linear-blend skinning agreement within 1e-5 m (nonzero yaw/translation and deformed limb), immutable source/snapshots, direct/forward/reverse/repeat parity, actor independence, complete triangle coverage, referenced-vertex bounds, and a separated-leg fixture whose gap ray misses actual triangles despite intersecting combined bounds. Verify actual local resource hashes. Reject digest mismatch, missing boot regions and invalid inputs.

Derive the current five evidence windows from the actual authored source and cover all seven actors at all 54 unique ticks (116–124 and 330–374). Retain compact signatures/counts/landmarks, not 378 dense snapshots. Include 355–386 continuity and retain production contact/fall regressions. Exact commands and observed results belong in the feature review, followed by independent read-only review.

This proves repeatable posed surfaces and explicit landmark semantics. Visibility, human readability, reviewed contact, calibrated occlusion and training acceptance remain unimplemented by this slice.
