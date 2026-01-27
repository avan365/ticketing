# EmailJS Template Setup Guide

## Quick Setup Steps

1. **Go to EmailJS Dashboard**: https://www.emailjs.com/templates
2. **Create New Template** (or edit existing one)
3. **Configure Template Settings**:
   - **Subject**: `Your ADHEERAA Ticket Confirmation - Order #{{order_number}}`
   - **To Email**: `{{to_email}}`
   - **From Name**: `ADHEERAA Events`
   - **Reply To**: Your email address

4. **Copy the HTML Template**:
   - Open `EMAIL_TEMPLATE.html` in this project
   - Copy everything from line 23 onwards (the HTML code)
   - Paste it into EmailJS template editor (click "Code" tab)

5. **Important Variables**:
   The template uses these variables (automatically filled by the code):
   - `{{to_name}}` - Customer name
   - `{{to_email}}` - Customer email
   - `{{order_number}}` - Order number (e.g., ORD-12345)
   - `{{tickets}}` - List of tickets purchased
   - `{{total_amount}}` - Total amount paid
   - `{{payment_method}}` - Payment method used
   - `{{payment_status}}` - Payment status (Confirmed/Pending)
   - `{{qr_codes}}` - **NEW**: HTML with QR code images for each ticket
   - `{{event_name}}` - Event name
   - `{{event_date}}` - Event date
   - `{{event_time}}` - Event time
   - `{{event_venue}}` - Event venue

## QR Codes in Email

The `{{qr_codes}}` variable contains HTML with:
- Each ticket's QR code as an image
- Ticket ID for each ticket
- Ticket type (Early Bird, Regular, etc.)

**Note**: If an order doesn't have QR codes yet (old orders), this variable will be empty and won't break the email.

## Testing

After setting up:
1. Make a test purchase
2. Check the confirmation email
3. Verify QR codes are displayed correctly
4. Test scanning the QR codes with the bouncer portal

## Troubleshooting

**QR codes not showing?**
- Make sure you're using the updated `EMAIL_TEMPLATE.html` with `{{qr_codes}}` included
- Check that orders are being created with `individualTickets` (new orders only)
- Verify EmailJS template has `{{qr_codes}}` variable in the HTML

**Images not loading?**
- QR codes are embedded as base64 data URLs, so they should work in most email clients
- Some email clients may block images - customers can still use manual entry in bouncer portal




