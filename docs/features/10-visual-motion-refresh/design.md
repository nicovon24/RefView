# Visual and motion design

## Direction and boundaries

Extend the existing DESIGN.md system. Home is an entry surface; simulator is an operational workspace where the field leads. Keep existing route contracts, locale validation, asset provenance, canonical timeline and authority boundaries. No replacement brand or external imagery is needed. Reuse bundled OFL fonts with their existing notices.

## Motion thesis

- Focal moment: readable authored running, challenge and continuous fall on one canonical timeline.
- Continuity: selected camera/position and playback progress remain visible through repeated controls and fullscreen.
- Feedback: short color/underline transitions for navigation and controls; reduced-motion removes spatial decoration.
- Budget: no extra animation library or postprocessing; no new per-frame React state for visual polish. Deterministic sampling owns football poses; avoid wall-clock decorative player movement.

## Ownership

Coordinator owns these specs, tracker, integration and evidence. Home implementer owns home route, scoped home stylesheet and new home feature components only; cannot edit global styles, locale module or simulator. Animation assessment is read-only. Subsequent animation implementation must have explicit asset/hash ownership and test-first acceptance before dispatch. Review is independent and read-only.

## Risks

Changing rig/clip bytes changes authored source identity and invalidates prior rendered approval for that candidate. Contact geometry must be rechecked. Local playtest work exists beyond older orientation notes; preserve it. Historical still captures remain historical and are never relabeled as current evidence.
