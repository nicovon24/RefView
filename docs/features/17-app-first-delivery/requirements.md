# App-first delivery sequence

Task status is tracked only in `../../specs/tasks.md`.

## Objective

Deliver Academy Law summaries and controlled published lessons first, then Assessments, the clearly fictional Community visual journey, and early Profile. The local 3D playtest and saved/scored first simulator incident come last. Refine simulator presentation only after the functional incident flow is accepted.

## Scope and acceptance

- **APP-REQ-001:** Academy exposes useful original bilingual summaries and official references for all 17 Laws, navigable topics, and one source-linked, versioned bilingual lesson with an understandable example, technical detail, and prepared follow-ups. Lesson discovery includes only reviewed published content. A positive related-practice link follows publication of a compatible Assessment or incident.
- **APP-REQ-002:** The current Community slice visually demonstrates fictional person-authored posts about selected plays, with illustrative photos/links/files, agreement/disagreement, comments and replies, grouped under Liverpool–Manchester City and Liverpool–Arsenal examples without claiming real events. The later functional journey supports contributor-created matches with duplicate handling, opinion posts with optional photo/file/external link, reactions, threaded discussion, and separate match-specific referee ratings by self-declared viewers. Fictional examples remain explicitly labeled. Actual file uploads require a separate reviewed media contract; native video upload remains deferred. Shared contributions require reviewed durable identity, owner authority, privacy, abuse controls, moderation, PostgreSQL contracts, and an explicit exposure decision.
- **APP-REQ-003:** Assessments expose reviewed bilingual exercises with private answer keys, deterministic evaluation, reasoned correction, and a link only to available compatible practice.
- **APP-REQ-004:** Profile offers persisted preferences and honest saved content. Attempt history and progress appear only after real owned attempts exist.
- **APP-REQ-005:** Every delivered route works in Spanish and English, has truthful empty/unavailable states, and passes keyboard, responsive, and browser-flow verification.
- **APP-REQ-006:** After the independent app journeys, resume the local 3D playtest and complete the first incident's trusted publication, live observation, owner-bound persistence, decision, evaluation, debrief, and replay. Cosmetic visual polish follows functional acceptance; defects that invalidate football evidence remain publication gates.

## Boundaries

- A draft lesson, fixture rating, or illustrative screen is never labelled as published training content or real community activity.
- No simulator practice link resolves to the unsaved local playtest as if it were a scored attempt.
- No assessment claims to measure positioning from text answers.
- Anonymous ownership is scoped to the current session; accounts and shared public comments require their own reviewed decision.
- This sequence does not authorize deployment, external messages, or paid services.

## Route choice

Use delegated SDD for the product slices because content, ownership, evaluation, persistence, and UI cross several modules. The coordinator owns shared contracts, schema coordination, documentation, and integration. Bounded implementation starts only after its dependencies and exclusive paths are ready; independent read-only review is required for delegated code and authority boundaries.

## Next step

Complete the Academy first stage in `../../specs/tasks.md`: useful summaries for all 17 Laws, Academy-scoped trusted publication of the already approved lesson, positive public reader, and published-lesson saving. Then finish Assessments and connect real practice from Academy. Close the Community visual slice and early Profile before resuming any local 3D playtest or simulator work. The canonical tracker records execution status.
