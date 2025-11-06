#!/bin/bash

# DarkByte Premium - VPS Deployment Script
# This script updates your production deployment with the latest changes

set -e  # Exit on any error

echo "🚀 DarkByte Premium - Production Deployment"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to project directory
echo -e "${YELLOW}📂 Navigating to project directory...${NC}"
cd ~/dashboard || { echo -e "${RED}❌ Project directory not found!${NC}"; exit 1; }

# Backup current .env file
echo -e "${YELLOW}💾 Backing up environment variables...${NC}"
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Pull latest changes
echo -e "${YELLOW}⬇️  Pulling latest changes from GitHub...${NC}"
git pull origin main || { echo -e "${RED}❌ Git pull failed!${NC}"; exit 1; }

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install || { echo -e "${RED}❌ npm install failed!${NC}"; exit 1; }

# Run Prisma migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npx prisma generate
npx prisma migrate deploy || { echo -e "${YELLOW}⚠️  Migration warning - check if database is PostgreSQL${NC}"; }

# Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build || { echo -e "${RED}❌ Build failed!${NC}"; exit 1; }

# Restart PM2 process
echo -e "${YELLOW}🔄 Restarting application...${NC}"
pm2 restart dashboard || { echo -e "${YELLOW}⚠️  PM2 restart failed, trying to start...${NC}"; pm2 start npm --name "dashboard" -- start; }

# Save PM2 configuration
echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
pm2 save

# Show status
echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📊 Application Status:${NC}"
pm2 status

echo ""
echo -e "${YELLOW}📋 Recent Logs:${NC}"
pm2 logs dashboard --lines 20 --nostream

echo ""
echo -e "${GREEN}🎉 Your DarkByte Premium dashboard is now updated!${NC}"
echo -e "${YELLOW}🔗 Access your dashboard at: https://yourdomain.com${NC}"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo "   View logs: pm2 logs dashboard"
echo "   Check status: pm2 status"
echo "   Restart: pm2 restart dashboard"
echo "   Stop: pm2 stop dashboard"
echo ""
