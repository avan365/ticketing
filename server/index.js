/**
 * ADHEERAA Payment Server
 * Backend for Stripe payment processing
 * 
 * SETUP:
 * 1. Create a .env file in this folder with:
 *    STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
 *    STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET (optional, for webhooks)
 *    PORT=3001
 *    FRONTEND_URL=http://localhost:5173
 * 
 * 2. Get your secret key from: https://dashboard.stripe.com/apikeys
 * 3. Run: npm install && npm run dev
 */

import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_SECRET_KEY';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY);

// Initialize Express
const app = express();

// CORS - allow frontend to call this server
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

// Parse JSON (except for webhooks which need raw body)
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ADHEERAA Payment Server',
    stripeConfigured: STRIPE_SECRET_KEY !== 'sk_test_YOUR_SECRET_KEY',
  });
});

// ============================================
// CREATE PAYMENT INTENT (Card payments)
// ============================================
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, customerEmail, customerName, orderDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: 'sgd',
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: customerEmail,
      metadata: {
        customerName,
        customerEmail,
        orderDetails: JSON.stringify(orderDetails || {}),
      },
    });

    console.log('✅ PaymentIntent created:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('❌ Error creating PaymentIntent:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CREATE CHECKOUT SESSION (GrabPay, redirect-based)
// ============================================
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { 
      amount, 
      customerEmail, 
      customerName, 
      paymentMethod,
      orderDetails,
      successUrl,
      cancelUrl,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Map payment method to Stripe payment_method_types
    const paymentMethodTypes = {
      grabpay: ['grabpay'],
      card: ['card'],
      apple_pay: ['card'], // Apple Pay uses card payment method type
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes[paymentMethod] || ['card'],
      line_items: [{
        price_data: {
          currency: 'sgd',
          product_data: {
            name: 'ADHEERAA Masquerade Night Tickets',
            description: orderDetails?.tickets || 'Event tickets',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl || `${FRONTEND_URL}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${FRONTEND_URL}?canceled=true`,
      customer_email: customerEmail,
      metadata: {
        customerName,
        customerEmail,
        orderDetails: JSON.stringify(orderDetails || {}),
      },
    });

    console.log('✅ Checkout Session created:', session.id);

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Error creating Checkout Session:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// WEBHOOK (Stripe sends payment confirmations here)
// ============================================
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    if (STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('💰 Payment succeeded:', paymentIntent.id);
      console.log('   Amount:', paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
      console.log('   Customer:', paymentIntent.metadata.customerEmail);
      // TODO: Send confirmation email, update database, etc.
      break;

    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('💰 Checkout completed:', session.id);
      console.log('   Amount:', session.amount_total / 100, session.currency.toUpperCase());
      console.log('   Customer:', session.customer_email);
      // TODO: Send confirmation email, update database, etc.
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ Payment failed:', failedPayment.id);
      console.log('   Reason:', failedPayment.last_payment_error?.message);
      break;

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// ============================================
// GET PAYMENT STATUS
// ============================================
app.get('/api/payment-status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('❌ Error fetching payment status:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('🎭 ADHEERAA Payment Server');
  console.log('==========================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Frontend URL: ${FRONTEND_URL}`);
  console.log(`${STRIPE_SECRET_KEY !== 'sk_test_YOUR_SECRET_KEY' ? '✅' : '⚠️'} Stripe: ${STRIPE_SECRET_KEY !== 'sk_test_YOUR_SECRET_KEY' ? 'Configured' : 'NOT CONFIGURED - Add STRIPE_SECRET_KEY to .env'}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  POST /api/create-payment-intent  - Create card payment');
  console.log('  POST /api/create-checkout-session - Create GrabPay/redirect payment');
  console.log('  GET  /api/payment-status/:id     - Check payment status');
  console.log('  POST /webhook                    - Stripe webhooks');
  console.log('');
});

