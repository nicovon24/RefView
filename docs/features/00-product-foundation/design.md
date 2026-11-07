<a id="02-product-concept"></a>

<a id="02-product-concept--product-concept-supporting-states"></a>
## Product concept supporting states

<a id="02-product-concept--boundary"></a>
## Boundary

RV-018 remains a static, bilingual product concept. The source is `docs/prototype/`; the byte-identical copy under `apps/web/public/prototype/` lets the running Next.js app link to it. State demonstrations must never imply a network request, production authorization, a working content catalogue, or a playable assistant/VAR role. The existing React site shell already carries the prototype typography, palette, buttons and navigation under verified RV-019F; this slice does not replace it.

<a id="02-product-concept--state-contract"></a>
## State contract

The scenario catalogue owns one in-memory display state: `ready`, `loading-example`, `error-example`, `empty-search`, or `planned-content`. The initial state is `ready`. A clearly labelled concept-state control demonstrates loading and error; no timer or request is involved. Loading has an explicit return to the loaded fixture. Error has retry through the demonstration loading state and a route back to role selection. Search filters the existing fixture examples; a nonmatching query yields an empty result with Clear search. Planned examples open an explanation with return to catalogue and a route to the available fixture; they never unlock a scenario. Switching language preserves state and query.

Role selection is retained in memory. Main referee enters the existing briefing journey; assistant reaches a persistent planned-role explanation; VAR can enter only the labelled illustrative workspace. Any route from a supporting state to another view must move focus to the destination heading or view. Hidden panels must have no tabbable controls. All new text, button names, status/error announcements and search labels are complete in Spanish and English. At mobile width, the existing desktop-only simulator notice remains visible.

<a id="02-product-concept--acceptance-and-honest-limits"></a>
## Acceptance and honest limits

Playwright CLI checks both standalone source and Next-served copy at 1440×1000 and 390×844, language changes within each state, keyboard recovery, main journey regression, absence of horizontal overflow and console errors. Source/public copies must compare byte-for-byte. A `web-design-guidelines` audit covers the final interface. Run application lint, typecheck and build after the copied files land; an independent read-only review is required before changing RV-018 status.

This state slice does not make Academy search, Profile preferences, saved links, or distinct Community match details functional. Review those principal-journey gaps before claiming all CON-REQ-002/003 complete. Documentation must distinguish fixture data and illustrative controls from implemented product behavior.

<a id="02-product-concept--principal-journey-truth-pass"></a>
## Principal-journey truth pass

The next static-concept slice closes only known misleading controls. Academy search filters the existing seven local topic buttons and selects a visible topic when needed; a nonmatching query shows a bilingual empty state with Clear search, not a remote search claim. Language switching preserves the query and rerenders results. The second Community match selector is presented as planned illustrative content: it may show a clear unavailable explanation, but must not change the selected match or imply distinct rating/discussion data. The existing first fictional fixture retains its local rating/comment behavior. Profile's decorative saved items, preferences and unavailable attempt are visibly labelled illustrative and made non-interactive unless they can navigate to an exact existing matching view. Do not add real persistence, new match facts, backend calls or fake account settings.

Browser acceptance covers Spanish/English Academy search, topic selection, nonmatching/clear, Community planned match explanation without changing active fixture, and Profile no-dead-control semantics at desktop/mobile. Existing simulator and supporting-state journeys must remain intact. Source/public parity, syntax, browser evidence, build and independent read-only review are required. A later final bilingual and Web Interface Guidelines audit remains separate.

---

<a id="17-app-first-delivery"></a>

<a id="17-app-first-delivery--app-first-delivery-design"></a>
## App-first delivery design

<a id="17-app-first-delivery--dependency-decision"></a>
## Dependency decision

The former backlog order made every non-simulator journey wait for simulator acceptance and chained unrelated sections together. That is an implementation order, not a domain requirement. Independent content and owner contracts can proceed now. Cross-feature integrations remain gated by the actual published target they use.

| Slice | Can ship before the saved simulator attempt | Later integration gate |
| --- | --- | --- |
| Academy | Original summaries of all 17 Laws, navigable topics, official references, controlled published lesson, prepared answers, and saved content | Positive practice link requires a compatible published Assessment or incident |
| Assessments | Reviewed text exercises, deterministic evaluation, owned results | Simulator-derived analysis requires a published, calibrated incident |
| Community | Clearly fictional, read-only post-first visual demonstration | Shared contributor publishing requires durable accounts, media and moderation contracts, privacy review, and a separate exposure decision under RV-036; RV-035 is superseded |
| Profile | Persisted preferences and eligible saved content | Simulator history/progress requires real owned finalized attempts |

<a id="17-app-first-delivery--shared-contracts-to-freeze-before-implementation"></a>
## Shared contracts to freeze before implementation

1. **Content identity:** immutable edition, source URL, content version/hash, locale equivalence, publication state, and retirement behavior.
2. **Owner identity:** RV-006A/RV-006B verify the private application owner runtime, admission, and deletion. Each assessment result and saved item still needs its feature-specific owner-bound acceptance. Shared Community contributions require reviewed durable accounts and explicit retention/deletion effects; the earlier isolated simulator cookie proof alone was test-only.
3. **Authority:** server-only answer keys and scoring; moderator identity and transitions are server validated; community opinions cannot alter educational facts; prepared explanations cannot mutate scores.
4. **Availability:** every recommendation resolves to a reviewed published target with compatible edition and topic, or displays an unavailable state.

<a id="17-app-first-delivery--delivery-order"></a>
## Delivery order

Nicolas's current sequencing decision is one active module at a time. Existing verified contracts and interfaces remain available, but unfinished work in another module is not an active parallel delivery commitment. The local 3D playtest and simulator are last.

1. Academy: expand the 17 Law pages into useful original bilingual summaries and key points; complete Academy-scoped trusted publication of the approved lesson; verify discovery, reading, sources, prepared follow-ups, and saving. Keep the absent practice target explicit.
2. Assessments: publish the three approved exercises and complete the owner-bound answer, correction, restore, and next-practice journey. Connect the compatible Academy practice link and close the full Academy learning loop.
3. Community: accept the clearly fictional visual post-first journey. Accounts, user publishing, uploads, reactions, shared feed, and moderation remain a separate later functional scope.
4. Early Profile: accept preferences, owned saved content, privacy controls, and honest empty simulator history.
5. Local 3D playtest and first simulator incident: complete evidence-critical pose/calibration and trusted publication, then live observation, decision, saved/scored evaluation, debrief, replay, and Profile history.
6. Cosmetic simulator refinement and fresh visual acceptance after the functional incident is accepted.

<a id="17-app-first-delivery--verification"></a>
## Verification

Use Vitest for deterministic content, eligibility, scoring, and state transitions; PostgreSQL for owner-bound persistence and concurrency; Playwright CLI for real browser journeys and responsive checks. Review every delegated slice independently. Record exact commands and results in the relevant feature review document and update only `docs/specs/tasks.md` for task status.
