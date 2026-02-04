


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "test_schema";


ALTER SCHEMA "test_schema" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE OR REPLACE FUNCTION "public"."calculate_next_retry"("attempt_count" integer, "last_error_type" "text") RETURNS timestamp with time zone
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- If rate limited, use exponential backoff (1hr, 2hr, 4hr, 8hr, 16hr max)
  IF last_error_type = 'rate_limit' THEN
    RETURN NOW() + (INTERVAL '1 hour' * POWER(2, LEAST(attempt_count, 4)));
  END IF;

  -- Otherwise, fixed 1-hour retry interval
  RETURN NOW() + INTERVAL '1 hour';
END;
$$;


ALTER FUNCTION "public"."calculate_next_retry"("attempt_count" integer, "last_error_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_next_retry"("attempt_count" integer, "last_error_type" "text") IS 'Calculate next retry timestamp based on attempt count and error type. Rate limit errors use exponential backoff, others use fixed 1-hour interval.';



CREATE OR REPLACE FUNCTION "public"."can_create_funnel"("p_user_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_is_admin BOOLEAN;
v_max_funnels INTEGER;
v_current_count INTEGER;
BEGIN
SELECT is_admin,
    max_funnels,
    current_funnel_count INTO v_is_admin,
    v_max_funnels,
    v_current_count
FROM public.user_profiles
WHERE id = p_user_id;
IF v_is_admin = true THEN RETURN true;
END IF;
RETURN v_current_count < v_max_funnels;
END;
$$;


ALTER FUNCTION "public"."can_create_funnel"("p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_funnel_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN
UPDATE public.user_profiles
SET current_funnel_count = GREATEST(0, current_funnel_count - 1)
WHERE id = OLD.user_id;
RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."decrement_funnel_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_agency_token"("p_user_id" "text") RETURNS TABLE("access_token" "text", "refresh_token" "text", "expires_at" timestamp with time zone, "company_id" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ BEGIN RETURN QUERY
SELECT t.access_token,
    t.refresh_token,
    t.expires_at,
    t.company_id
FROM ghl_tokens t
WHERE t.user_id = p_user_id
    AND t.user_type = 'Company'
    AND t.expires_at > now()
ORDER BY t.created_at DESC
LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_active_agency_token"("p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ghl_retry_stats"() RETURNS TABLE("status" "text", "count" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ghl_sync_status, 'not_synced')::TEXT AS status,
    COUNT(*)::BIGINT AS count
  FROM public.user_profiles
  WHERE deleted_at IS NULL
  GROUP BY ghl_sync_status;
END;
$$;


ALTER FUNCTION "public"."get_ghl_retry_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_ghl_retry_stats"() IS 'Get count of users by GHL sync status for admin dashboard statistics';



CREATE OR REPLACE FUNCTION "public"."get_location_token"("p_user_id" "text", "p_location_id" "text") RETURNS TABLE("access_token" "text", "refresh_token" "text", "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ BEGIN RETURN QUERY
SELECT t.access_token,
    t.refresh_token,
    t.expires_at
FROM ghl_tokens t
WHERE t.user_id = p_user_id
    AND t.user_type = 'Location'
    AND t.location_id = p_location_id
    AND t.expires_at > now()
ORDER BY t.created_at DESC
LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_location_token"("p_user_id" "text", "p_location_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_active_subaccount"("p_user_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM ghl_subaccounts
        WHERE user_id = p_user_id
            AND is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."has_active_subaccount"("p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_funnel_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN
UPDATE public.user_profiles
SET current_funnel_count = current_funnel_count + 1
WHERE id = NEW.user_id;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_funnel_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = current_setting('request.jwt.claims', true)::json->>'sub'
            AND is_admin = true
    );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_columns_for_table"("p_schema" "text", "p_table" "text", "p_mode" "text" DEFAULT 'select'::"text") RETURNS TABLE("column_name" "text", "data_type" "text", "is_primary_key" boolean)
    LANGUAGE "sql" STABLE
    AS $$
    SELECT
        c.column_name,
        c.data_type,
        CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN true ELSE false END AS is_primary_key
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu
        ON c.table_name = kcu.table_name
        AND c.column_name = kcu.column_name
        AND c.table_schema = kcu.table_schema
    LEFT JOIN information_schema.table_constraints tc
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
        AND tc.constraint_type = 'PRIMARY KEY'
    WHERE c.table_schema = p_schema
      AND c.table_name = p_table
      AND (
            p_mode <> 'update'
            OR c.column_name NOT IN ('id', 'created_at')
          )
    ORDER BY c.ordinal_position;
$$;


ALTER FUNCTION "public"."list_columns_for_table"("p_schema" "text", "p_table" "text", "p_mode" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_tables_for_schema"("p_schema" "text") RETURNS TABLE("table_name" "text")
    LANGUAGE "sql" STABLE
    AS $$
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = p_schema
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
$$;


ALTER FUNCTION "public"."list_tables_for_schema"("p_schema" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_user_schemas"() RETURNS TABLE("schema_name" "text")
    LANGUAGE "sql" STABLE
    AS $$
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_owner NOT IN ('supabase_admin', 'pgbouncer')
      AND schema_name <> 'extensions'
    ORDER BY schema_name;
$$;


ALTER FUNCTION "public"."list_user_schemas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ghl_subaccount_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "request_payload" "jsonb",
    "ghl_location_id" "text",
    "response_payload" "jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "retry_attempt" integer DEFAULT 0,
    "is_retry" boolean DEFAULT false,
    "error_type" "text",
    "triggered_by" "text" DEFAULT 'webhook'::"text",
    "label" "text",
    "value" "text",
    "location_id" "text",
    "company_id" "text",
    "location_name" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "country" "text",
    "postal_code" "text",
    "website" "text",
    "timezone" "text",
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "logo_url" "text",
    "business_name" "text",
    "business_address" "text",
    "business_city" "text",
    "business_state" "text",
    "business_country" "text",
    "business_postal_code" "text",
    "business_timezone" "text",
    "social_facebook_url" "text",
    "social_google_plus" "text",
    "social_linked_in" "text",
    "social_foursquare" "text",
    "social_twitter" "text",
    "social_yelp" "text",
    "social_instagram" "text",
    "social_youtube" "text",
    "social_pinterest" "text",
    "social_blog_rss" "text",
    "social_google_places_id" "text",
    "date_added" timestamp with time zone,
    "domain" "text",
    "currency" "text",
    "default_email_service" "text",
    "snapshot_id" "text",
    "trace_id" "text",
    CONSTRAINT "ghl_subaccount_logs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."ghl_subaccount_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."ghl_subaccount_logs" IS 'Logs of GHL sub-account creation events, including full location details';



COMMENT ON COLUMN "public"."ghl_subaccount_logs"."retry_attempt" IS 'Which retry attempt this was (0 = initial, 1-5 = retry)';



COMMENT ON COLUMN "public"."ghl_subaccount_logs"."is_retry" IS 'True if this was a retry attempt (not initial creation)';



COMMENT ON COLUMN "public"."ghl_subaccount_logs"."error_type" IS 'Classification of error: retryable, permanent, rate_limit';



COMMENT ON COLUMN "public"."ghl_subaccount_logs"."triggered_by" IS 'Source of creation attempt: webhook, manual, cron';



COMMENT ON COLUMN "public"."ghl_subaccount_logs"."location_id" IS 'The GHL Location ID (Id)';



COMMENT ON COLUMN "public"."ghl_subaccount_logs"."business_name" IS 'Business Name';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "is_admin" boolean DEFAULT false,
    "subscription_tier" "text" DEFAULT 'starter'::"text",
    "tier_expires_at" timestamp with time zone,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "max_funnels" integer DEFAULT 1,
    "current_funnel_count" integer DEFAULT 0,
    "last_generation_at" timestamp with time zone,
    "total_generations" integer DEFAULT 0,
    "ghl_location_id" "text",
    "ghl_location_name" "text",
    "ghl_location_created_at" timestamp with time zone,
    "ghl_sync_status" "text" DEFAULT 'not_synced'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "generation_count" integer DEFAULT 0,
    "ghl_retry_count" integer DEFAULT 0,
    "ghl_last_retry_at" timestamp with time zone,
    "ghl_next_retry_at" timestamp with time zone,
    "ghl_permanently_failed" boolean DEFAULT false,
    "license_accepted_at" timestamp with time zone,
    "first_name" "text",
    "last_name" "text",
    "business_name" "text",
    "phone" "text",
    "country_code" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "timezone" "text",
    "ghl_setup_triggered_at" timestamp with time zone,
    CONSTRAINT "user_profiles_ghl_sync_status_check" CHECK (("ghl_sync_status" = ANY (ARRAY['not_synced'::"text", 'pending'::"text", 'synced'::"text", 'failed'::"text", 'permanently_failed'::"text"]))),
    CONSTRAINT "user_profiles_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['starter'::"text", 'growth'::"text", 'scale'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_profiles"."ghl_retry_count" IS 'Number of times sub-account creation has been retried (max 5)';



COMMENT ON COLUMN "public"."user_profiles"."ghl_last_retry_at" IS 'Timestamp of last retry attempt';



COMMENT ON COLUMN "public"."user_profiles"."ghl_next_retry_at" IS 'Scheduled time for next retry attempt';



COMMENT ON COLUMN "public"."user_profiles"."ghl_permanently_failed" IS 'True if max retries exceeded or permanent error encountered';



COMMENT ON COLUMN "public"."user_profiles"."license_accepted_at" IS 'Timestamp when user accepted the TedOS EULA. NULL means not accepted.';



COMMENT ON COLUMN "public"."user_profiles"."first_name" IS 'User first name';



COMMENT ON COLUMN "public"."user_profiles"."last_name" IS 'User last name';



COMMENT ON COLUMN "public"."user_profiles"."business_name" IS 'User business/company name';



COMMENT ON COLUMN "public"."user_profiles"."phone" IS 'Phone number (without country code)';



COMMENT ON COLUMN "public"."user_profiles"."country_code" IS 'Phone country code (e.g., +1, +91)';



COMMENT ON COLUMN "public"."user_profiles"."address" IS 'Street address';



COMMENT ON COLUMN "public"."user_profiles"."city" IS 'City';



COMMENT ON COLUMN "public"."user_profiles"."state" IS 'State/Province';



COMMENT ON COLUMN "public"."user_profiles"."postal_code" IS 'Postal/ZIP code';



COMMENT ON COLUMN "public"."user_profiles"."country" IS 'Country';



COMMENT ON COLUMN "public"."user_profiles"."timezone" IS 'User timezone (e.g., America/New_York)';



COMMENT ON COLUMN "public"."user_profiles"."ghl_setup_triggered_at" IS 'Timestamp when Pabbly GHL setup automation was triggered';



CREATE OR REPLACE VIEW "public"."admin_ghl_accounts_summary" AS
 SELECT "up"."id" AS "user_id",
    "up"."email",
    "up"."full_name",
    "up"."ghl_location_id",
    "up"."ghl_location_name",
    "up"."ghl_sync_status",
    "up"."ghl_retry_count",
    "up"."ghl_last_retry_at",
    "up"."ghl_next_retry_at",
    "up"."ghl_permanently_failed",
    "up"."ghl_location_created_at",
    "up"."created_at" AS "user_created_at",
    "count"("gsl"."id") AS "total_attempts",
    "max"("gsl"."created_at") AS "last_attempt_at"
   FROM ("public"."user_profiles" "up"
     LEFT JOIN "public"."ghl_subaccount_logs" "gsl" ON (("gsl"."user_id" = "up"."id")))
  GROUP BY "up"."id", "up"."email", "up"."full_name", "up"."ghl_location_id", "up"."ghl_location_name", "up"."ghl_sync_status", "up"."ghl_retry_count", "up"."ghl_last_retry_at", "up"."ghl_next_retry_at", "up"."ghl_permanently_failed", "up"."ghl_location_created_at", "up"."created_at";


ALTER VIEW "public"."admin_ghl_accounts_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."admin_ghl_accounts_summary" IS 'Aggregated view of all user GHL accounts with attempt counts for admin dashboard';



CREATE TABLE IF NOT EXISTS "public"."admin_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "description" "text",
    "updated_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_settings" IS 'Global admin settings for TedOS platform';



CREATE TABLE IF NOT EXISTS "public"."feedback_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "funnel_id" "uuid",
    "section_id" "text" NOT NULL,
    "session_id" "uuid",
    "user_message" "text",
    "ai_response" "text",
    "applied_changes" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "session_id" "uuid",
    "content_type" "text" NOT NULL,
    "content_data" "jsonb" NOT NULL,
    "needs_review" boolean DEFAULT false,
    "reviewed" boolean DEFAULT false,
    "reviewed_by" "text",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."generated_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_css" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "session_id" "uuid",
    "css_code" "text" NOT NULL,
    "color_scheme" "jsonb" NOT NULL,
    "sections_covered" "text"[],
    "is_applied" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."generated_css" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "funnel_id" "uuid",
    "session_id" "uuid",
    "image_type" "text" NOT NULL,
    "image_purpose" "text",
    "prompt_used" "text",
    "supabase_path" "text",
    "public_url" "text" NOT NULL,
    "cloudinary_public_id" "text",
    "width" integer,
    "height" integer,
    "format" "text" DEFAULT 'png'::"text",
    "file_size" integer,
    "status" "text" DEFAULT 'generating'::"text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."generated_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generation_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid",
    "user_id" "text" NOT NULL,
    "job_type" "text" NOT NULL,
    "sections_to_generate" "text"[] DEFAULT ARRAY[]::"text"[],
    "status" "text" DEFAULT 'queued'::"text",
    "progress_percentage" integer DEFAULT 0,
    "current_section" "text",
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "generation_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."generation_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ghl_agency_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agency_id" "text" NOT NULL,
    "agency_name" "text",
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "last_used_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ghl_agency_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ghl_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "location_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "location_name" "text",
    "is_active" boolean DEFAULT true,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ghl_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ghl_custom_value_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "funnel_id" "uuid",
    "session_id" "uuid",
    "custom_values" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_pushed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ghl_custom_value_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ghl_oauth_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "status" "text" NOT NULL,
    "request_data" "jsonb",
    "response_data" "jsonb",
    "error_message" "text",
    "error_code" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ghl_oauth_logs_operation_check" CHECK (("operation" = ANY (ARRAY['authorize'::"text", 'token_exchange'::"text", 'token_refresh'::"text", 'create_subaccount'::"text", 'import_snapshot'::"text", 'update_custom_values'::"text"]))),
    CONSTRAINT "ghl_oauth_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'failure'::"text"])))
);


ALTER TABLE "public"."ghl_oauth_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ghl_push_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "section" "text" NOT NULL,
    "values_pushed" integer DEFAULT 0 NOT NULL,
    "success" boolean DEFAULT true NOT NULL,
    "error" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ghl_push_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ghl_push_operations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "funnel_id" "uuid",
    "session_id" "uuid",
    "ghl_credential_id" "uuid",
    "operation_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "total_items" integer DEFAULT 0,
    "completed_items" integer DEFAULT 0,
    "failed_items" integer DEFAULT 0,
    "custom_values_pushed" "jsonb" DEFAULT '{}'::"jsonb",
    "errors" "jsonb" DEFAULT '[]'::"jsonb",
    "warnings" "jsonb" DEFAULT '[]'::"jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "duration_ms" integer
);


ALTER TABLE "public"."ghl_push_operations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ghl_subaccounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "location_id" "text" NOT NULL,
    "location_name" "text",
    "agency_id" "text" NOT NULL,
    "snapshot_id" "text",
    "snapshot_imported" boolean DEFAULT false,
    "snapshot_imported_at" timestamp with time zone,
    "snapshot_import_status" "text",
    "snapshot_import_error" "text",
    "is_active" boolean DEFAULT true,
    "custom_values_synced" boolean DEFAULT false,
    "last_sync_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ghl_user_id" "text",
    "ghl_user_created" boolean DEFAULT false,
    "ghl_user_created_at" timestamp with time zone,
    "ghl_user_email" "text",
    "ghl_user_role" "text" DEFAULT 'admin'::"text",
    "ghl_user_creation_error" "text",
    "ghl_user_invited" boolean DEFAULT false,
    "ghl_user_invite_sent_at" timestamp with time zone,
    "ghl_user_last_retry_at" timestamp with time zone,
    CONSTRAINT "ghl_subaccounts_snapshot_import_status_check" CHECK (("snapshot_import_status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."ghl_subaccounts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."ghl_subaccounts"."ghl_user_id" IS 'GHL User ID created for this TedOS user';



COMMENT ON COLUMN "public"."ghl_subaccounts"."ghl_user_created" IS 'Whether GHL User account has been created';



COMMENT ON COLUMN "public"."ghl_subaccounts"."ghl_user_email" IS 'Email used for GHL User account';



COMMENT ON COLUMN "public"."ghl_subaccounts"."ghl_user_role" IS 'Role assigned to GHL User (default: admin)';



COMMENT ON COLUMN "public"."ghl_subaccounts"."ghl_user_creation_error" IS 'Error message if user creation failed';



COMMENT ON COLUMN "public"."ghl_subaccounts"."ghl_user_invited" IS 'Whether welcome email was sent to user';



CREATE TABLE IF NOT EXISTS "public"."ghl_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "token_type" "text" DEFAULT 'Bearer'::"text",
    "user_type" "text" NOT NULL,
    "scope" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "company_id" "text",
    "location_id" "text",
    "is_bulk_installation" boolean DEFAULT false,
    "approved_locations" "text"[],
    "plan_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_used_at" timestamp with time zone,
    CONSTRAINT "ghl_tokens_user_type_check" CHECK (("user_type" = ANY (ARRAY['Company'::"text", 'Location'::"text"])))
);


ALTER TABLE "public"."ghl_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intake_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "slide_id" integer NOT NULL,
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."intake_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaire_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "question_id" integer NOT NULL,
    "step_number" integer NOT NULL,
    "answer_text" "text",
    "answer_selection" "text",
    "answer_selections" "text"[],
    "answer_json" "jsonb",
    "answered_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."questionnaire_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions_master" (
    "id" integer NOT NULL,
    "step_number" integer NOT NULL,
    "category" "text" NOT NULL,
    "question_text" "text" NOT NULL,
    "input_type" "text" DEFAULT 'textarea'::"text" NOT NULL,
    "input_options" "jsonb",
    "validation_rules" "jsonb",
    "placeholder_text" "text",
    "help_text" "text",
    "display_order" integer NOT NULL,
    "used_in_vault_sections" "text"[] DEFAULT ARRAY[]::"text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "field_name" "text" NOT NULL,
    "question_title" "text" NOT NULL,
    "question_subtitle" "text",
    "phase" "text"
);


ALTER TABLE "public"."questions_master" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rag_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "funnel_id" "uuid",
    "content_type" character varying(100) NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "embedding" "public"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rag_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "session_name" "text" NOT NULL,
    "business_name" "text",
    "current_step" integer DEFAULT 1,
    "completed_steps" integer[] DEFAULT '{}'::integer[],
    "is_complete" boolean DEFAULT false,
    "status" "text" DEFAULT 'active'::"text",
    "answers" "jsonb" DEFAULT '{}'::"jsonb",
    "generated_content" "jsonb" DEFAULT '{}'::"jsonb",
    "results_data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slide_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "slide_id" integer NOT NULL,
    "ai_output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "approved" boolean DEFAULT false,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."slide_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ted_knowledge_base" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1536),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "transcript_id" "uuid",
    "content_category" "text",
    "importance_score" double precision DEFAULT 1.0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ted_knowledge_base" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transcript_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "source_type" "text" NOT NULL,
    "source_url" "text",
    "raw_transcript" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "processing_error" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "content_types" "text"[] DEFAULT ARRAY[]::"text"[],
    "total_chunks" integer DEFAULT 0,
    "processed_chunks" integer DEFAULT 0,
    "uploaded_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transcript_metadata_source_type_check" CHECK (("source_type" = ANY (ARRAY['youtube'::"text", 'manual'::"text", 'document'::"text", 'audio'::"text"]))),
    CONSTRAINT "transcript_metadata_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."transcript_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_funnels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "funnel_name" "text" NOT NULL,
    "funnel_description" "text",
    "wizard_answers" "jsonb" DEFAULT '{}'::"jsonb",
    "questionnaire_completed" boolean DEFAULT false,
    "questionnaire_completed_at" timestamp with time zone,
    "current_step" integer DEFAULT 1,
    "completed_steps" integer[] DEFAULT ARRAY[]::integer[],
    "vault_generated" boolean DEFAULT false,
    "vault_generated_at" timestamp with time zone,
    "vault_generation_status" "text" DEFAULT 'not_started'::"text",
    "phase1_approved" boolean DEFAULT false,
    "phase1_approved_at" timestamp with time zone,
    "phase2_unlocked" boolean DEFAULT false,
    "phase2_unlocked_at" timestamp with time zone,
    "regeneration_counts" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "selected_funnel_type" "text",
    "funnel_choice_made_at" timestamp with time zone,
    CONSTRAINT "user_funnels_vault_generation_status_check" CHECK (("vault_generation_status" = ANY (ARRAY['not_started'::"text", 'generating'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."user_funnels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vault_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "section_id" "text" NOT NULL,
    "section_title" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "prompt_used" "text",
    "phase" integer DEFAULT 1,
    "numeric_key" integer,
    "status" "text" DEFAULT 'generated'::"text",
    "is_locked" boolean DEFAULT false,
    "is_current_version" boolean DEFAULT true,
    "version" integer DEFAULT 1,
    "parent_version_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vault_content_status_check" CHECK (("status" = ANY (ARRAY['generating'::"text", 'generated'::"text", 'approved'::"text", 'needs_revision'::"text"])))
);


ALTER TABLE "public"."vault_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vault_content_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "section_id" "text" NOT NULL,
    "field_id" "text" NOT NULL,
    "field_label" "text" NOT NULL,
    "field_value" "jsonb" NOT NULL,
    "field_type" "text" NOT NULL,
    "field_metadata" "jsonb",
    "is_custom" boolean DEFAULT false,
    "is_approved" boolean DEFAULT false,
    "approved_at" timestamp with time zone,
    "ai_feedback" "jsonb",
    "display_order" integer DEFAULT 0,
    "is_current_version" boolean DEFAULT true,
    "version" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vault_content_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "test_schema"."pabbly_users" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text"
);


ALTER TABLE "test_schema"."pabbly_users" OWNER TO "postgres";


ALTER TABLE "test_schema"."pabbly_users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "test_schema"."pabbly_users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."feedback_logs"
    ADD CONSTRAINT "feedback_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_content"
    ADD CONSTRAINT "generated_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_css"
    ADD CONSTRAINT "generated_css_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generation_jobs"
    ADD CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ghl_agency_credentials"
    ADD CONSTRAINT "ghl_agency_credentials_agency_id_key" UNIQUE ("agency_id");



ALTER TABLE ONLY "public"."ghl_agency_credentials"
    ADD CONSTRAINT "ghl_agency_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ghl_credentials"
    ADD CONSTRAINT "ghl_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ghl_credentials"
    ADD CONSTRAINT "ghl_credentials_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."ghl_custom_value_mappings"
    ADD CONSTRAINT "ghl_custom_value_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ghl_custom_value_mappings"
    ADD CONSTRAINT "ghl_custom_value_mappings_user_id_funnel_id_key" UNIQUE ("user_id", "funnel_id");



ALTER TABLE ONLY "public"."ghl_oauth_logs"
    ADD CONSTRAINT "ghl_oauth_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ghl_push_logs"
    ADD CONSTRAINT "ghl_push_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ghl_push_operations"
    ADD CONSTRAINT "ghl_push_operations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ghl_subaccount_logs"
    ADD CONSTRAINT "ghl_subaccount_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ghl_subaccounts"
    ADD CONSTRAINT "ghl_subaccounts_location_id_key" UNIQUE ("location_id");



ALTER TABLE ONLY "public"."ghl_subaccounts"
    ADD CONSTRAINT "ghl_subaccounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ghl_tokens"
    ADD CONSTRAINT "ghl_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ghl_tokens"
    ADD CONSTRAINT "ghl_tokens_user_id_user_type_company_id_location_id_key" UNIQUE ("user_id", "user_type", "company_id", "location_id");



ALTER TABLE ONLY "public"."intake_answers"
    ADD CONSTRAINT "intake_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions_master"
    ADD CONSTRAINT "questions_master_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions_master"
    ADD CONSTRAINT "questions_master_step_number_key" UNIQUE ("step_number");



ALTER TABLE ONLY "public"."rag_data"
    ADD CONSTRAINT "rag_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_sessions"
    ADD CONSTRAINT "saved_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slide_results"
    ADD CONSTRAINT "slide_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ted_knowledge_base"
    ADD CONSTRAINT "ted_knowledge_base_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transcript_metadata"
    ADD CONSTRAINT "transcript_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "unique_funnel_question" UNIQUE ("funnel_id", "question_id");



ALTER TABLE ONLY "public"."user_funnels"
    ADD CONSTRAINT "user_funnels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vault_content_fields"
    ADD CONSTRAINT "vault_content_fields_funnel_id_section_id_field_id_version_key" UNIQUE ("funnel_id", "section_id", "field_id", "version");



ALTER TABLE ONLY "public"."vault_content_fields"
    ADD CONSTRAINT "vault_content_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vault_content"
    ADD CONSTRAINT "vault_content_funnel_id_section_id_version_key" UNIQUE ("funnel_id", "section_id", "version");



ALTER TABLE ONLY "public"."vault_content"
    ADD CONSTRAINT "vault_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "test_schema"."pabbly_users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_feedback_logs_section" ON "public"."feedback_logs" USING "btree" ("section_id");



CREATE INDEX "idx_feedback_logs_user" ON "public"."feedback_logs" USING "btree" ("user_id");



CREATE INDEX "idx_generation_jobs_created" ON "public"."generation_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_generation_jobs_funnel" ON "public"."generation_jobs" USING "btree" ("funnel_id");



CREATE INDEX "idx_generation_jobs_status" ON "public"."generation_jobs" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_ghl_agency_active" ON "public"."ghl_agency_credentials" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_ghl_oauth_logs_created" ON "public"."ghl_oauth_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ghl_oauth_logs_operation" ON "public"."ghl_oauth_logs" USING "btree" ("operation");



CREATE INDEX "idx_ghl_oauth_logs_status" ON "public"."ghl_oauth_logs" USING "btree" ("status");



CREATE INDEX "idx_ghl_oauth_logs_user" ON "public"."ghl_oauth_logs" USING "btree" ("user_id");



CREATE INDEX "idx_ghl_push_logs_created" ON "public"."ghl_push_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ghl_push_logs_user_funnel" ON "public"."ghl_push_logs" USING "btree" ("user_id", "funnel_id");



CREATE INDEX "idx_ghl_subaccount_logs_user" ON "public"."ghl_subaccount_logs" USING "btree" ("user_id");



CREATE INDEX "idx_ghl_subaccounts_active" ON "public"."ghl_subaccounts" USING "btree" ("is_active");



CREATE INDEX "idx_ghl_subaccounts_agency" ON "public"."ghl_subaccounts" USING "btree" ("agency_id");



CREATE INDEX "idx_ghl_subaccounts_ghl_user_created" ON "public"."ghl_subaccounts" USING "btree" ("ghl_user_created");



CREATE INDEX "idx_ghl_subaccounts_ghl_user_id" ON "public"."ghl_subaccounts" USING "btree" ("ghl_user_id");



CREATE INDEX "idx_ghl_subaccounts_location" ON "public"."ghl_subaccounts" USING "btree" ("location_id");



CREATE INDEX "idx_ghl_subaccounts_user" ON "public"."ghl_subaccounts" USING "btree" ("user_id");



CREATE INDEX "idx_ghl_subaccounts_user_id" ON "public"."ghl_subaccounts" USING "btree" ("user_id");



CREATE INDEX "idx_ghl_tokens_company" ON "public"."ghl_tokens" USING "btree" ("company_id") WHERE ("company_id" IS NOT NULL);



CREATE INDEX "idx_ghl_tokens_expires" ON "public"."ghl_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_ghl_tokens_location" ON "public"."ghl_tokens" USING "btree" ("location_id") WHERE ("location_id" IS NOT NULL);



CREATE INDEX "idx_ghl_tokens_user" ON "public"."ghl_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_ghl_tokens_user_type" ON "public"."ghl_tokens" USING "btree" ("user_id", "user_type");



CREATE INDEX "idx_kb_category" ON "public"."ted_knowledge_base" USING "btree" ("content_category");



CREATE INDEX "idx_questionnaire_funnel" ON "public"."questionnaire_responses" USING "btree" ("funnel_id");



CREATE INDEX "idx_questionnaire_user" ON "public"."questionnaire_responses" USING "btree" ("user_id");



CREATE INDEX "idx_questions_master_step" ON "public"."questions_master" USING "btree" ("step_number");



CREATE INDEX "idx_saved_sessions_user" ON "public"."saved_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_transcript_status" ON "public"."transcript_metadata" USING "btree" ("status");



CREATE INDEX "idx_transcript_tags" ON "public"."transcript_metadata" USING "gin" ("tags");



CREATE UNIQUE INDEX "idx_unique_active_funnel" ON "public"."user_funnels" USING "btree" ("user_id") WHERE (("is_active" = true) AND ("is_deleted" = false));



CREATE INDEX "idx_user_funnels_user" ON "public"."user_funnels" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_ghl" ON "public"."user_profiles" USING "btree" ("ghl_location_id") WHERE ("ghl_location_id" IS NOT NULL);



CREATE INDEX "idx_user_profiles_ghl_failed" ON "public"."user_profiles" USING "btree" ("ghl_permanently_failed", "ghl_retry_count") WHERE ("ghl_permanently_failed" = true);



CREATE INDEX "idx_user_profiles_ghl_last_retry" ON "public"."user_profiles" USING "btree" ("ghl_last_retry_at" DESC) WHERE ("ghl_last_retry_at" IS NOT NULL);



CREATE INDEX "idx_user_profiles_ghl_retry" ON "public"."user_profiles" USING "btree" ("ghl_sync_status", "ghl_next_retry_at", "ghl_retry_count") WHERE (("ghl_sync_status" = 'failed'::"text") AND ("ghl_permanently_failed" = false));



CREATE INDEX "idx_user_profiles_license_accepted" ON "public"."user_profiles" USING "btree" ("license_accepted_at") WHERE ("license_accepted_at" IS NOT NULL);



CREATE INDEX "idx_user_profiles_tier" ON "public"."user_profiles" USING "btree" ("subscription_tier");



CREATE INDEX "idx_vault_content_funnel" ON "public"."vault_content" USING "btree" ("funnel_id");



CREATE INDEX "idx_vault_content_section" ON "public"."vault_content" USING "btree" ("funnel_id", "section_id");



CREATE INDEX "idx_vault_content_user" ON "public"."vault_content" USING "btree" ("user_id");



CREATE INDEX "idx_vault_fields_funnel_section" ON "public"."vault_content_fields" USING "btree" ("funnel_id", "section_id");



CREATE INDEX "idx_vault_fields_user" ON "public"."vault_content_fields" USING "btree" ("user_id");



CREATE INDEX "rag_data_embedding_idx" ON "public"."rag_data" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "rag_data_funnel_idx" ON "public"."rag_data" USING "btree" ("funnel_id");



CREATE INDEX "rag_data_user_idx" ON "public"."rag_data" USING "btree" ("user_id");



CREATE INDEX "ted_knowledge_base_embedding_idx" ON "public"."ted_knowledge_base" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE OR REPLACE TRIGGER "decrement_funnel_count_trigger" AFTER UPDATE ON "public"."user_funnels" FOR EACH ROW WHEN ((("old"."is_deleted" = false) AND ("new"."is_deleted" = true))) EXECUTE FUNCTION "public"."decrement_funnel_count"();



CREATE OR REPLACE TRIGGER "increment_funnel_count_trigger" AFTER INSERT ON "public"."user_funnels" FOR EACH ROW EXECUTE FUNCTION "public"."increment_funnel_count"();



CREATE OR REPLACE TRIGGER "trigger_generation_jobs_updated_at" BEFORE UPDATE ON "public"."generation_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_ghl_credentials_updated_at" BEFORE UPDATE ON "public"."ghl_credentials" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_ghl_subaccounts_updated_at" BEFORE UPDATE ON "public"."ghl_subaccounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_ghl_tokens_updated_at" BEFORE UPDATE ON "public"."ghl_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_questionnaire_updated_at" BEFORE UPDATE ON "public"."questionnaire_responses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_saved_sessions_updated_at" BEFORE UPDATE ON "public"."saved_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_user_funnels_updated_at" BEFORE UPDATE ON "public"."user_funnels" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "vault_content_updated_at" BEFORE UPDATE ON "public"."vault_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "vault_fields_updated_at" BEFORE UPDATE ON "public"."vault_content_fields" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."feedback_logs"
    ADD CONSTRAINT "feedback_logs_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."user_funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_logs"
    ADD CONSTRAINT "feedback_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_content"
    ADD CONSTRAINT "generated_content_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."saved_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_content"
    ADD CONSTRAINT "generated_content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_css"
    ADD CONSTRAINT "generated_css_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."saved_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_css"
    ADD CONSTRAINT "generated_css_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."user_funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."saved_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generation_jobs"
    ADD CONSTRAINT "generation_jobs_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."user_funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generation_jobs"
    ADD CONSTRAINT "generation_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ghl_credentials"
    ADD CONSTRAINT "ghl_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ghl_custom_value_mappings"
    ADD CONSTRAINT "ghl_custom_value_mappings_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."user_funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ghl_custom_value_mappings"
    ADD CONSTRAINT "ghl_custom_value_mappings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."saved_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ghl_custom_value_mappings"
    ADD CONSTRAINT "ghl_custom_value_mappings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ghl_push_logs"
    ADD CONSTRAINT "ghl_push_logs_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."user_funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ghl_push_operations"
    ADD CONSTRAINT "ghl_push_operations_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."user_funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ghl_push_operations"
    ADD CONSTRAINT "ghl_push_operations_ghl_credential_id_fkey" FOREIGN KEY ("ghl_credential_id") REFERENCES "public"."ghl_credentials"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ghl_push_operations"
    ADD CONSTRAINT "ghl_push_operations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."saved_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ghl_push_operations"
    ADD CONSTRAINT "ghl_push_operations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ghl_subaccount_logs"
    ADD CONSTRAINT "ghl_subaccount_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intake_answers"
    ADD CONSTRAINT "intake_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."user_funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rag_data"
    ADD CONSTRAINT "rag_data_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."user_funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rag_data"
    ADD CONSTRAINT "rag_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_sessions"
    ADD CONSTRAINT "saved_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slide_results"
    ADD CONSTRAINT "slide_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ted_knowledge_base"
    ADD CONSTRAINT "ted_knowledge_base_transcript_id_fkey" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcript_metadata"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_funnels"
    ADD CONSTRAINT "user_funnels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vault_content_fields"
    ADD CONSTRAINT "vault_content_fields_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."user_funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vault_content"
    ADD CONSTRAINT "vault_content_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."user_funnels"("id") ON DELETE CASCADE;



CREATE POLICY "Admins manage settings" ON "public"."admin_settings" USING ("public"."is_admin"());



CREATE POLICY "Admins view all profiles" ON "public"."user_profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Service role bypass admin_settings" ON "public"."admin_settings" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass generated" ON "public"."generated_content" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass generation_jobs" ON "public"."generation_jobs" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass ghl_creds" ON "public"."ghl_credentials" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass ghl_mappings" ON "public"."ghl_custom_value_mappings" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass ghl_push" ON "public"."ghl_push_operations" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass images" ON "public"."generated_images" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass intake" ON "public"."intake_answers" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass questionnaire" ON "public"."questionnaire_responses" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass rag_data" ON "public"."rag_data" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass saved_sessions" ON "public"."saved_sessions" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass slides" ON "public"."slide_results" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass user_funnels" ON "public"."user_funnels" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass user_profiles" ON "public"."user_profiles" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass vault_content" ON "public"."vault_content" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role bypass vault_fields" ON "public"."vault_content_fields" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages feedback logs" ON "public"."feedback_logs" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can delete own subaccounts" ON "public"."ghl_subaccounts" FOR DELETE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can delete own tokens" ON "public"."ghl_tokens" FOR DELETE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can insert own generation jobs" ON "public"."generation_jobs" FOR INSERT WITH CHECK (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users can insert own subaccounts" ON "public"."ghl_subaccounts" FOR INSERT WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can insert own tokens" ON "public"."ghl_tokens" FOR INSERT WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can read own logs" ON "public"."ghl_oauth_logs" FOR SELECT USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can read own subaccounts" ON "public"."ghl_subaccounts" FOR SELECT USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can read own tokens" ON "public"."ghl_tokens" FOR SELECT USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can update own generation jobs" ON "public"."generation_jobs" FOR UPDATE USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users can update own subaccounts" ON "public"."ghl_subaccounts" FOR UPDATE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can update own tokens" ON "public"."ghl_tokens" FOR UPDATE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can view own generation jobs" ON "public"."generation_jobs" FOR SELECT USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users create own funnels" ON "public"."user_funnels" FOR INSERT WITH CHECK (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users delete own funnels" ON "public"."user_funnels" FOR DELETE USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users insert own feedback logs" ON "public"."feedback_logs" FOR INSERT WITH CHECK (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users manage own GHL creds" ON "public"."ghl_credentials" USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users manage own GHL mappings" ON "public"."ghl_custom_value_mappings" USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users manage own RAG data" ON "public"."rag_data" USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users manage own images" ON "public"."generated_images" USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users manage own intake" ON "public"."intake_answers" USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users manage own questionnaire" ON "public"."questionnaire_responses" USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users manage own sessions" ON "public"."saved_sessions" USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users manage own slides" ON "public"."slide_results" USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users manage own vault content" ON "public"."vault_content" USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users manage own vault fields" ON "public"."vault_content_fields" USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users update own funnels" ON "public"."user_funnels" FOR UPDATE USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users view own GHL ops" ON "public"."ghl_push_operations" FOR SELECT USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users view own feedback logs" ON "public"."feedback_logs" FOR SELECT USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users view own funnels" ON "public"."user_funnels" FOR SELECT USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users view own generated" ON "public"."generated_content" FOR SELECT USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



ALTER TABLE "public"."admin_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generation_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ghl_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ghl_custom_value_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ghl_oauth_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ghl_push_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ghl_push_logs_insert_own" ON "public"."ghl_push_logs" FOR INSERT WITH CHECK (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "ghl_push_logs_select_own" ON "public"."ghl_push_logs" FOR SELECT USING (("user_id" = ("auth"."uid"())::"text"));



ALTER TABLE "public"."ghl_push_operations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ghl_subaccounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ghl_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intake_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questionnaire_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rag_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."slide_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_funnels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vault_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vault_content_fields" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "full access pabbly_users" ON "test_schema"."pabbly_users" TO "authenticated", "anon", "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "test_schema"."pabbly_users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "test_schema" TO "anon";
GRANT USAGE ON SCHEMA "test_schema" TO "authenticated";
GRANT USAGE ON SCHEMA "test_schema" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_next_retry"("attempt_count" integer, "last_error_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_next_retry"("attempt_count" integer, "last_error_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_next_retry"("attempt_count" integer, "last_error_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_create_funnel"("p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_create_funnel"("p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_create_funnel"("p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_funnel_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_funnel_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_funnel_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_agency_token"("p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_agency_token"("p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_agency_token"("p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ghl_retry_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_ghl_retry_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ghl_retry_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_location_token"("p_user_id" "text", "p_location_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_location_token"("p_user_id" "text", "p_location_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_location_token"("p_user_id" "text", "p_location_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."has_active_subaccount"("p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_active_subaccount"("p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_active_subaccount"("p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_funnel_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_funnel_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_funnel_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_columns_for_table"("p_schema" "text", "p_table" "text", "p_mode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."list_columns_for_table"("p_schema" "text", "p_table" "text", "p_mode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_columns_for_table"("p_schema" "text", "p_table" "text", "p_mode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_tables_for_schema"("p_schema" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."list_tables_for_schema"("p_schema" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_tables_for_schema"("p_schema" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_user_schemas"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_user_schemas"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_user_schemas"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "public"."ghl_subaccount_logs" TO "anon";
GRANT ALL ON TABLE "public"."ghl_subaccount_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ghl_subaccount_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."admin_ghl_accounts_summary" TO "anon";
GRANT ALL ON TABLE "public"."admin_ghl_accounts_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_ghl_accounts_summary" TO "service_role";



GRANT ALL ON TABLE "public"."admin_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_settings" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_logs" TO "anon";
GRANT ALL ON TABLE "public"."feedback_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_logs" TO "service_role";



GRANT ALL ON TABLE "public"."generated_content" TO "anon";
GRANT ALL ON TABLE "public"."generated_content" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_content" TO "service_role";



GRANT ALL ON TABLE "public"."generated_css" TO "anon";
GRANT ALL ON TABLE "public"."generated_css" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_css" TO "service_role";



GRANT ALL ON TABLE "public"."generated_images" TO "anon";
GRANT ALL ON TABLE "public"."generated_images" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_images" TO "service_role";



GRANT ALL ON TABLE "public"."generation_jobs" TO "anon";
GRANT ALL ON TABLE "public"."generation_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."generation_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."ghl_agency_credentials" TO "anon";
GRANT ALL ON TABLE "public"."ghl_agency_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."ghl_agency_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."ghl_credentials" TO "anon";
GRANT ALL ON TABLE "public"."ghl_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."ghl_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."ghl_custom_value_mappings" TO "anon";
GRANT ALL ON TABLE "public"."ghl_custom_value_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."ghl_custom_value_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."ghl_oauth_logs" TO "anon";
GRANT ALL ON TABLE "public"."ghl_oauth_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ghl_oauth_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ghl_push_logs" TO "anon";
GRANT ALL ON TABLE "public"."ghl_push_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ghl_push_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ghl_push_operations" TO "anon";
GRANT ALL ON TABLE "public"."ghl_push_operations" TO "authenticated";
GRANT ALL ON TABLE "public"."ghl_push_operations" TO "service_role";



GRANT ALL ON TABLE "public"."ghl_subaccounts" TO "anon";
GRANT ALL ON TABLE "public"."ghl_subaccounts" TO "authenticated";
GRANT ALL ON TABLE "public"."ghl_subaccounts" TO "service_role";



GRANT ALL ON TABLE "public"."ghl_tokens" TO "anon";
GRANT ALL ON TABLE "public"."ghl_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."ghl_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."intake_answers" TO "anon";
GRANT ALL ON TABLE "public"."intake_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."intake_answers" TO "service_role";



GRANT ALL ON TABLE "public"."questionnaire_responses" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."questionnaire_responses" TO "service_role";



GRANT ALL ON TABLE "public"."questions_master" TO "anon";
GRANT ALL ON TABLE "public"."questions_master" TO "authenticated";
GRANT ALL ON TABLE "public"."questions_master" TO "service_role";



GRANT ALL ON TABLE "public"."rag_data" TO "anon";
GRANT ALL ON TABLE "public"."rag_data" TO "authenticated";
GRANT ALL ON TABLE "public"."rag_data" TO "service_role";



GRANT ALL ON TABLE "public"."saved_sessions" TO "anon";
GRANT ALL ON TABLE "public"."saved_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."slide_results" TO "anon";
GRANT ALL ON TABLE "public"."slide_results" TO "authenticated";
GRANT ALL ON TABLE "public"."slide_results" TO "service_role";



GRANT ALL ON TABLE "public"."ted_knowledge_base" TO "anon";
GRANT ALL ON TABLE "public"."ted_knowledge_base" TO "authenticated";
GRANT ALL ON TABLE "public"."ted_knowledge_base" TO "service_role";



GRANT ALL ON TABLE "public"."transcript_metadata" TO "anon";
GRANT ALL ON TABLE "public"."transcript_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."transcript_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."user_funnels" TO "anon";
GRANT ALL ON TABLE "public"."user_funnels" TO "authenticated";
GRANT ALL ON TABLE "public"."user_funnels" TO "service_role";



GRANT ALL ON TABLE "public"."vault_content" TO "anon";
GRANT ALL ON TABLE "public"."vault_content" TO "authenticated";
GRANT ALL ON TABLE "public"."vault_content" TO "service_role";



GRANT ALL ON TABLE "public"."vault_content_fields" TO "anon";
GRANT ALL ON TABLE "public"."vault_content_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."vault_content_fields" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "test_schema"."pabbly_users" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "test_schema"."pabbly_users" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "test_schema"."pabbly_users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































