// Vercel Serverless Function for Stripe Checkout Session (GrabPay, Apple Pay)
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

    // Get frontend URL from environment or use request origin
    const frontendUrl = process.env.FRONTEND_URL || 
      (req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173');

    // Map payment method to Stripe payment_method_types
    const paymentMethodTypes = {
      grabpay: ['grabpay'],
      card: ['card'],
      apple_pay: ['card'], // Apple Pay uses card payment method type in Checkout
    };

    console.log('Creating Checkout Session:', { 
      amount, 
      customerEmail, 
      customerName, 
      paymentMethod,
      paymentMethodTypes: paymentMethodTypes[paymentMethod] || ['card']
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes[paymentMethod] || ['card'],
      line_items: [{
        price_data: {
          currency: 'sgd',
          product_data: {
            name: 'ADHEERAA Masquerade Night Tickets',
            description: orderDetails?.tickets || 'Event tickets',
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl || `${frontendUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${frontendUrl}?canceled=true`,
      customer_email: customerEmail,
      metadata: {
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        orderDetails: JSON.stringify(orderDetails || {}),
      },
    });

    console.log('✅ Checkout Session created:', session.id);

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Error creating Checkout Session:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

