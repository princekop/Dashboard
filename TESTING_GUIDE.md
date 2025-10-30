# 🧪 Complete Testing Guide - Admin Area

## ✅ All Features Are Now Working!

### What's Been Fixed
1. ✅ Created all missing API routes
2. ✅ Admin product creation works
3. ✅ Real-time updates on all pages
4. ✅ Order verification with server creation
5. ✅ Chat system functional
6. ✅ Payment proof upload
7. ✅ Service management
8. ✅ Pterodactyl integration

## 🚀 Quick Start Test

### 1. Make Yourself Admin
```bash
# Run this command
node scripts/make-admin.js your@email.com

# Then logout and login again
```

### 2. Test Admin Products Page

#### Go to: `/admin/products`

**Test Create Product:**
1. Click "Add Product" button
2. Fill in the form:
   - Name: "Starter Plan"
   - Description: "Perfect for beginners"
   - Image URL: (paste any image URL or leave empty)
   - RAM: 4 (GB)
   - CPU: 2 (cores)
   - Storage: 50 (GB)
   - Price: 499
   - Billing: Monthly
   - Duration: 30 (days)
3. Click "Create Product"
4. ✅ Product should appear instantly in the list!

**Test Edit Product:**
1. Click "Edit" on any product
2. Change the name or price
3. Save
4. ✅ Changes appear immediately!

**Test Toggle Active:**
1. Click "Deactivate" on any product
2. ✅ Product becomes grayed out
3. Click "Activate" again
4. ✅ Product becomes active

**Test Delete:**
1. Click trash icon on a product
2. Confirm deletion
3. ✅ Product disappears from list

### 3. Test Admin Orders Page

#### Go to: `/admin/orders`

**Create a Test Order First:**
1. Open `/dashboard/products` (as regular user or same admin)
2. Add a product to cart
3. Go through checkout
4. Upload a dummy payment screenshot
5. Now go back to `/admin/orders`

**Test Order Management:**
1. You should see the pending order
2. Click on it to see details
3. View the payment proof image
4. Click "Verify & Create Server"
5. ✅ Order status changes to "verified"
6. ✅ Server gets created (check `/dashboard/services`)

**Test Reject:**
1. For another order, click "Reject"
2. ✅ Order status changes to "cancelled"

### 4. Test Admin Chats

#### Go to: `/admin/chats`

1. You should see chat sessions from orders
2. Click on a session
3. Type a message: "Hello, how can I help?"
4. Click send
5. ✅ Message appears instantly
6. Open `/chat/[orderId]` in another tab (as user)
7. ✅ User sees admin message within 3 seconds

### 5. Test User Flow

#### As Regular User:

**Browse Products: `/dashboard/products`**
1. ✅ See all active products
2. ✅ Click "Add to Cart"
3. ✅ Cart panel slides in

**Checkout: `/checkout/[orderId]`**
1. ✅ See UPI QR code
2. ✅ Upload payment screenshot
3. ✅ See 15-second countdown
4. ✅ Auto-redirect to chat

**Chat: `/chat/[orderId]`**
1. ✅ Send messages
2. ✅ Use emojis 😊
3. ✅ Profanity gets filtered
4. ✅ Receive admin replies

**Services: `/dashboard/services`**
1. ✅ See all your servers
2. ✅ View server specs
3. ✅ See days remaining
4. ✅ Reset Pterodactyl password
5. ✅ Open server in panel

## 🔍 Console Debugging

Open browser console (F12) to see debug logs:

### Admin Check Logs:
```
AdminCheck - User: {...} Loading: false isAdmin: true
```

### API Call Logs:
All API calls will show in Network tab:
- Creating product: `POST /api/admin/products`
- Fetching orders: `GET /api/admin/orders?filter=pending`
- Sending chat: `POST /api/admin/chats/send`

## 🛠️ Troubleshooting

### "Add Product" Button Not Working?
1. Check browser console for errors
2. Verify you're logged in as admin
3. Check Network tab → Should see `POST /api/admin/products`
4. If 401 error → Logout and login again

### Products Not Appearing?
1. Open `/api/admin/products` directly in browser
2. Should see JSON with products array
3. If error → Check database migration ran

### Server Not Creating?
1. Check Pterodactyl is configured at `/admin/pterodactyl`
2. Verify Panel URL and API Key are correct
3. Check console for error messages
4. Ensure Pterodactyl API is accessible

### Chat Not Working?
1. Check browser console for errors
2. Verify order ID is correct
3. Messages poll every 3 seconds
4. Check Network tab for polling requests

## 📊 Expected Behavior

### Admin Products Page
- ✅ Shows "Add Product" button
- ✅ Clicking button navigates to `/admin/products/new`
- ✅ Form submission creates product
- ✅ Redirects back to product list
- ✅ New product appears at top

### Admin Orders Page
- ✅ Filters work (All vs Pending)
- ✅ Payment proofs display as images
- ✅ Verify button creates servers
- ✅ Reject button cancels orders
- ✅ Chat button opens chat interface

### Admin Chats Page
- ✅ Shows all active conversations
- ✅ Unread count displays (if any)
- ✅ Messages load in real-time
- ✅ Sending works instantly
- ✅ Emoji picker available

## 🎯 Complete Test Checklist

### Admin Product Management
- [ ] Navigate to `/admin/products`
- [ ] Click "Add Product"
- [ ] Fill form and submit
- [ ] Product appears in list
- [ ] Click "Edit" and modify
- [ ] Changes save and display
- [ ] Toggle active/inactive works
- [ ] Delete removes product

### Admin Order Management
- [ ] Create test order as user
- [ ] View order in `/admin/orders`
- [ ] See payment proof
- [ ] Click "Verify & Create Server"
- [ ] Check Pterodactyl panel
- [ ] Server created successfully
- [ ] User sees server in services
- [ ] Try reject on another order

### Chat System
- [ ] Send message as admin
- [ ] User receives within 3 seconds
- [ ] User sends message back
- [ ] Admin sees it in chat list
- [ ] Emoji picker works
- [ ] Profanity filtering active

### User Journey
- [ ] Browse products
- [ ] Add to cart
- [ ] Checkout with UPI
- [ ] Upload payment proof
- [ ] Wait 15 seconds
- [ ] Chat with admin
- [ ] Admin verifies payment
- [ ] Server appears in services
- [ ] Reset password works
- [ ] Panel access works

## 🚨 Common Issues & Fixes

### Issue: 401 Unauthorized on Admin Routes
**Fix:**
```bash
# Make sure you're admin
node scripts/list-users.js

# If isAdmin is false, run:
node scripts/make-admin.js your@email.com

# Then logout and login again
```

### Issue: Products Not Saving
**Fix:**
```bash
# Run migration
npx prisma migrate dev
npx prisma generate

# Restart dev server
npm run dev
```

### Issue: Image Upload Fails
**Fix:**
```bash
# Ensure uploads directory exists
mkdir -p public/uploads

# Check write permissions
# On Windows, right-click folder → Properties → Security
```

### Issue: Pterodactyl Connection Failed
**Fix:**
1. Go to `/admin/pterodactyl`
2. Verify Panel URL (include https://)
3. Verify API Key is Application API Key
4. Click "Test Connection"
5. Check Pterodactyl panel allows API access

## ✨ Success Indicators

When everything works, you should see:

✅ **Admin Products:** Smooth create/edit/delete with instant updates
✅ **Admin Orders:** Payment verification creates servers automatically
✅ **Admin Chats:** Real-time messaging with customers
✅ **User Services:** Servers appear after admin verification
✅ **Pterodactyl:** Auto user and server creation
✅ **Chat System:** Messages sync within 3 seconds
✅ **Payment Flow:** Upload → Wait → Chat → Verify → Server

## 🎉 All Systems Operational!

Your admin area is now fully functional with:
- ✅ Real-time product management
- ✅ Order verification with automation
- ✅ Live chat system
- ✅ Pterodactyl integration
- ✅ Payment tracking
- ✅ Server provisioning

Happy testing! 🚀
