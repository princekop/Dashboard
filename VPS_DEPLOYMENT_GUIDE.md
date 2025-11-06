# 🚀 VPS Deployment Guide - Production Update

## Quick Update Commands

### Method 1: One-Line Update (Recommended)
```bash
cd ~/dashboard && git pull origin main && npm install && npx prisma generate && npm run build && pm2 restart dashboard
```

### Method 2: Using Deployment Script
```bash
cd ~/dashboard
chmod +x deploy-vps.sh
./deploy-vps.sh
```

---

## 📋 Step-by-Step Manual Deployment

### 1. Connect to Your VPS
```bash
ssh root@your-vps-ip
# OR
ssh your-username@your-vps-ip
```

### 2. Navigate to Project Directory
```bash
cd ~/dashboard
# or wherever your project is located
# If you don't know: find ~ -name "dashboard" -type d
```

### 3. Check Current Status
```bash
git status
pm2 status
```

### 4. Backup Current Environment
```bash
cp .env .env.backup.$(date +%Y%m%d)
```

### 5. Pull Latest Changes
```bash
git pull origin main
```

### 6. Update DATABASE_URL (IMPORTANT!)

Your app now uses PostgreSQL instead of SQLite. Update your `.env`:

```bash
nano .env
```

Change this line:
```env
# OLD (SQLite):
DATABASE_URL="file:./dev.db"

# NEW (PostgreSQL):
DATABASE_URL="postgresql://username:password@localhost:5432/darkbyte_db"
```

### 7. Install Dependencies
```bash
npm install
```

### 8. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate deploy
```

**⚠️ Important:** If you haven't set up PostgreSQL yet, see "PostgreSQL Setup" section below.

### 9. Build Application
```bash
npm run build
```

### 10. Restart Application
```bash
pm2 restart dashboard
pm2 save
```

### 11. Verify Deployment
```bash
pm2 logs dashboard --lines 50
pm2 status
curl http://localhost:3000/api/health
```

---

## 🗄️ PostgreSQL Setup (First Time)

If you haven't migrated to PostgreSQL yet:

### Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database and User
```bash
sudo -u postgres psql

-- Inside PostgreSQL prompt:
CREATE DATABASE darkbyte_db;
CREATE USER darkbyte_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE darkbyte_db TO darkbyte_user;
\q
```

### Update .env File
```env
DATABASE_URL="postgresql://darkbyte_user:your_secure_password@localhost:5432/darkbyte_db"
```

### Migrate Data from SQLite (Optional)
```bash
# Export from SQLite
sqlite3 dev.db .dump > backup.sql

# Import to PostgreSQL (manual process)
# You'll need to convert SQLite syntax to PostgreSQL
# Or start fresh with: npx prisma migrate deploy
```

---

## 🔒 Environment Variables Checklist

Make sure your `.env` has these variables:

```env
# Database (REQUIRED - Now PostgreSQL!)
DATABASE_URL="postgresql://user:password@localhost:5432/darkbyte_db"

# JWT (REQUIRED)
JWT_SECRET="your-super-secure-64-character-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# URLs (REQUIRED)
NEXTAUTH_URL="https://yourdomain.com"

# Pterodactyl (REQUIRED)
PTERODACTYL_CLIENT_KEY="your-pterodactyl-api-key"

# AI Features (OPTIONAL)
GEMINI_API_KEY="your-gemini-api-key"

# Node Environment
NODE_ENV="production"
```

---

## 🔧 Troubleshooting

### Issue: Git Pull Conflicts
```bash
# Save your changes
git stash

# Pull latest
git pull origin main

# Reapply your changes
git stash pop
```

### Issue: Build Errors
```bash
# Clean install
rm -rf node_modules .next package-lock.json
npm install
npm run build
```

### Issue: Database Connection Errors
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l

# Test connection
sudo -u postgres psql -d darkbyte_db -c "SELECT version();"
```

### Issue: PM2 Not Restarting
```bash
# Stop and delete process
pm2 delete dashboard

# Start fresh
pm2 start npm --name "dashboard" -- start
pm2 save
```

### Issue: Port 3000 Already in Use
```bash
# Find process using port
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in package.json:
# "start": "next start -p 3001"
```

### Issue: High Memory Usage
```bash
# Restart with max memory
pm2 restart dashboard --max-memory-restart 1G

# Or configure in ecosystem.config.js
pm2 restart dashboard --update-env
```

---

## 📊 Monitoring

### View Real-Time Logs
```bash
pm2 logs dashboard
```

### Check Application Status
```bash
pm2 status
pm2 monit  # Real-time monitoring
```

### Check Resource Usage
```bash
htop  # or top
df -h  # Disk usage
free -h  # Memory usage
```

---

## 🔄 Rollback (If Something Goes Wrong)

### Quick Rollback
```bash
cd ~/dashboard
git log --oneline -5  # Find previous commit
git reset --hard <commit-hash>
npm install
npm run build
pm2 restart dashboard
```

### Restore Backup .env
```bash
cp .env.backup.20251106 .env
pm2 restart dashboard
```

---

## 🎯 Performance Optimization

### Enable PM2 Cluster Mode
```bash
pm2 delete dashboard
pm2 start npm --name "dashboard" -i max -- start
pm2 save
```

### Enable Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Set up Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ✅ Post-Deployment Checklist

- [ ] Application starts without errors
- [ ] Can log in to dashboard
- [ ] All pages load correctly
- [ ] Database queries work
- [ ] File uploads work
- [ ] AI features work (if enabled)
- [ ] Server management works
- [ ] Backups are running
- [ ] SSL certificate is valid
- [ ] Monitoring is active

---

## 📞 Support

- **GitHub Issues:** https://github.com/princekop/Dashboard/issues
- **Documentation:** Check `PRODUCTION_READY.md`
- **Emergency:** Check logs first with `pm2 logs dashboard`

---

## 🎉 Success!

If everything is working:
- ✅ Your dashboard is updated with latest features
- ✅ All security improvements are active
- ✅ SEO is optimized for Indian hosting keywords
- ✅ PostgreSQL is production-ready
- ✅ Errors are handled gracefully
- ✅ Users won't see internal error details

**Your DarkByte Premium dashboard is now production-ready!** 🚀
