BEGIN;

-- Account tables are owned by the dedicated migration role. This additive
-- migration does not enable Google admission or anonymous-data attachment.
DO $account_preflight$
DECLARE v_migration text; v_app text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected account migration database'; END IF;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  IF session_user <> v_migration OR current_user <> v_migration
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles
      WHERE rolname = v_migration AND NOT rolsuper AND NOT rolinherit
        AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication
        AND NOT rolbypassrls)
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles
      WHERE rolname = v_app AND NOT rolsuper AND NOT rolinherit
        AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication
        AND NOT rolbypassrls)
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles
      WHERE rolname = v_reviewer AND NOT rolsuper AND NOT rolinherit
        AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication
        AND NOT rolbypassrls)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m
      JOIN pg_catalog.pg_roles r ON r.oid = m.member OR r.oid = m.roleid
      WHERE r.rolname IN (v_migration, v_app, v_reviewer))
    OR pg_catalog.has_schema_privilege(v_app, 'public', 'CREATE')
    OR pg_catalog.has_schema_privilege(v_reviewer, 'public', 'CREATE')
    OR (SELECT nspowner FROM pg_catalog.pg_namespace WHERE nspname = 'public')
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR (SELECT relowner FROM pg_catalog.pg_class
      WHERE oid = 'public."AnonymousSession"'::pg_catalog.regclass)
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
  THEN RAISE EXCEPTION 'account migration role boundary incomplete'; END IF;
END;
$account_preflight$;

CREATE TABLE public."user" (
  "id" text NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE UNIQUE INDEX "user_email_key" ON public."user" ("email");

CREATE TABLE public."session" (
  "id" text NOT NULL PRIMARY KEY,
  "expiresAt" timestamp(3) NOT NULL,
  "token" text NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL,
  CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "session_token_key" ON public."session" ("token");
CREATE INDEX "session_userId_idx" ON public."session" ("userId");

CREATE TABLE public."account" (
  "id" text NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp(3),
  "refreshTokenExpiresAt" timestamp(3),
  "scope" text,
  "password" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "account_google_only_check" CHECK ("providerId" = 'google' AND "password" IS NULL),
  CONSTRAINT "account_no_id_token_check" CHECK ("idToken" IS NULL)
);
CREATE INDEX "account_userId_idx" ON public."account" ("userId");
CREATE UNIQUE INDEX "account_provider_subject_key" ON public."account" ("providerId", "accountId");

CREATE TABLE public."verification" (
  "id" text NOT NULL PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp(3) NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE INDEX "verification_identifier_idx" ON public."verification" ("identifier");

CREATE TABLE public."AccountOwnerBinding" (
  "ownerId" text NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL,
  "isPrimary" boolean NOT NULL DEFAULT false,
  "attachedAt" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountOwnerBinding_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES public."AnonymousSession"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "AccountOwnerBinding_accountId_fkey" FOREIGN KEY ("accountId")
    REFERENCES public."user"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX "AccountOwnerBinding_accountId_idx" ON public."AccountOwnerBinding" ("accountId");
CREATE UNIQUE INDEX "AccountOwnerBinding_one_primary_key"
  ON public."AccountOwnerBinding" ("accountId") WHERE "isPrimary";

CREATE TABLE public."AccountOwnerAttachmentReceipt" (
  "ownerId" text NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL,
  "sourceTokenHash" text NOT NULL,
  "expiresAt" timestamptz(3) NOT NULL,
  CONSTRAINT "AccountOwnerAttachmentReceipt_hash_check"
    CHECK ("sourceTokenHash" ~ '^sha256:[0-9a-f]{64}$'),
  CONSTRAINT "AccountOwnerAttachmentReceipt_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES public."AnonymousSession"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "AccountOwnerAttachmentReceipt_accountId_fkey" FOREIGN KEY ("accountId")
    REFERENCES public."user"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "AccountOwnerAttachmentReceipt_sourceTokenHash_key"
  ON public."AccountOwnerAttachmentReceipt" ("sourceTokenHash");
CREATE INDEX "AccountOwnerAttachmentReceipt_accountId_expiresAt_idx"
  ON public."AccountOwnerAttachmentReceipt" ("accountId", "expiresAt");

REVOKE ALL ON TABLE public."user", public."session", public."account",
  public."verification", public."AccountOwnerBinding",
  public."AccountOwnerAttachmentReceipt" FROM PUBLIC;
DO $account_grants$
DECLARE v_app text; v_reviewer text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('REVOKE ALL ON TABLE public."user", public."session", public."account", public."verification", public."AccountOwnerBinding", public."AccountOwnerAttachmentReceipt" FROM %I, %I', v_app, v_reviewer);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE ON TABLE public."user", public."account" TO %I', v_app);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."session", public."verification" TO %I', v_app);
END;
$account_grants$;

COMMIT;
