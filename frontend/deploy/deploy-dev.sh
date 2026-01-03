#!/bin/bash

# Deploy script for development Docker environment
# Builds the image and starts the container
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "Building development Docker image..."
docker compose -f docker-compose.yml build

echo "Starting development container..."
docker compose -f docker-compose.yml up -d

echo "Development environment deployed successfully!"
echo "Access at: http://localhost:5173"

