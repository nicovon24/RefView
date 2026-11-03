# Assessments task contracts

## RV-040 - Freeze assessment, scoring, and secrecy contracts

- Requirements: all ASM requirements.
- Dependencies: RV-034 and RV-020.
- Deliver: item types, immutable submissions, applicability, reveal timing, ownership/retry, reasoning treatment, correction/recommendation refs, and public/private projections.
- Acceptance: independent scoring/persistence review and valid/invalid examples.

## RV-041 - Author reviewed starter exercise set

- Requirements: ASM-REQ-002, ASM-REQ-004, ASM-REQ-005.
- Dependencies: RV-040.
- Deliver: one bilingual item of each accepted type with rationale, source, allowed alternatives, and review record.
- Acceptance: Nicolas approves football interpretation; catalog size remains explicit.

## RV-042 - Implement assessment attempt and evaluation core

- Requirements: ASM-REQ-003, ASM-REQ-004, ASM-REQ-006.
- Dependencies: RV-040, RV-041.
- Red/green evidence: correct/incorrect/interpretative answers, malformed input, answer-key exclusion, reveal guard, retry conflict, immutable initial answer, wrong owner, and transaction rollback against PostgreSQL.

## RV-043 - Implement practice and correction journey

- Requirements: ASM-REQ-001, ASM-REQ-005.
- Dependencies: RV-042, RV-024, RV-051.
- Deliver: topic selection -> answer/reasoning -> confirm -> correction -> actual next practice.
- Acceptance: Playwright CLI verifies Spanish/English, refresh/retry, keyboard use, secrecy, and scored/unscored/not-applicable dimensions.

## RV-044 - Assessments acceptance

- Requirements: all ASM requirements.
- Dependencies: RV-043.
- Acceptance: complete provider-free journey plus independent review of scoring authority, reviewed content, ownership, secrecy, and persistence.
