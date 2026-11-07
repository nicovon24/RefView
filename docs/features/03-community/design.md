<a id="05-community"></a>

<a id="05-community--fictional-community-interaction-design"></a>
## Fictional Community interaction design

The normative authority and privacy rules are in [`../../contracts/community.md#community-interactions-v1`](../../contracts/community.md#community-interactions-v1). The read-only fixtures remain repository-authored and are not educational answer keys.

<a id="05-community--source-identity"></a>
## Source identity

Each complete version 2 fixture, including both locales, context, invented decision, identity, author, and provenance, is compiled by `fixture-source-v1.ts`. The canonical envelope is `canonicalJsonV2(["refview-fictional-community-fixture-v1", fixture])`; SHA-256 over its UTF-8 bytes binds the immutable PostgreSQL register to the text displayed by the read view. The current candidate hashes are `sha256:8cc07f853210fb05656fc03c2307e93af6433b5646cc6c035dfccee43cc87a38` for `copa-del-faro-2025-04-12` v2 and `sha256:553913d6997c756c3f7491dd9d535a60bba15ae76b11a31a66c628a7ae1e24f7` for `liga-de-la-brisa-2025-09-20` v2. A same-version byte change cannot silently inherit ratings. Import is migration authority only; a missing or mismatched register disables interactions.

<a id="05-community--persistence-slices"></a>
## Persistence slices

RV-032 first creates the immutable fixture register, rating state with nullable clear tombstone, structural comment state, reaction state, owner-scoped request keys/receipts, quota counters/events, and private exposure configuration. Reactions require an actual comment FK and readable-target check, even before RV-033 exposes comment creation. PostgreSQL functions, not direct app-table grants, validate the current owner, exact fixture hash, expected revision, and operation envelope. App reads use an owner share lock; mutations use an exclusive lock. Separate restricted logins prove grants and isolation. Synthetic test comments may exercise reactions without creating real public comments.

RV-033 adds comment creation/deletion, reports, moderator principal/events, and narrow moderator queue/transitions. A distinct admitted moderator login derives its actor from `session_user`; neither the app nor Academy reviewer can assume it. Removal clears text; owner privacy deletion removes linked events/receipts atomically. All Community comment deletions, self-deletion, and purge use the same migration-owned privacy-deletion serialization lock after the owner lock. Existing owner-deletion procedures must be extended deliberately; FK cascades alone do not prove cross-owner safety.

The ordinary application remains private. A separate reviewed test-only Next entry/build and restricted `_test` database can exercise two-owner shared acceptance. It does not change ordinary runtime validation or enable a local shared pilot. A real local pilot requires Nicolas's later explicit exposure decision on the reviewed UI and moderator operations; RV-035 gates external/public exposure.

<a id="05-community--verification-order"></a>
## Verification order

1. Pure fixture compiler and exact-hash tests, followed by independent review.
2. PostgreSQL fixture import, restricted grants, rating revisions/retries/clear/quota/expiry/deletion tests.
3. Private rating UI and reaction foundation with browser and privacy checks.
4. Comment/report/moderator schema and restricted-login concurrency tests, including cross-owner deletion.
5. Isolated shared browser acceptance, both locales and mobile, then independent final authority/privacy review and exposure decision.

Read-only implementation design requested `gpt-6-astra`/high; runtime-confirmed identity/effort were unconfirmed. The user-requested upper-level app sequencing orchestration was separately requested `gpt-6-astra`/medium; runtime confirmation was unconfirmed.

---

<a id="20-community-social"></a>

<a id="20-community-social--social-community-design-direction"></a>
## Social Community design direction

<a id="20-community-social--current-local-functional-slice"></a>
## Current local functional slice

Nicolas changed the next Community step on 2026-11-06: real account holders should publish selected-play opinions immediately, and all visitors of the local app should see them and their real agreement/disagreement counts. Creation and reactions remain account-bound; reading is available to signed-out visitors. Match and post eligibility, owner removal, reports, moderator hiding, quotas, and account deletion must use one database-controlled visibility boundary. A private pending row created before this change does not become public automatically. The fictional play cards and detail routes were subsequently removed from the public app at Nicolas's request. No files, comments, referee ratings, network exposure, or deployment are part of this slice. The exact authority override is recorded in [`../../contracts/community.md#community-social-v1`](../../contracts/community.md#community-social-v1).

The earlier visual slice demonstrated the journey with clearly fictional data and no accounts or social writes. The applied `20261105090000_community_foundation_v1` migration remains a private foundation for two repository-authored examples; its rating and flat-comment tables are not reinterpreted as social match reviews or replies. Functional persistence is additive. The authority contract is [`../../contracts/community.md#community-social-v1`](../../contracts/community.md#community-social-v1).

<a id="20-community-social--first-complete-journey"></a>
## First complete journey

1. Browse a chronological, cursor-paginated feed of visible person-authored posts. Repository-authored examples stay outside the public feed; contributor posts do not claim RefView verification.
2. Create or select a match conversation with teams and optional competition/date, resolving likely duplicates. The match is a grouping context, not an editorial recap.
3. Publish a selected play post with an opinion, optional minute/period, and an optional photo, file, or bounded outbound HTTPS link. The author can manage the post. Show attachment provenance; no invented image is presented as footage of a real match.
4. People may agree or disagree with a play post or comment, then comment and reply within the post discussion. The reaction is a view about the post, not an official football verdict. Render replies with clear attribution and bounded indentation.
5. A fan or referee who self-declares viewing the match can separately publish or revise one reasoned 1–5 rating of that match referee's performance. The match author supplies the referee's display name if known; this is not a global referee identity, educational score, or authoritative ruling.
6. Report inappropriate material; a separate moderator can approve, hide, or remove it. Hide a parent from every projection before showing dependent content.

<a id="20-community-social--data-and-authority-boundaries"></a>
## Data and authority boundaries

The functional model centers a person-authored play post. The active local slice supports match grouping, posts, one current agreement/disagreement reaction per account and post, reports, and moderator hiding/removal. The opinion is not a correctness vote. Complete exact or reversed-team match identity resolves to one visible conversation; inaccessible matches receive a generic unavailable result. Discussion, referee ratings, and media remain later contracts.

Use distinct records for match, person-authored play post, referee assignment, match rating, comment, reply, reaction, report, moderation event, and media attachment/reference. Concrete foreign keys and constraints must enforce match ancestry and same-post replies. A contributor match rating is unique per referee assignment and owner; a contributor reaction is unique per target and owner. Counts derive from eligible PostgreSQL rows, not client increments. A post's author identity is server-derived; request bodies cannot choose an owner. No session ID or token enters public author data.

Nicolas selected durable Google accounts for social contribution. The ordinary seven-day anonymous session remains for unrelated private app features; it cannot claim social posts. The account-derived private foundation, local shared migration, reviewer-only moderation role, and corrective migrations are applied. After restricted PostgreSQL and bilingual two-account browser acceptance, Nicolas authorized `local_shared` exposure in the local `refview` database. Signed-out visitors can read the real feed; account sessions create, react, report, and remove their own records. The fictional demonstration was removed from public routes after this acceptance. Real Google OAuth was not repeated in the isolated synthetic-account acceptance; deployment remains closed.

The first media path includes bounded HTTPS links and, if approved after a separate media contract, photo/file attachments. A visual example can show repository-owned generated illustrations with explicit provenance, but no real upload exists yet. Future uploads require file type/size checks, storage ownership, malware/metadata handling, moderation, rights, removal, and delivery rules before release. The server does not fetch user URLs or render automatic embeds. A link remains an external source, not hosted RefView footage. User-supplied text is escaped and never automatically translated. Native video objects and transcoding remain deferred.

Moderation applies to matches, posts, ratings, comments, photos, files, and links. Parent visibility gates all child feeds, routes, actions, counts, and media. Reports never directly change visibility. Ownership, revision, idempotency, quotas, publication state, explicit moderator identity, and privacy deletion require restricted PostgreSQL tests and independent review before cross-owner sharing. Existing Community controls are patterns to reassess, not automatic authority for new tables.

<a id="20-community-social--delivery-order"></a>
## Delivery order

The fictional bilingual feed and match detail preceded the account-owned private foundation. The current local slice adds immediate match/post publication, reactions, reporting, owner removal, restricted moderation, and isolated two-account acceptance. Remaining stages include discussion/replies, referee reviews, reviewed media/link delivery, cursor pagination, and full milestone acceptance. The immutable fictional fixture importer is not a user-post importer.

No simulator implementation, scenario publication, or cosmetic simulator refinement is part of this feature.
