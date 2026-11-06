# Academy review evidence

Task status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

## RV-020 contract

The coordinator froze [`../../contracts/academy-content-v1.md`](../../contracts/academy-content-v1.md) after two correction rounds. Independent read-only Sol/high review returned PASS on the final exact source shape, bilingual citation coverage keys, canonical hash, hash-bound Nicolas review, authenticated publication and retirement transitions, PostgreSQL review binding, and read-time practice eligibility. The runtime-confirmed model/effort was unconfirmed. This is contract approval only; no lesson is published or persisted by this review.

## RV-021A editorial preview

The bilingual version-1 editorial preview is directly reachable at `/es/academy/editorial-preview` and `/en/academy/editorial-preview`. It is marked unpublished and excluded from discovery, scoring, and practice. The content distinguishes authored facts, observable evidence, interpretation, and application, links the edition-pinned IFAB 2026/27 PDF in each language, and labels prepared answers. Independent read-only Sol/high review returned PASS for the draft scope; runtime-confirmed identity was unconfirmed. The reviewer independently downloaded both PDFs, matched the recorded sizes and SHA-256 digests, and checked the cited printed pages and paraphrases. The English source note lacks the Spanish note's inspection date; this is nonblocking for a draft and must be resolved when building the exact published source record.

After the final code edit, the coordinator observed:

- `pnpm --filter @refview/web test`: 37 files passed, 3 skipped; 197 tests passed, 6 skipped.
- `pnpm --filter @refview/web typecheck`: passed.
- `pnpm --filter @refview/web lint`: passed.
- `pnpm --filter @refview/web build`: passed; both editorial-preview locale routes generated.
- `playwright-cli -s=refview-academy open http://localhost:3000/es/academy/editorial-preview`: Spanish draft title, source, and unpublished label visible; no console warnings or errors on the initial route.
- `playwright-cli -s=refview-academy resize 390 844`: no horizontal overflow; the draft label and notice remain visible.
- `playwright-cli -s=refview-academy click e9`: English route and localized title loaded while preserving the preview path.
- `playwright-cli -s=refview-academy click "getByText('Why no yellow card?')"`: the native details panel opened with a visibly labelled prepared answer.
- Browser DOM inspection: `noindex, nofollow`; four prepared details; zero practice/simulator links. Source search found no discovery link to the editorial preview.

Visual captures: [`../../../artifacts/academy-draft-desktop.png`](../../../artifacts/academy-draft-desktop.png) and [`../../../artifacts/academy-draft-mobile.png`](../../../artifacts/academy-draft-mobile.png). These show the readable desktop and mobile draft layout.

This does not approve the football meaning or translations for publication. Nicolas's content review and the executable source/publication flow remain RV-021/RV-022 work.

## Exact RV-021 candidate for Nicolas

The source fixture in `apps/web/src/features/academy/lesson-source-v1.ts` is the normalized bilingual draft at `(careless-trip-in-penalty-area, version 1)`. The first server-derived candidate hash was `sha256:b7f69d659c1ed66f7de0a96fba75c3b4c407d8e6dfcca4d52869d8e6b057703d`. It bound provisional wording and empty practice mappings. That candidate is superseded. The current draft hash is `sha256:4056b7d5cac8d8886003602464dd82cb633fbc74e198c49597049a52cdf59f6b`: the hashed lesson conclusion no longer says it awaits review, while the separate preview notice still does, and the source refers to `careless-trip-penalty-restart` v1 Assessment practice. Read-time publication eligibility still determines whether any eventual practice link works. The preview renders lesson source fields from this exact draft.

Bounded Sol/medium implementation used red/green TDD: the source test initially failed before the module existed, then four focused tests passed after expanding hash coverage for both locales, citations, follow-ups, ordering, and a valid nonempty practice mapping. Independent Sol/high read-only review first returned FIX for source-rendering and coverage gaps; after corrections it returned PASS for presenting this exact draft to Nicolas. Runtime-confirmed identities were unconfirmed. Both PDF digests and printed-page locators were independently rechecked. This is a review candidate, not a trusted approval or published lesson.

Final integration gate after the source-rendering edit: `pnpm --filter @refview/web test` passed 39 files/207 tests (3 files/6 tests skipped); web typecheck, web lint, content typecheck, and web production build all passed. Playwright CLI reloaded the Spanish preview and confirmed the five canonical source locators, the official Spanish PDF URL/digest, the draft label, and no score/practice link. The desktop capture is [`../../../artifacts/academy-draft-canonical-desktop.png`](../../../artifacts/academy-draft-canonical-desktop.png).

After the later draft revision, focused Academy source tests passed 4/4. Independent Sol/high read-only re-review returned PASS for the revised unpublished candidate and its exact Assessment practice reference; the combined Academy/Assessment focused suite passed 7/7, web typecheck and targeted lint passed. Reviewer runtime identity was unconfirmed. The prior Nicolas approval request referred to the superseded hash; a new request names the current hash. Browser recheck, exact-hash approval, trusted admission, and publication remain open.

## Published-reader preparation

The server-only Academy reader verifies a reviewed publication, the mapped reviewer, evidence and timestamp binding, exact source hash, and retirement/withdrawal history before exposing lesson data. A distinctly named `synthetic-academy-publication-test` source was admitted and published solely in `refview_test` by `refview_reviewer_test` under the synthetic test principal. It is not the editorial lesson. Focused PostgreSQL tests passed 5/5, including positive published read and rolled-back retired/revoked cases. Independent Sol/high read-only review returned PASS after the real PostgreSQL fixture was added; the test-suite registration also passed independent review. Requested model/effort: Sol/medium for implementation and Sol/high for review; runtime-confirmed identities: unconfirmed. The full PostgreSQL suite then passed 82/82, and web typecheck, lint, and production build passed. The real lesson remains draft with no Nicolas review or public catalog; synthetic tests do not authorize publication.

## Public Academy read journey

A bounded Sol/medium implementation added dynamic bilingual `/[locale]/academy` catalog and `/[locale]/academy/[lessonId]` detail pages. Candidate IDs come only from reviewed publications; every candidate is reloaded through the verified server-only reader before a locale-specific public projection. No editorial draft, raw source/review record, or practice target is serialized. Empty, missing, and database-unavailable states are distinct. The shared navigation now links Academy. Independent Sol/high code review returned PASS for this bounded scope, with an optional HTTP 404 improvement for unknown shaped IDs. Requested model/effort Sol/medium and Sol/high; runtime-confirmed identities unconfirmed.

The first Chrome load showed the fail-closed unavailable state and a PostgreSQL `42501` error: the newly restricted app role lacked content table SELECT. A separately reviewed migration granted app SELECT on exactly 11 verified Academy/Assessment content tables and EXECUTE on the Assessment eligibility lock, without content writes; it applied to `refview_test` and `refview` under their migration logins. A separate-login test confirmed Academy SELECT, direct content DELETE denial, and eligibility EXECUTE. After migration, Playwright CLI Chrome showed the honest empty Spanish catalog with zero console errors, changed to English, found no overflow at 390x844, and showed an unavailable detail for the unpublished editorial lesson without its content. The app database still contains no real review or publication event; this is a working publication-gated read surface, not a published lesson.

Nicolas then explicitly approved the football interpretation, Spanish/English equivalence, and sources/provenance of the current exact lesson hash `sha256:4056b7d5cac8d8886003602464dd82cb633fbc74e198c49597049a52cdf59f6b` in this conversation on 2026-11-04. His earlier approval of the superseded hash is recorded as history only. These statements are not yet a trusted database admission: the reviewed v1 contract requires a distinct Nicolas-bound reviewer credential, exact evidence digest, all-true receipt, and authenticated CLI confirmation. The public catalog correctly remains empty.

The coordinator generated `review-evidence-v1.json` from the compiled current source and checked its exact-file digest `sha256:59b6703690e8f961d9c806a625c8a200f00c4c9b14c44dc113b6bbde527b452a` against `review-receipt-candidate-v1.json`. The artifact embeds the approved source hash and both locales. This is a candidate evidence package, not a trusted review row. The reviewed local CLI can verify the same hash in `refview_test`; it must be run by Nicolas with his separately claimed reviewer credential for real admission and publication.
