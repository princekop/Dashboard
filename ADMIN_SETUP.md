# Admin Area Setup Guide

## Issues Fixed

### 1. Missing Dialog Component
✅ Created `@/components/ui/dialog.tsx`
✅ Installing `@radix-ui/react-dialog`

### 2. Admin Access Not Working
✅ Updated `/api/auth/login` to return `isAdmin` field
✅ Updated `/api/auth/me` to return `isAdmin` field  
✅ Updated `/api/auth/register` to return `isAdmin` field
✅ Added debug logging to `AdminCheck` component

## How to Make a User Admin

### Option 1: Direct Database Update (Recommended)
```bash
# Using Prisma Studio
npx prisma studio

# Find your user and set isAdmin = true
```

### Option 2: SQL Command
```bash
# Open Prisma Studio or database client
npx prisma studio

# Or use SQL directly in your database file
sqlite3 prisma/dev.db

UPDATE User SET isAdmin = 1 WHERE email = 'your@email.com';
```

### Option 3: Create Admin via API
Create this endpoint: `/api/admin/make-admin`

```typescript
// app/api/admin/make-admin/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const { email, secret } = await request.json()
  
  // Add a secret key for security
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true }
  })
  
  return NextResponse.json({ success: true, user: { email: user.email, isAdmin: user.isAdmin } })
}
```

Then call it:
```bash
curl -X POST http://localhost:3000/api/admin/make-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","secret":"YOUR_SECRET"}'
```

## Testing Admin Access

1. **Set isAdmin in database:**
   ```bash
   npx prisma studio
   # Find user → Set isAdmin = true → Save
   ```

2. **Logout and Login again:**
   - This refreshes the auth token with new isAdmin value
   - Go to `/login`
   - Login with your admin account

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for: `AdminCheck - User: ... isAdmin: true`

4. **Check sidebar:**
   - You should see "Admin" section with sub-items
   - Click to access `/admin` area

5. **Navigate to admin pages:**
   - `/admin` - Admin dashboard
   - `/admin/products` - Manage products
   - `/admin/orders` - Manage orders
   - `/admin/chats` - Customer chats
   - `/admin/pterodactyl` - Panel config

## Troubleshooting

### Admin Section Not Showing
1. Clear browser cookies
2. Logout completely
3. Update isAdmin in database
4. Login again (fresh token will include isAdmin)
5. Check browser console for debug logs

### Getting Redirected from /admin
1. Check console logs: `AdminCheck - User: ...`
2. Verify `isAdmin: true` in console
3. If `isAdmin: false`, update database and re-login
4. Clear cookies: `document.cookie.split(";").forEach(c => document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;')`

### Still Not Working?
1. Open browser DevTools → Application → Cookies
2. Delete `auth-token` cookie
3. Run in database:
   ```sql
   SELECT id, email, isAdmin FROM User WHERE email = 'your@email.com';
   ```
4. Verify isAdmin = 1 (true)
5. Login again
6. Check Network tab → `/api/auth/login` → Response should have `"isAdmin": true`

## Quick Admin User Creation

```bash
# 1. Create user via register page
# Go to /register and create account

# 2. Open Prisma Studio
npx prisma studio

# 3. Go to User model
# 4. Find your user by email
# 5. Click on isAdmin field
# 6. Change false → true
# 7. Click Save (green checkmark)

# 8. Logout and login again
# Visit /login

# 9. After login, you should see Admin section in sidebar
```

## Environment Variables

Add to `.env`:
```env
# Optional: For make-admin API endpoint
ADMIN_SECRET=your-super-secret-key-here
```

## Admin Routes

All admin routes are protected with `AdminCheck` wrapper:

- `/admin` - Dashboard
- `/admin/products` - Product management
- `/admin/products/new` - Create product
- `/admin/orders` - Order verification
- `/admin/chats` - Customer support chat
- `/admin/pterodactyl` - Panel configuration

## Admin Navigation

Admin section only appears in sidebar if `user.isAdmin === true`:

```tsx
{user?.isAdmin && <NavMain items={navItems.adminMain} />}
```

The sidebar checks auth context for isAdmin flag before rendering admin menu.
