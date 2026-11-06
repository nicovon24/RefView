# Application owner design

The reviewed v1 boundary is [`../../contracts/application-anonymous-owner-v1.md`](../../contracts/application-anonymous-owner-v1.md). The independent contract review returned PASS after the DB-clock expiry and normalized DB-target corrections; requested `gpt-6-sol`/high, runtime-confirmed identity unconfirmed.

Runtime config uses `DATABASE_URL` and one exact `REFVIEW_APP_ORIGIN`; the isolated test connector remains separate. The server creates and resolves opaque cookie owners. PostgreSQL supplies creation/expiry and checks expiry after an owner-row lock. Each feature mutation uses the same guard within its own transaction. Self-delete and purge lock owners exclusively before deleting descendants in verified order.

The application may be locally verified before any public feature uses the owner. A future deployment still needs a scheduled purge, monitoring, and a retention policy. Browser behavior for Secure cookies on loopback HTTP is an explicit acceptance check; local HTTPS is used if the target browser cannot transmit them.

No schema change is required for the current `AnonymousSession` model. New feature tables must extend deletion and purge coverage before writing owner data.

# Restricted owner lifecycle bridge

The local application runtime will use `refview_app`, without direct `AnonymousSession` or simulator-table mutation grants. A migration-owned, `pg_catalog`-search-path function creates an owner from a validated token hash and database UTC time; existing `application_lock_owner` reads or locks an active owner and checks expiry after lock acquisition. A second function locks by token hash and self-deletes; a bounded third function selects only database-expired owners with `FOR UPDATE SKIP LOCKED`. All return allowlisted status/count data, never owner IDs to a caller. The private delete-by-ID helper is executable only by the definer functions.

Delete simulator descendants in existing dependency order, then delete the root `AnonymousSession`. Assessment descendants must cascade from root deletion: their guards reject a direct child deletion while its owner still exists. Keep publication/source records untouched. Pin database function timezone to UTC because existing expiry columns are `timestamp(3)` without a time zone. Create/revoke/grant atomically, grant only app role EXECUTE on the three public entry points, and deny reviewer/PUBLIC and all direct owner-table mutation.

Before switching the runtime credential, prove create/read/self-delete/purge and denial with actual restricted test logins; cover non-UTC sessions, lock races, finalized Assessment and simulator descendant graphs, repeated calls, rollback, and cookie clearing only after commit. After a reviewed app-database migration, reconnect the app under `refview_app` and repeat Profile browser acceptance. Architecture advice requested Astra/high; runtime-confirmed identity unconfirmed.
