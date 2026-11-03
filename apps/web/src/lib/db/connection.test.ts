import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { openTestDatabase } from './connection';

const database = openTestDatabase();

afterAll(async () => {
  await database.$disconnect();
});

describe('real PostgreSQL connection through generated Prisma client', () => {
  it('returns database identity and server version', async () => {
    const rows = await database.$queryRaw<Array<{ connected: number; database: string; version: string }>>`
      SELECT 1 AS connected, current_database() AS database, version() AS version
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.connected).toBe(1);
    expect(rows[0]?.database.length).toBeGreaterThan(0);
    expect(rows[0]?.version).toContain('PostgreSQL');
  });
});
