// Order storage utility - stores orders in localStorage
// In production, you'd use a database like Firebase, Supabase, etc.

export interface IndividualTicket {
  ticketId: string; // Unique ID for each ticket (e.g., "TKT-ABC123")
  ticketType: string; // Ticket name (e.g., "Early Bird")
  qrCodeDataUrl: string; // Base64 QR code image
  status: 'valid' | 'used' | 'invalid'; // Ticket validation status
  scannedAt?: string; // When ticket was scanned
  scannedBy?: string; // Who scanned it (bouncer name/ID)
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: 'pending' | 'verified' | 'rejected';
  paymentMethod: 'paynow' | 'card';
  
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Order details
  tickets: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number; // Total amount customer paid (includes all fees)
  
  // Fee breakdown (for calculating revenue)
  ticketSubtotal?: number; // Sum of ticket prices (before any fees)
  platformFee?: number; // Platform fee amount
  stripeFee?: number; // Stripe processing fee (if applicable)
  customerPays?: number; // Amount customer pays (ticketSubtotal + platformFee, excludes Stripe fees)
  
  // Individual tickets with QR codes (optional for backward compatibility)
  individualTickets?: IndividualTicket[];
  
  // PayNow specific
  proofOfPayment?: string; // Base64 image
  
  // Admin notes
  adminNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

const ORDERS_KEY = 'adheeraa_orders';
const ADMIN_PASSWORD = 'adheeraa2026'; // Change this to your preferred password

export function getAdminPassword(): string {
  return ADMIN_PASSWORD;
}

// API URL - Uses relative path for Vercel, localhost for dev
const API_URL = import.meta.env.DEV ? "http://localhost:3001" : "";

export async function getAllOrders(): Promise<Order[]> {
  // In production (Vercel), fetch from API
  if (!import.meta.env.DEV) {
    try {
      const response = await fetch(`${API_URL}/api/orders`);
      if (!response.ok) {
        console.error('Failed to fetch orders from API');
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders from API:', error);
      // Fallback to localStorage if API fails
      try {
        const stored = localStorage.getItem(ORDERS_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  }
  
  // In development, use localStorage
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function saveOrder(order: Order): Promise<void> {
  // In production (Vercel), save to API
  if (!import.meta.env.DEV) {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save order');
      }
      // Also save to localStorage as backup
      const orders = await getAllOrders();
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      return;
    } catch (error) {
      console.error('Error saving order to API:', error);
      // Fallback to localStorage
    }
  }
  
  // In development, use localStorage
  const orders = await getAllOrders();
  orders.unshift(order); // Add to beginning (newest first)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export async function updateOrderStatus(
  orderId: string, 
  status: Order['status'], 
  adminNotes?: string
): Promise<void> {
  const orders = await getAllOrders();
  const index = orders.findIndex(o => o.id === orderId);
  
  if (index !== -1) {
    orders[index].status = status;
    if (adminNotes) orders[index].adminNotes = adminNotes;
    if (status === 'verified') {
      orders[index].verifiedAt = new Date().toISOString();
    }
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

/**
 * Find ticket by ticketId and update its status (case-insensitive)
 */
export async function updateTicketStatus(
  ticketId: string,
  status: IndividualTicket['status'],
  scannedBy?: string
): Promise<{ success: boolean; orderNumber?: string; ticketType?: string; error?: string }> {
  // In production (Vercel), update via API
  if (!import.meta.env.DEV) {
    try {
      const params = new URLSearchParams({ ticketId, status });
      if (scannedBy) params.append('scannedBy', scannedBy);
      
      const response = await fetch(`${API_URL}/api/orders/ticket?${params}`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to update ticket' };
      }
      
      // Fetch updated order to get details
      const ticketResponse = await fetch(`${API_URL}/api/orders?ticketId=${ticketId}`);
      if (ticketResponse.ok) {
        const { order, ticket } = await ticketResponse.json();
        return {
          success: true,
          orderNumber: order.orderNumber,
          ticketType: ticket.ticketType,
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating ticket via API:', error);
      // Fallback to localStorage
    }
  }
  
  // In development, use localStorage
  const orders = await getAllOrders();
  const normalizedTicketId = ticketId.trim().toUpperCase();
  
  for (const order of orders) {
    const ticket = order.individualTickets?.find(
      t => t.ticketId.toUpperCase() === normalizedTicketId
    );
    if (ticket) {
      ticket.status = status;
      if (status === 'used') {
        ticket.scannedAt = new Date().toISOString();
        ticket.scannedBy = scannedBy || 'bouncer';
      }
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      return {
        success: true,
        orderNumber: order.orderNumber,
        ticketType: ticket.ticketType,
      };
    }
  }
  
  return { success: false, error: 'Ticket not found' };
}

/**
 * Find ticket by order number and ticket ID (case-insensitive)
 */
export async function findTicket(orderNumber: string, ticketId: string): Promise<IndividualTicket | null> {
  const orders = await getAllOrders();
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();
  const normalizedTicketId = ticketId.trim().toUpperCase();
  
  const order = orders.find(o => o.orderNumber.toUpperCase() === normalizedOrderNumber);
  
  if (!order || !order.individualTickets) {
    return null;
  }
  
  return order.individualTickets.find(
    t => t.ticketId.toUpperCase() === normalizedTicketId
  ) || null;
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const orders = await getAllOrders();
  return orders.find(o => o.orderNumber === orderNumber) || null;
}

export async function deleteOrder(orderId: string): Promise<void> {
  const orders = (await getAllOrders()).filter(o => o.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export async function getOrderStats() {
  const orders = await getAllOrders();
  
  // Calculate revenue without platform fees (just ticket prices)
  const totalRevenue = orders
    .filter(o => o.status === 'verified')
    .reduce((sum, o) => {
      // If fee breakdown exists, use ticketSubtotal (revenue without platform fees)
      // Otherwise, calculate from tickets array (backward compatibility)
      if (o.ticketSubtotal !== undefined) {
        return sum + o.ticketSubtotal;
      }
      // Fallback: sum ticket prices
      return sum + o.tickets.reduce((ticketSum, t) => ticketSum + (t.price * t.quantity), 0);
    }, 0);
  
  const pendingRevenue = orders
    .filter(o => o.status === 'pending')
    .reduce((sum, o) => {
      if (o.ticketSubtotal !== undefined) {
        return sum + o.ticketSubtotal;
      }
      return sum + o.tickets.reduce((ticketSum, t) => ticketSum + (t.price * t.quantity), 0);
    }, 0);
  
  return {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    verified: orders.filter(o => o.status === 'verified').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
    totalRevenue,
    pendingRevenue,
  };
}

export async function exportOrdersToCSV(): Promise<string> {
  const orders = await getAllOrders();
  
  const headers = [
    'Order Number',
    'Date',
    'Status',
    'Customer Name',
    'Email',
    'Phone',
    'Tickets',
    'Total Amount',
    'Payment Method',
    'Admin Notes'
  ];
  
  const rows = orders.map(order => [
    order.orderNumber,
    new Date(order.createdAt).toLocaleString(),
    order.status,
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    order.tickets.map(t => `${t.name} x${t.quantity}`).join('; '),
    `$${order.totalAmount}`,
    order.paymentMethod,
    order.adminNotes || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

export async function downloadCSV(): Promise<void> {
  const csv = await exportOrdersToCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `adheeraa-orders-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


