#!/bin/bash
# init-replica.sh
sleep 10
docker exec traffic-mongo-primary mongosh --eval "$(cat mongo/init-replica.js)"