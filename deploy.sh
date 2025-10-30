#!/bin/bash

# DarkByte Dashboard - Automated VPS Deployment Script
# Run this on your Ubuntu 22.04 LTS VPS

set -e  # Exit on any error

echo "🚀 DarkByte Dashboard - Automated Deployment"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(eval echo ~$ACTUAL_USER)

echo -e "${YELLOW}This script will install and configure:${NC}"
echo "  - Node.js 20.x"
echo "  - PostgreSQL"
echo "  - Nginx"
echo "  - PM2"
echo "  - SSL Certificate (Let's Encrypt)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Update system
echo -e "${GREEN}[1/10] Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js
echo -e "${GREEN}[2/10] Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
echo -e "${GREEN}[3/10] Installing PM2...${NC}"
npm install -g pm2

# Install Nginx
echo -e "${GREEN}[4/10] Installing Nginx...${NC}"
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# Install PostgreSQL
echo -e "${GREEN}[5/10] Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Install Git and other tools
echo -e "${GREEN}[6/10] Installing additional tools...${NC}"
apt install -y git curl wget certbot python3-certbot-nginx ufw

# Setup PostgreSQL database
echo -e "${GREEN}[7/10] Setting up PostgreSQL database...${NC}"
read -p "Enter database password for darkbyte_user: " DB_PASSWORD
sudo -u postgres psql << EOF
CREATE DATABASE darkbyte_dashboard;
CREATE USER darkbyte_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE darkbyte_dashboard TO darkbyte_user;
\q
EOF

# Configure firewall
echo -e "${GREEN}[8/10] Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

# Clone repository
echo -e "${GREEN}[9/10] Cloning repository...${NC}"
read -p "Enter GitHub username (default: princekop): " GITHUB_USER
GITHUB_USER=${GITHUB_USER:-princekop}

mkdir -p $USER_HOME/apps
cd $USER_HOME/apps

if [ -d "darkbyte-dashboard" ]; then
    echo "Directory exists, pulling latest changes..."
    cd darkbyte-dashboard
    sudo -u $ACTUAL_USER git pull origin main
else
    echo "Cloning repository..."
    sudo -u $ACTUAL_USER git clone https://github.com/$GITHUB_USER/Dashboard.git darkbyte-dashboard
    cd darkbyte-dashboard
fi

# Setup environment variables
echo -e "${GREEN}[10/10] Configuring environment...${NC}"
read -p "Enter your domain name (e.g., darkbyte.in): " DOMAIN_NAME

# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Create .env file
cat > .env << EOF
# Database
DATABASE_URL="postgresql://darkbyte_user:$DB_PASSWORD@localhost:5432/darkbyte_dashboard"

# JWT Secret
JWT_SECRET="$JWT_SECRET"

# Environment
NODE_ENV="production"

# App URL
NEXT_PUBLIC_API_URL="https://$DOMAIN_NAME"

# Pterodactyl (optional - configure later if needed)
# PTERODACTYL_URL="https://panel.$DOMAIN_NAME"
# PTERODACTYL_API_KEY=""
EOF

chown $ACTUAL_USER:$ACTUAL_USER .env
chmod 600 .env

# Update Prisma schema for PostgreSQL
echo "Updating Prisma schema..."
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# Install dependencies
echo "Installing dependencies..."
sudo -u $ACTUAL_USER npm install

# Run database migrations
echo "Running database migrations..."
sudo -u $ACTUAL_USER npx prisma migrate deploy
sudo -u $ACTUAL_USER npx prisma generate

# Build application
echo "Building application..."
sudo -u $ACTUAL_USER npm run build

# Setup PM2
echo "Setting up PM2..."
sudo -u $ACTUAL_USER pm2 start npm --name "darkbyte-dashboard" -- start
sudo -u $ACTUAL_USER pm2 save
pm2 startup systemd -u $ACTUAL_USER --hp $USER_HOME
sudo -u $ACTUAL_USER pm2 save

# Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/darkbyte << 'NGINXCONF'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    client_max_body_size 50M;
    
    access_log /var/log/nginx/darkbyte_access.log;
    error_log /var/log/nginx/darkbyte_error.log;
}
NGINXCONF

# Replace placeholder with actual domain
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN_NAME/g" /etc/nginx/sites-available/darkbyte

# Enable site
ln -sf /etc/nginx/sites-available/darkbyte /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Setup SSL
echo -e "${YELLOW}Setting up SSL certificate...${NC}"
read -p "Enter your email for Let's Encrypt: " EMAIL
certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email $EMAIL --redirect

# Create backup script
cat > $USER_HOME/backup-database.sh << 'BACKUPSCRIPT'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups"
mkdir -p $BACKUP_DIR
pg_dump -h localhost -U darkbyte_user darkbyte_dashboard > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
echo "Backup completed: backup_$DATE.sql"
BACKUPSCRIPT

chmod +x $USER_HOME/backup-database.sh
chown $ACTUAL_USER:$ACTUAL_USER $USER_HOME/backup-database.sh

# Create update script
cat > $USER_HOME/update-dashboard.sh << 'UPDATESCRIPT'
#!/bin/bash
cd $HOME/apps/darkbyte-dashboard
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
UPDATESCRIPT

chmod +x $USER_HOME/update-dashboard.sh
chown $ACTUAL_USER:$ACTUAL_USER $USER_HOME/update-dashboard.sh

# Add backup to crontab
(crontab -u $ACTUAL_USER -l 2>/dev/null; echo "0 2 * * * $USER_HOME/backup-database.sh") | crontab -u $ACTUAL_USER -

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Your DarkByte Dashboard is now live at:"
echo -e "  🌐 ${GREEN}https://$DOMAIN_NAME${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Visit ${YELLOW}https://$DOMAIN_NAME/login${NC} to register"
echo -e "  2. Make yourself admin:"
echo -e "     ${YELLOW}cd $USER_HOME/apps/darkbyte-dashboard${NC}"
echo -e "     ${YELLOW}node scripts/make-admin.js your-email@example.com${NC}"
echo ""
echo -e "Useful commands:"
echo -e "  • Update app: ${YELLOW}$USER_HOME/update-dashboard.sh${NC}"
echo -e "  • Backup DB: ${YELLOW}$USER_HOME/backup-database.sh${NC}"
echo -e "  • View logs: ${YELLOW}pm2 logs darkbyte-dashboard${NC}"
echo -e "  • Restart app: ${YELLOW}pm2 restart darkbyte-dashboard${NC}"
echo ""
echo -e "${GREEN}🎉 Happy hosting!${NC}"
