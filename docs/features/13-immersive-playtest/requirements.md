# Immersive local incident presentation

Status is tracked only in `../../specs/tasks.md`.

## Objective

Make the unsaved local incident feel like a playable football scene from entry, while improving the authored scene's stadium context and all seven players' visual shape. The game should recede to a clean field during active play. This feature remains a local, unscored preview and does not approve training publication.

## Acceptance

- **IMM-REQ-001:** On desktop, the local playtest opens with a viewport-filling scene, one clear bilingual entry action, concise controls and an unsaved/unscored disclosure. The entry gesture attempts fullscreen and mouse capture; browser denial has a playable, visible fallback. No site header, footer or separate toolbar competes with the field during setup or active play.
- **IMM-REQ-002:** During active play, buttons, sliders, tick counters and diagnostics are neither visible nor keyboard-focusable. A small noninteractive pause hint and local-preview label may remain. Escape, focus loss, hidden document, pointer release or fullscreen exit pause without advancing ticks while paused.
- **IMM-REQ-003:** Pause shows Resume, Restart, camera settings, fullscreen and return navigation within the fullscreen surface. Completion shows Restart and Return without a disabled Start action. Loading, render and browser-permission failures are recoverable in Spanish and English.
- **IMM-REQ-004:** Authoring and playtest render the same original procedural pitch environment: regulation goals at `z = ±52.5` with 7.32 m clear opening and 2.44 m height, visible subdued nets, perimeter runoff, stands and restrained stadium structure. No scene element intrudes into the playing field or changes the canonical incident. The goal is visibly inspectable by turning toward it; the canonical initial/A/B camera poses remain unchanged.
- **IMM-REQ-005:** All seven players use a noticeably smoother, more human-shaped silhouette and fixed shirt numbers attached to their jerseys. Matching actors have the same appearance and pose in both routes at the same canonical tick. A contact, B screening and the fall remain visually credible.
- **IMM-REQ-006:** Canonical timeline, tracks, event/fact/source assets, authored joint positions, evidence anchors, occluders, observation/evaluation/scoring, persistence and publication remain unchanged. Any local viewport aspect change is represented truthfully in the playtest view sample. Historic visual approvals are not reused.
- **IMM-REQ-007:** Focused deterministic tests, full package checks, Playwright CLI lifecycle/responsive/fullscreen checks, fixed-tick WebGL inspection, normal-speed motion review, measured rendering cost and independent read-only review pass. Record original-asset provenance and limitations.

## Limits

No external rig, mocap, player likeness, real team/stadium branding, audio, scored attempt, physics adjudication, training publication or deployment. The neutral controls route and static concept are outside this scene-focused pass.
