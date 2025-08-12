# syntax=docker/dockerfile:1.7-labs

# -----------------------------
# Builder: install full deps and build client+server
# -----------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install OS deps needed for builds
RUN apk add --no-cache python3 make g++

# Install dependencies (full)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build client and server to dist/
RUN npm run build

# -----------------------------
# Runtime: copy only production deps and build output
# -----------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build artifacts
COPY --from=builder /app/dist ./dist

# Ensure uploads directory exists and is writable
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Switch to non-root user
USER node

# Expose port
EXPOSE 5000

# Env
ENV NODE_ENV=production
ENV PORT=5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:5000/api/health || exit 1

# Start
CMD ["npm", "start"]