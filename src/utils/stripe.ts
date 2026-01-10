import { loadStripe, type Stripe } from "@stripe/stripe-js";

// ============================================
// STRIPE CONFIGURATION
// ============================================

// Your Stripe publishable key (starts with pk_)
export const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51SnvrcBqx0IdgUymIqgd66nZuJLT1uHXDDGJXeFa2owUq8XwqC0h9nhFPweKsmj9S6tvulazraUn1ISK6Iz6B1zs00MhPWKU6S";

// Backend API URL
export const API_URL = "http://localhost:3001";

// ============================================
// PLATFORM FEE (Your profit margin)
// ============================================
export const PLATFORM_FEE_PERCENTAGE = 2; // 2% platform fee

// Calculate platform fee
export function calculatePlatformFee(amount: number): number {
  return Number((amount * (PLATFORM_FEE_PERCENTAGE / 100)).toFixed(2));
}

// ============================================
// STRIPE FEES (Payment processing)
// ============================================
// Source: https://stripe.com/sg/pricing
// These are added to the customer's total, so you receive the full amount
export const STRIPE_FEES = {
  card: { percentage: 3.4, fixed: 0.5, label: "3.4% + $0.50" },
  apple_pay: { percentage: 3.4, fixed: 0.5, label: "3.4% + $0.50" }, // Same as card
  google_pay: { percentage: 3.4, fixed: 0.5, label: "3.4% + $0.50" }, // Same as card
  grabpay: { percentage: 3.3, fixed: 0, label: "3.3%" }, // No fixed fee!
  paynow_stripe: { percentage: 1.3, fixed: 0, label: "1.3%" }, // PayNow via Stripe
};

// Calculate Stripe processing fee (on amount + platform fee)
export function calculateStripeFee(
  amount: number,
  method: keyof typeof STRIPE_FEES
): number {
  const fee = STRIPE_FEES[method];
  // Stripe fee is calculated on (ticket price + platform fee)
  const subtotalWithPlatformFee = amount + calculatePlatformFee(amount);
  return Number(
    (subtotalWithPlatformFee * (fee.percentage / 100) + fee.fixed).toFixed(2)
  );
}

// Calculate total with all fees (platform + Stripe)
export function calculateTotalWithFee(
  amount: number,
  method: keyof typeof STRIPE_FEES
): number {
  const platformFee = calculatePlatformFee(amount);
  const stripeFee = calculateStripeFee(amount, method);
  return Number((amount + platformFee + stripeFee).toFixed(2));
}

// Get breakdown of all fees
// Uses pass-through formula so you receive EXACTLY (ticket + platform fee) after Stripe takes their cut
export function getFeeBreakdown(
  amount: number,
  method: keyof typeof STRIPE_FEES
) {
  const platformFee = calculatePlatformFee(amount);
  const amountYouWant = amount + platformFee; // What you want to receive after Stripe fees

  // Pass-through formula: charge = (want + fixed) / (1 - percentage)
  // This ensures: charge - stripe_fee = amountYouWant
  const stripePercentage = STRIPE_FEES[method].percentage / 100;
  const stripeFixed = STRIPE_FEES[method].fixed;

  const totalToCharge = Number(
    ((amountYouWant + stripeFixed) / (1 - stripePercentage)).toFixed(2)
  );
  const stripeFee = Number((totalToCharge - amountYouWant).toFixed(2));

  return {
    ticketPrice: amount,
    platformFee,
    platformFeeLabel: `${PLATFORM_FEE_PERCENTAGE}%`,
    subtotal: amountYouWant,
    stripeFee,
    stripeFeeLabel: STRIPE_FEES[method].label,
    total: totalToCharge,
  };
}

// ============================================
// STRIPE INITIALIZATION
// ============================================

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_PUBLISHABLE_KEY.startsWith("pk_")) {
      console.warn("⚠️ Stripe publishable key not configured");
      return null;
    }
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export const isStripeConfigured = (): boolean => {
  return (
    Boolean(STRIPE_PUBLISHABLE_KEY) && STRIPE_PUBLISHABLE_KEY.startsWith("pk_")
  );
};

// Check if backend is available
export const isBackendAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    const data = await response.json();
    return data.status === "ok" && data.stripeConfigured;
  } catch {
    return false;
  }
};

// ============================================
// PAYMENT INTENT (For Card & Apple Pay)
// ============================================

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface OrderDetails {
  tickets: string;
  orderNumber?: string;
}

export async function createPaymentIntent(
  amount: number,
  customerEmail: string,
  customerName: string,
  orderDetails?: OrderDetails
): Promise<PaymentIntentResult | null> {
  // Check if backend is available
  const backendAvailable = await isBackendAvailable();

  if (!backendAvailable) {
    console.log("⚠️ Backend not available - using demo mode");
    // Demo mode - simulate successful payment
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      clientSecret: "pi_demo_" + Date.now() + "_secret_demo",
      paymentIntentId: "pi_demo_" + Date.now(),
    };
  }

  try {
    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        customerEmail,
        customerName,
        orderDetails,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create payment");
    }

    const data = await response.json();
    console.log("✅ PaymentIntent created:", data.paymentIntentId);
    return data;
  } catch (error) {
    console.error("❌ Error creating PaymentIntent:", error);
    throw error;
  }
}

// ============================================
// CHECKOUT SESSION (For GrabPay - redirect flow)
// ============================================

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(
  amount: number,
  customerEmail: string,
  customerName: string,
  paymentMethod: "grabpay" | "card",
  orderDetails?: OrderDetails
): Promise<CheckoutSessionResult | null> {
  const backendAvailable = await isBackendAvailable();

  if (!backendAvailable) {
    console.log("⚠️ Backend not available - using demo mode");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      sessionId: "cs_demo_" + Date.now(),
      url: window.location.href + "?demo_success=true",
    };
  }

  try {
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        customerEmail,
        customerName,
        paymentMethod,
        orderDetails,
        successUrl: `${window.location.origin}?success=true`,
        cancelUrl: `${window.location.origin}?canceled=true`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create checkout session");
    }

    const data = await response.json();
    console.log("✅ Checkout Session created:", data.sessionId);
    return data;
  } catch (error) {
    console.error("❌ Error creating Checkout Session:", error);
    throw error;
  }
}

// ============================================
// CONFIRM CARD PAYMENT (Using Stripe.js)
// ============================================

export async function confirmCardPayment(
  clientSecret: string,
  cardElement: unknown, // Stripe CardElement
  billingDetails: { name: string; email: string }
): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
  const stripe = await getStripe();

  if (!stripe) {
    // Demo mode
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { success: true, paymentIntentId: "pi_demo_" + Date.now() };
  }

  try {
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement as never,
          billing_details: billingDetails,
        },
      }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    if (paymentIntent?.status === "succeeded") {
      return { success: true, paymentIntentId: paymentIntent.id };
    }

    return { success: false, error: "Payment not completed" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Payment failed",
    };
  }
}
