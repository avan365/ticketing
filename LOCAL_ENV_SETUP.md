# Local Environment Variables Setup

## Option 1: Using Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   npx vercel login
   ```
   - This will open a browser to authenticate
   - Follow the prompts

2. **Link your project** (if not already linked)
   ```bash
   npx vercel link
   ```
   - Select your project from the list

3. **Pull environment variables**
   ```bash
   npx vercel env pull .env.development.local
   ```
   - This will download all environment variables from Vercel
   - Creates `.env.development.local` file

4. **Verify the file was created**
   ```bash
   cat .env.development.local
   ```
   - Should see `KV_REST_API_URL` and `KV_REST_API_TOKEN`

## Option 2: Manual Setup (If CLI doesn't work)

1. **Get environment variables from Vercel Dashboard**
   - Go to your Vercel project → **Settings** → **Environment Variables**
   - Copy the values for:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`

2. **Create `.env.development.local` file**
   ```bash
   touch .env.development.local
   ```

3. **Add the variables** (edit the file)
   ```env
   KV_REST_API_URL=https://your-kv-url.upstash.io
   KV_REST_API_TOKEN=your-token-here
   ```

## Important Notes

- **`.env.development.local`** is already in `.gitignore` - it won't be committed
- Local development uses localStorage (doesn't need KV)
- KV is only used in production (Vercel serverless functions)
- You can test locally without KV - orders will just use localStorage

## When Do You Need KV Locally?

- Only if you want to test the API endpoints locally
- The API functions run on Vercel in production, so KV is automatically available there
- For local frontend development, you don't need KV

## Quick Test

After pulling env vars, verify:
```bash
cat .env.development.local | grep KV
```

You should see:
```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```



