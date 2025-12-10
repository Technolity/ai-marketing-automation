# 🚀 Clerk Authentication Setup Guide

## Overview

Your TedOS Marketing Automation app now supports **DUAL MODE** authentication:
- **Dev Mode** (`DEV_MODE=true`): Mock users for testing
- **Production Mode** (`DEV_MODE=false`): Real Clerk authentication

## ✅ What's Already Done

- ✅ Clerk packages installed (@clerk/nextjs v4.31.8, svix)
- ✅ Unified auth helper created ([lib/auth.js](lib/auth.js))
- ✅ Admin helper created ([lib/clerkAdmin.js](lib/clerkAdmin.js))
- ✅ Webhook handler created ([app/api/webhooks/clerk/route.js](app/api/webhooks/clerk/route.js))
- ✅ Auth context updated for dual mode ([contexts/AuthContext.jsx](contexts/AuthContext.jsx))
- ✅ Middleware configured ([middleware.js](middleware.js))
- ✅ App layout wrapped in ClerkProvider ([app/layout.jsx](app/layout.jsx))
- ✅ Environment variables template added ([.env.local](.env.local))

## 📋 Next Steps

### Step 1: Update Supabase Database (5 minutes)

Run this SQL in Supabase SQL Editor:

```sql
-- Copy the contents of database/add-clerk-support.sql
```

Or directly:
1. Go to Supabase Dashboard → SQL Editor
2. Run the script from [database/add-clerk-support.sql](database/add-clerk-support.sql)
3. Verify the `clerk_id` column was added

###  Step 2: Create Clerk Account (10 minutes)

#### 2.1 Sign Up
1. Go to https://clerk.com
2. Click "Start Building for Free"
3. Sign up with your email or GitHub
4. Verify your email

#### 2.2 Create Application
1. In Clerk Dashboard, click "Create Application"
2. **Application Name**: "TedOS Marketing Automation"
3. **Authentication Methods**:
   - ✅ Email/Password
   - ✅ Google OAuth (recommended)
   - ⬜ Email Magic Links (optional)
4. Click "Create Application"

#### 2.3 Get API Keys
1. Go to **Dashboard → API Keys**
2. Copy these values:
   ```
   Publishable Key: pk_test_...
   Secret Key: sk_test_...
   ```
3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
   ```

#### 2.4 Configure Clerk Paths
1. Go to **Dashboard → Paths**
2. Set the following:
   - **Sign In URL**: `/auth/login`
   - **Sign Up URL**: `/auth/signup`
   - **After Sign In**: `/dashboard`
   - **After Sign Up**: `/dashboard`
   - **Home URL**: `/`

#### 2.5 Enable Organizations
1. Go to **Dashboard → Organizations**
2. Click "Enable Organizations"
3. Settings:
   - **Max organizations per user**: 5
   - **Enable personal workspaces**: No
   - **Creator role**: Admin

#### 2.6 Create "Admins" Organization
1. Go to **Dashboard → Organizations**
2. Click "Create Organization"
3. **Organization Name**: `Admins` (exactly this name!)
4. **Your Role**: Admin
5. Click "Create"

#### 2.7 Add Yourself to Admins Org
1. Go to **Dashboard → Users**
2. Find your user account
3. Click your user → "Organizations" tab
4. Click "Add to Organization"
5. Select "Admins"
6. Role: "Admin"
7. Click "Add"

#### 2.8 Configure Webhook (for production)
1. Go to **Dashboard → Webhooks**
2. Click "Add Endpoint"
3. **Endpoint URL**:
   - Local testing: Use [ngrok](https://ngrok.com) to expose localhost
     ```bash
     ngrok http 3000
     # Use the https URL: https://xxxx.ngrok.io/api/webhooks/clerk
     ```
   - Production: `https://yourdomain.com/api/webhooks/clerk`
4. **Subscribe to events**:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
   - ✅ `organizationMembership.created`
   - ✅ `organizationMembership.deleted`
5. Click "Create"
6. Copy the **Signing Secret** (starts with `whsec_`)
7. Update `.env.local`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

### Step 3: Test in Dev Mode (5 minutes)

Your app is currently in dev mode and should work perfectly!

1. **Restart your dev server** (important for env vars):
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Open browser**: http://localhost:3000

3. **Test dev mode features**:
   - ✅ See "DEV MODE" banner at top
   - ✅ See DevUserSelector in navbar
   - ✅ Switch between 3 test users
   - ✅ Basic user can access `/dashboard`
   - ✅ Admin user can access `/admin/overview`
   - ✅ Non-admin cannot access admin panel

4. **Check server logs**:
   ```
   [Auth] Dev mode: Using user ID from header
   [Middleware] Dev mode enabled - authentication bypassed
   ```

### Step 4: Test Clerk Mode (Optional - 10 minutes)

Once you have Clerk keys configured:

1. **Update `.env.local`**:
   ```env
   NEXT_PUBLIC_DEV_MODE=false  # Switch to Clerk mode
   ```

2. **Restart server**:
   ```bash
   npm run dev
   ```

3. **Test Clerk features**:
   - Go to http://localhost:3000/auth/signup
   - Sign up with test email
   - Check Supabase: New user should appear with `clerk_id`
   - Try accessing `/dashboard` (should work)
   - Try accessing `/admin/overview` (should redirect - not admin yet)

4. **Make yourself admin**:
   - In Clerk Dashboard → Your user → Organizations
   - Add yourself to "Admins" organization
   - Wait 1-2 seconds (webhook processes)
   - Check Supabase: `is_admin` should be `true`
   - Refresh browser
   - Try `/admin/overview` again (should work!)

## 🔄 Switching Between Modes

### Dev Mode → Clerk Mode
```env
# .env.local
NEXT_PUBLIC_DEV_MODE=false
```
Then restart server.

### Clerk Mode → Dev Mode
```env
# .env.local
NEXT_PUBLIC_DEV_MODE=true
```
Then restart server.

## 📁 File Reference

### Core Auth Files
- [lib/auth.js](lib/auth.js) - Main auth helper (use `requireAuth`, `requireAdmin`)
- [lib/clerkAdmin.js](lib/clerkAdmin.js) - Admin management functions
- [contexts/AuthContext.jsx](contexts/AuthContext.jsx) - Auth state provider
- [middleware.js](middleware.js) - Route protection

### Webhook & Sync
- [app/api/webhooks/clerk/route.js](app/api/webhooks/clerk/route.js) - User sync handler

### Database
- [database/add-clerk-support.sql](database/add-clerk-support.sql) - Add clerk_id to Supabase
- [database/complete-clerk-schema.sql](database/complete-clerk-schema.sql) - Full schema (future migration)
- [database/migrate-to-clerk-schema.sql](database/migrate-to-clerk-schema.sql) - Migration script

## 🎯 How to Update API Routes

### Before (Old Way)
```javascript
export async function GET(req) {
  const userId = req.headers.get('x-user-id') || '11111111-1111-1111-1111-111111111111';
  // ... use userId
}
```

### After (New Way)
```javascript
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const { userId, profile } = await requireAuth(req);
    // ... use userId and profile
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### For Admin Routes
```javascript
import { requireAdmin } from '@/lib/auth';

export async function GET(req) {
  try {
    const { userId, isAdmin, profile } = await requireAdmin(req);
    // ... admin logic
  } catch (error) {
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

## 🐛 Troubleshooting

### Issue: "Dev mode not working"
- Check `.env.local` has `NEXT_PUBLIC_DEV_MODE=true`
- Restart dev server after env changes
- Clear browser localStorage

### Issue: "Clerk signup not working"
- Verify Clerk keys are correct in `.env.local`
- Check Clerk Dashboard → Applications → Your App → Settings
- Ensure paths are configured correctly

### Issue: "Webhook not firing"
- Use ngrok for local testing
- Check Clerk Dashboard → Webhooks → Logs
- Verify webhook secret matches `.env.local`
- Check server logs for webhook errors

### Issue: "Admin access not working"
- Verify you're in "Admins" organization (exact name)
- Check role is "admin" not "member"
- Wait 1-2 seconds after org membership change
- Check Supabase: `is_admin` should be `true`
- Check Clerk: `publicMetadata.isAdmin` should be `true`

### Issue: "Loading spinner forever"
- This means API calls are failing
- Check browser console for errors
- Check server logs
- Verify database is accessible
- In dev mode: Ensure `X-User-ID` header is sent

## 📊 Database Schema

Your database now supports:
- **Dev mode users**: UUIDs like `11111111-1111-1111-1111-111111111111`
- **Clerk users**: Clerk IDs like `user_2abc123xyz456`

Both work side-by-side! The `clerk_id` column is:
- `NULL` for dev users
- Set for Clerk users

Queries automatically use the correct ID based on mode.

## 🚢 Deployment Checklist

Before deploying to production:

1. ✅ Create production Clerk application
2. ✅ Update environment variables with production keys
3. ✅ Set `NEXT_PUBLIC_DEV_MODE=false`
4. ✅ Configure production webhook URL
5. ✅ Add yourself to Admins organization
6. ✅ Test signup/login flow
7. ✅ Test admin access
8. ✅ Verify webhook is processing
9. ✅ Monitor Clerk Dashboard → Webhooks → Logs

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Users can sign up via Clerk
- ✅ New users appear in Supabase with `clerk_id`
- ✅ Admins can access `/admin/**` routes
- ✅ Non-admins are redirected from admin pages
- ✅ Adding user to "Admins" org sets `is_admin = true`
- ✅ No loading spinner issues
- ✅ Webhook logs show successful events

## 📞 Support

If you need help:
1. Check Clerk Dashboard → Webhooks → Logs for errors
2. Check your server logs for `[Auth]`, `[Webhook]`, `[Middleware]` messages
3. Review this guide again
4. Check `.env.local` has all required variables

## 🔐 Security Notes

- Never commit `.env.local` to git (already in `.gitignore`)
- Keep `CLERK_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` secret
- Use environment variables in production, not hardcoded values
- Webhook secret verifies requests are from Clerk
- Middleware protects all routes in production mode
- Dev mode is for testing only - never use in production!
