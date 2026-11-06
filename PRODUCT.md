# RefView product definition

## Vision

RefView is a football refereeing platform that combines an immersive simulator, an academy for learning the Laws of the Game, a community for discussing refereeing performances, structured assessments, and an optional AI Coach.

The full product is the horizon. The first MVP proves that one authored 3D incident can be observed, decided, replayed, evaluated, and learned from in a desktop browser.

## Audience

Referees in training, practicing referees, fans, players, and coaches. The product must provide an approachable path for beginners and deeper evidence analysis for experienced users.

## Development order

The current delivery sequence is Academy, Assessments, the clearly fictional Community visual journey, and early Profile. The local 3D playtest and saved/scored first simulator incident come last. Academy currently focuses on original bilingual illustrated guides for all 17 Laws, deeper navigable topics, and official 2026/27 references. Nicolas deferred the lesson editorial/publication path while that rules experience is built. Its compatible practice link is completed when a real Assessment is published. Simulator history joins Profile once real owned attempts exist. Cosmetic simulator refinement follows functional acceptance; incident evidence defects still block training publication. This changes delivery priority, not the first MVP's acceptance criteria.

Profile and language preferences support every stage. Monetization is outside the first prototype; a meaningful free experience is required.

## First playable incident

The first incident is a clear case near the penalty-area boundary:

- An attacker is onside in the buildup.
- A defender carelessly trips the attacker just inside the penalty area.
- A covering defender prevents a denial-of-obvious-goal-scoring-opportunity interpretation.
- The reviewed outcome is a penalty kick with no disciplinary sanction.
- A good referee position exposes the decisive contact; a poor position produces genuine occlusion.
- The main referee starts with a stabilized camera behind the referee and can switch to first person. Camera distance and lateral framing must remain comfortable and must not alter authored incident facts.
- Replay, future assistant play, and future VAR work use the same canonical timeline.

Nicolas must review the football interpretation and visual evidence before the scenario is accepted as training content.

## Session evolution

The product starts with isolated authored situations, then composes them into configurable sessions:

- The user chooses role, target duration, topics, difficulty, rules edition, and competition settings.
- Early sessions use explicit, broadcast-style time jumps between authored sequences while preserving match state.
- Later sequences may involve more actors and several related decisions.
- A fully autonomous match is optional future research, not an MVP dependency.

## Learning model

RefView teaches the relationship between observable facts, rule application, referee interpretation, available evidence, and VAR intervention.

Score these dimensions separately:

- Decision quality.
- Observation and positioning.
- Communication.
- Protocol application.

A correct guess without decisive evidence must not receive a high observation score. Scenarios may be clear, interpretative, or inconclusive, and must use versioned facts, rubrics, competition settings, and IFAB references.

## AI Coach boundary

After an attempt, users may ask what they missed, why a sanction applies, whether VAR could intervene, what is interpretative, and what to practice next.

The Coach receives only permitted attempt evidence, curated facts, deterministic evaluation, and versioned references. Prepared responses remain available when no hosted provider is configured. The provider is replaceable and credentials remain server-side.

## Product journeys

- Simulator: choose role -> choose scenario or session -> briefing -> play -> decide -> debrief -> replay -> continue.
- Academy: browse original Law summaries -> explore a topic -> read a reviewed published lesson with example and precise rule reference -> ask a prepared follow-up -> open related published practice when available.
- Community: chronological feed of person-authored opinions about selected plays -> match conversation -> optional photo, file, or external link -> agreement/disagreement -> comments and replies. Fans and referees who self-report watching the match may separately rate the referee's performance in that match. Repository-authored posts and generated images remain visibly labeled examples. Actual uploads require a reviewed media contract; direct video file upload is outside the first social version.
- Assessments: choose practice -> answer or analyze -> reasoned correction -> targeted next practice.
- Profile: progress, attempts, saved content, preferences, and language.

## Current state

Product and technical planning are documented, and a bilingual interactive visual prototype exists under `docs/prototype/`. Its two football views are generated still concepts. The Next.js application includes bilingual illustrated guides to all 17 Laws, neutral referee controls, an authored WebGL incident review workspace, and an unsaved/unscored local incident playtest. Procedural motion and the review workspace were refined under RV-019. An approved training publication and complete user-facing saved/evaluated attempt flow do not exist yet.
