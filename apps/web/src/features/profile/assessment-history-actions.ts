'use server';

import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { readAccountPrincipal } from '@/lib/auth/account-principal';
import { openApplicationDatabase, validateApplicationRuntime } from '@/lib/db/application-runtime';
import { accountAssessmentHistoryV1, assessmentHistoryV1 } from '../assessments/owner-service-v1';

const requestSchema = z.strictObject({
  limit: z.number().int().min(1).max(50),
  cursorAttemptId: z.uuid().optional(),
});

export async function readProfileAssessmentHistory(payload: unknown) {
  const request = requestSchema.parse(payload);
  const requestHeaders = await headers();
  if (requestHeaders.get('origin') !== validateApplicationRuntime(process.env).origin) {
    throw new Error('Application action origin is unavailable');
  }
  const principal = await readAccountPrincipal(requestHeaders);
  const database = openApplicationDatabase();
  return principal.kind === 'account'
    ? accountAssessmentHistoryV1(database, principal, request)
    : assessmentHistoryV1(database, await cookies(), request);
}
