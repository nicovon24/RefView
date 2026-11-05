# Academy rules directory design

Use static, bilingual, edition-pinned navigation metadata for laws 1–17. Titles are checked against the IFAB 2026/27 English and Spanish law indexes. Brief RefView overviews describe scope without copying official passages or claiming lesson review. Each page links to the corresponding official online law and to the edition-specific IFAB 2026/27 PDF; the online `latest` route can advance editions, so the pinned PDF remains the edition authority.

The Academy catalog reader remains the only source of published lesson cards. The subsequent topic-hub feature introduced static topic navigation on the law page, independent of database availability. Its topic route filters the verified published catalog projection by `IFAB-2026-27` and an explicit `challenge` to Law 12 primary-law map. The current approved lesson source fixture and hash stay unchanged. A failed catalog read yields an unavailable-lesson message; a successful empty read yields no-published-lessons copy. The static directory and law pages always render.

The route namespace `/academy/rules/[lawNumber]` is disjoint from the existing `/academy/[lessonId]` route. The current Academy entry renders the directory before its existing published-lesson section. The direct-only editorial and interface previews remain unlinked from public navigation.

Official source indexes: https://www.theifab.com/ and https://www.theifab.com/es/ (2026/27 selected). Pinned PDFs: https://downloads.theifab.com/downloads/laws-of-the-game-202627-single-pages?l=en and https://downloads.theifab.com/downloads/reglas-de-juego-202627-paginas-individuales?l=es. The directory is local application content; it does not deploy the site externally.
