import { motion } from "motion/react";
import { ShoppingCart } from "lucide-react";

interface HeroProps {
  totalItems: number;
  onCheckout: () => void;
}

export function Hero({ totalItems, onCheckout }: HeroProps) {
  return (
    <div className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background - matching poster's dark aesthetic */}
      <div className="absolute inset-0 bg-[#0a0a12]" />

      {/* Subtle background gradient - minimalistic */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Cart Icon */}
      {totalItems > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCheckout}
          className="fixed top-4 right-4 md:top-8 md:right-8 z-50 bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-white p-3 md:p-4 rounded-full shadow-lg hover:scale-110 transition-transform backdrop-blur-sm border border-amber-500/20"
        >
          <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
          <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
            {totalItems}
          </span>
        </motion.button>
      )}

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-8 md:pt-0 md:pb-0">
        {/* Mobile: Centered single column | Desktop: Side-by-side grid */}
        <div className="flex flex-col items-center text-center md:grid md:grid-cols-2 md:gap-12 md:items-start md:text-left">
          {/* Image - Mobile: much smaller centered below text | Desktop: left side */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative order-2 md:order-1 w-full max-w-[180px] md:max-w-none mx-auto"
          >
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
                rotateZ: [0, 1, 0, -1, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="relative"
            >
              <img
                src="/poster.png"
                alt="ADHEERAA Masquerade Night"
                className="relative rounded-xl md:rounded-2xl shadow-lg w-[90%] md:w-[80%] mx-auto"
              />
            </motion.div>
          </motion.div>

          {/* Text Content - Mobile: centered | Desktop: right side */}
          <div className="space-y-6 md:space-y-8 mb-8 md:mb-0 md:mt-12 order-1 md:order-2">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="font-bold mb-2 md:mb-4">
                <motion.span
                  className="block text-[12vw] md:text-6xl lg:text-8xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent w-[90vw] md:w-auto mx-auto md:mx-0"
                  animate={{
                    backgroundPosition: ["0%", "100%", "0%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                  }}
                  style={{
                    backgroundSize: "100%",
                    fontFamily: "Cinzel, serif",
                  }}
                >
                  ADHEERAA
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="block text-xl sm:text-2xl md:text-3xl lg:text-6xl text-purple-300 mt-1 md:mt-2"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  Masquerade Night
                </motion.span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3 md:space-y-4 font-sans"
            >
              <div className="flex items-center gap-3 md:gap-4 text-base md:text-xl justify-center md:justify-start">
                <span className="text-2xl md:text-5xl">📅</span>
                <div className="text-left">
                  <p className="text-purple-300 text-lg md:text-xl">
                    Friday, February 21, 2026
                  </p>
                  <p className="text-gray-400 text-base md:text-lg">
                    8:00 PM - 12:00 AM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4 text-base md:text-xl justify-center md:justify-start">
                <span className="text-2xl md:text-5xl">📍</span>
                <div className="text-left">
                  <p className="text-purple-300 text-lg md:text-xl">
                    Skyfall Rooftop Bar
                  </p>
                  <p className="text-gray-400 text-base md:text-lg">
                    HarbourFront, Singapore
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.a
              href="#tickets"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-amber-600 text-white px-8 py-3 md:px-12 md:py-4 rounded-lg text-lg md:text-xl font-medium hover:bg-amber-700 transition-colors duration-200 font-sans"
            >
              Get Your Tickets 🎭
            </motion.a>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Hidden on mobile */}
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="hidden md:block absolute bottom-8 left-1/2 transform -translate-x-1/2"
      ></motion.div>
    </div>
  );
}
