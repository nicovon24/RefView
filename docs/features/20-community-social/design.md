# Social Community design direction

This direction supersedes the fictional-only Community product journey. The current slice is a visual demonstration with clearly fictional data and no accounts or social writes. The applied `20261105090000_community_foundation_v1` migration remains a private foundation for two repository-authored examples; its rating and flat-comment tables are not reinterpreted as social match reviews or replies. Later persistence must be additive.

## First complete journey

1. Browse a chronological, cursor-paginated feed of visible person-authored posts. Example posts carry an explicit `fictional example` label; future contributor posts carry a `user submission` label and do not claim RefView verification.
2. Create or select a match conversation with teams and optional competition/date, resolving likely duplicates. The match is a grouping context, not an editorial recap.
3. Publish a selected play post with an opinion, optional minute/period, and an optional photo, file, or bounded outbound HTTPS link. The author can manage the post. Show attachment provenance; no invented image is presented as footage of a real match.
4. People may agree or disagree with a play post or comment, then comment and reply within the post discussion. The reaction is a view about the post, not an official football verdict. Render replies with clear attribution and bounded indentation.
5. A fan or referee who self-declares viewing the match can separately publish or revise one reasoned 1–5 rating of that match referee's performance. The match author supplies the referee's display name if known; this is not a global referee identity, educational score, or authoritative ruling.
6. Report inappropriate material; a separate moderator can approve, hide, or remove it. Hide a parent from every projection before showing dependent content.

## Data and authority boundaries

The functional model centers a person-authored play post and its discussion. It distinguishes an opinion about a play from a rating of the referee's performance across one match. Agreement/disagreement is unique per post or comment and contributor; it is not a correctness vote. Match creation must detect a likely duplicate by competition, teams, and date, with a correction or merge path defined before publishing. These are later contracts, not behavior in the current visual demonstration.

Use distinct records for match, person-authored play post, referee assignment, match rating, comment, reply, reaction, report, moderation event, and media attachment/reference. Concrete foreign keys and constraints must enforce match ancestry and same-post replies. A contributor match rating is unique per referee assignment and owner; a contributor reaction is unique per target and owner. Counts derive from eligible PostgreSQL rows, not client increments. A post's author identity is server-derived; request bodies cannot choose an owner. No session ID or token enters public author data.

Nicolas selected durable accounts for later publishing but deferred account use while the social UI is visual only. The ordinary seven-day anonymous session remains for unrelated private app features; it cannot claim durable social posts. Later posting requires a reviewed account identity and account-level deletion/retention contract. Reading may remain available without an account. The exact account mechanism is a separate architecture decision before account implementation; the present design does not claim it exists. The ordinary app remains private until an isolated test-shared two-account/moderator flow passes and Nicolas makes an explicit exposure choice.

The first media path includes bounded HTTPS links and, if approved after a separate media contract, photo/file attachments. A visual example can show repository-owned generated illustrations with explicit provenance, but no real upload exists yet. Future uploads require file type/size checks, storage ownership, malware/metadata handling, moderation, rights, removal, and delivery rules before release. The server does not fetch user URLs or render automatic embeds. A link remains an external source, not hosted RefView footage. User-supplied text is escaped and never automatically translated. Native video objects and transcoding remain deferred.

Moderation applies to matches, posts, ratings, comments, photos, files, and links. Parent visibility gates all child feeds, routes, actions, counts, and media. Reports never directly change visibility. Ownership, revision, idempotency, quotas, publication state, explicit moderator identity, and privacy deletion require restricted PostgreSQL tests and independent review before cross-owner sharing. Existing Community controls are patterns to reassess, not automatic authority for new tables.

## Delivery order

Deliver the bilingual visual-only fictional feed and match detail first. Later, freeze and independently review the social contract; decide durable account semantics; add an additive schema; implement owner-private match publication and a private feed as the first functional slice; then plays, reviews, discussion/replies, reporting/moderation, and isolated two-owner browser acceptance. The existing fictional read pages can seed clearly labeled examples, but their current immutable fixture importer is not a user-post importer.

No simulator implementation, scenario publication, or cosmetic simulator refinement is part of this feature.
