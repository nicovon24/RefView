import 'dotenv/config';
import { randomUUID, createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { openTestDatabase } from '../db/connection';

test('database owner lock returns only a live owner and rejects invalid lock mode', async () => {
  const database = openTestDatabase();
  const ownerId = randomUUID();
  const tokenHash = `sha256:${createHash('sha256').update(randomUUID()).digest('hex')}`;
  try {
    await database.anonymousSession.create({ data: {
      id: ownerId, tokenHash, expiresAt: new Date(Date.now() + 60_000),
    } });
    const live = await database.$queryRaw<Array<{ owner_id: string; expires_at: Date }>>`
      SELECT * FROM public.application_lock_owner(${tokenHash}, 'share')`;
    expect(live).toHaveLength(1);
    expect(live[0]?.owner_id).toBe(ownerId);
    await expect(database.$queryRaw`
      SELECT * FROM public.application_lock_owner(${tokenHash}, 'invalid')`).rejects.toThrow();
    const missing = await database.$queryRaw<Array<{ owner_id: string }>>`
      SELECT * FROM public.application_lock_owner(${`sha256:${'0'.repeat(64)}`}, 'exclusive')`;
    expect(missing).toEqual([]);
    await database.anonymousSession.update({ where: { id: ownerId },
      data: { createdAt: new Date(Date.now() - 120_000),
        expiresAt: new Date(Date.now() - 60_000) } });
    const expired = await database.$queryRaw<Array<{ owner_id: string }>>`
      SELECT * FROM public.application_lock_owner(${tokenHash}, 'share')`;
    expect(expired).toEqual([]);
  } finally {
    await database.anonymousSession.deleteMany({ where: { id: ownerId } });
    await database.$disconnect();
  }
});
