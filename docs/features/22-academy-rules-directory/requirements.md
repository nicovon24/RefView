# Academy rules directory

Task status is tracked only in `../../specs/tasks.md`.

## Objective

Publish a bilingual, navigable 2026/27 IFAB law directory within the local Academy site. The directory is navigation and original RefView orientation copy, not a reviewed lesson or a reproduction of the official Laws. Keep the approved unpublished Academy lesson and Assessment items out of public catalogs until the existing controlled publication process completes.

## Observable acceptance

- **ARD-REQ-001:** `/[locale]/academy` lists all 17 numbered IFAB 2026/27 laws, with bilingual official titles and working internal law links.
- **ARD-REQ-002:** `/[locale]/academy/rules/[lawNumber]` validates canonical numbers 1–17, preserves locale switching/back navigation, displays a brief original overview and an explicit official IFAB reference for that law and edition.
- **ARD-REQ-003:** Only published Academy lessons for the 2026/27 edition may appear as lesson cards. An explicit topic-to-primary-law mapping assigns `challenge` to Law 12; citations to other laws do not recategorize the lesson. The subsequent topic-hub feature adds separate static topic navigation without exposing lesson content. Published-lesson empty and database-unavailable states are distinct on the topic hub.
- **ARD-REQ-004:** The directory remains browsable without the database. It neither exposes approved draft lessons/assessments nor introduces save, score, or publication mutations.
- **ARD-REQ-005:** ES/EN desktop and 390px mobile navigation, all law links, invalid-law 404, keyboard access, and truthful public empty states receive focused Playwright CLI verification. No broad test suite is required for this interface pass.

## Future media boundary

Assessment evidence may later include curator-supplied images and external video links. Evidence available for the decision belongs to the active-attempt projection; any correction-only media stays private until finalization. External video opens its source in a new tab. This feature does not change the approved item hashes, media schema, attempt DTOs, or assessment routes.
