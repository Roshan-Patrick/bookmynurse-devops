#!/bin/bash

# =============================================================================
# Production Server Status Check Script
# Gathers information needed for safe deployment
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_IP="103.91.186.102"
SSH_PORT="2244"
SSH_USER="root"

echo -e "${BLUE}🔍 Production Server Status Check${NC}"
echo -e "${YELLOW}Target Server: ${PRODUCTION_IP}:${SSH_PORT}${NC}"

# Function to execute remote command
remote_exec() {
    ssh -o StrictHostKeyChecking=no -p ${SSH_PORT} ${SSH_USER}@${PRODUCTION_IP} "$1"
}

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "${BLUE}=== System Information ===${NC}"
remote_exec "cat /etc/os-release | grep PRETTY_NAME"
remote_exec "uname -a"

echo -e "${BLUE}=== Disk Space ===${NC}"
remote_exec "df -h"

echo -e "${BLUE}=== Memory Usage ===${NC}"
remote_exec "free -h"

echo -e "${BLUE}=== CPU Information ===${NC}"
remote_exec "nproc"
remote_exec "lscpu | grep 'Model name'"

echo -e "${BLUE}=== Network Interfaces ===${NC}"
remote_exec "ip addr show"

echo -e "${BLUE}=== Current Port Usage ===${NC}"
remote_exec "netstat -tlnp | grep -E ':(80|443|8080|8443|22|2244)' || echo 'No services on target ports'"

echo -e "${BLUE}=== Running Services ===${NC}"
remote_exec "systemctl list-units --type=service --state=running | head -20"

echo -e "${BLUE}=== Apache Status ===${NC}"
if remote_exec "systemctl is-active apache2" &> /dev/null; then
    print_status "Apache is running"
    remote_exec "systemctl status apache2 --no-pager -l"
else
    print_warning "Apache is not running"
fi

echo -e "${BLUE}=== Docker Status ===${NC}"
if remote_exec "which docker" &> /dev/null; then
    print_status "Docker is installed"
    remote_exec "docker --version"
    remote_exec "systemctl status docker --no-pager -l"
else
    print_warning "Docker is not installed"
fi

echo -e "${BLUE}=== Kubernetes Status ===${NC}"
if remote_exec "which kubectl" &> /dev/null; then
    print_status "Kubernetes is installed"
    remote_exec "kubectl version --client"
    remote_exec "kubectl get nodes 2>/dev/null || echo 'No cluster found'"
else
    print_warning "Kubernetes is not installed"
fi

echo -e "${BLUE}=== Firewall Status ===${NC}"
remote_exec "ufw status verbose"

echo -e "${BLUE}=== Current Directory Structure ===${NC}"
remote_exec "ls -la /var/www/ 2>/dev/null || echo 'No /var/www directory'"
remote_exec "ls -la /etc/apache2/sites-available/ 2>/dev/null || echo 'No Apache sites'"

echo -e "${BLUE}=== Available Space for Installation ===${NC}"
remote_exec "df -h /"

echo -e "${BLUE}=== System Load ===${NC}"
remote_exec "uptime"

echo -e "${GREEN}🎯 Server check completed!${NC}"
echo -e "${BLUE}This information will help ensure safe deployment.${NC}" 