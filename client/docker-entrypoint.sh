#!/bin/sh
# ==============================================================================
# Generate runtime env.js from Docker / .env variables
# ==============================================================================
cat <<EOF > /usr/share/nginx/html/env.js
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-/api}"
};
EOF

echo "[✓] Injected runtime environment: VITE_API_URL=${VITE_API_URL:-/api}"

exec "$@"
