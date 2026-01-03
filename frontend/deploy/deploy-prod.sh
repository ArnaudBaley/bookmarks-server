#!/bin/bash

# Deploy script for production Docker environment
# Builds the image and starts the container
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "Building production Docker image..."
docker compose -f docker-compose.prod.yml build

echo "Starting production container..."
docker compose -f docker-compose.prod.yml up -d

echo "Production environment deployed successfully!"
echo "Access at: http://localhost:8080"

