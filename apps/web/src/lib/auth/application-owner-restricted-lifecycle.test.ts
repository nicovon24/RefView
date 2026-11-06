import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';

function testUrl(value: string | undefined, role: string): string {
  if (!value) throw new Error(`Missing ${role} URL`);
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || url.hostname !== '127.0.0.1' || url.port !== '55439'
    || url.search || url.hash || url.username !== role
    || decodeURIComponent(url.pathname.slice(1)) !== 'refview_test') {
    throw new Error(`Unexpected ${role} test URL`);
  }
  return value;
}

const app = new pg.Pool({ connectionString: testUrl(process.env.TEST_CONTENT_APP_URL, 'refview_app_test') });
const reviewer = new pg.Pool({ connectionString: testUrl(process.env.TEST_CONTENT_REVIEWER_URL, 'refview_reviewer_test') });
const setupUrl = process.env.TEST_DATABASE_URL;
const setupTarget = setupUrl ? new URL(setupUrl) : null;
if (!setupTarget || !['postgres:', 'postgresql:'].includes(setupTarget.protocol)
  || !['127.0.0.1', 'localhost', '[::1]'].includes(setupTarget.hostname)
  || setupTarget.port !== '55439' || setupTarget.hash
  || (setupTarget.search && setupTarget.search !== '?schema=public')
  || setupTarget.username !== 'refview'
  || decodeURIComponent(setupTarget.pathname.slice(1)) !== 'refview_test') {
  throw new Error('Expected isolated test setup login');
}
const setup = new pg.Pool({ connectionString: setupUrl });
afterAll(async () => { await Promise.all([app.end(), reviewer.end(), setup.end()]); });

function tokenHash(): string {
  return `sha256:${createHash('sha256').update(randomUUID()).digest('hex')}`;
}

describe('restricted application owner lifecycle on PostgreSQL', () => {
  it('creates with the database clock and deletes only the matching owner', async () => {
    const hash = tokenHash();
    const other = tokenHash();
    try {
      const first = await app.query('SELECT * FROM public.application_create_owner($1)', [hash]);
      expect(first.rows).toHaveLength(1);
      expect(Object.keys(first.rows[0]).sort()).toEqual(['database_now', 'expires_at']);
      expect(first.rows[0].expires_at.getTime() - first.rows[0].database_now.getTime())
        .toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
      await app.query('SELECT * FROM public.application_create_owner($1)', [other]);
      expect((await app.query('SELECT * FROM public.application_lock_owner($1,$2)', [hash, 'share'])).rowCount).toBe(1);
      await app.query('SELECT public.application_delete_owner($1)', [hash]);
      await app.query('SELECT public.application_delete_owner($1)', [hash]);
      expect((await app.query('SELECT * FROM public.application_lock_owner($1,$2)', [hash, 'share'])).rowCount).toBe(0);
      expect((await app.query('SELECT * FROM public.application_lock_owner($1,$2)', [other, 'share'])).rowCount).toBe(1);
    } finally {
      await setup.query('DELETE FROM public."AnonymousSession" WHERE "tokenHash" = ANY($1)', [[hash, other]]);
    }
  });

  it('rejects invalid inputs and denies direct mutation, private helper, and reviewer execution', async () => {
    await expect(app.query('SELECT * FROM public.application_create_owner($1)', ['bad'])).rejects.toThrow();
    await expect(app.query('SELECT * FROM public.application_delete_owner($1)', ['bad'])).rejects.toThrow();
    await expect(app.query('SELECT public.application_purge_expired_owners($1)', [0])).rejects.toThrow();
    await expect(app.query('SELECT public.application_purge_expired_owners($1)', [101])).rejects.toThrow();
    await expect(app.query('SELECT public.application_purge_expired_owners(NULL)')).rejects.toThrow();
    await expect(app.query('SELECT public.application_delete_owner_rows($1)', [randomUUID()])).rejects.toMatchObject({ code: '42501' });
    await expect(app.query('SELECT "id" FROM public."AnonymousSession" LIMIT 1')).rejects.toMatchObject({ code: '42501' });
    await expect(app.query('INSERT INTO public."AnonymousSession" ("id","tokenHash","expiresAt") VALUES ($1,$2,clock_timestamp())',
      [randomUUID(), tokenHash()])).rejects.toMatchObject({ code: '42501' });
    await expect(app.query('UPDATE public."AnonymousSession" SET "expiresAt" = clock_timestamp() WHERE false')).rejects.toMatchObject({ code: '42501' });
    await expect(app.query('DELETE FROM public."AnonymousSession" WHERE false')).rejects.toMatchObject({ code: '42501' });
    await expect(reviewer.query('SELECT * FROM public.application_create_owner($1)', [tokenHash()])).rejects.toMatchObject({ code: '42501' });
    await expect(reviewer.query('SELECT * FROM public.application_delete_owner($1)', [tokenHash()])).rejects.toMatchObject({ code: '42501' });
    await expect(reviewer.query('SELECT public.application_purge_expired_owners($1)', [1])).rejects.toMatchObject({ code: '42501' });
  });

  it('uses UTC with a non-UTC caller, rolls back, and purges only expired owners in bounded batches', async () => {
    const expired = tokenHash();
    const live = tokenHash();
    const client = await app.connect();
    try {
      await client.query("SET TIME ZONE 'Pacific/Honolulu'");
      const created = await client.query('SELECT * FROM public.application_create_owner($1)', [live]);
      expect(Math.abs(created.rows[0].database_now.getTime() - Date.now())).toBeLessThan(10_000);
      await client.query('BEGIN');
      await client.query('SELECT * FROM public.application_create_owner($1)', [expired]);
      await client.query('ROLLBACK');
      expect((await setup.query('SELECT 1 FROM public."AnonymousSession" WHERE "tokenHash"=$1', [expired])).rowCount).toBe(0);
      await setup.query(`INSERT INTO public."AnonymousSession" ("id","tokenHash","createdAt","expiresAt")
        VALUES ($1,$2,'1900-01-01'::timestamp,'1900-01-02'::timestamp)`, [randomUUID(), expired]);
      expect((await app.query('SELECT public.application_purge_expired_owners($1) AS deleted_owners', [1])).rows)
        .toEqual([{ deleted_owners: 1 }]);
      expect((await setup.query('SELECT 1 FROM public."AnonymousSession" WHERE "tokenHash"=$1', [expired])).rowCount).toBe(0);
      expect((await setup.query('SELECT 1 FROM public."AnonymousSession" WHERE "tokenHash"=$1', [live])).rowCount).toBe(1);
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
      await setup.query('DELETE FROM public."AnonymousSession" WHERE "tokenHash" = ANY($1)', [[expired, live]]);
    }
  });
});
