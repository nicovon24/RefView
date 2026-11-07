<a id="08-ai-coach"></a>

<a id="08-ai-coach--ai-coach-task-contracts"></a>
## AI Coach task contracts

<a id="08-ai-coach--rv-060-freeze-coach-permissions-and-context-contract"></a>
## RV-060 - Freeze Coach permissions and context contract

- Requirements: all COA requirements.
- Dependencies: RV-011 and RV-021 for the first lesson context.
- Deliver: allowed surfaces/states, context projection, ownership, version refs, question types, unsupported/refusal behavior, and no-authority interface.
- Acceptance: independent authority/privacy review and negative tests for active-attempt answers, wrong owner, private keys, and mutation capability.

<a id="08-ai-coach--rv-061-implement-prepared-response-mode"></a>
## RV-061 - Implement prepared-response mode

- Requirements: COA-REQ-001 through COA-REQ-004.
- Dependencies: RV-060.
- Deliver: reviewed debrief/lesson follow-ups for the accepted contexts, labelled prepared mode, and no provider dependency.
- Acceptance: permitted question, wrong owner, active attempt, missing context, version/reference, and deterministic-result-unchanged tests plus browser flow.

<a id="08-ai-coach--rv-062-provider-adapter-and-fake-provider-verification"></a>
## RV-062 - Provider adapter and fake-provider verification

- Requirements: COA-REQ-004 through COA-REQ-006.
- Dependencies: RV-061 and explicit selection to explore hosted mode.
- Deliver: small replaceable server adapter tested only with a fake provider.
- Acceptance: timeout, cancellation, malformed/unsafe output, prompt-injection-bearing content, context limit, usage bound, missing credential, and prepared fallback tests.

<a id="08-ai-coach--rv-063-hosted-provider-readiness-and-integration"></a>
## RV-063 - Hosted-provider readiness and integration

- Requirements: COA-REQ-005, COA-REQ-006.
- Dependencies: RV-062, verified provider/API/account limits, reviewed privacy choice, and explicit authorization to enable external requests.
- Deliver: one configured provider with server secrets, minimization, limits, validated structured output, disclosure, and fallback.
- Acceptance: provider-specific integration/evaluation evidence and independent security/privacy review. This ticket may remain deferred.

<a id="08-ai-coach--rv-064-coach-acceptance"></a>
## RV-064 - Coach acceptance

- Requirements: all delivered COA requirements.
- Dependencies: RV-061 for prepared claims; RV-063 only for hosted claims.
- Acceptance: grounded explanations, references, ownership, no-answer leakage, unchanged deterministic results, absent credentials, provider failure, unsupported questions, and independent review.
