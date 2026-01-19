# EmailJS QR Code Fix

## Problem
The QR codes are showing as raw HTML text instead of being rendered as images.

## Solution
EmailJS escapes HTML by default. To render HTML, you need to use **triple braces** `{{{variable}}}` instead of double braces `{{variable}}`.

## What to Change in EmailJS

1. **Go to your EmailJS template**: https://www.emailjs.com/templates
2. **Click "Edit" on your template**
3. **Click the "Code" tab**
4. **Find this line** (around line 259):
   ```
   {{qr_codes}}
   ```
5. **Change it to**:
   ```
   {{{qr_codes}}}
   ```
   (Note: THREE curly braces instead of two)

6. **Save the template**

## Why This Works

- `{{variable}}` = Escapes HTML (shows as text)
- `{{{variable}}}` = Renders HTML (shows as formatted content)

## Alternative: Update Template File

The `EMAIL_TEMPLATE.html` file has been updated to use `{{{qr_codes}}}`. If you want to re-copy the entire template:

1. Open `EMAIL_TEMPLATE.html` in this project
2. Copy everything from line 23 onwards
3. Paste into EmailJS template editor
4. Save

## Test

After making this change:
1. Make a new test purchase
2. Check the email - QR codes should now display as images
3. The QR code images should be visible and scannable


