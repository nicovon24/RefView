# Contact layer diagnostic comparison v1

This follows the reviewed 92-row pilot and does not adopt a training attachment. Astra xhigh planning is requested; runtime identity is unconfirmed. The v1 nearest pair selected defender `SuperHero_Male` triangle 1490, whose vertex IDs `[1329,799,861]` also define raised `AuditionBoots` triangle 34. At 366, A's rays hit defender boot triangle 207 approximately 0.02228 m before that point. B is screened by actor-005 shorts. These facts motivate a camera-independent layer comparison, not forced A/B results.

## Exclusive scope

Add only `rigged-player/evidence/contact-layer-comparison.ts` and `.test.ts`. Leave the v1 seeder, pilot, query kernel, geometry/model/pose, report adapter, source, routes and scoring unchanged. Tests may write only new comparison artifacts under `artifacts/rigged-calibration-layers`; retain every historical file under `artifacts/rigged-calibration` unchanged. No external assets or dependencies.

Export async `compareRiggedContactLayers({ geometrySampler, compiledSource, rendererInputFingerprint, historicalBaselineHashes })`, using the pilot's borrowed sampler/compiler types. Return deeply immutable detached `{ comparison, metrics }`. Purpose is `local-rigged-contact-layer-comparison`. Timing stays outside deterministic comparison data. Caller historical hashes are labelled historical metadata, not attestation.

## Layer correspondence and selection

Use the same anatomical regions and tick-366 source mappings as v1: defender leftBoot versus attacker leftBoot/leftShin. On the known selected model, prove body-to-boot correspondence by equal sets of the three vertex IDs, preserving the permutation between declared triangle vertex orders. Require one unambiguous matching body/shell pair. Reject duplicate/ambiguous matching triangles rather than silently selecting one. Mesh identity must explicitly distinguish `SuperHero_Male` and `AuditionBoots`; no whole-body bounds or camera inputs participate in this choice.

For the baseline seed's body triangle, report its shell counterpart, the same physical barycentric point mapped through that permutation, posed separation and world positions. Do not assume bind-space 0.013 m is the current posed distance. A fixture with reordered winding must prove the mapping, and a duplicate shell fixture must fail.

Create the alternate nearest-pair selection from the same region triangles, excluding only body triangles with demonstrated boot-shell counterparts. Keep boot shells and remaining unmatched skin; explicitly call the latter unmatched skin, not proven globally exterior skin. Never remove any actor/mesh from occlusion. Freeze the new nearest pair at 366 independent of A/B results. If the pair remains intersecting or hidden, report that result; do not search for a more favorable witness.

## Comparable reports

Regenerate v1 bindings/report under the current renderer fingerprint, then run the same pilot with alternate fixed bindings. All source/resource/timeline/topology/peak hashes and kernel policies remain equal; only contact witness IDs/barycentrics/separation/canonical-ground distances differ. Preserve v1 seeder output. The comparison contains both binding sets/reports, correspondence details, selected/excluded triangle counts and per-row differences (positions, separation, first blockers and classification). Verify all 60 area rows are identical and all 32 contact rows are present; no expected visibility classification is prescribed.

The diagnostic does not certify exteriority, watertight volume or penetration depth. A zero nearest distance can be an intersection. Adoption still requires choosing the observable feature that contact evidence represents and reviewing it in fixed and moving rendered views.

## Verification and artifacts

TDD fixtures: buried body point versus raised shell; exact correspondence and barycentric permutation; ambiguity rejection; selection independent of cameras; all original self-occluders retained; unchanged area rows; alternate pair frozen across ticks; deterministic reversed input ordering; immutable borrowed inputs/output and no sampler disposal.

Use an opt-in actual-resource integration test after the module is frozen (`REFVIEW_RIGGED_LAYER_INTEGRATION=1`). Reuse verified resource/source helpers from the report adapter without modifying it; geometry-only GLTF parsing may follow the existing geometry test. Verify all 14 source hashes and canonical hashes before/after. Compute renderer fingerprint before/after the complete comparison and write no accepted output if it drifts. Hash the existing historical baseline artifacts before/after and require them unchanged. Write comparison JSON and separate metrics only into `artifacts/rigged-calibration-layers`, with confined output and no following destination links. Record triangle counts, seed/pilot cost and actual outcomes without timing assertions.

Focused Vitest, typecheck, scoped lint and independent read-only review are required. The coordinator owns tracker/docs/integration. If this layer-only comparison does not yield a suitable witness, keep it as diagnostic evidence and identify the next acceptance decision rather than changing football facts or hiding blockers.
