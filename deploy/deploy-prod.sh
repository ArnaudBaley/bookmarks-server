#!/bin/bash

# Deploy script for production Docker environment
# Builds the images and starts the containers for both frontend and backend
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "Building production Docker images..."
docker compose -f docker-compose.prod.yml build

echo "Starting production containers..."
docker compose -f docker-compose.prod.yml up -d

echo "Production environment deployed successfully!"
echo "Frontend: http://localhost:${FRONTEND_PORT:-8080}"
echo "Backend: http://localhost:${BACKEND_PORT:-3001}"
