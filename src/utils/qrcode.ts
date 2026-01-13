import QRCode from 'qrcode';

export interface TicketQR {
  ticketId: string; // Unique ID for each individual ticket
  qrCodeDataUrl: string; // Base64 data URL of QR code image
  orderNumber: string;
  ticketType: string;
  customerName: string;
}

/**
 * Generate QR code data URL for a ticket
 * QR code contains: orderNumber|ticketId (e.g., "ORD-12345|TKT-abc123")
 */
export async function generateTicketQR(
  orderNumber: string,
  ticketId: string
): Promise<string> {
  // QR code data format: orderNumber|ticketId
  const qrData = `${orderNumber}|${ticketId}`;
  
  try {
    const dataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 300,
    });
    
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR codes for all tickets in an order
 */
export async function generateOrderQRCodes(
  orderNumber: string,
  tickets: Array<{ name: string; quantity: number }>,
  customerName: string
): Promise<TicketQR[]> {
  const qrCodes: TicketQR[] = [];
  
  for (const ticket of tickets) {
    for (let i = 0; i < ticket.quantity; i++) {
      // Generate unique ticket ID for each individual ticket
      const ticketId = `TKT-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      const qrDataUrl = await generateTicketQR(
        orderNumber,
        ticketId
      );
      
      qrCodes.push({
        ticketId,
        qrCodeDataUrl: qrDataUrl,
        orderNumber,
        ticketType: ticket.name,
        customerName,
      });
    }
  }
  
  return qrCodes;
}

/**
 * Parse QR code data
 * Returns { orderNumber, ticketId } or null if invalid
 * Handles various formats and normalizes whitespace
 */
export function parseQRCodeData(qrData: string): { orderNumber: string; ticketId: string } | null {
  // Clean the data: remove all extra whitespace
  const cleaned = qrData.trim().replace(/\s+/g, ' ');
  
  // Try splitting by pipe first (standard format: "ORDER|TICKET")
  let parts = cleaned.split('|');
  
  // If no pipe, try other separators
  if (parts.length !== 2) {
    // Try space as separator (in case pipe was lost)
    parts = cleaned.split(/\s+/);
    if (parts.length >= 2) {
      // Take first part as order, rest as ticket ID
      parts = [parts[0], parts.slice(1).join('')];
    }
  }
  
  if (parts.length === 2) {
    // Normalize: remove all spaces, uppercase
    const orderNumber = parts[0].replace(/\s+/g, '').toUpperCase();
    const ticketId = parts[1].replace(/\s+/g, '').toUpperCase();
    
    return {
      orderNumber,
      ticketId,
    };
  }
  
  return null;
}

