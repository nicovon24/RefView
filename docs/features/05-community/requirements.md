# Community foundation

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

**Delegated SDD.** Identity, ownership, moderation, privacy, retention, and abuse limits are reviewed before shared user-generated content.

## Objective

Deliver an honest fictional-match community demonstration with revisable ratings, evidence-oriented comments, reactions, and a defined moderation path, while keeping opinion separate from reviewed education.

## Observable acceptance

- **COM-REQ-001:** Every demonstration match is fictional, clearly labelled, and uniquely identified by teams, date, competition, and stable match ID.
- **COM-REQ-002:** An owner can create or revise one rating per match; count and distribution remain correct after retries/concurrency.
- **COM-REQ-003:** Comments encourage evidence, render safely, and cannot change authoritative educational content or scoring.
- **COM-REQ-004:** Each owner has at most one like/dislike state per comment and can switch or clear it without inflating totals.
- **COM-REQ-005:** Reporting, moderator review, removal, and excluded-content behavior work before comments are shared across users.
- **COM-REQ-006:** Ownership, identity exposure, bounds, abuse controls, retention, and deletion receive security/privacy review before public use.

## Limits

- No fabricated claims about real referees.
- Fixture ratings/comments are visibly demonstration data.
- A real user's comment remains real UGC even when the match is fictional.
- No feed ranking, notifications, realtime sockets, or real-match ingestion in the foundation.
