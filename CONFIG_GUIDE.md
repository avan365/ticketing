# Event Configuration Guide

This site is now fully templated! All customizable values are centralized in `src/config/eventConfig.ts`.

## Quick Start

To rebrand the site for a new event, simply edit `src/config/eventConfig.ts`:

```typescript
export const EventConfig = {
  event: {
    name: "YOUR_EVENT_NAME",
    subtitle: "Your Event Subtitle",
    // ... etc
  },
  // ... update other values
}
```

## What's Configurable

### 1. Event Information
- `event.name` - Main event name (displayed prominently)
- `event.subtitle` - Event subtitle/description
- `event.fullTitle` - Full event title (for emails, page titles)
- `event.year` - Event year
- `event.description` - Meta description

### 2. Date & Time
- `dateTime.date` - Event date (display format)
- `dateTime.time` - Event time range
- `dateTime.startTime` / `dateTime.endTime` - Individual times

### 3. Venue
- `venue.name` - Venue name
- `venue.location` - Venue location
- `venue.fullAddress` - Complete address

### 4. Images
- `images.poster` - Path to event poster (`/poster.png`)
- `images.logo` - Path to logo/favicon (`/logo.png`)
- `images.posterAlt` / `images.logoAlt` - Alt text

### 5. Color Theme
- `colors.background` - Primary background color
- `colors.backgroundSecondary` - Secondary background
- `colors.primary` - Primary accent colors (amber/gold)
- `colors.secondary` - Secondary accent colors (purple)
- `colors.text` - Text colors (primary, secondary, muted)
- `colors.border` - Border colors

### 6. Typography
- `fonts.display` - Display font (headings)
- `fonts.body` - Body font
- `fonts.accent` - Accent font (subtitles)

### 7. Ticket Types
- `tickets[]` - Array of ticket types with:
  - `id` - Unique identifier
  - `name` - Ticket name
  - `price` - Ticket price
  - `description` - Ticket description

### 8. Event Details
- `features[]` - Event features (icons, titles, descriptions)
- `lineup[]` - Artist lineup (name, role, time)

### 9. Branding
- `branding.companyName` - Company/organization name
- `branding.copyright` - Copyright text
- `branding.footerEmojis` - Footer emoji array
- `branding.ctaButton` - CTA button text

### 10. Meta Information
- `meta.title` - Page title
- `meta.description` - Meta description
- `meta.themeColor` - Theme color for mobile browsers

## Example: Rebranding for a New Event

```typescript
export const EventConfig = {
  event: {
    name: "SUMMER FEST",
    subtitle: "Music & Arts Festival",
    fullTitle: "SUMMER FEST Music & Arts Festival 2026",
    year: "2026",
    description: "A celebration of music, art, and community.",
  },
  
  dateTime: {
    date: "Saturday, July 15, 2026",
    time: "2:00 PM - 11:00 PM",
    startTime: "2:00 PM",
    endTime: "11:00 PM",
  },
  
  venue: {
    name: "Central Park",
    location: "New York, NY",
    fullAddress: "Central Park, New York, NY",
  },
  
  images: {
    poster: "/summer-fest-poster.png",
    logo: "/summer-fest-logo.png",
    posterAlt: "Summer Fest Music & Arts Festival",
    logoAlt: "Summer Fest Logo",
  },
  
  colors: {
    background: "#0a0a12",
    backgroundSecondary: "#1a1a2e",
    primary: {
      light: "#60a5fa",      // blue-400
      base: "#3b82f6",       // blue-600
      dark: "#2563eb",       // blue-700
      gradient: "from-blue-400 to-blue-600",
      gradientFull: "from-blue-400 via-blue-500 to-blue-600",
    },
    // ... etc
  },
  
  tickets: [
    {
      id: 'general',
      name: 'General Admission',
      price: 50,
      description: 'Full access to all stages and performances.',
    },
    {
      id: 'vip',
      name: 'VIP Pass',
      price: 150,
      description: 'VIP access with exclusive area and perks.',
    },
  ],
  
  // ... update other sections
}
```

## Files That Use the Config

The following files automatically use values from `eventConfig.ts`:

- ✅ `src/App.tsx` - Footer, tickets, colors
- ✅ `src/components/Hero.tsx` - Event name, dates, venue, images
- ✅ `src/components/ConcertDetails.tsx` - Features, lineup, colors
- ✅ `src/components/CheckoutModal.tsx` - Event name, company name
- ✅ `src/pages/BouncerPage.tsx` - Event name
- ✅ `src/pages/AdminPage.tsx` - Colors (via config)
- ✅ `src/utils/email.ts` - Event name in emails/PDFs

## Notes

1. **Images**: Place your images in the `public/` folder and update paths in `images.poster` and `images.logo`.

2. **Colors**: Colors use Tailwind classes for gradients. For custom colors, you can use hex values with inline styles (see `Hero.tsx` for examples).

3. **Icons**: Feature icons are mapped by name. Available icons: `Music`, `Users`, `Clock`, `Star`. To add more, update the `iconMap` in `ConcertDetails.tsx`.

4. **Fonts**: Fonts are loaded in `index.html`. To change fonts, update both the config and the font link in `index.html`.

5. **Admin Password**: Still managed in `src/utils/orders.ts` (separate from config for security).

## Testing Your Changes

After updating the config:

1. Restart your dev server (`npm run dev`)
2. Check all pages:
   - Home page (Hero, ConcertDetails, Footer)
   - Admin page
   - Bouncer page
   - Checkout modal
3. Test email confirmations
4. Verify colors, fonts, and images display correctly

## Need Help?

- Check `src/config/eventConfig.ts` for all available options
- Look at component files to see how config values are used
- All config values are TypeScript-typed for autocomplete support

