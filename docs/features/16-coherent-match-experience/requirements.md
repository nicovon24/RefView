# Coherent match presentation and immersive controls

Task status is tracked only in `../../specs/tasks.md`. These acceptance requirements remain active until verified together; implementation evidence is recorded in `design.md`.

## Objective

Bring the playable field, stadium, referee view, and non-simulator site interface to one coherent visual standard. Keep the local simulator scene viewport-filling from arrival and let the user reveal interactive controls within that scene. Integrate a selected natural-proportion player rig only after the environment and interaction contract are stable.

## Acceptance

- **CME-REQ-001:** A repeatable daylight reference scene fixes camera, exposure, sky, light direction, actor scale, and representative ticks. Side-by-side first-person, third-person, goalward, contact, and authoring A/B captures judge the same candidate. Before graphics implementation, record the target device and browser at 1920 x 1080 and freeze a numerical frame-time budget; the provisional goal is median at most 16.7 ms and p95 at most 25 ms during the eight-second incident.
- **CME-REQ-002:** The 105 x 68 m field has verifiably correct markings and goal dimensions. Audit both penalty marks, penalty arcs, corner arcs, center mark, and line widths against the current IFAB Law 1 before changing its appearance. Preserve ball, boot, boundary, and contact readability.
- **CME-REQ-003:** Grass has near and broad-scale variation, filtered texture response, controlled roughness and normal detail, gentle mowing direction, and credible actor grounding without shimmer, visible tiling, or plastic shine at match speed.
- **CME-REQ-004:** The stadium reads as one enclosed football venue from the referee's eye height: convincing tier depth, stepped seating, coherent corners and concourses, structural roof, sky, restrained signage, and crowd LOD. Use shared geometry/instancing and measure cost on a named browser and device.
- **CME-REQ-005:** The implemented non-simulator routes use the prototype's typography, light navigation shell, hero hierarchy, action-button grammar, and responsive menu while keeping only real routes and truthful local-preview content. Spanish and English, keyboard focus, reduced motion, and mobile layout remain usable.
- **CME-REQ-006:** The playtest fills the viewport on entry. One user gesture requests native fullscreen and pointer lock; refusal keeps the viewport-filling fallback. Playing hides controls. A dedicated in-game menu action pauses the canonical tick, releases pointer lock, and reveals controls inside the fullscreen element; resuming reacquires needed capabilities. Escape, focus loss, completion, retry, and unsupported desktop/mobile states remain safe and explicit.
- **CME-REQ-007:** The authoring route also fills the viewport from entry, with review controls revealed on demand inside the scene. It remains distinguishable from play: A/B positions, tick transport, and elevated review remain available to the reviewer and never appear as ordinary player abilities.
- **CME-REQ-008:** A chosen player rig is auditioned at the reference scene's lighting and camera distance before canonical replacement. Integration uses one versioned tick for root, clip, blend, pose, rendered attachments, and occlusion. Recompute observation evidence and complete new A/B calibration, source/build identity, visual review, and performance acceptance before replacing the existing actors.

## Boundaries and evidence

The current local playtest is unsaved and unscored. Stadium and UI work must not change authored facts, ball/root tracks, event order, contact tick, decision keys, or scoring authority. Do not reuse past rendered approval for changed field, rig, camera, or renderer bytes. No copied prototype still, real team branding, licensed asset without provenance, paid purchase, publication claim, or deployment.

Use deterministic tests for geometry, tick/state transitions, and evidence boundaries; Playwright CLI for desktop/mobile, entry, menu, fullscreen refusal and recovery; fixed-tick WebGL captures plus normal-speed observation for visual acceptance. The current rigged audition is a completed *candidate comparison*, not an accepted replacement.
