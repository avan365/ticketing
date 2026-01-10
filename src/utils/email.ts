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
 */
export const sendCustomerConfirmation = async (
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  cart: CartItem[],
  totalAmount: number,
  paymentMethod: "paynow" | "card"
): Promise<boolean> => {
  const ticketDetails = cart
    .map(
      (item) =>
        `${item.quantity}x ${item.ticket.name} - $${
          item.ticket.price * item.quantity
        }`
    )
    .join("\n");

  const templateParams = {
    // Customer info
    to_name: customerName,
    to_email: customerEmail, // This sends TO the customer

    // Order info
    order_number: orderNumber,
    tickets: ticketDetails,
    total_amount: `$${totalAmount.toFixed(2)}`,
    payment_method:
      paymentMethod === "paynow"
        ? "PayNow (Pending Verification)"
        : "Credit Card",
    payment_status:
      paymentMethod === "paynow" ? "Pending Verification" : "Confirmed",

    // Event info
    event_name: "ADHEERAA Masquerade Night",
    event_date: "February 14, 2026",
    event_time: "7:00 PM",
    event_venue: "Grand Ballroom, Marina Bay Sands",
  };

  // Check if EmailJS is configured
  if (
    EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" ||
    EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID" ||
    EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY"
  ) {
    console.log(
      "📧 EmailJS not configured yet. Customer confirmation email simulated:"
    );
    console.log("To:", customerEmail);
    console.log("Subject: Your ADHEERAA Ticket Order #" + orderNumber);
    console.log("Details:", templateParams);
    return true; // Return success to not block the flow
  }

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

/**
 * Check if EmailJS is properly configured
 */
export const isEmailConfigured = (): boolean => {
  return (
    EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" &&
    EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID" &&
    EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY"
  );
};
