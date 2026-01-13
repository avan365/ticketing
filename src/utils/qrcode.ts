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
  ticketId: string,
  ticketType: string,
  customerName: string
): Promise<string> {
  // QR code data format: orderNumber|ticketId
  const qrData = `${orderNumber}|${ticketId}`;
  
  try {
    const dataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
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
        ticketId,
        ticket.name,
        customerName
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
 */
export function parseQRCodeData(qrData: string): { orderNumber: string; ticketId: string } | null {
  const parts = qrData.split('|');
  if (parts.length === 2) {
    return {
      orderNumber: parts[0],
      ticketId: parts[1],
    };
  }
  return null;
}

