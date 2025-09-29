# 🚀 BookMyNurse Enterprise DevOps Deployment

## 📋 Overview

This repository contains an enterprise-grade DevOps implementation for the BookMyNurse application, featuring:

- **Container Orchestration**: Kubernetes with advanced deployment strategies
- **Auto-scaling**: Horizontal Pod Autoscaler (HPA) for dynamic scaling
- **Security**: RBAC, Network Policies, Pod Security Policies
- **Monitoring**: Prometheus + Grafana stack with custom dashboards
- **Backup & Recovery**: Automated MySQL backups with disaster recovery
- **CI/CD**: Multi-stage pipeline with security scanning and automated rollback

## 🏗️ Architecture

### **Infrastructure Components**

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Frontend  │  │   Backend   │  │    MySQL    │        │
│  │   (Nginx)   │  │  (Node.js)  │  │ (StatefulSet)│        │
│  │   HPA: 2-8  │  │  HPA: 2-10  │  │   Replicas  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Prometheus  │  │   Grafana   │  │   Backup    │        │
│  │ (Metrics)   │  │ (Dashboards)│  │ (CronJob)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Ingress   │  │   Network   │  │    RBAC     │        │
│  │ (Nginx)     │  │  Policies   │  │ (Security)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### **Prerequisites**

- Kubernetes cluster (v1.20+)
- kubectl configured
- Docker for image building
- Ansible for infrastructure automation

### **1. Clone and Setup**

```bash
git clone <repository-url>
cd bookmynurse-devops
```

### **2. Deploy Enterprise Stack**

```bash
# Make script executable (Linux/Mac)
chmod +x scripts/deploy-enterprise.sh

# Run enterprise deployment
./scripts/deploy-enterprise.sh
```

### **3. Access Applications**

```bash
# Get service information
kubectl get services -n bookmynurse

# Access Prometheus
kubectl port-forward -n bookmynurse svc/prometheus 9090:9090

# Access Grafana
kubectl port-forward -n bookmynurse svc/grafana 3000:3000
# Credentials: admin/admin123
```

## 🔧 Enterprise Features

### **1. Auto-scaling (HPA)**

**Backend HPA Configuration:**
- **Min Replicas**: 2
- **Max Replicas**: 10
- **CPU Threshold**: 70%
- **Memory Threshold**: 80%
- **Scale-up**: 100% increase every 15s
- **Scale-down**: 10% decrease every 60s

**Frontend HPA Configuration:**
- **Min Replicas**: 2
- **Max Replicas**: 8
- **CPU Threshold**: 75%
- **Memory Threshold**: 85%

### **2. Security Implementation**

**RBAC (Role-Based Access Control):**
```yaml
# Service Account with minimal permissions
apiVersion: v1
kind: ServiceAccount
metadata:
  name: bookmynurse-sa
  namespace: bookmynurse
```

**Network Policies:**
- Frontend can only communicate with Backend
- Backend can only communicate with MySQL
- MySQL has no egress traffic
- Ingress controller access only on port 8080

**Pod Security Policies:**
- Non-root execution
- Read-only root filesystem
- No privilege escalation
- Drop all capabilities

### **3. Monitoring Stack**

**Prometheus Configuration:**
- Scrapes Kubernetes pods with `prometheus.io/scrape: "true"`
- Collects metrics from nodes, pods, and services
- 200-hour retention policy
- Custom scrape configurations

**Grafana Dashboards:**
- **Pod CPU Usage**: Real-time CPU utilization
- **Pod Memory Usage**: Memory consumption tracking
- **HTTP Request Rate**: Application traffic metrics
- **Database Performance**: MySQL metrics
- **Kubernetes Health**: Cluster status overview

### **4. Backup & Recovery**

**Automated MySQL Backups:**
```yaml
# Daily backup at 2 AM
schedule: "0 2 * * *"
```

**Backup Features:**
- **Automated**: Daily cron job
- **Compression**: gzip compression
- **Retention**: 7-day retention policy
- **S3 Integration**: Optional cloud storage
- **Point-in-Time Recovery**: Transaction log backup

**Recovery Process:**
1. **RPO**: < 5 minutes (with PITR)
2. **RTO**: 30-45 minutes (automated)
3. **Manual Backup**: On-demand backup jobs

### **5. CI/CD Pipeline**

**Multi-Stage Pipeline:**
1. **Security Scan**: npm audit, Trivy container scanning
2. **Build & Push**: Docker images with commit SHA tags
3. **Integration Test**: Automated testing environment
4. **Deploy**: Ansible-based deployment
5. **Verify**: Health checks and rollback capability

**Security Features:**
- **Container Scanning**: Trivy vulnerability scanning
- **Dependency Audit**: npm audit for security issues
- **Secrets Management**: GitHub Secrets integration
- **Automated Rollback**: Failure detection and rollback

## 📊 Monitoring & Observability

### **Four Golden Signals**

1. **Latency**: 95th percentile response times
2. **Traffic**: Requests per second (RPS)
3. **Errors**: 5xx error rate monitoring
4. **Saturation**: CPU/memory utilization

### **Custom Metrics**

**Application Metrics:**
- HTTP request duration
- Database query performance
- File upload success rate
- User authentication metrics

**Infrastructure Metrics:**
- Pod resource utilization
- Node health status
- Persistent volume usage
- Network traffic patterns

## 🔒 Security Best Practices

### **Container Security**
- Non-root user execution
- Read-only root filesystem
- Minimal base images (Alpine Linux)
- Regular security updates

### **Network Security**
- Network policies for pod-to-pod communication
- Ingress controller with TLS termination
- No direct database access from outside cluster
- Service mesh ready (Istio compatible)

### **Secrets Management**
- Kubernetes Secrets for sensitive data
- Base64 encoding (consider external secret management)
- RBAC for secret access control
- Secret rotation policies

## 🚨 Disaster Recovery

### **Backup Strategy**

**Database Backups:**
- **Automated**: Daily snapshots
- **Manual**: On-demand backup jobs
- **Compression**: gzip compression
- **Retention**: 7-day policy
- **Cloud Storage**: S3 integration ready

**Application Data:**
- **Code**: Git repository
- **Images**: Container registry
- **Configuration**: Kubernetes manifests
- **User Files**: Persistent volumes

### **Recovery Process**

**Automated Recovery (30-45 minutes):**
1. Provision new infrastructure (15-20 mins)
2. Restore database from backup (5-10 mins)
3. Deploy application (2-3 mins)
4. Update DNS (1-5 mins)

**Manual Recovery (2-4 hours):**
1. Acquire new server (1-2 hours)
2. Install dependencies (30 mins)
3. Retrieve backups (30+ mins)
4. Recreate application (15 mins)
5. Restore data (15+ mins)
6. Update DNS (5 mins)

## 🛠️ Troubleshooting

### **Common Issues**

**Pod Stuck in Pending:**
```bash
kubectl describe pod <pod-name> -n bookmynurse
kubectl get events -n bookmynurse
```

**HPA Not Scaling:**
```bash
kubectl get hpa -n bookmynurse
kubectl describe hpa <hpa-name> -n bookmynurse
```

**Monitoring Issues:**
```bash
kubectl logs -l app=prometheus -n bookmynurse
kubectl logs -l app=grafana -n bookmynurse
```

**Backup Failures:**
```bash
kubectl logs -l app=mysql-backup -n bookmynurse
kubectl get cronjobs -n bookmynurse
```

### **Health Checks**

**Application Health:**
```bash
curl -f http://localhost:8080/health
curl -f http://localhost:8080/ready
```

**Database Health:**
```bash
kubectl exec -it mysql-0 -n bookmynurse -- mysql -u root -p -e "SELECT 1"
```

**Monitoring Health:**
```bash
curl -f http://localhost:9090/-/healthy  # Prometheus
curl -f http://localhost:3000/api/health  # Grafana
```

## 📈 Performance Optimization

### **Resource Optimization**

**Backend Resources:**
- **Requests**: 250m CPU, 256Mi memory
- **Limits**: 500m CPU, 512Mi memory
- **HPA**: CPU 70%, Memory 80%

**Frontend Resources:**
- **Requests**: 100m CPU, 128Mi memory
- **Limits**: 200m CPU, 256Mi memory
- **HPA**: CPU 75%, Memory 85%

### **Scaling Strategies**

**Horizontal Scaling:**
- HPA based on CPU/memory metrics
- Cluster autoscaler for node scaling
- Load balancer for traffic distribution

**Vertical Scaling:**
- VPA for resource optimization
- Resource limits and requests tuning
- Performance monitoring and adjustment

## 🔄 CI/CD Pipeline

### **Pipeline Stages**

1. **Security Scan**
   - npm audit for dependencies
   - Trivy for container vulnerabilities
   - SAST for code analysis

2. **Build & Push**
   - Multi-stage Docker builds
   - Image tagging with commit SHA
   - Registry push with caching

3. **Integration Test**
   - Docker Compose test environment
   - Automated test execution
   - Environment cleanup

4. **Deploy**
   - Ansible infrastructure automation
   - Kubernetes manifest updates
   - Health check verification

5. **Rollback**
   - Automatic failure detection
   - Previous version restoration
   - Verification and notification

### **Deployment Strategies**

**Rolling Update:**
- Zero-downtime deployments
- Gradual pod replacement
- Health check validation

**Blue-Green (Future):**
- Complete environment switching
- Instant rollback capability
- Full testing before switch

**Canary (Future):**
- Gradual traffic shifting
- A/B testing capability
- Risk mitigation

## 📚 Documentation

### **Architecture Decisions**
- [Production Deployment Strategy](docs/production-deployment-strategy.md)
- [Security Implementation](docs/security-implementation.md)
- [Monitoring Strategy](docs/monitoring-strategy.md)

### **Troubleshooting Guides**
- [Common Issues](docs/troubleshooting.md)
- [Performance Tuning](docs/performance-tuning.md)
- [Disaster Recovery](docs/disaster-recovery.md)

### **API Documentation**
- [Backend API](docs/api-documentation.md)
- [Health Check Endpoints](docs/health-checks.md)
- [Metrics Endpoints](docs/metrics-endpoints.md)

## 🤝 Contributing

### **Development Workflow**

1. **Fork** the repository
2. **Create** feature branch
3. **Implement** changes with tests
4. **Submit** pull request
5. **Review** and merge

### **Code Standards**

- **Kubernetes**: Follow best practices
- **Security**: Implement security-first approach
- **Documentation**: Update relevant docs
- **Testing**: Include integration tests

## 📞 Support

### **Issues and Questions**

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check existing docs first
- **Community**: Join discussions and Q&A

### **Enterprise Support**

For enterprise support and consulting:
- **Email**: support@bookmynurse.com
- **Documentation**: Enterprise deployment guide
- **Training**: DevOps best practices training

---

**🚀 Ready to deploy enterprise-grade DevOps infrastructure!**

*Last updated: $(date)*
