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
  totalAmount: number;
  
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

export function getAllOrders(): Order[] {
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order): void {
  const orders = getAllOrders();
  orders.unshift(order); // Add to beginning (newest first)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function updateOrderStatus(
  orderId: string, 
  status: Order['status'], 
  adminNotes?: string
): void {
  const orders = getAllOrders();
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
export function updateTicketStatus(
  ticketId: string,
  status: IndividualTicket['status'],
  scannedBy?: string
): { success: boolean; orderNumber?: string; ticketType?: string; error?: string } {
  const orders = getAllOrders();
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
export function findTicket(orderNumber: string, ticketId: string): IndividualTicket | null {
  const orders = getAllOrders();
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
export function getOrderByNumber(orderNumber: string): Order | null {
  const orders = getAllOrders();
  return orders.find(o => o.orderNumber === orderNumber) || null;
}

export function deleteOrder(orderId: string): void {
  const orders = getAllOrders().filter(o => o.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function getOrderStats() {
  const orders = getAllOrders();
  return {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    verified: orders.filter(o => o.status === 'verified').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
    totalRevenue: orders
      .filter(o => o.status === 'verified')
      .reduce((sum, o) => sum + o.totalAmount, 0),
    pendingRevenue: orders
      .filter(o => o.status === 'pending')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };
}

export function exportOrdersToCSV(): string {
  const orders = getAllOrders();
  
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

export function downloadCSV(): void {
  const csv = exportOrdersToCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `adheeraa-orders-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


