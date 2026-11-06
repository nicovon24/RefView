# Assessment owner journey v1

The application exposes only reviewed Assessment items whose immutable source, rubric, reviewer evidence, and publication binding recompile and verify on the server. The active attempt receives an allowlisted prompt and input specification; the private rubric and correction remain server-only until finalization. An unpublished or retired item cannot start a new attempt. A previously started attempt remains pinned and may be finalized or restored after retirement.

## Owner and transaction contract

The anonymous session cookie identifies an owner through a database lock function. The function locks the matching session, checks expiry against database time after lock acquisition, and returns only its internal ID and expiry. All Assessment writes and reads scope by that owner ID. A missing or expired owner has no accessible attempt. The shared owner resolver uses this function after the restricted role rollout; the application role never receives broad `AnonymousSession` UPDATE to acquire a lock.

Start validates a strict `{ itemId, version, locale }` input and runs one `READ COMMITTED` transaction: owner lock, `content_lock_assessment_eligibility`, exact published reader and pinned identity comparison, database timestamp, ready attempt insert. The publication lock remains until commit, serializing starts with retirement and withdrawal. Each successful start creates a new attempt; durable start idempotency needs an additional claim contract and is outside v1.

Finalize validates a strict `{ attemptId, idempotencyKey, answer, locale }` input and runs one transaction: owner lock, owner-qualified attempt lock, pinned source verification, normalized answer/evaluation/digest, claim/result check, then atomic submission/result/claim insertion and state transition. A same-key, same-digest retry returns the existing result; a changed digest conflicts. A new key with the same digest may alias the existing result. A changed digest under any key conflicts after finalization. Reasoning stays explicitly unscored. Database time is sampled after locks. No new-publication eligibility is required to finalize a pinned attempt.

Restore locks the owned attempt and reconstructs an active or finalized allowlisted projection. Finalized reads recompute the evaluation from the stored normalized answer and compare the digest, pinned identity, algorithm/correction version, and stored result before serialization. History is owner-scoped, bounded to 1–50 entries, sorted by `(startedAt DESC, attemptId DESC)`, with an owner-qualified cursor. Deleting the owner cascades Assessment descendants; explicit child deletion while the owner survives violates lifecycle guards.

The HTTP layer uses Server Actions for same-origin mutations after exact Origin and runtime checks; reads reauthorize the owner and stay private and uncached. Neither actions nor RSC payloads may serialize compiled source or private rubric. Public DTOs are the only output boundary. A text Assessment does not measure simulator positioning.

## Verification gates

Use real restricted `refview_app_test` PostgreSQL login for owner service tests. Cover valid and valid-wrong answers, same/different-key retries, normalized-equivalent answers, concurrent finalization, rollback after intermediate writes, wrong/expired/deleted owners, start versus retirement, pinned continuation after retirement, restore/history versus owner deletion, role denial, source/result mismatch, and private DTO secrecy. Browser checks use Playwright CLI once routes exist. Synthetic reviewed content in `refview_test` supplies the positive fixture; editorial candidates stay draft pending exact Nicolas review.
