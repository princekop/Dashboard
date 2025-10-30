#!/bin/bash
# Fix PostgreSQL database permissions for darkbyte_user

echo "🔧 Fixing PostgreSQL permissions..."

# Run as postgres user to grant permissions
sudo -u postgres psql << EOF
-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE darkbyte_dashboard TO darkbyte_user;

-- Connect to the database
\c darkbyte_dashboard

-- Grant usage on schema
GRANT ALL ON SCHEMA public TO darkbyte_user;

-- Grant permissions on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO darkbyte_user;

-- Grant permissions on all sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO darkbyte_user;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO darkbyte_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO darkbyte_user;

-- Make darkbyte_user owner of the database
ALTER DATABASE darkbyte_dashboard OWNER TO darkbyte_user;

\q
EOF

echo "✅ Permissions fixed!"
echo ""
echo "Now you can run:"
echo "  npx prisma db push"
