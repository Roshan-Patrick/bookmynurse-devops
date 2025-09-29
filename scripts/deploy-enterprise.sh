#!/bin/bash

# =============================================================================
# scripts/deploy-enterprise.sh
# Enterprise Deployment Script with Enhanced Features
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="bookmynurse"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="deployment-${TIMESTAMP}.log"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
    fi
    
    if ! command -v docker &> /dev/null; then
        error "docker is not installed"
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
    fi
    
    success "Prerequisites check passed"
}

# Create namespace if it doesn't exist
create_namespace() {
    log "Creating namespace if it doesn't exist..."
    
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        kubectl create namespace "$NAMESPACE"
        success "Namespace $NAMESPACE created"
    else
        log "Namespace $NAMESPACE already exists"
    fi
}

# Deploy storage infrastructure
deploy_storage() {
    log "Deploying storage infrastructure..."
    
    # Apply storage class and persistent volumes
    kubectl apply -f k8s/storage/ -n "$NAMESPACE"
    
    # Wait for storage to be ready
    kubectl wait --for=condition=Ready pv/mysql-pv --timeout=60s || warning "PV not ready"
    kubectl wait --for=condition=Ready pv/backup-pv --timeout=60s || warning "Backup PV not ready"
    
    success "Storage infrastructure deployed"
}

# Deploy security policies
deploy_security() {
    log "Deploying security policies..."
    
    # Apply RBAC
    kubectl apply -f k8s/security/rbac.yaml -n "$NAMESPACE"
    
    # Apply network policies
    kubectl apply -f k8s/network/network-policy.yaml -n "$NAMESPACE"
    
    # Apply Pod Security Policy (if supported)
    if kubectl api-resources | grep -q "podsecuritypolicies"; then
        kubectl apply -f k8s/security/pod-security-policy.yaml -n "$NAMESPACE"
    else
        warning "Pod Security Policy not supported in this cluster"
    fi
    
    success "Security policies deployed"
}

# Deploy monitoring stack
deploy_monitoring() {
    log "Deploying monitoring stack..."
    
    # Deploy Prometheus
    kubectl apply -f k8s/monitoring/prometheus.yaml -n "$NAMESPACE"
    
    # Deploy Grafana
    kubectl apply -f k8s/monitoring/grafana.yaml -n "$NAMESPACE"
    
    # Wait for monitoring to be ready
    kubectl wait --for=condition=Ready pod -l app=prometheus -n "$NAMESPACE" --timeout=120s
    kubectl wait --for=condition=Ready pod -l app=grafana -n "$NAMESPACE" --timeout=120s
    
    success "Monitoring stack deployed"
}

# Deploy backup infrastructure
deploy_backup() {
    log "Deploying backup infrastructure..."
    
    # Apply backup configurations
    kubectl apply -f k8s/backup/mysql-backup.yaml -n "$NAMESPACE"
    
    success "Backup infrastructure deployed"
}

# Deploy application components
deploy_application() {
    log "Deploying application components..."
    
    # Deploy MySQL
    kubectl apply -f k8s/mysql/ -n "$NAMESPACE"
    
    # Wait for MySQL to be ready
    kubectl wait --for=condition=Ready pod -l app=mysql -n "$NAMESPACE" --timeout=300s
    
    # Deploy backend
    kubectl apply -f k8s/backend/ -n "$NAMESPACE"
    
    # Deploy frontend
    kubectl apply -f k8s/frontend/ -n "$NAMESPACE"
    
    # Wait for application to be ready
    kubectl wait --for=condition=Ready pod -l app=backend -n "$NAMESPACE" --timeout=120s
    kubectl wait --for=condition=Ready pod -l app=frontend -n "$NAMESPACE" --timeout=120s
    
    success "Application components deployed"
}

# Deploy autoscaling
deploy_autoscaling() {
    log "Deploying autoscaling configurations..."
    
    # Deploy HPA for backend and frontend
    kubectl apply -f k8s/autoscaling/ -n "$NAMESPACE"
    
    success "Autoscaling configurations deployed"
}

# Deploy ingress
deploy_ingress() {
    log "Deploying ingress configuration..."
    
    # Deploy ingress
    kubectl apply -f k8s/ingress/ -n "$NAMESPACE"
    
    success "Ingress configuration deployed"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check pod status
    log "Pod status:"
    kubectl get pods -n "$NAMESPACE" -o wide
    
    # Check service status
    log "Service status:"
    kubectl get services -n "$NAMESPACE"
    
    # Check ingress status
    log "Ingress status:"
    kubectl get ingress -n "$NAMESPACE"
    
    # Check HPA status
    log "HPA status:"
    kubectl get hpa -n "$NAMESPACE"
    
    # Check if application is accessible
    log "Testing application health..."
    if kubectl get service frontend-service -n "$NAMESPACE" &> /dev/null; then
        FRONTEND_IP=$(kubectl get service frontend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        if [ -n "$FRONTEND_IP" ]; then
            if curl -f "http://$FRONTEND_IP:8080" &> /dev/null; then
                success "Application is accessible at http://$FRONTEND_IP:8080"
            else
                warning "Application may not be fully ready yet"
            fi
        fi
    fi
    
    success "Deployment verification completed"
}

# Display access information
display_access_info() {
    log "Deployment completed successfully!"
    echo ""
    echo "=== Access Information ==="
    echo "Namespace: $NAMESPACE"
    echo "Log file: $LOG_FILE"
    echo ""
    
    # Get service information
    echo "=== Services ==="
    kubectl get services -n "$NAMESPACE"
    echo ""
    
    # Get ingress information
    echo "=== Ingress ==="
    kubectl get ingress -n "$NAMESPACE"
    echo ""
    
    # Get monitoring information
    echo "=== Monitoring ==="
    echo "Prometheus: kubectl port-forward -n $NAMESPACE svc/prometheus 9090:9090"
    echo "Grafana: kubectl port-forward -n $NAMESPACE svc/grafana 3000:3000"
    echo "Grafana credentials: admin/admin123"
    echo ""
    
    # Get backup information
    echo "=== Backup ==="
    echo "Manual backup: kubectl create job --from=cronjob/mysql-backup mysql-manual-backup-$(date +%Y%m%d) -n $NAMESPACE"
    echo ""
}

# Main deployment function
main() {
    log "Starting enterprise deployment..."
    log "Timestamp: $TIMESTAMP"
    log "Namespace: $NAMESPACE"
    
    check_prerequisites
    create_namespace
    deploy_storage
    deploy_security
    deploy_monitoring
    deploy_backup
    deploy_application
    deploy_autoscaling
    deploy_ingress
    verify_deployment
    display_access_info
    
    success "Enterprise deployment completed successfully!"
}

# Run main function
main "$@"
