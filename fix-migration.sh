#!/bin/bash
# Fix migration provider mismatch from SQLite to PostgreSQL

echo "🔧 Fixing migration provider mismatch..."

# Backup old migrations
if [ -d "prisma/migrations" ]; then
    echo "Backing up old migrations..."
    mv prisma/migrations prisma/migrations_backup_$(date +%Y%m%d_%H%M%S)
fi

# Remove migration lock file
rm -f prisma/migrations/migration_lock.toml

# Create new migrations for PostgreSQL
echo "Creating new PostgreSQL migrations..."
npx prisma migrate deploy

echo "✅ Migration fix complete!"
