import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';
import { readAccountPrincipal, type AccountPrincipal } from '../../lib/auth/account-principal';
import { openApplicationDatabase } from '../../lib/db/application-runtime';

const id = z.uuid();
const date = z.iso.datetime({ offset: true });
const reaction = z.strictObject({ choice: z.enum(['agree', 'disagree']).nullable(), revision: z.number().int().nonnegative() });
const sharedPost = z.strictObject({
  id, opinion: z.string(), period: z.string().nullable(), minute: z.number().int().nullable(), publishedAt: date,
  revision: z.number().int().nonnegative(),
  match: z.strictObject({
    id, homeTeam: z.string(), awayTeam: z.string(), competition: z.string().nullable(),
    matchDate: z.string(), publishedAt: date,
  }),
  contributor: z.strictObject({ id, displayName: z.string() }),
  reactions: z.strictObject({ agree: z.number().int().nonnegative(), disagree: z.number().int().nonnegative() }),
  myReaction: reaction.nullable(),
});
const sharedFeed = z.strictObject({ posts: z.array(sharedPost).max(50) });

export type SharedSocialPost = z.infer<typeof sharedPost>;
export type SharedSocialFeed =
  | { kind: 'ready'; posts: SharedSocialPost[]; signedIn: boolean }
  | { kind: 'unavailable'; posts: []; signedIn: false };

export const sharedOperationInput = z.strictObject({ operation: z.enum(['reaction', 'report']) });
export const sharedReactionInput = z.strictObject({
  operationKey: z.string().regex(/^[0-9a-f]{64}$/), postId: id,
  choice: z.enum(['agree', 'disagree', 'clear']), expectedRevision: z.number().int().min(-1),
});
export const sharedReportInput = z.strictObject({
  operationKey: z.string().regex(/^[0-9a-f]{64}$/), postId: id,
  reason: z.enum(['abuse', 'privacy', 'spam', 'other']),
  detail: z.string().trim().max(500).refine((value) => !/[\p{Cc}]/u.test(value)),
});
export const sharedRemoveInput = z.strictObject({
  postId: id, expectedRevision: z.number().int().nonnegative(),
});
export const sharedRemoveMatchInput = z.strictObject({
  matchId: id, expectedRevision: z.number().int().nonnegative(),
});

function hashOperationKey(rawKey: string): string {
  return `sha256:${createHash('sha256').update(Buffer.from(rawKey, 'hex')).digest('hex')}`;
}

export async function readSharedSocialFeed(): Promise<SharedSocialFeed> {
  try {
    const principal = await readAccountPrincipal(await headers()).catch(() => ({ kind: 'missing' as const }));
    const token = principal.kind === 'account' ? principal.token : null;
    const rows = await openApplicationDatabase().$queryRaw<Array<{ feed: unknown }>>`
      SELECT public.social_shared_feed(${token}, 50) AS feed`;
    return { kind: 'ready', posts: sharedFeed.parse(rows[0]?.feed).posts, signedIn: principal.kind === 'account' };
  } catch {
    return { kind: 'unavailable', posts: [], signedIn: false };
  }
}

export async function issueSharedSocialOperation(database: PrismaClient, principal: AccountPrincipal,
  operation: z.infer<typeof sharedOperationInput>['operation']) {
  const operationKey = randomBytes(32).toString('hex');
  await database.$queryRaw`SELECT public.social_issue_operation(${principal.token}, ${hashOperationKey(operationKey)}, ${operation})::text`;
  return { operationKey };
}

export async function setSharedPostReaction(database: PrismaClient, principal: AccountPrincipal,
  input: z.infer<typeof sharedReactionInput>) {
  await database.$queryRaw`SELECT public.social_set_post_reaction(
    ${principal.token}, ${hashOperationKey(input.operationKey)}, ${input.postId}::uuid,
    ${input.choice}, ${input.expectedRevision})::text`;
}

export async function reportSharedPost(database: PrismaClient, principal: AccountPrincipal,
  input: z.infer<typeof sharedReportInput>) {
  await database.$queryRaw`SELECT public.social_report_post(
    ${principal.token}, ${hashOperationKey(input.operationKey)}, ${input.postId}::uuid,
    ${input.reason}, ${input.detail || null})::text`;
}

export async function removeSharedPost(database: PrismaClient, principal: AccountPrincipal,
  input: z.infer<typeof sharedRemoveInput>) {
  await database.$queryRaw`SELECT public.social_remove_post(
    ${principal.token}, ${input.postId}::uuid, ${input.expectedRevision})::text`;
}

export async function removeSharedMatch(database: PrismaClient, principal: AccountPrincipal,
  input: z.infer<typeof sharedRemoveMatchInput>) {
  await database.$queryRaw`SELECT public.social_remove_match(
    ${principal.token}, ${input.matchId}::uuid, ${input.expectedRevision})::text`;
}
