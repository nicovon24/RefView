# Players, referee and match-time topic expansion

## Route and acceptance

This is a delegated SDD slice of RV-029B / ACA-REQ-009. Add six static bilingual topic guides: `substitution-procedure` and `players-and-extra-persons` under Law 3; `referee-authority-and-advantage` and `injuries-and-return-to-play` under Law 5; `periods-and-intervals` and `added-time-and-period-end` under Law 7. Each guide has three substantive bilingual source-linked sections, an original accessible technical diagram, contextual generated-photo presentation and existing sibling/adjacent/language navigation. All sixteen prior topic slugs remain stable. No lesson, assessment, scored incident, database or AI provider is involved.

## Shared code contract and ownership

`players-referee-time-topic-content-v1.ts` exclusively exports `playersRefereeTimeTopics202627: readonly LawTopic[]` and `playersRefereeTimeTopicDepths: readonly TopicDepth[]`, using existing shared types. `PlayersRefereeTimeTopicIllustration.tsx` exclusively exports `PlayersRefereeTimeTopicIllustration({ slug, locale })`: six original 720-by-400 bilingual accessible SVGs, `null` for unsupported slugs. The coordinator owns registry dispatch, photo mapping, existing Law 3 accuracy correction, documentation and tracker. Wrong Law/slug combinations remain unavailable. This is a delegated SDD route because source meaning, visual contracts and six independent guides warrant separate content/diagram ownership and read-only review.

Section outlines: Law 3 substitutions: allowances/opportunities, exit/entry, delayed departure; Law 3 people: player/substitute/official status, entry/interference, restart/goal consequences; Law 5 authority: decision limits, advantage, discipline after advantage; Law 5 injury: assess/stop, treatment/departure, permission and return timing; Law 7 periods: equal halves, intervals, abandonment; Law 7 added time: lost-time causes, announced minimum, penalty at period end. The content implementer must not introduce precise timings or exceptions beyond the verified sources below.

## Source matrix and discrepancy

The downloaded official IFAB 2026/27 single-page PDFs contain Law 3 at ES 63–70 / EN 59–65, Law 5 at ES 81–91 / EN 73–82, and Law 7 at ES 101–102 / EN 93–94. The time-limited substitution protocol appears at ES/EN 22–23; the off-field treatment and assessment protocol at ES 24–26 / EN 24–25. Law 12.4's disciplinary consequence after advantage appears at ES 129 / EN 120. Individual sections cite narrower exact pages, checked against the PDF before authoring. Spanish PDF: `https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es`; English PDF: `https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en`.

The official IFAB live 2026/27 Law 3 page includes an updated exception to the fewer-than-seven-player minimum for temporary dismissals and protocol one-minute absences, while the edition-labeled downloadable PDFs inspected here do not. Do not attribute that exception to PDF Law 3.1. The existing Law 3 general-guide sentence that states the minimum without qualification needs a narrow accuracy correction grounded in the official live page, with the edition-pinned PDF still identified as such. The live source may advance later and must be labeled as an online update rather than silently mixed into the PDF claims.

## Content and visual invariants

- Substitutions: competition-specific allowances are not universal; show exit then referee-authorized entry at halfway, completion on entry. The 2026/27 ten-second departure clock and one full running-minute wait for a late departing player have protocol-defined triggers/exceptions. Never depict treatment/safety as overridden by a timer.
- Extra persons: presence, interference, team-list status, timing and goal consequences differ. Do not teach that every extra person triggers a dropped ball or invalidates a goal.
- Referee: advantage is an assessed benefit over a few seconds, not a fixed stopwatch. Decision changes, restart and disciplinary timing remain distinct.
- Injury: serious injury, bleeding, treatment, removal, the 2026/27 one-minute off-field protocol and its exceptions must be kept separate. An injured player's return requires referee permission and a position determined by ball state; no automatic re-entry.
- Periods: normal equal halves and defined intervals differ from optional competition-authorized extra time. Abandonment is not simply a long stoppage.
- Added time: announced time is a minimum, may increase but not decrease; do not transfer a first-half timekeeping error to the second half. A pending or retaken penalty extends that period until the kick is complete.
- Existing generated photos are illustrative context, never proof of player status, interference, referee reasoning, injury treatment or elapsed time. The Law 5 card photo is suitable as general referee context; the injury topic needs an honest caption or dedicated image. Original diagrams must not copy IFAB artwork or show invented match evidence.

## Verification and review

Check all twelve ES/EN routes, three sections and nearby source links, Law 3/5/7 listings, sibling/adjacent/language navigation, wrong-Law 404, desktop/mobile layout, opened diagrams, keyboard access and console with Playwright CLI. Run final-code typecheck/scoped lint. Independent Sol/high read-only review checks source meaning, updated Law 3 caveat, diagrams and integration. RV-029B remains in progress until Laws 1, 2, 4 and 6 also receive topic guides.
