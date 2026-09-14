# Optimized single-stage build for Express API (minimal memory footprint on 1GB VPS)
FROM node:20-alpine

WORKDIR /app

# 1. Install curl for healthcheck, create nodejs system user & runtime folders (Cached permanently)
RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/public/reports /app/uploads && \
    chown -R nodejs:nodejs /app

# 2. Dependency layer (Cached unless package.json or package-lock.json changes)
COPY --chown=nodejs:nodejs package*.json ./

ARG NODE_OPTIONS_BUILD="--max-old-space-size=256"
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 600000 && \
    npm ci --omit=dev --maxsockets=5 && \
    npm cache clean --force

# 3. Application source code (Changes frequently, fast atomic copy with ownership)
COPY --chown=nodejs:nodejs . .

# Expose port
EXPOSE 5000

# Run as non-root user
USER nodejs

# Runtime Node flags (dapat di-override oleh environment di docker-compose)
ENV NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=192}"

# Start application (--optimize-for-size di CLI argument)
CMD ["node", "--optimize-for-size", "server.js"]