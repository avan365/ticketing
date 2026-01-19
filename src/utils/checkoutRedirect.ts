// Utility to handle Stripe Checkout redirects (Apple Pay, GrabPay)
import { saveOrder, type Order } from "./orders";
import { generateOrderQRCodes } from "./qrcode";
import { sendCustomerConfirmation } from "./email";
import { confirmPurchase } from "./inventory";
import { getFeeBreakdown, API_URL } from "./stripe";
import type { CartItem } from "../App";

export interface CheckoutSessionData {
  sessionId: string;
  paymentStatus: string;
  amountTotal: number;
  currency: string;
  customerEmail: string;
  metadata: {
    customerName?: string;
    customerEmail?: string;
    orderDetails?: string;
    cartData?: string; // JSON string of cart items
    paymentMethod?: string;
  };
  paymentIntentId: string | null;
}

/**
 * Retrieve checkout session details from Stripe
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<CheckoutSessionData | null> {
  try {
    const response = await fetch(
      `${API_URL}/api/get-checkout-session?session_id=${sessionId}`
    );

    if (!response.ok) {
      throw new Error("Failed to retrieve checkout session");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error retrieving checkout session:", error);
    return null;
  }
}

/**
 * Process completed checkout session and create order
 */
export async function processCheckoutSession(
  sessionData: CheckoutSessionData
): Promise<{ success: boolean; orderNumber?: string; error?: string }> {
  try {
    // Parse metadata
    const metadata = sessionData.metadata || {};
    const customerName = metadata.customerName || "";
    const customerEmail = sessionData.customerEmail || metadata.customerEmail || "";
    const paymentMethod = metadata.paymentMethod || "card";
    
    // Parse cart data from metadata or sessionStorage
    let cartItems: CartItem[] = [];
    
    // Try metadata first
    if (metadata.cartData) {
      try {
        const parsed = JSON.parse(metadata.cartData);
        // Ensure it's an array
        if (Array.isArray(parsed)) {
          cartItems = parsed;
        }
      } catch (e) {
        console.error("Failed to parse cart data from metadata:", e);
      }
    }
    
    // Fallback to sessionStorage if metadata doesn't have cart
    if (cartItems.length === 0) {
      const storedCart = sessionStorage.getItem("checkout_cart");
      if (storedCart) {
        try {
          const parsed = JSON.parse(storedCart);
          if (Array.isArray(parsed)) {
            cartItems = parsed;
          }
        } catch (e) {
          console.error("Failed to parse cart from sessionStorage:", e);
        }
      }
    }

    if (cartItems.length === 0) {
      throw new Error("No cart data found. Cannot create order.");
    }

    if (!customerName || !customerEmail) {
      throw new Error("Missing customer information");
    }

    // Check payment status
    if (sessionData.paymentStatus !== "paid") {
      throw new Error(`Payment not completed. Status: ${sessionData.paymentStatus}`);
    }

    // Generate order number
    const orderNumber = `MASK-${Math.random()
      .toString(36)
      .substring(2, 11)
      .toUpperCase()}`;

    // Calculate total price from cart
    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.ticket.price * item.quantity,
      0
    );

    // Determine payment method for fee calculation
    const stripeMethod =
      paymentMethod === "apple_pay"
        ? "apple_pay"
        : paymentMethod === "grabpay"
        ? "grabpay"
        : "card";

    // Calculate fees
    const fees = getFeeBreakdown(totalPrice, stripeMethod);

    // Generate QR codes for all tickets
    const ticketList = cartItems.map((item) => ({
      name: item.ticket.name,
      quantity: item.quantity,
    }));
    const qrCodes = await generateOrderQRCodes(
      orderNumber,
      ticketList,
      customerName
    );

    // Create order
    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber,
      createdAt: new Date().toISOString(),
      status: "verified", // Stripe payments are auto-verified
      paymentMethod: paymentMethod as "card",
      customerName,
      customerEmail,
      customerPhone: "", // Not available from checkout session
      tickets: cartItems.map((item) => ({
        name: item.ticket.name,
        quantity: item.quantity,
        price: item.ticket.price,
      })),
      totalAmount: fees.total,
      ticketSubtotal: fees.ticketPrice,
      platformFee: fees.platformFee,
      stripeFee: fees.stripeFee,
      customerPays: fees.subtotal,
      individualTickets: qrCodes.map((qr) => ({
        ticketId: qr.ticketId,
        ticketType: qr.ticketType,
        qrCodeDataUrl: qr.qrCodeDataUrl,
        status: "valid" as const,
      })),
      adminNotes: `Payment ID: ${sessionData.paymentIntentId || sessionData.sessionId}, Method: ${paymentMethod}, Platform Fee: $${fees.platformFee}, Stripe Fee: $${fees.stripeFee}`,
    };

    // Save order
    await saveOrder(order);

    // Send confirmation email
    await sendCustomerConfirmation(
      orderNumber,
      customerName,
      customerEmail,
      cartItems,
      fees.total,
      paymentMethod,
      true, // isVerified
      qrCodes
    );

    // Update inventory
    confirmPurchase(
      cartItems.map((item) => ({
        ticketId: item.ticket.id,
        quantity: item.quantity,
      }))
    );

    // Clear stored cart
    sessionStorage.removeItem("checkout_cart");

    return { success: true, orderNumber };
  } catch (error) {
    console.error("❌ Error processing checkout session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

