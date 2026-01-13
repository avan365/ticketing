import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hero } from './components/Hero';
import { ConcertDetails } from './components/ConcertDetails';
import { TicketSelection } from './components/TicketSelection';
import { CheckoutModal } from './components/CheckoutModal';
import { getAvailableCount } from './utils/inventory';

export interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  available: number;
}

export interface CartItem {
  ticket: TicketType;
  quantity: number;
}

// Base ticket info (static)
const BASE_TICKETS = [
  {
    id: 'early-bird',
    name: 'Early Bird',
    price: 25,
    description: 'Limited time offer, full venue access. Get in before the crowd!',
  },
  {
    id: 'regular',
    name: 'Regular Admission',
    price: 35,
    description: 'General admission with full venue access and all performances.',
  },
  {
    id: 'table',
    name: 'Table for 4',
    price: 200,
    description: 'Reserved table seating, includes 1 premium bottle & priority service.',
  },
];

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCartButton, setShowCartButton] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [inventoryVersion, setInventoryVersion] = useState(0); // Trigger re-render when inventory changes

  // Get tickets with live availability from inventory
  const getTicketsWithAvailability = useCallback((): TicketType[] => {
    return BASE_TICKETS.map(ticket => ({
      ...ticket,
      available: getAvailableCount(ticket.id),
    }));
  }, [inventoryVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const tickets = getTicketsWithAvailability();

  // Refresh inventory (called after purchase)
  const refreshInventory = useCallback(() => {
    setInventoryVersion(v => v + 1);
  }, []);

  // Show floating cart button after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      setShowCartButton(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToCart = (ticket: TicketType, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.ticket.id === ticket.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.ticket.id === ticket.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ticket, quantity }];
    });
  };

  const updateQuantity = (ticketId: string, quantity: number) => {
    setCart((prevCart) => {
      if (quantity <= 0) {
        return prevCart.filter((item) => item.ticket.id !== ticketId);
      }
      return prevCart.map((item) =>
        item.ticket.id === ticketId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.ticket.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white overflow-x-hidden">
      <Hero totalItems={getTotalItems()} onCheckout={() => setShowCheckout(true)} />
      <ConcertDetails />
      <TicketSelection tickets={tickets} onAddToCart={addToCart} />

      {/* Footer */}
      <footer className="py-4 md:py-12 bg-[#0a0a12] border-t border-purple-500/20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-1 md:space-y-4"
          >
            <h3 
              className="text-lg md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              ADHEERAA
            </h3>
            <p 
              className="text-purple-300 text-[10px] md:text-base font-sans"
            >
              Masquerade Night 2026 • Skyfall Rooftop Bar, Singapore
            </p>
            {/* Emojis - hidden on mobile */}
            <div className="hidden md:flex justify-center gap-6 text-3xl">
              <motion.span whileHover={{ scale: 1.2, rotate: 10 }} className="cursor-pointer">🎭</motion.span>
              <motion.span whileHover={{ scale: 1.2, rotate: -10 }} className="cursor-pointer">✨</motion.span>
              <motion.span whileHover={{ scale: 1.2, rotate: 10 }} className="cursor-pointer">🎶</motion.span>
            </div>
            <p 
              className="text-[9px] md:text-sm text-purple-400 pt-1 md:pt-4 font-sans"
            >
              © 2026 ADHEERAA Events. All rights reserved.
            </p>
          </motion.div>
        </div>
      </footer>
      
      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            cart={cart}
            onClose={() => setShowCheckout(false)}
            onUpdateQuantity={updateQuantity}
            onClearCart={clearCart}
            totalPrice={getTotalPrice()}
            onPurchaseComplete={refreshInventory}
          />
        )}
      </AnimatePresence>


      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && !showCheckout && showCartButton && (
          <motion.button
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 100 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCheckout(true)}
            className="fixed bottom-8 right-8 bg-amber-600 text-white px-8 py-4 rounded-lg shadow-md hover:bg-amber-700 transition-colors duration-200 z-50 font-medium flex items-center gap-3 font-sans"
          >
            <span className="text-lg">🎭</span>
            <span>View Cart ({getTotalItems()})</span>
            <span className="text-lg">${getTotalPrice()}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

