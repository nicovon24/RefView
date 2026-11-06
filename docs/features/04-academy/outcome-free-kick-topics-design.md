# Outcome and free-kick topic expansion

## Route and acceptance

This is a delegated SDD slice of RV-029B / ACA-REQ-009. Add four static bilingual topic guides: `goal-and-match-result` and `penalty-shoot-out` under Law 10; `free-kick-procedure` and `free-kick-distance-and-wall` under Law 13. Each guide contains three substantive source-linked sections, an original bilingual technical diagram, an illustrative generated photo with an honest observation cue, and the existing topic navigation. All twelve existing slugs remain stable. There is no database, lesson, assessment, scored incident or AI dependency.

## Shared code contract and ownership

`outcome-free-kick-topic-content-v1.ts` exclusively exports `outcomeFreeKickTopics202627: readonly LawTopic[]` and `outcomeFreeKickTopicDepths: readonly TopicDepth[]`. The four metadata entries and twelve sections use the current `LawTopic` and `TopicDepth` types without changing them. `OutcomeFreeKickTopicIllustration.tsx` exclusively exports `OutcomeFreeKickTopicIllustration({ slug, locale })`, producing a 720-by-400 accessible bilingual SVG for the four slugs and `null` for unknown slugs. The coordinator owns registry dispatch, photo mapping, documentation and tracker integration. Existing route validation continues to reject a slug under the wrong Law.

Section outlines: goal criteria / exceptional goal outcomes / match result; shoot-out eligibility and setup / sequence and winning condition / completion and offences; free-kick types and goal outcomes / placement and ball entering play / second touch; opponent distance / three-or-more-player wall / quick kicks and penalty-area exceptions. The Law 12 `indirect-free-kick` topic remains offence-focused; Law 13 teaches execution.

## Pinned source matrix

The Spanish and English IFAB 2026/27 single-page PDFs have been checked at these physical/printed pages. Links use the edition-pinned PDF URLs in `rules-directory-v1.ts`, not the advancing online Law pages.

| Coverage | Spanish pages | English pages |
| --- | --- | --- |
| Law 10.1–2 goal and match result | 111–112 | 103–104 |
| Law 10.3 penalty shoot-out | 113–115 | 105–107 |
| Law 13.1 free-kick types and goal outcomes | 141 | 131 |
| Law 13.2–3 procedure and sanctions | 141–143 | 131–133 |

English PDF: `https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en`. Spanish PDF: `https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es`. The Law 10.3 accidental double-touch clarification is described in the 2026/27 change summary on Spanish page 194 and English page 179; relevant topic text cites Law 10.3 directly.

## Content and visual invariants

- A goal needs the whole ball over the whole goal line, between posts and below crossbar, with no offence by the scoring team. A photograph alone does not prove validity.
- Shoot-out score is separate from match score. Equal-number comparisons govern early completion and sudden death. Do not imply all ten initial kicks are always taken. Clarify eligibility, equalising numbers, replacements and the new accidental double-touch consequence against Law 10.3.
- Direct and indirect free kicks have different goal outcomes. Indirect signal duration and omitted-signal consequences require the precise Law 13.1 wording. An own goal directly from either type yields a corner.
- A free kick begins with a stationary ball and is in play when kicked and clearly moving. Ordinary placement, goal-area exceptions, opponent distance, the three-defender wall threshold, and second-touch consequences must remain distinct.
- A quick kick intercepted by a nearby opponent differs from deliberate prevention of a restart. Do not transplant the conditional Law 15/16 delay countdown into Law 13.
- Illustrations are original bilingual teaching diagrams, not IFAB artwork or invented match evidence. Existing generated photos serve as context only. The shoot-out topic may reuse the Law 14 photo if its caption does not claim that the photographed penalty occurred in a shoot-out.

## Verification and review

Check all eight ES/EN routes, three sections and nearby source links, Law 10/13 listings, sibling/adjacent links, language switching, wrong-Law 404, desktop/mobile layout, opened SVGs and keyboard access with Playwright CLI. Run final-code typecheck and scoped lint. An independent read-only Sol/high review checks source meaning, diagrams and integration. RV-029B remains in progress because other Laws still need topics.
