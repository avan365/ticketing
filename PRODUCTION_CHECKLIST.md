# Production Deployment Checklist

## ✅ What's Working Now
- ✅ Orders stored server-side (via `/api/orders.js`)
- ✅ Cross-device order access (bouncer can scan tickets from any device)
- ✅ Order verification updates status correctly
- ✅ QR code generation and scanning
- ✅ Email confirmation with QR codes
- ✅ Admin dashboard with order management
- ✅ Bouncer portal for ticket scanning

## 🔴 CRITICAL: Database Migration Required

**Current Issue:** Orders are stored in `/tmp` file which **won't persist** across Vercel serverless function restarts.

**You MUST migrate to a real database before going live!**

### Recommended Options:

#### Option 1: Vercel KV (Easiest for Vercel)
```bash
# In Vercel Dashboard:
1. Go to Storage → Create Database → KV
2. Get connection string
3. Add to Environment Variables: KV_REST_API_URL, KV_REST_API_TOKEN
```

#### Option 2: MongoDB Atlas (Free tier available)
```bash
# 1. Sign up at mongodb.com/atlas
# 2. Create free cluster
# 3. Get connection string
# 4. Add to Vercel: MONGODB_URI
```

#### Option 3: Supabase (PostgreSQL, free tier)
```bash
# 1. Sign up at supabase.com
# 2. Create project
# 3. Get connection string
# 4. Add to Vercel: SUPABASE_URL, SUPABASE_KEY
```

**After choosing a database, you'll need to update `/api/orders.js` to use it instead of file storage.**

---

## 📋 Pre-Production Checklist

### 1. Environment Variables (Vercel Dashboard)
Set these in Vercel → Your Project → Settings → Environment Variables:

- [ ] `STRIPE_SECRET_KEY` - Your Stripe **live** secret key (starts with `sk_live_`)
- [ ] `STRIPE_PUBLISHABLE_KEY` - Your Stripe **live** publishable key (starts with `pk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (for payment confirmations)
- [ ] `EMAILJS_PUBLIC_KEY` - Your EmailJS public key
- [ ] `EMAILJS_SERVICE_ID` - Your EmailJS service ID
- [ ] `EMAILJS_TEMPLATE_ID` - Your EmailJS template ID
- [ ] Database connection variables (if using database)

### 2. Stripe Configuration
- [ ] Switch from test mode to live mode
- [ ] Update `STRIPE_PUBLISHABLE_KEY` in `src/utils/stripe.ts` to use live key
- [ ] Set up webhook endpoint in Stripe Dashboard:
  - URL: `https://your-domain.vercel.app/api/webhook`
  - Events: `payment_intent.succeeded`, `checkout.session.completed`
- [ ] Test with real payment (small amount)

### 3. EmailJS Setup
- [ ] Verify EmailJS template has `{{{qr_codes}}}` (triple braces) for HTML rendering
- [ ] Test email delivery with real email address
- [ ] Check spam folder if emails not arriving

### 4. Testing Checklist
- [ ] **Customer Flow:**
  - [ ] Customer can purchase tickets on phone
  - [ ] Order appears in admin dashboard
  - [ ] Email with QR codes is received
  - [ ] QR codes are visible in email

- [ ] **Admin Flow:**
  - [ ] Can access admin page with password
  - [ ] Can verify PayNow orders
  - [ ] Status updates correctly after verification
  - [ ] Email sent after verification

- [ ] **Bouncer Flow:**
  - [ ] Can access bouncer page
  - [ ] Camera works for QR scanning
  - [ ] Can scan tickets from customer's phone
  - [ ] Ticket validation works correctly
  - [ ] Status updates in admin dashboard after scan

### 5. Security
- [ ] Change admin password in `src/utils/orders.ts` (currently `adheeraa2026`)
- [ ] Change override password in `src/components/AdminDashboard.tsx` (if used)
- [ ] Ensure admin and bouncer pages are not publicly accessible (password protected)

### 6. Domain & URLs
- [ ] Update `FRONTEND_URL` in environment variables to your production domain
- [ ] Update CORS settings in `/api/orders.js` if needed
- [ ] Test API endpoints are accessible

### 7. Performance
- [ ] Test on slow mobile connection
- [ ] Verify QR code scanning works in low light
- [ ] Check page load times

---

## 🚀 Deployment Steps

1. **Push to GitHub** (if not already)
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect GitHub repo to Vercel
   - Vercel will auto-deploy on push

3. **Set Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables (see checklist above)

4. **Test Production**
   - Test full flow on production URL
   - Verify orders persist (after database migration)

5. **Monitor**
   - Check Vercel logs for errors
   - Monitor Stripe dashboard for payments
   - Check email delivery rates

---

## ⚠️ Important Notes

1. **Database is REQUIRED** - The current `/tmp` file storage will lose data on serverless function restarts. Don't go live without a database!

2. **Test Mode vs Live Mode** - Make sure you're using **live** Stripe keys in production, not test keys.

3. **EmailJS Limits** - Free tier has limits (200 emails/month). Consider upgrading if expecting high volume.

4. **Backup Strategy** - Set up regular backups of your database once migrated.

5. **Monitoring** - Consider adding error tracking (Sentry, LogRocket) for production.

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **EmailJS Docs:** https://www.emailjs.com/docs
- **Vercel KV:** https://vercel.com/docs/storage/vercel-kv

---

## Next Steps (Priority Order)

1. **🔴 URGENT:** Migrate to database (Vercel KV, MongoDB, or Supabase)
2. **🟡 HIGH:** Set all environment variables in Vercel
3. **🟡 HIGH:** Switch to Stripe live keys
4. **🟢 MEDIUM:** Test full flow end-to-end
5. **🟢 MEDIUM:** Change admin passwords
6. **🟢 LOW:** Set up monitoring/error tracking

