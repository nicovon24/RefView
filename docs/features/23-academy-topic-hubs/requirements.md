# Academy topic navigation and real-play slots

Task status is tracked only in `../../specs/tasks.md`.

## Objective

Make the 2026/27 Academy directory useful before lesson publication: each law card explains its scope in one line, and a law can lead to navigable topic hubs. The first hub is Law 12's `challenge` topic. User-supplied real plays are a later editorial input; no invented plays or fake media are shown.

## Observable acceptance

- **ATH-REQ-001:** The 17 Academy law cards show their existing bilingual one-line original overviews without hiding their links.
- **ATH-REQ-002:** Law 12 shows one bilingual navigable topic card for `challenge`; other laws show an honest no-topics state. Static topic metadata has only identity, edition, primary law, title, and a brief scope sentence. Its presence does not claim a lesson is published.
- **ATH-REQ-003:** `/[locale]/academy/rules/12/topics/challenge` shows the topic orientation, official Law 12 and pinned 2026/27 references, a published-lesson area, and a real-play area. Locale/back navigation works; invalid law/topic combinations return 404.
- **ATH-REQ-004:** Only the verified publication catalog can provide lesson links, filtered by exact topic and edition. A successful empty catalog and an unavailable database have distinct copy. The approved unpublished lesson and Assessment drafts are not discoverable from these pages.
- **ATH-REQ-005:** Real-play area says no real plays are available yet. It does not render two empty faux cards, fictional incidents, images, or links. A later content review can add up to two user-supplied examples per topic without changing this publication boundary.
- **ATH-REQ-006:** ES/EN desktop/mobile navigation, keyboard focus, invalid routes, public draft exclusion, and no horizontal overflow receive focused Playwright CLI inspection. No broad test suite is added for this UI pass.

## Boundaries

The exact approved Academy lesson source/hash, Assessment source/rubric hashes, PostgreSQL publication process, and simulator are unchanged. This pass changes local application UI only. Existing ARD-REQ-003's published-only rule continues to apply to **lesson cards**; static topic navigation is a separate layer and cannot expose lesson text.
