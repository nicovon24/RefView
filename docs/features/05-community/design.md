# Fictional Community interaction design

The normative authority and privacy rules are in [`../../contracts/community-interactions-v1.md`](../../contracts/community-interactions-v1.md). The read-only fixtures remain repository-authored and are not educational answer keys.

## Source identity

Each complete version 2 fixture, including both locales, context, invented decision, identity, author, and provenance, is compiled by `fixture-source-v1.ts`. The canonical envelope is `canonicalJsonV2(["refview-fictional-community-fixture-v1", fixture])`; SHA-256 over its UTF-8 bytes binds the immutable PostgreSQL register to the text displayed by the read view. The current candidate hashes are `sha256:8cc07f853210fb05656fc03c2307e93af6433b5646cc6c035dfccee43cc87a38` for `copa-del-faro-2025-04-12` v2 and `sha256:553913d6997c756c3f7491dd9d535a60bba15ae76b11a31a66c628a7ae1e24f7` for `liga-de-la-brisa-2025-09-20` v2. A same-version byte change cannot silently inherit ratings. Import is migration authority only; a missing or mismatched register disables interactions.

## Persistence slices

RV-032 first creates the immutable fixture register, rating state with nullable clear tombstone, structural comment state, reaction state, owner-scoped request keys/receipts, quota counters/events, and private exposure configuration. Reactions require an actual comment FK and readable-target check, even before RV-033 exposes comment creation. PostgreSQL functions, not direct app-table grants, validate the current owner, exact fixture hash, expected revision, and operation envelope. App reads use an owner share lock; mutations use an exclusive lock. Separate restricted logins prove grants and isolation. Synthetic test comments may exercise reactions without creating real public comments.

RV-033 adds comment creation/deletion, reports, moderator principal/events, and narrow moderator queue/transitions. A distinct admitted moderator login derives its actor from `session_user`; neither the app nor Academy reviewer can assume it. Removal clears text; owner privacy deletion removes linked events/receipts atomically. All Community comment deletions, self-deletion, and purge use the same migration-owned privacy-deletion serialization lock after the owner lock. Existing owner-deletion procedures must be extended deliberately; FK cascades alone do not prove cross-owner safety.

The ordinary application remains private. A separate reviewed test-only Next entry/build and restricted `_test` database can exercise two-owner shared acceptance. It does not change ordinary runtime validation or enable a local shared pilot. A real local pilot requires Nicolas's later explicit exposure decision on the reviewed UI and moderator operations; RV-035 gates external/public exposure.

## Verification order

1. Pure fixture compiler and exact-hash tests, followed by independent review.
2. PostgreSQL fixture import, restricted grants, rating revisions/retries/clear/quota/expiry/deletion tests.
3. Private rating UI and reaction foundation with browser and privacy checks.
4. Comment/report/moderator schema and restricted-login concurrency tests, including cross-owner deletion.
5. Isolated shared browser acceptance, both locales and mobile, then independent final authority/privacy review and exposure decision.

Read-only implementation design requested `gpt-6-astra`/high; runtime-confirmed identity/effort were unconfirmed. The user-requested upper-level app sequencing orchestration was separately requested `gpt-6-astra`/medium; runtime confirmation was unconfirmed.
