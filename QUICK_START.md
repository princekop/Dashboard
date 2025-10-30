# 🚀 Quick Start - Deploy in 5 Minutes

## One-Command Deployment

SSH into your Ubuntu VPS and run:

```bash
curl -fsSL https://raw.githubusercontent.com/princekop/Dashboard/main/deploy.sh | sudo bash
```

**That's it!** The script will automatically:
- Install all dependencies
- Setup database
- Configure Nginx
- Setup SSL certificate
- Start the application

---

## Manual Deployment (Step by Step)

### 1. SSH into your VPS

```bash
ssh root@your-server-ip
```

### 2. Download the deployment script

```bash
wget https://raw.githubusercontent.com/princekop/Dashboard/main/deploy.sh
chmod +x deploy.sh
```

### 3. Run the script

```bash
sudo ./deploy.sh
```

### 4. Follow the prompts

You'll be asked for:
- Database password
- Domain name
- Email for SSL certificate

### 5. Create admin user

```bash
cd ~/apps/darkbyte-dashboard
node scripts/make-admin.js admin@darkbyte.in
```

### 6. Done! 🎉

Visit: `https://your-domain.com`

---

## Update Your Application

When you push changes to GitHub:

```bash
~/update-dashboard.sh
```

---

## Important Files

- `VPS_DEPLOYMENT.md` - Detailed deployment guide
- `deploy.sh` - Automated deployment script
- `PRODUCTION_DEPLOYMENT.md` - Production best practices

---

## Support

Need help? Read the detailed guides:

1. **VPS_DEPLOYMENT.md** - Complete step-by-step deployment
2. **PRODUCTION_DEPLOYMENT.md** - Security and optimization
3. **INVOICE_SYSTEM.md** - Invoice features documentation

---

## Requirements

- Ubuntu 22.04 LTS VPS
- 2GB RAM minimum
- Domain name pointed to your VPS IP
- SSH access

---

## Common Commands

```bash
# View application logs
pm2 logs darkbyte-dashboard

# Restart application
pm2 restart darkbyte-dashboard

# Check application status
pm2 status

# Update application
~/update-dashboard.sh

# Backup database
~/backup-database.sh

# View Nginx logs
sudo tail -f /var/log/nginx/darkbyte_error.log
```

---

## Troubleshooting

**Application won't start:**
```bash
pm2 logs darkbyte-dashboard
```

**Can't access website:**
```bash
sudo systemctl status nginx
sudo nginx -t
```

**Database issues:**
```bash
sudo systemctl status postgresql
```

For detailed troubleshooting, see `VPS_DEPLOYMENT.md`

---

**🎉 Your DarkByte Dashboard is ready for production!**
