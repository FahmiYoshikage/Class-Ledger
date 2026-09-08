# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with retry and increased timeout for unstable networks
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 600000 && \
    npm ci --omit=dev --maxsockets=5

# Copy source code
COPY . .

# Stage 2: Production (minimal footprint)
FROM node:20-alpine

WORKDIR /app

# Install curl for healthcheck (minimal)
RUN apk add --no-cache curl

# Copy from builder
COPY --from=builder /app .

# Create reports directory and uploads directory with proper permissions
RUN mkdir -p /app/public/reports /app/uploads && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app/public /app/uploads

# Expose port
EXPOSE 5000

# Run as non-root user
USER nodejs

# Low-memory Node.js flags for 1GB RAM VPS
# 192MB heap limit - enough for Express + Mongoose with small pool
ENV NODE_OPTIONS="--max-old-space-size=192 --optimize-for-size"

# Start application
CMD ["node", "server.js"]