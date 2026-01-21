#!/bin/bash

# Deploy script for development Docker environment
# Builds the images and starts the containers for both frontend and backend
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "Building development Docker images..."
docker compose -f docker-compose.yml build

echo "Starting development containers..."
docker compose -f docker-compose.yml up -d

echo "Development environment deployed successfully!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000"
