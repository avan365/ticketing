// Ticket Inventory Management
// Persists available ticket counts in localStorage

export interface TicketInventory {
  [ticketId: string]: {
    name: string;
    price: number;
    available: number;
    sold: number;
    reserved: number; // Tickets in checkout but not yet paid
  };
}

const INVENTORY_KEY = 'adheeraa_inventory';
// const RESERVATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes - for future use

// Default inventory (initial stock)
// NOTE: Prices should match BASE_TICKETS in App.tsx
const DEFAULT_INVENTORY: TicketInventory = {
  'early-bird': { name: 'Early Bird', price: 25, available: 150, sold: 0, reserved: 0 },
  'regular': { name: 'Regular Admission', price: 35, available: 300, sold: 0, reserved: 0 },
  'table': { name: 'Table for 4', price: 200, available: 20, sold: 0, reserved: 0 },
};

// Get current inventory from localStorage
export function getInventory(): TicketInventory {
  try {
    const stored = localStorage.getItem(INVENTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading inventory:', error);
  }
  // Initialize with defaults if not found
  saveInventory(DEFAULT_INVENTORY);
  return DEFAULT_INVENTORY;
}

// Save inventory to localStorage
export function saveInventory(inventory: TicketInventory): void {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  } catch (error) {
    console.error('Error saving inventory:', error);
  }
}

// Get available count for a specific ticket
export function getAvailableCount(ticketId: string): number {
  const inventory = getInventory();
  const ticket = inventory[ticketId];
  if (!ticket) return 0;
  return Math.max(0, ticket.available - ticket.sold - ticket.reserved);
}

// Get total sold for a specific ticket
export function getSoldCount(ticketId: string): number {
  const inventory = getInventory();
  return inventory[ticketId]?.sold || 0;
}

// Check if enough tickets are available
export function hasAvailability(ticketId: string, quantity: number): boolean {
  return getAvailableCount(ticketId) >= quantity;
}

// Check availability for multiple tickets (cart)
export function checkCartAvailability(
  cart: { ticketId: string; quantity: number }[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const item of cart) {
    const available = getAvailableCount(item.ticketId);
    if (item.quantity > available) {
      if (available === 0) {
        errors.push(`${item.ticketId} is sold out`);
      } else {
        errors.push(`Only ${available} ${item.ticketId} tickets left`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Reserve tickets (when entering checkout)
export function reserveTickets(
  cart: { ticketId: string; quantity: number }[]
): boolean {
  const inventory = getInventory();
  
  // First check if all tickets are available
  for (const item of cart) {
    const ticket = inventory[item.ticketId];
    if (!ticket) return false;
    const available = ticket.available - ticket.sold - ticket.reserved;
    if (available < item.quantity) return false;
  }
  
  // Reserve the tickets
  for (const item of cart) {
    inventory[item.ticketId].reserved += item.quantity;
  }
  
  saveInventory(inventory);
  return true;
}

// Release reserved tickets (if checkout cancelled/abandoned)
export function releaseReservation(
  cart: { ticketId: string; quantity: number }[]
): void {
  const inventory = getInventory();
  
  for (const item of cart) {
    if (inventory[item.ticketId]) {
      inventory[item.ticketId].reserved = Math.max(
        0,
        inventory[item.ticketId].reserved - item.quantity
      );
    }
  }
  
  saveInventory(inventory);
}

// Confirm purchase (move from reserved to sold)
export function confirmPurchase(
  cart: { ticketId: string; quantity: number }[]
): boolean {
  const inventory = getInventory();
  
  for (const item of cart) {
    if (inventory[item.ticketId]) {
      // Move from reserved to sold
      inventory[item.ticketId].reserved = Math.max(
        0,
        inventory[item.ticketId].reserved - item.quantity
      );
      inventory[item.ticketId].sold += item.quantity;
    }
  }
  
  saveInventory(inventory);
  console.log('✅ Purchase confirmed, inventory updated:', inventory);
  return true;
}

// Direct purchase (for PayNow where we skip reservation)
export function directPurchase(
  cart: { ticketId: string; quantity: number }[]
): boolean {
  const inventory = getInventory();
  
  // Check availability
  for (const item of cart) {
    const ticket = inventory[item.ticketId];
    if (!ticket) return false;
    const available = ticket.available - ticket.sold;
    if (available < item.quantity) return false;
  }
  
  // Deduct from available
  for (const item of cart) {
    inventory[item.ticketId].sold += item.quantity;
  }
  
  saveInventory(inventory);
  console.log('✅ Direct purchase confirmed, inventory updated:', inventory);
  return true;
}

// Get inventory stats for each ticket type
export function getInventoryByTicket() {
  const inventory = getInventory();
  
  return Object.entries(inventory).map(([id, data]) => ({
    id,
    name: data.name,
    price: data.price,
    total: data.available,
    sold: data.sold,
    reserved: data.reserved,
    remaining: data.available - data.sold - data.reserved,
  }));
}

// Get aggregate inventory stats for dashboard
export function getInventoryStats() {
  const inventory = getInventory();
  
  let totalTickets = 0;
  let totalSold = 0;
  let totalReserved = 0;
  
  for (const data of Object.values(inventory)) {
    totalTickets += data.available;
    totalSold += data.sold;
    totalReserved += data.reserved;
  }
  
  return {
    totalTickets,
    totalSold,
    totalReserved,
    totalAvailable: totalTickets - totalSold - totalReserved,
  };
}

// Reset inventory to defaults (for testing)
export function resetInventory(): void {
  saveInventory(DEFAULT_INVENTORY);
  console.log('🔄 Inventory reset to defaults');
}

// Update initial inventory (admin function)
export function setInitialInventory(ticketId: string, quantity: number): void {
  const inventory = getInventory();
  if (inventory[ticketId]) {
    inventory[ticketId].available = quantity;
    saveInventory(inventory);
  }
}

