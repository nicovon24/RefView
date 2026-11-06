# Fictional Community read contract v1

## Scope

This contract permits read-only local demonstration content before owner identity, rating, comment, report, and moderation contracts are complete. It does not authorize user-generated content or public release.

## Fixture identity

- Each match has an immutable stable `matchId`, authored competition name, date, two distinct fictional team names, and bilingual description.
- At least two matches have different identities and distinct detail paths. A detail path is resolved by `matchId`; an unknown ID returns a not-found state.
- Every list card and detail page explicitly says the match and any displayed observations are fictional demonstration content. No real club, referee, player, competition, or footage is implied.
- The fixture register records author, version, and provenance of any external assets. The first read slice uses text and repository-authored styling only, so it requires no external visual asset.

## Read boundary

- A fixture may describe a fictional match incident as a discussion prompt, but must not present a reviewed training ruling or fabricated community ratings/comments as live activity.
- Rating distributions, comment counts, and reactions are omitted until real owner-bound persistence exists. A future demo fixture distribution may appear only with an explicit fixture label.
- Read routes do not accept mutations, collect identity, or reveal an anonymous-session token.
- Localized URLs preserve the selected language for list and detail navigation.

## Review gate

Before owner-bound interaction, freeze `RV-030` covering anonymous ownership, uniqueness, moderation/reporting, rate limits, visibility, retention, and deletion. Its persistence implementation must be verified against PostgreSQL and reviewed for privacy and authorization. Read-only fixture acceptance does not imply that gate has passed.
