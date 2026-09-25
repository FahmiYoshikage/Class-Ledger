#!/bin/bash
# Fix permissions for Docker volumes
# Run this after pulling changes or when getting permission errors

echo "🔧 Fixing permissions for Docker volumes..."

# Create directories if they don't exist
mkdir -p server/public/reports
mkdir -p server/uploads/payment-proofs
mkdir -p server/uploads/qr-codes

# Set full read/write permissions for both host user and container user (UID 1001)
chmod -R 777 server/public/reports
chmod -R 777 server/uploads

echo "✅ Permissions fixed (777 mode - read/write for host & container)!"
echo "📁 Reports directory: $(ls -ld server/public/reports | awk '{print $1, $3, $4}')"
echo "📁 Uploads directory: $(ls -ld server/uploads | awk '{print $1, $3, $4}')"
echo ""
echo "🚀 Now restart the container:"
echo "   docker-compose restart api"
