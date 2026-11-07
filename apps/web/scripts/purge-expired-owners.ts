import 'dotenv/config';
import { purgeExpiredApplicationOwners } from '../src/lib/auth/application-owner-retention';
import { purgeExpiredAccountVerifications } from '../src/lib/auth/account-verification-retention';
import { openApplicationDatabase, validateApplicationRuntime } from '../src/lib/db/application-runtime';

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--limit' || !/^(?:[1-9]|[1-9][0-9]|100)$/.test(args[1] ?? '')) {
  throw new Error('Usage: pnpm --filter @refview/web owners:purge --limit <1-100>');
}

validateApplicationRuntime(process.env);
const database = openApplicationDatabase();
try {
  const limit = Number(args[1]);
  const owners = await purgeExpiredApplicationOwners(database, limit);
  const verifications = await purgeExpiredAccountVerifications(database, limit);
  process.stdout.write(`${JSON.stringify({ ...owners, ...verifications })}\n`);
} finally {
  await database.$disconnect();
}
