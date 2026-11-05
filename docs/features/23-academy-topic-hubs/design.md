# Academy topic hub design

The information path is law directory → law → topic hub → published lesson → related published practice. Law card descriptions reuse the already reviewed `law.overview` navigation copy. The first static topic is `challenge` under Law 12, labelled `Contacto y gravedad de la acción` / `Contact and challenge severity`, with one original orientation sentence. Other laws have no static topic entries yet.

The static topic registry contains no lesson IDs, draft titles, authored facts, proposed decisions, scores, Assessment IDs, or media. The law page presents static topics as navigable outlines and separate official references. The topic route validates canonical law number, supported locale, slug, and exact primary-law membership. It reads `readAcademyCatalog(locale)` and filters only verified published lessons by `topicId === 'challenge'` and `lawsEdition === 'IFAB-2026-27'`. On read failure, lesson availability is unknown; on a successful empty read, no lesson is published. Neither state falls back to draft fixtures.

The topic page leaves a real-play section with truthful empty copy. Future plays are curated user-supplied content with source/rights and bilingual descriptions. Media and decisions cannot be silently added to the approved lesson or Assessment hashes. Before adding cases, define a reviewed content version, source provenance, and how any initial versus correction-only evidence is shown.

Official references reuse `officialLawUrl` and `officialEditionPdfUrl` from the existing law directory. The online IFAB `latest` page may advance edition; the 2026/27 PDF is the edition authority. The local PDF inspected by Nicolas is reference material, not copied site content.
