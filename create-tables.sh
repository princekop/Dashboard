#!/bin/bash

# Create PostgreSQL tables from Prisma schema
# Run this after switching to PostgreSQL

echo "🗄️  Creating database tables..."

# Generate Prisma Client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push --accept-data-loss

echo "✅ Tables created successfully!"
echo "📊 Checking tables..."

# List all tables
sudo -u postgres psql -d darkbyte_dashboard -c "\dt"

echo "🚀 Rebuilding application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart dashboard

echo "✅ Done! Your database tables are ready."
