# Example: How to Update API Routes with New Auth

## Before (Current Code)

```javascript
// app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ⚠️ DEV MODE: Auth disabled - admin access public

export async function GET() {
    try {
        // Dev mode: No auth check - admin panel is public

        // ... your logic here

        return NextResponse.json({ stats: data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

## After (With New Auth)

```javascript
// app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';  // ← Add this import

export async function GET(req) {  // ← Add req parameter
    try {
        // Verify admin access (works in both dev and Clerk modes!)
        const { userId, isAdmin, profile } = await requireAdmin(req);  // ← Add this line

        // ... your logic here (same as before)

        return NextResponse.json({ stats: data });
    } catch (error) {
        // Handle auth errors
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('Forbidden')) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

## Example: User Route (Non-Admin)

### Before
```javascript
// app/api/os/sessions/route.js
export async function GET(req) {
    const userId = req.headers.get('x-user-id') || '11111111-1111-1111-1111-111111111111';
    const user = { id: userId, email: `${userId}@test.com` };

    // Query with userId
    const { data: sessions } = await supabase
        .from('saved_sessions')
        .select('*')
        .eq('user_id', user.id);

    return NextResponse.json({ sessions });
}
```

### After
```javascript
// app/api/os/sessions/route.js
import { requireAuth } from '@/lib/auth';  // ← Add this

export async function GET(req) {
    try {
        // Get authenticated user (works in both modes!)
        const { userId, profile } = await requireAuth(req);  // ← Add this

        // Query with userId (same as before)
        const { data: sessions } = await supabase
            .from('saved_sessions')
            .select('*')
            .eq('user_id', userId);  // ← Use userId from auth

        return NextResponse.json({ sessions });
    } catch (error) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

## Key Changes

1. **Import the auth helper**:
   ```javascript
   import { requireAuth } from '@/lib/auth';  // For user routes
   import { requireAdmin } from '@/lib/auth';  // For admin routes
   ```

2. **Add `req` parameter**:
   ```javascript
   export async function GET(req) {  // ← Add req
   ```

3. **Call auth helper**:
   ```javascript
   const { userId, profile } = await requireAuth(req);  // User route
   const { userId, isAdmin, profile } = await requireAdmin(req);  // Admin route
   ```

4. **Handle errors**:
   ```javascript
   catch (error) {
       if (error.message === 'Unauthorized') {
           return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
       }
       if (error.message.includes('Forbidden')) {  // Admin routes only
           return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
       }
       return NextResponse.json({ error: error.message }, { status: 500 });
   }
   ```

## What You Get

- ✅ Works in **both dev mode and Clerk mode**
- ✅ Automatic user authentication
- ✅ Automatic admin checking
- ✅ Proper error handling (401, 403, 500)
- ✅ Access to user profile data
- ✅ No more manual header extraction

## Routes to Update

You have **20 API routes** that need this update:

### Admin Routes (7 files) - Use `requireAdmin()`
1. `app/api/admin/stats/route.js`
2. `app/api/admin/users/route.js`
3. `app/api/admin/businesses/route.js`
4. `app/api/admin/content-review/route.js`
5. `app/api/admin/knowledge-base/route.js`
6. `app/api/admin/settings/route.js`
7. `app/api/admin/verify/route.js`

### User Routes (13 files) - Use `requireAuth()`
1. `app/api/os/sessions/route.js`
2. `app/api/os/generate/route.js`
3. `app/api/os/progress/route.js`
4. `app/api/os/assist/route.js`
5. `app/api/os/insights/route.js`
6. `app/api/os/approve/route.js`
7. `app/api/os/reset/route.js`
8. `app/api/os/schema/route.js`
9. `app/api/os/get-progress/route.js`
10. `app/api/user/tier/route.js`
11. `app/api/ai/generate/route.js`
12. `app/api/ghl/push/route.js`
13. `app/api/ghl/deploy/route.js`

## Testing After Update

1. **Test in dev mode** (should work exactly as before)
2. **Switch to Clerk mode** (set `DEV_MODE=false`)
3. **Test authentication**:
   - Try accessing route without login → 401 Unauthorized
   - Login and try → Works!
   - Try admin route as non-admin → 403 Forbidden
   - Add yourself to Admins org and try → Works!

## Note

**You don't have to update all routes right now!** The auth system is fully backwards compatible. Your current routes will continue working in dev mode. You can update routes gradually as needed.

For now, your app works perfectly in dev mode with the new architecture!
