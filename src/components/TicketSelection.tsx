import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Minus, Check, Crown, Gem, Ticket } from "lucide-react";
import type { TicketType } from "../App";
import { EventConfig } from "../config/eventConfig";

// INITIAL_STOCK removed - availability numbers no longer displayed

interface TicketSelectionProps {
  tickets: TicketType[];
  onAddToCart: (ticket: TicketType, quantity: number) => void;
}

export function TicketSelection({
  tickets,
  onAddToCart,
}: TicketSelectionProps) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [addedToCart, setAddedToCart] = useState<{ [key: string]: boolean }>(
    {}
  );

  const getIcon = (id: string) => {
    switch (id) {
      case "phase-i":
        return Ticket;
      case "phase-ii":
        return Gem;
      case "phase-iii":
        return Crown;
      default:
        return Ticket;
    }
  };

  const getGradient = (id: string) => {
    switch (id) {
      case "phase-i":
        return "from-green-400 via-emerald-500 to-green-600";
      case "phase-ii":
        return "from-blue-400 via-cyan-500 to-blue-600";
      case "phase-iii":
        return "from-amber-500 via-amber-600 to-amber-700";
      default:
        return "from-purple-400 via-pink-500 to-purple-600";
    }
  };

  const handleQuantityChange = (
    ticketId: string,
    delta: number,
    maxAvailable: number
  ) => {
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
    <div
      id="tickets"
      className="py-12 md:py-24 bg-[#0a0a12] relative overflow-hidden"
    >
      {/* Minimal background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6 md:mb-12"
        >
          <h2
            className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold bg-gradient-to-r from-amber-400 via-purple-300/60 to-amber-500 bg-clip-text text-transparent mb-2 md:mb-6"
            style={{ fontFamily: "Cinzel, serif" }}
          >
            Choose Your Experience
          </h2>
          <p className="text-sm md:text-xl text-purple-300 max-w-3xl mx-auto px-4 font-sans">
            Select the perfect ticket for an unforgettable night of mystery and
            magic
          </p>
        </motion.div>

        {/* Mask Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 md:mb-16 max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 backdrop-blur-sm rounded-xl border border-amber-500/30 p-6 md:p-8 text-center">
            <h3
              className="text-xl md:text-3xl font-bold mb-3 md:mb-4"
              style={{
                fontFamily: "Cinzel, serif",
                color: EventConfig.colors.text.primary,
              }}
            >
              🎭 Your Mask Is Included
            </h3>
            <p className="text-sm md:text-lg text-purple-200 max-w-2xl mx-auto font-sans">
              Every ticket includes a complimentary masquerade mask. Masquerade
              masks provided at entry and can be personalized inside.
            </p>
            <p className="text-xs md:text-sm text-purple-300/80 mt-3 md:mt-4 font-sans italic">
              Masks and customization materials are available while stocks last.
            </p>
          </div>
        </motion.div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {tickets.map((ticket, index) => {
            const Icon = getIcon(ticket.id);
            const gradient = getGradient(ticket.id);
            const quantity = quantities[ticket.id] || 0;
            const isAdded = addedToCart[ticket.id];
            const isSoldOut = ticket.available === 0;
            // Availability numbers removed - no longer displayed

            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  scale: isSoldOut ? 1 : 1.05,
                  y: isSoldOut ? 0 : -20,
                }}
                className={`relative group ${
                  ticket.id === "vip" ? "md:scale-110 z-10" : ""
                }`}
              >
                {/* Glow Effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradient} ${
                    isSoldOut
                      ? "opacity-5"
                      : "opacity-20 group-hover:opacity-40"
                  } rounded-3xl blur-2xl transition-all duration-500`}
                />

                {/* Card */}
                <div
                  className={`relative bg-white/5 backdrop-blur-sm rounded-xl border ${
                    isSoldOut
                      ? "border-gray-600/20 opacity-60"
                      : "border-white/10 group-hover:border-amber-500/30"
                  } transition-all duration-200 overflow-hidden h-full flex flex-col hover:bg-white/10`}
                >
                  {/* Sold Out Badge */}
                  {isSoldOut && (
                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white px-6 py-3 font-bold text-center z-10">
                      🎭 SOLD OUT
                    </div>
                  )}

                  <div
                    className={`p-4 md:p-8 flex flex-col flex-1 ${
                      isSoldOut ? "pt-14 md:pt-16" : ""
                    }`}
                  >
                    {/* Mobile: Icon in top-right, title+price compact */}
                    <div className="flex items-start justify-between md:hidden mb-3">
                      <div>
                        <h3
                          className={`text-xl font-bold mb-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${
                            isSoldOut ? "grayscale" : ""
                          }`}
                        >
                          {ticket.name}
                        </h3>
                        <div>
                          <span
                            className={`text-2xl font-bold ${
                              isSoldOut ? "text-gray-500" : "text-white"
                            }`}
                          >
                            ${ticket.price}
                          </span>
                          <span className="text-purple-300 ml-1 text-xs">
                            per ticket
                          </span>
                        </div>
                      </div>
                      <motion.div
                        animate={isSoldOut ? {} : { rotateY: [0, 360] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} ${
                          isSoldOut ? "grayscale opacity-50" : ""
                        } flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>

                    {/* Desktop: Original layout */}
                    <div className="hidden md:block">
                      {/* Icon */}
                      <motion.div
                        animate={isSoldOut ? {} : { rotateY: [0, 360] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                        className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} ${
                          isSoldOut ? "grayscale opacity-50" : ""
                        } flex items-center justify-center mb-6`}
                      >
                        <Icon className="w-10 h-10 text-white" />
                      </motion.div>

                      {/* Title */}
                      <h3
                        className={`text-3xl font-bold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${
                          isSoldOut ? "grayscale" : ""
                        }`}
                      >
                        {ticket.name}
                      </h3>

                      {/* Price */}
                      <div className="mb-6">
                        <span
                          className={`text-5xl font-bold ${
                            isSoldOut ? "text-gray-500" : "text-white"
                          }`}
                        >
                          ${ticket.price}
                        </span>
                        <span className="text-purple-300 ml-2 text-base">
                          per ticket
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p
                      className={`${
                        isSoldOut ? "text-gray-400" : "text-purple-200"
                      } mb-4 md:mb-6 flex-1 text-sm md:text-base`}
                    >
                      {ticket.description}
                    </p>

                    {/* Quantity Selector - Hidden when sold out */}
                    {!isSoldOut && (
                      <div className="flex items-center justify-between md:justify-start gap-2 md:gap-4 mb-4 md:mb-6">
                        <span className="text-purple-300 text-sm md:text-base">
                          Quantity:
                        </span>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              handleQuantityChange(
                                ticket.id,
                                -1,
                                ticket.available
                              )
                            }
                            disabled={quantity === 0}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-purple-800/30 hover:bg-purple-700/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4 md:w-5 md:h-5" />
                          </motion.button>
                          <span className="w-10 md:w-12 text-center text-xl md:text-2xl font-bold text-white">
                            {quantity}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              handleQuantityChange(
                                ticket.id,
                                1,
                                ticket.available
                              )
                            }
                            disabled={
                              quantity >= Math.min(10, ticket.available)
                            }
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-purple-800/30 hover:bg-purple-700/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <motion.button
                      whileHover={{ scale: isSoldOut ? 1 : 1.01 }}
                      whileTap={{ scale: isSoldOut ? 1 : 0.99 }}
                      onClick={() => handleAddToCart(ticket)}
                      disabled={isSoldOut || quantity === 0}
                      className={`w-full py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all duration-200 flex items-center justify-center gap-2 font-sans ${
                        isSoldOut
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : isAdded
                          ? "bg-green-500 text-white"
                          : `bg-gradient-to-r ${gradient} text-white hover:shadow-lg`
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSoldOut ? (
                        <>🎭 Sold Out</>
                      ) : isAdded ? (
                        <>
                          <Check className="w-4 h-4 md:w-5 md:h-5" />
                          Added!
                        </>
                      ) : (
                        <>
                          Add to Cart
                          {quantity > 0 && (
                            <span>(${ticket.price * quantity})</span>
                          )}
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 md:mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:p-8">
            <h4 className="text-base md:text-2xl font-semibold text-amber-500/90 mb-4 md:mb-6 font-sans">
              ❓ Frequently Asked Questions
            </h4>
            <div className="space-y-3 md:space-y-4 text-purple-200 text-xs md:text-base font-sans">
              <div>
                <p className="font-semibold text-white mb-1">
                  Do I need to bring my own mask?
                </p>
                <p className="text-purple-300/80">
                  No. Every ticket includes a complimentary masquerade mask.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">
                  Can I customize my mask anytime?
                </p>
                <p className="text-purple-300/80">
                  Yes, the Mask Atelier is open early in the night while
                  supplies last.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">
                  Can I bring my own mask?
                </p>
                <p className="text-purple-300/80">
                  Yes, as long as it aligns with formal masquerade attire.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Important Info */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 md:mt-12 max-w-4xl mx-auto"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:p-8">
            <h4 className="text-base md:text-2xl font-semibold text-amber-500/90 mb-4 md:mb-6 font-sans">
              📋 Important Information
            </h4>
            <ul className="space-y-2 md:space-y-3 text-purple-200 text-xs md:text-base font-sans">
              <li>• 18+ event — valid physical ID required for entry</li>
              <li>
                • Masks are mandatory on entry (complimentary mask included with
                every ticket)
              </li>
              <li>• Personal masks are allowed, subject to entry approval</li>
              <li>• Tickets are non-refundable but transferable</li>
              <li>
                • Venue reserves the right to refuse entry or remove guests for
                inappropriate behaviour
              </li>
              <li>• Be respectful to staff, DJs, and fellow guests</li>
              <li>• Photos and videos will be taken during the event</li>
            </ul>
            <p className="text-center text-sm md:text-base font-semibold text-amber-400/90 mt-4 md:mt-6 font-sans italic">
              Behave. Look good. Stay mysterious. The rest is between you and
              the dancefloor.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
