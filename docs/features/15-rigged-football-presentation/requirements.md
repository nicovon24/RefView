# Rigged football presentation candidate

Status is tracked only in `../../specs/tasks.md`.

## Objective

Replace the visibly segmented player motion with a credible, browser-efficient rigged football presentation and improve the pitch's material, grounding and lighting. Preserve the authored football interpretation while creating a newly calibrated visual/source candidate. Nicolas selected the existing audition characters on 2026-11-03 and directed their use in the simulator. They are the default in the unsaved local incident routes; the procedural authoring comparison remains available. This selection does not approve observation calibration or training publication.

## Acceptance

- **RFP-REQ-001:** An isolated, noncanonical audition compares at least one generic humanoid asset and its actual idle, run, stop, turn, challenge and fall coverage at incident camera distance. Record source bytes, exact license, skeleton, dimensions, material/texture count, triangles, load size and missing actions before selecting a model.
- **RFP-REQ-002:** Seven players and the referee use a coherent athletic silhouette, numbered generic football kits, skinning and believable planted feet. Two actors can have different poses at the same tick; no knee stretching, obvious foot skating or transition snap is visible through the 355–386 challenge/fall sequence.
- **RFP-REQ-003:** A single canonical 60 Hz tick controls actor root, selected clip time, blend weights and final skeleton pose. Forward play, backward seeking, direct tick entry, pause/restart and repeat render the same pose; no free-running animation mixer or exported root drift changes actor tracks.
- **RFP-REQ-004:** The actual rendered rig/pose also supplies versioned attachment and occluder geometry. Preserve authored facts, event order, ball track and contact tick 366, but regenerate and review derived observation geometry over complete evidence windows. Historical RV-019D hashes and visual approval are not reused as approval of the new candidate.
- **RFP-REQ-005:** The field retains 105 × 68 m dimensions, regulation goals and markings. A short-grass material, controlled mowing variation, credible light/fill and restrained contact shadows improve ground contact without obscuring the ball, boots, penalty-area line or A/B screening.
- **RFP-REQ-006:** Both authored and local routes use the same versioned visual resources. Loading, failure/retry, asset ownership, source/public byte parity and renderer identity include every GLB, texture, lighting image and decoder actually required. No runtime license-ambiguous remote asset fetch is needed.
- **RFP-REQ-007:** Fixed-tick A/B first-/third-person, elevated pass, contact/fall and goalward captures, normal-speed WebGL inspection, deterministic tests, Playwright CLI lifecycle checks, performance measurements on a named browser/device and independent read-only review pass after the final relevant edit.

## Limits

No real player likeness, club crest, sponsor, scoreboard, invented match facts, training-publication claim, purchase, deployment or reuse of historical procedural calibration as approval of the selected rigged candidate. A prettier skin over the old rig alone does not satisfy RFP-REQ-002 or RFP-REQ-004.

## Animation quality continuation (2026-11-04)

Nicolas requested analysis and improvement of the active animations, players already running at a reasonable speed at the start, and a substantially better fall, asking whether the selected models must be replaced. The recommendation is to keep the selected rig and correct trajectory/gait synchronization and the authored fall. The old continuous-jog fall and slow opening are implementation defects, not evidence that the mesh must be replaced. Use proportional delegated SDD: coordinator freezes boundaries, Sol implements bounded paths, independent Sol reviews, and Playwright supplies fixed and moving visual evidence. Contract: `../../contracts/rigged-motion-refresh-v2.md`. RFP-REQ-002/003/004/007 are reopened where affected; historical diagnostic reports remain historical.

## Silhouette refinement (2026-11-04)

Nicolas asked for the selected footballers to look slightly less muscular. The athletic presentation should read as a lean football build at both audition close-up and incident camera distance, while the source silhouette remains available for comparison. The same adjustment must keep the cloned body and generated kit aligned, preserve player height and bind skeleton, and avoid seams or clipping during running, challenge and grounded fall poses. It is a presentation change under RFP-REQ-002, not a change to actor tracks, contact tick, ball, incident facts or scoring. Because posed meshes also supply diagnostic observation geometry, any previous rendered-surface hashes and calibration evidence require fresh binding after the final silhouette edit.

## Contact-pose correction (2026-11-04)

Paired A/B and low lateral review found that the selected defender left boot visibly merges with the attacker lower leg/boot near ticks 366–371. This reopens RFP-REQ-002, RFP-REQ-004 and RFP-REQ-007 for the contact window. The local candidate must keep an intact external boot-to-lower-leg meeting with deterministic defender-leg continuity and no change to canonical actor roots, ball, contact tick, facts or scoring. Full-part geometric clearance and clean normal-speed WebGL review are separate gates. Historical first-hit markers and negative fixed-axis separation do not approve the contact or measure penetration. The bounded implementation and evidence are specified in `../../contracts/rigged-contact-pose-correction-v1.md`; observation calibration and training acceptance remain open.

The rejected trial peak also creates an axial calf-frame discontinuity on recovery at tick 367. Before another pose candidate, replay the exact trial on the actual rig and isolate the frame-reference cause under `../../contracts/rigged-contact-axial-frame-v1.md`. This is diagnostic work under RFP-REQ-002/003; it does not relax the knee/boot continuity limits or complete RFP-REQ-004/007.
