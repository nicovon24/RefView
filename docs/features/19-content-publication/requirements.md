# Reviewed learning-content publication

Task status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

## Objective

Persist and publish exact reviewed bilingual Academy lessons and Assessment items with a trusted local administrator boundary, then expose only eligible public content. This prepares the real learning journeys without inventing reviewer approval.

## Observable acceptance

- **PUB-REQ-001:** Draft source import stores immutable Academy and Assessment versions with server-derived hashes; duplicate or changed bytes under one version fail.
- **PUB-REQ-002:** Only a provisioned administrator principal can admit an exact Nicolas review receipt and perform revision-checked, audited publish/retire transitions. Application and anonymous credentials cannot.
- **PUB-REQ-003:** Every catalog/detail/start read recompiles stored source and bound review; corruption or mismatched identity fails closed. Retirement removes new eligibility but preserves historical pinned reads.
- **PUB-REQ-004:** Academy serves only published bilingual lesson content and prepared follow-ups, and links practice only when the exact target is currently eligible.
- **PUB-REQ-005:** Assessment catalog and active attempts reveal no private rubric, accepted answer, or correction; each item and result pins exact reviewed source/rubric identity.

## Boundaries

- Follow [`../../contracts/content-administrator-admission-v1.md`](../../contracts/content-administrator-admission-v1.md), Academy and Assessment authority contracts. Approval, admission, local publication, and deployment are distinct facts.
- The current Academy and Assessment fixtures are unpublished candidates. No positive review or publication is implied by tests or source hashes.
- A public Assessment attempt also requires the separate owner, evaluation, and persistence contracts. This feature does not replace them.

## Route choice

Delegated SDD after shared contract and schema coordination. The coordinator owns schema/roles/admin integration and status; bounded readers/UI/evaluator tasks can be delegated once exact contracts and exclusive paths are frozen. Independent review is required for authority, privacy, schema, scoring and final journeys.
