#!/bin/bash

# Script to optimize system resources for Docker

echo "Optimizing system resources for Docker containers..."

# Increase maximum number of file descriptors
echo "fs.file-max = 100000" | sudo tee -a /etc/sysctl.conf
echo "vm.swappiness = 10" | sudo tee -a /etc/sysctl.conf

# Apply changes
sudo sysctl -p

# Optimize Docker daemon settings
sudo mkdir -p /etc/docker
echo '{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 100000,
      "Soft": 100000
    }
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}' | sudo tee /etc/docker/daemon.json

# Restart Docker to apply changes
sudo systemctl restart docker

echo "Resource optimization completed!"