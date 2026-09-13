# Production image: Nginx serving pre-built static bundle
# Pre-built di local / dev machine (~2.4MB) sehingga VPS 1GB RAM tidak perlu
# menjalankan Node.js & Vite build yang memakan 500MB+ RAM dan membekukan VPS.
FROM nginx:alpine

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Copy pre-built production files
COPY dist /usr/share/nginx/html

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx foreground
CMD ["nginx", "-g", "daemon off;"]
