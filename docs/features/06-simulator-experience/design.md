<a id="10-visual-motion-refresh"></a>

<a id="10-visual-motion-refresh--visual-and-motion-design"></a>
## Visual and motion design

<a id="10-visual-motion-refresh--direction-and-boundaries"></a>
## Direction and boundaries

Extend the existing DESIGN.md system. Home is an entry surface; simulator is an operational workspace where the field leads. Keep existing route contracts, locale validation, asset provenance, canonical timeline and authority boundaries. No replacement brand or external imagery is needed. Reuse bundled OFL fonts with their existing notices.

<a id="10-visual-motion-refresh--motion-thesis"></a>
## Motion thesis

- Focal moment: readable authored running, challenge and continuous fall on one canonical timeline.
- Continuity: selected camera/position and playback progress remain visible through repeated controls and fullscreen.
- Feedback: short color/underline transitions for navigation and controls; reduced-motion removes spatial decoration.
- Budget: no extra animation library or postprocessing; no new per-frame React state for visual polish. Deterministic sampling owns football poses; avoid wall-clock decorative player movement.

<a id="10-visual-motion-refresh--ownership"></a>
## Ownership

Coordinator owns these specs, tracker, integration and evidence. Home implementer owns home route, scoped home stylesheet and new home feature components only; cannot edit global styles, locale module or simulator. Animation assessment is read-only. Subsequent animation implementation must have explicit asset/hash ownership and test-first acceptance before dispatch. Review is independent and read-only.

<a id="10-visual-motion-refresh--risks"></a>
## Risks

Changing rig/clip bytes changes authored source identity and invalidates prior rendered approval for that candidate. Contact geometry must be rechecked. Local playtest work exists beyond older orientation notes; preserve it. Historical still captures remain historical and are never relabeled as current evidence.

---

<a id="11-player-model-refresh"></a>

<a id="11-player-model-refresh--player-model-design"></a>
## Player model design

<a id="11-player-model-refresh--direction"></a>
## Direction

Keep a restrained, original stylized footballer. Improve shoulder/waist shape, limbs, boots, hair and kit details enough to read at actual incident scale. Use standard Three.js geometry and materials already installed. The authored procedural rig still places every joint and segment. Rendering adds decorative surfaces to those nodes; it never creates football facts.

<a id="11-player-model-refresh--ownership-boundary"></a>
## Ownership boundary

A feature-local model factory creates the root, named joint/segment nodes, boots, and original kit details. Authoring and local playtest both instantiate it. The exact-scene adapter continues validating the public canonical frame and applies transforms only after validation. No source asset, hash, event, camera, C1/C2, scoring, database or global design contract changes. The coordinator owns specs, integration, browser evidence and tracker.

<a id="11-player-model-refresh--invariants-and-risk"></a>
## Invariants and risk

- Preserve existing `ActorSceneNodes` shape and exact-scene rejection paths, render ordering and tick ownership.
- Preserve joint positions and segment lengths from `samplePlayerGeometry`; cosmetic child meshes can move only as descendants of the authored nodes.
- New clothing volume must not materially expand actor silhouette through the reviewed contact region or make B's occlusion visually false. Inspect A/B at fixed tick 366 and the falling attacker at 386 plus normal-speed playback.
- Keep per-actor material/geometry ownership explicit; playtest cleanup disposes generated resources exactly once. Avoid module-wide shared Three.js resources that an individual scene could dispose while another scene uses them.
- An authoring renderer source edit changes the renderer fingerprint even with unchanged authored source bytes. Historic capture/approval remains historical and training attestation must be renewed separately.

<a id="11-player-model-refresh--alternatives-considered"></a>
## Alternatives considered

External GLTF/mocap assets would require license, coordinate and skeleton retargeting, and renewed evidence geometry. This bounded pass uses authored procedural geometry already wired to the canonical timeline. A fuller character pipeline can follow after the training flow is proven.

---

<a id="12-site-interface-refinement"></a>

<a id="12-site-interface-refinement--interface-direction-and-boundaries"></a>
## Interface direction and boundaries

<a id="12-site-interface-refinement--decision"></a>
## Decision

Extend RefView's established "Cámara de partido" visual language. The first viewport of the simulator is a field-led working surface: quiet, compact navigation; the 3D frame; one readable transport strip; grouped camera/position controls; and a precise state/provenance line. Home introduces the real incident instead of implying the neutral field is the incident. The playtest uses the same shell but keeps the field and immediate controls visible before optional adjustments. The neutral controls route remains explicitly technical.

<a id="12-site-interface-refinement--shared-presentation-contract"></a>
## Shared presentation contract

The coordinator owns a pure presentational `SiteHeader` in `apps/web/src/components/site/` with `locale`, `active` route and optional `title` props. It supplies one brand/home link, implemented home/incident/playtest/controls navigation and locale-preserving language links. Its CSS may define shared color/spacing primitives, but must not import fonts or external assets. The existing home keeps its bundled licensed display/body fonts; operational simulator routes keep system fonts because introducing font URLs into authoring CSS previously broke renderer asset-closure tests. Feature CSS owns route-specific workspaces and states.

<a id="12-site-interface-refinement--invariants-and-risk"></a>
## Invariants and risk

- Preserve all simulator facts and 3D evidence geometry. Presentation overlays and labels cannot mask decisive contact at reviewed A/B ticks; compare fixed-tick screenshots before and after.
- Do not change the canonical frame source or playtest controller. Do not present an unsaved local run as a published or evaluated attempt.
- At 1280×720, leave enough vertical room for immediate playtest controls. Use actual viewport measurements rather than only DOM presence.
- Mobile authoring may offer review controls, but local playtest and neutral WASD controls remain desktop-only. Their mobile state must be useful and truthful.
- Reduced-motion preference removes decorative transitions; it does not alter authored animation or tick cadence.
- Shared header integration changes UI render source and requires renewed source/build/capture evidence before training publication.

<a id="12-site-interface-refinement--alternatives"></a>
## Alternatives

A new visual identity or static prototype-wide rebuild would discard settled design work and expand into illustrative future features. This iteration improves the four implemented routes. New scoring, publishing, AI Coach, external imagery and licensed UI assets are excluded.

---

<a id="13-immersive-playtest"></a>

<a id="13-immersive-playtest--immersive-scene-and-rendering-contract"></a>
## Immersive scene and rendering contract

<a id="13-immersive-playtest--direction"></a>
## Direction

The local playtest is an Experience surface: field first, minimal guidance while playing, controls only when needed. Its first deliberate entry action requests mouse capture before fullscreen in the same user gesture, without awaiting either before the second request. Fullscreen is best effort. An explicit entry-pending state prevents the controller from starting until the final canvas layout/aspect and permission outcome settle. The ready controller must be created from that actual aspect; existing `setViewport` is valid only after a run starts. Fullscreen exit pauses even if the aspect does not change. Pointer/fullscreen denial retains bilingual recovery and a playable inline fallback.

The authoring route remains the inspection workspace with transport, tick and A/B controls. IMM-REQ-002 supersedes RV-019B's immediate-button visibility only while the local run is actively playing; setup and pause keep actions accessible. Do not modify the canonical camera or incident timeline to stage the goal. From the current initial yaw, the far goal is outside the field of view; a goalward browser capture proves its authentic placement and visibility when the user turns.

<a id="13-immersive-playtest--shared-procedural-environment"></a>
## Shared procedural environment

A feature-local environment factory owns its geometries/materials and returns a root plus its background/fog/light configuration for both scene adapters. Use existing public 105 x 68 m field dimensions and explicit 7.32 x 2.44 m goal dimensions from the authored competition fixture. Place posts on the goal lines at `z = ±52.5` without altering penalty lines. Nets, runoff, perimeter boards and low-detail stands remain outside play. Use deterministic geometry, restrained colors, stable light and bounded draw calls; no external assets, per-seat mesh loops, live crowd, shadows or postprocessing. Each mounted scene disposes only its owned resources.

<a id="13-immersive-playtest--shared-player-appearance"></a>
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

<a id="13-immersive-playtest--evidence-and-risk"></a>
## Evidence and risk

New renderer code changes the candidate fingerprint even though source bytes remain fixed. Reinspect public tick 120 pass, A/B first- and third-person tick 366, A tick 386 fall and normal-speed motion through tick 480. Measure fullscreen canvas/DPR and bounded performance on the named browser/device. Exact source/build/capture binding, training approval and saved/scored acceptance remain RV-008/RV-011 work.

---

<a id="14-stadium-character-motion"></a>

<a id="14-stadium-character-motion--shared-stadium-and-protected-motion-contract"></a>
## Shared stadium and protected motion contract

<a id="14-stadium-character-motion--direction"></a>
## Direction

A bright, readable football pitch sits inside a darker stylized stadium bowl. Two seating tiers, a concourse gap, aisle breaks and sparse original spectator color patches create depth; the stadium does not compete with the ball, players or penalty-area line. Turf has fixed, seeded fine variation and restrained mowing bands. Keep RefView's green/lime identity and existing unsaved-preview language. The active-play HUD stays minimal; ready and pause controls can move to a compact side composition.

The supplied screenshot is inspiration for atmosphere and relative scale only. All new geometry, textures and animation are original procedural source in this repository. No external asset license is introduced.

<a id="14-stadium-character-motion--authority-and-frozen-evidence"></a>
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

<a id="14-stadium-character-motion--ownership-and-cost"></a>
## Ownership and cost

The shared environment factory owns any texture, geometry, material and crowd batch and disposes them on unmount. Keep goals and playing markings in their present coordinates; place stands and roofs outside runoff. Seed static variation so screenshots at the same camera/tick remain stable. Do not add per-spectator meshes or time-varying light. Tune grass, sky/fog and direct light together, and measure actual renderer calls/triangles/memory at 1280x720 and 1440x900.

The player factory retains `ActorSceneNodes` names, parenting, public handle/number map and authored pose application. Improve mesh envelopes without relocating joints or boot centers. A shared original referee presentation factory replaces the duplicate block construction in both adapters; the coordinator owns those adapters and will verify unchanged camera placement/transparency policy. The fixed rig limits anatomical realism and foot-slide correction.

<a id="14-stadium-character-motion--evidence"></a>
## Evidence

Use the prior RV-019C captures only as a before image. New acceptance requires current A/B first- and third-person tick-366, tick-120 pass, tick-386 fall, goalward local play, normal-speed 345–480 motion, local lifecycle/recovery and performance captures. The source candidate remains draft until separate trusted build/capture binding and Nicolas's training approval.

---

<a id="15-rigged-football-presentation"></a>

<a id="15-rigged-football-presentation--rigged-players-and-football-pitch-direction"></a>
## Rigged players and football pitch direction

<a id="15-rigged-football-presentation--selected-audition-integration"></a>
## Selected audition integration

Nicolas selected the players currently visible at `/es/simulator/player-audition` for the simulator: "los q estan aca deberian ser los jugadores que uso". Use that Quaternius athletic variant, face, hair, generic kit and numbering in both local routes. This supersedes the earlier silhouette rejection. The alternative regular-proportion substitution was interrupted without implementation changes; its research remains historical.

The delegated SDD integration follows `../../contracts/simulator-presentation.md#rigged-presentation-candidate-v1`: shared instance ownership, verified local resource closure, absolute 60 Hz skeletal sampling, then both route adapters. Preserve authored roots, ball, facts, event order and contact tick. Challenge/fall constraints must be checked against the actual posed players, rather than assuming the historical procedural contact point still matches the skin. Final diagnostic positions do not confer observation scoring or training approval.

The user requested Astra xhigh planning and Sol high or medium implementation. Planning task `player_plan` requested `gpt-6-astra` / `xhigh`; implementation tasks `regular_player` and `player_resources` requested `gpt-6-sol` / `high`. Runtime-confirmed identity is `unconfirmed`. Tool acknowledgements and returned handoffs establish the work, not the effective model. The coordinator owns the shared contract, integration seam, configuration, fingerprint membership and evidence. Acceptance includes TDD for deterministic sampling/ownership, browser failure/retry and lifecycle checks, fixed-tick and normal-speed visual inspection, performance and independent review.

The additional diagnostic geometry sampler is specified in `../../contracts/simulator-presentation.md#rigged-diagnostic-geometry-v1`. It uses the same posed selected meshes, triangle regions and explicit bone/surface landmarks across all 54 current evidence ticks, with independently reviewed identity ownership. It is deliberately separate from existing observation scoring and publication. A measured defender toe discontinuity at tick 359 remains open motion work.

<a id="15-rigged-football-presentation--visual-direction"></a>
## Visual direction

Aim for an athletic, recognizable footballer rather than photorealism: coherent shoulder/hip volume, continuous jersey/short silhouettes, anatomically stable knees and ankles, generic team colors and readable back numbers. Motion quality takes priority over facial detail. The pitch should remain the brightest evidence surface inside the darker stadium: short maintained grass, quiet broad mowing bands, subtle roughness/normal response and localized grounding beneath boots. Preserve crisp field lines and the actual regulation goal locations. Avoid dense blade geometry, heavy depth of field, bloom, stadium advertising or camera shake.

<a id="15-rigged-football-presentation--asset-decision-and-provenance"></a>
## Asset decision and provenance

Audition assets before committing to a production source. [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html) lists rigged glTF humanoids around 13k triangles and compatible [Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html) locomotion. These are generic bodies, not finished football kits or verified tackle/fall clips. Its older pack pages still say CC0, while the [current Quaternius Asset License](https://quaternius.com/license.html), updated 2026-08-28, permits incorporation into products but restricts standalone asset redistribution. Inspect the exact downloaded pack license and the intended repository/public delivery model before using it. Do not label a new download CC0 based only on its legacy page.

[Adobe Mixamo's FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) confirms free Adobe-ID access and royalty-free characters/animations in games; it is a motion/rigging audition source, not evidence that a football challenge clip fits the authored contact. [Kenney's character/animation guidance](https://kenney.nl/knowledge-base/game-assets-3d/importing-characters-and-animations) and [CC0 policy](https://kenney.nl/support) provide a low-risk fallback, but its stylized look must be judged against the requested less-toy-like direction. [Poly Haven's license](https://polyhaven.com/license) confirms CC0 for field material/environment candidates. Select only a visually suitable short turf source; its generic [sparse grass material](https://polyhaven.com/a/sparse_grass) is a test candidate, not an automatic football-pitch choice. Record original URL, author, license file/version, download date, SHA-256 and transformations for every selected external byte. The isolated Quaternius Standard audition assets have since been downloaded with exact CC0 files and hashes; see `audition.md`. Those selected resources now drive the local incident presentation. The canonical authored football source and training approval remain unchanged.

<a id="15-rigged-football-presentation--source-and-rendering-contract"></a>
## Source and rendering contract

The current `asset-001.mjs` computes joints, evidence attachments and occluders from one procedural pose. Its variable limb lengths and asymmetric ankle offsets explain why merely attaching a GLB skin cannot deliver credible locomotion. The original incident loader imported only four `.mjs` modules. The selected candidate now adds a fixed 14-file verified resource manifest and dependency-closed loader; renderer fingerprints explicitly include those bytes. Arbitrary GLB, HDR or decoder bytes are still unsupported and must not be fetched outside that closure.

In the audition, a self-contained GLB with embedded textures limits dependencies. For the candidate, clone the skinned skeleton once per actor, share immutable geometry/textures and clone only kit-specific materials. A canonical tick samples absolute clip time and deterministic blends; do not run an independent `useAnimations` clock for the authored incident. The same offline-baked or otherwise exactly reproducible pose drives rendered bones and geometry-derived attachments/occluders. Exported root motion must not override canonical actor roots. [Three.js AnimationMixer.setTime](https://threejs.org/docs/pages/AnimationMixer) supports exact-time evaluation; use it only with an ownership model that remains deterministic during seek and repeated mounts. Add decoder/compression dependencies only if measured benefit justifies their source closure.

The pitch pass is independent of the rig audition but shares final WebGL review. Keep field geometry, markings, goal dimensions and ball/boot contrast fixed. Start with a bounded PBR grass material and fixed UV/mip behavior, controlled direct/fill light and one incident-region shadow budget; measure on current target hardware before adding full-stadium shadows. Preserve static instanced spectators and dark stands.

<a id="15-rigged-football-presentation--evidence-and-tradeoffs"></a>
## Evidence and tradeoffs

Preserve canonical football facts, event order, actor root tracks, ball track and contact tick as design targets. A new skeleton and clips can change visible contact, head/torso anchors and screening. Therefore recompute those derived values, rerun A/B calibration and get new human visual approval; do not assert the old protected sample hashes still apply. Keep the current RV-019D scene available until the replacement passes this gate. The tradeoff is a larger one-time integration and review cost in exchange for a real gain in fluency instead of a cosmetic mesh swap.

---

<a id="16-coherent-match-experience"></a>

<a id="16-coherent-match-experience--direction-and-contracts"></a>
## Direction and contracts

<a id="16-coherent-match-experience--starting-baseline"></a>
## Starting baseline

RV-019C/D already provided a viewport-filling local playtest, one-click pointer-lock/fullscreen entry, hidden playing controls, and a shared two-tier stadium. At the start of this feature, `environment.ts` used one seeded 256 x 256 grass color texture, mostly unlit stand/crowd materials, box spectators, and no cast/receive shadow configuration for field contact. The authoring route had persistent review controls below its scene. RV-019E's Quaternius audition is separate; its superhero shoulder shape and in-place locomotion make it unsuitable for unqualified canonical promotion. Exact asset origin and rights are recorded in its `audition.md`.

Planning captures: [current local playtest](../../../artifacts/plan-current-playtest.png), [current authoring view](../../../artifacts/plan-current-authoring.png), [current home](../../../artifacts/plan-current-home.png), and [prototype home](../../../artifacts/plan-prototype-home.png). The prototype football image is a generated still; it is a composition reference, not evidence of implemented real-time graphics.

Playwright CLI confirmed the existing entry gesture set both `document.fullscreenElement` and `document.pointerLockElement` in the local Chromium session and left zero stage buttons while playing. Pressing `m` had no effect. Pressing Escape released pointer lock and displayed two stage buttons while remaining fullscreen in that browser session; other browsers may exit fullscreen on Escape, so the new dedicated menu action must preserve it without relying on browser-specific Escape behavior.

<a id="16-coherent-match-experience--visual-and-interaction-direction"></a>
## Visual and interaction direction

Use a single daylight/exposure reference before refining independent assets. The field should be the clearest evidence surface; the stadium gives depth and atmosphere without reducing visibility of the penalty-area boundary or challenge. Improve light, grass scale, and contact shadows before adding seating complexity. Then replace the box-like crowd read with restrained near/far representations. Avoid bloom, heavy depth of field, camera shake, or per-spectator animation as a substitute for believable structure.

Bring the non-simulator shell closer to `docs/prototype/index.html`: light header, Barlow Condensed headlines, Source Sans 3 body, lime primary and bordered ghost action, football-led hero, compact status card and responsive navigation. The prototype's generated still, statistics, upcoming sessions, Academy, Community, and Assessments are illustrative; current implementation must not present them as available or earned. Centralize button and surface tokens rather than duplicating them across routes.

Treat viewport fill, browser fullscreen, pointer capture, and control visibility as separate states. Browser fullscreen and pointer lock require transient user activation, so navigation alone cannot guarantee native fullscreen. The stage can always occupy `100vw x 100dvh`. From its entry gesture, request pointer lock before fullscreen. During active play, use a dedicated menu shortcut such as `M` to pause and open controls *inside* the stage while retaining fullscreen; keep `Escape` as a browser-compatible safety exit. A resumed session reacquires pointer and, if necessary, fullscreen from the resume click. Interactive panels release pointer lock so the camera cannot move while selecting a button. Do not silently advance the authored tick behind a menu.

Keep play and authoring workflows separate. The authoring view also starts with a viewport-filling stage and places transport and A/B controls in a revealable drawer over it, clearly labeled as review tools. The player-facing menu contains only usable play, camera, accessibility, restart, exit, and local-preview status controls.

<a id="16-coherent-match-experience--geometry-and-integration-gates"></a>
## Geometry and integration gates

At the current 105 m length, goal lines sit at `z = +/-52.5`; the positive penalty mark belongs 11 m from its goal line, not at `z = 36` where the current single marker is placed. Audit the complete markings before any visual overlay. Source: [IFAB Law 1](https://www.theifab.com/laws/latest/the-field-of-play/). Browser behavior: [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) and [Pointer Lock](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock).

Field/stadium and site-shell work can proceed independently after the reference-scene and interaction contracts are fixed. Candidate player selection can run in parallel as an isolated audition. Canonical actor integration waits for all three: stable environment, accepted rig, and versioned resource/pose bindings. Replacing a procedural actor demands deterministic 60 Hz pose sampling and fresh evidence geometry; a rendered mesh alone cannot establish observation parity.

Track GLB, texture, illumination resource and decoder provenance, byte hashes, and runtime ownership. Measure draw calls, triangles, texture allocation estimate and frame intervals in the named target device before adopting a higher-detail stadium or postprocessing.

<a id="16-coherent-match-experience--orchestration-record"></a>
## Orchestration record

Read-only direction requested `gpt-6-astra` with `xhigh`; runtime-confirmed identity: unconfirmed. Independent current/prototype UI inventory requested `gpt-6-sol` with `high`; runtime-confirmed identity: unconfirmed. Both returned read-only findings. The coordinator inspected the live home, authoring and playtest screens with Playwright CLI and compared the local prototype. Nicolas subsequently authorized implementation.

<a id="16-coherent-match-experience--implementation-history"></a>
## Implementation history

The shared field now includes both 11 m penalty marks, 9.15 m penalty arcs, the centre mark, four 1 m corner arcs and four 1.5 m corner flagposts. The positive mark had been incorrectly placed at the penalty-area boundary. The positions are asserted in `environment.test.ts` against [IFAB Law 1](https://www.theifab.com/laws/latest/the-field-of-play/). A red test exposed the missing centre mark before the geometry edit; the geometry suite subsequently passed 9/9.

The reference device is Windows 10, AMD Radeon RX 6700 XT with Chrome Headless 156 (ANGLE Direct3D11), 1920 x 1080. Fixed authoring tick 366 behind the referee is the first reference camera. The frozen provisional budget is median <= 16.7 ms and p95 <= 25 ms over an eight-second requestAnimationFrame sample after 500 ms warmup. Before turf/light edits the sample was 481 intervals, median 16.7 ms, p95 16.9 ms and zero intervals over 25 ms. With a repeating 3.5–4 m seeded turf tile, gentler mowing tones, actor and goal cast shadows, field receive shadows, and 2048 shadow map enabled, the same view measured 481 intervals, median 16.7 ms, p95 16.9 ms and zero over 25 ms. This is a browser-frame proxy, not a GPU timing measurement; normal-speed play, other cameras and the final stadium still require acceptance.

Visual comparison: [marked baseline](../../../artifacts/cme-field-marks-366.png) and [turf/light candidate](../../../artifacts/cme-field-light-366.png). The latter visibly grounds actors with shadows and removes the stretched grain of the previous full-stripe UV scale. A shared static environment suite, player-model suite and entry-flow suite passed 20/20 after those edits; web typecheck and scoped ESLint passed. Native fullscreen still depends on a user gesture.

The product shell and immersive interaction slices were requested from `gpt-6-sol` with `medium`, runtime-confirmed identity unconfirmed. The shell uses live neutral-field imagery, real links, responsive navigation and common actions; Playwright CLI checked desktop, mobile, menu, locale, focus and reduced motion. The playtest's `M` menu pauses the canonical tick within fullscreen, releases pointer and reacquires both on resume; authoring fills the viewport and reveals review controls on demand. A read-only `gpt-6-sol`/`high` review found that the authoring skip link targeted hidden controls. It now opens and focuses the panel; a targeted browser re-review passed. Runtime-confirmed reviewer identity: unconfirmed.

The bounded stadium slice was requested from `gpt-6-sol` with `medium`, runtime-confirmed identity unconfirmed. It adds instanced seating treads, continuous roof/corner structure, neutral trim, and sparse distributed head silhouettes on top of the existing four deterministic crowd color batches. No external stadium asset was added. A read-only `gpt-6-sol`/`high` review identified a 5.275 m corner-to-roof opening, clustered crowd heads, a shadow-map disposal leak, and ungrounded ball rendering. Red geometry/resource tests reproduced the first three; the corner volume now reaches the roof, heads sample across both sides, the shadow is disposed exactly once, and the ball casts a shadow in both scene consumers. Targeted final-code read-only re-review passed the bounded candidate; runtime-confirmed reviewer identity: unconfirmed. See `review.md` for evidence and remaining limitations.

The earlier bounded stadium candidate screenshots were [behind the referee at tick 366](../../../artifacts/cme-stadium-corners-366.png), [A third person](../../../artifacts/cme-final-a-third-366.png), [A first person](../../../artifacts/cme-final-a-first-366.png), [B first person with goal](../../../artifacts/cme-final-b-first-goal-366.png), and [live play near contact](../../../artifacts/cme-final-playtest-live.png). Before the last stadium/grass pass, the authoring fixed view at 1920 x 1080, DPR 1, sampled 481 rAF intervals: median 16.7 ms, p95 16.9 ms, p99 17.3 ms, zero over 25 ms. A 7.6-second normal-speed playtest sampled 439 intervals: median 16.7 ms, p95 16.8 ms, p99 17.2 ms, zero over 25 ms. A temporary WebGL2 wrapper counted 529 draw calls and 95,032 triangle submissions per frame including shadows. These historical measurements do not verify the final edit.

<a id="16-coherent-match-experience--final-rv-019f-environment-and-interaction-evidence"></a>
## Final RV-019F environment and interaction evidence

The final shared scene adds an original seeded 256 x 256 turf albedo, normal and roughness set. The three filtered maps use a common 4 x 3.5 m tile and preserve each mowing stripe's field scale. Standard materials keep high roughness and mild normal response. A camera-following daylight sky is visible through the open roof, with stepped upper-corner seating and a concourse bridge closing the former bright corner slit. The four static body-color batches remain, while head detail is compacted by camera distance. All geometries, materials, textures, instanced buffers and the sun shadow resource are disposed once. No external stadium, sky or grass asset is used.

The frozen reference is still HeadlessChrome 156 on Windows 10 / AMD Radeon RX 6700 XT at 1920 x 1080, DPR 1, fixed 50-degree camera and 1.1 m near / 160 m far planes; authoring tick 366, A behind the referee, is the primary comparison. The pinned Three/R3F renderer default exposure is 1.0. Both routes share the sky, sun, hemispheric fill, actors and pitch. [Final A third-person contact](../../../artifacts/cme-final-2026-a-third-contact.png), [A first-person contact](../../../artifacts/cme-final-2026-a-first-contact.png), [B first-person goalward contact](../../../artifacts/cme-final-2026-b-first-goal-contact.png), [A before contact at tick 355](../../../artifacts/cme-final-2026-a-third-before.png), [A fall at tick 386](../../../artifacts/cme-final-2026-a-third-fall.png), and [elevated pass at tick 120](../../../artifacts/cme-final-2026-elevated-pass.png) are final-code 1920 x 1080, DPR 1 Playwright CLI captures. [Live approach](../../../artifacts/cme-final-2026-playtest-approach.png), [live contact](../../../artifacts/cme-final-2026-playtest-contact.png), and [live fall](../../../artifacts/cme-final-2026-playtest-fall.png) were captured during normal-speed playback. The ball, contact and penalty boundary remain legible in A; B shows a poorer goalward line of sight. The sky/corner join is continuous in these fixed views. An additional [eight-frame forward-motion sheet](../../../artifacts/cme-grass-motion-contact-sheet.png), sampled about 220 ms apart, shows matte turf without obvious shimmer, glitter or tiling in that path; it is not an exhaustive 60-Hz or all-camera analysis.

After the last environment edit, `playwright-cli -s=rvfield run-code --filename=artifacts/cme-frame-sample.js` sampled 481 intervals at A third: 16.7 ms median, 16.9 ms p95, 17.0 ms p99, zero over 25 ms. The same command at B first measured 16.7 ms median, 16.8 ms p95, 17.0 ms p99, zero over 25 ms. A normal-speed local run using `artifacts/cme-playtest-frame-sample.js` sampled 424 intervals: 16.7 ms median, 16.8 ms p95, 33.3 ms p99, six over 25 ms; it still meets the frozen median/p95 budget. The A third WebGL2 wrapper recorded 532 draw calls and 95,790 triangle submissions per frame over 180 frames including shadows. These are browser-frame/API proxies, not GPU timings. The final web gate passed 87/87 tests, typecheck, lint and optimized Next build. Playwright confirmed the `M` menu held tick 34 for 500 ms inside native fullscreen while releasing pointer lock, then resumed with both fullscreen and lock; mobile playtest showed the explicit unsupported-controls route and mobile authoring remained viewport-filling. Independent read-only Sol-high review accepted CME-REQ-001..007. The sparse crowd and upper enclosure remain stylized; the natural-proportion rig and renewed training attestation are RV-019E/RV-008 work.
