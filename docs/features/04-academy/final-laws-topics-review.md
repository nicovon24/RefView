# Foundation and match-official topic slice review

## Scope and result

RV-029B-4 satisfies ACA-REQ-009 for eight static bilingual topic guides under Laws 1, 2, 4 and 6. Each guide has three original source-linked sections, an accessible bilingual instructional SVG, a labeled generated contextual photo with a topic-specific observation cue, and sibling and adjacent navigation. The full registry now has 30 unique topic guides and at least one guide under each of the 17 Laws. The original 22 slugs remain available. These static pages need no lesson publication or database read.

The content and diagrams are in `foundation-officials-topic-content-v1.ts` and `FoundationOfficialsTopicIllustration.tsx`; the design and source matrix are in `final-laws-topics-design.md`. The eight guides reuse existing generated Law photos, whose origin is recorded in `academy-photo-assets.md`. A photo illustrates observation context and does not certify a ball, field, item of equipment, official decision, or match fact.

## Source and correction review

The supplied Spanish and official English IFAB 2026/27 single-page PDFs were checked against the Law and section/page matrix in the design. The focused source-research handoff incorrectly treated Law 4 as retaining a universal jewellery prohibition. Independent review and coordinator comparison with the operative PDF text found that non-dangerous accessories, including jewellery, may be allowed when safely and securely covered, while dangerous items must be removed. The Law 4 topic text, diagram and design were corrected. The live IFAB Law 4 page still has the older blanket wording; both Law 4 views now disclose this discrepancy next to that link and direct edition-specific claims to the pinned PDFs.

The review also narrowed a Law 1 line-boundary explanation to what Law 1 actually establishes, qualified the Law 1 measurement summary for the penalty mark's specified measurement, and distinguished mandatory FIFA/confederation ball quality marks from competition-dependent national requirements in Law 2. Law 6's video-official text stays within the operative Law and does not infer review authority from a disputed call alone. An independent Sol/high read-only re-review of the corrected source, diagrams, and integration returned **PASS** with no remaining source or visual semantics blocker. Requested identities were Astra/high for coordination, Luna/high for source research, Sol/medium for bounded content and diagram work, and Sol/high for read-only review. Runtime-confirmed model and effort were not exposed and remain unconfirmed.

## Local verification

- `pnpm --filter @refview/web typecheck`: passed after the final code changes.
- `pnpm --filter @refview/web exec eslint src/features/academy/AcademyRulesViews.tsx src/features/academy/FoundationOfficialsTopicIllustration.tsx src/features/academy/TopicIllustration.tsx src/features/academy/academy-photo-v1.ts src/features/academy/foundation-officials-topic-content-v1.ts src/features/academy/law-depth-1-8.ts src/features/academy/rules-directory-v1.ts src/features/academy/topic-depth-v1.ts`: passed after the final code changes.
- Playwright CLI opened all 32 combinations of eight slugs, ES/EN, and 1280/390 pixel viewport widths after the corrections. Each returned HTTP 200, had the localized title, three explanatory sections and three edition PDF links, an accessible SVG and loaded photo, and no document-level horizontal overflow. All 16 ES/EN desktop diagram screenshots were visually inspected; corrected Law 1, 2 and 4 variants were inspected again after editing.
- Playwright CLI opened the ES/EN Law 1, 2, 4 and 6 listings. Each returned HTTP 200 and linked both topics. A wrong Law/slug combination returned HTTP 404. The language switch retained its slug, the sibling and global adjacent links resolved, and the diagram was focusable and keyboard-scrollable at 390 pixels without widening the document. The Law 4 discrepancy note appeared beside the live link. Browser console had zero errors and one Next.js image LCP hint.

No automated tests were added or run for this static content slice.
