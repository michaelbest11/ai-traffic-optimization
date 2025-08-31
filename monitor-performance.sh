#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Traffic Optimization System Performance Monitor ===${NC}"

while true; do
    clear
    
    # Get container stats
    echo -e "${GREEN}Container CPU/Memory Usage:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.PIDs}}"
    
    echo -e "\n${GREEN}Backend Health Check:${NC}"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "Backend API: ${GREEN}HEALTHY${NC} (Status: $HTTP_STATUS)"
    else
        echo -e "Backend API: ${RED}UNHEALTHY${NC} (Status: $HTTP_STATUS)"
    fi
    
    # Check MongoDB connections
    echo -e "\n${GREEN}MongoDB Connections:${NC}"
    docker exec traffic-mongo-primary mongosh --eval "db.serverStatus().connections" --quiet
    
    # Check request rates if you have metrics endpoint
    echo -e "\n${GREEN}Current Time:${NC} $(date)"
    echo -e "${GREEN}Monitoring interval:${NC} 10 seconds (Press Ctrl+C to stop)"
    
    sleep 10
done