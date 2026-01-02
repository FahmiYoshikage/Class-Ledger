#!/bin/bash
# Fix permissions for Docker volumes
# Run this after pulling changes or when getting permission errors

echo "🔧 Fixing permissions for Docker volumes..."

# Create directories if they don't exist
mkdir -p server/public/reports
mkdir -p server/uploads

# Set ownership to UID 1001 (nodejs user in container)
sudo chown -R 1001:1001 server/public/reports
sudo chown -R 1001:1001 server/uploads

# Set proper permissions
chmod -R 755 server/public
chmod -R 755 server/uploads

echo "✅ Permissions fixed!"
echo "📁 Reports directory: $(ls -ld server/public/reports | awk '{print $1, $3, $4}')"
echo "📁 Uploads directory: $(ls -ld server/uploads | awk '{print $1, $3, $4}')"
echo ""
echo "🚀 Now restart the container:"
echo "   docker-compose restart api"
