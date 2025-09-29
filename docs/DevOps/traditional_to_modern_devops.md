# 🚀 Transition from Traditional Apache Hosting to Modern DevOps Pipeline

## 📌 Current State (Traditional Deployment)

Just for your information and wanted to share, this is my SSH credentials
SSH Access Information
================================
Main IP Address:103.91.186.102
root password: *****
Port: 2244


**Apache Config (bmn.config)**

```
<VirtualHost *:80>
    ServerName app.bookmynurse.com
    ServerAlias www.app.bookmynurse.com

    DocumentRoot /var/www/bnm
    <Directory /var/www/html/bnm>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Proxy requests to Node.js backend running on port 3000
    ProxyPreserveHost On
    ProxyPass /api http://app.bookmynurse.com:3000
    ProxyPassReverse /api http://app.bookmynurse.com:3000

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

**SSL Config (bmn-le-ssl.config)**
```
<VirtualHost *:443>
    ServerName app.bookmynurse.com
    ServerAlias www.app.bookmynurse.com

    DocumentRoot /var/www/bnm
    <Directory /var/www/bnm>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Proxy configuration commented out
    # ProxyPass /api http://103.91.186.102:3000
    # ProxyPassReverse /api http://103.91.186.102:3000

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

**Drawbacks of This Approach:**
- Manual upload of files (SCP/SFTP)
- Manual restart of Node.js
- No automated build/test
- No containerization
- No reproducible infrastructure
- Scaling and rollback are hard

---

## 🎯 Goal

Move to a **modern, automated, reproducible deployment pipeline**:

✅ Docker  
✅ Kubernetes  
✅ Helm  
✅ Ansible  
✅ GitHub Actions  
✅ Local testing in WSL

---

## 🪜 Step-by-Step Transition Plan

### 1️⃣ Containerize Everything with Docker

**Frontend (Angular):**
- Build static assets
- Serve via Nginx container

**Backend (Node.js):**
- Production image
- Expose port 3000

**MySQL:**
- Use official MySQL image

---

### 2️⃣ Test Locally with WSL

- Build Docker images:
  ```
  docker build -t angular-app ./frontend
  docker build -t node-app ./backend
  ```
- Run containers and check connectivity

---

### 3️⃣ Write Kubernetes Manifests

**Deployments:**
- Angular
- Node.js
- MySQL

**Services:**
- ClusterIP for MySQL
- NodePort or Ingress for frontend/backend

---

### 4️⃣ Replace Apache with Kubernetes Ingress

**Ingress Controller Responsibilities:**
- Reverse proxy
- TLS termination
- Path routing (/api and /)

**Example Ingress YAML:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bmn-ingress
spec:
  rules:
    - host: app.bookmynurse.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: angular-service
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: node-service
                port:
                  number: 3000
```

---

### 5️⃣ Package Manifests with Helm

- Create a Helm chart
- Use `helm upgrade --install` to deploy

---

### 6️⃣ Automate Provisioning with Ansible

**Tasks:**
- Install Docker
- Install Kubernetes (kubeadm)
- Install Helm
- Install Jenkins (optional)

---

### 7️⃣ Add CI/CD Pipeline with GitHub Actions

**Pipeline Steps:**
- Checkout code
- Run tests
- Build Docker images
- Push to Docker Hub
- Deploy via kubectl or Helm

---

### 8️⃣ Implement Testing

**Angular:**
- Jasmine unit tests
- Cypress E2E tests

**Node.js:**
- Jest unit tests
- Supertest integration tests

---

### 9️⃣ Validate and Switch Traffic

- Deploy to Kubernetes
- Test end-to-end
- Point DNS to Ingress

---

## ⚙️ Benefits

✅ Automated builds/tests/deployments  
✅ Easy rollbacks  
✅ Scalable and reproducible  
✅ No manual Apache configs

---

## 🤖 Example Prompt to LLM

> Please analyze this plan and generate:
> - Dockerfiles
> - Kubernetes manifests and Ingress YAML
> - Helm chart templates
> - Ansible playbook
> - GitHub Actions workflows
> - Sample test files

---

## 🎯 Interview Talking Points

- Migration from legacy Apache to modern DevOps
- Use of container orchestration (K8s)
- CI/CD pipelines (GitHub Actions)
- Infrastructure as Code (Ansible)
- Security and reproducibility improvements

---

## 📝 Notes

- Self-hosted server (SSH access)
- No cloud provider
- WSL used for local testing

---
