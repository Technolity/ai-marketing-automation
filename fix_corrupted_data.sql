-- Fix corrupted setterScript data in database
-- Run this in Supabase SQL Editor to clean up mixed schemas

-- 1. Find all sessions with corrupted setterScript data
SELECT
    id,
    user_id,
    vault_content->'setterScript' as setter_content
FROM saved_sessions
WHERE vault_content->'setterScript'->'closerCallScript' IS NOT NULL
   OR (vault_content->'setterScript'->'setterCallScript' IS NULL
       AND vault_content->'setterScript' IS NOT NULL);

-- 2. Fix by removing closerCallScript from setterScript sections
UPDATE saved_sessions
SET vault_content = jsonb_set(
    vault_content,
    '{setterScript}',
    COALESCE(
        vault_content->'setterScript'->'setterCallScript',
        '{}'::jsonb
    )
)
WHERE vault_content->'setterScript'->'closerCallScript' IS NOT NULL;

-- 3. Verify fix
SELECT
    id,
    user_id,
    vault_content->'setterScript' as fixed_setter_content
FROM saved_sessions
WHERE vault_content->'setterScript' IS NOT NULL
LIMIT 10;

-- 4. Clean up results_data as well (if using old structure)
UPDATE saved_sessions
SET results_data = jsonb_set(
    results_data,
    '{setterScript,data}',
    COALESCE(
        results_data->'setterScript'->'data'->'setterCallScript',
        '{}'::jsonb
    )
)
WHERE results_data->'setterScript'->'data'->'closerCallScript' IS NOT NULL;
