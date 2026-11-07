import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';
import { readAccountPrincipal, type AccountPrincipal } from '../../lib/auth/account-principal';
import { openApplicationDatabase } from '../../lib/db/application-runtime';

const safeText = (minimum: number, maximum: number) => z.string().trim()
  .min(minimum).max(maximum).refine((value) => !/[\p{Cc}]/u.test(value));
export const operationKey = z.string().regex(/^[0-9a-f]{64}$/);
export const operationInput = z.strictObject({
  operation: z.enum(['profile', 'match', 'post']),
});

export const contributorInput = z.strictObject({
  operationKey,
  displayName: safeText(2, 40),
});

const matchDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});

export const matchInput = z.strictObject({
  operationKey,
  homeTeam: safeText(2, 80),
  awayTeam: safeText(2, 80),
  competition: safeText(2, 80).nullable().optional(),
  matchDate,
}).refine((value) => value.homeTeam.toLocaleLowerCase() !== value.awayTeam.toLocaleLowerCase());

export const postInput = z.strictObject({
  operationKey,
  matchId: z.uuid(),
  opinion: safeText(20, 3000),
  period: z.enum(['first', 'second', 'extra_first', 'extra_second', 'shootout']).nullable().optional(),
  minute: z.number().int().min(0).max(130).nullable().optional(),
});

const profile = z.strictObject({ id: z.uuid(), displayName: z.string() });
const match = z.strictObject({
  id: z.uuid(), homeTeam: z.string(), awayTeam: z.string(), competition: z.string().nullable(),
  matchDate, state: z.string(), createdAt: z.iso.datetime({ offset: true }),
  revision: z.number().int().nonnegative().optional(), publishedAt: z.iso.datetime({ offset: true }).nullable().optional(),
});
const post = z.strictObject({
  id: z.uuid(), matchId: z.uuid(), opinion: z.string(), period: z.string().nullable(),
  minute: z.number().int().nullable(), state: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  revision: z.number().int().nonnegative().optional(), publishedAt: z.iso.datetime({ offset: true }).nullable().optional(),
});
const availableMatch = z.strictObject({
  id: z.uuid(), homeTeam: z.string(), awayTeam: z.string(), competition: z.string().nullable(),
  matchDate, state: z.string(), publishedAt: z.iso.datetime({ offset: true }).nullable(),
});
const snapshot = z.strictObject({
  profile: profile.nullable(), matches: z.array(match).max(50), posts: z.array(post).max(50),
  availableMatches: z.array(availableMatch).max(50),
  mode: z.enum(['private', 'local_shared']),
});

export type PrivateSocialWorkspace =
  | Readonly<{ kind: 'missing' }>
  | Readonly<{ kind: 'unavailable' }>
  | Readonly<{ kind: 'ready'; profile: z.infer<typeof profile> | null;
      matches: z.infer<typeof match>[]; posts: z.infer<typeof post>[];
      availableMatches: z.infer<typeof availableMatch>[]; mode: 'private' | 'local_shared' }>;

/** This SQL projection contains only the current account's private contribution graph. */
export async function readPrivateSocialWorkspace(): Promise<PrivateSocialWorkspace> {
  try {
    const principal = await readAccountPrincipal(await headers());
    if (principal.kind === 'missing') return { kind: 'missing' };
    const rows = await openApplicationDatabase().$queryRaw<Array<{ snapshot: unknown }>>`
      SELECT public.social_private_snapshot_with_mode(${principal.token}) AS snapshot`;
    const parsed = snapshot.parse(rows[0]?.snapshot);
    return { kind: 'ready', ...parsed };
  } catch {
    return { kind: 'unavailable' };
  }
}

function hashOperationKey(rawKey: string): string {
  return `sha256:${createHash('sha256').update(Buffer.from(rawKey, 'hex')).digest('hex')}`;
}

/** The raw key is returned only to the caller so a retry can reuse it. */
export async function issuePrivateSocialOperation(database: PrismaClient,
  principal: AccountPrincipal, operation: z.infer<typeof operationInput>['operation']) {
  const rawKey = randomBytes(32).toString('hex');
  const keyHash = hashOperationKey(rawKey);
  await database.$queryRaw`SELECT public.social_issue_operation(
    ${principal.token}, ${keyHash}, ${operation})::text`;
  return { operationKey: rawKey };
}

function createdId(rows: Array<{ id: string }>): { kind: 'created'; id: string } {
  const id = z.uuid().parse(rows[0]?.id);
  return { kind: 'created', id };
}

export async function createPrivateContributor(database: PrismaClient, principal: AccountPrincipal,
  input: z.infer<typeof contributorInput>) {
  const keyHash = hashOperationKey(input.operationKey);
  return createdId(await database.$queryRaw<Array<{ id: string }>>`
    SELECT public.social_create_contributor(${principal.token}, ${keyHash},
      ${input.displayName}) AS id`);
}

export async function createPrivateMatch(database: PrismaClient, principal: AccountPrincipal,
  input: z.infer<typeof matchInput>) {
  const keyHash = hashOperationKey(input.operationKey);
  return createdId(await database.$queryRaw<Array<{ id: string }>>`
    SELECT public.social_create_match(${principal.token}, ${keyHash},
      ${input.homeTeam}, ${input.awayTeam}, ${input.competition ?? null},
      ${input.matchDate}::date) AS id`);
}

export async function createPrivatePost(database: PrismaClient, principal: AccountPrincipal,
  input: z.infer<typeof postInput>) {
  const keyHash = hashOperationKey(input.operationKey);
  return createdId(await database.$queryRaw<Array<{ id: string }>>`
    SELECT public.social_create_post(${principal.token}, ${keyHash},
      ${input.matchId}::uuid, ${input.opinion}, ${input.period ?? null},
      ${input.minute ?? null}) AS id`);
}
