import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';
import { createAnonymousSession, resolveAnonymousOwner } from '../db/attempt-lifecycle';

const emptyPayload = z.strictObject({});
const cookieName = 'refview_session';

export type SessionCookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: {
    secure: true; httpOnly: true; sameSite: 'lax'; path: '/'; maxAge: number;
  }): void;
};

export function requireExactOrigin(actual: string | null, expected: string): void {
  if (actual !== expected) throw new Error('request origin is unavailable or forbidden');
}

async function activeExpiry(database: PrismaClient, token: string | undefined): Promise<Date | null> {
  if (!token || !(await resolveAnonymousOwner(database, token))) return null;
  const tokenHash = `sha256:${createHash('sha256').update(token).digest('hex')}`;
  const row = await database.anonymousSession.findUnique({ where: { tokenHash }, select: { expiresAt: true } });
  return row && row.expiresAt.getTime() > Date.now() ? row.expiresAt : null;
}

export async function readAnonymousSession(database: PrismaClient, cookieStore: SessionCookieStore): Promise<{ status: 'active' | 'missing' }> {
  const expiry = await activeExpiry(database, cookieStore.get(cookieName)?.value);
  return { status: expiry ? 'active' : 'missing' };
}

export async function establishAnonymousSession(
  database: PrismaClient,
  cookieStore: SessionCookieStore,
  payload: unknown,
): Promise<{ status: 'active'; expiresAt: string }> {
  emptyPayload.parse(payload);
  const expiry = await activeExpiry(database, cookieStore.get(cookieName)?.value);
  if (expiry) return { status: 'active', expiresAt: expiry.toISOString() };
  const created = await createAnonymousSession(database);
  cookieStore.set(created.cookie.name, created.cookie.value, created.cookie);
  return { status: 'active', expiresAt: created.expiresAt.toISOString() };
}
