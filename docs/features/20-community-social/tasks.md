# Social Community task contracts

Status is tracked only in `../../specs/tasks.md`.

## SOC-00: Visual-only fictional social journey

- Dependencies: existing fictional match read pages.
- Deliver: a bilingual post-first feed and match conversation view. Each example post centers a person's opinion about a selected play with a clearly generated illustrative photo or example link/file, agreement/disagreement, comments, and replies. Liverpool–Manchester City and Liverpool–Arsenal are example grouping contexts only; no actual fixture, event, or supplied footage is claimed. A self-declared viewer's match referee rating may appear secondarily. Every invented entry must be visibly labeled fictional. No account, submission, mutation, count of real users, or persistence claim is part of this slice.
- Acceptance: focused desktop/mobile visual inspection, ES/EN copy review, and independent read-only implementation review. This is a design demonstration, not SOC-REQ-001..009 functional acceptance.

## SOC-01: Freeze the social journey and authority contract

- Requirements: SOC-REQ-001..009.
- Deliver: exact match/post/referee-assignment/rating/comment/reaction/attachment relationships, author identity, source classification, visibility, deletion, moderation, abuse limits, duplicate match handling, and photo/file/link media contracts. The match author may name one principal referee when known; a rating remains tied to that match and never becomes a global reputation score.
- Acceptance: independent product, privacy, and authority review before shared contributor mutations.

## SOC-02: Implement match and play publication

- Dependencies: SOC-01, durable contributor or explicitly scoped local proof decision.
- Deliver: owner-bound PostgreSQL models, narrow mutation procedures, feed and match/play pages, and bilingual forms.
- Acceptance: owner-private publication and read flow. Shared two-contributor browser acceptance follows moderation and isolated test-runtime work in SOC-04.

## SOC-03: Implement referee reviews and discussions

- Dependencies: SOC-02.
- Deliver: one revisable match referee rating per eligible contributor, post/comment agreement and disagreement, person-authored play opinions, direct replies, and safe counts.
- Acceptance: PostgreSQL uniqueness, same-discussion reply, ownership, moderation and hidden-parent tests; browser flows in both locales.

## SOC-04: Complete moderation, identity, media, and exposure review

- Dependencies: SOC-01..03 and selected media path.
- Deliver: report and moderator journey, contributor management, retention/deletion behavior, and explicit visibility scope.
- Acceptance: isolated test-shared two-contributor and moderator flow, independent final authority/privacy review, and user acceptance of the concrete local flow before any shared pilot.
