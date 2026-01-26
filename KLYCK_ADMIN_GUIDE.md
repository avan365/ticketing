# KLYCK Admin Dashboard Guide

## Overview

The KLYCK Admin Dashboard is a separate financial dashboard from the main admin page. It provides high-level financial summaries and reset capabilities.

## Access

**URL:** `/klyck-admin`

**Password:** `klyck2026` (change in `src/pages/KlyckAdminPage.tsx`)

**Session:** Remembers authentication for 24 hours (same as main admin page)

## Features

### Financial Summaries

The dashboard displays four key metrics:

1. **Total PayNow** - Sum of all verified PayNow orders (includes platform fees)
2. **Total Stripe** - Sum of all verified Stripe orders (includes platform fees)
3. **Event Revenue** - Total ticket revenue (excludes platform fees)
4. **Platform Fees** - Total platform fees collected

### Summary Section

- **Total Customer Payments** - Combined PayNow + Stripe payments
- **Total Orders (Verified)** - Count of verified orders
- **Net Revenue** - Event revenue + platform fees

### Reset Actions

- **Reset Inventory** - Restores all ticket availability to defaults (from config)
- **Reset All Orders** - Deletes all orders permanently (⚠️ Cannot be undone!)

## How It Works

### Financial Calculations

- **PayNow Total**: Sums `customerPays` for all verified orders with `paymentMethod: 'paynow'`
- **Stripe Total**: Sums `customerPays` for all verified orders with `paymentMethod: 'card'`
- **Event Revenue**: Sums `ticketSubtotal` for all verified orders (revenue without platform fees)
- **Platform Fees**: Sums `platformFee` for all verified orders

### Reset Functions

#### Reset Inventory
- Calls `resetInventory()` from `src/utils/inventory.ts`
- Restores ticket availability to default quantities (defined in `DEFAULT_QUANTITIES`)
- Uses ticket types and prices from `EventConfig.tickets`

#### Reset All Orders
- Calls `resetAllOrders()` from `src/utils/orders.ts`
- In production: Calls `DELETE /api/orders` endpoint
- In development: Clears localStorage
- ⚠️ **WARNING**: This permanently deletes all order data!

## Configuration

### Change Password

Edit `src/pages/KlyckAdminPage.tsx`:

```typescript
const KLYCK_ADMIN_PASSWORD = "your-new-password";
```

### Change Default Inventory Quantities

Edit `src/utils/inventory.ts`:

```typescript
const DEFAULT_QUANTITIES: { [key: string]: number } = {
  'early-bird': 150,
  'regular': 300,
  'table': 20,
};
```

## API Endpoints

### DELETE /api/orders

Resets all orders (used by reset function).

**Response:**
```json
{
  "success": true,
  "message": "All orders deleted"
}
```

## Differences from Main Admin Page

| Feature | Main Admin (`/admin`) | KLYCK Admin (`/klyck-admin`) |
|---------|----------------------|------------------------------|
| Purpose | Order management & verification | Financial summaries |
| Shows | Individual orders, ticket details | Aggregate financial metrics |
| Actions | Verify/reject orders, view details | View totals, reset data |
| Password | `adheeraa2026` | `klyck2026` |

## Security Notes

- Both admin pages use sessionStorage for 24-hour sessions
- Passwords are hardcoded (consider using environment variables for production)
- Reset actions require confirmation dialogs
- Order deletion cannot be undone

## Future Enhancements

- Export financial reports to CSV
- Date range filtering
- Payment method breakdown charts
- Revenue trends over time
- Integration with accounting systems



