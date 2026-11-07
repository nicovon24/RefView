<a id="05-community"></a>

<a id="05-community--community-task-contracts"></a>
## Community task contracts

<a id="05-community--rv-030-freeze-fictional-match-ownership-and-moderation-contracts"></a>
## RV-030 - Freeze fictional-match, ownership, and moderation contracts

- Requirements: all COM requirements.
- Dependencies: reviewed RV-030A read boundary.
- Deliver: match identity, rating/reaction uniqueness, comment/report/moderation states, owner authority, visibility, retention, deletion, rate limits, and explicit owner-only-demo versus shared-pilot scope.
- Acceptance: independent security/privacy/contract review before shared mutations.

<a id="05-community--rv-030a-freeze-read-only-fictional-fixture-boundary"></a>
## RV-030A - Freeze read-only fictional fixture boundary

- Requirements: COM-REQ-001 and the read-only discussion-prompt portion of COM-REQ-003.
- Dependencies: RV-018 design direction.
- Deliver: stable match identity, bilingual fiction labels, unknown-ID handling, local read scope, and no-mutation limits in `../../contracts/community.md#fictional-community-read-v1`.
- Acceptance: independent read-only contract review before RV-031 implementation.

<a id="05-community--rv-031-author-fictional-fixtures-and-read-views"></a>
## RV-031 - Author fictional fixtures and read views

- Requirements: COM-REQ-001 and the read-only discussion-prompt portion of COM-REQ-003.
- Dependencies: reviewed RV-030A.
- Deliver: at least two distinct fictional matches with local list/detail routes and visible fiction labels. Omit ratings, comments, counts, and reactions.
- Acceptance: routes cannot collapse different meetings; unknown IDs return not-found; no real-world performance claims or unlicensed incident media. Browser checks cover both locales and mobile layout.

<a id="05-community--rv-032-implement-ratings-and-reactions"></a>
## RV-032 - Implement ratings and reactions

- Requirements: COM-REQ-002, COM-REQ-004, COM-REQ-006.
- Dependencies: RV-030, RV-031.
- Red/green evidence: one rating per owner/match, revision, concurrent retry, correct distribution, reaction switch/clear, removed target, and wrong-owner rejection against PostgreSQL.

<a id="05-community--rv-033-implement-comments-reports-and-moderation"></a>
## RV-033 - Implement comments, reports, and moderation

- Requirements: COM-REQ-003, COM-REQ-005, COM-REQ-006.
- Dependencies: RV-030, RV-031.
- Deliver: bounded safe comment format, owner mutation, report, moderator-only transitions, and hiding/removal effects.
- Acceptance: authorization, script payload, duplicate report, removed comment/reaction, and selected abuse-limit tests plus full browser flow.

<a id="05-community--rv-034-fictional-community-acceptance"></a>
## RV-034 - Fictional Community acceptance

- Requirements: all COM requirements.
- Dependencies: RV-032, RV-033.
- Acceptance: Playwright CLI covers distinct matches, revise rating, comment, react, report, and moderation; independent authorization/privacy review passes; exposure scope is recorded.

<a id="05-community--rv-035-production-publication-readiness-decision"></a>
## RV-035 - Production-publication readiness decision

- Dependencies: RV-034 and RV-053 only if accounts are required by the selected scope.
- Deliver: reviewed decision on identity, moderation operations, abuse response, privacy/retention, real-match data rights, and public exposure.
- Limit: this ticket does not authorize deployment, real-match ingestion, or external communications.

---

<a id="20-community-social"></a>

<a id="20-community-social--social-community-task-contracts"></a>
## Social Community task contracts

Status is tracked only in `../../specs/tasks.md`.

<a id="20-community-social--soc-00-visual-only-fictional-social-journey"></a>
## SOC-00: Visual-only fictional social journey

- Dependencies: existing fictional match read pages.
- Deliver: a bilingual post-first feed and match conversation view. Each example post centers a person's opinion about a selected play with a clearly generated illustrative photo or example link/file, agreement/disagreement, comments, and replies. Liverpool–Manchester City and Liverpool–Arsenal are example grouping contexts only; no actual fixture, event, or supplied footage is claimed. A self-declared viewer's match referee rating may appear secondarily. Every invented entry must be visibly labeled fictional. No account, submission, mutation, count of real users, or persistence claim is part of this slice.
- Acceptance: focused desktop/mobile visual inspection, ES/EN copy review, and independent read-only implementation review. This is a design demonstration, not SOC-REQ-001..009 functional acceptance.

<a id="20-community-social--soc-01-freeze-the-social-journey-and-authority-contract"></a>
## SOC-01: Freeze the social journey and authority contract

- Requirements: SOC-REQ-001..009.
- Deliver: exact match/post/referee-assignment/rating/comment/reaction relationships, author identity, source classification, visibility, deletion, moderation, abuse limits, duplicate match handling, and the first bounded HTTPS-link media contract. Define the closed photo/file boundary and its proposed constraints; a separate reviewed storage/processing/deletion contract gates any real upload implementation. The match author may name one principal referee when known; a rating requires that named match referee and never becomes a global reputation score.
- Acceptance: independent product, privacy, and authority review before shared contributor mutations.

<a id="20-community-social--soc-02-implement-match-and-play-publication"></a>
## SOC-02: Implement match and play publication

- Dependencies: SOC-01, durable contributor or explicitly scoped local proof decision. Nicolas requested that real account-owned posts become visible to all app visitors on 2026-11-06; the existing owner-private create/read foundation is only the first part.
- Deliver: owner-bound PostgreSQL models, narrow mutation procedures, feed and match/play pages, and bilingual forms.
- Acceptance: owner-private publication and read flow. Shared two-contributor browser acceptance follows moderation and isolated test-runtime work in SOC-04.

<a id="20-community-social--soc-03-implement-referee-reviews-and-discussions"></a>
## SOC-03: Implement referee reviews and discussions

- Dependencies: SOC-02.
- Deliver: first, account-owned post agreement/disagreement with safe counts and a real shared-post flow. Then one revisable match referee rating per eligible contributor, comment agreement/disagreement, direct replies, and the remaining discussion flow.
- Acceptance: PostgreSQL uniqueness, same-discussion reply, ownership, moderation and hidden-parent tests; browser flows in both locales.

<a id="20-community-social--soc-04-complete-moderation-identity-media-and-exposure-review"></a>
## SOC-04: Complete moderation, identity, media, and exposure review

- Dependencies: SOC-01..03 and selected media path.
- Deliver: report and moderator journey, contributor management, retention/deletion behavior, and explicit visibility scope.
- Acceptance: isolated test-shared two-contributor and moderator flow, independent final authority/privacy review, and user acceptance of the concrete local flow before any shared pilot.
