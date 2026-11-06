import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';
import { createHash } from 'node:crypto';
import { type ApplicationOwnerCookieStore } from './application-owner';

const emptyPayload = z.strictObject({});
const batchLimit = z.number().int().min(1).max(100);
const tokenPattern = /^[a-f0-9]{64}$/;

/** Call only after validating application runtime and exact action Origin. */
export async function deleteApplicationOwner(
  database: PrismaClient, cookieStore: ApplicationOwnerCookieStore, payload: unknown,
): Promise<Record<string, never>> {
  emptyPayload.parse(payload);
  const token = cookieStore.get('refview_session')?.value;
  if (token && tokenPattern.test(token)) {
    const hash = `sha256:${createHash('sha256').update(token).digest('hex')}`;
    await database.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT public.application_delete_owner(${hash})::text AS deleted`;
    }, { timeout: 30_000 });
  }
  cookieStore.set('refview_session', '', {
    secure: true, httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0,
  });
  return {};
}

/** Server-only maintenance primitive. Scheduling and retention promises are separate decisions. */
export async function purgeExpiredApplicationOwners(
  database: PrismaClient, limit: number,
): Promise<{ deletedOwners: number }> {
  const bounded = batchLimit.parse(limit);
  return database.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ deletedOwners: number }>>`
      SELECT public.application_purge_expired_owners(${bounded}) AS "deletedOwners"
    `;
    return { deletedOwners: rows[0]!.deletedOwners };
  }, { timeout: 30_000 });
}
