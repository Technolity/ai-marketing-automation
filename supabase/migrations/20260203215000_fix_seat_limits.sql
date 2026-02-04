-- ============================================
-- MIGRATION: Fix Seat Limits - Sync with Tier
-- ============================================
-- Problem: When subscription_tier is manually updated,
-- max_seats doesn't automatically change.
-- This migration fixes existing users and adds a trigger.
-- ============================================
-- Step 1: Fix all existing users - sync max_seats based on tier
UPDATE public.user_profiles
SET max_seats = CASE
        WHEN is_admin = true THEN 9999
        WHEN subscription_tier = 'starter' THEN 1
        WHEN subscription_tier = 'growth' THEN 3
        WHEN subscription_tier = 'scale' THEN 5
        ELSE 1
    END
WHERE max_seats IS NULL
    OR max_seats != CASE
        WHEN is_admin = true THEN 9999
        WHEN subscription_tier = 'starter' THEN 1
        WHEN subscription_tier = 'growth' THEN 3
        WHEN subscription_tier = 'scale' THEN 5
        ELSE 1
    END;
-- Step 2: Create trigger function to auto-sync on tier change
CREATE OR REPLACE FUNCTION public.sync_max_seats_with_tier() RETURNS TRIGGER AS $$ BEGIN -- Only update max_seats if subscription_tier changed
    IF OLD.subscription_tier IS DISTINCT
FROM NEW.subscription_tier
    OR OLD.is_admin IS DISTINCT
FROM NEW.is_admin THEN NEW.max_seats = CASE
        WHEN NEW.is_admin = true THEN 9999
        WHEN NEW.subscription_tier = 'starter' THEN 1
        WHEN NEW.subscription_tier = 'growth' THEN 3
        WHEN NEW.subscription_tier = 'scale' THEN 5
        ELSE 1
    END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Step 3: Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_max_seats ON public.user_profiles;
CREATE TRIGGER trigger_sync_max_seats BEFORE
UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.sync_max_seats_with_tier();
-- Verify the fix
SELECT id,
    email,
    subscription_tier,
    max_seats,
    is_admin
FROM public.user_profiles
LIMIT 10;