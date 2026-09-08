# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with retry and increased timeout for unstable networks
# Build-time memory control via ARG NODE_OPTIONS_BUILD (passed from docker-compose)
ARG NODE_OPTIONS_BUILD="--max-old-space-size=256"
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

# Install curl for healthcheck
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

# Runtime Node flags (dari env di docker-compose, tetap berlaku di runtime)
ENV NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=192}"

# Start application (--optimize-for-size harus di CLI argument, dilarang di NODE_OPTIONS)
CMD ["node", "--optimize-for-size", "server.js"]