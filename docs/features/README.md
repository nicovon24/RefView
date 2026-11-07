# RefView feature specifications

Task status lives only in [`../specs/tasks.md`](../specs/tasks.md). These grouped feature areas hold requirements, design decisions, task contracts, reviews, and supporting evidence. Section anchors preserve references to the original feature slices.

## Product areas

1. [Product foundation](00-product-foundation/requirements.md) — workspace foundation, product concept, and app-first delivery.
2. [Academy](01-academy/requirements.md) — Law directory, topic hubs, Law expansion, lessons, and publication experience.
3. [Profile and accounts](04-profile-accounts/requirements.md) — preferences, owner lifecycle, Google sign-in, and saved learning data.
4. [Simulator incident](05-simulator-incident/requirements.md) — first playable incident, simulator expansion, and incident research.
5. [Community](03-community/requirements.md) — fictional read-only foundation and account-owned social contributions.
6. [3D simulator experience](06-simulator-experience/requirements.md) — playtest presentation, interface refinement, characters, motion, match experience, and integrated assessment work.
7. [AI Coach](07-ai-coach/requirements.md) — provider-free coach boundary and optional hosted-provider work.

Assessment and learning-interface requirements remain preserved in the [simulator assessment integration workstream](06-simulator-experience/assessment-integration/requirements.md), alongside its design, task contracts, reviews, visual journey, and publication evidence. This workstream sits inside the 3D simulator area, not in the product-area index. Task status remains only in the canonical tracker.

Each product area has one `requirements.md`, `design.md`, `tasks.md`, and `review.md` where applicable. Supporting briefs, licenses, and review receipts stay beside the area they support. The assessment integration retains its own source history under the simulator area so its acceptance and evidence are not lost.

## Delivery spine

```text
Foundation and preserved incident work
  -> Academy Law summaries and controlled lesson publication
  -> locally shared Community contribution slice
  -> 3D simulator experience with integrated assessment work
  -> early Profile acceptance
  -> saved/scored first authored incident
  -> Profile simulator history and cosmetic simulator refinement
```

Cross-cutting work:

- Full-product visual concept follows workspace bootstrap and informs Academy and simulator UI.
- Preferences and account-owned history integrate when each upstream result contract exists.
- Provider-free Coach follows accepted lesson and incident contexts; hosted Coach remains optional and requires explicit authorization.
- Catalog and multi-incident research may proceed after simulator acceptance without blocking product foundations.

Reusable system contracts are grouped by domain in [`../contracts/README.md`](../contracts/README.md). The expanded backlog passed independent consistency review; see [the foundation backlog review](00-product-foundation/backlog-review.md).
