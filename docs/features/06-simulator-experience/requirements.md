<a id="10-visual-motion-refresh"></a>

<a id="10-visual-motion-refresh--visual-and-motion-refresh"></a>
## Visual and motion refresh

Status is tracked only in `../../specs/tasks.md`.

<a id="10-visual-motion-refresh--objective-and-route"></a>
## Objective and route

Delegated, bounded visual refinement of the existing RefView identity. Improve the existing home, authoring workspace, and procedural player motion before continuing the saved/scored incident milestone. Preserve all pre-existing local changes. The user requested orchestration and substantial animation/site improvement on 2026-11-03. The user confirmed simulator-first with home/navigation improvements.

<a id="10-visual-motion-refresh--acceptance"></a>
## Acceptance

- **VIS-REQ-001:** Spanish and English home pages connect directly to the available incident preview and controls. Unimplemented product areas remain honestly described; no fabricated progress or scores.
- **VIS-REQ-002:** Home preserves the established pitch-led, green/lime identity while improving typography, hierarchy, navigation, responsive layout and keyboard focus. Desktop and 390px mobile captures show readable content without horizontal overflow.
- **VIS-REQ-003:** The authoring workspace gives the field visual priority, groups transport/camera controls, retains deterministic tick seeking, A/B presets, pass review, fullscreen, loading/error states, and explicit unsaved/unapproved status in both locales.
- **VIS-REQ-004:** Procedural animation improvements are deterministic and covered by tests before implementation. Canonical contact timing, positions, and reviewed football facts remain unchanged. Any altered pose geometry/source hash requires renewed visual evidence and is not automatically training-approved.
- **VIS-REQ-005:** Decorative UI transitions respect reduced motion; user-controlled football playback retains pause/seek. Verify normal-speed motion plus deterministic contact/fall frames; do not infer readability from DOM checks alone.
- **VIS-REQ-006:** Relevant unit tests, lint, typecheck and build pass after final changes. An independent read-only review records its scope, findings and limitations.

<a id="10-visual-motion-refresh--limits"></a>
## Limits

No publication, scored attempts, backend/auth changes, deployment, purchased assets, new AI provider, or Git staging/commit/push. Do not modify `prompt.md`. Existing local playtest integration is outside implementation ownership until its current work is reconciled.

<a id="10-visual-motion-refresh--evidence"></a>
## Evidence

Baseline: `artifacts/refresh-before-home.png`, `artifacts/refresh-before-incident.png`, Chrome 1440x900 via Playwright CLI. Current neutral home is disconnected from available incident routes; authoring UI exposes a flat row of controls. Source inspection confirms minimal sine-cycle running and linear fall clips.

---

<a id="11-player-model-refresh"></a>

<a id="11-player-model-refresh--procedural-player-model-refresh"></a>
## Procedural player model refresh

Status is tracked only in `../../specs/tasks.md`.

<a id="11-player-model-refresh--objective-and-route"></a>
## Objective and route

Bounded delegated SDD refinement of the seven visible incident players. Following RV-019, the user chose to continue with the established AI model allocation and the character work identified as the next visual priority. Preserve the existing RefView visual direction and all prior local changes.

<a id="11-player-model-refresh--acceptance"></a>
## Acceptance

- **MODEL-REQ-001:** Authoring preview and unsaved local playtest use one feature-local visual player construction contract. The same actor has the same kit, silhouette, and pose at the same canonical tick in both views.
- **MODEL-REQ-002:** Players have clearly human proportions and recognizable football clothing at first- and third-person incident distances. Yellow attackers, blue defenders, and the goalkeeper remain distinguishable. Contact boot and falling attacker stay readable in A; B still screens decisive contact.
- **MODEL-REQ-003:** Model presentation follows the authored rig's joints, segments, root position, yaw, and clip sample. Seeking the same tick produces the same pose; model-only changes do not alter authored timeline, evidence anchors, occluder boxes, contact ground, scoring, or source asset bytes.
- **MODEL-REQ-004:** The local playtest still starts, pauses and resumes without renderer errors, and mounted model geometry/materials are disposed on unmount. Do not add heavy textures, shaders, postprocessing, or runtime asset fetches.
- **MODEL-REQ-005:** Targeted tests cover construction/parity and exact tick application; lint, typecheck, build and relevant content/web tests pass. Playwright CLI screenshots and a brief normal-speed recording at A/B contact and fall receive visual inspection and independent read-only review.

<a id="11-player-model-refresh--limits"></a>
## Limits

The local player model is an original procedural visual, not a licensed external rig, mocap clip, AI-generated 3D asset, or claim of photorealism. Referee ghost, field, camera, decision flow, publication and persistence are outside this slice. The user has not approved training publication or saved scoring.

<a id="11-player-model-refresh--evidence-and-next-step"></a>
## Evidence and next step

Prior baseline: `artifacts/refresh-final-a-third-contact.png`, `refresh-final-fall-en.png`, `refresh-playtest-paused.png`. The current authoring JSX and imperative playtest separately construct cylinder/sphere/box players, which can drift. First freeze one visual-node contract and verify construction/parity before improving its geometry.

---

<a id="12-site-interface-refinement"></a>

<a id="12-site-interface-refinement--pitch-first-site-interface-refinement"></a>
## Pitch-first site interface refinement

Status is tracked only in `../../specs/tasks.md`.

<a id="12-site-interface-refinement--objective"></a>
## Objective

Substantially improve the interface of all implemented public routes, led by the authored 3D incident and local playtest. Make the field the focal point, make the next action obvious, and keep the RefView visual world consistent from home through simulator controls. The established field-ink/lime DESIGN.md direction remains authoritative. This is a local, unsaved, unscored prototype iteration.

<a id="12-site-interface-refinement--acceptance"></a>
## Acceptance

- **UI-REQ-001:** Spanish and English home, authoring, local playtest and neutral controls have a consistent brand/navigation pattern and honest route labels. Every visible route link resolves to an implemented destination; keyboard focus and the current route are visible.
- **UI-REQ-002:** At desktop 1440×900 and 1280×720, authoring places the incident field, tick/time, transport, A/B/camera and fullscreen controls in a clear hierarchy. Contact at tick 366 and fall at tick 386 remain readable in A; B retains meaningful screening. Playback, seek, pass review, first/third person, A/B and fullscreen still work.
- **UI-REQ-003:** Local playtest shows start/pause/resume/restart and current state without controls being hidden beneath the initial desktop viewport. Advanced camera sliders and diagnostics remain available but secondary. The local run still starts, pauses, resumes and restarts without changing canonical ticks or authority.
- **UI-REQ-004:** Neutral controls and home give the same clear path into the authored incident and local test, while accurately distinguishing a neutral movement preview, an authoring review and an unsaved playtest. Mobile routes have no horizontal overflow and make desktop-only input limits clear.
- **UI-REQ-005:** The interface has responsive layouts, legible labels, visible focus, loading/error/disabled states and reduced-motion behavior. Motion guides attention and never changes evidence or causes camera movement during canonical incident review.
- **UI-REQ-006:** No canonical asset, rig, clip, event, camera pose/FOV/near/far/DPR, observation, evaluation, scoring, persistence or publication contract changes. Tests, lint, typecheck, build, Playwright CLI browser checks and independent read-only review pass. New authoring renderer code requires renewed training evidence separately.

<a id="12-site-interface-refinement--evidence"></a>
## Evidence

Before captures: `artifacts/rv020-baseline-{home,incident,playtest,controls}.png` and mobile equivalents. Post-change command and visual evidence belongs in `review.md`.

---

<a id="13-immersive-playtest"></a>

<a id="13-immersive-playtest--immersive-local-incident-presentation"></a>
## Immersive local incident presentation

Status is tracked only in `../../specs/tasks.md`.

<a id="13-immersive-playtest--objective"></a>
## Objective

Make the unsaved local incident feel like a playable football scene from entry, while improving the authored scene's stadium context and all seven players' visual shape. The game should recede to a clean field during active play. This feature remains a local, unscored preview and does not approve training publication.

<a id="13-immersive-playtest--acceptance"></a>
## Acceptance

- **IMM-REQ-001:** On desktop, the local playtest opens with a viewport-filling scene, one clear bilingual entry action, concise controls and an unsaved/unscored disclosure. The entry gesture attempts fullscreen and mouse capture; browser denial has a playable, visible fallback. No site header, footer or separate toolbar competes with the field during setup or active play.
- **IMM-REQ-002:** During active play, buttons, sliders, tick counters and diagnostics are neither visible nor keyboard-focusable. A small noninteractive pause hint and local-preview label may remain. Escape, focus loss, hidden document, pointer release or fullscreen exit pause without advancing ticks while paused.
- **IMM-REQ-003:** Pause shows Resume, Restart, camera settings, fullscreen and return navigation within the fullscreen surface. Completion shows Restart and Return without a disabled Start action. Loading, render and browser-permission failures are recoverable in Spanish and English.
- **IMM-REQ-004:** Authoring and playtest render the same original procedural pitch environment: regulation goals at `z = ±52.5` with 7.32 m clear opening and 2.44 m height, visible subdued nets, perimeter runoff, stands and restrained stadium structure. No scene element intrudes into the playing field or changes the canonical incident. The goal is visibly inspectable by turning toward it; the canonical initial/A/B camera poses remain unchanged.
- **IMM-REQ-005:** All seven players use a noticeably smoother, more human-shaped silhouette and fixed shirt numbers attached to their jerseys. Matching actors have the same appearance and pose in both routes at the same canonical tick. A contact, B screening and the fall remain visually credible.
- **IMM-REQ-006:** Canonical timeline, tracks, event/fact/source assets, authored joint positions, evidence anchors, occluders, observation/evaluation/scoring, persistence and publication remain unchanged. Any local viewport aspect change is represented truthfully in the playtest view sample. Historic visual approvals are not reused.
- **IMM-REQ-007:** Focused deterministic tests, full package checks, Playwright CLI lifecycle/responsive/fullscreen checks, fixed-tick WebGL inspection, normal-speed motion review, measured rendering cost and independent read-only review pass. Record original-asset provenance and limitations.

<a id="13-immersive-playtest--limits"></a>
## Limits

No external rig, mocap, player likeness, real team/stadium branding, audio, scored attempt, physics adjudication, training publication or deployment. The neutral controls route and static concept are outside this scene-focused pass.

---

<a id="14-stadium-character-motion"></a>

<a id="14-stadium-character-motion--stadium-character-and-motion-refinement"></a>
## Stadium, character and motion refinement

Status is tracked only in `../../specs/tasks.md`.

<a id="14-stadium-character-motion--objective"></a>
## Objective

Make the authored incident and immersive local playtest feel like a readable football match in a populated stadium. Use the user-provided stadium screenshot as visual direction for enclosure, seating depth and natural turf, without copying cricket controls, branding, scoring or asset bytes. Preserve RefView's field-led, unsaved and unscored presentation.

<a id="14-stadium-character-motion--acceptance"></a>
## Acceptance

- **SCM-REQ-001:** At desktop play and authored A/B views, the shared original stadium visibly has two separated seating tiers, a concourse/aisle rhythm, dark structural depth, and a sparse, stable crowd. Architecture stays beyond the 105 x 68 m field and regulation goals remain at the authored goal lines.
- **SCM-REQ-002:** The shared field has a natural-green turf palette, gentle mowing contrast and fine stationary variation. Lines, ball and contact boots remain readable at ticks 120, 366 and 386. Normal-speed playback has no visible texture shimmer.
- **SCM-REQ-003:** All seven shared player models have more continuous human-shaped shoulder, torso and limb joins, retain kit separation and readable shirt numbers, and match between the authored and local routes at the same public tick. The third-person referee is no longer a stack of boxes.
- **SCM-REQ-004:** Existing original running, challenge and fall clips gain a clearer stance/swing and bracing rhythm. Rig ABI, protected evidence anchors and occluders, root/ball tracks, event timing and facts remain fixed. Transitions and settled poses are deterministic and visually inspected at normal speed.
- **SCM-REQ-005:** Local ready/pause/completion UI leaves more of the incident visible and maintains bilingual entry, recovery, settings, fullscreen and return paths. During active play there are no visible or focusable controls, tick counters or diagnostics. Desktop and unsupported mobile layouts remain honest.
- **SCM-REQ-006:** No observation, decision, scoring, persistence or publication authority changes. Changed source clip bytes and renderer candidate are recorded as a new visual candidate; previous rendered approval is not reused.
- **SCM-REQ-007:** Procedural resources are owned and disposed. Crowd geometry uses instancing or merging, with measured render calls, triangles, live texture objects and frame intervals on the named browser/device. Report texture source and mip-chain allocation separately as an estimate; browser APIs do not expose exact GPU texture memory.
- **SCM-REQ-008:** Focused deterministic tests, full package checks, Playwright CLI lifecycle/responsive checks, fresh fixed-tick A/B/pass/contact/fall/goalward captures, normal-speed motion inspection and independent read-only review pass after the final relevant edit.

<a id="14-stadium-character-motion--limits"></a>
## Limits

No copied reference pixels, licensed stadium/player assets, real team branding, scoreboard, crowd audio, cinematic camera shake, bloom, scored attempt, training publication or deployment. The incident remains a local authored preview until the separate evidence and approval gates complete.

---

<a id="15-rigged-football-presentation"></a>

<a id="15-rigged-football-presentation--rigged-football-presentation-candidate"></a>
## Rigged football presentation candidate

Status is tracked only in `../../specs/tasks.md`.

<a id="15-rigged-football-presentation--objective"></a>
## Objective

Replace the visibly segmented player motion with a credible, browser-efficient rigged football presentation and improve the pitch's material, grounding and lighting. Preserve the authored football interpretation while creating a newly calibrated visual/source candidate. Nicolas selected the existing audition characters on 2026-11-03 and directed their use in the simulator. They are the default in the unsaved local incident routes; the procedural authoring comparison remains available. This selection does not approve observation calibration or training publication.

<a id="15-rigged-football-presentation--acceptance"></a>
## Acceptance

- **RFP-REQ-001:** An isolated, noncanonical audition compares at least one generic humanoid asset and its actual idle, run, stop, turn, challenge and fall coverage at incident camera distance. Record source bytes, exact license, skeleton, dimensions, material/texture count, triangles, load size and missing actions before selecting a model.
- **RFP-REQ-002:** Seven players and the referee use a coherent athletic silhouette, numbered generic football kits, skinning and believable planted feet. Two actors can have different poses at the same tick; no knee stretching, obvious foot skating or transition snap is visible through the 355–386 challenge/fall sequence.
- **RFP-REQ-003:** A single canonical 60 Hz tick controls actor root, selected clip time, blend weights and final skeleton pose. Forward play, backward seeking, direct tick entry, pause/restart and repeat render the same pose; no free-running animation mixer or exported root drift changes actor tracks.
- **RFP-REQ-004:** The actual rendered rig/pose also supplies versioned attachment and occluder geometry. Preserve authored facts, event order, ball track and contact tick 366, but regenerate and review derived observation geometry over complete evidence windows. Historical RV-019D hashes and visual approval are not reused as approval of the new candidate.
- **RFP-REQ-005:** The field retains 105 × 68 m dimensions, regulation goals and markings. A short-grass material, controlled mowing variation, credible light/fill and restrained contact shadows improve ground contact without obscuring the ball, boots, penalty-area line or A/B screening.
- **RFP-REQ-006:** Both authored and local routes use the same versioned visual resources. Loading, failure/retry, asset ownership, source/public byte parity and renderer identity include every GLB, texture, lighting image and decoder actually required. No runtime license-ambiguous remote asset fetch is needed.
- **RFP-REQ-007:** Fixed-tick A/B first-/third-person, elevated pass, contact/fall and goalward captures, normal-speed WebGL inspection, deterministic tests, Playwright CLI lifecycle checks, performance measurements on a named browser/device and independent read-only review pass after the final relevant edit.

<a id="15-rigged-football-presentation--limits"></a>
## Limits

No real player likeness, club crest, sponsor, scoreboard, invented match facts, training-publication claim, purchase, deployment or reuse of historical procedural calibration as approval of the selected rigged candidate. A prettier skin over the old rig alone does not satisfy RFP-REQ-002 or RFP-REQ-004.

<a id="15-rigged-football-presentation--animation-quality-continuation-2026-11-04"></a>
## Animation quality continuation (2026-11-04)

Nicolas requested analysis and improvement of the active animations, players already running at a reasonable speed at the start, and a substantially better fall, asking whether the selected models must be replaced. The recommendation is to keep the selected rig and correct trajectory/gait synchronization and the authored fall. The old continuous-jog fall and slow opening are implementation defects, not evidence that the mesh must be replaced. Use proportional delegated SDD: coordinator freezes boundaries, Sol implements bounded paths, independent Sol reviews, and Playwright supplies fixed and moving visual evidence. Contract: `../../contracts/simulator-presentation.md#rigged-motion-refresh-v2`. RFP-REQ-002/003/004/007 are reopened where affected; historical diagnostic reports remain historical.

<a id="15-rigged-football-presentation--silhouette-refinement-2026-11-04"></a>
## Silhouette refinement (2026-11-04)

Nicolas asked for the selected footballers to look slightly less muscular. The athletic presentation should read as a lean football build at both audition close-up and incident camera distance, while the source silhouette remains available for comparison. The same adjustment must keep the cloned body and generated kit aligned, preserve player height and bind skeleton, and avoid seams or clipping during running, challenge and grounded fall poses. It is a presentation change under RFP-REQ-002, not a change to actor tracks, contact tick, ball, incident facts or scoring. Because posed meshes also supply diagnostic observation geometry, any previous rendered-surface hashes and calibration evidence require fresh binding after the final silhouette edit.

<a id="15-rigged-football-presentation--contact-pose-correction-2026-11-04"></a>
## Contact-pose correction (2026-11-04)

Paired A/B and low lateral review found that the selected defender left boot visibly merges with the attacker lower leg/boot near ticks 366–371. This reopens RFP-REQ-002, RFP-REQ-004 and RFP-REQ-007 for the contact window. The local candidate must keep an intact external boot-to-lower-leg meeting with deterministic defender-leg continuity and no change to canonical actor roots, ball, contact tick, facts or scoring. Full-part geometric clearance and clean normal-speed WebGL review are separate gates. Historical first-hit markers and negative fixed-axis separation do not approve the contact or measure penetration. The bounded implementation and evidence are specified in `../../contracts/simulator-presentation.md#rigged-contact-pose-correction-v1`; observation calibration and training acceptance remain open.

The rejected trial peak also creates an axial calf-frame discontinuity on recovery at tick 367. Before another pose candidate, replay the exact trial on the actual rig and isolate the frame-reference cause under `../../contracts/simulator-presentation.md#rigged-contact-axial-frame-v1`. This is diagnostic work under RFP-REQ-002/003; it does not relax the knee/boot continuity limits or complete RFP-REQ-004/007.

---

<a id="16-coherent-match-experience"></a>

<a id="16-coherent-match-experience--coherent-match-presentation-and-immersive-controls"></a>
## Coherent match presentation and immersive controls

Task status is tracked only in `../../specs/tasks.md`. These acceptance requirements remain active until verified together; implementation evidence is recorded in `design.md`.

<a id="16-coherent-match-experience--objective"></a>
## Objective

Bring the playable field, stadium, referee view, and non-simulator site interface to one coherent visual standard. Keep the local simulator scene viewport-filling from arrival and let the user reveal interactive controls within that scene. Integrate a selected natural-proportion player rig only after the environment and interaction contract are stable.

<a id="16-coherent-match-experience--acceptance"></a>
## Acceptance

- **CME-REQ-001:** A repeatable daylight reference scene fixes camera, exposure, sky, light direction, actor scale, and representative ticks. Side-by-side first-person, third-person, goalward, contact, and authoring A/B captures judge the same candidate. Before graphics implementation, record the target device and browser at 1920 x 1080 and freeze a numerical frame-time budget; the provisional goal is median at most 16.7 ms and p95 at most 25 ms during the eight-second incident.
- **CME-REQ-002:** The 105 x 68 m field has verifiably correct markings and goal dimensions. Audit both penalty marks, penalty arcs, corner arcs, center mark, and line widths against the current IFAB Law 1 before changing its appearance. Preserve ball, boot, boundary, and contact readability.
- **CME-REQ-003:** Grass has near and broad-scale variation, filtered texture response, controlled roughness and normal detail, gentle mowing direction, and credible actor grounding without shimmer, visible tiling, or plastic shine at match speed.
- **CME-REQ-004:** The stadium reads as one enclosed football venue from the referee's eye height: convincing tier depth, stepped seating, coherent corners and concourses, structural roof, sky, restrained signage, and crowd LOD. Use shared geometry/instancing and measure cost on a named browser and device.
- **CME-REQ-005:** The implemented non-simulator routes use the prototype's typography, light navigation shell, hero hierarchy, action-button grammar, and responsive menu while keeping only real routes and truthful local-preview content. Spanish and English, keyboard focus, reduced motion, and mobile layout remain usable.
- **CME-REQ-006:** The playtest fills the viewport on entry. One user gesture requests native fullscreen and pointer lock; refusal keeps the viewport-filling fallback. Playing hides controls. A dedicated in-game menu action pauses the canonical tick, releases pointer lock, and reveals controls inside the fullscreen element; resuming reacquires needed capabilities. Escape, focus loss, completion, retry, and unsupported desktop/mobile states remain safe and explicit.
- **CME-REQ-007:** The authoring route also fills the viewport from entry, with review controls revealed on demand inside the scene. It remains distinguishable from play: A/B positions, tick transport, and elevated review remain available to the reviewer and never appear as ordinary player abilities.
- **CME-REQ-008:** A chosen player rig is auditioned at the reference scene's lighting and camera distance before canonical replacement. Integration uses one versioned tick for root, clip, blend, pose, rendered attachments, and occlusion. Recompute observation evidence and complete new A/B calibration, source/build identity, visual review, and performance acceptance before replacing the existing actors.

<a id="16-coherent-match-experience--boundaries-and-evidence"></a>
## Boundaries and evidence

The current local playtest is unsaved and unscored. Stadium and UI work must not change authored facts, ball/root tracks, event order, contact tick, decision keys, or scoring authority. Do not reuse past rendered approval for changed field, rig, camera, or renderer bytes. No copied prototype still, real team branding, licensed asset without provenance, paid purchase, publication claim, or deployment.

Use deterministic tests for geometry, tick/state transitions, and evidence boundaries; Playwright CLI for desktop/mobile, entry, menu, fullscreen refusal and recovery; fixed-tick WebGL captures plus normal-speed observation for visual acceptance. The current rigged audition is a completed *candidate comparison*, not an accepted replacement.
