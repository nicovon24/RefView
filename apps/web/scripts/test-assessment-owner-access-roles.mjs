import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import pg from 'pg';

function checkedUrl(value, role) {
  if (!value) throw new Error(`Missing ${role} test URL`);
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || url.hostname !== '127.0.0.1' || url.port !== '55439'
    || url.search || url.hash || url.username !== role
    || decodeURIComponent(url.pathname.slice(1)) !== 'refview_test') {
    throw new Error(`Unexpected ${role} test URL`);
  }
  return url.href;
}

const bootstrapUrl = process.env.TEST_DATABASE_URL;
if (!bootstrapUrl) throw new Error('Missing isolated setup database');
const bootstrapTarget = new URL(bootstrapUrl);
if (!['postgres:', 'postgresql:'].includes(bootstrapTarget.protocol)
  || !['127.0.0.1', 'localhost', '[::1]'].includes(bootstrapTarget.hostname)
  || bootstrapTarget.port !== '55439'
  || (bootstrapTarget.search && bootstrapTarget.search !== '?schema=public')
  || bootstrapTarget.hash
  || bootstrapTarget.username !== 'refview'
  || decodeURIComponent(bootstrapTarget.pathname.slice(1)) !== 'refview_test') {
  throw new Error('TEST_DATABASE_URL must be the isolated loopback setup login');
}
const bootstrap = new pg.Client({ connectionString: bootstrapUrl });
const app = new pg.Client({ connectionString: checkedUrl(process.env.TEST_CONTENT_APP_URL, 'refview_app_test') });
const reviewer = new pg.Client({ connectionString: checkedUrl(process.env.TEST_CONTENT_REVIEWER_URL, 'refview_reviewer_test') });
const ownerId = randomUUID();
const tokenHash = `sha256:${createHash('sha256').update(randomUUID()).digest('hex')}`;
let ownerCreated = false;
try {
  await bootstrap.connect();
  await app.connect();
  await reviewer.connect();
  for (const [client, expected] of [[app, 'refview_app_test'], [reviewer, 'refview_reviewer_test']]) {
    const identity = await client.query('SELECT current_database() AS database, session_user AS role');
    assert.equal(identity.rows[0].database, 'refview_test');
    assert.equal(identity.rows[0].role, expected);
  }
  await bootstrap.query(`INSERT INTO public."AnonymousSession" ("id","tokenHash","expiresAt")
    VALUES ($1,$2,clock_timestamp() + interval '1 hour')`, [ownerId, tokenHash]);
  ownerCreated = true;
  const live = await app.query('SELECT * FROM public.application_lock_owner($1,$2)', [tokenHash, 'share']);
  assert.equal(live.rowCount, 1);
  assert.equal(live.rows[0].owner_id, ownerId);
  const rights = await app.query(`SELECT
    has_function_privilege(session_user,'public.application_lock_owner(text,text)','EXECUTE') AS owner_lock,
    has_table_privilege(session_user,'public."ContentReviewerPrincipal"','SELECT') AS principal_read,
    has_table_privilege(session_user,'public."AssessmentAttempt"','INSERT') AS attempt_insert,
    has_table_privilege(session_user,'public."AnonymousSession"','UPDATE') AS owner_update,
    has_table_privilege(session_user,'public."AssessmentPublication"','UPDATE') AS publication_update`);
  assert.deepEqual(rights.rows[0], { owner_lock: true, principal_read: true,
    attempt_insert: true, owner_update: false, publication_update: false });
  await assert.rejects(reviewer.query('SELECT * FROM public.application_lock_owner($1,$2)',
    [tokenHash, 'share']), (error) => error.code === '42501');
  await assert.rejects(app.query('UPDATE public."AnonymousSession" SET "expiresAt"=clock_timestamp() WHERE "id"=$1',
    [ownerId]), (error) => error.code === '42501');

  await bootstrap.query('BEGIN');
  try {
    await bootstrap.query(`UPDATE public."AnonymousSession"
      SET "createdAt"=clock_timestamp() - interval '2 hours',
          "expiresAt"=clock_timestamp() - interval '1 second' WHERE "id"=$1`, [ownerId]);
    let settled = false;
    const pending = app.query('SELECT * FROM public.application_lock_owner($1,$2)',
      [tokenHash, 'share']).then((result) => { settled = true; return result; });
    await setTimeout(100);
    assert.equal(settled, false, 'owner lock should wait for the row update');
    await bootstrap.query('COMMIT');
    const expired = await pending;
    assert.equal(expired.rowCount, 0, 'expiry must be checked after the lock wait');
  } catch (error) {
    await bootstrap.query('ROLLBACK').catch(() => {});
    throw error;
  }
  process.stdout.write('Restricted owner lock, grants, denial and post-wait expiry: PASS.\n');
} finally {
  if (ownerCreated) await bootstrap.query('DELETE FROM public."AnonymousSession" WHERE "id"=$1', [ownerId]).catch(() => {});
  await Promise.allSettled([bootstrap.end(), app.end(), reviewer.end()]);
}
