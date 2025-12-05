# 🚀 Vercel Deployment Guide

## AI Marketing Automation - Full Deployment Guide

This guide covers deploying your Next.js frontend to Vercel and connecting it to Supabase backend.

---

## Prerequisites

- GitHub account (recommended) or GitLab/Bitbucket
- Vercel account (free at vercel.com)
- Supabase account (already set up)
- Your Supabase project URL and keys

---

## Step 1: Prepare Your Code

### 1.1 Push to GitHub

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - AI Marketing Automation"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ai-marketing-automation.git
git branch -M main
git push -u origin main
```

### 1.2 Create .env.example

Make sure you have a `.env.example` file (for reference):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

---

## Step 2: Deploy to Vercel

### 2.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose your `ai-marketing-automation` repository
5. Click **Import**

### 2.2 Configure Project

On the configuration screen:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | ./ |
| Build Command | npm run build |
| Output Directory | .next |
| Install Command | npm install |

### 2.3 Add Environment Variables

⚠️ **CRITICAL**: Add these environment variables in Vercel:

| Variable Name | Where to Find It |
|---------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (⚠️ Keep secret!) |
| `OPENAI_API_KEY` | OpenAI Dashboard → API Keys |

**To add in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable with the correct value
3. Select all environments: Production, Preview, Development

### 2.4 Deploy

Click **"Deploy"** and wait for the build to complete.

---

## Step 3: Configure Supabase for Production

### 3.1 Update Allowed Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel domain to **Site URL**:
   ```
   https://your-project.vercel.app
   ```
3. Add to **Redirect URLs**:
   ```
   https://your-project.vercel.app/**
   https://your-project.vercel.app/auth/callback
   ```

### 3.2 Run Database Migrations

In Supabase SQL Editor, run the complete schema:

```sql
-- Core tables
CREATE TABLE IF NOT EXISTS public.intake_answers (...);
CREATE TABLE IF NOT EXISTS public.slide_results (...);
CREATE TABLE IF NOT EXISTS public.saved_sessions (...);

-- Plus all RLS policies from schema.sql
```

### 3.3 Enable Row Level Security

Make sure RLS is enabled on all tables (already in schema.sql).

---

## Step 4: Post-Deployment Checklist

- [ ] Visit your deployed URL
- [ ] Test login/signup flow
- [ ] Complete one onboarding question
- [ ] Test AI generation
- [ ] Test save/load session
- [ ] Check Results page

---

## Troubleshooting

### Build Errors

**"Module not found"**
```bash
# Locally run:
npm install
npm run build
# Fix any errors before pushing
```

**"API routes timeout"**
- Check vercel.json has `maxDuration: 60`
- OpenAI calls may need more time

### Runtime Errors

**"Unauthorized" on API calls**
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check it's added to Vercel environment variables

**"OpenAI error"**
- Verify OPENAI_API_KEY is correct
- Check API key has credits

**CORS errors**
- Verify Supabase Redirect URLs include your Vercel domain

---

## Custom Domain (Optional)

1. Go to Vercel Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase redirect URLs with new domain

---

## Environment Variables Summary

```
┌─────────────────────────────────┬─────────────────────────────────┐
│ Variable                        │ Security Level                  │
├─────────────────────────────────┼─────────────────────────────────┤
│ NEXT_PUBLIC_SUPABASE_URL        │ Public (safe to expose)         │
│ NEXT_PUBLIC_SUPABASE_ANON_KEY   │ Public (safe to expose)         │
│ SUPABASE_SERVICE_ROLE_KEY       │ SECRET (never expose!)          │
│ OPENAI_API_KEY                  │ SECRET (never expose!)          │
└─────────────────────────────────┴─────────────────────────────────┘
```

---

## Quick Commands Reference

```bash
# Local development
npm run dev

# Production build test
npm run build
npm run start

# Deploy to Vercel
git add .
git commit -m "Update"
git push origin main
# Vercel auto-deploys on push
```

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Check Supabase logs at Dashboard → Database → Logs

---

**🎉 Your AI Marketing Automation is now live!**
