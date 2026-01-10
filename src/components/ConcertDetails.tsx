import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Users, Clock, Star, ChevronDown } from 'lucide-react';

export function ConcertDetails() {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Music,
      title: 'Live Performance',
      description: '4 hours of non-stop entertainment with top Tamil DJs and live musicians',
    },
    {
      icon: Users,
      title: 'Exclusive Guest List',
      description: "Celebrate with Singapore's Tamil community and special guests",
    },
    {
      icon: Clock,
      title: 'All Night Long',
      description: 'Party from 8 PM to midnight with multiple stages',
    },
    {
      icon: Star,
      title: 'Premium Experience',
      description: 'Luxurious venue, gourmet catering, and surprise performances',
    },
  ];

  const toggleFeature = (index: number) => {
    setExpandedFeature(expandedFeature === index ? null : index);
  };

  const lineup = [
    { name: 'DJ Anirudh', role: 'Headliner', time: '10:30 PM' },
    { name: 'The Thala Band', role: 'Live Performance', time: '9:00 PM' },
    { name: 'DJ Yuvan', role: 'Special Guest', time: '10:00 PM' },
    { name: 'DJ Karthik', role: 'Opening Act', time: '8:00 PM' },
  ];

  return (
    <div className="py-12 md:py-20 bg-[#0a0a12]">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 
            className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent mb-3 md:mb-4"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Event Highlights
          </h2>
          <p 
            className="text-sm md:text-lg text-purple-300 max-w-2xl mx-auto"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Step into a world of mystery and elegance
          </p>
        </motion.div>

        {/* Features - Collapsible Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-16 md:mb-20 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const isExpanded = expandedFeature === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div 
                  onClick={() => toggleFeature(index)}
                  className={`relative bg-gradient-to-br from-purple-900/60 to-black/60 backdrop-blur-sm p-4 md:p-5 rounded-xl border cursor-pointer transition-all ${
                    isExpanded ? 'border-yellow-500/50' : 'border-purple-500/20 hover:border-purple-400/40'
                  }`}
                >
                  {/* Title Row with Icon */}
                  <div className="flex items-center gap-2 md:gap-3">
                    <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 shrink-0" />
                    <h3 
                      className="text-sm md:text-base font-bold text-white flex-1"
                      style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.5px' }}
                    >
                      {feature.title}
                    </h3>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-purple-400" />
                    </motion.div>
                  </div>
                  
                  {/* Collapsible Description */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p 
                          className="text-purple-300 text-xs md:text-sm mt-3 pt-3 border-t border-purple-500/20"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {feature.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Lineup Section - More Compact */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h3 
            className="text-2xl md:text-4xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 md:mb-8"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Artist Lineup
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {lineup.map((artist, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-sm p-3 md:p-4 rounded-xl border border-purple-500/30 hover:border-yellow-500/50 transition-all text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center text-lg md:text-xl font-bold text-black mx-auto mb-2">
                    {index + 1}
                  </div>
                  <h4 
                    className="text-sm md:text-base font-bold text-white mb-0.5"
                    style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.5px' }}
                  >
                    {artist.name}
                  </h4>
                  <p 
                    className="text-purple-300 text-xs"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {artist.role}
                  </p>
                  <p 
                    className="text-yellow-400 text-xs md:text-sm font-bold mt-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {artist.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Dress Code - Compact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-12 md:mt-16 max-w-xl mx-auto text-center"
        >
          <div className="relative">
            <div className="relative bg-gradient-to-br from-purple-900/60 to-black/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-yellow-500/30">
              <h3 
                className="text-xl md:text-2xl font-bold text-yellow-400 mb-2 md:mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                🎭 Dress Code
              </h3>
              <p 
                className="text-base md:text-lg text-purple-200 mb-1"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Formal Masquerade Attire Required
              </p>
              <p 
                className="text-xs md:text-sm text-purple-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Evening wear + elegant mask
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

