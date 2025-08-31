#!/bin/bash

# Deployment script for Traffic Optimization System

echo "Starting deployment of Traffic Optimization System..."

# Build and start containers
docker-compose -f docker-compose-optimized.yml down
docker-compose -f docker-compose-optimized.yml up -d --build

# Wait for containers to start
echo "Waiting for containers to initialize..."
sleep 15

# Initialize MongoDB replica set
echo "Initializing MongoDB replica set..."
./init-replica.sh

# Check if everything is running
echo "Deployment completed! Checking status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\nTo monitor performance, run: ./monitor-performance.sh"
echo "System should be available at: http://localhost"