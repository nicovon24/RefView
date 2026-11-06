# Stadium, character and motion refinement

Status is tracked only in `../../specs/tasks.md`.

## Objective

Make the authored incident and immersive local playtest feel like a readable football match in a populated stadium. Use the user-provided stadium screenshot as visual direction for enclosure, seating depth and natural turf, without copying cricket controls, branding, scoring or asset bytes. Preserve RefView's field-led, unsaved and unscored presentation.

## Acceptance

- **SCM-REQ-001:** At desktop play and authored A/B views, the shared original stadium visibly has two separated seating tiers, a concourse/aisle rhythm, dark structural depth, and a sparse, stable crowd. Architecture stays beyond the 105 x 68 m field and regulation goals remain at the authored goal lines.
- **SCM-REQ-002:** The shared field has a natural-green turf palette, gentle mowing contrast and fine stationary variation. Lines, ball and contact boots remain readable at ticks 120, 366 and 386. Normal-speed playback has no visible texture shimmer.
- **SCM-REQ-003:** All seven shared player models have more continuous human-shaped shoulder, torso and limb joins, retain kit separation and readable shirt numbers, and match between the authored and local routes at the same public tick. The third-person referee is no longer a stack of boxes.
- **SCM-REQ-004:** Existing original running, challenge and fall clips gain a clearer stance/swing and bracing rhythm. Rig ABI, protected evidence anchors and occluders, root/ball tracks, event timing and facts remain fixed. Transitions and settled poses are deterministic and visually inspected at normal speed.
- **SCM-REQ-005:** Local ready/pause/completion UI leaves more of the incident visible and maintains bilingual entry, recovery, settings, fullscreen and return paths. During active play there are no visible or focusable controls, tick counters or diagnostics. Desktop and unsupported mobile layouts remain honest.
- **SCM-REQ-006:** No observation, decision, scoring, persistence or publication authority changes. Changed source clip bytes and renderer candidate are recorded as a new visual candidate; previous rendered approval is not reused.
- **SCM-REQ-007:** Procedural resources are owned and disposed. Crowd geometry uses instancing or merging, with measured render calls, triangles, live texture objects and frame intervals on the named browser/device. Report texture source and mip-chain allocation separately as an estimate; browser APIs do not expose exact GPU texture memory.
- **SCM-REQ-008:** Focused deterministic tests, full package checks, Playwright CLI lifecycle/responsive checks, fresh fixed-tick A/B/pass/contact/fall/goalward captures, normal-speed motion inspection and independent read-only review pass after the final relevant edit.

## Limits

No copied reference pixels, licensed stadium/player assets, real team branding, scoreboard, crowd audio, cinematic camera shake, bloom, scored attempt, training publication or deployment. The incident remains a local authored preview until the separate evidence and approval gates complete.
