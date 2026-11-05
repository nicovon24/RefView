# RefView feature specifications

Task status lives only in [`../specs/tasks.md`](../specs/tasks.md). Feature files define requirements and task contracts; they do not duplicate status.

## Delivery spine

```text
Foundation and first incident (RV-001..011)
  -> simulator roles/sessions acceptance (RV-012..017)
  -> Academy acceptance (RV-020..024)
  -> fictional Community acceptance (RV-030..034)
  -> Assessments acceptance (RV-040..044)
```

Cross-cutting work:

- Full-product visual concept: RV-018, after workspace bootstrap and before final simulator/Academy UI inheritance.
- Preferences/history/profile: RV-050..054, integrated when each upstream result contract exists.
- Provider-free Coach: RV-060..061 bridges the first Academy lesson and Academy acceptance.
- Hosted Coach: RV-062..064 is optional and requires explicit authorization/provider review.
- Catalog/multi-incident research: RV-070..072 may proceed after simulator acceptance without blocking wider product foundations.

## Feature documents

- [`00-foundation/`](00-foundation/review.md)
- [`01-playable-incident/`](01-playable-incident/requirements.md)
- [`02-product-concept/`](02-product-concept/requirements.md)
- [`03-simulator-expansion/`](03-simulator-expansion/requirements.md)
- [`04-academy/`](04-academy/requirements.md)
- [`05-community/`](05-community/requirements.md)
- [`06-assessments/`](06-assessments/requirements.md)
- [`07-profile-preferences/`](07-profile-preferences/requirements.md)
- [`08-ai-coach/`](08-ai-coach/requirements.md)
- [`09-simulator-research/`](09-simulator-research/requirements.md)

- [`22-academy-rules-directory/`](22-academy-rules-directory/requirements.md)
- [`23-academy-topic-hubs/`](23-academy-topic-hubs/requirements.md)
- [`24-academy-law-expansion/`](24-academy-law-expansion/requirements.md)

## Planning boundary

Only tasks whose dependencies, contracts, ownership paths, and verification are concrete may move to `Ready`. Far-horizon tickets are intentionally adjustable. Refinement should preserve stable IDs and change acceptance/dependencies explicitly rather than silently expanding implementation.

The expanded backlog passed independent consistency review after three corrections; see [`00-foundation/backlog-review.md`](00-foundation/backlog-review.md).
