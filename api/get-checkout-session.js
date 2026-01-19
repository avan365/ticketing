// Vercel Serverless Function to retrieve Stripe Checkout Session details
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

  if (req.method !== 'GET') {
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
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    console.log('Retrieving Checkout Session:', session_id);

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent', 'line_items'],
    });

    console.log('✅ Checkout Session retrieved:', session.id);
    console.log('   Status:', session.payment_status);
    console.log('   Amount:', session.amount_total / 100, session.currency.toUpperCase());

    res.status(200).json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total / 100,
      currency: session.currency,
      customerEmail: session.customer_email,
      metadata: session.metadata || {},
      paymentIntentId: session.payment_intent?.id || null,
    });
  } catch (error) {
    console.error('❌ Error retrieving Checkout Session:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to retrieve checkout session',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

