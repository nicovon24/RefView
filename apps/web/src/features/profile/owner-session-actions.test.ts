import 'dotenv/config';
import { createHash } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openTestDatabase } from '../../lib/db/connection';

const request = vi.hoisted(() => ({
  origin: null as string | null,
  cookie: undefined as string | undefined,
  cookieWrites: [] as Array<{ name: string; value: string; options: Record<string, unknown> }>,
}));

vi.mock('next/headers', () => ({
  headers: async () => ({ get: (name: string) => name === 'origin' ? request.origin : null }),
  cookies: async () => ({
    get: (name: string) => name === 'refview_session' && request.cookie ? { value: request.cookie } : undefined,
    set: (name: string, value: string, options: Record<string, unknown>) => {
      request.cookieWrites.push({ name, value, options });
      request.cookie = value;
    },
  }),
}));

const database = openTestDatabase();
vi.mock('@/lib/db/application-runtime', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/db/application-runtime')>(),
  openApplicationDatabase: () => database,
}));

import { bootstrapOwnerSession, deleteOwnerSession, readOwnerSession } from './owner-session-actions';

const appOrigin = 'http://127.0.0.1:3000';
let ownedToken: string | undefined;

function tokenHash(token: string) {
  return `sha256:${createHash('sha256').update(token).digest('hex')}`;
}

beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgresql://refview:refview@127.0.0.1:5432/refview');
  vi.stubEnv('REFVIEW_APP_ORIGIN', appOrigin);
  vi.stubEnv('REFVIEW_SESSION_TEST_MODE', '0');
  request.origin = appOrigin;
  request.cookie = undefined;
  request.cookieWrites.length = 0;
  ownedToken = undefined;
});

afterEach(async () => {
  if (ownedToken) {
    await database.anonymousSession.deleteMany({ where: { tokenHash: tokenHash(ownedToken) } });
  }
  vi.unstubAllEnvs();
});

afterAll(async () => database.$disconnect());

describe('Profile owner Server Actions', () => {
  it.each([null, 'https://attacker.example', `${appOrigin}/`])(
    'rejects bootstrap from Origin %s before creating an owner or writing a cookie', async (origin) => {
      request.origin = origin;
      const before = await database.anonymousSession.count();
      await expect(bootstrapOwnerSession({})).rejects.toThrow('Application action origin is unavailable');
      expect(await database.anonymousSession.count()).toBe(before);
      expect(request.cookieWrites).toEqual([]);
    },
  );

  it('accepts exact Origin, then rejects foreign Origin on reads and deletion without changing the owner', async () => {
    const created = await bootstrapOwnerSession({});
    ownedToken = request.cookie;
    expect(created.status).toBe('active');
    expect(request.cookieWrites).toHaveLength(1);
    expect(ownedToken).toMatch(/^[a-f0-9]{64}$/);
    const ownerHash = tokenHash(ownedToken!);
    const initialRow = await database.anonymousSession.findUniqueOrThrow({ where: { tokenHash: ownerHash } });

    request.origin = 'https://attacker.example';
    await expect(readOwnerSession({})).rejects.toThrow('Application action origin is unavailable');
    await expect(deleteOwnerSession({})).rejects.toThrow('Application action origin is unavailable');
    expect(request.cookieWrites).toHaveLength(1);
    expect(request.cookie).toBe(ownedToken);
    expect(await database.anonymousSession.findUniqueOrThrow({ where: { tokenHash: ownerHash } }))
      .toEqual(initialRow);

    request.origin = appOrigin;
    expect(await readOwnerSession({})).toEqual(created);
    expect(await deleteOwnerSession({})).toEqual({ status: 'missing' });
    expect(await database.anonymousSession.count({ where: { tokenHash: ownerHash } })).toBe(0);
    expect(request.cookieWrites[1]).toMatchObject({
      name: 'refview_session', value: '', options: { secure: true, httpOnly: true, path: '/', maxAge: 0 },
    });
  });
});
