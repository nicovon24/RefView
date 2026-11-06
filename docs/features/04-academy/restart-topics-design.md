# Restart and boundary topic expansion

## Route and acceptance

This is a delegated SDD slice of RV-029B / ACA-REQ-009. Add six static bilingual topic guides: `kick-off-procedure` and `dropped-ball-procedure` under Law 8, `ball-in-and-out-of-play` under Law 9, and `throw-in-procedure`, `goal-kick-procedure`, `corner-kick-procedure` under Laws 15, 16, and 17. Each guide has three original explanatory sections with a nearby pinned 2026/27 source, a topic diagram, an illustrative photo, and the existing adjacent topic, language, and return navigation. The six established slugs and route shape remain stable. No database, lesson publication, assessment, real-play case, scoring, or AI provider is involved.

## Shared code contract

`law-depth-contract.ts` exports `TopicDepth`, which extends `LawDepth` with a stable slug. `restart-topic-content-v1.ts` exports `restartTopics202627: readonly LawTopic[]` and `restartTopicDepths: readonly TopicDepth[]`. `RestartTopicIllustration.tsx` exports `RestartTopicIllustration({ slug, locale })`, returning `null` for unknown slugs and accessible bilingual SVG for the six known slugs. The coordinator integrates these exports into the existing metadata, depth, illustration, and photo registries together. Unknown Law/slug combinations continue to return 404. Topic order continues to sort by primary Law then slug, so dropped ball precedes kick-off under Law 8.

`LawSourceRef.supplemental` permits a second edition-pinned PDF link when a section uses both a Law and a protocol. The Law 15/16 countdown explanations and the Law 17 delayed-goal-kick exception link directly to protocol pages 28–29 (ES) / 26–27 (EN) beside the relevant claims.

## Pinned source matrix

Nicolas's local Spanish IFAB 2026/27 single-page PDF has 276 physical pages. The official English 2026/27 single-page PDF has 260. The physical pages below match their printed page numbers. The live online Law pages can change edition, so route citations point to the edition-pinned PDFs.

| Topic | Spanish physical pages | English physical pages | Sections |
| --- | --- | --- | --- |
| Kick-off | 105–106 | 97–98 | Law 8.1 |
| Dropped ball | 106–107 | 98 | Law 8.2 |
| Ball in/out | 109 | 101 | Law 9.1–2 |
| Throw-in | 153–154 | 141–142 | Law 15.1–2 |
| Goal kick | 157–158 | 145–146 | Law 16.1–2 |
| Corner kick | 161–162 | 149–150 | Law 17.1–2 |

Official English source: `https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en`. Spanish application source: `https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es`. The delayed throw-in and goal-kick countdown procedure is further specified on Spanish protocol pages 28–29 and English protocol pages 26–27.

## Visual and content boundaries

- Kick-off: stationary centre ball, own halves except the kicker, opponents at least 9.15 m away, then kick and clear movement. Do not depict the pre-kick arrangement as already in play.
- Dropped ball: penalty-area drop to the defending goalkeeper; otherwise the team that would have retained or gained possession if determinable, or the team that last touched it. Other players remain at least 4 m away until ground contact. Show the falling-ball moment separately from the ball being in play. Do not imply the recipient must touch it first after ground contact.
- Boundary: the whole ball must pass the whole line. Partial overlap and full crossing are distinct. A referee's stoppage is a separate reason for the ball to be out. A rebound off a goal frame, match official or corner flag can leave it in play; match-official contact triggers a dropped ball only in the specified cases.
- Throw-in: two hands, behind and over the head, both feet partly on the touchline or ground outside, correct exit point, opponents at least 2 m away. The ball is in play when it enters the field. Delay countdown is triggered by unfair delay, not every throw-in.
- Goal kick: stationary ball anywhere in the goal area, opponents outside the penalty area until in play, then kick and clear movement. It need not leave the penalty area. Delay countdown is triggered by unfair delay, not every goal kick.
- Corner kick: nearest corner area, flag remains in place, opponents at least 9.15 m from the corner arc. Kick and clear movement make the ball live; it need not leave the corner area.
- Countdown consequences must distinguish transfer of a delayed throw-in from a corner awarded for a delayed goal kick. Do not add an automatic countdown to other restarts.

The existing Law photographs are context, never geometric proof. `dropped-ball.png` is an original generated scene specifically for Law 8's dropped-ball topic and must be labelled as such. All exact rule relationships are taught in bilingual text and diagrams. Do not embed IFAB artwork or copy extended rule text.

## Work split and review

After this shared contract, one Sol/medium implementer owns only `restart-topic-content-v1.ts` (metadata and 18 sections); another owns only `RestartTopicIllustration.tsx` (six diagrams). The coordinator owns registries, photo mapping, documentation, integration, and task status. The slice requires scoped type/lint checks, desktop/mobile Playwright CLI navigation and figure inspection, and independent Sol/high read-only review of source meaning, visuals, and integration. RV-029B remains in progress because many Laws still lack deep topics.
