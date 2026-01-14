// Vercel Serverless Function for Order Management
// Uses Redis for persistent storage (supports both REST API and native Redis)

const { createClient: createKVClient } = require('@vercel/kv');
const { createClient: createRedisClient } = require('redis');

const ORDERS_KEY = 'adheeraa_orders';

// Initialize Redis client (supports multiple formats)
let kv = null;

function initKV() {
  if (kv) return kv; // Already initialized
  
  // Log available env vars for debugging
  const availableVars = Object.keys(process.env).filter(k => 
    k.includes('REDIS') || k.includes('KV') || k.includes('UPSTASH')
  );
  console.log('🔍 Available Redis/KV env vars:', availableVars);
  
  // Format 1: REST API (Vercel KV / Upstash)
  let url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  let token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  
  // Format 2: Native Redis connection string (redis://)
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl && redisUrl.startsWith('redis://')) {
    // Native Redis connection string (Redis Labs, etc.)
    try {
      console.log('🔌 Using native Redis connection (redis://)');
      kv = createRedisClient({
        url: redisUrl,
      });
      // Note: We'll need to connect async, but for now return the client
      console.log('✅ Redis client created (native protocol)');
      return kv;
    } catch (error) {
      console.error('❌ Error creating Redis client:', error);
      return null;
    }
  }
  
  // Format 3: REST API with separate URL and token
  if (url && token) {
    try {
      console.log('🌐 Using REST API connection');
      kv = createKVClient({
        url: url,
        token: token,
      });
      console.log('✅ KV client initialized (REST API)');
      return kv;
    } catch (error) {
      console.error('❌ Error initializing KV client:', error);
      return null;
    }
  }
  
  console.warn('⚠️ Redis/KV not configured. Need one of:');
  console.warn('   - REDIS_URL (redis:// connection string)');
  console.warn('   - KV_REST_API_URL + KV_REST_API_TOKEN');
  console.warn('   - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN');
  return null;
}

// Helper to read orders from Redis
async function getOrders() {
  try {
    const client = initKV();
    if (!client) {
      console.warn('⚠️ Redis not configured, falling back to empty array');
      return [];
    }

    // Check if it's a native Redis client (needs connection)
    if (typeof client.connect === 'function') {
      // Native Redis client
      if (!client.isReady && !client.isOpen) {
        await client.connect();
      }
      const orders = await client.get(ORDERS_KEY);
      return orders ? JSON.parse(orders) : [];
    } else {
      // REST API client (Vercel KV)
      const orders = await client.get(ORDERS_KEY);
      return orders || [];
    }
  } catch (error) {
    console.error('Error reading orders from Redis:', error);
    // Return empty array on error
    return [];
  }
}

// Helper to save orders to Redis
async function saveOrders(orders) {
  try {
    const client = initKV();
    if (!client) {
      console.warn('⚠️ Redis not configured, cannot save orders');
      throw new Error('Redis not configured. Please set REDIS_URL (or KV_REST_API_URL + KV_REST_API_TOKEN) environment variables.');
    }

    // Check if it's a native Redis client (needs connection)
    if (typeof client.connect === 'function') {
      // Native Redis client - needs JSON string
      if (!client.isReady && !client.isOpen) {
        await client.connect();
      }
      await client.set(ORDERS_KEY, JSON.stringify(orders));
    } else {
      // REST API client (Vercel KV) - handles JSON automatically
      await client.set(ORDERS_KEY, orders);
    }
    
    console.log('✅ Orders saved to Redis:', orders.length, 'orders');
  } catch (error) {
    console.error('Error saving orders to Redis:', error);
    throw error;
  }
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

    // DELETE /api/orders - Reset all orders
    if (method === 'DELETE') {
      await saveOrders([]);
      console.log('✅ All orders reset');
      return res.status(200).json({ success: true, message: 'All orders deleted' });
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

