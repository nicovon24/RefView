<a id="04-academy"></a>

<a id="04-academy--academy-design"></a>
## Academy design

This file consolidates the Law-guide and topic design slices. Requirements and task status remain in `requirements.md` and `../../specs/tasks.md`; asset provenance remains in `academy-photo-assets.md`. Earlier slice descriptions below record the contracts used at the time, not a second current-status tracker.

<a id="04-academy--law-guides"></a>
## Law guides

RV-029A uses a lightweight SDD route: one static, bilingual content module and one shared Law-page view. The source is Nicolas's IFAB 2026/27 Spanish single-pages PDF and the corresponding official English PDF. Source page indices are physical PDF pages, checked separately by locale. Online Law links remain labelled as edition-variable.

Each of the 17 Law pages shows an original introduction, explanation, three practical key points, a locally drawn SVG orientation image, topic links where available, a source section and page locator, and directory/adjacent-Law navigation. Pages render from local content without a database or published lesson. The directory's one-line scopes remain short browsing labels.

The images are original RefView schematics, not copies of IFAB artwork or evidence from a real match. They provide orientation; the written guide and official source carry the rule meaning. No official text or diagram is reproduced wholesale. This work does not change the lesson publication boundary, authored assessments, or the simulator.

Acceptance is ACA-REQ-007 and ACA-REQ-008. Check source parity and physical PDF locators, then inspect Spanish/English desktop and mobile pages, internal navigation, keyboard access, and absence of overflow. An independent read-only review is required for the delegated visual implementation and final Academy stage acceptance.

<a id="04-academy--law-depth"></a>
## Law depth

<a id="04-academy--scope-and-route"></a>
### Scope and route

This is a substantial refinement of RV-029A and the first delivery of RV-029B. Nicolas asked for more faithful text and images and substantive text on navigable Academy topic pages. The requested experience is an original learning guide to IFAB 2026/27, not a copy of IFAB's publication. The existing visual system stays: paper reading surface, condensed headings, dark field diagrams, accessible blue focus, and Spanish-first bilingual content. The mode is **Read**.

The 17 Law pages retain their stable routes and gain sections with concrete conditions, procedure, exceptions, outcomes, and nearby official section/page links. Existing topic slugs remain stable; their routes become substantive static guides with their own text, diagrams, section sources, and local navigation. Later topic coverage extends to the other Laws. The approved unpublished lesson, answer keys, and real-play cases do not enter this static guidance.

<a id="04-academy--content-contract"></a>
### Content contract

`law-depth-contract.ts` defines one bilingual `LawDepth` per Law. Each section has a stable anchor, original bilingual paragraphs, optional facts/steps/caution, and an IFAB 2026/27 source section with verified ES/EN physical PDF page targets. The content is split into disjoint Law groups for bounded implementation and composed by the Law view. A static topic-guide contract uses the same source and block pattern. Every claim remains source traceable; the online IFAB page is labelled edition-variable.

The original diagrams are instructional geometry, not generic football decoration. Replacements must use consistent scale for field markings, label illustrated roles and ball state, distinguish position from offence, and avoid showing prohibited player placements. Do not trace or import IFAB PDF artwork. Diagrams and text carry equivalent meaning in both languages, with useful SVG title/description and visible figure labels.

<a id="04-academy--publication-boundary"></a>
### Publication boundary

The rule-guide route itself is static and does not need the publication database. Its existing catalog read and empty lesson/real-play sections distract from reading the Laws and fail during a local database outage. The publication-gated lesson catalog and lesson route remain separate; removing this read from static topic guidance does not expose drafts. Any future connection from a rule topic to a published lesson requires its own reviewed integration.

<a id="04-academy--acceptance-and-evidence"></a>
### Acceptance and evidence

Use the supplied Spanish IFAB PDF and official English 2026/27 PDF to verify numbers, exceptions, timing, section names, and physical page targets. Browser inspection must cover ES/EN Law and topic routes, desktop/mobile figures and navigation, keyboard focus, invalid routes, and absence of overflow. Deterministic geometry helpers, if added, need focused tests. Delegated implementation and the revised publication boundary require independent read-only review. Prior RV-029A verification remains historical evidence for its earlier introductory scope.

<a id="04-academy--restart-and-boundary-topics"></a>
## Restart and boundary topics

<a id="04-academy--route-and-acceptance"></a>
### Route and acceptance

This is a delegated SDD slice of RV-029B / ACA-REQ-009. Add six static bilingual topic guides: `kick-off-procedure` and `dropped-ball-procedure` under Law 8, `ball-in-and-out-of-play` under Law 9, and `throw-in-procedure`, `goal-kick-procedure`, `corner-kick-procedure` under Laws 15, 16, and 17. Each guide has three original explanatory sections with a nearby pinned 2026/27 source, a topic diagram, an illustrative photo, and the existing adjacent topic, language, and return navigation. The six established slugs and route shape remain stable. No database, lesson publication, assessment, real-play case, scoring, or AI provider is involved.

<a id="04-academy--shared-code-contract"></a>
### Shared code contract

`law-depth-contract.ts` exports `TopicDepth`, which extends `LawDepth` with a stable slug. `restart-topic-content-v1.ts` exports `restartTopics202627: readonly LawTopic[]` and `restartTopicDepths: readonly TopicDepth[]`. `RestartTopicIllustration.tsx` exports `RestartTopicIllustration({ slug, locale })`, returning `null` for unknown slugs and accessible bilingual SVG for the six known slugs. The coordinator integrates these exports into the existing metadata, depth, illustration, and photo registries together. Unknown Law/slug combinations continue to return 404. Topic order continues to sort by primary Law then slug, so dropped ball precedes kick-off under Law 8.

`LawSourceRef.supplemental` permits a second edition-pinned PDF link when a section uses both a Law and a protocol. The Law 15/16 countdown explanations and the Law 17 delayed-goal-kick exception link directly to protocol pages 28–29 (ES) / 26–27 (EN) beside the relevant claims.

<a id="04-academy--pinned-source-matrix"></a>
### Pinned source matrix

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

<a id="04-academy--visual-and-content-boundaries"></a>
### Visual and content boundaries

- Kick-off: stationary centre ball, own halves except the kicker, opponents at least 9.15 m away, then kick and clear movement. Do not depict the pre-kick arrangement as already in play.
- Dropped ball: penalty-area drop to the defending goalkeeper; otherwise the team that would have retained or gained possession if determinable, or the team that last touched it. Other players remain at least 4 m away until ground contact. Show the falling-ball moment separately from the ball being in play. Do not imply the recipient must touch it first after ground contact.
- Boundary: the whole ball must pass the whole line. Partial overlap and full crossing are distinct. A referee's stoppage is a separate reason for the ball to be out. A rebound off a goal frame, match official or corner flag can leave it in play; match-official contact triggers a dropped ball only in the specified cases.
- Throw-in: two hands, behind and over the head, both feet partly on the touchline or ground outside, correct exit point, opponents at least 2 m away. The ball is in play when it enters the field. Delay countdown is triggered by unfair delay, not every throw-in.
- Goal kick: stationary ball anywhere in the goal area, opponents outside the penalty area until in play, then kick and clear movement. It need not leave the penalty area. Delay countdown is triggered by unfair delay, not every goal kick.
- Corner kick: nearest corner area, flag remains in place, opponents at least 9.15 m from the corner arc. Kick and clear movement make the ball live; it need not leave the corner area.
- Countdown consequences must distinguish transfer of a delayed throw-in from a corner awarded for a delayed goal kick. Do not add an automatic countdown to other restarts.

The existing Law photographs are context, never geometric proof. `dropped-ball.png` is an original generated scene specifically for Law 8's dropped-ball topic and must be labelled as such. All exact rule relationships are taught in bilingual text and diagrams. Do not embed IFAB artwork or copy extended rule text.

<a id="04-academy--work-split-and-review"></a>
### Work split and review

After this shared contract, one Sol/medium implementer owns only `restart-topic-content-v1.ts` (metadata and 18 sections); another owns only `RestartTopicIllustration.tsx` (six diagrams). The coordinator owns registries, photo mapping, documentation, integration, and task status. The slice requires scoped type/lint checks, desktop/mobile Playwright CLI navigation and figure inspection, and independent Sol/high read-only review of source meaning, visuals, and integration. RV-029B remains in progress because many Laws still lack deep topics.

<a id="04-academy--outcome-and-free-kick-topics"></a>
## Outcome and free-kick topics

<a id="04-academy--route-and-acceptance-2"></a>
### Route and acceptance

This is a delegated SDD slice of RV-029B / ACA-REQ-009. Add four static bilingual topic guides: `goal-and-match-result` and `penalty-shoot-out` under Law 10; `free-kick-procedure` and `free-kick-distance-and-wall` under Law 13. Each guide contains three substantive source-linked sections, an original bilingual technical diagram, an illustrative generated photo with an honest observation cue, and the existing topic navigation. All twelve existing slugs remain stable. There is no database, lesson, assessment, scored incident or AI dependency.

<a id="04-academy--shared-code-contract-and-ownership"></a>
### Shared code contract and ownership

`outcome-free-kick-topic-content-v1.ts` exclusively exports `outcomeFreeKickTopics202627: readonly LawTopic[]` and `outcomeFreeKickTopicDepths: readonly TopicDepth[]`. The four metadata entries and twelve sections use the current `LawTopic` and `TopicDepth` types without changing them. `OutcomeFreeKickTopicIllustration.tsx` exclusively exports `OutcomeFreeKickTopicIllustration({ slug, locale })`, producing a 720-by-400 accessible bilingual SVG for the four slugs and `null` for unknown slugs. The coordinator owns registry dispatch, photo mapping, documentation and tracker integration. Existing route validation continues to reject a slug under the wrong Law.

Section outlines: goal criteria / exceptional goal outcomes / match result; shoot-out eligibility and setup / sequence and winning condition / completion and offences; free-kick types and goal outcomes / placement and ball entering play / second touch; opponent distance / three-or-more-player wall / quick kicks and penalty-area exceptions. The Law 12 `indirect-free-kick` topic remains offence-focused; Law 13 teaches execution.

<a id="04-academy--pinned-source-matrix-2"></a>
### Pinned source matrix

The Spanish and English IFAB 2026/27 single-page PDFs have been checked at these physical/printed pages. Links use the edition-pinned PDF URLs in `rules-directory-v1.ts`, not the advancing online Law pages.

| Coverage | Spanish pages | English pages |
| --- | --- | --- |
| Law 10.1–2 goal and match result | 111–112 | 103–104 |
| Law 10.3 penalty shoot-out | 113–115 | 105–107 |
| Law 13.1 free-kick types and goal outcomes | 141 | 131 |
| Law 13.2–3 procedure and sanctions | 141–143 | 131–133 |

English PDF: `https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en`. Spanish PDF: `https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es`. The Law 10.3 accidental double-touch clarification is described in the 2026/27 change summary on Spanish page 194 and English page 179; relevant topic text cites Law 10.3 directly.

<a id="04-academy--content-and-visual-invariants"></a>
### Content and visual invariants

- A goal needs the whole ball over the whole goal line, between posts and below crossbar, with no offence by the scoring team. A photograph alone does not prove validity.
- Shoot-out score is separate from match score. Equal-number comparisons govern early completion and sudden death. Do not imply all ten initial kicks are always taken. Clarify eligibility, equalising numbers, replacements and the new accidental double-touch consequence against Law 10.3.
- Direct and indirect free kicks have different goal outcomes. Indirect signal duration and omitted-signal consequences require the precise Law 13.1 wording. An own goal directly from either type yields a corner.
- A free kick begins with a stationary ball and is in play when kicked and clearly moving. Ordinary placement, goal-area exceptions, opponent distance, the three-defender wall threshold, and second-touch consequences must remain distinct.
- A quick kick intercepted by a nearby opponent differs from deliberate prevention of a restart. Do not transplant the conditional Law 15/16 delay countdown into Law 13.
- Illustrations are original bilingual teaching diagrams, not IFAB artwork or invented match evidence. Existing generated photos serve as context only. The shoot-out topic may reuse the Law 14 photo if its caption does not claim that the photographed penalty occurred in a shoot-out.

<a id="04-academy--verification-and-review"></a>
### Verification and review

Check all eight ES/EN routes, three sections and nearby source links, Law 10/13 listings, sibling/adjacent links, language switching, wrong-Law 404, desktop/mobile layout, opened SVGs and keyboard access with Playwright CLI. Run final-code typecheck and scoped lint. An independent read-only Sol/high review checks source meaning, diagrams and integration. RV-029B remains in progress because other Laws still need topics.

<a id="04-academy--players-referee-and-time-topics"></a>
## Players, referee and time topics

<a id="04-academy--route-and-acceptance-3"></a>
### Route and acceptance

This is a delegated SDD slice of RV-029B / ACA-REQ-009. Add six static bilingual topic guides: `substitution-procedure` and `players-and-extra-persons` under Law 3; `referee-authority-and-advantage` and `injuries-and-return-to-play` under Law 5; `periods-and-intervals` and `added-time-and-period-end` under Law 7. Each guide has three substantive bilingual source-linked sections, an original accessible technical diagram, contextual generated-photo presentation and existing sibling/adjacent/language navigation. All sixteen prior topic slugs remain stable. No lesson, assessment, scored incident, database or AI provider is involved.

<a id="04-academy--shared-code-contract-and-ownership-2"></a>
### Shared code contract and ownership

`players-referee-time-topic-content-v1.ts` exclusively exports `playersRefereeTimeTopics202627: readonly LawTopic[]` and `playersRefereeTimeTopicDepths: readonly TopicDepth[]`, using existing shared types. `PlayersRefereeTimeTopicIllustration.tsx` exclusively exports `PlayersRefereeTimeTopicIllustration({ slug, locale })`: six original 720-by-400 bilingual accessible SVGs, `null` for unsupported slugs. The coordinator owns registry dispatch, photo mapping, existing Law 3 accuracy correction, documentation and tracker. Wrong Law/slug combinations remain unavailable. This is a delegated SDD route because source meaning, visual contracts and six independent guides warrant separate content/diagram ownership and read-only review.

Section outlines: Law 3 substitutions: allowances/opportunities, exit/entry, delayed departure; Law 3 people: player/substitute/official status, entry/interference, restart/goal consequences; Law 5 authority: decision limits, advantage, discipline after advantage; Law 5 injury: assess/stop, treatment/departure, permission and return timing; Law 7 periods: equal halves, intervals, abandonment; Law 7 added time: lost-time causes, announced minimum, penalty at period end. The content implementer must not introduce precise timings or exceptions beyond the verified sources below.

<a id="04-academy--source-matrix-and-discrepancy"></a>
### Source matrix and discrepancy

The downloaded official IFAB 2026/27 single-page PDFs contain Law 3 at ES 63–70 / EN 59–65, Law 5 at ES 81–91 / EN 73–82, and Law 7 at ES 101–102 / EN 93–94. The time-limited substitution protocol appears at ES/EN 22–23; the off-field treatment and assessment protocol at ES 24–26 / EN 24–25. Law 12.4's disciplinary consequence after advantage appears at ES 129 / EN 120. Individual sections cite narrower exact pages, checked against the PDF before authoring. Spanish PDF: `https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es`; English PDF: `https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en`.

The official IFAB live 2026/27 Law 3 page includes an updated exception to the fewer-than-seven-player minimum for temporary dismissals and protocol one-minute absences, while the edition-labeled downloadable PDFs inspected here do not. Do not attribute that exception to PDF Law 3.1. The existing Law 3 general-guide sentence that states the minimum without qualification needs a narrow accuracy correction grounded in the official live page, with the edition-pinned PDF still identified as such. The live source may advance later and must be labeled as an online update rather than silently mixed into the PDF claims.

<a id="04-academy--content-and-visual-invariants-2"></a>
### Content and visual invariants

- Substitutions: competition-specific allowances are not universal; show exit then referee-authorized entry at halfway, completion on entry. The 2026/27 ten-second departure clock and one full running-minute wait for a late departing player have protocol-defined triggers/exceptions. Never depict treatment/safety as overridden by a timer.
- Extra persons: presence, interference, team-list status, timing and goal consequences differ. Do not teach that every extra person triggers a dropped ball or invalidates a goal.
- Referee: advantage is an assessed benefit over a few seconds, not a fixed stopwatch. Decision changes, restart and disciplinary timing remain distinct.
- Injury: serious injury, bleeding, treatment, removal, the 2026/27 one-minute off-field protocol and its exceptions must be kept separate. An injured player's return requires referee permission and a position determined by ball state; no automatic re-entry.
- Periods: normal equal halves and defined intervals differ from optional competition-authorized extra time. Abandonment is not simply a long stoppage.
- Added time: announced time is a minimum, may increase but not decrease; do not transfer a first-half timekeeping error to the second half. A pending or retaken penalty extends that period until the kick is complete.
- Existing generated photos are illustrative context, never proof of player status, interference, referee reasoning, injury treatment or elapsed time. The Law 5 card photo is suitable as general referee context; the injury topic needs an honest caption or dedicated image. Original diagrams must not copy IFAB artwork or show invented match evidence.

<a id="04-academy--verification-and-review-2"></a>
### Verification and review

Check all twelve ES/EN routes, three sections and nearby source links, Law 3/5/7 listings, sibling/adjacent/language navigation, wrong-Law 404, desktop/mobile layout, opened diagrams, keyboard access and console with Playwright CLI. Run final-code typecheck/scoped lint. Independent Sol/high read-only review checks source meaning, updated Law 3 caveat, diagrams and integration. RV-029B remains in progress until Laws 1, 2, 4 and 6 also receive topic guides.

<a id="04-academy--foundation-and-match-official-topics"></a>
## Foundation and match-official topics

<a id="04-academy--route-and-acceptance-4"></a>
### Route and acceptance

This is a delegated SDD slice of RV-029B / ACA-REQ-009. Add eight static bilingual topic guides, two each under Laws 1, 2, 4 and 6. Each guide has three substantive, source-linked sections, one original accessible bilingual technical diagram, an existing generated contextual photo with a topic-specific observation cue, and the established sibling, adjacent and language navigation. Preserve all twenty-two existing slugs. The guides need no lesson publication, database, assessment, simulator or AI provider. Wrong Law/slug combinations remain unavailable.

<a id="04-academy--shared-code-contract-and-ownership-3"></a>
### Shared code contract and ownership

`foundation-officials-topic-content-v1.ts` exclusively exports `foundationOfficialsTopics202627: readonly LawTopic[]` and `foundationOfficialsTopicDepths: readonly TopicDepth[]` using the existing shared types. `FoundationOfficialsTopicIllustration.tsx` exclusively exports `FoundationOfficialsTopicIllustration({ slug, locale })`: eight original 720-by-400 bilingual accessible SVGs and `null` for unsupported slugs. The coordinator owns the shared registries, photo observations, project documentation, verification and task status. This delegated SDD route is warranted by eight independent teaching guides, exact source meaning and visual geometry.

<a id="04-academy--topic-outline"></a>
### Topic outline

| Law | Slug | Three section contracts |
| --- | --- | --- |
| 1 | `field-markings-and-areas` | Lines and dimensions; marked areas and measurements; decisions at an area boundary. |
| 1 | `goals-and-field-safety` | Goal dimensions; construction and anchoring; damaged or displaced crossbar procedure. |
| 2 | `ball-specifications-and-checks` | Required properties; quality marks where required; referee control and spare balls. |
| 2 | `defective-ball-and-replacement` | Defect during play; defect at a restart; penalty and replacement permission. |
| 4 | `compulsory-and-safe-equipment` | Required kit; dangerous items and conditionally permitted accessories; colours and accidental loss. |
| 4 | `equipment-offences-and-reentry` | Correction without automatic stoppage; leaving and inspection; permission, sanction and restart. |
| 6 | `assistant-referee-duties` | Team authority; boundary/offside/substitution duties; penalty observations and clear signals. |
| 6 | `fourth-official-and-video-officials` | Fourth-official tasks; VAR/AVAR roles within permitted scope; referee's final authority. |

<a id="04-academy--verified-edition-source-matrix"></a>
### Verified edition source matrix

The supplied Spanish and official English 2026/27 single-page PDFs have matching printed and physical page numbers for this slice. Use section-specific references within these ranges:

| Law and section | Spanish pages | English pages |
| --- | --- | --- |
| Law 1 §§1–4: surface, markings and dimensions | 49–51 | 45–47 |
| Law 1 §§5–7: marked areas | 50–52 | 46–48 |
| Law 1 §10: goals, anchoring and damaged crossbar | 54 | 50 |
| Law 2 §§1,3: ball properties, quality marks and spare balls | 59–60 | 55–56 |
| Law 2 §2: defective ball and restart | 60 | 56 |
| Law 4 §§1–3: safety, compulsory kit and colours | 73–75 | 67–69 |
| Law 4 §6: equipment correction, return and restart | 78 | 71 |
| Law 6 introduction, §§1–4: authority and other on-field officials | 93–95 | 85–87 |
| Law 6 §5: VAR/AVAR roles | 95 | 87 |

Spanish PDF: `https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es`. English PDF: `https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en`. The source researcher confirmed the printed page headings in the local Spanish file and official English download. User-facing links must target the operative Law pages, not the edition's change-summary pages.

The content must clearly separate mandatory Law requirements from competition-dependent options, on-field versus video officials, and photographic appearance from verified equipment condition or match fact. Law 2's penalty/shoot-out defective-ball exception has a specific forward-motion window before a player or goal frame touch. The pinned 2026/27 Law 4.1 permits non-dangerous accessories, including jewellery, when safely and securely covered; dangerous items must be removed and cannot be made acceptable by tape or another covering. Law 6's video-official roles exist only when appointed; a contestable call alone does not make it reviewable. Diagrams must not reproduce IFAB artwork, assert invented match evidence, distort field measurements, imply that an assistant or VAR overrules the referee, or show a ball photo as proof of its pressure. Any claim absent from the edition-pinned PDFs needs a separately labeled official online source.

The IFAB `latest` Law 4 webpage currently contains older blanket jewellery wording despite its 2026/27 selector. The supplied Spanish 2026/27 PDF p73 and official English 2026/27 PDF p67 both contain the operative accessory condition above. This slice cites those edition-pinned PDFs and avoids importing the live page's conflicting sentence.

The operative pinned Law 6 §5 and VAR protocol include review of a clearly incorrect second caution that results in sending-off (ES 95 and 165/168; EN 87 and 153/155). The edition's change-summary pages ES 192 / EN 177 use confusing language about the direct-red-card subtype, and the current live Law 6 sentence is malformed even though its FAQ supports that review. If this slice teaches that edge case, ground it in the operative Law and protocol, and distinguish it from an unissued potential second caution. Record the source discrepancy for later editorial reconciliation.

<a id="04-academy--verification-and-review-3"></a>
### Verification and review

Inspect all sixteen new ES/EN routes, the four Law listings, sibling/adjacent/language navigation, source links, loaded photo and diagram, wrong-Law 404, desktop/mobile width and keyboard access with Playwright CLI. Visually inspect all eight SVGs in both languages. Run final-code typecheck and scoped lint. Independent read-only Sol/high review checks PDF source meaning, visual accuracy and integration. RV-029B can be considered for verification only after these eight guides pass and the full seventeen-Law topic coverage is reconciled against its acceptance contract.

---

<a id="22-academy-rules-directory"></a>

<a id="22-academy-rules-directory--academy-rules-directory-design"></a>
## Academy rules directory design

Use static, bilingual, edition-pinned navigation metadata for laws 1–17. Titles are checked against the IFAB 2026/27 English and Spanish law indexes. Brief RefView overviews describe scope without copying official passages or claiming lesson review. Each page links to the corresponding official online law and to the edition-specific IFAB 2026/27 PDF; the online `latest` route can advance editions, so the pinned PDF remains the edition authority.

The Academy catalog reader remains the only source of published lesson cards. The subsequent topic-hub feature introduced static topic navigation on the law page, independent of database availability. Its topic route filters the verified published catalog projection by `IFAB-2026-27` and an explicit `challenge` to Law 12 primary-law map. The current approved lesson source fixture and hash stay unchanged. A failed catalog read yields an unavailable-lesson message; a successful empty read yields no-published-lessons copy. The static directory and law pages always render.

The route namespace `/academy/rules/[lawNumber]` is disjoint from the existing `/academy/[lessonId]` route. The current Academy entry renders the directory before its existing published-lesson section. The direct-only editorial and interface previews remain unlinked from public navigation.

Official source indexes: https://www.theifab.com/ and https://www.theifab.com/es/ (2026/27 selected). Pinned PDFs: https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en and https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es. The directory is local application content; it does not deploy the site externally.

---

<a id="23-academy-topic-hubs"></a>

<a id="23-academy-topic-hubs--academy-topic-hub-design"></a>
## Academy topic hub design

The information path is law directory → law → topic hub → published lesson → related published practice. Law card descriptions reuse the already reviewed `law.overview` navigation copy. The first static topic is `challenge` under Law 12, labelled `Contacto y gravedad de la acción` / `Contact and challenge severity`, with one original orientation sentence. Other laws have no static topic entries yet.

The static topic registry contains no lesson IDs, draft titles, authored facts, proposed decisions, scores, Assessment IDs, or media. The law page presents static topics as navigable outlines and separate official references. The topic route validates canonical law number, supported locale, slug, and exact primary-law membership. It reads `readAcademyCatalog(locale)` and filters only verified published lessons by `topicId === 'challenge'` and `lawsEdition === 'IFAB-2026-27'`. On read failure, lesson availability is unknown; on a successful empty read, no lesson is published. Neither state falls back to draft fixtures.

The topic page leaves a real-play section with truthful empty copy. Future plays are curated user-supplied content with source/rights and bilingual descriptions. Media and decisions cannot be silently added to the approved lesson or Assessment hashes. Before adding cases, define a reviewed content version, source provenance, and how any initial versus correction-only evidence is shown.

Official references reuse `officialLawUrl` and `officialEditionPdfUrl` from the existing law directory. The online IFAB `latest` page may advance edition; the 2026/27 PDF is the edition authority. The local PDF inspected by Nicolas is reference material, not copied site content.

---

<a id="24-academy-law-expansion"></a>

<a id="24-academy-law-expansion--academy-law-topic-expansion-design"></a>
## Academy law topic expansion design

The 17 Law cards remain the directory. A small locally authored SVG icon denotes each Law visually; it is `aria-hidden` and cannot replace the visible Law number, title, or scope. The directory retains its existing editorial paper/green styling.

The first expansion contains six static orientation hubs across Laws 11, 12, and 14. In the Spanish PDF: Law 12 contact/severity (section 1, pp.123–124), handball (section 1, pp.124–126), indirect-free-kick offences (section 2, pp.126–128), and discipline (section 4, pp.128–136); Law 11 position and involvement (sections 1–2, pp.117–119); Law 14 penalty procedure (section 1, pp.145–146). The official English PDF is 260 pages, versus 276 in Spanish. Its corresponding physical pages are 115–116, 116–118, 118–119, 119–127, 109–111, and 135–136 respectively. The page range is a source locator, not a copied passage. The selection is a first editorial slice, not complete coverage of these Laws.

`LawTopic` metadata gains an original bilingual explanation, two or three bilingual key concepts, and a versioned source section/page range. A topic route validates locale, canonical Law number, slug, and primary-law membership before reading the published catalog. The catalog remains the only source of lesson links, filtered by exact topic and `IFAB-2026-27`. The current publishable lesson topic schema recognizes only `challenge`; this UI pass does not broaden it or fabricate published lessons for new topics. Empty and unavailable catalog reads remain distinguishable. The real-play area remains empty.

The official online Law is a convenience reference and may change edition. The 2026/27 PDF is the edition authority. Localized page-fragment links use physical page indices checked in each language's PDF. No external icon library, copied PDF artwork, new media asset, database change, or simulator work is needed.
