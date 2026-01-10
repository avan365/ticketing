// Vercel Serverless Function for Stripe PaymentIntent
const Stripe = require('stripe');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe secret key is configured
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY environment variable is not set!');
    return res.status(500).json({ 
      error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in Vercel environment variables.' 
    });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const { amount, customerEmail, customerName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    console.log('Creating PaymentIntent:', { amount, customerEmail, customerName });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'sgd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerEmail: customerEmail || '',
        customerName: customerName || '',
      },
    });

    console.log('✅ PaymentIntent created:', paymentIntent.id);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('❌ Error creating PaymentIntent:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create payment intent',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

