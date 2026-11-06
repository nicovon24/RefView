import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Prisma validates and generates without a database connection. Migration
  // commands require this separate credential and never fall back to the app.
  datasource: process.env.MIGRATION_DATABASE_URL
    ? { url: process.env.MIGRATION_DATABASE_URL }
    : undefined,
});
