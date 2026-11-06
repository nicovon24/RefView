# Community task contracts

## RV-030 - Freeze fictional-match, ownership, and moderation contracts

- Requirements: all COM requirements.
- Dependencies: reviewed RV-030A read boundary.
- Deliver: match identity, rating/reaction uniqueness, comment/report/moderation states, owner authority, visibility, retention, deletion, rate limits, and explicit owner-only-demo versus shared-pilot scope.
- Acceptance: independent security/privacy/contract review before shared mutations.

## RV-030A - Freeze read-only fictional fixture boundary

- Requirements: COM-REQ-001 and the read-only discussion-prompt portion of COM-REQ-003.
- Dependencies: RV-018 design direction.
- Deliver: stable match identity, bilingual fiction labels, unknown-ID handling, local read scope, and no-mutation limits in `../../contracts/fictional-community-read-v1.md`.
- Acceptance: independent read-only contract review before RV-031 implementation.

## RV-031 - Author fictional fixtures and read views

- Requirements: COM-REQ-001 and the read-only discussion-prompt portion of COM-REQ-003.
- Dependencies: reviewed RV-030A.
- Deliver: at least two distinct fictional matches with local list/detail routes and visible fiction labels. Omit ratings, comments, counts, and reactions.
- Acceptance: routes cannot collapse different meetings; unknown IDs return not-found; no real-world performance claims or unlicensed incident media. Browser checks cover both locales and mobile layout.

## RV-032 - Implement ratings and reactions

- Requirements: COM-REQ-002, COM-REQ-004, COM-REQ-006.
- Dependencies: RV-030, RV-031.
- Red/green evidence: one rating per owner/match, revision, concurrent retry, correct distribution, reaction switch/clear, removed target, and wrong-owner rejection against PostgreSQL.

## RV-033 - Implement comments, reports, and moderation

- Requirements: COM-REQ-003, COM-REQ-005, COM-REQ-006.
- Dependencies: RV-030, RV-031.
- Deliver: bounded safe comment format, owner mutation, report, moderator-only transitions, and hiding/removal effects.
- Acceptance: authorization, script payload, duplicate report, removed comment/reaction, and selected abuse-limit tests plus full browser flow.

## RV-034 - Fictional Community acceptance

- Requirements: all COM requirements.
- Dependencies: RV-032, RV-033.
- Acceptance: Playwright CLI covers distinct matches, revise rating, comment, react, report, and moderation; independent authorization/privacy review passes; exposure scope is recorded.

## RV-035 - Production-publication readiness decision

- Dependencies: RV-034 and RV-053 only if accounts are required by the selected scope.
- Deliver: reviewed decision on identity, moderation operations, abuse response, privacy/retention, real-match data rights, and public exposure.
- Limit: this ticket does not authorize deployment, real-match ingestion, or external communications.
