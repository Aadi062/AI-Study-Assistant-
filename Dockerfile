# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app

# Copy only what's needed for production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy backend files
COPY server.js ./
COPY workspace_db.js ./

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port Render will use
EXPOSE 5000

# Start the Express server
CMD ["node", "server.js"]
