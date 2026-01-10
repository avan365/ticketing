import { motion } from 'motion/react';
import { Music, Users, Clock, Star } from 'lucide-react';

export function ConcertDetails() {
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

  const lineup = [
    { name: 'DJ Anirudh', role: 'Headliner', time: '10:30 PM' },
    { name: 'The Thala Band', role: 'Live Performance', time: '9:00 PM' },
    { name: 'DJ Yuvan', role: 'Special Guest', time: '10:00 PM' },
    { name: 'DJ Karthik', role: 'Opening Act', time: '8:00 PM' },
  ];

  return (
    <div className="py-24 bg-[#0a0a12]">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 
            className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent mb-6"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Event Highlights
          </h2>
          <p 
            className="text-xl text-purple-300 max-w-3xl mx-auto"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Step into a world of mystery and elegance where music, art, and enchantment collide
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
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
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-purple-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-gradient-to-br from-purple-900/40 to-black/40 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 group-hover:border-yellow-500/50 transition-all h-full flex flex-col">
                <feature.icon className="w-12 h-12 text-yellow-400 mb-4" />
                <h3 
                  className="text-2xl font-bold text-white mb-3"
                  style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-purple-200 flex-1"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {feature.description}
                </p>
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
                <div className="relative bg-gradient-to-r from-purple-900/50 to-purple-800/30 backdrop-blur-sm p-6 rounded-xl border border-purple-500/30 group-hover:border-yellow-500/50 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center text-2xl font-bold text-black">
                      {index + 1}
                    </div>
                    <div>
                      <h4 
                        className="text-2xl font-bold text-white mb-1"
                        style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
                      >
                        {artist.name}
                      </h4>
                      <p 
                        className="text-purple-300"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {artist.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p 
                      className="text-xl font-bold text-yellow-400"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {artist.time}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Dress Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-24 max-w-3xl mx-auto text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-purple-600/10 to-yellow-500/10 rounded-3xl blur-2xl" />
            <div className="relative bg-gradient-to-br from-purple-900/60 to-black/60 backdrop-blur-sm p-12 rounded-3xl border-2 border-yellow-500/30">
              <h3 
                className="text-4xl font-bold text-yellow-400 mb-6"
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
                className="text-lg text-purple-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Don your finest evening wear and an elegant mask. Let your mystique shine through!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

