# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time memory control (hindari freeze / OOM di VPS 1GB)
ARG NODE_OPTIONS_BUILD="--max-old-space-size=512"
ENV NODE_OPTIONS="${NODE_OPTIONS_BUILD}"

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
