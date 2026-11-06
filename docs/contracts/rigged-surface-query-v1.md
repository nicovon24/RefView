# Diagnostic triangle surface queries v1

This independent continuation of RFP-REQ-004 implements pure queries over existing candidate geometry. Astra xhigh planning is requested; runtime-confirmed identity is unconfirmed. It does not alter the pose, geometry sampler, canonical source, scoring, routes, persistence or publication.

## Input and output

Own only `rigged-player/evidence/surface-query.ts` and its test. Export explicit triangle selections containing a `CandidateGeometrySample` and mesh/triangle IDs. Resolve sparse `vertexId` values by ID, not array offset. Deduplicate repeated selections; reject conflicting definitions for the same actor/tick/mesh/triangle. Samples in a query must have compatible integer ticks. Reject nonfinite coordinates/transforms, missing IDs, invalid indices and empty nearest-pair selections. Empty occluder selections return no hit.

`nearestSurfacePair(a, b)` returns the real world-space triangle-to-triangle minimum distance and two detached witnesses: actor handle, tick, mesh ID, triangle ID, barycentric weights in declared vertex order, and world position. Apply the exact actor-root yaw/translation. Include point-to-triangle, edge-to-edge and crossing cases; coplanar overlap and tangency must work. Handle degenerate triangles explicitly as their remaining segments/points, without NaN or invented area. Distances and witnesses must agree.

`castSurfaceSegment({ start, end, surfaces })` returns the closest detached hit witness and distance from start, or null. Use geometric double-sided triangles and a versioned 0.001 m endpoint exclusion at each end. A segment no longer than twice this exclusion has no interior hit. Reject nonfinite endpoints. Coplanar overlap is a hit at the earliest eligible overlap; document the numeric tolerance separately from the endpoint exclusion. Degenerate surfaces have no area and do not occlude. Do not ignore any actor automatically, including the target's own body.

Both queries return plain numeric data, never Three objects or shared buffers. Stable ties use actor handle, mesh ID and triangle ID, then a documented deterministic witness order; result must not depend on selection order. AABB may reject candidates only. An AABB intersection never proves a surface hit. No candidate search may move canonical facts or assert football contact.

## Verification

Write RED tests before implementation. Fixtures must cover separated-leg gaps despite intersecting combined bounds, a blocking limb, front/back rays, endpoint policy, sparse IDs, rotations/translations, triangle interior crossings, coplanar overlap, tangency, degeneracy, nearest points on edges/interiors, stable reordering/deduplication, detached output and malformed input. Use independently calculable coordinates and independent ray checks, not merely the implementation's helper as oracle. Verify barycentric reconstruction and distance equality. Include query counters only if useful; no timing threshold in tests.

Run focused Vitest, typecheck and scoped lint, then independent read-only review. Worst-case nearest-pair cost is quadratic; rays are linear. Keep this a diagnostic primitive. Actual attachment selection, the 92-row A/B pilot and real-resource cost measurements follow after the corrected pose is frozen. Human readability, renderer material/culling parity and training acceptance remain separate.
