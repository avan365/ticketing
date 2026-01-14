/**
 * Event Configuration Template
 *
 * This file contains all customizable variables for the event site.
 * Edit these values to rebrand the site for a new event.
 */

export const EventConfig = {
  // ═══════════════════════════════════════════════════════════════
  // EVENT INFORMATION
  // ═══════════════════════════════════════════════════════════════

  event: {
    // Main event name (displayed prominently)
    name: "ADHEERAA",

    // Event subtitle/description
    subtitle: "Masquerade Night",

    // Full event title (for page titles, emails, etc.)
    fullTitle: "ADHEERAA Masquerade Night 2026",

    // Event year
    year: "2026",

    // Event description (for meta tags, emails)
    description: "An exclusive evening of mystery, music, and elegance.",
  },

  // ═══════════════════════════════════════════════════════════════
  // DATE & TIME
  // ═══════════════════════════════════════════════════════════════

  dateTime: {
    // Event date (display format)
    date: "Friday, February 21, 2026",

    // Event time range
    time: "8:00 PM - 12:00 AM",

    // Start time (for sorting, etc.)
    startTime: "8:00 PM",

    // End time
    endTime: "12:00 AM",
  },

  // ═══════════════════════════════════════════════════════════════
  // VENUE INFORMATION
  // ═══════════════════════════════════════════════════════════════

  venue: {
    name: "Skyfall Rooftop Bar",
    location: "HarbourFront, Singapore",
    fullAddress: "Skyfall Rooftop Bar, HarbourFront, Singapore",
  },

  // ═══════════════════════════════════════════════════════════════
  // IMAGES & ASSETS
  // ═══════════════════════════════════════════════════════════════

  images: {
    // Main event poster (hero section)
    poster: "/poster.png",

    // Logo/favicon
    logo: "/logo.png",

    // Alt text for images
    posterAlt: "ADHEERAA Masquerade Night",
    logoAlt: "ADHEERAA Logo",
  },

  // ═══════════════════════════════════════════════════════════════
  // COLOR THEME
  // ═══════════════════════════════════════════════════════════════

  colors: {
    // Primary background color
    background: "#0a0a12",

    // Secondary background (cards, modals)
    backgroundSecondary: "#1a1a2e",

    // Primary accent color (amber/gold)
    primary: {
      light: "#fbbf24", // amber-400
      base: "#d97706", // amber-600
      dark: "#b45309", // amber-700
      gradient: "from-amber-400 to-amber-600",
      gradientFull: "from-amber-400 via-amber-500 to-amber-600",
    },

    // Secondary accent color (purple)
    secondary: {
      light: "#a78bfa", // purple-400
      base: "#9333ea", // purple-600
      dark: "#7e22ce", // purple-700
      gradient: "from-purple-400 to-purple-600",
    },

    // Text colors
    text: {
      primary: "#ffffff",
      secondary: "#c4b5fd", // purple-300
      muted: "#9ca3af", // gray-400
    },

    // Border colors
    border: {
      primary: "rgba(147, 51, 234, 0.3)", // purple-500/30
      secondary: "rgba(217, 119, 6, 0.3)", // amber-500/30
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // TYPOGRAPHY
  // ═══════════════════════════════════════════════════════════════

  fonts: {
    // Display font (for main headings)
    display: "Cinzel, serif",

    // Body font
    body: "Inter, sans-serif",

    // Accent font (for subtitles)
    accent: "Playfair Display, serif",
  },

  // ═══════════════════════════════════════════════════════════════
  // TICKET TYPES
  // ═══════════════════════════════════════════════════════════════

  tickets: [
    {
      id: "early-bird",
      name: "Early Bird",
      price: 25,
      description:
        "Limited time offer, full venue access. Get in before the crowd!",
    },
    {
      id: "regular",
      name: "Regular Admission",
      price: 35,
      description:
        "General admission with full venue access and all performances.",
    },
    {
      id: "table",
      name: "Table for 4",
      price: 200,
      description:
        "Reserved table seating, includes 1 premium bottle & priority service.",
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // EVENT DETAILS
  // ═══════════════════════════════════════════════════════════════

  features: [
    {
      icon: "Music",
      title: "Live Performance",
      description:
        "4 hours of non-stop entertainment with top Tamil DJs and live musicians",
    },
    {
      icon: "Users",
      title: "Exclusive Guest List",
      description:
        "Celebrate with Singapore's Tamil community and special guests",
    },
    {
      icon: "Clock",
      title: "All Night Long",
      description: "Party from 8 PM to midnight with multiple stages",
    },
    {
      icon: "Star",
      title: "Premium Experience",
      description:
        "Luxurious venue, gourmet catering, and surprise performances",
    },
  ],

  lineup: [
    { name: "DJ Anirudh", role: "Headliner" },
    { name: "DJ Yuvan", role: "Special Guest" },
  ],

  // ═══════════════════════════════════════════════════════════════
  // FOOTER & BRANDING
  // ═══════════════════════════════════════════════════════════════

  branding: {
    // Company/organization name
    companyName: "KLYCK Events",

    // Copyright text
    copyright: "© 2026 KLYCK Events. All rights reserved.",

    // Footer emojis (displayed in footer)
    footerEmojis: ["🎭", "✨", "🎶"],

    // CTA button text
    ctaButton: "Get Your Tickets 🎭",
  },

  // ═══════════════════════════════════════════════════════════════
  // META INFORMATION
  // ═══════════════════════════════════════════════════════════════

  meta: {
    // Page title
    title: "ADHEERAA Masquerade Night 2026",

    // Meta description
    description:
      "ADHEERAA Masquerade Night - An exclusive evening of mystery, music, and elegance. February 21, 2026 at Skyfall Rooftop Bar, Singapore.",

    // Theme color (for mobile browsers)
    themeColor: "#000000",
  },
} as const;

// Export individual sections for easier imports
export const {
  event,
  dateTime,
  venue,
  images,
  colors,
  fonts,
  tickets,
  features,
  lineup,
  branding,
  meta,
} = EventConfig;
