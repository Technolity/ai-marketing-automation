# 🗄️ Database Setup Instructions

## Quick Start (5 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your project
3. In the left sidebar, click **SQL Editor**
4. Click **New Query**

### Step 2: Run the Setup Script

1. Open the file `database-setup.sql` in your code editor
2. **Select All** (Ctrl+A / Cmd+A)
3. **Copy** (Ctrl+C / Cmd+C)
4. Go back to Supabase SQL Editor
5. **Paste** the entire script
6. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Verify Installation

Run this query to check tables were created:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**You should see:**
- `knowledge_base`
- `saved_sessions`
- `slide_results`
- `users`

### Step 4: Check RLS Policies

Run this query:
```sql
SELECT
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**You should see policies for:**
- `saved_sessions` (4 policies: SELECT, INSERT, UPDATE, DELETE)
- `slide_results` (4 policies: SELECT, INSERT, UPDATE, DELETE)
- `users` (2 policies: SELECT, UPDATE)
- `knowledge_base` (1 policy: SELECT)

### Step 5: Test a Query

Run this to verify everything works:
```sql
-- This should return 0 rows (unless you have data)
SELECT COUNT(*) as session_count FROM saved_sessions;
SELECT COUNT(*) as results_count FROM slide_results;
SELECT COUNT(*) as users_count FROM users;
```

If these queries run without errors, you're all set! ✅

---

## Troubleshooting

### Error: "relation does not exist"

**Problem:** Tables weren't created

**Solution:**
1. Make sure you selected and copied the ENTIRE `database-setup.sql` file
2. Re-run the script
3. Check for any error messages in the SQL Editor

### Error: "permission denied"

**Problem:** RLS policies are blocking

**Solution:**
1. Make sure you're using the **Service Role Key** in your backend
2. Check your `.env.local` has:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. The Service Role Key bypasses RLS

### Error: "column already exists"

**Problem:** Tables partially exist

**Solution:**
1. The script uses `IF NOT EXISTS` so it's safe to re-run
2. If you want a completely fresh start:
   ```sql
   -- CAREFUL: This deletes everything!
   DROP TABLE IF EXISTS saved_sessions CASCADE;
   DROP TABLE IF EXISTS slide_results CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   DROP TABLE IF EXISTS knowledge_base CASCADE;
   ```
3. Then re-run `database-setup.sql`

---

## Environment Variables

Make sure your `.env.local` has all required database credentials:

```bash
# Supabase (PUBLIC - safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase Service Role (PRIVATE - server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# OpenAI
OPENAI_API_KEY=sk-...
```

**Where to find these:**

### Supabase Keys:
1. Go to your Supabase project
2. Click **Settings** (gear icon in sidebar)
3. Click **API**
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

### Clerk Keys:
1. Go to https://dashboard.clerk.com
2. Select your application
3. Click **API Keys** in sidebar
4. Copy:
   - `Publishable key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` → `CLERK_SECRET_KEY` ⚠️ **Keep this secret!**

### OpenAI Key:
1. Go to https://platform.openai.com/api-keys
2. Create a new key
3. Copy it → `OPENAI_API_KEY` ⚠️ **Keep this secret!**

---

## Testing Database Connection

### Test 1: Frontend Query (using Anon Key)

Add this to any page component temporarily:
```javascript
useEffect(() => {
  const testDB = async () => {
    const { createClientComponentClient } = require('@supabase/auth-helpers-nextjs');
    const supabase = createClientComponentClient();

    const { data, error } = await supabase
      .from('saved_sessions')
      .select('count');

    console.log('DB Test (Frontend):', { data, error });
  };
  testDB();
}, []);
```

### Test 2: Backend Query (using Service Role Key)

Add this to any API route temporarily:
```javascript
import { supabase } from '@/lib/supabaseServiceRole';

export async function GET(req) {
  const { data, error } = await supabase
    .from('saved_sessions')
    .select('*')
    .limit(5);

  console.log('DB Test (Backend):', { data, error });
  return NextResponse.json({ data, error });
}
```

---

## Database Schema Overview

### `saved_sessions` Table
Stores user questionnaire progress and saved sessions.

**Key columns:**
- `id` - Unique session ID
- `user_id` - Clerk user ID
- `session_name` - User-defined name
- `answers` - Questionnaire answers (JSONB)
- `generated_content` - AI-generated content (JSONB)
- `completed_steps` - Array of completed step numbers
- `is_complete` - Whether all 20 steps are done

### `slide_results` Table
Stores approved AI-generated content.

**Key columns:**
- `id` - Unique result ID
- `user_id` - Clerk user ID
- `slide_id` - Step number (99 = full generation)
- `ai_output` - Generated content (JSONB)
- `approved` - Whether content is approved

**IMPORTANT:** Full generation (all 14 sections) is stored at `slide_id: 99`

### `users` Table
Extended user information beyond Clerk auth.

**Key columns:**
- `clerk_user_id` - Links to Clerk user
- `tier` - Subscription tier (free, pro, enterprise)
- `is_admin` - Admin permissions
- `generations_used` - Usage tracking
- `generations_limit` - Monthly limit

### `knowledge_base` Table
Admin documentation and help articles.

**Key columns:**
- `title` - Article title
- `content` - Article content (markdown)
- `category` - Category for grouping
- `tags` - Search tags (array)

---

## Next Steps

After database setup:

1. ✅ **Restart your dev server**
   ```bash
   npm run dev
   ```

2. ✅ **Clear browser data**
   - Open DevTools → Application → Clear storage

3. ✅ **Test the flow**
   - Go to `/introduction`
   - Complete questionnaire
   - Generate content
   - View results

4. ✅ **Check console logs**
   - Look for `[Sessions API]`, `[Approve API]`, `[Results]` logs
   - Verify no database errors

---

## Maintenance Queries

### View Recent Sessions
```sql
SELECT
    session_name,
    array_length(completed_steps, 1) as steps_done,
    is_complete,
    created_at
FROM saved_sessions
WHERE is_deleted = false
ORDER BY updated_at DESC
LIMIT 10;
```

### View Approved Results
```sql
SELECT
    user_id,
    slide_id,
    approved,
    created_at,
    jsonb_object_keys(ai_output) as content_sections
FROM slide_results
WHERE approved = true
ORDER BY created_at DESC;
```

### Clean Up Old Sessions (Optional)
```sql
-- Soft delete sessions older than 90 days
UPDATE saved_sessions
SET is_deleted = true
WHERE created_at < NOW() - INTERVAL '90 days'
AND is_deleted = false;
```

---

## ✅ You're Done!

Database is now fully configured and ready to use! 🎉

**Questions?** Check [ROUTING-AND-DEBUGGING-GUIDE.md](./ROUTING-AND-DEBUGGING-GUIDE.md) for detailed troubleshooting.
