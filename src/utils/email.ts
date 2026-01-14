import emailjs from "@emailjs/browser";
import type { CartItem } from "../App";
import type { TicketQR } from "./qrcode";
import jsPDF from "jspdf";
import { EventConfig } from "../config/eventConfig";

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
 * Generate PDF with all ticket QR codes
 */
export async function generateTicketsPDF(
  orderNumber: string,
  customerName: string,
  tickets: TicketQR[]
): Promise<string> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const qrSize = 60;
  const spacing = 80;

  // Header
  pdf.setFontSize(20);
  pdf.text(EventConfig.event.fullTitle, pageWidth / 2, 30, { align: "center" });
  pdf.setFontSize(14);
  pdf.text(`Order: ${orderNumber}`, pageWidth / 2, 40, { align: "center" });
  pdf.text(`Customer: ${customerName}`, pageWidth / 2, 50, { align: "center" });

  let yPos = 70;
  let pageNum = 1;

  for (let i = 0; i < tickets.length; i++) {
    if (yPos + spacing > pageHeight - margin) {
      pdf.addPage();
      pageNum++;
      yPos = margin;
    }

    const ticket = tickets[i];

    // Ticket info
    pdf.setFontSize(12);
    pdf.text(`Ticket ${i + 1} of ${tickets.length}`, margin, yPos);
    pdf.setFontSize(10);
    pdf.text(`Type: ${ticket.ticketType}`, margin, yPos + 10);
    pdf.text(`ID: ${ticket.ticketId}`, margin, yPos + 16);

    // QR Code
    pdf.addImage(
      ticket.qrCodeDataUrl,
      "PNG",
      pageWidth - margin - qrSize,
      yPos - 5,
      qrSize,
      qrSize
    );

    yPos += spacing;
  }

  return pdf.output("datauristring");
}

/**
 * Send confirmation email to CUSTOMER (not admin)
 * Admin can view all orders in the Admin Dashboard (/admin or click Admin button)
 *
 * @param isVerified - Set to true when admin verifies a PayNow payment (shows "Confirmed" instead of "Pending")
 * @param qrCodes - Array of ticket QR codes to include in email
 */
export const sendCustomerConfirmation = async (
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  cart: CartItem[],
  totalAmount: number,
  paymentMethod: "paynow" | "card",
  isVerified: boolean = false, // Default false for immediate card payments, true when admin verifies PayNow
  qrCodes?: TicketQR[] // QR codes for tickets
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

  // Build QR codes HTML if available
  let qrCodesHtml = "";
  if (qrCodes && qrCodes.length > 0) {
    qrCodesHtml = qrCodes
      .map(
        (qr, index) => `
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #facc15;">Ticket ${index + 1}: ${
          qr.ticketType
        }</h3>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">Ticket ID: ${
          qr.ticketId
        }</p>
        <img src="${qr.qrCodeDataUrl}" alt="QR Code ${
          index + 1
        }" style="max-width: 200px; margin: 10px 0;" />
      </div>
    `
      )
      .join("");
  }

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
    qr_codes: qrCodesHtml, // HTML with QR code images

    // Event info (from config)
    event_name: EventConfig.event.name,
    event_subtitle: EventConfig.event.subtitle,
    event_year: EventConfig.event.year,
    event_date: EventConfig.dateTime.date,
    event_time: EventConfig.dateTime.time,
    event_venue: EventConfig.venue.fullAddress,
    copyright_text: EventConfig.branding.copyright,
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
