import { createHash, randomBytes } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';

const cookieName = 'refview_session';
const tokenPattern = /^[a-f0-9]{64}$/;
const lifetimeSeconds = 7 * 24 * 60 * 60;
const emptyPayload = z.strictObject({});

export type ApplicationOwnerTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
type Transaction = ApplicationOwnerTransaction;
type OwnerStatus = { status: 'missing' } | { status: 'active'; expiresAt: string };

export type ApplicationOwnerCookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: {
    secure: true; httpOnly: true; sameSite: 'lax'; path: '/'; maxAge: number;
  }): void;
};

function tokenFrom(cookieStore: ApplicationOwnerCookieStore): string | null {
  const token = cookieStore.get(cookieName)?.value;
  return token && tokenPattern.test(token) ? token : null;
}

function hashToken(token: string): string {
  return `sha256:${createHash('sha256').update(token).digest('hex')}`;
}

/** Server-side token binding for narrow application procedures; never serialize this value. */
export function applicationOwnerTokenHash(cookieStore: ApplicationOwnerCookieStore): string | null {
  const token = tokenFrom(cookieStore);
  return token ? hashToken(token) : null;
}

/** The migration-owned function locks the owner and checks expiry after any lock wait. */
async function resolveLockedOwner(tx: Transaction, token: string, lock: 'share' | 'exclusive' = 'share'): Promise<{ id: string; expiresAt: Date } | null> {
  const rows = await tx.$queryRaw<Array<{ id: string; expiresAt: Date }>>`
    SELECT owner_id AS id, expires_at AT TIME ZONE 'UTC' AS "expiresAt"
    FROM public.application_lock_owner(${hashToken(token)}, ${lock})
  `;
  return rows[0] ?? null;
}

/** Same token and expiry admission as reads and ordinary mutations, with an exclusive owner lock. */
export async function resolveExclusiveApplicationOwner(
  tx: Transaction, cookieStore: ApplicationOwnerCookieStore,
): Promise<string | null> {
  const token = tokenFrom(cookieStore);
  if (!token) return null;
  return (await resolveLockedOwner(tx, token, 'exclusive'))?.id ?? null;
}

/** Read-only owner status. Database errors propagate rather than becoming missing. */
export async function readApplicationOwner(
  database: PrismaClient, cookieStore: ApplicationOwnerCookieStore,
): Promise<OwnerStatus> {
  const token = tokenFrom(cookieStore);
  if (!token) return { status: 'missing' };
  const owner = await database.$transaction((tx) => resolveLockedOwner(tx, token));
  return owner ? { status: 'active', expiresAt: owner.expiresAt.toISOString() } : { status: 'missing' };
}

/** Call only after the action has validated application runtime and exact Origin. */
export async function bootstrapApplicationOwner(
  database: PrismaClient, cookieStore: ApplicationOwnerCookieStore, payload: unknown,
): Promise<{ status: 'active'; expiresAt: string }> {
  emptyPayload.parse(payload);
  const existing = await readApplicationOwner(database, cookieStore);
  if (existing.status === 'active') return existing;

  const token = randomBytes(32).toString('hex');
  const startedAt = performance.now();
  const rows = await database.$queryRaw<Array<{ expiresAt: Date; databaseNow: Date }>>`
    SELECT expires_at AS "expiresAt", database_now AS "databaseNow"
    FROM public.application_create_owner(${hashToken(token)})
  `;
  const expiresAt = rows[0]!.expiresAt;
  const remainingMs = expiresAt.getTime() - rows[0]!.databaseNow.getTime()
    - (performance.now() - startedAt);
  const maxAge = Math.max(0, Math.min(lifetimeSeconds,
    Math.floor(remainingMs / 1000)));
  cookieStore.set(cookieName, token, {
    secure: true, httpOnly: true, sameSite: 'lax', path: '/', maxAge,
  });
  return { status: 'active', expiresAt: expiresAt.toISOString() };
}

/** Feature callbacks stay server-side and must scope every owner record by ownerId. */
export async function withApplicationOwner<T>(
  database: PrismaClient,
  cookieStore: ApplicationOwnerCookieStore,
  feature: (transaction: Transaction, ownerId: string) => Promise<T>,
): Promise<T> {
  const token = tokenFrom(cookieStore);
  if (!token) throw new Error('application owner unavailable');
  return database.$transaction(async (tx) => {
    const owner = await resolveLockedOwner(tx, token);
    if (!owner) throw new Error('application owner unavailable');
    return feature(tx, owner.id);
  });
}
