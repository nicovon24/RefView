# Profile and preferences

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

**Delegated SDD where identity/privacy changes.** Preferences and owned history begin anonymously; accounts are optional and require a separate reviewed design.

## Observable acceptance

- **PRO-REQ-001:** Locale and supported accessibility/input/camera/motion/quality preferences survive reload within their declared owner/device scope; invalid values safely fall back.
- **PRO-REQ-002:** History exposes only the current owner's attempts, exact content versions, and separate evaluation dimensions.
- **PRO-REQ-003:** Topic/edition progress uses documented derivations and never converts missing, unscored, or `notApplicable` results into success.
- **PRO-REQ-004:** Saving/unsaving available content is idempotent and owner-bound; retired/unavailable targets show explicit states.
- **PRO-REQ-005:** Optional anonymous-to-account attachment is explicit, atomic, idempotent, and cannot claim another owner's records.
- **PRO-REQ-006:** Retention and supported deletion are understandable; effects on public contributions/aggregates are explicit before public release.

## Limits

- Anonymous cookies are not cross-device identity and may be lost.
- Accounts, email providers, social login, and paid auth services are not implied.
- No invented overall referee grade.
