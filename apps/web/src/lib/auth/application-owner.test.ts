import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { openTestDatabase } from '../db/connection';
import { bootstrapApplicationOwner, readApplicationOwner, withApplicationOwner } from './application-owner';

const db = openTestDatabase();
afterAll(async () => db.$disconnect());

function jar(initial?: string) {
  let value = initial;
  const writes: Array<{ name: string; token: string; options: Record<string, unknown> }> = [];
  return {
    get: (name: string) => name === 'refview_session' && value ? { value } : undefined,
    set: (name: string, token: string, options: Record<string, unknown>) => {
      writes.push({ name, token, options }); value = token;
    },
    writes,
  };
}

function tokenHash(token: string) {
  return `sha256:${createHash('sha256').update(token).digest('hex')}`;
}

describe('application owner on PostgreSQL', () => {
  it('accepts exact empty bootstrap input and writes the cookie after commit', async () => {
    const cookies = jar();
    const before = await db.anonymousSession.count();
    await expect(bootstrapApplicationOwner(db, cookies, { unexpected: true })).rejects.toThrow();
    await expect(bootstrapApplicationOwner(db, cookies, null)).rejects.toThrow();
    expect(await db.anonymousSession.count()).toBe(before);
    const first = await bootstrapApplicationOwner(db, cookies, {});
    expect(Object.keys(first).sort()).toEqual(['expiresAt', 'status']);
    expect(cookies.writes).toHaveLength(1);
    const write = cookies.writes[0]!;
    expect(write.name).toBe('refview_session');
    expect(write.token).toMatch(/^[a-f0-9]{64}$/);
    expect(write.options).toMatchObject({ secure: true, httpOnly: true, sameSite: 'lax', path: '/' });
    expect(write.options).not.toHaveProperty('domain');
    expect(write.options.maxAge).toBeGreaterThan(0);
    expect(write.options.maxAge).toBeLessThanOrEqual(604800);
    const row = await db.anonymousSession.findUniqueOrThrow({ where: { tokenHash: tokenHash(write.token) } });
    expect(row.tokenHash).not.toContain(write.token);
    expect(row.expiresAt.getTime() - row.createdAt.getTime()).toBe(604800000);
    expect(first.expiresAt).toBe(row.expiresAt.toISOString());
    expect(JSON.stringify(first)).not.toContain(row.id);
    expect(JSON.stringify(first)).not.toContain(write.token);
  });

  it('reads without creation, renewal or cookie writes', async () => {
    const cookies = jar();
    const before = await db.anonymousSession.count();
    expect(await readApplicationOwner(db, cookies)).toEqual({ status: 'missing' });
    expect(await db.anonymousSession.count()).toBe(before);
    const first = await bootstrapApplicationOwner(db, cookies, {});
    const row = await db.anonymousSession.findUniqueOrThrow({ where: { tokenHash: tokenHash(cookies.writes[0]!.token) } });
    expect(await readApplicationOwner(db, cookies)).toEqual(first);
    expect(await bootstrapApplicationOwner(db, cookies, {})).toEqual(first);
    expect(cookies.writes).toHaveLength(1);
    const again = await db.anonymousSession.findUniqueOrThrow({ where: { id: row.id } });
    expect(again.expiresAt).toEqual(row.expiresAt);
  });

  it('derives cookie lifetime from PostgreSQL despite application clock skew', async () => {
    const cookies = jar();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 30 * 86400000);
    try {
      await bootstrapApplicationOwner(db, cookies, {});
    } finally {
      clock.mockRestore();
    }
    expect(cookies.writes[0]!.options.maxAge).toBeGreaterThan(604790);
    expect(cookies.writes[0]!.options.maxAge).toBeLessThanOrEqual(604800);
  });

  it('treats malformed, unknown and expired cookies as missing, without silently bootstrapping', async () => {
    for (const token of ['x', 'a'.repeat(4096), randomBytes(32).toString('hex')]) {
      const cookies = jar(token);
      expect(await readApplicationOwner(db, cookies)).toEqual({ status: 'missing' });
      await expect(withApplicationOwner(db, cookies, async () => true)).rejects.toThrow(/owner/i);
      expect(cookies.writes).toHaveLength(0);
    }
    const cookies = jar();
    await bootstrapApplicationOwner(db, cookies, {});
    await db.anonymousSession.update({ where: { tokenHash: tokenHash(cookies.writes[0]!.token) },
      data: { createdAt: new Date(Date.now() - 8 * 86400000),
        expiresAt: new Date(Date.now() - 1000) } });
    expect(await readApplicationOwner(db, cookies)).toEqual({ status: 'missing' });
    await expect(withApplicationOwner(db, cookies, async () => true)).rejects.toThrow(/owner/i);
    expect(cookies.writes).toHaveLength(1);
  });

  it('does not write a cookie if insertion fails', async () => {
    const cookies = jar();
    const broken = new Proxy(db, { get(target, property, receiver) {
      if (property === '$queryRaw') return async () => { throw new Error('database unavailable'); };
      return Reflect.get(target, property, receiver);
    } });
    await expect(bootstrapApplicationOwner(broken, cookies, {})).rejects.toThrow('database unavailable');
    expect(cookies.writes).toHaveLength(0);
    const brokenRead = new Proxy(db, { get(target, property, receiver) {
      if (property === '$transaction') return async () => { throw new Error('database unavailable'); };
      return Reflect.get(target, property, receiver);
    } });
    await expect(readApplicationOwner(brokenRead, jar('a'.repeat(64)))).rejects.toThrow('database unavailable');
  });

  it('passes distinct current owner IDs to server-side callbacks', async () => {
    const one = jar(); const two = jar();
    await bootstrapApplicationOwner(db, one, {});
    await bootstrapApplicationOwner(db, two, {});
    const firstId = await withApplicationOwner(db, one, async (_tx, ownerId) => ownerId);
    const secondId = await withApplicationOwner(db, two, async (_tx, ownerId) => ownerId);
    expect(firstId).not.toBe(secondId);
  });

  it('checks expiry after waiting for an owner-row lock', async () => {
    const cookies = jar();
    await bootstrapApplicationOwner(db, cookies, {});
    const hash = tokenHash(cookies.writes[0]!.token);
    let release!: () => void;
    let locked!: () => void;
    const releaseGate = new Promise<void>((resolve) => { release = resolve; });
    const lockedGate = new Promise<void>((resolve) => { locked = resolve; });
    const holder = db.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "AnonymousSession" SET "expiresAt" = clock_timestamp() + interval '400 milliseconds'
        WHERE "tokenHash" = ${hash}
      `;
      locked();
      await releaseGate;
    });
    await lockedGate;
    let entered = false;
    const guarded = withApplicationOwner(db, cookies, async () => { entered = true; });
    await new Promise((resolve) => setTimeout(resolve, 600));
    release();
    await holder;
    await expect(guarded).rejects.toThrow(/owner/i);
    expect(entered).toBe(false);
  });
});
