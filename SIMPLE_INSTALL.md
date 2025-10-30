# 🚀 Simple Manual Installation - Copy & Paste

Follow these commands one by one on your VPS.

---

## Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 2: Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
node --version
```

---

## Step 3: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

---

## Step 4: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Step 5: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check it's running
sudo systemctl status postgresql
```

---

## Step 6: Create Database

```bash
# Switch to postgres user
sudo -u postgres psql
```

Now in PostgreSQL prompt, run these commands:

```sql
CREATE DATABASE darkbyte_dashboard;
CREATE USER darkbyte_user WITH ENCRYPTED PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE darkbyte_dashboard TO darkbyte_user;
\q
```

**Remember your password!** You'll need it later.

### Test Database Connection

```bash
psql -h localhost -U darkbyte_user -d darkbyte_dashboard -W
```

Enter your password when prompted. Type `\q` to exit.

---

## Step 7: Install Git

```bash
sudo apt install -y git
```

---

## Step 8: Clone Repository

```bash
cd ~
mkdir -p apps
cd apps
git clone https://github.com/princekop/Dashboard.git darkbyte-dashboard
cd darkbyte-dashboard
```

---

## Step 9: Create .env File

```bash
nano .env
```

Copy and paste this (replace YOUR_PASSWORD with your database password):

```env
DATABASE_URL="postgresql://darkbyte_user:YOUR_PASSWORD@localhost:5432/darkbyte_dashboard"
JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

**Important:** Replace:
- `YOUR_PASSWORD` with the database password you created
- `your-domain.com` with your actual domain

### Generate JWT Secret Separately

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and replace the JWT_SECRET value in .env.

Save: Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 10: Update Prisma for PostgreSQL

```bash
nano prisma/schema.prisma
```

Find this line:
```prisma
provider = "sqlite"
```

Change it to:
```prisma
provider = "postgresql"
```

Save: `Ctrl+X`, `Y`, `Enter`

---

## Step 11: Install Dependencies

```bash
npm install
```

This will take a few minutes...

---

## Step 12: Setup Database

```bash
npx prisma migrate deploy
npx prisma generate
```

---

## Step 13: Build Application

```bash
npm run build
```

This will take 2-5 minutes...

---

## Step 14: Start with PM2

```bash
pm2 start npm --name "darkbyte-dashboard" -- start
pm2 save
pm2 startup
```

Copy and run the command PM2 outputs.

---

## Step 15: Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Type `y` when asked.

---

## Step 16: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/darkbyte
```

Paste this configuration (replace `your-domain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
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
    }
    
    client_max_body_size 50M;
}
```

Save: `Ctrl+X`, `Y`, `Enter`

### Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/darkbyte /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 17: Install SSL Certificate

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts:
- Enter your email
- Agree to terms (Y)
- Share email (N or Y)
- Redirect HTTP to HTTPS (2)

---

## Step 18: Create Admin User

```bash
cd ~/apps/darkbyte-dashboard
node scripts/make-admin.js your-email@example.com
```

Replace with your actual email.

---

## ✅ Done! Test Your Site

Visit: `https://your-domain.com`

---

## 🛠️ Useful Commands

### Check Application

```bash
pm2 status
pm2 logs darkbyte-dashboard
pm2 restart darkbyte-dashboard
```

### Check Nginx

```bash
sudo nginx -t
sudo systemctl status nginx
sudo systemctl reload nginx
```

### Check Database

```bash
psql -h localhost -U darkbyte_user -d darkbyte_dashboard -W
```

### View Logs

```bash
# Application logs
pm2 logs darkbyte-dashboard

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Update Your App Later

```bash
cd ~/apps/darkbyte-dashboard
git pull origin main
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart darkbyte-dashboard
```

---

## 🐛 Troubleshooting

### App won't start

```bash
pm2 logs darkbyte-dashboard --lines 50
```

### Can't connect to database

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart it
sudo systemctl restart postgresql

# Test connection
psql -h localhost -U darkbyte_user -d darkbyte_dashboard -W
```

### Nginx errors

```bash
sudo tail -f /var/log/nginx/error.log
sudo nginx -t
```

### Port 3000 already in use

```bash
sudo netstat -tulpn | grep 3000
sudo kill -9 <PID>
pm2 restart darkbyte-dashboard
```

---

## 📝 Quick Reference

**App Directory:** `~/apps/darkbyte-dashboard`

**PM2 Commands:**
- `pm2 list` - View all apps
- `pm2 logs darkbyte-dashboard` - View logs
- `pm2 restart darkbyte-dashboard` - Restart
- `pm2 stop darkbyte-dashboard` - Stop
- `pm2 start darkbyte-dashboard` - Start

**Database:**
- User: `darkbyte_user`
- Database: `darkbyte_dashboard`
- Connect: `psql -h localhost -U darkbyte_user -d darkbyte_dashboard -W`

---

**That's it! Your dashboard is now live! 🎉**
