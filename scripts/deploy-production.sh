#!/bin/bash

# =============================================================================
# Production Deployment Script for BookMyNurse
# Deploys containerized application alongside existing Apache setup
# =============================================================================

set -e  # Exit on any error

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
NAMESPACE="bookmynurse"
K8S_DIR="/root/bookmynurse-devops/k8s"

echo -e "${BLUE}🚀 Starting BookMyNurse Production Deployment${NC}"
echo -e "${YELLOW}Target Server: ${PRODUCTION_IP}:${SSH_PORT}${NC}"
echo -e "${YELLOW}Namespace: ${NAMESPACE}${NC}"

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

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"
check_command "ssh"
check_command "kubectl"
print_status "Prerequisites check passed"

# Function to execute remote command
remote_exec() {
    ssh -o StrictHostKeyChecking=no -p ${SSH_PORT} ${SSH_USER}@${PRODUCTION_IP} "$1"
}

# Function to check if Kubernetes is running
check_k8s() {
    echo -e "${BLUE}Checking Kubernetes cluster status...${NC}"
    if remote_exec "kubectl get nodes" &> /dev/null; then
        print_status "Kubernetes cluster is running"
        remote_exec "kubectl get nodes"
    else
        print_error "Kubernetes cluster is not accessible"
        exit 1
    fi
}

# Function to backup existing setup
backup_existing() {
    echo -e "${BLUE}Creating backup of existing setup...${NC}"
    remote_exec "mkdir -p /backup/$(date +%Y%m%d_%H%M%S)"
    remote_exec "cp -r /etc/apache2 /backup/$(date +%Y%m%d_%H%M%S)/apache2_backup/ 2>/dev/null || true"
    remote_exec "cp -r /var/www/bnm /backup/$(date +%Y%m%d_%H%M%S)/website_backup/ 2>/dev/null || true"
    print_status "Backup created"
}

# Function to deploy Kubernetes manifests
deploy_k8s() {
    echo -e "${BLUE}Deploying Kubernetes manifests...${NC}"
    
    # Create namespace
    remote_exec "kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
    print_status "Namespace created"
    
    # Apply manifests in order
    remote_exec "cd ${K8S_DIR} && kubectl apply -f namespace/ -n ${NAMESPACE}"
    remote_exec "cd ${K8S_DIR} && kubectl apply -f secrets/ -n ${NAMESPACE}"
    remote_exec "cd ${K8S_DIR} && kubectl apply -f mysql/ -n ${NAMESPACE}"
    remote_exec "cd ${K8S_DIR} && kubectl apply -f backend/ -n ${NAMESPACE}"
    remote_exec "cd ${K8S_DIR} && kubectl apply -f frontend/ -n ${NAMESPACE}"
    remote_exec "cd ${K8S_DIR} && kubectl apply -f ingress/ -n ${NAMESPACE}"
    
    print_status "Kubernetes manifests deployed"
}

# Function to wait for deployments
wait_for_deployments() {
    echo -e "${BLUE}Waiting for deployments to be ready...${NC}"
    
    # Wait for backend
    remote_exec "kubectl rollout status deployment/backend -n ${NAMESPACE} --timeout=300s"
    print_status "Backend deployment ready"
    
    # Wait for frontend
    remote_exec "kubectl rollout status deployment/frontend -n ${NAMESPACE} --timeout=300s"
    print_status "Frontend deployment ready"
}

# Function to check deployment status
check_deployment() {
    echo -e "${BLUE}Checking deployment status...${NC}"
    
    echo -e "${YELLOW}=== Pods Status ===${NC}"
    remote_exec "kubectl get pods -n ${NAMESPACE}"
    
    echo -e "${YELLOW}=== Services Status ===${NC}"
    remote_exec "kubectl get services -n ${NAMESPACE}"
    
    echo -e "${YELLOW}=== Ingress Status ===${NC}"
    remote_exec "kubectl get ingress -n ${NAMESPACE}"
    
    echo -e "${YELLOW}=== Nginx Ingress Controller Status ===${NC}"
    remote_exec "kubectl get pods -n ingress-nginx"
}

# Function to configure firewall
configure_firewall() {
    echo -e "${BLUE}Configuring firewall for new ports...${NC}"
    remote_exec "ufw allow 8080/tcp"
    remote_exec "ufw allow 8443/tcp"
    remote_exec "ufw reload"
    print_status "Firewall configured for ports 8080 and 8443"
}

# Function to test application
test_application() {
    echo -e "${BLUE}Testing application endpoints...${NC}"
    
    # Test HTTP endpoint
    if curl -f http://${PRODUCTION_IP}:8080 &> /dev/null; then
        print_status "HTTP endpoint (port 8080) is accessible"
    else
        print_warning "HTTP endpoint (port 8080) is not accessible yet"
    fi
    
    # Test HTTPS endpoint
    if curl -f -k https://${PRODUCTION_IP}:8443 &> /dev/null; then
        print_status "HTTPS endpoint (port 8443) is accessible"
    else
        print_warning "HTTPS endpoint (port 8443) is not accessible yet"
    fi
}

# Function to show access information
show_access_info() {
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}Access Information:${NC}"
    echo -e "${YELLOW}HTTP:${NC} http://${PRODUCTION_IP}:8080"
    echo -e "${YELLOW}HTTPS:${NC} https://${PRODUCTION_IP}:8443"
    echo -e "${YELLOW}Domain (when DNS is updated):${NC} https://app.bookmynurse.com"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "1. Test the application on the new ports"
    echo -e "2. Update DNS A record to point to ${PRODUCTION_IP}"
    echo -e "3. Configure Apache to proxy to the new application (optional)"
    echo -e "4. Monitor application logs: kubectl logs -f deployment/frontend -n ${NAMESPACE}"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    check_k8s
    backup_existing
    deploy_k8s
    wait_for_deployments
    configure_firewall
    check_deployment
    test_application
    show_access_info
}

# Run main function
main "$@" 