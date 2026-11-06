# App-first delivery design

## Dependency decision

The former backlog order made every non-simulator journey wait for simulator acceptance and chained unrelated sections together. That is an implementation order, not a domain requirement. Independent content and owner contracts can proceed now. Cross-feature integrations remain gated by the actual published target they use.

| Slice | Can ship before the saved simulator attempt | Later integration gate |
| --- | --- | --- |
| Academy | Original summaries of all 17 Laws, navigable topics, official references, controlled published lesson, prepared answers, and saved content | Positive practice link requires a compatible published Assessment or incident |
| Assessments | Reviewed text exercises, deterministic evaluation, owned results | Simulator-derived analysis requires a published, calibrated incident |
| Community | Clearly fictional, read-only post-first visual demonstration | Shared contributor publishing requires durable accounts, media and moderation contracts, privacy review, and a separate exposure decision under RV-036; RV-035 is superseded |
| Profile | Persisted preferences and eligible saved content | Simulator history/progress requires real owned finalized attempts |

## Shared contracts to freeze before implementation

1. **Content identity:** immutable edition, source URL, content version/hash, locale equivalence, publication state, and retirement behavior.
2. **Owner identity:** RV-006A/RV-006B verify the private application owner runtime, admission, and deletion. Each assessment result and saved item still needs its feature-specific owner-bound acceptance. Shared Community contributions require reviewed durable accounts and explicit retention/deletion effects; the earlier isolated simulator cookie proof alone was test-only.
3. **Authority:** server-only answer keys and scoring; moderator identity and transitions are server validated; community opinions cannot alter educational facts; prepared explanations cannot mutate scores.
4. **Availability:** every recommendation resolves to a reviewed published target with compatible edition and topic, or displays an unavailable state.

## Delivery order

Nicolas's current sequencing decision is one active module at a time. Existing verified contracts and interfaces remain available, but unfinished work in another module is not an active parallel delivery commitment. The local 3D playtest and simulator are last.

1. Academy: expand the 17 Law pages into useful original bilingual summaries and key points; complete Academy-scoped trusted publication of the approved lesson; verify discovery, reading, sources, prepared follow-ups, and saving. Keep the absent practice target explicit.
2. Assessments: publish the three approved exercises and complete the owner-bound answer, correction, restore, and next-practice journey. Connect the compatible Academy practice link and close the full Academy learning loop.
3. Community: accept the clearly fictional visual post-first journey. Accounts, user publishing, uploads, reactions, shared feed, and moderation remain a separate later functional scope.
4. Early Profile: accept preferences, owned saved content, privacy controls, and honest empty simulator history.
5. Local 3D playtest and first simulator incident: complete evidence-critical pose/calibration and trusted publication, then live observation, decision, saved/scored evaluation, debrief, replay, and Profile history.
6. Cosmetic simulator refinement and fresh visual acceptance after the functional incident is accepted.

## Verification

Use Vitest for deterministic content, eligibility, scoring, and state transitions; PostgreSQL for owner-bound persistence and concurrency; Playwright CLI for real browser journeys and responsive checks. Review every delegated slice independently. Record exact commands and results in the relevant feature review document and update only `docs/specs/tasks.md` for task status.
