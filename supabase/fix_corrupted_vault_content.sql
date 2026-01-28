-- ============================================
-- CORRECTED: Fix Corrupted vault_content Table
-- ============================================
-- This script targets the vault_content table (not saved_sessions)
-- Based on the CSV structure: id, funnel_id, user_id, section_id, content (JSONB)

-- ============================================
-- STEP 1: Find corrupted setterScript records
-- ============================================
-- Look for setterScript sections that have closerCallScript keys (WRONG!)
SELECT
    id,
    user_id,
    funnel_id,
    section_id,
    created_at,
    content
FROM vault_content
WHERE section_id = 'setterScript'
  AND (
    -- Has closerCallScript key (WRONG for setter)
    content->'closerCallScript' IS NOT NULL
    OR
    -- Missing setterCallScript key (also WRONG)
    (content->'setterCallScript' IS NULL AND content IS NOT NULL)
  )
ORDER BY created_at DESC;

-- ============================================
-- STEP 2: Find corrupted salesScripts records
-- ============================================
-- Look for salesScripts sections that have setterCallScript keys (WRONG!)
SELECT
    id,
    user_id,
    funnel_id,
    section_id,
    created_at,
    content
FROM vault_content
WHERE section_id = 'salesScripts'
  AND (
    -- Has setterCallScript key (WRONG for sales/closer)
    content->'setterCallScript' IS NOT NULL
    OR
    -- Missing closerCallScript key (also WRONG)
    (content->'closerCallScript' IS NULL AND content IS NOT NULL)
  )
ORDER BY created_at DESC;

-- ============================================
-- STEP 3: Count total corrupted records
-- ============================================
SELECT
    COUNT(*) as total_corrupted_records
FROM vault_content
WHERE (
    -- setterScript with wrong schema
    (section_id = 'setterScript' AND content->'closerCallScript' IS NOT NULL)
    OR
    -- salesScripts with wrong schema
    (section_id = 'salesScripts' AND content->'setterCallScript' IS NOT NULL)
);

-- ============================================
-- STEP 4: Fix corrupted setterScript records
-- ============================================
-- Extract the correct setterCallScript from mixed schema
UPDATE vault_content
SET content = jsonb_build_object(
    'setterCallScript',
    COALESCE(
        content->'setterCallScript',  -- Keep if exists
        '{}'::jsonb                   -- Empty object if doesn't exist
    )
)
WHERE section_id = 'setterScript'
  AND content->'closerCallScript' IS NOT NULL;

-- ============================================
-- STEP 5: Fix corrupted salesScripts records
-- ============================================
-- Extract the correct closerCallScript from mixed schema
UPDATE vault_content
SET content = jsonb_build_object(
    'closerCallScript',
    COALESCE(
        content->'closerCallScript',  -- Keep if exists
        '{}'::jsonb                   -- Empty object if doesn't exist
    )
)
WHERE section_id = 'salesScripts'
  AND content->'setterCallScript' IS NOT NULL;

-- ============================================
-- STEP 6: Verify cleanup (should return 0 rows)
-- ============================================
SELECT
    section_id,
    COUNT(*) as remaining_corrupted
FROM vault_content
WHERE (
    -- setterScript with wrong schema
    (section_id = 'setterScript' AND content->'closerCallScript' IS NOT NULL)
    OR
    -- salesScripts with wrong schema
    (section_id = 'salesScripts' AND content->'setterCallScript' IS NOT NULL)
)
GROUP BY section_id;

-- ============================================
-- BONUS: Check for other potential issues
-- ============================================
-- Find setterScript with BOTH keys (complete mix-up)
SELECT
    id,
    user_id,
    section_id,
    jsonb_object_keys(content) as top_level_keys
FROM vault_content
WHERE section_id IN ('setterScript', 'salesScripts')
  AND jsonb_typeof(content) = 'object'
ORDER BY section_id, created_at DESC;

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Run STEP 1 & 2 first to SEE corrupted records (don't change anything)
-- 2. Run STEP 3 to COUNT how many records are corrupted
-- 3. If you see corrupted records, run STEP 4 & 5 to FIX them
-- 4. Run STEP 6 to VERIFY cleanup worked (should show 0 remaining)
-- 5. Run BONUS query to see all top-level keys and verify correctness
-- ============================================
