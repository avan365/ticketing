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
    <div id="tickets" className="py-10 md:py-16 bg-[#0a0a12] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-48 md:w-72 h-48 md:h-72 bg-purple-600 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 md:w-72 h-48 md:h-72 bg-yellow-600 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Get Your Tickets
          </h2>
          <p 
            className="text-sm md:text-base text-purple-300 max-w-xl mx-auto"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Select the perfect ticket for an unforgettable night
          </p>
        </motion.div>

        {/* Tickets Grid - Tighter spacing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
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
                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 font-bold text-center text-sm z-10">
                      SOLD OUT
                    </div>
                  )}
                  
                  {/* Low Stock Badge */}
                  {isLowStock && !isSoldOut && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-orange-500 to-red-600 text-white px-2 py-1 rounded-bl-xl font-bold text-[10px] md:text-xs flex items-center gap-0.5 z-10">
                      <AlertTriangle className="w-3 h-3" />
                      {ticket.available} left
                    </div>
                  )}

                  <div className={`p-4 md:p-5 flex flex-col flex-1 ${isSoldOut ? 'pt-12 md:pt-14' : ''}`}>
                    {/* Icon + Title Row */}
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={isSoldOut ? {} : { rotateY: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${gradient} ${isSoldOut ? 'grayscale opacity-50' : ''} flex items-center justify-center shrink-0`}
                      >
                        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </motion.div>
                      <h3 className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${isSoldOut ? 'grayscale' : ''}`}>
                        {ticket.name}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <span className={`text-2xl md:text-3xl font-bold ${isSoldOut ? 'text-gray-500' : 'text-white'}`}>${ticket.price}</span>
                      <span className="text-purple-300 ml-1 text-xs md:text-sm">/ticket</span>
                    </div>

                    {/* Description */}
                    <p className={`${isSoldOut ? 'text-gray-400' : 'text-purple-200'} mb-3 flex-1 text-xs md:text-sm leading-relaxed`}>{ticket.description}</p>

                    {/* Availability Bar */}
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex-1 bg-purple-950/50 rounded-full h-1 overflow-hidden">
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
                      <span className={`text-[10px] md:text-xs whitespace-nowrap ${
                        isSoldOut 
                          ? 'text-red-400 font-bold' 
                          : isLowStock 
                            ? 'text-orange-400 font-bold' 
                            : 'text-purple-300'
                      }`}>
                        {isSoldOut ? 'Sold Out' : `${ticket.available} left`}
                      </span>
                    </div>

                    {/* Quantity Selector - Compact */}
                    {!isSoldOut && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-purple-300 text-xs">Qty:</span>
                        <div className="flex items-center gap-1.5">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleQuantityChange(ticket.id, -1, ticket.available)}
                            disabled={quantity === 0}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-800/50 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3 md:w-4 md:h-4" />
                          </motion.button>
                          <span className="w-8 text-center text-lg font-bold text-white">
                            {quantity}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleQuantityChange(ticket.id, 1, ticket.available)}
                            disabled={quantity >= Math.min(10, ticket.available)}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-800/50 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4" />
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {/* Add to Cart Button - Compact */}
                    <motion.button
                      whileHover={{ scale: isSoldOut ? 1 : 1.02 }}
                      whileTap={{ scale: isSoldOut ? 1 : 0.98 }}
                      onClick={() => handleAddToCart(ticket)}
                      disabled={isSoldOut || quantity === 0}
                      className={`w-full py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        isSoldOut
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : isAdded
                            ? 'bg-green-500 text-white'
                            : `bg-gradient-to-r ${gradient} text-white hover:shadow-xl`
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSoldOut ? (
                        'Sold Out'
                      ) : isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          Added!
                        </>
                      ) : (
                        <>
                          Add {quantity > 0 && `($${ticket.price * quantity})`}
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
