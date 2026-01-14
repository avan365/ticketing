import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Users, Clock, Star, ChevronDown } from 'lucide-react';
import { EventConfig } from '../config/eventConfig';

// Map icon names to components
const iconMap: { [key: string]: typeof Music } = {
  Music,
  Users,
  Clock,
  Star,
};

export function ConcertDetails() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [lineupExpanded, setLineupExpanded] = useState(false);
  
  // Use features from config, mapping icon names to components
  const features = EventConfig.features.map(f => ({
    ...f,
    icon: iconMap[f.icon] || Music,
  }));

  const lineup = EventConfig.lineup;

  return (
    <div className="py-8 md:py-24" style={{ backgroundColor: EventConfig.colors.background }}>
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6 md:mb-20"
        >
          <h2 
            className={`text-3xl md:text-5xl lg:text-7xl font-bold bg-gradient-to-r ${EventConfig.colors.primary.gradient} bg-clip-text text-transparent mb-2 md:mb-6`}
            style={{ fontFamily: EventConfig.fonts.display }}
          >
            Event Highlights
          </h2>
          <p 
            className="text-sm md:text-xl max-w-3xl mx-auto px-2 font-sans"
            style={{ color: EventConfig.colors.text.secondary }}
          >
            Step into a world of mystery and elegance where music, art, and enchantment collide
          </p>
        </motion.div>

        {/* Features Grid - Collapsible on mobile, full cards on desktop */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 mb-8 md:mb-24">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="relative group h-full"
            >
              <div 
                className="relative bg-white/5 backdrop-blur-sm p-4 md:p-8 rounded-xl border transition-all h-full flex flex-col hover:bg-white/10"
                style={{ 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = EventConfig.colors.border.secondary}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              >
                {/* Mobile: Collapsible header */}
                <button 
                  className="flex items-center justify-between w-full md:hidden"
                  onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                >
                  <div className="flex items-center gap-3">
                    <feature.icon className="w-6 h-6" style={{ color: `${EventConfig.colors.primary.base}B3` }} />
                    <h3 
                      className="text-lg font-semibold font-sans"
                      style={{ color: EventConfig.colors.text.primary }}
                    >
                      {feature.title}
                    </h3>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${expandedCard === index ? 'rotate-180' : ''}`}
                    style={{ color: `${EventConfig.colors.primary.base}CC` }}
                  />
                </button>
                
                {/* Mobile: Expandable description */}
                <AnimatePresence>
                  {expandedCard === index && (
                    <motion.p 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-sm mt-3 md:hidden overflow-hidden font-sans"
                      style={{ color: EventConfig.colors.text.secondary }}
                    >
                      {feature.description}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Desktop: Always visible */}
                <div className="hidden md:block">
                  <feature.icon className="w-10 h-10 mb-4" style={{ color: `${EventConfig.colors.primary.base}B3` }} />
                  <h3 
                    className="text-2xl font-semibold mb-3 font-sans"
                    style={{ color: EventConfig.colors.text.primary }}
                  >
                    {feature.title}
                  </h3>
                  <p 
                    className="flex-1 font-sans"
                    style={{ color: EventConfig.colors.text.secondary }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lineup Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          {/* Mobile: Collapsible dropdown */}
          <div className="md:hidden">
            <button
              onClick={() => setLineupExpanded(!lineupExpanded)}
              className="w-full bg-gradient-to-r from-purple-900/50 to-purple-800/30 backdrop-blur-sm p-4 rounded-xl border border-purple-500/10 hover:border-purple-500/30 flex items-center justify-between shadow-sm transition-all"
            >
              <h3 
                className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                🎤 Artist Lineup
              </h3>
              <ChevronDown className={`w-6 h-6 text-purple-400 transition-transform ${lineupExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {lineupExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-2">
                    {lineup.map((artist, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-purple-900/40 to-purple-800/20 backdrop-blur-sm p-3 rounded-lg border border-purple-500/10 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500/80 to-amber-600/80 rounded-full flex items-center justify-center text-sm font-bold text-white border border-amber-400/30">
                            {index + 1}
                          </div>
                          <div>
                            <h4 
                              className="text-base font-semibold text-white font-sans"
                            >
                              {artist.name}
                            </h4>
                            <p 
                              className="text-purple-300 text-xs font-sans"
                            >
                              {artist.role}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop: Full lineup display */}
          <div className="hidden md:block">
            <h3 
              className="text-4xl lg:text-6xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-12"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Artist Lineup
            </h3>
            
            <div className="space-y-6">
              {lineup.map((artist, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-purple-600/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                  <div className="relative bg-gradient-to-r from-purple-900/50 to-purple-800/30 backdrop-blur-sm p-6 rounded-xl border border-purple-500/10 group-hover:border-purple-500/30 transition-all flex items-center justify-between shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-500/80 to-amber-600/80 rounded-full flex items-center justify-center text-2xl font-bold text-white border border-amber-400/30">
                        {index + 1}
                      </div>
                      <div>
                        <h4 
                          className="text-2xl font-semibold text-white mb-1 font-sans"
                        >
                          {artist.name}
                        </h4>
                        <p 
                          className="text-purple-300 font-sans"
                        >
                          {artist.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dress Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-6 md:mt-24 max-w-3xl mx-auto text-center"
        >
          <div className="relative">
            <div className="relative bg-white/5 backdrop-blur-sm p-4 md:p-12 rounded-xl border border-white/10">
              {/* Mobile: Two lines */}
              <div className="md:hidden">
                <p 
                  className="text-lg text-amber-500/90 font-bold"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  🎭 Dress Code
                </p>
                <p 
                  className="text-sm text-purple-200 mt-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Formal Masquerade Attire
                </p>
              </div>
              {/* Desktop: Full display */}
              <div className="hidden md:block">
                <h3 
                  className="text-4xl font-bold text-amber-500/90 mb-6"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  🎭 Dress Code 🎭
                </h3>
                <p 
                  className="text-2xl text-purple-200 mb-4"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Formal Masquerade Attire Required
                </p>
                <p 
                  className="text-lg text-purple-300 font-sans"
                >
                  Don your finest evening wear and an elegant mask. Let your mystique shine through!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

