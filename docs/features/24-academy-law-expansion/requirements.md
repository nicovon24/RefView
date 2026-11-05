# Academy law topic expansion

Task status is tracked only in `../../specs/tasks.md`.

## Objective

Extend the Academy's 2026/27 Law navigation using the supplied IFAB PDF as a source map. Add icons to all 17 directory cards, select useful topic clusters for Laws 11, 12, and 14, and make those topics navigable with original bilingual orientation, key concepts, and precise official source references. Real match cases and reviewed lessons remain separate later inputs.

## Observable acceptance

- **ALE-REQ-001:** All 17 Law cards have a distinct, locally authored, decorative icon with accessible text still supplied by the Law title and link. Cards preserve their one-line scope, links, and desktop/mobile layout.
- **ALE-REQ-002:** Law 12 offers the existing `challenge` topic plus `handball`, `indirect-free-kick`, and `disciplinary-sanctions`; Law 11 offers `offside-position-and-involvement`; Law 14 offers `penalty-procedure`. Each card links to its exact bilingual topic route. Other Laws retain honest no-topics states.
- **ALE-REQ-003:** Each of these six topic pages has an original bilingual scope, a short explanation, two or three key concepts, and a specific 2026/27 IFAB PDF section/page reference. The official online Law remains a convenience link and is labelled as edition-variable.
- **ALE-REQ-004:** Topic metadata contains no invented plays, media, lesson IDs, answer keys, scoring, or draft fixture content. The real-play area remains empty until Nicolas supplies real cases with source/rights. Only the verified catalog may provide lesson links, filtered by exact topic and edition; the approved unpublished lesson and Assessment drafts remain undiscoverable.
- **ALE-REQ-005:** ES/EN desktop/mobile navigation, icons, precise source links, keyboard focus, invalid routes, public draft exclusion, and no horizontal overflow receive focused Playwright CLI inspection. No broad UI test suite is added.

## Source and rights

Source: Nicolas's local `Reglas de Juego 2026_27_paginas individuales.pdf`, IFAB 2026/27, 276 pages. The PDF's page 4 prohibits reproduction without prior consent. RefView writes original orientation and links to the official publication; it does not copy rule paragraphs or diagrams. Spanish physical PDF page numbers match printed pages for the selected sections. Verify English PDF page targets before adding page-fragment links in that locale.
