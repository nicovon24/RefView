<a id="06-assessments"></a>

<a id="06-assessments--assessments-foundation"></a>
## Assessments foundation

Status is tracked only in [`../../specs/tasks.md`](../../../specs/tasks.md).

**Delegated SDD.** Assessment content reuses versioned rules, facts, publication, ownership, and deterministic evaluation rather than creating a second scoring authority.

<a id="06-assessments--objective"></a>
## Objective

Deliver structured bilingual practice with rule questions, restart/discipline decisions, authored incident analysis, reasoned corrections, and targeted next practice.

<a id="06-assessments--observable-acceptance"></a>
## Observable acceptance

- **ASM-REQ-001:** Users select only published exercises by available topic, level, and rules edition; unavailable combinations are explicit.
- **ASM-REQ-002:** The reviewed starter set includes a rule question, restart/discipline decision, and authored-incident analysis.
- **ASM-REQ-003:** Server-side deterministic evaluation uses immutable item/rubric versions and accepts wrong but valid answers for correction.
- **ASM-REQ-004:** Required short reasoning uses explicit rubric dimensions; unscored text is labelled unscored and AI does not invent an authoritative grade.
- **ASM-REQ-005:** Corrections connect answer, evidence, rule reference, and available next practice while preserving the initial answer.
- **ASM-REQ-006:** Answer keys/corrections remain private during the attempt; owned results finalize idempotently with provenance.

<a id="06-assessments--limits"></a>
## Limits

- No certification, proctoring, instructor assignments, or high-stakes examination claims.
- A text assessment does not pretend to measure simulator positioning or perception.

---

<a id="19-content-publication"></a>

<a id="19-content-publication--reviewed-learning-content-publication"></a>
## Reviewed learning-content publication

Task status is tracked only in [`../../specs/tasks.md`](../../../specs/tasks.md).

<a id="19-content-publication--objective"></a>
## Objective

Persist and publish exact reviewed bilingual Academy lessons and Assessment items with a trusted local administrator boundary, then expose only eligible public content. This prepares the real learning journeys without inventing reviewer approval.

<a id="19-content-publication--observable-acceptance"></a>
## Observable acceptance

- **PUB-REQ-001:** Draft source import stores immutable Academy and Assessment versions with server-derived hashes; duplicate or changed bytes under one version fail.
- **PUB-REQ-002:** Only a provisioned administrator principal can admit an exact Nicolas review receipt and perform revision-checked, audited publish/retire transitions. Application and anonymous credentials cannot.
- **PUB-REQ-003:** Every catalog/detail/start read recompiles stored source and bound review; corruption or mismatched identity fails closed. Retirement removes new eligibility but preserves historical pinned reads.
- **PUB-REQ-004:** Academy serves only published bilingual lesson content and prepared follow-ups, and links practice only when the exact target is currently eligible.
- **PUB-REQ-005:** Assessment catalog and active attempts reveal no private rubric, accepted answer, or correction; each item and result pins exact reviewed source/rubric identity.

<a id="19-content-publication--boundaries"></a>
## Boundaries

- Follow [`../../contracts/learning-publication.md#content-administrator-admission-v1`](../../../contracts/learning-publication.md#content-administrator-admission-v1), Academy and Assessment authority contracts. Approval, admission, local publication, and deployment are distinct facts.
- Publication eligibility requires a recorded trusted review and audited transition; source hashes and tests alone never imply approval. The first approved lesson and three approved exercises reached that state locally on 2026-11-06; see [`review.md`](review.md#19-content-publication).
- A public Assessment attempt also requires the separate owner, evaluation, and persistence contracts. This feature does not replace them.

<a id="19-content-publication--route-choice"></a>
## Route choice

Delegated SDD after shared contract and schema coordination. The coordinator owns schema/roles/admin integration and status; bounded readers/UI/evaluator tasks can be delegated once exact contracts and exclusive paths are frozen. Independent review is required for authority, privacy, schema, scoring and final journeys.

---

<a id="21-learning-ui-first"></a>

<a id="21-learning-ui-first--learning-interface-first-pass"></a>
## Learning interface-first pass

Task status is tracked only in `../../specs/tasks.md`.

<a id="21-learning-ui-first--objective"></a>
## Objective

Make Academy and Assessments visually understandable and navigable before their approved content is admitted to the production publication database. Keep public routes truthful and prepare reusable presentation components for the existing published readers and attempt lifecycle.

<a id="21-learning-ui-first--observable-acceptance"></a>
## Observable acceptance

- **LUI-REQ-001:** Academy has a bilingual, responsive catalog, lesson, example, source, prepared follow-up, and related-practice presentation. A separate visibly unpublished interface preview can show the exact approved lesson without adding it to the public catalog.
- **LUI-REQ-002:** Assessments have a bilingual, responsive catalog, question, and correction presentation for the three approved draft exercise types. The question screen receives only an active-attempt public projection; correction appears only on a separate request or finalized result view.
- **LUI-REQ-003:** Public Academy and Assessment routes keep their existing publication, ownership, eligibility, save, start, and finalize boundaries. Unavailable data never falls back to draft content. Preview links do not claim saved or scored attempts.
- **LUI-REQ-004:** An Academy interface preview is direct-only, visibly marked unpublished, and noindex. Assessment interface preview is available only through the existing local draft-only editorial gate; each question/correction request passes that gate. Original editorial review pages remain available.
- **LUI-REQ-005:** Spanish and English, desktop and 390px mobile layouts, keyboard navigation, and clear empty/unavailable states receive focused visual inspection. No broad new test suite is part of this UI pass.

<a id="21-learning-ui-first--boundaries"></a>
## Boundaries

Approved Academy and Assessment source texts, answers, rubrics, hashes, and source provenance are unchanged. This pass does not publish content, create a reviewer credential, score a demo answer, save a demo attempt, or alter the simulator. The final public learning journeys remain open until trusted publication and real end-to-end acceptance.
