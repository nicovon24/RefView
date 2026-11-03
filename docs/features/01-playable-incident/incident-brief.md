# RV-002 incident content brief

This brief defines the proposed football content for the first RefView incident. It is complete enough to author and test, but it is not accepted training content until Nicolas reviews the football interpretation and the rendered evidence.

## Source edition and competition profile

- Laws edition: **IFAB Laws of the Game 2026/27**, English source text.
- Competition: fictional `RefView Training Match`; senior 11-a-side football; 90 minutes; 105 x 68 m natural-grass field; standard 7.32 x 2.44 m goals.
- Modifications: none. No temporary dismissals, return substitutions, special trials, or competition-specific Law modifications.
- Video match officials: enabled in the competition profile so the incident can later support a meaningful VAR task. The main-referee MVP still requires an initial decision as if there were no VAR.
- Teams, kits, stadium, score, and match events are fictional demonstration content.

The official source details below were inspected directly. Coordinates, ticks, staging, camera volumes, and visual-readability expectations are RefView design inferences that require validation.

## World geometry

The canonical coordinate contract is defined in [`../../contracts/coordinates.md`](../../contracts/coordinates.md). This brief uses metres, a field-centre origin, `+z` toward the defending goal, `+x` toward the attacking team's right touchline, and `+y` upward.

- Field: `x = -34..34`, `z = -52.5..52.5`.
- Defending goal line: `z = 52.5`.
- Near edge of the defending penalty area: `z = 36.0`.
- Lateral penalty-area limits: `x = -20.16..20.16`.
- Decisive lower-leg contact: **`(13.80, 0.34, 36.80)`**.
- Ground projection of the offence: **`(13.80, 0, 36.80)`**, 0.80 m inside the near penalty-area boundary.

The offence location is the authored point of contact, not the ball or either player's centre. The margin is intentionally clear: it tests observation near the boundary without making the first case a millimetric line decision.

## Actor roster

| Actor | Role in the incident |
| --- | --- |
| `referee-main` | User-controlled referee. Starts behind and left of play and can reach a clear diagonal or remain screened. |
| `attack-08` | Midfielder who releases the through pass. |
| `attack-09` | Receiver, onside at the pass snapshot, then carelessly tripped. |
| `attack-10` | Supporting attacker who trails the play and preserves a credible attacking shape. |
| `defence-04` | Pursuing defender who challenges for the ball, does not play it, and trips `attack-09`. |
| `defence-05` | Covering defender whose position, together with direction and control likelihood, makes the opportunity not obvious. |
| `defence-02` | Second-last opponent at the pass snapshot and a possible live-view occluder. |
| `defence-01` | Goalkeeper, set centrally and able to react. |

The seven football player actors share immutable authored tracks. The eighth actor is the user-controlled referee; user movement never changes the footballers' action.

## Canonical chronology

The scenario runs at 60 canonical ticks per second. Tick ranges are inclusive unless stated otherwise.

| Tick | Match clock | Canonical event |
| --- | --- | --- |
| `0..119` | `67:12.000..67:13.983` | Stable attacking shape; `attack-08` controls the ball. |
| `120` | `67:14.000` | First point of the through-ball touch. This is the Law 11 snapshot. |
| `120..179` | `67:14.000..67:14.983` | Pass release toward the right channel. |
| `180..299` | `67:15.000..67:16.983` | `attack-09` accelerates onto the ball; `defence-04` pursues. |
| `300..359` | `67:17.000..67:17.983` | Approach to the penalty area; `defence-05` remains goal-side and inside. |
| `360..371` | `67:18.000..67:18.183` | Challenge window. `defence-04` fails to touch the ball and contacts the receiver's lower leg at tick `366`. |
| `372..419` | `67:18.200..67:18.983` | The attacker falls and the ball continues, creating a recognition/whistle window. |
| `420..479` | `67:19.000..67:19.983` | Short post-incident continuation used only if the user has not stopped play. |
| `480` | `67:20.000` | The live sequence pauses and decision confirmation becomes mandatory. |

The user's whistle tick is recorded separately and does not rewrite these events. Live play and replay query the same tick state.

## Onside snapshot

At tick `120`:

- Ball first-contact position: approximately `(8.0, 0.11, 29.0)`.
- The receiver's foremost legally relevant body point: `z = 30.0`.
- The second-last opponent's nearest-to-goal legally relevant body point: `z = 31.5`.
- Authored onside margin: at least 1.5 m before animation tolerances.

The final animation must remeasure head, body, and feet at the exact snapshot. Hands and arms are excluded. A pose that visually erases the margin fails review even if the source coordinates remain labelled onside.

## Canonical football facts

1. The ball is in play.
2. `attack-09` is onside when `attack-08` first plays/touches the pass.
3. `defence-04` makes a genuine challenge for the ball but does not touch it.
4. The challenge carelessly trips `attack-09`; it is neither reckless nor excessive-force play.
5. The contact occurs inside `defence-04`'s penalty area.
6. The complete geometry does not create an obvious goal-scoring opportunity: the direction is not yet direct to goal, ball control is not fully established, `defence-05` is able to challenge, and the goalkeeper is set.
7. No separate misconduct occurs.
8. Reviewed decision proposed for Nicolas's approval: stop play, penalty kick, no disciplinary sanction.

The no-card result is supported in two layers: careless contact alone requires no card; if the challenge is considered to have stopped a promising attack, the 2026/27 caution exception applies because a penalty is awarded for a challenge for the ball. DOGSO must still be excluded using all four Law 12 considerations, not merely the presence of one defender.

## Evidence map

| Evidence | Tick window | What it supports | Good live position | Poor live position |
| --- | --- | --- | --- | --- |
| `EV-PASS-SNAPSHOT` | `116..124` | Receiver onside at the team-mate's touch | Broad player/ball relationship may be visible; no artificial line | Not reliably judgeable by the main referee; later role/replay evidence may be stronger |
| `EV-NO-BALL-TOUCH` | `356..366` | Defender misses the ball | Ball and challenging foot remain separated at normal speed | Defender/attacker bodies overlap |
| `EV-TRIP-CONTACT` | `364..371` | Careless lower-leg contact causes the fall | Side-on lower-leg gap and contact visible | Pursuer and `defence-02` occlude the lower legs; only the fall is visible |
| `EV-INSIDE-AREA` | `360..374` | Contact ground projection lies inside | Contact and penalty-area line visible in one view | Contact is screened and perspective compression obscures its ground projection |
| `EV-NON-DOGSO` | `330..371` | Direction, control likelihood, cover, and goalkeeper | Covering defender and ball direction remain in peripheral/central view | Narrow alignment hides the cover and exaggerates a direct path to goal |

Initial calibration volumes, measured at tick `360`:

- Good position: referee eye within `x = 1..6`, `z = 28..32`, roughly 9-16 m from the contact, yawed so contact and cover are inside the central 60 degrees of view.
- Poor position: referee eye within `x = 10..15`, `z = 26..31`, almost aligned with the attacker and pursuing defender.

These are authoring targets, not sufficient proof of perception. Distance, orientation, timing, animation, contrast, field markings, and actual rendered occlusion must be inspected together.

## Decision and evaluation intent

The user must make and confirm an initial decision:

- Stop play or continue.
- If stopped: penalty kick, direct free kick, indirect free kick, or dropped ball where relevant to the UI state.
- Discipline: no card, yellow card, or red card.

The reviewed key is `stop + penaltyKick + noCard`. Evaluation remains dimensional:

- Decision quality: foul recognition, offence location/restart, and discipline.
- Observation and positioning: evidence genuinely available during its live window; never inferred from a lucky correct answer.
- Communication: whistle timing and clear signal. Voice recognition is not required.
- Protocol: `notApplicable` for the initial no-VAR main-referee task, not an invented perfect score.

## Future assistant and VAR use

- The assistant-referee task must use this exact pass tick and player tracks, add touchline alignment/movement, and require an observable signal/communication choice.
- The VAR task must use camera feeds derived from this timeline. It must distinguish an automatic check from recommending a review.
- Penalty/no-penalty, offence location, relevant attacking-phase offside, and possible DOGSO are within the applicable VAR review categories.
- Normal speed is used to judge challenge intensity; slower playback may establish factual contact/location. A correct initial penalty may end with a check complete. An initial play-on may produce a probable clear-and-obvious-error recommendation, with the referee retaining the final decision.

## Official references inspected directly

- [IFAB Laws of the Game 2026/27, single-page English edition](https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en)
- [Law 1 - The Field of Play](https://www.theifab.com/laws/latest/the-field-of-play/): lines belong to their bounded areas; penalty-area dimensions.
- [Law 11 - Offside](https://www.theifab.com/laws/latest/offside/): position is judged when a team-mate plays/touches the ball and by eligible body parts.
- [Law 12 - Fouls and Misconduct](https://www.theifab.com/laws/latest/fouls-and-misconduct/): careless challenge, direct-free-kick offences, SPA exception, and DOGSO considerations.
- [Law 14 - The Penalty Kick](https://www.theifab.com/laws/latest/the-penalty-kick/): a direct-free-kick offence inside the offender's penalty area results in a penalty kick.
- [VAR protocol](https://www.theifab.com/laws/latest/video-assistant-referee-var-protocol/): initial decision, review categories, check/review distinction, and playback guidance.
- [IFAB 2026/27 law changes](https://www.theifab.com/law-changes/latest/): current-edition context.

## Nicolas review checkpoints

Nicolas approved the proposed onside buildup, careless trip just inside the penalty area, covering defender, and penalty/no-card authoring target on 2026-11-03. This approval covers the football brief, not the future rendered scene or measured evidence contrast.

### RV-002 brief approval

RV-002 may move to `Verified` when Nicolas approves or corrects the proposed Laws interpretation, competition settings, canonical facts, geometry, chronology, and intended evidence contrast. This freezes an authoring target; it does not claim that the future animation or cameras already prove it.

### RV-008/RV-011 rendered-evidence approval

After the scene exists, Nicolas must inspect the running scene and record answers to all of the following before it is accepted as training content:

- Is the receiver visibly onside at tick `120`, including the animated body pose?
- Does the challenge read as an attempt to play the ball and a careless trip, not incidental contact, simulation, recklessness, or excessive force?
- Is the contact visibly inside the penalty area from the intended good position?
- Do distance, direction, control likelihood, and actor locations/numbers together exclude DOGSO?
- Does the same action support the expected no-card result under the SPA exception?
- Is decisive contact genuinely visible from the good position and genuinely restricted from the poor one?
- Are the fall, reactions, whistle window, camera, lighting, field markings, and kit contrast credible enough to teach the intended evidence?

## Research execution record

- Requested research model/effort: `gpt-6-luna` / `high`.
- Runtime-confirmed model/effort: `unconfirmed`.
- Research scope: official IFAB primary sources only; no files were changed by the research worker.
