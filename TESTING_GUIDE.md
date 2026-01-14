# Testing Vercel KV Database Integration

## Pre-Test Checklist

Before testing, make sure:
- [ ] KV database created in Vercel (via Marketplace)
- [ ] `KV_REST_API_URL` environment variable set in Vercel
- [ ] `KV_REST_API_TOKEN` environment variable set in Vercel
- [ ] Project redeployed after adding environment variables

## Step 1: Verify Environment Variables

1. **Check Vercel Dashboard**
   - Go to your project → **Settings** → **Environment Variables**
   - Verify you see:
     - `KV_REST_API_URL` ✅
     - `KV_REST_API_TOKEN` ✅
   - Both should be set for Production environment

## Step 2: Test Order Creation

1. **Open your website**
   - Go to your Vercel deployment URL (e.g., `https://your-project.vercel.app`)

2. **Make a test purchase**
   - Add tickets to cart
   - Complete checkout (use Stripe test card: `4242 4242 4242 4242`)
   - Or complete PayNow checkout

3. **Check browser console** (F12 → Console tab)
   - Look for: `✅ Order saved: MASK-XXXXX`
   - No errors about KV

4. **Verify order appears in admin**
   - Go to `/admin` page
   - Enter password
   - Check if the new order appears in the list

## Step 3: Test Order Persistence

1. **Refresh the admin page**
   - Order should still be there ✅

2. **Close and reopen browser**
   - Order should still be there ✅

3. **Wait a few minutes, then refresh**
   - Order should still be there ✅
   - (This confirms KV is working, not just localStorage)

## Step 4: Test Cross-Device Access

1. **Create order on one device**
   - Use your phone or another device
   - Complete a purchase

2. **Check on another device**
   - Open admin page on your laptop/another device
   - Order should appear ✅

3. **Verify order is accessible**
   - Order should be visible on all devices
   - This confirms orders are in KV, not localStorage

## Step 5: Test Ticket Scanning

1. **Verify an order in admin**
   - Go to `/admin`
   - Find a verified order
   - Note the order number

2. **Test QR scanning**
   - Go to `/bouncer` page
   - Scan the QR code from the email
   - Ticket should validate successfully ✅

3. **Check status update**
   - Go back to `/admin` page
   - Order should show updated scan status ✅

## Step 6: Check Logs for Errors

1. **Vercel Dashboard Logs**
   - Go to Vercel Dashboard → Your Project → **Deployments**
   - Click on latest deployment → **Functions** tab
   - Look for `/api/orders` function logs
   - Check for any KV-related errors

2. **What to look for:**
   - ✅ `✅ Orders saved to Vercel KV: X orders` (success)
   - ❌ `⚠️ Vercel KV not configured` (env vars missing)
   - ❌ `Error reading orders from KV` (connection issue)

## Quick Test Script

You can also test the API directly:

```bash
# Test GET orders
curl https://your-project.vercel.app/api/orders

# Test POST order (create a test order)
curl -X POST https://your-project.vercel.app/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "TEST-123",
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "status": "verified"
  }'

# Test GET specific order
curl https://your-project.vercel.app/api/orders?orderNumber=TEST-123
```

## Common Issues & Solutions

### Issue: "Vercel KV not configured" warning
**Solution:**
- Check environment variables are set in Vercel Dashboard
- Make sure they're set for the correct environment (Production)
- Redeploy after adding environment variables

### Issue: Orders not appearing
**Check:**
1. Browser console for errors
2. Vercel function logs for errors
3. Network tab to see if API calls are failing

### Issue: Orders appear but disappear after refresh
**This means:**
- KV is NOT working (still using localStorage or file storage)
- Check environment variables are correct
- Check Vercel function logs

### Issue: Can't see orders on different device
**This means:**
- Orders are still in localStorage (device-specific)
- KV is not working
- Check environment variables and redeploy

## Success Indicators

You'll know KV is working when:
- ✅ Orders persist after page refresh
- ✅ Orders are visible on different devices
- ✅ Orders survive browser restart
- ✅ Vercel logs show "Orders saved to Vercel KV"
- ✅ No "KV not configured" warnings in logs

## Next Steps After Successful Test

Once everything works:
1. ✅ Test with real payment (small amount)
2. ✅ Test full flow: Purchase → Verify → Scan
3. ✅ Test on multiple devices simultaneously
4. ✅ Monitor Vercel logs for any issues
5. ✅ Remove old file storage code (optional)

