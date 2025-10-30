# 🚀 DEPLOY NOW - Copy & Paste Commands

## ✅ Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip-address
```

---

## ✅ Step 2: Run Automated Deployment

### Option A: One-Line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/princekop/Dashboard/main/deploy.sh | sudo bash
```

### Option B: Manual Download & Run

```bash
# Download script
wget https://raw.githubusercontent.com/princekop/Dashboard/main/deploy.sh

# Make executable
chmod +x deploy.sh

# Run
sudo ./deploy.sh
```

---

## ✅ Step 3: Answer Prompts

The script will ask you:

1. **Database Password**: Create a secure password (save it!)
   ```
   Example: MySecure123Pass!
   ```

2. **GitHub Username**: Press Enter for default (princekop)
   ```
   Just press Enter
   ```

3. **Domain Name**: Your domain
   ```
   Example: darkbyte.in
   ```

4. **Email for SSL**: Your email
   ```
   Example: admin@darkbyte.in
   ```

---

## ✅ Step 4: Create Admin User

After deployment completes:

```bash
# Navigate to app directory
cd ~/apps/darkbyte-dashboard

# Make yourself admin (replace with your email)
node scripts/make-admin.js admin@darkbyte.in
```

---

## ✅ Step 5: Access Your Dashboard

Open browser and visit:
```
https://your-domain.com
```

### First Login
1. Click "Register" or visit `/login`
2. Create your account
3. Run the admin command above with your email
4. Refresh page - you'll see admin panel

---

## 🎯 What Gets Installed

The script automatically installs and configures:

✅ **Node.js 20.x** - JavaScript runtime  
✅ **PostgreSQL** - Production database  
✅ **Nginx** - Web server & reverse proxy  
✅ **PM2** - Process manager (keeps app running)  
✅ **SSL Certificate** - Free HTTPS from Let's Encrypt  
✅ **Firewall** - UFW with proper rules  
✅ **Auto-backup** - Daily database backups at 2 AM  

---

## 📋 Post-Deployment Checklist

- [ ] Website loads at `https://your-domain.com`
- [ ] SSL certificate shows padlock in browser
- [ ] Can register a new account
- [ ] Admin user created and working
- [ ] Can create products
- [ ] Can place orders
- [ ] Invoice generation works
- [ ] Server creation works (if Pterodactyl configured)

---

## 🛠️ Useful Commands

### Application Management

```bash
# View logs
pm2 logs darkbyte-dashboard

# Restart application
pm2 restart darkbyte-dashboard

# Check status
pm2 status

# Monitor resources
pm2 monit
```

### Update Application

```bash
# When you push changes to GitHub
~/update-dashboard.sh
```

### Database Backup

```bash
# Manual backup
~/backup-database.sh

# View backups
ls -lh ~/backups/
```

### Nginx Commands

```bash
# Check configuration
sudo nginx -t

# Reload (after config changes)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/darkbyte_error.log
```

---

## 🔧 Configuration Files

### Environment Variables

Located at: `~/apps/darkbyte-dashboard/.env`

```bash
# Edit environment
nano ~/apps/darkbyte-dashboard/.env

# After editing, restart app
pm2 restart darkbyte-dashboard
```

### Nginx Configuration

Located at: `/etc/nginx/sites-available/darkbyte`

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/darkbyte

# Test configuration
sudo nginx -t

# Apply changes
sudo systemctl reload nginx
```

---

## 🐛 Troubleshooting

### Can't access website

```bash
# Check Nginx status
sudo systemctl status nginx

# Check firewall
sudo ufw status

# Check DNS (your domain should point to VPS IP)
dig your-domain.com
```

### Application crashes

```bash
# View error logs
pm2 logs darkbyte-dashboard --err --lines 100

# Restart application
pm2 restart darkbyte-dashboard

# Check if running
pm2 status
```

### Database connection fails

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U darkbyte_user -d darkbyte_dashboard -W

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📊 Server Requirements

### Minimum (For Testing)
- 1GB RAM
- 1 CPU Core
- 10GB Storage
- Ubuntu 22.04 LTS

### Recommended (For Production)
- **2GB RAM** ✅
- **2 CPU Cores** ✅
- **20GB Storage** ✅
- Ubuntu 22.04 LTS

### For Heavy Traffic
- 4GB RAM
- 4 CPU Cores
- 50GB Storage
- Ubuntu 22.04 LTS

---

## 🔒 Security Features

✅ **Firewall (UFW)** - Only ports 22, 80, 443 open  
✅ **SSL/HTTPS** - Automatic certificate from Let's Encrypt  
✅ **Security Headers** - XSS, CSRF, clickjacking protection  
✅ **Rate Limiting** - API abuse prevention  
✅ **Input Validation** - All inputs sanitized  
✅ **Secure Cookies** - HTTPOnly, Secure flags  

---

## 📞 Support

### Documentation
- **QUICK_START.md** - This guide
- **VPS_DEPLOYMENT.md** - Detailed manual deployment
- **PRODUCTION_DEPLOYMENT.md** - Security & optimization
- **INVOICE_SYSTEM.md** - Invoice features

### Common Issues

**Issue:** Port 3000 already in use  
**Solution:** 
```bash
sudo netstat -tulpn | grep 3000
sudo kill -9 <PID>
pm2 restart darkbyte-dashboard
```

**Issue:** npm install fails  
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Issue:** Database migration fails  
**Solution:**
```bash
npx prisma migrate reset
npx prisma migrate deploy
```

---

## 🎯 Next Steps

After successful deployment:

1. **Configure Pterodactyl** (if using)
   - Add Pterodactyl URL and API key to `.env`
   - Restart application

2. **Add Products**
   - Login as admin
   - Go to Admin → Products
   - Create your hosting plans

3. **Test Full Flow**
   - Place a test order
   - Upload payment proof
   - Verify as admin
   - Check server creation
   - Verify invoice generation

4. **Customize Branding**
   - Update company details in invoices
   - Customize colors in `globals.css`
   - Add your logo

5. **Setup Monitoring**
   - Configure error tracking (Sentry)
   - Setup uptime monitoring (UptimeRobot)
   - Enable analytics (Google Analytics)

---

## ✨ Features Ready to Use

After deployment, you have:

✅ **User Authentication** - Register, login, JWT tokens  
✅ **Product Management** - Create/edit/delete hosting plans  
✅ **Shopping Cart** - Add to cart, checkout flow  
✅ **Order System** - Complete order management  
✅ **Payment Proof** - Upload and verify payments  
✅ **Server Provisioning** - Auto-create Pterodactyl servers  
✅ **Invoice System** - Beautiful automated invoices  
✅ **Admin Dashboard** - Complete admin panel  
✅ **User Dashboard** - Customer portal  
✅ **Live Chat** - Order-based messaging  

---

## 🚀 You're Ready to Launch!

Your DarkByte Dashboard is now:
- ✅ Live at your domain
- ✅ Secured with HTTPS
- ✅ Auto-starting on reboot
- ✅ Backing up daily
- ✅ Ready for customers

**Time to go live!** 🎉

---

## 📈 Scaling Tips

When you grow:

1. **Upgrade VPS** - More RAM, CPU, storage
2. **Add CDN** - Cloudflare for faster assets
3. **Setup Redis** - For rate limiting and caching
4. **Load Balancer** - For multiple instances
5. **Database Replication** - For high availability

---

**Deployment Time:** ~10-15 minutes  
**Difficulty:** Easy (automated)  
**Support:** Available in documentation

**🎉 Happy Hosting with DarkByte!**
