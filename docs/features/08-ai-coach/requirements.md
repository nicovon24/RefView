# Optional AI Coach

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

**Delegated SDD.** Context permissions, authority, privacy, provider behavior, limits, and fallback are reviewed before any hosted request.

## Objective

Provide useful grounded follow-ups through reviewed prepared responses first, then optionally through a replaceable hosted provider, without changing scenario facts or deterministic evaluation.

## Observable acceptance

- **COA-REQ-001:** Server-built context contains only evidence/content permitted for the current owner, surface, and state; active attempts never expose answers.
- **COA-REQ-002:** Prepared responses work without provider credentials or availability and are visibly labelled.
- **COA-REQ-003:** Explanations cite curated/versioned sources and distinguish established facts, interpretation, and missing evidence.
- **COA-REQ-004:** Coach code cannot modify facts, answer keys, decisions, evaluation, scoring, or publication.
- **COA-REQ-005:** Optional hosted generation uses a replaceable server adapter, bounded input/context, server-only secrets, timeouts, usage limits, validation, and prepared fallback.
- **COA-REQ-006:** External disclosure requires reviewed minimization, retention, provider/account-limit verification, and explicit enablement; untrusted text is never treated as instructions.

## Limits

- “Provider-free” means prepared responses, not a guaranteed network-offline web app.
- Grok, xAI, and Groq are distinct; actual API/product/account limits must be verified when selecting a provider.
- No paid provider or credential is enabled implicitly.
