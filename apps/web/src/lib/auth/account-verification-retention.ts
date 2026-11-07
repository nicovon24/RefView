import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';

const batchLimit = z.number().int().min(1).max(100);

/** Removes only expired transient OAuth state, using database time and bounded locks. */
export async function purgeExpiredAccountVerifications(
  database: PrismaClient, limit: number,
): Promise<{ deletedVerifications: number }> {
  const bounded = batchLimit.parse(limit);
  const rows = await database.$queryRaw<Array<{ id: string }>>`
    WITH due AS (
      SELECT "id" FROM public."verification"
      WHERE "expiresAt" <= (clock_timestamp() AT TIME ZONE 'UTC')::timestamp(3)
      ORDER BY "expiresAt", "id" LIMIT ${bounded} FOR UPDATE SKIP LOCKED
    )
    DELETE FROM public."verification" v USING due
    WHERE v."id" = due."id" RETURNING v."id"`;
  return { deletedVerifications: rows.length };
}
