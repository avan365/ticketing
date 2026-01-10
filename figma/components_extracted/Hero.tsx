import { motion } from 'motion/react';
import { Sparkles, ShoppingCart } from 'lucide-react';
import heroImage from 'figma:asset/780cc9b9558cd972ee280bb8fdba37bd3c2db869.png';

interface HeroProps {
  totalItems: number;
  onCheckout: () => void;
}

export function Hero({ totalItems, onCheckout }: HeroProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-black"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5 + 0.3,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      {/* Cart Icon */}
      {totalItems > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={onCheckout}
          className="fixed top-8 right-8 z-50 bg-gradient-to-r from-yellow-500 to-amber-600 text-black p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {totalItems}
          </span>
        </motion.button>
      )}

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Image */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotateZ: [0, 2, 0, -2, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-purple-600/20 rounded-3xl blur-3xl" />
              <img
                src={heroImage}
                alt="ADHEERAA Masquerade Night"
                className="relative rounded-3xl shadow-2xl border-4 border-yellow-500/30"
              />
            </motion.div>
          </motion.div>

          {/* Right Side - Text */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-4"
              >
                <Sparkles className="w-12 h-12 text-yellow-400" />
              </motion.div>
              <h1 className="font-bold mb-4">
                <motion.span
                  className="block text-6xl lg:text-8xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0%', '100%', '0%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                  }}
                  style={{ backgroundSize: '200%', fontFamily: 'Cinzel, serif' }}
                >
                  ADHEERAA
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="block text-3xl lg:text-5xl text-purple-300 mt-2"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Masquerade Night
                </motion.span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <div className="flex items-center gap-4 text-xl">
                <span className="text-4xl">📅</span>
                <div>
                  <p className="text-purple-300">Friday, February 21, 2026</p>
                  <p className="text-gray-400">8:00 PM - 12:00 AM</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xl">
                <span className="text-4xl">📍</span>
                <div>
                  <p className="text-purple-300">Skyfall Rooftop Bar</p>
                  <p className="text-gray-400">HarbourFront, Singapore</p>
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
              className="inline-block bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-12 py-5 rounded-full text-2xl font-bold shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300"
              style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
            >
              Get Your Tickets 🎭
            </motion.a>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-yellow-400 rounded-full flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-yellow-400 rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}