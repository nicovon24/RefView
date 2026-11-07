'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { readAccountPrincipal } from '@/lib/auth/account-principal';
import { openApplicationDatabase, validateApplicationRuntime } from '@/lib/db/application-runtime';
import { finalizeAccountAssessmentV1, finalizeAssessmentV1, startAccountAssessmentV1,
  startAssessmentV1 } from './owner-service-v1';

const localeSchema = z.enum(['es', 'en']);
const itemSchema = z.string().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const uuidSchema = z.uuid();
const versionSchema = z.number().int().positive().safe();

async function authorize() {
  const runtime = validateApplicationRuntime(process.env);
  const requestHeaders = await headers();
  if (requestHeaders.get('origin') !== runtime.origin) {
    throw new Error('Application action origin is unavailable');
  }
  return { database: openApplicationDatabase(), principal: await readAccountPrincipal(requestHeaders) };
}

function exactForm(form: FormData, keys: readonly string[]) {
  // React includes action transport fields in progressive-enhancement form posts.
  const actual = [...form.keys()].filter((key) => !key.startsWith('$ACTION_'));
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))
    || keys.some((key) => form.getAll(key).length !== 1)) throw new Error('Invalid assessment form');
  const entries = Object.fromEntries(keys.map((key) => [key, form.get(key)]));
  if (Object.values(entries).some((value) => typeof value !== 'string')) {
    throw new Error('Invalid assessment form');
  }
  return entries as Record<string, string>;
}

export async function startAssessmentAction(localeValue: string, itemIdValue: string,
  versionValue: number, form: FormData) {
  const { database, principal } = await authorize();
  exactForm(form, []);
  const locale = localeSchema.parse(localeValue);
  const itemId = itemSchema.parse(itemIdValue);
  const version = versionSchema.parse(versionValue);
  const input = { locale, itemId, version };
  const attempt = principal.kind === 'account'
    ? await startAccountAssessmentV1(database, principal, input)
    : await startAssessmentV1(database, await cookies(), input);
  redirect(`/${locale}/assessments/attempt/${attempt.attemptId}`);
}

export async function finalizeAssessmentAction(localeValue: string, attemptIdValue: string,
  kindValue: string, form: FormData) {
  const { database, principal } = await authorize();
  const locale = localeSchema.parse(localeValue);
  const attemptId = uuidSchema.parse(attemptIdValue);
  const kind = z.enum(['ruleQuestion', 'restartDiscipline', 'authoredIncidentAnalysis']).parse(kindValue);
  const keys = kind === 'ruleQuestion' ? ['idempotencyKey', 'optionId']
    : kind === 'restartDiscipline' ? ['idempotencyKey', 'restart', 'discipline', 'offenderHandle']
      : ['idempotencyKey', 'restart', 'discipline', 'offenderHandle', 'reasoning'];
  const fields = exactForm(form, keys);
  const idempotencyKey = uuidSchema.parse(fields.idempotencyKey);
  const answer = kind === 'ruleQuestion'
    ? { kind, optionId: fields.optionId }
    : { kind, stopPlay: fields.restart !== 'playOn', restart: fields.restart,
      discipline: fields.discipline, offenderHandle: fields.offenderHandle || null,
      ...(kind === 'authoredIncidentAnalysis' ? { reasoning: fields.reasoning } : {}) };
  const input = { attemptId, idempotencyKey, answer, locale };
  if (principal.kind === 'account') await finalizeAccountAssessmentV1(database, principal, input);
  else await finalizeAssessmentV1(database, await cookies(), input);
  redirect(`/${locale}/assessments/attempt/${attemptId}`);
}
