# Assessment starter set: editorial candidates

These are bilingual authored text exercise candidates for RV-041, not published items or approved answer keys. All use `IFAB-2026-27`, topic `challenge`. Nicolas must review football meaning, accepted alternatives, and translation equivalence against the exact version hash before publication. They do not infer facts from the rendered simulator.

The official source artifacts are the edition-pinned IFAB PDFs recorded and digested in [`../../contracts/academy-content-v1.md`](../../contracts/academy-content-v1.md): [English](https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en) and [Spanish](https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es). Focused source research inspected EN Law 12 p. 115 (challenge severity), p. 122 (promising-attack caution exception), p. 124 (DOGSO), Law 14 p. 135; ES Regla 12 p. 123, pp. 130–131, p. 133, Regla 14 p. 145. Source digests matched the Academy contract. The SPA exception is narrow and should not be generalized to every penalty offence.

## `challenge-severity-rule` v1 · beginner · `ruleQuestion`

Question ES: «Un defensor disputa el balón y el árbitro juzga que la entrada fue temeraria; hubo contacto con un adversario. ¿Qué combinación describe correctamente la Regla 12?» EN: “A defender challenges for the ball and the referee judges the challenge reckless; it involved contact with an opponent. Which combination correctly applies Law 12?”

Proposed options, each translated equivalently: `choice-a` direct free kick and caution; `choice-b` direct free kick without discipline; `choice-c` direct free kick and sending-off for every reckless challenge; `choice-d` indirect free kick. Proposed accepted option: `choice-a`. The public evidence paraphrases careless, reckless, and excessive-force thresholds. Correction distinguishes those three thresholds and cites Law 12 §1, EN printed p. 115 / ES p. 123.

## `careless-trip-penalty-restart` v1 · beginner · `restartDiscipline`

Authored fictional facts in both languages: the ball is in play; `defence-04` challenges for it, does not touch it, and carelessly trips `attack-09` inside the defender's own penalty area. The action is neither reckless nor excessive, has no other card-worthy conduct, and the written facts establish no DOGSO. The exercise asks for stop/restart/card/offender based on this text; it does not ask the learner to inspect an animation.

Proposed accepted tuple: `{ stopPlay: true, restart: "penaltyKick", discipline: "none", offenderHandle: "defence-04" }`. Correction ties the direct-free-kick trip to the Law 14 penalty restart and separates carelessness from discipline. Review must decide whether the SPA exception belongs in the correction; if included, state its narrow attempt/challenge-for-ball condition accurately. Sources: Law 12 §1 EN p. 115 / ES p. 123; Law 14 opening EN p. 135 / ES p. 145. The optional SPA nuance is Law 12 EN p. 122 / ES pp. 130–131.

## `reckless-challenge-not-dogso` v1 · intermediate · `authoredIncidentAnalysis`

Authored fictional facts in both languages: `defence-07` contacts `attack-11` while challenging for the ball outside the offender's penalty area. The written facts establish a reckless direct-free-kick offence, not excessive force, and rule out an obvious goal-scoring opportunity through non-direct direction, uncertain control, and two covering defenders. No other misconduct is present. The learner chooses stop/restart/card/offender and writes a short explanation of why a caution remains despite no DOGSO.

Proposed accepted tuple: `{ stopPlay: true, restart: "directFreeKick", discipline: "yellow", offenderHandle: "defence-07" }`. Reasoning is required but explicitly unscored. Prepared self-review dimensions are relevant fact, rule connection, and decision justification. Correction explains that a reckless offence requires a caution independently of DOGSO. Sources: Law 12 §1 EN p. 115 / ES p. 123 and DOGSO considerations EN p. 124 / ES p. 133.

The proposed catalog has three items: two beginner, one intermediate, zero advanced. Every other combination must show an unavailable state. The exact item source, alternatives, correction copy, and hashes are implemented as unpublished drafts; trusted review and publication remain separate.

## Nicolas's exact candidate approval

On 2026-11-04, Nicolas reviewed the local ES/EN Assessment editorial preview and approved all three current drafts, including football meaning, bilingual text, accepted answers, corrections, and displayed sources. This chat approval binds to evidence artifact [`review-evidence-v1.json`](review-evidence-v1.json), SHA-256 `68b59e61d24d4c19c48cde4b3342e65e6a88e8b5b7311f6b81bb73e9a33956bc`, and the following exact item/rubric pairs:

| Item v1 | Item hash | Rubric hash |
| --- | --- | --- |
| `careless-trip-penalty-restart` | `sha256:cfd82af1ae1d01b0fc54b79290945ecfeb3a7cf2b91124480cb0df22143bef7f` | `sha256:ffef04600b4366e59d8c281933e189c0d798c4ee675fd297776e706fa8c6e1f1` |
| `challenge-severity-rule` | `sha256:dc5bb1d47f34a86a0112c411e3109a51ec743822fcfcfc8453232bf38c7fa7cf` | `sha256:1802297539b604a8e9caa535cc47e61cb9dead4c6f84fe0b170f643918553bfc` |
| `reckless-challenge-not-dogso` | `sha256:cc16f97584047ec7ae6fd88873f3343846e848cc5e12e1ee53bf931d8dcdd124` | `sha256:df1d22b252515c522b87aa5bc878c1cad20c02e9f6745b4ebccade7dcff9c577` |

The artifact is a candidate evidence package, not a trusted database review record. Reviewer authority, exact receipt admission, and publication remain separate gates. Any content or rubric change requires fresh approval.
