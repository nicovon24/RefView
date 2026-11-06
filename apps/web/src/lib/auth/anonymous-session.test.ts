import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { openTestDatabase } from '../db/connection';
import { establishAnonymousSession, readAnonymousSession, requireExactOrigin } from './anonymous-session';

const db = openTestDatabase();
afterAll(async () => db.$disconnect());

function cookies(initial?: string) {
  let value = initial;
  const written: unknown[] = [];
  return {
    get: (name: string) => name === 'refview_session' && value ? { value } : undefined,
    set: (name: string, token: string, options: unknown) => { written.push({ name, token, options }); value = token; },
    written,
  };
}

describe('exact origin guard', () => {
  const expected = 'http://127.0.0.1:3001';
  it.each([null, 'http://localhost:3001', 'http://127.0.0.1:3000', 'https://127.0.0.1:3001', 'http://evil.example'])('rejects %s', (origin) => {
    expect(() => requireExactOrigin(origin, expected)).toThrow(/origin/i);
  });
  it('accepts only the configured origin', () => expect(requireExactOrigin(expected, expected)).toBeUndefined());
});

describe('anonymous session transport on PostgreSQL', () => {
  it('creates and reuses without sliding expiry or writing another cookie', async () => {
    const jar = cookies();
    const first = await establishAnonymousSession(db, jar, {});
    expect(Object.keys(first).sort()).toEqual(['expiresAt', 'status']);
    expect(first.status).toBe('active');
    expect(jar.written).toHaveLength(1);
    expect(jar.written[0]).toMatchObject({ name: 'refview_session', options: {
      secure: true, httpOnly: true, sameSite: 'lax', path: '/', maxAge: 604800,
    } });
    expect((jar.written[0] as { options: object }).options).not.toHaveProperty('domain');
    const token = jar.get('refview_session')?.value;
    const count = await db.anonymousSession.count({ where: { tokenHash: { not: '' } } });
    const second = await establishAnonymousSession(db, jar, {});
    expect(second).toEqual(first);
    expect(jar.written).toHaveLength(1);
    expect(await db.anonymousSession.count({ where: { tokenHash: { not: '' } } })).toBe(count);
    expect(await readAnonymousSession(db, jar)).toEqual({ status: 'active' });
    expect(JSON.stringify(second)).not.toContain(token);
  });

  it('replaces an expired cookie only on explicit establishment', async () => {
    const jar = cookies();
    await establishAnonymousSession(db, jar, {});
    const token = jar.get('refview_session')!.value;
    const { createHash } = await import('node:crypto');
    await db.anonymousSession.update({ where: { tokenHash: `sha256:${createHash('sha256').update(token).digest('hex')}` },
      data: { createdAt: new Date(Date.now() - 8 * 86400000), expiresAt: new Date(Date.now() - 86400000) } });
    expect(await readAnonymousSession(db, jar)).toEqual({ status: 'missing' });
    expect(jar.written).toHaveLength(1);
    await establishAnonymousSession(db, jar, {});
    expect(jar.written).toHaveLength(2);
  });

  it('rejects any nonempty payload and leaves rows unchanged', async () => {
    const jar = cookies();
    const before = await db.anonymousSession.count();
    await expect(establishAnonymousSession(db, jar, { ownerId: 'injected' })).rejects.toThrow();
    expect(await db.anonymousSession.count()).toBe(before);
    expect(jar.written).toHaveLength(0);
  });

  it('does not issue a cookie or response when PostgreSQL creation fails', async () => {
    const jar = cookies();
    const before = await db.anonymousSession.count();
    const broken = { ...db, anonymousSession: { ...db.anonymousSession, create: async () => { throw new Error('database unavailable'); } } };
    await expect(establishAnonymousSession(broken as unknown as typeof db, jar, {})).rejects.toThrow('database unavailable');
    expect(jar.written).toHaveLength(0);
    expect(await db.anonymousSession.count()).toBe(before);
  });
});
