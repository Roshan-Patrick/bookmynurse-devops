# 🚀 BookMyNurse DevOps Migration Plan
## From Apache to Modern CI/CD Pipeline

> **Project:** app.bookmynurse.com  
> **Server:** 192.168.3.194:22  
> **Migration Goal:** Apache → Docker + Kubernetes + CI/CD Pipeline

---

## 🔍 **Current State Analysis**

### Your Current Setup
```
Apache Configuration:
├── Domain: app.bookmynurse.com
├── SSL: Enabled (Let's Encrypt)
├── Frontend: /var/www/bnm
├── Backend: Proxy to :3000
├── Manual deployment
└── No version control automation
```

### Target Architecture
```
Modern DevOps Stack:
├── Docker Containers
├── Kubernetes Orchestration
├── GitHub Actions CI/CD
├── Automated SSL/TLS
├── Zero-downtime deployments
├── Monitoring & Alerting
└── Automated backups
```

---

## 📅 **Migration Timeline (7-10 Days)**

### **Phase 1: Preparation (Days 1-2)**
- [x] Current setup backup
- [ ] Development environment setup
- [ ] Repository creation
- [ ] Initial containerization

### **Phase 2: Infrastructure (Days 3-4)**
- [ ] Server provisioning with Ansible
- [ ] Kubernetes cluster setup
- [ ] Database migration
- [ ] SSL certificate migration

### **Phase 3: Application Migration (Days 5-6)**
- [ ] Frontend containerization
- [ ] Backend containerization
- [ ] Kubernetes deployment
- [ ] Domain configuration

### **Phase 4: CI/CD & Optimization (Days 7-10)**
- [ ] GitHub Actions setup
- [ ] Monitoring implementation
- [ ] Performance optimization
- [ ] Security hardening

---

## 🛠️ **Step-by-Step Implementation**

### **STEP 1: Backup Current Setup**

```bash
# Connect to your server
ssh -p 2244 root@103.91.186.102

# Create comprehensive backup
mkdir -p /backup/$(date +%Y%m%d)
cd /backup/$(date +%Y%m%d)

# Backup Apache configurations
cp -r /etc/apache2 ./apache2_backup/
cp -r /var/www/bnm ./website_backup/

# Backup SSL certificates
cp -r /etc/letsencrypt ./ssl_backup/

# Backup databases (if any)
mysqldump --all-databases > all_databases_backup.sql

# Create compressed archive
tar -czf bookmynurse_backup_$(date +%Y%m%d).tar.gz .

# Test backup integrity
tar -tzf bookmynurse_backup_$(date +%Y%m%d).tar.gz | head -10
```

### **STEP 2: Create GitHub Repository**

```bash
# Create new repository structure
mkdir bookmynurse-devops
cd bookmynurse-devops

# Initialize git
git init
git remote add origin https://github.com/yourusername/bookmynurse-devops.git

# Create directory structure
mkdir -p {
  frontend/{src,public,nginx},
  backend/{src,tests},
  k8s/{mysql,backend,frontend,monitoring,ingress},
  ansible/{roles/{common,docker,kubernetes,nginx-ingress}/tasks,group_vars},
  .github/workflows,
  scripts,
  docs
}

# Create initial files
echo "# BookMyNurse DevOps Migration" > README.md
echo "node_modules/" > .gitignore
echo "*.log" >> .gitignore
echo ".env" >> .gitignore
```

### **STEP 3: Containerize Applications**

#### Frontend Containerization
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Frontend Nginx Configuration
```nginx
# frontend/nginx/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend-service:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Backend Containerization
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy application code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

EXPOSE 3000
CMD ["node", "src/app.js"]
```

### **STEP 4: Kubernetes Configuration**

#### Namespace and Basic Setup
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bookmynurse
  labels:
    name: bookmynurse
```

#### MySQL Database Setup
```yaml
# k8s/mysql/mysql-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: bookmynurse
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: root-password
        - name: MYSQL_DATABASE
          value: bookmynurse
        - name: MYSQL_USER
          value: app_user
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: user-password
        volumeMounts:
        - name: mysql-storage
          mountPath: /var/lib/mysql
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: mysql-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mysql-service
  namespace: bookmynurse
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
  type: ClusterIP
```

#### Backend Deployment
```yaml
# k8s/backend/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: bookmynurse
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: yourusername/bookmynurse-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "mysql-service"
        - name: DB_PORT
          value: "3306"
        - name: DB_NAME
          value: "bookmynurse"
        - name: DB_USER
          value: "app_user"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: user-password
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: bookmynurse
spec:
  selector:
    app: backend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

#### Frontend Deployment
```yaml
# k8s/frontend/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: bookmynurse
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: yourusername/bookmynurse-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: bookmynurse
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

#### Ingress Configuration
```yaml
# k8s/ingress/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bookmynurse-ingress
  namespace: bookmynurse
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - app.bookmynurse.com
    secretName: bookmynurse-tls
  rules:
  - host: app.bookmynurse.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### **STEP 5: CI/CD Pipeline Setup**

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: docker.io
  FRONTEND_IMAGE: yourusername/bookmynurse-frontend
  BACKEND_IMAGE: yourusername/bookmynurse-backend

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          frontend/package-lock.json
          backend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend && npm ci
        cd ../backend && npm ci
    
    - name: Run tests
      run: |
        cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
        cd ../backend && npm test
    
    - name: Run linting
      run: |
        cd frontend && npm run lint
        cd ../backend && npm run lint

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Log in to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push frontend
      uses: docker/build-push-action@v5
      with:
        context: ./frontend
        push: true
        tags: ${{ env.FRONTEND_IMAGE }}:${{ github.sha }},${{ env.FRONTEND_IMAGE }}:latest
    
    - name: Build and push backend
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: ${{ env.BACKEND_IMAGE }}:${{ github.sha }},${{ env.BACKEND_IMAGE }}:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'latest'
    
    - name: Configure kubectl
      run: |
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
    
    - name: Deploy to Kubernetes
      run: |
        export KUBECONFIG=kubeconfig
        
        # Update image tags
        sed -i "s|image: yourusername/bookmynurse-frontend:latest|image: ${{ env.FRONTEND_IMAGE }}:${{ github.sha }}|g" k8s/frontend/frontend-deployment.yaml
        sed -i "s|image: yourusername/bookmynurse-backend:latest|image: ${{ env.BACKEND_IMAGE }}:${{ github.sha }}|g" k8s/backend/backend-deployment.yaml
        
        # Apply configurations
        kubectl apply -f k8s/
        
        # Wait for rollout
        kubectl rollout status deployment/frontend -n bookmynurse
        kubectl rollout status deployment/backend -n bookmynurse
        
        # Verify deployment
        kubectl get pods -n bookmynurse
```

### **STEP 6: Ansible Server Setup**

#### Ansible Configuration
```yaml
# ansible/playbook.yaml
---
- name: Setup BookMyNurse DevOps Infrastructure
  hosts: production
  become: yes
  vars:
    domain_name: app.bookmynurse.com
    
  tasks:
  - name: Create backup of current setup
    block:
    - name: Stop Apache
      systemd:
        name: apache2
        state: stopped
      ignore_errors: yes
    
    - name: Backup Apache config
      copy:
        src: /etc/apache2
        dest: /backup/apache2_$(date +%Y%m%d)
        remote_src: yes
    
    - name: Backup website files
      copy:
        src: /var/www/bnm
        dest: /backup/bnm_$(date +%Y%m%d)
        remote_src: yes

  - name: Install Docker
    block:
    - name: Install Docker dependencies
      apt:
        name:
          - apt-transport-https
          - ca-certificates
          - curl
          - gnupg
          - lsb-release
        state: present
        update_cache: yes
    
    - name: Add Docker GPG key
      apt_key:
        url: https://download.docker.com/linux/ubuntu/gpg
        state: present
    
    - name: Add Docker repository
      apt_repository:
        repo: "deb [arch=amd64] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
        state: present
    
    - name: Install Docker
      apt:
        name:
          - docker-ce
          - docker-ce-cli
          - containerd.io
        state: present
        update_cache: yes
    
    - name: Start Docker service
      systemd:
        name: docker
        state: started
        enabled: yes

  - name: Install Kubernetes
    block:
    - name: Disable swap
      shell: swapoff -a
    
    - name: Install Kubernetes repository key
      apt_key:
        url: https://packages.cloud.google.com/apt/doc/apt-key.gpg
        state: present
    
    - name: Add Kubernetes repository
      apt_repository:
        repo: "deb https://apt.kubernetes.io/ kubernetes-xenial main"
        state: present
    
    - name: Install Kubernetes components
      apt:
        name:
          - kubelet=1.28*
          - kubeadm=1.28*
          - kubectl=1.28*
        state: present
        update_cache: yes
    
    - name: Initialize Kubernetes cluster
      command: kubeadm init --pod-network-cidr=10.244.0.0/16
      register: kubeadm_output
      failed_when: false
    
    - name: Setup kubeconfig
      shell: |
        mkdir -p /root/.kube
        cp -i /etc/kubernetes/admin.conf /root/.kube/config
        chown $(id -u):$(id -g) /root/.kube/config
      when: kubeadm_output.rc == 0
    
    - name: Install Flannel CNI
      shell: kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
      when: kubeadm_output.rc == 0

  - name: Install Nginx Ingress Controller
    shell: |
      kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/baremetal/deploy.yaml
      kubectl patch svc ingress-nginx-controller -n ingress-nginx -p '{"spec": {"type": "LoadBalancer", "externalIPs":["103.91.186.102"]}}'

  - name: Install cert-manager
    shell: |
      kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
      
  - name: Configure firewall
    ufw:
      rule: allow
      port: "{{ item }}"
    loop:
      - "80"
      - "443"
      - "6443"
      - "30000:32767"
```

### **STEP 7: Monitoring Setup**

#### Prometheus Configuration
```yaml
# k8s/monitoring/prometheus.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: bookmynurse
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: prometheus-config
          mountPath: /etc/prometheus
        - name: prometheus-storage
          mountPath: /prometheus
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--web.console.libraries=/etc/prometheus/console_libraries'
          - '--web.console.templates=/etc/prometheus/consoles'
          - '--web.enable-lifecycle'
      volumes:
      - name: prometheus-config
        configMap:
          name: prometheus-config
      - name: prometheus-storage
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus-service
  namespace: bookmynurse
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
  type: ClusterIP
```

---

## 🚀 **Deployment Commands**

### **Quick Start Commands**

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/bookmynurse-devops.git
cd bookmynurse-devops

# 2. Configure Ansible inventory
echo "[production]" > ansible/inventory.ini
echo "main-server ansible_host=103.91.186.102 ansible_port=2244 ansible_user=root" >> ansible/inventory.ini

# 3. Run server provisioning
cd ansible
ansible-playbook -i inventory.ini playbook.yaml

# 4. Deploy applications
kubectl apply -f k8s/

# 5. Check deployment status
kubectl get pods -n bookmynurse
kubectl get ingress -n bookmynurse
```

---

## 🔧 **GitHub Repository Setup**

### **Required Secrets**
Add these to your GitHub repository secrets:

```
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password
KUBE_CONFIG=base64-encoded-kubeconfig
SERVER_HOST=103.91.186.102
SERVER_PORT=2244
SERVER_USER=root
```

### **Environment Variables**
```bash
# Get base64 encoded kubeconfig
ssh -p 2244 root@103.91.186.102 "cat /root/.kube/config | base64 -w 0"
```

---

## 📊 **Monitoring & Health Checks**

### **Application Health Endpoints**
- Frontend: `http://app.bookmynurse.com/`
- Backend: `http://app.bookmynurse.com/api/health`
- Prometheus: `http://app.bookmynurse.com/prometheus`

### **Monitoring Commands**
```bash
# Check cluster status
kubectl get nodes
kubectl get pods --all-namespaces

# Check application logs
kubectl logs -f deployment/frontend -n bookmynurse
kubectl logs -f deployment/backend -n bookmynurse

# Check ingress status
kubectl describe ingress bookmynurse-ingress -n bookmynurse
```

---

## 🛡️ **Security Considerations**

### **SSL/TLS Migration**
- Your current Let's Encrypt certificates will be replaced by cert-manager
- Automatic certificate renewal
- HTTPS-only configuration

### **Security Features**
- Container security scanning
- Network policies
- RBAC implementation
- Secret management
- Regular security updates

---

## 🔄 **Rollback Strategy**

### **Emergency Rollback**
```bash
# Rollback to previous version
kubectl rollout undo deployment/frontend -n bookmynurse
kubectl rollout undo deployment/backend -n bookmynurse

# Restore Apache (if needed)
systemctl start apache2
systemctl enable apache2
```

### **Database Backup**
```bash
# Automated daily backups
kubectl create cronjob mysql-backup --image=mysql:8.0 --schedule="0 2 * * *" -- /bin/bash -c "mysqldump -h mysql-service -u root -p\$MYSQL_ROOT_PASSWORD --all-databases > /backup/mysql-\$(date +%Y%m%d).sql"
```

---

## 📞 **Next Steps**

1. **Set up development environment**
2. **Create GitHub repository**
3. **Run Ansible playbook**
4. **Test deployment locally**
5. **Deploy to production**
6. **Monitor and optimize**

---

## 🆘 **Support & Troubleshooting**

### **Common Issues**
- **Pod startup failures**: Check logs with `kubectl logs`
- **Ingress not working**: Verify DNS and firewall
- **Database connection**: Check service names and secrets
- **SSL certificate**: Wait for cert-manager to provision

### **Useful Commands**
```bash
# Debug pod issues
kubectl describe pod <pod-name> -n bookmynurse

# Check resource usage
kubectl top pods -n bookmynurse

# Access pod shell
kubectl exec -it <pod-name> -n bookmynurse -- /bin/bash
```

This migration plan will transform your traditional Apache setup into a modern, scalable, and maintainable DevOps pipeline while preserving your domain and ensuring zero downtime during the transition.