# Quick Setup Guide

## ✅ Current Status

Your setup looks good! Here's what's already configured:

- ✅ Frontend dependencies installed
- ✅ Backend dependencies installed  
- ✅ `.env` file exists with Stripe keys configured
- ✅ Backend configured to run on port 3001
- ✅ Frontend configured to run on port 5173

## 🚀 Starting the Application

You have **two options** to start the development servers:

### Option 1: Use the Startup Script (Easiest)

Run this single command to start both servers:

```bash
./start-dev.sh
```

This will:
- Start the backend server on `http://localhost:3001`
- Start the frontend server on `http://localhost:5173`
- Show logs from both servers
- Stop both when you press Ctrl+C

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 📋 Verification Checklist

Once both servers are running, verify:

1. **Backend is running:**
   - Visit `http://localhost:3001` in your browser
   - You should see: `{"status":"ok","message":"ADHEERAA Payment Server",...}`

2. **Frontend is running:**
   - Visit `http://localhost:5173` in your browser
   - You should see the ADHEERAA Masquerade Night website

3. **Connection works:**
   - Try making a test purchase (use Stripe test card: `4242 4242 4242 4242`)
   - Check browser console for any connection errors

## 🔧 Troubleshooting

**Port already in use (EADDRINUSE error):**
This happens when a previous server instance is still running. Fix it by:

**Option 1: Use the stop script**
```bash
./stop-dev.sh
```

**Option 2: Manual kill**
- Backend (3001): `lsof -ti:3001 | xargs kill -9`
- Frontend (5173): `lsof -ti:5173 | xargs kill -9`

**Backend won't start:**
- Check that `.env` file exists in `server/` directory
- Verify Stripe key is correct (starts with `sk_test_`)

**Frontend can't connect:**
- Make sure backend is running first
- Check browser console for CORS errors
- Verify `API_URL` in `src/utils/stripe.ts` points to `http://localhost:3001`

## 🎯 Next Steps

1. Start both servers using one of the methods above
2. Open `http://localhost:5173` in your browser
3. Test the ticket purchase flow
4. Check server logs for any errors

## 📝 Environment Variables

Your current `.env` configuration:
- `STRIPE_SECRET_KEY`: ✅ Configured
- `PORT`: 3001
- `FRONTEND_URL`: http://localhost:5173

If you need to update Stripe keys, edit `server/.env` file.

