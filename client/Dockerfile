# Production image: Nginx serving pre-built static files
# Frontend di-build SEBELUM docker compose build (via deploy.sh)
# Ini menghindari kebutuhan 512MB heap Node.js saat build di VPS 1GB
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy pre-built files (harus sudah ada dari deploy.sh)
COPY dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
