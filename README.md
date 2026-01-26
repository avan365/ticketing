# ADHEERAA Masquerade Night - Local Development Setup

This project consists of a React frontend (Vite) and an Express backend server for ticket sales with Stripe payment integration.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- Stripe account (for payment processing)

## Quick Start

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 3. Configure Backend Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cd server
touch .env
```

Add the following to `server/.env`:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**To get your Stripe keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** (starts with `sk_test_` for test mode)
3. For webhooks (optional), you'll need to set up a webhook endpoint in Stripe Dashboard

### 4. Run the Backend Server

In a terminal, start the backend server:

```bash
cd server
npm run dev
```

The server will run on `http://localhost:3001`

### 5. Run the Frontend Development Server

In a **new terminal**, start the frontend:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (Vite's default port)

## Project Structure

```
adheera/
├── src/                    # React frontend source code
│   ├── components/         # React components
│   └── utils/             # Utility functions (Stripe, email, etc.)
├── server/                # Express backend server
│   ├── index.js           # Main server file
│   └── .env              # Environment variables (create this)
├── api/                   # Vercel serverless functions
├── public/                # Static assets
└── package.json           # Frontend dependencies
```

## Available Scripts

### Frontend (root directory)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend (server directory)
- `npm run dev` - Start server with auto-reload
- `npm start` - Start server (production mode)

## Development Notes

- The frontend automatically connects to `http://localhost:3001` in development mode
- The backend CORS is configured to allow requests from `http://localhost:5173`
- Stripe test mode keys start with `sk_test_` and `pk_test_`
- For production, use live keys (starting with `sk_live_` and `pk_live_`)

## Troubleshooting

**Backend won't start:**
- Make sure you've created the `.env` file in the `server/` directory
- Verify your Stripe secret key is correct
- Check that port 3001 is not already in use

**Frontend can't connect to backend:**
- Ensure the backend server is running on port 3001
- Check that CORS is properly configured in `server/index.js`
- Verify the `API_URL` in `src/utils/stripe.ts` points to `http://localhost:3001`

**Payment not working:**
- Verify your Stripe keys are correct
- Make sure you're using test mode keys for development
- Check the browser console and server logs for errors

## Production Deployment

The project is configured for Vercel deployment:
- Frontend: Deploy the root directory
- Backend API: The `api/` directory contains serverless functions
- Server: The `server/` directory can be deployed separately or converted to serverless functions



