<a id="05-community"></a>

<a id="05-community--community-foundation"></a>
## Community foundation

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

**Delegated SDD.** Identity, ownership, moderation, privacy, retention, and abuse limits are reviewed before shared user-generated content.

<a id="05-community--objective"></a>
## Objective

Deliver an honest fictional-match community demonstration with revisable ratings, evidence-oriented comments, reactions, and a defined moderation path, while keeping opinion separate from reviewed education.

<a id="05-community--observable-acceptance"></a>
## Observable acceptance

- **COM-REQ-001:** Every demonstration match is fictional, clearly labelled, and uniquely identified by teams, date, competition, and stable match ID.
- **COM-REQ-002:** An owner can create or revise one rating per match; count and distribution remain correct after retries/concurrency.
- **COM-REQ-003:** Comments encourage evidence, render safely, and cannot change authoritative educational content or scoring.
- **COM-REQ-004:** Each owner has at most one like/dislike state per comment and can switch or clear it without inflating totals.
- **COM-REQ-005:** Reporting, moderator review, removal, and excluded-content behavior work before comments are shared across users.
- **COM-REQ-006:** Ownership, identity exposure, bounds, abuse controls, retention, and deletion receive security/privacy review before public use.

<a id="05-community--limits"></a>
## Limits

- No fabricated claims about real referees.
- Fixture ratings/comments are visibly demonstration data.
- A real user's comment remains real UGC even when the match is fictional.
- No feed ranking, notifications, realtime sockets, or real-match ingestion in the foundation.

---

<a id="20-community-social"></a>

<a id="20-community-social--social-community-journey"></a>
## Social Community journey

Task status is tracked only in `../../specs/tasks.md`.

<a id="20-community-social--objective"></a>
## Objective

Let people start or join a match conversation by posting a selected play with their own opinion, an optional photo, file, or external link, then receive agreement/disagreement reactions, comments, and replies. Fans or referees who say they watched the match may also rate the referee's performance in that match. Match identity groups posts; an editorial match summary is not the main content. Repository-authored fixtures are never fabricated user activity.

Nicolas first narrowed delivery to a fictional visual demonstration. On 2026-11-06 he changed the next scope: account holders should create real Community posts and agree or disagree, and those posts and reactions should be visible to everyone who opens the app. He subsequently asked to remove the fictional play cards; the public feed now presents only real account-owned posts. Local implementation does not authorize deployment.

<a id="20-community-social--observable-acceptance"></a>
## Observable acceptance

- **SOC-REQ-001:** A chronological feed lists visible contributor posts with author attribution, match identity, publication time, post text, eligible attachment/link previews, and database-derived reaction/comment counts. Repository-authored fictional fixtures are excluded from the public contributor feed; a future match page groups posts instead of leading with an editorial summary.
- **SOC-REQ-002:** A contributor can create and manage a match not already represented by the same competition, teams, and date, with optional score and context. A match has a stable owner-bound identity and a moderation state. Potential duplicates are handled explicitly rather than silently creating a second match.
- **SOC-REQ-003:** A contributor can post a selected, noteworthy play to a match with their own opinion, optional period/minute, and optional photo, file, or bounded external link. A complete event log of every play is not required. A post cannot be attached to another match by changing a client-provided identifier.
- **SOC-REQ-004:** A contributor who self-declares they watched the match can create or revise one 1–5 opinion of the referee's performance in that match, with a reason. Fan/referee perspective is self-declared unless separately verified. The rating is separate from RefView educational scoring and canonical football facts and does not become a global referee score.
- **SOC-REQ-005:** A contributor can comment on a post or referee rating and reply to a specific comment in that same discussion. The UI shows who is being replied to without unbounded visual nesting. Text and attachment references are safely rendered and owner-bound.
- **SOC-REQ-006:** Match, post, rating, comment, reaction, and media visibility is consistent after reporting, moderation, owner deletion, expiry, and direct URL access. A hidden parent cannot leak a child through a feed, route, action, count, or media response.
- **SOC-REQ-007:** Spanish and English interface flows work with two separate contributors, including publishing, reacting, replying, reporting, and managing one's own contributions. User text remains in the language written and is never presented as an automatic translation.
- **SOC-REQ-008:** A contributor can react once per account to a play post or comment with agreement or disagreement, change or remove that reaction, and write a reasoned play opinion. Reactions report people's views, not whether the football decision was objectively correct. Displayed counts reflect eligible stored records.
- **SOC-REQ-009:** An owned post or comment can reference a reviewed photo/file attachment or bounded HTTPS link. Allowed media types, byte limits, provenance, rights, metadata handling, moderation, deletion, and hidden-parent delivery are fixed before real uploads. Earlier generated demonstration illustrations were removed and must never be attributed to a real contributor or match.

<a id="20-community-social--scope-decisions"></a>
## Scope decisions

The referee score in SOC-REQ-004 evaluates that referee's performance in the particular match and comes from a person who self-reports watching it. A play post expresses its author's own opinion; replies and agreement/disagreement express other people's views. Neither a vote nor a fan/referee label establishes the football facts. The first visual slice illustrates these relationships with fictional examples only.

Nicolas selected selected-play posts with optional photos, files, or external video links. The current visual slice uses only labeled generated images and illustrative link/file treatments. Actual photo/file uploads require a separate storage, processing, ownership, delivery, moderation, deletion, metadata, and rights contract before implementation. Links are bounded HTTPS references displayed as outbound links, without automatic embedding or server-side fetching. Native video file upload remains outside the first functional version.

Nicolas selected durable accounts for publishing and has now requested a shared feed. The existing seven-day anonymous session remains available for unrelated private app features but does not own social posts. Account admission, cross-owner visibility, deletion, and moderation need their own verification before shared exposure. No deployment is authorized by this feature document.

<a id="20-community-social--existing-foundation-boundary"></a>
## Existing foundation boundary

`../05-community/` and `../../contracts/community.md#community-interactions-v1` describe the reviewed fictional demonstration and its private PostgreSQL foundation. Its exact fixture ratings and flat comments do not implement this social journey. New schema and migration work must be additive; applied migrations and existing fixture identities are preserved.
