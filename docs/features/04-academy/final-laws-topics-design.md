# Final foundation and match-official topics

## Route and acceptance

This is a delegated SDD slice of RV-029B / ACA-REQ-009. Add eight static bilingual topic guides, two each under Laws 1, 2, 4 and 6. Each guide has three substantive, source-linked sections, one original accessible bilingual technical diagram, an existing generated contextual photo with a topic-specific observation cue, and the established sibling, adjacent and language navigation. Preserve all twenty-two existing slugs. The guides need no lesson publication, database, assessment, simulator or AI provider. Wrong Law/slug combinations remain unavailable.

## Shared code contract and ownership

`foundation-officials-topic-content-v1.ts` exclusively exports `foundationOfficialsTopics202627: readonly LawTopic[]` and `foundationOfficialsTopicDepths: readonly TopicDepth[]` using the existing shared types. `FoundationOfficialsTopicIllustration.tsx` exclusively exports `FoundationOfficialsTopicIllustration({ slug, locale })`: eight original 720-by-400 bilingual accessible SVGs and `null` for unsupported slugs. The coordinator owns the shared registries, photo observations, project documentation, verification and task status. This delegated SDD route is warranted by eight independent teaching guides, exact source meaning and visual geometry.

## Topic outline

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

## Verified edition source matrix

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

## Verification and review

Inspect all sixteen new ES/EN routes, the four Law listings, sibling/adjacent/language navigation, source links, loaded photo and diagram, wrong-Law 404, desktop/mobile width and keyboard access with Playwright CLI. Visually inspect all eight SVGs in both languages. Run final-code typecheck and scoped lint. Independent read-only Sol/high review checks PDF source meaning, visual accuracy and integration. RV-029B can be considered for verification only after these eight guides pass and the full seventeen-Law topic coverage is reconciled against its acceptance contract.
