import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Music, Clock, Star, ChevronDown } from "lucide-react";
import { EventConfig } from "../config/eventConfig";

// Map icon names to components
const iconMap: { [key: string]: typeof Music } = {
  Music,
  Clock,
  Star,
};

export function ConcertDetails() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Use features from config, mapping icon names to components
  const features = EventConfig.features.map((f) => ({
    ...f,
    icon: iconMap[f.icon] || Music,
  }));

  return (
    <div
      className="py-8 md:py-24"
      style={{ backgroundColor: EventConfig.colors.background }}
    >
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
            Step into an evening where mystery reigns, masks conceal stories,
            and music commands the night.
          </p>
        </motion.div>

        {/* Features Grid - Collapsible on mobile, full cards on desktop */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 mb-8 md:mb-24">
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
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor =
                    EventConfig.colors.border.secondary)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.1)")
                }
              >
                {/* Mobile: Collapsible header */}
                <button
                  className="flex items-center justify-between w-full md:hidden"
                  onClick={() =>
                    setExpandedCard(expandedCard === index ? null : index)
                  }
                >
                  <div className="flex items-center gap-3">
                    <feature.icon
                      className="w-6 h-6"
                      style={{ color: `${EventConfig.colors.primary.base}B3` }}
                    />
                    <h3
                      className="text-lg font-semibold font-sans"
                      style={{ color: EventConfig.colors.text.primary }}
                    >
                      {feature.title}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expandedCard === index ? "rotate-180" : ""
                    }`}
                    style={{ color: `${EventConfig.colors.primary.base}CC` }}
                  />
                </button>

                {/* Mobile: Expandable description */}
                <AnimatePresence>
                  {expandedCard === index && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
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
                  <feature.icon
                    className="w-10 h-10 mb-4"
                    style={{ color: `${EventConfig.colors.primary.base}B3` }}
                  />
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

        {/* Dress Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-6 md:mt-24 max-w-3xl mx-auto"
        >
          <div className="relative">
            <div className="relative bg-white/5 backdrop-blur-sm p-4 md:p-12 rounded-xl border border-white/10">
              <div className="text-center mb-4 md:mb-6">
                <p
                  className="text-lg md:text-3xl text-amber-500/90 font-bold mb-3 md:mb-4"
                  style={{ fontFamily: EventConfig.fonts.display }}
                >
                  {EventConfig.dressCode.title}
                </p>
                <p
                  className="text-base md:text-2xl text-purple-200 mb-3 md:mb-4"
                  style={{ fontFamily: EventConfig.fonts.accent }}
                >
                  {EventConfig.dressCode.mainTitle}
                </p>
                <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-3 md:mb-4">
                  {EventConfig.dressCode.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-sm md:text-lg text-purple-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs md:text-base text-purple-200/80 max-w-2xl mx-auto font-sans">
                  {EventConfig.dressCode.description}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
