import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Minus, Check, Crown, Gem, Ticket } from 'lucide-react';
import type { TicketType } from '../App';

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

  const handleQuantityChange = (ticketId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[ticketId] || 0;
      const newValue = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [ticketId]: newValue };
    });
    // Reset the added to cart indicator when quantity changes
    if (addedToCart[ticketId]) {
      setAddedToCart((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleAddToCart = (ticket: TicketType) => {
    const quantity = quantities[ticket.id] || 1;
    onAddToCart(ticket, quantity);
    setAddedToCart((prev) => ({ ...prev, [ticket.id]: true }));
    
    // Reset the indicator after 2 seconds
    setTimeout(() => {
      setAddedToCart((prev) => ({ ...prev, [ticket.id]: false }));
    }, 2000);
  };

  return (
    <div id="tickets" className="py-24 bg-gradient-to-b from-black via-purple-950/10 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
            Choose Your Experience
          </h2>
          <p className="text-xl text-purple-300 max-w-3xl mx-auto" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Select the perfect ticket for an unforgettable night of mystery and magic
          </p>
        </motion.div>

        {/* Tickets Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tickets.map((ticket, index) => {
            const Icon = getIcon(ticket.id);
            const gradient = getGradient(ticket.id);
            const quantity = quantities[ticket.id] || 0;
            const isAdded = addedToCart[ticket.id];

            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, type: 'spring', stiffness: 100 }}
                whileHover={{ scale: 1.05, y: -20 }}
                className={`relative group ${ticket.id === 'vip' ? 'md:scale-110 z-10' : ''}`}
              >
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 rounded-3xl blur-2xl group-hover:opacity-40 transition-all duration-500`} />
                
                {/* Card */}
                <div className="relative bg-gradient-to-br from-purple-900/80 to-black/80 backdrop-blur-xl rounded-3xl border-2 border-purple-500/30 group-hover:border-yellow-400/50 transition-all duration-500 overflow-hidden">
                  {/* VIP Badge */}
                  {ticket.id === 'vip' && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-amber-600 text-black px-6 py-2 rounded-bl-3xl font-bold text-sm">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="p-8">
                    {/* Icon */}
                    <motion.div
                      animate={{ rotateY: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mb-6`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </motion.div>

                    {/* Title */}
                    <h3 className={`text-3xl font-bold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                      {ticket.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-white">${ticket.price}</span>
                      <span className="text-purple-300 ml-2">per ticket</span>
                    </div>

                    {/* Description */}
                    <p className="text-purple-200 mb-6 min-h-[60px]">{ticket.description}</p>

                    {/* Availability */}
                    <div className="mb-6 flex items-center gap-2">
                      <div className="flex-1 bg-purple-950/50 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(ticket.available / (ticket.id === 'vip' ? 50 : ticket.id === 'premium' ? 150 : 500)) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                          className={`h-full bg-gradient-to-r ${gradient}`}
                        />
                      </div>
                      <span className="text-sm text-purple-300">{ticket.available} left</span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-purple-300">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleQuantityChange(ticket.id, -1)}
                          disabled={quantity === 0}
                          className="w-10 h-10 rounded-full bg-purple-800/50 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </motion.button>
                        <span className="w-12 text-center text-2xl font-bold text-white">
                          {quantity}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleQuantityChange(ticket.id, 1)}
                          disabled={quantity >= 10}
                          className="w-10 h-10 rounded-full bg-purple-800/50 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToCart(ticket)}
                      disabled={quantity === 0}
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                        isAdded
                          ? 'bg-green-500 text-white'
                          : `bg-gradient-to-r ${gradient} text-white hover:shadow-2xl`
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-5 h-5" />
                          Added to Cart!
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
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8">
            <h4 className="text-2xl font-bold text-yellow-400 mb-4">📋 Important Information</h4>
            <ul className="space-y-2 text-purple-200">
              <li>• All tickets are non-refundable but transferable</li>
              <li>• Valid ID required at entry - must match ticket holder name</li>
              <li>• Masquerade mask mandatory for all attendees</li>
              <li>• VIP tickets include complimentary coat check and parking</li>
              <li>• Ages 21+ only - strict enforcement</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}