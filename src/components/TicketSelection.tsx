import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Minus, Check, Crown, Gem, Ticket, AlertTriangle } from 'lucide-react';
import type { TicketType } from '../App';

// Initial total stock for calculating percentage
const INITIAL_STOCK: { [key: string]: number } = {
  'early-bird': 150,
  'regular': 300,
  'table': 20,
};

interface TicketSelectionProps {
  tickets: TicketType[];
  onAddToCart: (ticket: TicketType, quantity: number) => void;
}

export function TicketSelection({ tickets, onAddToCart }: TicketSelectionProps) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [addedToCart, setAddedToCart] = useState<{ [key: string]: boolean }>({});

  const getIcon = (id: string) => {
    switch (id) {
      case 'early-bird':
        return Ticket;
      case 'regular':
        return Gem;
      case 'table':
        return Crown;
      default:
        return Ticket;
    }
  };

  const getGradient = (id: string) => {
    switch (id) {
      case 'early-bird':
        return 'from-green-400 via-emerald-500 to-green-600';
      case 'regular':
        return 'from-blue-400 via-cyan-500 to-blue-600';
      case 'table':
        return 'from-yellow-400 via-amber-500 to-yellow-600';
      default:
        return 'from-purple-400 via-pink-500 to-purple-600';
    }
  };

  const handleQuantityChange = (ticketId: string, delta: number, maxAvailable: number) => {
    setQuantities((prev) => {
      const current = prev[ticketId] || 0;
      // Limit to available stock and max 10
      const maxAllowed = Math.min(10, maxAvailable);
      const newValue = Math.max(0, Math.min(maxAllowed, current + delta));
      return { ...prev, [ticketId]: newValue };
    });
    // Reset the added to cart indicator when quantity changes
    if (addedToCart[ticketId]) {
      setAddedToCart((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleAddToCart = (ticket: TicketType) => {
    const quantity = quantities[ticket.id] || 1;
    if (quantity > ticket.available) {
      // Can't add more than available
      return;
    }
    onAddToCart(ticket, quantity);
    setAddedToCart((prev) => ({ ...prev, [ticket.id]: true }));
    // Reset quantity after adding
    setQuantities((prev) => ({ ...prev, [ticket.id]: 0 }));
    
    // Reset the indicator after 2 seconds
    setTimeout(() => {
      setAddedToCart((prev) => ({ ...prev, [ticket.id]: false }));
    }, 2000);
  };

  return (
    <div id="tickets" className="py-12 md:py-24 bg-[#0a0a12] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-purple-600 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 md:w-96 h-48 md:h-96 bg-yellow-600 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-20"
        >
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 md:mb-6"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Choose Your Experience
          </h2>
          <p 
            className="text-base md:text-xl text-purple-300 max-w-3xl mx-auto px-4"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Select the perfect ticket for an unforgettable night of mystery and magic
          </p>
        </motion.div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {tickets.map((ticket, index) => {
            const Icon = getIcon(ticket.id);
            const gradient = getGradient(ticket.id);
            const quantity = quantities[ticket.id] || 0;
            const isAdded = addedToCart[ticket.id];
            const isSoldOut = ticket.available === 0;
            const isLowStock = ticket.available > 0 && ticket.available <= 10;
            const initialStock = INITIAL_STOCK[ticket.id] || 100;
            const availabilityPercent = (ticket.available / initialStock) * 100;

            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, type: 'spring', stiffness: 100 }}
                whileHover={{ scale: isSoldOut ? 1 : 1.05, y: isSoldOut ? 0 : -20 }}
                className={`relative group ${ticket.id === 'vip' ? 'md:scale-110 z-10' : ''}`}
              >
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${isSoldOut ? 'opacity-5' : 'opacity-20 group-hover:opacity-40'} rounded-3xl blur-2xl transition-all duration-500`} />
                
                {/* Card */}
                <div className={`relative bg-gradient-to-br from-purple-900/80 to-black/80 backdrop-blur-xl rounded-3xl border-2 ${
                  isSoldOut 
                    ? 'border-gray-600/30 opacity-60' 
                    : 'border-purple-500/30 group-hover:border-yellow-400/50'
                } transition-all duration-500 overflow-hidden h-full flex flex-col`}>
                  
                  {/* Sold Out Badge */}
                  {isSoldOut && (
                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white px-6 py-3 font-bold text-center z-10">
                      🎭 SOLD OUT
                    </div>
                  )}
                  
                  {/* Low Stock Badge */}
                  {isLowStock && !isSoldOut && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-orange-500 to-red-600 text-white px-4 py-2 rounded-bl-2xl font-bold text-sm flex items-center gap-1 z-10">
                      <AlertTriangle className="w-4 h-4" />
                      Only {ticket.available} left!
                    </div>
                  )}

                  <div className={`p-5 md:p-8 flex flex-col flex-1 ${isSoldOut ? 'pt-14 md:pt-16' : ''}`}>
                    {/* Icon */}
                    <motion.div
                      animate={isSoldOut ? {} : { rotateY: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      className={`w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${gradient} ${isSoldOut ? 'grayscale opacity-50' : ''} flex items-center justify-center mb-4 md:mb-6`}
                    >
                      <Icon className="w-7 h-7 md:w-10 md:h-10 text-white" />
                    </motion.div>

                    {/* Title */}
                    <h3 className={`text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${isSoldOut ? 'grayscale' : ''}`}>
                      {ticket.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-4 md:mb-6">
                      <span className={`text-3xl md:text-5xl font-bold ${isSoldOut ? 'text-gray-500' : 'text-white'}`}>${ticket.price}</span>
                      <span className="text-purple-300 ml-2 text-sm md:text-base">per ticket</span>
                    </div>

                    {/* Description */}
                    <p className={`${isSoldOut ? 'text-gray-400' : 'text-purple-200'} mb-4 md:mb-6 flex-1 text-sm md:text-base`}>{ticket.description}</p>

                    {/* Availability Bar */}
                    <div className="mb-4 md:mb-6 flex items-center gap-2">
                      <div className="flex-1 bg-purple-950/50 rounded-full h-1.5 md:h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${availabilityPercent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                          className={`h-full ${
                            isSoldOut 
                              ? 'bg-gray-600' 
                              : isLowStock 
                                ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                                : `bg-gradient-to-r ${gradient}`
                          }`}
                        />
                      </div>
                      <span className={`text-xs md:text-sm whitespace-nowrap ${
                        isSoldOut 
                          ? 'text-red-400 font-bold' 
                          : isLowStock 
                            ? 'text-orange-400 font-bold' 
                            : 'text-purple-300'
                      }`}>
                        {isSoldOut ? 'Sold Out' : `${ticket.available} left`}
                      </span>
                    </div>

                    {/* Quantity Selector - Hidden when sold out */}
                    {!isSoldOut && (
                      <div className="flex items-center justify-between md:justify-start gap-2 md:gap-4 mb-4 md:mb-6">
                        <span className="text-purple-300 text-sm md:text-base">Quantity:</span>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleQuantityChange(ticket.id, -1, ticket.available)}
                            disabled={quantity === 0}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-purple-800/50 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4 md:w-5 md:h-5" />
                          </motion.button>
                          <span className="w-10 md:w-12 text-center text-xl md:text-2xl font-bold text-white">
                            {quantity}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleQuantityChange(ticket.id, 1, ticket.available)}
                            disabled={quantity >= Math.min(10, ticket.available)}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-purple-800/50 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <motion.button
                      whileHover={{ scale: isSoldOut ? 1 : 1.02 }}
                      whileTap={{ scale: isSoldOut ? 1 : 0.98 }}
                      onClick={() => handleAddToCart(ticket)}
                      disabled={isSoldOut || quantity === 0}
                      className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                        isSoldOut
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : isAdded
                            ? 'bg-green-500 text-white'
                            : `bg-gradient-to-r ${gradient} text-white hover:shadow-2xl`
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSoldOut ? (
                        <>
                          🎭 Sold Out
                        </>
                      ) : isAdded ? (
                        <>
                          <Check className="w-4 h-4 md:w-5 md:h-5" />
                          Added!
                        </>
                      ) : (
                        <>
                          Add to Cart
                          {quantity > 0 && <span>(${ticket.price * quantity})</span>}
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Important Info */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 md:mt-20 max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-xl md:rounded-2xl border border-purple-500/30 p-5 md:p-8">
            <h4 className="text-lg md:text-2xl font-bold text-yellow-400 mb-3 md:mb-4">📋 Important Information</h4>
            <ul className="space-y-1.5 md:space-y-2 text-purple-200 text-sm md:text-base">
              <li>• All tickets are non-refundable but transferable</li>
              <li>• Valid ID required at entry</li>
              <li>• Masquerade mask mandatory for all attendees</li>
              <li>• VIP tickets include coat check and parking</li>
              <li>• Ages 21+ only - strict enforcement</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
