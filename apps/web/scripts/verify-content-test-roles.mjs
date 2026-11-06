import pg from 'pg';

const expectedRole = process.env.REFVIEW_EXPECTED_ROLE;
if (!['refview_migration_test', 'refview_app_test', 'refview_reviewer_test'].includes(expectedRole)) {
  throw new Error('REFVIEW_EXPECTED_ROLE must name an isolated content test role');
}
if (process.env.PGUSER !== expectedRole || !process.env.PGPASSWORD) {
  throw new Error('Matching PGUSER and PGPASSWORD are required');
}

const client = new pg.Client({
  host: '127.0.0.1', port: 55439, database: 'refview_test',
  user: process.env.PGUSER, password: process.env.PGPASSWORD,
});
try {
  await client.connect();
  const { rows } = await client.query(`
    SELECT current_database() AS database, current_user AS role,
      n.nspowner::regrole::text AS schema_owner,
      r.rolsuper AS superuser, r.rolcreaterole AS create_role,
      r.rolcreatedb AS create_database, r.rolbypassrls AS bypass_rls,
      has_schema_privilege(current_user, 'public', 'CREATE') AS schema_create,
      has_database_privilege(current_user, current_database(), 'CREATE') AS database_create,
      EXISTS (SELECT 1 FROM pg_auth_members m WHERE m.member = r.oid) AS inherits_role,
      EXISTS (SELECT 1 FROM pg_class c
        WHERE c.relnamespace = n.oid AND c.relkind = 'r'
          AND has_table_privilege(current_user, c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE')) AS table_mutation
    FROM pg_namespace n JOIN pg_roles r ON r.rolname = current_user
    WHERE n.nspname = 'public'
  `);
  const row = rows[0];
  if (!row || row.database !== 'refview_test' || row.role !== expectedRole ||
    row.schema_owner !== 'refview_migration_test' || row.superuser ||
    row.create_role || row.create_database || row.bypass_rls || row.database_create ||
    row.inherits_role || row.schema_create !== (expectedRole === 'refview_migration_test') ||
    (expectedRole !== 'refview_migration_test' && row.table_mutation)) {
    throw new Error('Unexpected isolated role authority');
  }
  process.stdout.write(`${expectedRole}: restricted login and schema ownership verified\n`);
} finally {
  await client.end();
}
