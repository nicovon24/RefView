# Product concept supporting states

## Boundary

RV-018 remains a static, bilingual product concept. The source is `docs/prototype/`; the byte-identical copy under `apps/web/public/prototype/` lets the running Next.js app link to it. State demonstrations must never imply a network request, production authorization, a working content catalogue, or a playable assistant/VAR role. The existing React site shell already carries the prototype typography, palette, buttons and navigation under verified RV-019F; this slice does not replace it.

## State contract

The scenario catalogue owns one in-memory display state: `ready`, `loading-example`, `error-example`, `empty-search`, or `planned-content`. The initial state is `ready`. A clearly labelled concept-state control demonstrates loading and error; no timer or request is involved. Loading has an explicit return to the loaded fixture. Error has retry through the demonstration loading state and a route back to role selection. Search filters the existing fixture examples; a nonmatching query yields an empty result with Clear search. Planned examples open an explanation with return to catalogue and a route to the available fixture; they never unlock a scenario. Switching language preserves state and query.

Role selection is retained in memory. Main referee enters the existing briefing journey; assistant reaches a persistent planned-role explanation; VAR can enter only the labelled illustrative workspace. Any route from a supporting state to another view must move focus to the destination heading or view. Hidden panels must have no tabbable controls. All new text, button names, status/error announcements and search labels are complete in Spanish and English. At mobile width, the existing desktop-only simulator notice remains visible.

## Acceptance and honest limits

Playwright CLI checks both standalone source and Next-served copy at 1440×1000 and 390×844, language changes within each state, keyboard recovery, main journey regression, absence of horizontal overflow and console errors. Source/public copies must compare byte-for-byte. A `web-design-guidelines` audit covers the final interface. Run application lint, typecheck and build after the copied files land; an independent read-only review is required before changing RV-018 status.

This state slice does not make Academy search, Profile preferences, saved links, or distinct Community match details functional. Review those principal-journey gaps before claiming all CON-REQ-002/003 complete. Documentation must distinguish fixture data and illustrative controls from implemented product behavior.

## Principal-journey truth pass

The next static-concept slice closes only known misleading controls. Academy search filters the existing seven local topic buttons and selects a visible topic when needed; a nonmatching query shows a bilingual empty state with Clear search, not a remote search claim. Language switching preserves the query and rerenders results. The second Community match selector is presented as planned illustrative content: it may show a clear unavailable explanation, but must not change the selected match or imply distinct rating/discussion data. The existing first fictional fixture retains its local rating/comment behavior. Profile's decorative saved items, preferences and unavailable attempt are visibly labelled illustrative and made non-interactive unless they can navigate to an exact existing matching view. Do not add real persistence, new match facts, backend calls or fake account settings.

Browser acceptance covers Spanish/English Academy search, topic selection, nonmatching/clear, Community planned match explanation without changing active fixture, and Profile no-dead-control semantics at desktop/mobile. Existing simulator and supporting-state journeys must remain intact. Source/public parity, syntax, browser evidence, build and independent read-only review are required. A later final bilingual and Web Interface Guidelines audit remains separate.
