# Immersive scene and rendering contract

## Direction

The local playtest is an Experience surface: field first, minimal guidance while playing, controls only when needed. Its first deliberate entry action requests mouse capture before fullscreen in the same user gesture, without awaiting either before the second request. Fullscreen is best effort. An explicit entry-pending state prevents the controller from starting until the final canvas layout/aspect and permission outcome settle. The ready controller must be created from that actual aspect; existing `setViewport` is valid only after a run starts. Fullscreen exit pauses even if the aspect does not change. Pointer/fullscreen denial retains bilingual recovery and a playable inline fallback.

The authoring route remains the inspection workspace with transport, tick and A/B controls. IMM-REQ-002 supersedes RV-019B's immediate-button visibility only while the local run is actively playing; setup and pause keep actions accessible. Do not modify the canonical camera or incident timeline to stage the goal. From the current initial yaw, the far goal is outside the field of view; a goalward browser capture proves its authentic placement and visibility when the user turns.

## Shared procedural environment

A feature-local environment factory owns its geometries/materials and returns a root plus its background/fog/light configuration for both scene adapters. Use existing public 105 x 68 m field dimensions and explicit 7.32 x 2.44 m goal dimensions from the authored competition fixture. Place posts on the goal lines at `z = ±52.5` without altering penalty lines. Nets, runoff, perimeter boards and low-detail stands remain outside play. Use deterministic geometry, restrained colors, stable light and bounded draw calls; no external assets, per-seat mesh loops, live crowd, shadows or postprocessing. Each mounted scene disposes only its owned resources.

## Shared player appearance

Keep the existing authored rig and `ActorSceneNodes` ownership. Cosmetic surfaces descend from its joint/segment nodes and do not move contact boot centers. Smooth shoulders, torso continuity, limbs, knees, shorts, hands, head and boots; prioritize the silhouette over kit trim. Shirt numbers are fixed local presentation metadata for this first incident:

| Public handle | Shirt number |
| --- | ---: |
| `actor-001` | 8 |
| `actor-002` | 9 |
| `actor-003` | 10 |
| `actor-004` | 1 |
| `actor-005` | 2 |
| `actor-006` | 4 |
| `actor-007` | 5 |

Numbers attach to jersey geometry and follow the run/fall pose; no billboard or hidden offence-role lookup. These are original procedural visuals, not licensed likenesses. If the fixed rig limits naturalism, report that plainly rather than claiming realistic anatomy.

## Evidence and risk

New renderer code changes the candidate fingerprint even though source bytes remain fixed. Reinspect public tick 120 pass, A/B first- and third-person tick 366, A tick 386 fall and normal-speed motion through tick 480. Measure fullscreen canvas/DPR and bounded performance on the named browser/device. Exact source/build/capture binding, training approval and saved/scored acceptance remain RV-008/RV-011 work.
