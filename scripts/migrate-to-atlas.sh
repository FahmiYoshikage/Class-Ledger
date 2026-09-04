#!/bin/bash

# Script to migrate MongoDB from local to Atlas
# Usage: ./migrate-to-atlas.sh

echo "🚀 MongoDB Migration Script - Local to Atlas"
echo "=============================================="
echo ""

# Step 1: Export local database
echo "📦 Step 1: Exporting local database..."
BACKUP_DIR=~/mongodb-backup-$(date +%Y%m%d-%H%M%S)
mongodump --db kas-kelas --out "$BACKUP_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Export successful! Backup saved to: $BACKUP_DIR"
else
    echo "❌ Export failed!"
    exit 1
fi

echo ""
echo "📊 Backup Summary:"
ls -lh "$BACKUP_DIR/kas-kelas/" | tail -n +2 | awk '{print "   ", $9, "-", $5}'
echo ""

# Step 2: Get Atlas connection string
echo "🔗 Step 2: MongoDB Atlas Connection"
echo "Please enter your MongoDB Atlas connection string:"
echo "Format: mongodb+srv://username:password@cluster.mongodb.net/kas-kelas"
read -p "Connection String: " ATLAS_URI

if [ -z "$ATLAS_URI" ]; then
    echo "❌ Connection string cannot be empty!"
    exit 1
fi

# Step 3: Import to Atlas
echo ""
echo "📤 Step 3: Importing to MongoDB Atlas..."
echo "This may take a few moments..."
echo ""

mongorestore --uri="$ATLAS_URI" "$BACKUP_DIR/kas-kelas/"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Update server/.env file with your Atlas connection string"
    echo "   2. Restart your server: pm2 restart api-server"
    echo "   3. Test your application"
    echo ""
    echo "💾 Backup location: $BACKUP_DIR"
else
    echo ""
    echo "❌ Migration failed!"
    echo "💾 Your local backup is safe at: $BACKUP_DIR"
    exit 1
fi
