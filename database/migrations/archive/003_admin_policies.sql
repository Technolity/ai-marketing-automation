-- Migration: 003_admin_policies.sql
-- Add admin bypass policies to existing tables
-- Add admin policy to generated_content (if exists)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'generated_content'
) THEN -- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins read all content" ON generated_content;
DROP POLICY IF EXISTS "Admins update all content" ON generated_content;
-- Admins can read all generated content
CREATE POLICY "Admins read all content" ON generated_content FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE id = auth.uid()
                AND is_admin = TRUE
        )
    );
-- Admins can update all generated content
CREATE POLICY "Admins update all content" ON generated_content FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE id = auth.uid()
                AND is_admin = TRUE
        )
    );
END IF;
END $$;
-- Add admin policy to saved_sessions
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'saved_sessions'
) THEN -- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins read all sessions" ON saved_sessions;
-- Admins can read all saved sessions
CREATE POLICY "Admins read all sessions" ON saved_sessions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE id = auth.uid()
                AND is_admin = TRUE
        )
    );
END IF;
END $$;
-- Add admin policy to intake_answers (if exists)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'intake_answers'
) THEN DROP POLICY IF EXISTS "Admins read all answers" ON intake_answers;
CREATE POLICY "Admins read all answers" ON intake_answers FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE id = auth.uid()
                AND is_admin = TRUE
        )
    );
END IF;
END $$;
-- Add admin policy to slide_results (if exists)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'slide_results'
) THEN DROP POLICY IF EXISTS "Admins read all results" ON slide_results;
DROP POLICY IF EXISTS "Admins update all results" ON slide_results;
CREATE POLICY "Admins read all results" ON slide_results FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE id = auth.uid()
                AND is_admin = TRUE
        )
    );
CREATE POLICY "Admins update all results" ON slide_results FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE id = auth.uid()
                AND is_admin = TRUE
        )
    );
END IF;
END $$;