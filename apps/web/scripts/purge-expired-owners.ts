import 'dotenv/config';
import { purgeExpiredApplicationOwners } from '../src/lib/auth/application-owner-retention';
import { openApplicationDatabase, validateApplicationRuntime } from '../src/lib/db/application-runtime';

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--limit' || !/^(?:[1-9]|[1-9][0-9]|100)$/.test(args[1] ?? '')) {
  throw new Error('Usage: pnpm --filter @refview/web owners:purge --limit <1-100>');
}

validateApplicationRuntime(process.env);
const database = openApplicationDatabase();
try {
  const result = await purgeExpiredApplicationOwners(database, Number(args[1]));
  process.stdout.write(`${JSON.stringify(result)}\n`);
} finally {
  await database.$disconnect();
}
