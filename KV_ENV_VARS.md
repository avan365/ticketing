# Vercel KV Environment Variables Guide

## What You Should See

After adding Vercel KV via Marketplace, you should have **TWO** environment variables:

### Option 1: Standard Vercel KV Format
- `KV_REST_API_URL` - The REST API URL (starts with `https://`)
- `KV_REST_API_TOKEN` - The authentication token

### Option 2: Upstash Format
- `UPSTASH_REDIS_REST_URL` - The REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - The authentication token

### Option 3: Generic Redis Format
- `REDIS_URL` - The REST API URL
- `REDIS_TOKEN` or `REDIS_PASSWORD` - The authentication token

## If You Only See `REDIS_URL`

This means you might be missing the token. Here's what to do:

### Step 1: Check the KV Integration Details

1. Go to Vercel Dashboard → Your Project
2. Look for **Storage** or **Integrations** tab
3. Find your KV database
4. Click on it to see details
5. You should see both:
   - **REST URL** (this is the URL)
   - **REST TOKEN** (this is the token)

### Step 2: Add Missing Environment Variable

1. Go to **Settings** → **Environment Variables**
2. If you only see `REDIS_URL`, you need to add the token:

**Option A: If it's Vercel KV:**
- Add `KV_REST_API_URL` = (copy from REDIS_URL or integration details)
- Add `KV_REST_API_TOKEN` = (copy from integration details)

**Option B: If it's Upstash:**
- Add `UPSTASH_REDIS_REST_URL` = (copy from REDIS_URL)
- Add `UPSTASH_REDIS_REST_TOKEN` = (copy from integration details)

**Option C: Keep REDIS_URL format:**
- Keep `REDIS_URL` as is
- Add `REDIS_TOKEN` = (copy the token from integration details)

### Step 3: Verify

After adding, check:
1. Both variables are set for **Production** environment
2. Redeploy your project
3. Check function logs - should see "✅ KV client initialized"

## How to Find the Token

1. **In Vercel Dashboard:**
   - Go to your project → Storage/Integrations
   - Click on your KV database
   - Look for "REST Token" or "Token" section
   - Copy the value

2. **In Upstash Dashboard (if using Upstash):**
   - Go to https://console.upstash.com
   - Select your database
   - Go to "REST API" tab
   - Copy the URL and Token

## Quick Check

After setup, the code will log available env vars. Check Vercel function logs:
- Should see: `🔍 Available Redis/KV env vars: [...]`
- Should see: `✅ KV client initialized`

If you see warnings, the variables aren't set correctly.



