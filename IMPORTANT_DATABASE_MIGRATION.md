# ⚠️ IMPORTANT: Database Migration Required

## Issue: Login Failing with 500 Errors

If you're seeing login errors after the latest update, it's because the database schema has been migrated from **SQLite** to **PostgreSQL**, but your `.env` file still has the old SQLite configuration.

---

## 🚨 Quick Fix (Option 1: Keep SQLite for Now)

If you want to keep using SQLite temporarily:

### 1. Revert Schema to SQLite

```bash
cd ~/apps/darkbyte-dashboard
nano prisma/schema.prisma
```

Change line 6:
```prisma
# FROM:
provider = "postgresql"

# TO:
provider = "sqlite"
```

### 2. Regenerate Prisma Client

```bash
npx prisma generate
npm run build
pm2 restart dashboard
```

---

## ✅ Recommended Fix (Option 2: Migrate to PostgreSQL)

PostgreSQL is **required for production**. Here's how to set it up:

### Step 1: Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Create Database & User

```bash
sudo -u postgres psql

# Inside PostgreSQL prompt:
CREATE DATABASE darkbyte_dashboard;
CREATE USER darkbyte_user WITH ENCRYPTED PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE darkbyte_dashboard TO darkbyte_user;
ALTER DATABASE darkbyte_dashboard OWNER TO darkbyte_user;
\q
```

### Step 3: Update .env File

```bash
cd ~/apps/darkbyte-dashboard
nano .env
```

**Change this line:**
```env
# OLD (SQLite):
DATABASE_URL="file:./dev.db"

# NEW (PostgreSQL):
DATABASE_URL="postgresql://darkbyte_user:YourSecurePassword123!@localhost:5432/darkbyte_dashboard"
```

### Step 4: Run Migration

```bash
# Generate Prisma Client for PostgreSQL
npx prisma generate

# Create database tables
npx prisma migrate deploy

# If that fails, try:
npx prisma db push
```

### Step 5: Rebuild & Restart

```bash
npm run build
pm2 restart dashboard
```

---

## 🔄 Migrate Existing Data (Optional)

If you have important data in SQLite that you want to keep:

### Export from SQLite

```bash
sqlite3 dev.db .dump > backup.sql
```

### Manual Migration Steps

1. Create new users in the PostgreSQL database manually
2. Or use a migration tool like `pgloader`
3. Or start fresh (recommended for development)

---

## ✅ Verify Everything Works

### 1. Check Logs

```bash
pm2 logs dashboard --lines 50
```

Look for:
- ✅ "Server running on port 3000"
- ❌ Any Prisma or database connection errors

### 2. Test Login

Navigate to your dashboard and try logging in. If you see a 500 error:

```bash
# Check detailed error logs
pm2 logs dashboard --err
```

### 3. Check Database Connection

```bash
# Test PostgreSQL connection
sudo -u postgres psql -d darkbyte_dashboard -c "SELECT version();"
```

---

## 🐛 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

```bash
# Make sure .env file exists
ls -la .env

# Check if DATABASE_URL is set
grep DATABASE_URL .env
```

### Error: "Can't reach database server"

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Error: "Authentication failed"

```bash
# Reset PostgreSQL user password
sudo -u postgres psql
ALTER USER darkbyte_user WITH PASSWORD 'NewSecurePassword123!';
\q

# Update .env with new password
nano .env
```

### Error: "Database does not exist"

```bash
# Create database again
sudo -u postgres createdb darkbyte_dashboard
sudo -u postgres psql -c "ALTER DATABASE darkbyte_dashboard OWNER TO darkbyte_user;"
```

---

## 📊 Why PostgreSQL?

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Production Ready** | ❌ No | ✅ Yes |
| **Concurrent Users** | ❌ Limited | ✅ Unlimited |
| **Performance** | ⚠️ OK | ✅ Excellent |
| **Scalability** | ❌ Poor | ✅ Excellent |
| **Backups** | ⚠️ Manual | ✅ Automated |
| **Security** | ⚠️ Basic | ✅ Advanced |

---

## 🆘 Still Having Issues?

1. **Check PM2 logs:** `pm2 logs dashboard`
2. **Check if database exists:** `sudo -u postgres psql -l`
3. **Verify .env is correct:** `cat .env | grep DATABASE_URL`
4. **Test Prisma connection:** `npx prisma db pull`

---

## 📞 Need Help?

If you're still stuck, check:
- PM2 error logs: `pm2 logs dashboard --err --lines 100`
- Database status: `sudo systemctl status postgresql`
- Network connectivity: `netstat -tlnp | grep 5432`

---

**After fixing the database, your login should work perfectly!** ✅
