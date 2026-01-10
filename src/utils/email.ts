import emailjs from "@emailjs/browser";
import type { CartItem } from "../App";

// ╔══════════════════════════════════════════════════════════════════╗
// ║                    EMAIL CONFIGURATION                            ║
// ║                                                                   ║
// ║  To enable email confirmations, follow these steps:               ║
// ║                                                                   ║
// ║  1. Go to https://www.emailjs.com and create a FREE account       ║
// ║  2. Add an Email Service (Gmail recommended):                     ║
// ║     - Click "Email Services" → "Add New Service"                  ║
// ║     - Choose Gmail, click "Connect Account"                       ║
// ║     - Copy the Service ID (e.g., "service_abc123")                ║
// ║                                                                   ║
// ║  3. Create an Email Template:                                     ║
// ║     - Click "Email Templates" → "Create New Template"             ║
// ║     - Use the template below (copy/paste into EmailJS)            ║
// ║     - Copy the Template ID (e.g., "template_xyz789")              ║
// ║                                                                   ║
// ║  4. Get your Public Key:                                          ║
// ║     - Click "Account" → "API Keys"                                ║
// ║     - Copy the Public Key                                         ║
// ║                                                                   ║
// ║  5. Replace the values below with your credentials                ║
// ╚══════════════════════════════════════════════════════════════════╝

// PayNow UEN (displayed to customers for payment)
export const PAYNOW_UEN = "202401234A"; // ← Replace with your actual UEN

// ┌─────────────────────────────────────────┐
// │   EMAILJS CREDENTIALS - FILL THESE IN   │
// └─────────────────────────────────────────┘
const EMAILJS_SERVICE_ID = "service_urmom123"; // From step 2
const EMAILJS_TEMPLATE_ID = "template_z872muk"; // From step 3
const EMAILJS_PUBLIC_KEY = "iqADYzOIdJ2fMOOW8"; // From step 4

// ============================================

/**
 * Send confirmation email to CUSTOMER (not admin)
 * Admin can view all orders in the Admin Dashboard (/admin or click Admin button)
 *
 * @param isVerified - Set to true when admin verifies a PayNow payment (shows "Confirmed" instead of "Pending")
 */
export const sendCustomerConfirmation = async (
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  cart: CartItem[],
  totalAmount: number,
  paymentMethod: "paynow" | "card",
  isVerified: boolean = false // Default false for immediate card payments, true when admin verifies PayNow
): Promise<boolean> => {
  const ticketDetails = cart
    .map(
      (item) =>
        `${item.quantity}x ${item.ticket.name} - $${
          item.ticket.price * item.quantity
        }`
    )
    .join("\n");

  // Determine payment status based on method and verification
  const paymentStatus =
    paymentMethod === "card" || isVerified
      ? "Confirmed"
      : "Pending Verification";
  const paymentMethodLabel =
    paymentMethod === "paynow"
      ? isVerified
        ? "PayNow (Verified)"
        : "PayNow (Pending Verification)"
      : "Credit Card";

  const templateParams = {
    // Customer info
    to_name: customerName,
    to_email: customerEmail, // This sends TO the customer

    // Order info
    order_number: orderNumber,
    tickets: ticketDetails,
    total_amount: `$${totalAmount.toFixed(2)}`,
    payment_method: paymentMethodLabel,
    payment_status: paymentStatus,

    // Event info
    event_name: "ADHEERAA Masquerade Night",
    event_date: "February 14, 2026",
    event_time: "7:00 PM",
    event_venue: "Grand Ballroom, Marina Bay Sands",
  };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log("✅ Customer confirmation email sent to:", customerEmail);
    return true;
  } catch (error) {
    console.error("❌ Failed to send customer email:", error);
    return false;
  }
};
