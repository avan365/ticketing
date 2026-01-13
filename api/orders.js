// Vercel Serverless Function for Order Management
// Stores orders in a JSON file (in production, use a database like Vercel KV, MongoDB, etc.)

const fs = require('fs').promises;
const path = require('path');

// In-memory cache (resets on serverless function restart)
let ordersCache = null;
const ORDERS_FILE = path.join('/tmp', 'adheeraa_orders.json');

// Helper to read orders
async function getOrders() {
  try {
    // Try to read from file
    const data = await fs.readFile(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Helper to save orders
async function saveOrders(orders) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
  ordersCache = orders;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method } = req;
    const { orderNumber, ticketId, status, scannedBy } = req.query;

    // GET /api/orders - Get all orders
    if (method === 'GET' && !orderNumber && !ticketId) {
      const orders = await getOrders();
      return res.status(200).json(orders);
    }

    // GET /api/orders?orderNumber=XXX - Get order by order number
    if (method === 'GET' && orderNumber) {
      const orders = await getOrders();
      const order = orders.find(o => 
        o.orderNumber.replace(/\s+/g, '').toUpperCase() === 
        orderNumber.replace(/\s+/g, '').toUpperCase()
      );
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      return res.status(200).json(order);
    }

    // GET /api/orders?ticketId=XXX - Find ticket by ticket ID
    if (method === 'GET' && ticketId) {
      const orders = await getOrders();
      for (const order of orders) {
        const ticket = order.individualTickets?.find(t => 
          t.ticketId.replace(/\s+/g, '').toUpperCase() === 
          ticketId.replace(/\s+/g, '').toUpperCase()
        );
        if (ticket) {
          return res.status(200).json({ order, ticket });
        }
      }
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // POST /api/orders - Create new order
    if (method === 'POST') {
      const order = req.body;
      
      // Validate required fields
      if (!order.orderNumber || !order.customerName || !order.customerEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const orders = await getOrders();
      
      // Check if order number already exists
      const exists = orders.find(o => o.orderNumber === order.orderNumber);
      if (exists) {
        return res.status(409).json({ error: 'Order number already exists' });
      }

      orders.unshift(order); // Add to beginning (newest first)
      await saveOrders(orders);
      
      console.log('✅ Order saved:', order.orderNumber);
      return res.status(201).json(order);
    }

    // PUT /api/orders/:orderNumber - Update order status
    if (method === 'PUT' && orderNumber) {
      const { status: newStatus, adminNotes } = req.body;
      const orders = await getOrders();
      
      const orderIndex = orders.findIndex(o => 
        o.orderNumber.replace(/\s+/g, '').toUpperCase() === 
        orderNumber.replace(/\s+/g, '').toUpperCase()
      );
      
      if (orderIndex === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (newStatus) {
        orders[orderIndex].status = newStatus;
        if (newStatus === 'verified') {
          orders[orderIndex].verifiedAt = new Date().toISOString();
        }
      }
      if (adminNotes !== undefined) {
        orders[orderIndex].adminNotes = adminNotes;
      }

      await saveOrders(orders);
      return res.status(200).json(orders[orderIndex]);
    }

    // PATCH /api/orders/ticket - Update ticket status
    if (method === 'PATCH' && ticketId && status) {
      const orders = await getOrders();
      const normalizedTicketId = ticketId.replace(/\s+/g, '').toUpperCase();
      
      let found = false;
      for (const order of orders) {
        const ticket = order.individualTickets?.find(t => 
          t.ticketId.replace(/\s+/g, '').toUpperCase() === normalizedTicketId
        );
        if (ticket) {
          ticket.status = status;
          if (status === 'used') {
            ticket.scannedAt = new Date().toISOString();
            ticket.scannedBy = scannedBy || 'bouncer';
          }
          found = true;
          break;
        }
      }

      if (!found) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      await saveOrders(orders);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Error in orders API:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

