# RefView complete product prototype

This folder contains a bilingual, responsive HTML prototype for the complete RefView product. Spanish is the initial language. The simulator is intentionally field-first: its default concept camera sits behind the main referee and can switch to first-person with `C` or the visible camera control.

## Run

From the repository root:

```powershell
python -m http.server 4173 --directory docs\prototype
```

Open `http://127.0.0.1:4173` in a desktop browser. The simulator concept targets keyboard and mouse; the remaining application is responsive. The prototype has been checked in Playwright CLI at 1440 × 1000 and 390 × 844 in Chromium.

The same static files are copied into the Next.js application at `/prototype/index.html` for concept review. This copy is not an implemented simulator; this folder remains the source of truth.

## Implemented in this prototype

- Complete simulator journey: role → scenario → briefing → live camera concept → decision → debrief → illustrative VAR workspace → next scenario.
- Third-person and first-person visual camera states sharing one incident concept.
- Decision UI for play-on/stop, restart and discipline.
- Debrief separating proposed facts, interpretation, available evidence, rule reference and VAR threshold.
- Academy search across seven local topics. The Challenges example has a guided explanation, technical detail, reference and practice link; the other six topics are explicitly marked as previews without those materials.
- A fictional Community fixture with local demo rating, comment and voting interactions. Selecting the second match currently changes only the selector and toast; it does not load distinct rating or discussion data.
- Assessment answer, correction and recommended next practice.
- Profile progress and attempts as illustrative data. Saved links and preference controls currently illustrate layout and do not persist changes.
- Spanish/English switching across the principal interface, the scenario catalogue's supporting states, and prepared AI Coach responses. Some older incidental labels still need a complete language audit.
- Explicit catalogue demonstrations of loading, error, empty search, and planned-content states, each with recovery; none represents a network request.
- Local-only persistence for language, the demo community rating and the most recent prototype decision.

## Illustrated, not implemented as production capability

- The two football scenes are generated concept images. They demonstrate desired camera framing and visual ambition; they do not validate real-time 3D rendering, movement, animation, contact, physics, occlusion, player AI, sound or replay synchronization.
- Assistant-referee and VAR roles are not playable. VAR is a navigable workspace concept using two independent still views and a functioning demonstrative timeline; it does not prove replay synchronization.
- Evaluation values are deliberately not invented. Decision, observation, communication and protocol remain unvalidated or unmeasured.
- The incident interpretation is the current proposed RV-002 brief: penalty kick, no disciplinary card, no DOGSO, subject to Nicolás’s football and rendered-evidence review.
- AI Coach runs in clearly labelled prepared-response mode. No hosted provider is connected and it does not claim to inspect frames.
- Community matches, ratings and comments are fictional demonstration data.

## Visual direction

“Camera de partido” makes the live incident the product’s visual centre. Natural stadium colour and game-like framing carry the simulator; deep green-black chrome, off-white text, lime selection, turquoise referee cues and coral decision states form the RefView shell. During live play, only camera, time, communication, movement and decision controls remain. Outside live play, reading surfaces become light and restrained.

The initial user steer requested a more realistic, real-time 3D experience in first-person or a farther football-game camera instead of a dashboard. The prototype therefore defaults to third-person with a first-person toggle. The product and first-incident requirements now record that same starting direction; camera comfort and evidence visibility still require validation in a running scene.

## References

Inspected directly on 2026-11-02:

- [Premier League Player official page](https://www.premierleague.com/en/pl-player) and [official FAQ](https://www.premierleague.com/en/pl-player/faqs): official descriptions of first-person VR, crafted and matchweek moments, drills, free play, stadium presence and supported platforms. No hands-on build was tested.
- [THE REF official Steam listing](https://store.steampowered.com/app/4963360/THE_REF__Football_Referee_Simulator/): published claims for main referee, assistant, VAR, multi-camera reviews, signals and radio communication. No gameplay build was tested.
- [Football Referee Life Simulator 26 official Steam community page](https://steamcommunity.com/app/3917850/allnews/): developer-published match, VAR, career and city scope. No gameplay build was tested.
- [IFAB Laws of the Game 2026/27](https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en): source edition for the proposed incident, including Laws 12 and 14 and the VAR protocol.

RefView inferences:

- Short authored moments can concentrate quality on observable spatial evidence.
- A camera behind the referee can improve spatial clarity for beginners while first-person remains available for immersion and evidence restriction.
- The live scene should minimize interface chrome; the debrief should expose evidence, interpretation and rule application.
- None of the official marketing descriptions proves animation quality, camera comfort or gameplay fidelity. Those require a running 3D browser scene.

No reference branding, layout, footage, kits, teams, characters, stadium or broadcast package is copied. Asset origins and licenses are recorded in [`assets/README.md`](assets/README.md).

## Validation and limitations

- Browser flows verified: simulator path, camera toggle, decision completion, debrief timeline, VAR transport, Academy topic switch, Community rating, Assessment correction, AI Coach prepared answer and bilingual switching.
- Keyboard focus verified for view changes and AI Coach open/close; the Coach drawer contains focus while open and restores it to the opener.
- Final console check: zero errors and zero warnings.
- Responsive overflow checked across all principal views at 390 px and 1440 px.
- Reduced-motion mode disables entrance animation.
- Generated rasters carry embedded prompt provenance.
- This static prototype cannot test TDD contracts for the future engine, deterministic scenario playback, production answer secrecy, authentication, database ownership, network error handling, WebGL performance or actual rule evaluation.

## Current handoff

The Next.js application now has a shared site shell and local 3D incident previews. The static concept's scenario-state demonstrations remain separate from those real preview routes. Academy search is local to the seven illustrative topics; Community's second match and Profile's saved items/preferences are explicitly unavailable or illustrative. Before RV-018 can be fully verified, review all remaining incidental labels in both languages and complete the final design-guideline and journey audit. The training incident still needs its own rendered observation calibration and complete playable/scored workflow.
