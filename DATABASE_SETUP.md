# Vercel KV Database Setup Guide

## Step 1: Create Vercel KV Database

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project

2. **Create KV Database**
   - Go to **Storage** tab
   - Click **Create Database**
   - Select **KV** (Redis)
   - Choose a name (e.g., `adheeraa-kv`)
   - Select a region closest to you
   - Click **Create**

3. **Get Connection Details**
   - After creation, you'll see:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
   - Copy both values (you'll need them in Step 2)

## Step 2: Add Environment Variables

1. **In Vercel Dashboard**
   - Go to your project → **Settings** → **Environment Variables**
   - Click **Add New**

2. **Add KV_REST_API_URL**
   - Name: `KV_REST_API_URL`
   - Value: (paste the URL from Step 1)
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **Save**

3. **Add KV_REST_API_TOKEN**
   - Name: `KV_REST_API_TOKEN`
   - Value: (paste the token from Step 1)
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **Save**

## Step 3: Install KV Package (Already Done)

The `@vercel/kv` package has been added to `api/package.json`. Vercel will automatically install it on deployment.

## Step 4: Deploy

1. **Push to GitHub** (if you haven't already)
   ```bash
   git add .
   git commit -m "Migrate to Vercel KV database"
   git push origin main
   ```

2. **Vercel will auto-deploy**
   - Go to Vercel Dashboard → **Deployments**
   - Wait for deployment to complete

## Step 5: Verify It's Working

1. **Test Order Creation**
   - Make a test purchase on your site
   - Order should be saved to KV database

2. **Test Order Retrieval**
   - Check admin dashboard
   - Orders should appear
   - Verify orders persist after page refresh

3. **Test Cross-Device**
   - Create order on one device
   - Check on another device
   - Orders should be visible on both

## Troubleshooting

### "Vercel KV not configured" warning
- Make sure you added both environment variables
- Make sure they're set for the correct environment (Production/Preview/Development)
- Redeploy after adding environment variables

### Orders not persisting
- Check Vercel Dashboard → Storage → Your KV database
- Verify environment variables are correct
- Check deployment logs for errors

### Cannot read property 'get' of undefined
- Make sure `@vercel/kv` package is installed
- Try redeploying

## Migration from File Storage

If you had existing orders in the old file storage, they won't automatically migrate. You'll need to:

1. Export old orders (if any) from admin dashboard (CSV export)
2. Re-import manually or create them again
3. All new orders will be saved to KV

## Benefits of Vercel KV

✅ **Persistent** - Orders survive serverless function restarts  
✅ **Fast** - Redis is extremely fast  
✅ **Scalable** - Handles high volume  
✅ **Integrated** - Works seamlessly with Vercel  
✅ **Free Tier** - 256 MB storage, 30M requests/month

## Cost

- **Free Tier**: 256 MB storage, 30M requests/month
- **Paid**: $0.20/GB storage, $0.50 per million requests after free tier
- For a ticket system, free tier should be more than enough!

## Next Steps

After KV is set up:
1. ✅ Test order creation
2. ✅ Test order retrieval
3. ✅ Test cross-device access
4. ✅ Verify orders persist
5. ✅ Remove old file storage code (optional, after confirming KV works)

---

**Need Help?**
- Vercel KV Docs: https://vercel.com/docs/storage/vercel-kv
- Vercel Support: https://vercel.com/support

