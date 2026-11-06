# Shared stadium and protected motion contract

## Direction

A bright, readable football pitch sits inside a darker stylized stadium bowl. Two seating tiers, a concourse gap, aisle breaks and sparse original spectator color patches create depth; the stadium does not compete with the ball, players or penalty-area line. Turf has fixed, seeded fine variation and restrained mowing bands. Keep RefView's green/lime identity and existing unsaved-preview language. The active-play HUD stays minimal; ready and pause controls can move to a compact side composition.

The supplied screenshot is inspiration for atmosphere and relative scale only. All new geometry, textures and animation are original procedural source in this repository. No external asset license is introduced.

## Authority and frozen evidence

The existing `asset-001.mjs` rig maps clip poses to rendered joints, attachments and occluder bounds; clip refinement therefore creates a new source identity. Keep that rig file, actor root tracks, ball tracks, camera presets, event ticks/order, facts, evidence windows and clip routing unchanged. Update clip source/public bytes and manifest hashes as one coordinated candidate. Capture new renderer evidence and calibration; old visual approval does not transfer.

Before clip edits, `createIncident001SourceV2()` yielded these SHA-256 hashes of `JSON.stringify(evidence.samples)`:

| Evidence | Ticks | Baseline hash |
| --- | --- | --- |
| `EV-PASS-SNAPSHOT` | 116–124 | `710b6d79b7e3a7f26edd804ea1691f5e320b9c3e75eddfa68df60caf069b76d3` |
| `EV-NO-BALL-TOUCH` | 356–366 | `eb2033e8d35e3325a010c2f9d74e1833ea7875c8785fb87ac5e2842d12c9c38a` |
| `EV-TRIP-CONTACT` | 364–371 | `73649168538e448434ebcc133b1ca5295e2c1009e0e27c1ed31430f71fd5d704` |
| `EV-INSIDE-AREA` | 360–374 | `4221edfe5e6e1ab89552e26192e12aa4efd6664059a642be710104ad4c95fc8b` |
| `EV-NON-DOGSO` | 330–371 | `21cad9c8cab454f0e371f6665db6b23ffc51d7027307d93dfe62f968a19affe7` |

The analogous hashes are facts `f36429d0c154b11873ae886cd300bc9c23d4e7d30bfa3a102e5c32ba43ceb9df`, all public actor roots/clip IDs/phases and ball samples `0f1a1699202bafeb32a9d7b892a4015a7d2f499151a72592d24276393c156be0`, and events `4e5035fa8656b937aa40d2b95b296b7feef423edc57ce11ac6799cdafb54cc24`. The motion tests must lock these before improvement. Check run phase 355 → challenge phase 0 and run phase 365 → fall phase 0 for continuity. Contact remains at tick 366; challenge begins 356, trip begins 366, whistle window begins 372. This freezes evidence geometry over every window, not just one contact frame.

## Ownership and cost

The shared environment factory owns any texture, geometry, material and crowd batch and disposes them on unmount. Keep goals and playing markings in their present coordinates; place stands and roofs outside runoff. Seed static variation so screenshots at the same camera/tick remain stable. Do not add per-spectator meshes or time-varying light. Tune grass, sky/fog and direct light together, and measure actual renderer calls/triangles/memory at 1280x720 and 1440x900.

The player factory retains `ActorSceneNodes` names, parenting, public handle/number map and authored pose application. Improve mesh envelopes without relocating joints or boot centers. A shared original referee presentation factory replaces the duplicate block construction in both adapters; the coordinator owns those adapters and will verify unchanged camera placement/transparency policy. The fixed rig limits anatomical realism and foot-slide correction.

## Evidence

Use the prior RV-019C captures only as a before image. New acceptance requires current A/B first- and third-person tick-366, tick-120 pass, tick-386 fall, goalward local play, normal-speed 345–480 motion, local lifecycle/recovery and performance captures. The source candidate remains draft until separate trusted build/capture binding and Nicolas's training approval.
