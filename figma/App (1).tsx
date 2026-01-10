import { useState } from 'react';
import { Hero } from './components/Hero';
import { ConcertDetails } from './components/ConcertDetails';
import { TicketSelection } from './components/TicketSelection';
import { CheckoutModal } from './components/CheckoutModal';

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

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const tickets: TicketType[] = [
    {
      id: 'early-bird',
      name: 'Early Bird',
      price: 25,
      description: 'Limited time offer, full venue access',
      available: 150,
    },
    {
      id: 'regular',
      name: 'Regular Admission',
      price: 35,
      description: 'General admission, full venue access',
      available: 300,
    },
    {
      id: 'table',
      name: 'Table for 4',
      price: 200,
      description: 'Reserved table seating, inclusive of 1 bottle',
      available: 20,
    },
  ];

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

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.ticket.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Hero totalItems={getTotalItems()} onCheckout={() => setShowCheckout(true)} />
      <ConcertDetails />
      <TicketSelection tickets={tickets} onAddToCart={addToCart} />
      
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onUpdateQuantity={updateQuantity}
          totalPrice={getTotalPrice()}
        />
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && !showCheckout && (
        <button
          onClick={() => setShowCheckout(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-8 py-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 z-50 font-bold flex items-center gap-3"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
        >
          <span className="text-lg">🎭</span>
          <span>View Cart ({getTotalItems()})</span>
          <span className="text-lg">${getTotalPrice()}</span>
        </button>
      )}
    </div>
  );
}