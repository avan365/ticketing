import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Hero } from "./components/Hero";
import { ConcertDetails } from "./components/ConcertDetails";
import { TicketSelection } from "./components/TicketSelection";
import { CheckoutModal } from "./components/CheckoutModal";
import { getAvailableCount } from "./utils/inventory";
import { EventConfig } from "./config/eventConfig";
import {
  getCheckoutSession,
  processCheckoutSession,
} from "./utils/checkoutRedirect";

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

// Base ticket info from config
const BASE_TICKETS = EventConfig.tickets;

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [inventoryVersion, setInventoryVersion] = useState(0); // Trigger re-render when inventory changes
  const [redirectOrderData, setRedirectOrderData] = useState<{
    orderNumber: string;
    customerEmail: string;
    totalAmount: number;
  } | null>(null);

  // Get tickets with live availability from inventory
  const getTicketsWithAvailability = useCallback((): TicketType[] => {
    return BASE_TICKETS.map((ticket) => ({
      ...ticket,
      available: getAvailableCount(ticket.id),
    }));
  }, [inventoryVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const tickets = getTicketsWithAvailability();

  // Refresh inventory (called after purchase)
  const refreshInventory = useCallback(() => {
    setInventoryVersion((v) => v + 1);
  }, []);

  // Handle Stripe Checkout redirect (Apple Pay, GrabPay)
  useEffect(() => {
    let isProcessing = false; // Flag to prevent duplicate processing

    const handleCheckoutRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");
      const success = urlParams.get("success");
      const canceled = urlParams.get("canceled");

      // If canceled, just clean up and return
      if (canceled === "true") {
        sessionStorage.removeItem("checkout_cart");
        sessionStorage.removeItem("checkout_customer");
        // Remove query params from URL
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }

      // If success with session_id, process the order
      if (success === "true" && sessionId && !isProcessing) {
        // Check if we've already processed this session
        const processedSessions = JSON.parse(
          sessionStorage.getItem("processed_sessions") || "[]"
        );
        if (processedSessions.includes(sessionId)) {
          // Already processed, just clean up URL
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }

        // Set processing flag
        isProcessing = true;

        try {
          // Retrieve session details
          const sessionData = await getCheckoutSession(sessionId);
          if (!sessionData) {
            console.error("Failed to retrieve checkout session");
            isProcessing = false;
            return;
          }

          // Double-check we haven't processed this session (race condition protection)
          if (processedSessions.includes(sessionId)) {
            window.history.replaceState({}, "", window.location.pathname);
            isProcessing = false;
            return;
          }

          // Process the order
          const result = await processCheckoutSession(sessionData);
          if (result.success && result.orderNumber) {
            // Mark as processed immediately to prevent duplicates
            processedSessions.push(sessionId);
            sessionStorage.setItem(
              "processed_sessions",
              JSON.stringify(processedSessions.slice(-10)) // Keep last 10
            );

            // Refresh inventory
            refreshInventory();

            // Clear cart
            setCart([]);

            // Store order data to show success screen
            setRedirectOrderData({
              orderNumber: result.orderNumber,
              customerEmail: sessionData.customerEmail,
              totalAmount: sessionData.amountTotal,
            });

            // Open checkout modal to show success screen
            setShowCheckout(true);

            // Remove query params from URL
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            console.error("Failed to process checkout session:", result.error);
          }
        } catch (error) {
          console.error("Error handling checkout redirect:", error);
        } finally {
          isProcessing = false;
        }
      }
    };

    handleCheckoutRedirect();
  }, [refreshInventory]);

  const addToCart = (ticket: TicketType, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.ticket.id === ticket.id
      );
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
    return cart.reduce(
      (total, item) => total + item.ticket.price * item.quantity,
      0
    );
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleViewCart = () => {
    // Scroll to top of page first
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Then open checkout modal
    setShowCheckout(true);
  };

  return (
    <>
      <div
        className="min-h-screen text-white overflow-x-hidden"
        style={{
          backgroundColor: EventConfig.colors.background,
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Hero totalItems={getTotalItems()} onCheckout={handleViewCart} />
        <ConcertDetails />
        <TicketSelection tickets={tickets} onAddToCart={addToCart} />

        {/* Footer */}
        <footer
          className="py-4 md:py-12 border-t"
          style={{
            backgroundColor: EventConfig.colors.background,
            borderColor: EventConfig.colors.border.primary,
          }}
        >
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-1 md:space-y-4"
            >
              <h3
                className={`text-lg md:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${EventConfig.colors.primary.gradient} bg-clip-text text-transparent`}
                style={{ fontFamily: EventConfig.fonts.display }}
              >
                {EventConfig.event.name}
              </h3>
              <p
                className="text-[10px] md:text-base font-sans"
                style={{ color: EventConfig.colors.text.secondary }}
              >
                {EventConfig.event.subtitle} {EventConfig.event.year} •{" "}
                {EventConfig.venue.name},{" "}
                {EventConfig.venue.location.split(", ")[1]}
              </p>
              {/* Emojis - hidden on mobile */}
              <div className="hidden md:flex justify-center gap-6 text-3xl">
                {EventConfig.branding.footerEmojis.map((emoji, index) => (
                  <motion.span
                    key={index}
                    whileHover={{
                      scale: 1.2,
                      rotate: index % 2 === 0 ? 10 : -10,
                    }}
                    className="cursor-pointer"
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>
              <p
                className="text-[9px] md:text-sm pt-1 md:pt-4 font-sans"
                style={{ color: EventConfig.colors.text.muted }}
              >
                {EventConfig.branding.copyright}
              </p>
            </motion.div>
          </div>
        </footer>

        {/* Checkout Modal */}
        <AnimatePresence>
          {showCheckout && (
            <div id="checkout-modal">
              <CheckoutModal
                cart={cart}
                onClose={() => {
                  setShowCheckout(false);
                  setRedirectOrderData(null); // Clear redirect data when closing
                }}
                onUpdateQuantity={updateQuantity}
                onClearCart={clearCart}
                totalPrice={getTotalPrice()}
                onPurchaseComplete={refreshInventory}
                redirectOrderData={redirectOrderData}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Cart Button - pinned to viewport */}
      {!showCheckout && (
        <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewCart}
            className="pointer-events-auto text-white px-6 py-3 md:px-8 md:py-4 rounded-lg shadow-xl transition-colors duration-200 font-medium flex items-center gap-2 md:gap-3 font-sans"
            style={{ backgroundColor: EventConfig.colors.primary.base }}
          >
            <span className="text-lg">🎭</span>
            <span className="text-sm md:text-base">
              View Cart {cart.length > 0 && `(${getTotalItems()})`}
            </span>
            {cart.length > 0 && (
              <span className="text-base md:text-lg font-bold">
                ${getTotalPrice()}
              </span>
            )}
          </motion.button>
        </div>
      )}
    </>
  );
}
