# 🚀 VPS Deployment Guide - DarkByte Dashboard

Complete step-by-step guide to deploy your DarkByte Dashboard on a VPS (Ubuntu 22.04 LTS recommended).

---

## 📋 Prerequisites

- **VPS Server** (Ubuntu 22.04 LTS, 2GB RAM minimum, 20GB storage)
- **Domain Name** (e.g., darkbyte.in)
- **SSH Access** to your VPS
- **GitHub Account** with repository access

---

## 🔧 Step 1: Initial Server Setup

### Connect to your VPS

```bash
ssh root@your-server-ip
```

### Update system packages

```bash
apt update && apt upgrade -y
```

### Create a new user (recommended)

```bash
adduser darkbyte
usermod -aG sudo darkbyte
su - darkbyte
```

---

## 📦 Step 2: Install Required Software

### Install Node.js 20.x (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
npm --version
```

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
pm2 --version
```

### Install Nginx (Web Server)

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Install PostgreSQL (Production Database)

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Install Git

```bash
sudo apt install -y git
git --version
```

---

## 🗄️ Step 3: Setup PostgreSQL Database

### Create database and user

```bash
sudo -u postgres psql
```

In PostgreSQL prompt:

```sql
CREATE DATABASE darkbyte_dashboard;
CREATE USER darkbyte_user WITH ENCRYPTED PASSWORD 'your-secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE darkbyte_dashboard TO darkbyte_user;
\q
```

### Test database connection

```bash
psql -h localhost -U darkbyte_user -d darkbyte_dashboard -W
# Enter password when prompted
# Type \q to exit
```

---

## 📥 Step 4: Clone Repository

### Navigate to web directory

```bash
cd /home/darkbyte
mkdir -p apps
cd apps
```

### Clone your repository

```bash
git clone https://github.com/princekop/Dashboard.git darkbyte-dashboard
cd darkbyte-dashboard
```

---

## ⚙️ Step 5: Configure Environment Variables

### Create production .env file

```bash
nano .env
```

Add the following (replace with your actual values):

```env
# Database
DATABASE_URL="postgresql://darkbyte_user:your-secure-password-here@localhost:5432/darkbyte_dashboard"

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET="your-64-character-random-hex-string-here"

# Environment
NODE_ENV="production"

# App URL
NEXT_PUBLIC_API_URL="https://darkbyte.in"

# Pterodactyl (if applicable)
PTERODACTYL_URL="https://panel.darkbyte.in"
PTERODACTYL_API_KEY="your-pterodactyl-api-key"
```

**Generate secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste as JWT_SECRET value.

### Save and exit

Press `Ctrl+X`, then `Y`, then `Enter`

### Secure the .env file

```bash
chmod 600 .env
```

---

## 📚 Step 6: Update Database Schema

### Update Prisma schema for PostgreSQL

```bash
nano prisma/schema.prisma
```

Change datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Save and exit (`Ctrl+X`, `Y`, `Enter`)

---

## 🔨 Step 7: Install Dependencies & Build

### Install npm packages

```bash
npm install
```

### Run database migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### Build the application

```bash
npm run build
```

This will take a few minutes...

---

## 🚀 Step 8: Start Application with PM2

### Start the app

```bash
pm2 start npm --name "darkbyte-dashboard" -- start
```

### Configure PM2 to start on boot

```bash
pm2 startup
# Copy and run the command it outputs
pm2 save
```

### Check application status

```bash
pm2 status
pm2 logs darkbyte-dashboard
```

The app should now be running on `http://localhost:3000`

---

## 🌐 Step 9: Configure Nginx Reverse Proxy

### Create Nginx configuration

```bash
sudo nano /etc/nginx/sites-available/darkbyte
```

Add the following configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name darkbyte.in www.darkbyte.in;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name darkbyte.in www.darkbyte.in;

    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/darkbyte.in/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/darkbyte.in/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # File upload size limit
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/darkbyte_access.log;
    error_log /var/log/nginx/darkbyte_error.log;
}
```

Save and exit.

### Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/darkbyte /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
```

### Test Nginx configuration

```bash
sudo nginx -t
```

Should output: "syntax is ok" and "test is successful"

---

## 🔒 Step 10: Setup SSL Certificate (Let's Encrypt)

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL certificate

```bash
sudo certbot --nginx -d darkbyte.in -d www.darkbyte.in
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (choose Yes)

### Test automatic renewal

```bash
sudo certbot renew --dry-run
```

### Reload Nginx

```bash
sudo systemctl reload nginx
```

---

## ✅ Step 11: Verify Deployment

### Check application is running

```bash
pm2 status
pm2 logs darkbyte-dashboard --lines 50
```

### Test website

Open your browser and visit:
- `https://darkbyte.in` - Should load your dashboard
- `https://darkbyte.in/login` - Login page
- `https://darkbyte.in/dashboard` - Dashboard (after login)

### Check SSL certificate

Visit: `https://www.ssllabs.com/ssltest/analyze.html?d=darkbyte.in`

Should get an A or A+ rating.

---

## 🛠️ Step 12: Create Admin User

### Access the server

```bash
cd /home/darkbyte/apps/darkbyte-dashboard
```

### Run admin creation script

```bash
node scripts/make-admin.js admin@darkbyte.in
```

This will make the specified user an admin.

---

## 📊 Monitoring & Maintenance

### PM2 Commands

```bash
# View all apps
pm2 list

# View logs
pm2 logs darkbyte-dashboard

# Restart app
pm2 restart darkbyte-dashboard

# Stop app
pm2 stop darkbyte-dashboard

# Monitor resources
pm2 monit
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/darkbyte_error.log

# View access logs
sudo tail -f /var/log/nginx/darkbyte_access.log
```

### Database Backup

Create a backup script:

```bash
nano ~/backup-database.sh
```

Add:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/darkbyte/backups"
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U darkbyte_user darkbyte_dashboard > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

Make it executable:

```bash
chmod +x ~/backup-database.sh
```

Add to cron for daily backups:

```bash
crontab -e
```

Add this line (runs daily at 2 AM):

```
0 2 * * * /home/darkbyte/backup-database.sh
```

---

## 🔄 Updating the Application

When you push new changes to GitHub:

```bash
cd /home/darkbyte/apps/darkbyte-dashboard

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Run any new database migrations
npx prisma migrate deploy
npx prisma generate

# Rebuild the application
npm run build

# Restart PM2
pm2 restart darkbyte-dashboard

# Clear Nginx cache if needed
sudo systemctl reload nginx
```

### Create update script

```bash
nano ~/update-dashboard.sh
```

Add:

```bash
#!/bin/bash
cd /home/darkbyte/apps/darkbyte-dashboard

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running migrations..."
npx prisma migrate deploy
npx prisma generate

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart darkbyte-dashboard

echo "✅ Update completed!"
pm2 logs darkbyte-dashboard --lines 20
```

Make executable:

```bash
chmod +x ~/update-dashboard.sh
```

Usage:

```bash
~/update-dashboard.sh
```

---

## 🔥 Firewall Configuration

### Enable UFW firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Should show:
- 22/tcp (SSH)
- 80/tcp (HTTP)
- 443/tcp (HTTPS)

---

## 🚨 Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs darkbyte-dashboard --lines 100

# Check if port 3000 is in use
sudo netstat -tulpn | grep 3000

# Kill process if needed
sudo kill -9 <PID>

# Restart
pm2 restart darkbyte-dashboard
```

### Database connection issues

```bash
# Test database connection
psql -h localhost -U darkbyte_user -d darkbyte_dashboard -W

# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Nginx errors

```bash
# Check error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### SSL certificate renewal fails

```bash
# Check Certbot status
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

### Out of memory

```bash
# Check memory usage
free -h

# Check PM2 memory usage
pm2 monit

# Restart application
pm2 restart darkbyte-dashboard
```

---

## 📈 Performance Optimization

### Enable Nginx caching

Add to Nginx config:

```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Enable gzip compression

Add to Nginx config:

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

### PM2 clustering (if you have multiple CPU cores)

```bash
pm2 delete darkbyte-dashboard
pm2 start npm --name "darkbyte-dashboard" -i max -- start
pm2 save
```

---

## 🔐 Security Best Practices

### Disable root login

```bash
sudo nano /etc/ssh/sshd_config
```

Change:
```
PermitRootLogin no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### Setup fail2ban (blocks brute force attacks)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Keep system updated

```bash
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
```

---

## 📞 Support Checklist

After deployment, verify:

- ✅ Application accessible via HTTPS
- ✅ SSL certificate valid (A+ rating)
- ✅ Database migrations completed
- ✅ Admin user created
- ✅ PM2 auto-starts on reboot
- ✅ Nginx configured and running
- ✅ Firewall enabled
- ✅ Backups configured
- ✅ Logs are accessible
- ✅ Update script created

---

## 🎯 Quick Command Reference

```bash
# Application
cd /home/darkbyte/apps/darkbyte-dashboard
pm2 restart darkbyte-dashboard
pm2 logs darkbyte-dashboard
~/update-dashboard.sh

# Database
~/backup-database.sh
psql -h localhost -U darkbyte_user -d darkbyte_dashboard -W

# Web Server
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/darkbyte_error.log

# System
free -h
df -h
top
sudo ufw status
```

---

## 🎉 Deployment Complete!

Your DarkByte Dashboard is now live at **https://darkbyte.in**

**Default Login:**
- Create your first user at: `https://darkbyte.in/login` (register)
- Make admin: `node scripts/make-admin.js your-email@example.com`

**Support:**
- 📧 Email: support@darkbyte.in
- 📱 Phone: +91 88261 28886

---

**Deployed:** $(date)

**Version:** 1.0.0

**Status:** 🟢 Production Ready
