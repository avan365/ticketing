# Project Summary: Event Ticketing System

## 🎯 Project Overview

A full-stack event ticketing platform with payment processing, QR code generation, email confirmations, and multi-role admin dashboards. Built as a template system that can be easily rebranded for different events.

---

## 🛠️ Technologies & Languages

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.6.2
- **Build Tool**: Vite 6.0.5
- **Styling**: Tailwind CSS 3.4.17
- **Animations**: Motion (Framer Motion) 11.15.0
- **Icons**: Lucide React 0.468.0
- **Routing**: React Router DOM 7.12.0

### Backend
- **Runtime**: Node.js
- **Server Framework**: Express.js (in `server/` directory)
- **Serverless Functions**: Vercel Serverless Functions (in `api/` directory)
- **Language**: JavaScript (Node.js)

### Database & Storage
- **Production**: Redis (via Vercel KV / Redis Labs)
- **Development**: localStorage (fallback)
- **Packages**: 
  - `@vercel/kv` - Vercel KV client
  - `redis` 5.10.0 - Native Redis client

### Payment Processing
- **Provider**: Stripe
- **Packages**: 
  - `@stripe/stripe-js` 8.6.1
  - `@stripe/react-stripe-js` 5.4.1
  - `stripe` 20.1.2

### Email Service
- **Provider**: EmailJS
- **Package**: `@emailjs/browser` 4.4.1

### QR Code Features
- **Generation**: `qrcode` 1.5.4
- **Scanning**: `html5-qrcode` 2.3.8
- **Types**: `@types/qrcode` 1.5.6

### PDF Generation
- **Library**: jsPDF 4.0.0
- **Helper**: html2canvas 1.4.1

### Deployment
- **Platform**: Vercel
- **Configuration**: `vercel.json`

---

## ✨ Key Features

### 1. **Customer-Facing Features**
- 🎫 **Ticket Selection** - Multiple ticket types with availability tracking
- 🛒 **Shopping Cart** - Add/remove tickets, quantity management
- 💳 **Payment Processing** - Stripe (card, Apple Pay, GrabPay) and PayNow
- 📧 **Email Confirmations** - Automated emails with QR codes
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🎨 **Modern UI** - Smooth animations, gradient designs, dark theme

### 2. **QR Code System**
- 🔲 **Individual QR Codes** - Each ticket gets a unique QR code
- 📧 **Email Delivery** - QR codes embedded in confirmation emails
- 📄 **PDF Generation** - Optional PDF with QR codes
- 🔍 **QR Scanning** - Camera-based scanning for ticket validation

### 3. **Admin Dashboard** (`/admin`)
- 🔐 **Password Protected** - Session-based authentication (24 hours)
- 📊 **Order Management** - View, verify, reject orders
- 📈 **Revenue Tracking** - Real-time revenue calculations
- 📋 **Order Details** - Customer info, payment status, ticket breakdown
- ✅ **Order Verification** - Manual verification for PayNow orders
- 📧 **Email Sending** - Send confirmation emails after verification
- 🔄 **Auto-Refresh** - Updates every 5 seconds
- 📊 **Statistics** - Total orders, pending, verified, rejected

### 4. **Bouncer Portal** (`/bouncer`)
- 📷 **QR Code Scanner** - Camera-based ticket scanning
- ⌨️ **Manual Entry** - Fallback for QR code issues
- ✅ **Ticket Validation** - Real-time status checking
- 🚫 **Duplicate Prevention** - Prevents double-scanning
- 📝 **Scan History** - Tracks who scanned and when
- ⚠️ **Error Handling** - Clear error messages for invalid tickets

### 5. **KLYCK Admin Dashboard** (`/klyck-admin`)
- 💰 **Financial Summaries**:
  - Total PayNow (includes platform fees)
  - Total Stripe (includes platform fees)
  - Event Revenue (excludes platform fees)
  - Platform Fees collected
  - Amount Owed (Event Revenue - PayNow)
- 📊 **Summary Metrics**:
  - Total Customer Payments
  - Total Verified Orders
  - Net Revenue
- 🔄 **Reset Functions** (password protected):
  - Reset Inventory
  - Reset All Orders
- 🔐 **Override Password** - Separate password for destructive actions

### 6. **Template System**
- 🎨 **Centralized Config** - All branding in `src/config/eventConfig.ts`
- 🎭 **Easy Rebranding** - Change event name, colors, images, dates
- 📧 **Config-Based Emails** - Email template uses config values
- 🎫 **Dynamic Tickets** - Ticket types from config

### 7. **Payment Features**
- 💳 **Stripe Integration**:
  - Credit/Debit cards
  - Apple Pay
  - GrabPay
  - Automatic verification
- 💰 **PayNow Integration**:
  - Manual payment proof upload
  - Admin verification required
  - UEN display for payment
- 💵 **Fee Calculation**:
  - Platform fees (configurable percentage)
  - Stripe processing fees
  - Transparent fee breakdown

### 8. **Inventory Management**
- 📦 **Real-Time Availability** - Live ticket counts
- 🔄 **Auto-Sync** - Syncs with config for prices/names
- 📊 **Inventory Tracking** - Sold, reserved, available counts
- 🔄 **Reset Function** - Restore to defaults

---

## 📁 Project Structure

```
adheera/
├── src/
│   ├── components/          # React components
│   │   ├── AdminDashboard.tsx
│   │   ├── CheckoutModal.tsx
│   │   ├── ConcertDetails.tsx
│   │   ├── Hero.tsx
│   │   ├── StripePayment.tsx
│   │   └── TicketSelection.tsx
│   ├── config/
│   │   └── eventConfig.ts   # Template configuration
│   ├── pages/
│   │   ├── AdminPage.tsx
│   │   ├── BouncerPage.tsx
│   │   └── KlyckAdminPage.tsx
│   ├── utils/
│   │   ├── email.ts         # EmailJS integration
│   │   ├── inventory.ts     # Inventory management
│   │   ├── orders.ts         # Order CRUD operations
│   │   ├── qrcode.ts         # QR code generation
│   │   └── stripe.ts         # Stripe payment logic
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point with routing
├── api/                     # Vercel serverless functions
│   ├── create-payment-intent.js
│   └── orders.js            # Order API endpoints
├── server/                  # Express backend (dev)
│   ├── index.js
│   └── package.json
├── public/                  # Static assets
│   ├── logo.png
│   └── poster.png
└── Documentation files
    ├── CONFIG_GUIDE.md
    ├── KLYCK_ADMIN_GUIDE.md
    ├── PRODUCTION_CHECKLIST.md
    └── NEXT_STEPS.md
```

---

## 🔌 API Endpoints

### Vercel Serverless Functions (`/api/`)

#### `/api/orders`
- `GET /api/orders` - Get all orders
- `GET /api/orders?orderNumber=XXX` - Get order by number
- `GET /api/orders?ticketId=XXX` - Find ticket by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:orderNumber` - Update order status
- `PATCH /api/orders/ticket` - Update individual ticket status
- `DELETE /api/orders` - Reset all orders

#### `/api/create-payment-intent`
- `POST /api/create-payment-intent` - Create Stripe payment intent

---

## 🔐 Security Features

- **Password Protection**:
  - Admin Dashboard: `adheeraa2026`
  - KLYCK Admin: `klyck2026`
  - Override Password: `override`
- **Session Management**: 24-hour session persistence
- **CORS Configuration**: Configured for production
- **Environment Variables**: Sensitive data in env vars

---

## 🎨 Design & UI

- **Color Scheme**: Dark theme with amber/gold and purple accents
- **Typography**: 
  - Display: Cinzel (serif)
  - Body: Inter (sans-serif)
  - Accent: Playfair Display (serif)
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design, works on all screen sizes
- **Accessibility**: Semantic HTML, proper ARIA labels

---

## 📦 Key Dependencies

### Production Dependencies
- React ecosystem (React, React DOM, React Router)
- Stripe payment processing
- EmailJS for email delivery
- QR code generation and scanning
- PDF generation
- Motion animations
- Redis for data persistence

### Development Dependencies
- TypeScript
- Vite
- Tailwind CSS
- PostCSS
- Autoprefixer

---

## 🚀 Deployment

- **Platform**: Vercel
- **Frontend**: Static site (Vite build)
- **Backend**: Serverless functions
- **Database**: Redis (Vercel KV or Redis Labs)
- **Environment**: Production-ready with environment variables

---

## 📊 Data Models

### Order
```typescript
{
  id: string
  orderNumber: string
  createdAt: string
  status: "pending" | "verified" | "rejected"
  paymentMethod: "paynow" | "card"
  customerName: string
  customerEmail: string
  customerPhone: string
  tickets: Array<{name, quantity, price}>
  totalAmount: number
  ticketSubtotal?: number
  platformFee?: number
  stripeFee?: number
  customerPays?: number
  individualTickets?: Array<IndividualTicket>
  proofOfPayment?: string
}
```

### IndividualTicket
```typescript
{
  ticketId: string
  ticketType: string
  qrCodeDataUrl: string
  status: "valid" | "used" | "invalid"
  scannedAt?: string
  scannedBy?: string
}
```

### TicketInventory
```typescript
{
  [ticketId: string]: {
    name: string
    price: number
    available: number
    sold: number
    reserved: number
  }
}
```

---

## 🔄 Workflow

1. **Customer Flow**:
   - Browse tickets → Add to cart → Checkout → Payment → Receive email with QR codes

2. **Admin Flow**:
   - Login → View orders → Verify PayNow orders → Send confirmation emails

3. **Bouncer Flow**:
   - Access portal → Scan QR code → Validate ticket → Update status

4. **KLYCK Admin Flow**:
   - Login → View financial summaries → Reset data (with override password)

---

## 📝 Configuration

All customizable values are in `src/config/eventConfig.ts`:
- Event information (name, dates, venue)
- Color theme
- Typography
- Ticket types and prices
- Event features and lineup
- Branding (company name, copyright)
- Images (poster, logo)

---

## 🧪 Testing

- Local development with hot reload
- Stripe test mode for payment testing
- EmailJS test emails
- QR code scanning on mobile devices
- Cross-device order access testing

---

## 📚 Documentation

- `README.md` - Setup instructions
- `CONFIG_GUIDE.md` - Template configuration guide
- `KLYCK_ADMIN_GUIDE.md` - Financial dashboard guide
- `PRODUCTION_CHECKLIST.md` - Deployment checklist
- `NEXT_STEPS.md` - Production readiness guide
- `DATABASE_SETUP.md` - Database configuration
- `TESTING_GUIDE.md` - Testing instructions

---

## 🎯 Use Cases

- Event ticketing (concerts, parties, conferences)
- Multi-tier ticket pricing
- Payment processing (Stripe + PayNow)
- QR code-based entry management
- Financial reporting and analytics
- Template-based event rebranding

---

## 🔮 Future Enhancements

- Export financial reports to CSV
- Date range filtering for analytics
- Payment method breakdown charts
- Revenue trends over time
- Integration with accounting systems
- Multi-event support
- Advanced analytics dashboard

---

## 📄 License

Private project - All rights reserved

---

## 👥 Credits

Built for KLYCK Events / ADHEERAA Events
Deployed on Vercel
Powered by React, Stripe, and Redis

