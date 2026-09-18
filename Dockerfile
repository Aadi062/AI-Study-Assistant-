# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
# Copy workspace definitions and lockfile
COPY package.json package-lock.json ./
# Copy workspace package.jsons
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci
# Copy source files
COPY frontend ./frontend
COPY backend ./backend
# Build frontend
RUN npm run build --workspace=frontend

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app

# Copy root workspace and backend package.json
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm ci --omit=dev

# Copy backend files
COPY backend ./backend

# Copy built frontend from builder stage
COPY --from=builder /app/frontend/dist ./frontend/dist

# Expose the port Render will use
EXPOSE 5000

# Start the Express server inside the backend workspace
CMD ["npm", "run", "start", "--workspace=backend"]
