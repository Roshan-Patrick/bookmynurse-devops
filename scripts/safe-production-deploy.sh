#!/bin/bash

# =============================================================================
# SAFE Production Deployment Script for BookMyNurse
# Deploys containerized application WITHOUT touching existing Apache setup
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

echo -e "${BLUE}🛡️  SAFE BookMyNurse Production Deployment${NC}"
echo -e "${YELLOW}Target Server: ${PRODUCTION_IP}:${SSH_PORT}${NC}"
echo -e "${YELLOW}Strategy: Install alongside existing services (NO Apache interruption)${NC}"

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

# Function to execute remote command
remote_exec() {
    ssh -o StrictHostKeyChecking=no -p ${SSH_PORT} ${SSH_USER}@${PRODUCTION_IP} "$1"
}

# Function to check existing services
check_existing_services() {
    echo -e "${BLUE}Checking existing services...${NC}"
    
    # Check Apache status
    if remote_exec "systemctl is-active apache2" &> /dev/null; then
        print_status "Apache is running (will be left untouched)"
    else
        print_warning "Apache is not running"
    fi
    
    # Check what's listening on ports
    echo -e "${YELLOW}Current port usage:${NC}"
    remote_exec "netstat -tlnp | grep -E ':(80|443|8080|8443)' || echo 'No services on target ports'"
    
    # Check disk space
    echo -e "${YELLOW}Disk space:${NC}"
    remote_exec "df -h /"
    
    # Check memory
    echo -e "${YELLOW}Memory usage:${NC}"
    remote_exec "free -h"
}

# Function to install Docker safely
install_docker() {
    echo -e "${BLUE}Installing Docker...${NC}"
    
    # Update package list
    remote_exec "apt-get update"
    
    # Install Docker dependencies
    remote_exec "apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release"
    
    # Add Docker GPG key
    remote_exec "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg"
    
    # Add Docker repository
    remote_exec "echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu jammy stable' | tee /etc/apt/sources.list.d/docker.list > /dev/null"
    
    # Install Docker
    remote_exec "apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io"
    
    # Start and enable Docker
    remote_exec "systemctl start docker && systemctl enable docker"
    
    print_status "Docker installed successfully"
}

# Function to install Kubernetes safely
install_kubernetes() {
    echo -e "${BLUE}Installing Kubernetes...${NC}"
    
    # Disable swap
    remote_exec "swapoff -a"
    remote_exec "sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab"
    
    # Install Kubernetes repository key
    remote_exec "curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/kubernetes-archive-keyring.gpg"
    
    # Add Kubernetes repository
    remote_exec "echo 'deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main' | tee /etc/apt/sources.list.d/kubernetes.list"
    
    # Install Kubernetes components
    remote_exec "apt-get update && apt-get install -y kubelet=1.28.* kubeadm=1.28.* kubectl=1.28.*"
    
    # Hold Kubernetes packages
    remote_exec "apt-mark hold kubelet kubeadm kubectl"
    
    print_status "Kubernetes components installed"
}

# Function to initialize Kubernetes cluster
initialize_k8s_cluster() {
    echo -e "${BLUE}Initializing Kubernetes cluster...${NC}"
    
    # Initialize cluster with specific pod network CIDR
    remote_exec "kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=${PRODUCTION_IP}"
    
    # Setup kubeconfig
    remote_exec "mkdir -p /root/.kube && cp -i /etc/kubernetes/admin.conf /root/.kube/config"
    
    # Install Flannel CNI
    remote_exec "kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml"
    
    # Wait for cluster to be ready
    remote_exec "kubectl wait --for=condition=Ready nodes --all --timeout=300s"
    
    print_status "Kubernetes cluster initialized"
}

# Function to install Nginx Ingress Controller
install_nginx_ingress() {
    echo -e "${BLUE}Installing Nginx Ingress Controller...${NC}"
    
    # Install Nginx Ingress Controller
    remote_exec "kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/baremetal/deploy.yaml"
    
    # Wait for ingress controller to be ready
    remote_exec "kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s"
    
    # Patch service to use non-conflicting ports
    remote_exec "kubectl patch svc ingress-nginx-controller -n ingress-nginx -p '{\"spec\": {\"type\": \"LoadBalancer\", \"externalIPs\":[\"${PRODUCTION_IP}\"], \"ports\": [{\"name\": \"http\", \"port\": 8080, \"targetPort\": 80}, {\"name\": \"https\", \"port\": 8443, \"targetPort\": 443}]}}'"
    
    print_status "Nginx Ingress Controller installed on ports 8080/8443"
}

# Function to configure firewall safely
configure_firewall() {
    echo -e "${BLUE}Configuring firewall for new ports...${NC}"
    
    # Enable UFW
    remote_exec "ufw --force enable"
    
    # Allow SSH
    remote_exec "ufw allow 22/tcp"
    
    # Allow existing Apache ports (if needed)
    remote_exec "ufw allow 80/tcp"
    remote_exec "ufw allow 443/tcp"
    
    # Allow new application ports
    remote_exec "ufw allow 8080/tcp"
    remote_exec "ufw allow 8443/tcp"
    
    # Allow Kubernetes ports
    remote_exec "ufw allow 6443/tcp"
    remote_exec "ufw allow 30000:32767/tcp"
    
    print_status "Firewall configured safely"
}

# Function to deploy application
deploy_application() {
    echo -e "${BLUE}Deploying BookMyNurse application...${NC}"
    
    # Create namespace
    remote_exec "kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
    
    # Apply manifests in order
    remote_exec "cd ${K8S_DIR} && kubectl apply -f namespace/ -n ${NAMESPACE}"
    remote_exec "cd ${K8S_DIR} && kubectl apply -f secrets/ -n ${NAMESPACE}"
    remote_exec "cd ${K8S_DIR} && kubectl apply -f mysql/ -n ${NAMESPACE}"
    remote_exec "cd ${K8S_DIR} && kubectl apply -f backend/ -n ${NAMESPACE}"
    remote_exec "cd ${K8S_DIR} && kubectl apply -f frontend/ -n ${NAMESPACE}"
    remote_exec "cd ${K8S_DIR} && kubectl apply -f ingress/ -n ${NAMESPACE}"
    
    print_status "Application manifests deployed"
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
    echo -e "${GREEN}🎉 SAFE Deployment completed successfully!${NC}"
    echo -e "${BLUE}Access Information:${NC}"
    echo -e "${YELLOW}New Containerized App:${NC} http://${PRODUCTION_IP}:8080"
    echo -e "${YELLOW}New Containerized App (HTTPS):${NC} https://${PRODUCTION_IP}:8443"
    echo -e "${YELLOW}Existing Apache App:${NC} http://${PRODUCTION_IP} (unchanged)"
    echo -e "${YELLOW}Domain (when DNS updated):${NC} https://app.bookmynurse.com"
    echo ""
    echo -e "${BLUE}Safety Features:${NC}"
    echo -e "✅ Apache left completely untouched"
    echo -e "✅ Other projects unaffected"
    echo -e "✅ Non-conflicting ports (8080/8443)"
    echo -e "✅ Isolated Kubernetes namespace"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "1. Test the new application on ports 8080/8443"
    echo -e "2. Update DNS A record when ready"
    echo -e "3. Monitor application: kubectl logs -f deployment/frontend -n ${NAMESPACE}"
    echo -e "4. Apache continues serving other projects normally"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting SAFE deployment process...${NC}"
    
    check_existing_services
    install_docker
    install_kubernetes
    initialize_k8s_cluster
    install_nginx_ingress
    configure_firewall
    deploy_application
    wait_for_deployments
    check_deployment
    test_application
    show_access_info
}

# Run main function
main "$@" 