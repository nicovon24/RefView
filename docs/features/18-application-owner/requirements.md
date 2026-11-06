# Application anonymous owner

Status is tracked only in [`../../specs/tasks.md`](../../specs/tasks.md).

## Objective

Admit a private anonymous owner in the application PostgreSQL database so future Academy saves, assessment attempts, Community interactions, and simulator attempts can be authorized consistently. This feature alone creates no public content or completed attempt.

## Observable acceptance

- **OWN-REQ-001:** Application configuration rejects test databases, isolated test mode, invalid origins, and missing configuration without fallback.
- **OWN-REQ-002:** Explicit same-origin bootstrap creates an empty seven-day owner, reuses a valid owner without renewal, and reveals no token or internal ID.
- **OWN-REQ-003:** Private owner reads and feature mutation guards use PostgreSQL wall time and owner-row locking; missing, invalid, expired, or other owners cannot access records.
- **OWN-REQ-004:** Same-origin self-delete removes all current owner data transactionally. Bounded server-only purge removes expired owners without touching live owners or canonical content.
- **OWN-REQ-005:** Browser checks prove cookie transport, reload, isolation across profiles, deletion, and bilingual empty/error states. PostgreSQL tests prove rollback, lock and expiry, and deletion order.

## Boundaries

- Follow [`../../contracts/application-anonymous-owner-v1.md`](../../contracts/application-anonymous-owner-v1.md). No accounts, public Community posts, published content, deployment, or operational retention claim is part of this foundation.
- Existing isolated session transport remains test-only. Application mutations cannot use its connector.
- No owner token, digest, or internal ID reaches a client projection or log.

## Route choice

Delegated SDD: runtime validation and private owner persistence can be independently implemented after the reviewed contract. The coordinator owns shared configuration, migration validation, routes, integration, and tracker; independent review covers authority, privacy, persistence, and final acceptance.
