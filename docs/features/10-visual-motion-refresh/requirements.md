# Visual and motion refresh

Status is tracked only in `../../specs/tasks.md`.

## Objective and route

Delegated, bounded visual refinement of the existing RefView identity. Improve the existing home, authoring workspace, and procedural player motion before continuing the saved/scored incident milestone. Preserve all pre-existing local changes. The user requested orchestration and substantial animation/site improvement on 2026-11-03. The user confirmed simulator-first with home/navigation improvements.

## Acceptance

- **VIS-REQ-001:** Spanish and English home pages connect directly to the available incident preview and controls. Unimplemented product areas remain honestly described; no fabricated progress or scores.
- **VIS-REQ-002:** Home preserves the established pitch-led, green/lime identity while improving typography, hierarchy, navigation, responsive layout and keyboard focus. Desktop and 390px mobile captures show readable content without horizontal overflow.
- **VIS-REQ-003:** The authoring workspace gives the field visual priority, groups transport/camera controls, retains deterministic tick seeking, A/B presets, pass review, fullscreen, loading/error states, and explicit unsaved/unapproved status in both locales.
- **VIS-REQ-004:** Procedural animation improvements are deterministic and covered by tests before implementation. Canonical contact timing, positions, and reviewed football facts remain unchanged. Any altered pose geometry/source hash requires renewed visual evidence and is not automatically training-approved.
- **VIS-REQ-005:** Decorative UI transitions respect reduced motion; user-controlled football playback retains pause/seek. Verify normal-speed motion plus deterministic contact/fall frames; do not infer readability from DOM checks alone.
- **VIS-REQ-006:** Relevant unit tests, lint, typecheck and build pass after final changes. An independent read-only review records its scope, findings and limitations.

## Limits

No publication, scored attempts, backend/auth changes, deployment, purchased assets, new AI provider, or Git staging/commit/push. Do not modify `prompt.md`. Existing local playtest integration is outside implementation ownership until its current work is reconciled.

## Evidence

Baseline: `artifacts/refresh-before-home.png`, `artifacts/refresh-before-incident.png`, Chrome 1440x900 via Playwright CLI. Current neutral home is disconnected from available incident routes; authoring UI exposes a flat row of controls. Source inspection confirms minimal sine-cycle running and linear fall clips.
