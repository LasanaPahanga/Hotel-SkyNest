# Multi-stage Dockerfile for SkyNest Hotels

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies including dev dependencies needed for build
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# ============================================
# Stage 2: Setup Backend
# ============================================
FROM node:18-alpine AS backend-build

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# ============================================
# Stage 3: Final Production Image
# ============================================
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy backend from build stage
COPY --from=backend-build /app/backend ./backend

# Copy frontend build from build stage
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start node server
CMD ["node", "backend/server.js"]
