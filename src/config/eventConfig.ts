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
    description:
      "Step into an evening where mystery reigns, masks conceal stories, and music commands the night.",
  },

  // ═══════════════════════════════════════════════════════════════
  // DATE & TIME
  // ═══════════════════════════════════════════════════════════════

  dateTime: {
    // Event date (display format)
    date: "Saturday, February 21, 2026",

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
    name: "Skyfall Rooftop Restrobar",
    location: "HarbourFront, Singapore",
    fullAddress: "Skyfall Rooftop Restrobar, HarbourFront, Singapore",
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
      id: "phase-i",
      name: "Phase I",
      price: 17,
      description: "Be among the first to enter ADHEERAA. Mask included.",
      locked: true, // Set to true to lock this phase
      showOnDashboard: true, // Show on customer dashboard
    },
    {
      id: "phase-ii",
      name: "Phase II",
      price: 20,
      description: "Phase II tickets. Mask included.",
      locked: false,
      showOnDashboard: false, // Hidden from dashboard, but shown in inventory
    },
    {
      id: "phase-iii",
      name: "Phase III",
      price: 25,
      description: "The heart of the masquerade experience. Mask included.",
      locked: false, // Set to true to lock this phase
      showOnDashboard: true, // Show on customer dashboard
    },
    {
      id: "group-bundle",
      name: "Bundle for 5",
      price: 100,
      description: "Bundle for 5 tickets. Mask included.",
      locked: false, // Set to true to lock this phase
      showOnDashboard: true, // Show on customer dashboard
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // EVENT DETAILS
  // ═══════════════════════════════════════════════════════════════

  features: [
    {
      icon: "Music",
      title: "DJ Performances",
      description:
        "Two curated DJs delivering high-energy Tamil, fusion, and party anthems — seamless sets from start to midnight.",
    },
    {
      icon: "Clock",
      title: "Non-Stop Nightlife",
      description:
        "From 8PM till midnight — seamless transitions, no dull moments, only rising energy.",
    },
    {
      icon: "Star",
      title: "Premium Experience",
      description:
        "Rooftop views, immersive visuals, elevated sound, and a venue designed for unforgettable moments.",
    },
    {
      icon: "Camera",
      title: "Photobooth",
      description: "Pose like nobody's watching. We'll handle the rest.",
    },
  ],

  // Lineup removed - no longer displayed
  lineup: [],

  // ═══════════════════════════════════════════════════════════════
  // DRESS CODE
  // ═══════════════════════════════════════════════════════════════

  dressCode: {
    title: "🎭 Dress Code",
    mainTitle: "Elegant Cocktail Attire",
    tags: ["✨ Classy", "🎩 Polished", "🖤 Intentional"],
    description:
      "Think dresses, clean shirts, statement fits — elevated but comfortable. No slippers, no shorts, no tshirts, no jeans.",
  },

  // ═══════════════════════════════════════════════════════════════
  // MASK INFORMATION
  // ═══════════════════════════════════════════════════════════════

  maskInfo: {
    title: "🎭 Your Mask Is Included",
    description:
      "Every ticket includes a complimentary masquerade mask. Masquerade masks are provided at entry.",
    disclaimer: "Masks are available while stocks last.",
  },

  // ═══════════════════════════════════════════════════════════════
  // FAQ
  // ═══════════════════════════════════════════════════════════════

  faq: [
    {
      question: "Do I need to bring my own mask?",
      answer: "No. Every ticket includes a complimentary masquerade mask.",
    },
    {
      question: "Can I customize my mask at the event?",
      answer:
        "For this event, masks are provided as-is and cannot be customized on-site.",
    },
    {
      question: "Can I bring my own mask?",
      answer: "Yes, as long as it aligns with formal masquerade attire.",
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // IMPORTANT INFORMATION
  // ═══════════════════════════════════════════════════════════════

  importantInfo: {
    title: "📋 Important Information",
    items: [
      "18+ event — valid physical ID required for entry",
      "Masks are mandatory on entry (complimentary mask included with every ticket)",
      "Personal masks are allowed, subject to entry approval",
      "Tickets are non-refundable but transferable",
      "Venue reserves the right to refuse entry or remove guests for inappropriate behaviour",
      "Be respectful to staff, DJs, and fellow guests",
      "Photos and videos will be taken during the event",
      "Vomitting would incur a fine and guest may be asked to leave",
    ],
    closing:
      "Behave. Look good. Stay mysterious. The rest is between you and the dance floor.",
  },

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
    ctaButton: "Reserve your night 🎭",
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
  dressCode,
  maskInfo,
  faq,
  importantInfo,
  branding,
  meta,
} = EventConfig;
