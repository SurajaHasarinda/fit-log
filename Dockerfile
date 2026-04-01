# Multi-stage build for single container deployment
# Reference: kube-copilot/Dockerfile

# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files first for better caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the frontend source code
COPY frontend ./

# Build the frontend - output to dist
RUN npm run build

# Stage 2: Backend with built frontend
FROM python:3.11-slim

WORKDIR /app

# Install curl (useful for healthchecks)
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./

# Copy built frontend from previous stage
# We'll put it in ./static to serve from there
COPY --from=frontend-builder /app/dist ./static

# Expose port (using unique port 9281 to avoid conflicts)
EXPOSE 9281

# Run application
# We use main:app and port 9281
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9281"]
