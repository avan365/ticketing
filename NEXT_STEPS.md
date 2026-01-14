# Next Steps - Production Ready Checklist

## ✅ COMPLETED

- ✅ **Database Setup** - Redis is working! Orders persist across devices
- ✅ **Order Management API** - Server-side order storage via `/api/orders`
- ✅ **Cross-Device Access** - Bouncer can scan tickets from any device
- ✅ **QR Code System** - Individual QR codes for each ticket
- ✅ **Email Integration** - QR codes sent in confirmation emails
- ✅ **Admin Dashboard** - Order verification and management
- ✅ **Bouncer Portal** - QR scanning and ticket validation

---

## 🎯 NEXT STEPS (Priority Order)

### 1. 🔴 HIGH PRIORITY: Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

#### Already Set:

- ✅ `REDIS_URL` - Your Redis connection string

#### Still Need:

- [ ] `STRIPE_SECRET_KEY` - Your Stripe **live** secret key (starts with `sk_live_`)

  - Get from: https://dashboard.stripe.com/apikeys
  - **Important:** Switch from test mode (`sk_test_`) to live mode (`sk_live_`) for production

- [ ] `STRIPE_PUBLISHABLE_KEY` - Update in code (see Step 2)

  - Currently hardcoded in `src/utils/stripe.ts`
  - Should use live key: `pk_live_...`

- [ ] `EMAILJS_PUBLIC_KEY` - Your EmailJS public key
- [ ] `EMAILJS_SERVICE_ID` - Your EmailJS service ID
- [ ] `EMAILJS_TEMPLATE_ID` - Your EmailJS template ID
  - Get from: https://dashboard.emailjs.com/admin

### 2. 🔴 HIGH PRIORITY: Switch to Stripe Live Mode

**Before going live, you MUST switch from test to live mode:**

1. **Get Live Keys:**

   - Go to Stripe Dashboard → API Keys
   - Toggle "Test mode" OFF (switches to Live mode)
   - Copy the **live** secret key (`sk_live_...`)
   - Copy the **live** publishable key (`pk_live_...`)

2. **Update Environment Variables:**

   - Add `STRIPE_SECRET_KEY` = `sk_live_...` in Vercel
   - Set for **Production** environment

3. **Update Code:**

   - Edit `src/utils/stripe.ts`
   - Change `STRIPE_PUBLISHABLE_KEY` to your live key
   - Commit and push

4. **Test with Real Payment:**
   - Make a small test purchase ($1-5)
   - Verify payment goes through
   - Check Stripe Dashboard for the payment

### 3. 🟡 MEDIUM PRIORITY: Security

- [ ] **Change Admin Password**

  - Currently: `adheeraa2026`
  - Edit: `src/utils/orders.ts` → `ADMIN_PASSWORD`
  - Change to something secure

- [ ] **Change Override Password** (if used)
  - Edit: `src/components/AdminDashboard.tsx` → `OVERRIDE_PASSWORD`
  - Change to something secure

### 4. 🟡 MEDIUM PRIORITY: Final Testing

Test the complete flow:

- [ ] **Customer Purchase:**

  - [ ] Customer buys ticket on phone
  - [ ] Order appears in admin dashboard
  - [ ] Email received with QR codes
  - [ ] QR codes display correctly in email

- [ ] **Admin Verification:**

  - [ ] Admin verifies PayNow order
  - [ ] Status updates to "verified"
  - [ ] Email sent to customer after verification

- [ ] **Bouncer Scanning:**
  - [ ] Bouncer scans QR code from customer's phone
  - [ ] Ticket validates successfully
  - [ ] Status updates in admin dashboard
  - [ ] Can't scan same ticket twice

### 5. 🟢 LOW PRIORITY: Optional Improvements

- [ ] Set up Stripe webhooks (for automatic payment confirmations)
- [ ] Add error tracking (Sentry, LogRocket)
- [ ] Set up monitoring/alerts
- [ ] Create backup strategy for Redis database
- [ ] Test with high volume (if expecting many orders)

---

## 🚀 Quick Start Guide

### Step 1: Set Stripe Live Keys (5 minutes)

1. Go to Stripe Dashboard → Toggle to Live mode
2. Copy live secret key → Add to Vercel as `STRIPE_SECRET_KEY`
3. Copy live publishable key → Update in `src/utils/stripe.ts`
4. Commit and push

### Step 2: Verify EmailJS (2 minutes)

1. Check EmailJS Dashboard → Your template
2. Verify it has `{{{qr_codes}}}` (triple braces)
3. Test send an email
4. Verify EmailJS keys are set in Vercel (if using env vars)

### Step 3: Change Passwords (2 minutes)

1. Edit `src/utils/orders.ts` → Change `ADMIN_PASSWORD`
2. Edit `src/components/AdminDashboard.tsx` → Change `OVERRIDE_PASSWORD` (if exists)
3. Commit and push

### Step 4: Final Test (10 minutes)

1. Make a test purchase
2. Verify order in admin
3. Verify order
4. Scan ticket with bouncer
5. Verify everything works end-to-end

---

## 📊 Current Status

| Feature         | Status               | Notes                         |
| --------------- | -------------------- | ----------------------------- |
| Database        | ✅ Working           | Redis connection established  |
| Order Storage   | ✅ Working           | Orders persist across devices |
| QR Codes        | ✅ Working           | Individual codes per ticket   |
| Email           | ✅ Working           | QR codes in emails            |
| Admin Dashboard | ✅ Working           | Order management              |
| Bouncer Portal  | ✅ Working           | QR scanning works             |
| Stripe Payments | ⚠️ Test Mode         | Need to switch to live        |
| Security        | ⚠️ Default Passwords | Should change                 |
| Monitoring      | ❌ Not Set           | Optional                      |

---

## 🎉 You're Almost Ready!

The core functionality is working. Just need to:

1. Switch to Stripe live keys
2. Change admin passwords
3. Do a final end-to-end test

Then you're ready to go live! 🚀
