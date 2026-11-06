# Social Community journey

Task status is tracked only in `../../specs/tasks.md`.

## Objective

Let people start or join a match conversation by posting a selected play with their own opinion, an optional photo, file, or external link, then receive agreement/disagreement reactions, comments, and replies. Fans or referees who say they watched the match may also rate the referee's performance in that match. Match identity groups posts; an editorial match summary is not the main content. Existing repository-authored matches remain clearly labeled examples, not fabricated user activity.

Nicolas narrowed the current delivery slice to a visual demonstration of this social journey. It uses only clearly fictional examples. Accounts, user submissions, shared feeds, and persistence are deferred; the interface must not imply that a contribution can be posted now. The functional acceptance conditions below describe the later usable journey, not claims about this visual slice.

## Observable acceptance

- **SOC-REQ-001:** A chronological feed lists visible contributor posts with author attribution, match identity, publication time, post text, eligible attachment/link previews, and database-derived reaction/comment counts. It distinguishes repository-authored fictional examples from user submissions; a match page groups posts instead of leading with an editorial summary.
- **SOC-REQ-002:** A contributor can create and manage a match not already represented by the same competition, teams, and date, with optional score and context. A match has a stable owner-bound identity and a moderation state. Potential duplicates are handled explicitly rather than silently creating a second match.
- **SOC-REQ-003:** A contributor can post a selected, noteworthy play to a match with their own opinion, optional period/minute, and optional photo, file, or bounded external link. A complete event log of every play is not required. A post cannot be attached to another match by changing a client-provided identifier.
- **SOC-REQ-004:** A contributor who self-declares they watched the match can create or revise one 1–5 opinion of the referee's performance in that match, with a reason. Fan/referee perspective is self-declared unless separately verified. The rating is separate from RefView educational scoring and canonical football facts and does not become a global referee score.
- **SOC-REQ-005:** A contributor can comment on a post or referee rating and reply to a specific comment in that same discussion. The UI shows who is being replied to without unbounded visual nesting. Text and attachment references are safely rendered and owner-bound.
- **SOC-REQ-006:** Match, post, rating, comment, reaction, and media visibility is consistent after reporting, moderation, owner deletion, expiry, and direct URL access. A hidden parent cannot leak a child through a feed, route, action, count, or media response.
- **SOC-REQ-007:** Spanish and English interface flows work with two separate contributors, including publishing, reacting, replying, reporting, and managing one's own contributions. User text remains in the language written and is never presented as an automatic translation.
- **SOC-REQ-008:** A contributor can react once per account to a play post or comment with agreement or disagreement, change or remove that reaction, and write a reasoned play opinion. Reactions report people's views, not whether the football decision was objectively correct. Displayed counts reflect eligible stored records.
- **SOC-REQ-009:** An owned post or comment can reference a reviewed photo/file attachment or bounded HTTPS link. Allowed media types, byte limits, provenance, rights, metadata handling, moderation, deletion, and hidden-parent delivery are fixed before real uploads. The current generated illustrations are explicitly identified as examples, never attributed to a real contributor or match.

## Scope decisions

The referee score in SOC-REQ-004 evaluates that referee's performance in the particular match and comes from a person who self-reports watching it. A play post expresses its author's own opinion; replies and agreement/disagreement express other people's views. Neither a vote nor a fan/referee label establishes the football facts. The first visual slice illustrates these relationships with fictional examples only.

Nicolas selected selected-play posts with optional photos, files, or external video links. The current visual slice uses only labeled generated images and illustrative link/file treatments. Actual photo/file uploads require a separate storage, processing, ownership, delivery, moderation, deletion, metadata, and rights contract before implementation. Links are bounded HTTPS references displayed as outbound links, without automatic embedding or server-side fetching. Native video file upload remains outside the first functional version.

Nicolas selected durable accounts for eventual publishing but explicitly deferred account use for the current visual slice. The existing seven-day anonymous session remains available for unrelated private app features but does not own social posts. Account admission, cross-owner visibility, deletion, and moderation must be reviewed before a shared feed is enabled. The ordinary application remains private while those boundaries are unresolved. No deployment or public feed is authorized by this feature document.

## Existing foundation boundary

`../05-community/` and `../../contracts/community-interactions-v1.md` describe the reviewed fictional demonstration and its private PostgreSQL foundation. Its exact fixture ratings and flat comments do not implement this social journey. New schema and migration work must be additive; applied migrations and existing fixture identities are preserved.
