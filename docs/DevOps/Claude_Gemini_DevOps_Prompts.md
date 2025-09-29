# DevOps AI Prompts for BookMyNurse Migration

This file contains a set of refined, step-by-step prompts for use with Claude, Gemini, or similar LLMs to generate all necessary DevOps configuration files for migrating from a traditional Apache setup to a modern CI/CD pipeline. Prompts are organized by logical chat/session for best results and include database initialization steps.

---

## Instructions
- Use a **new chat/session for each prompt** below.
- **Always paste the full content of your `traditional_to_modern_devops.md` file** after the prompt in each chat.
- For the database step, also reference or attach your `nursingBackend.sql` file as needed.
- This approach ensures focused, complete, and organized outputs.

---

## Chat 1: Containerization (Dockerfiles)

```
Act as a senior DevOps engineer. Based on the attached migration plan, generate the necessary Dockerfiles for my project:

1. Create a multi-stage Dockerfile for the Angular frontend. The final stage should use a lightweight Nginx container to serve the static files.
2. Create a production-ready Dockerfile for the Node.js backend. It must run as a non-root user and include a HEALTHCHECK instruction.

Please provide each file in a separate, clearly labeled code block with its intended file path (e.g., frontend/Dockerfile, backend/Dockerfile). Add comments in the Dockerfiles for clarity.

---
[PASTE THE CONTENT of traditional_to_modern_devops.md HERE]
```

---

## Chat 2: Orchestration (Kubernetes Manifests & DB Initialization)

```
Act as a senior DevOps engineer. I have already containerized my frontend and backend applications. Now, generate the Kubernetes manifests needed to run the application stack:

1. Deployment and Service manifests for MySQL.
2. Deployment and Service manifests for the Node.js backend, including readiness and liveness probes.
3. Deployment and Service manifests for the Angular frontend.
4. A Kubernetes Ingress resource to manage external traffic. It should route requests for the root path (/) to the frontend service and requests for /api to the backend service.
5. A Kubernetes-native solution to initialize the MySQL database using the attached nursingBackend.sql dump after the MySQL pod is running. Please use a ConfigMap and an initContainer as described in best practices, and show all necessary YAML files and modifications.

Please generate each Kubernetes resource as a separate YAML document, clearly labeled with its intended file path (e.g., k8s/backend/deployment.yaml). Add comments in the YAML files for clarity.

---
[PASTE THE CONTENT of traditional_to_modern_devops.md HERE]
```

---

## Chat 3: Automation (Ansible & GitHub Actions)

```
Act as a senior DevOps engineer. My application is containerized and I have the Kubernetes manifests. Now, generate the automation scripts:

1. Create an Ansible playbook that provisions an Ubuntu server by installing Docker, kubeadm, kubelet, and kubectl, and then initializes a basic Kubernetes cluster with a CNI (like Flannel or Calico).
2. Create a GitHub Actions workflow file for a full CI/CD pipeline. It must include three sequential jobs: test (for both frontend and backend), build-and-push (builds Docker images and pushes to a container registry), and deploy (deploys the new images to the Kubernetes cluster using kubectl apply).

Please provide the Ansible playbook and the GitHub Actions workflow in two separate, clearly labeled code blocks with their intended file paths (e.g., ansible/playbook.yml, .github/workflows/deploy.yml). Add comments in the scripts for clarity.

---
[PASTE THE CONTENT of traditional_to_modern_devops.md HERE]
```

---

## Optional: Directory Structure (for Organization)

```
Based on the attached migration plan, suggest a recommended directory and file structure for all the configuration, script, and manifest files needed for this DevOps migration. Present it as a tree view, and briefly describe the purpose of each major file or folder.

---
[PASTE THE CONTENT of traditional_to_modern_devops.md HERE]
```

---

## Usage Tips
- If output is cut off, ask the AI to "continue from where you left off."
- Review all generated files for accuracy and security before use.
- For the SQL step, ensure your `nursingBackend.sql` is referenced or attached as needed.
- You can further split prompts if you hit output limits (e.g., separate DB and app manifests).


"I'm back. My Docker Hub username is emmamyers."


---

## Chat 4: CI/CD Pipeline Enhancement & AWS Migration Strategy

```
Act as a senior DevOps engineer. I have successfully deployed a full-stack application (Angular frontend + Node.js backend + MySQL) using Docker, Kubernetes, Ansible, and GitHub Actions CI/CD on a Linux server. The current architecture works but needs improvements for production readiness and team collaboration. I want to enhance the CI/CD pipeline with proper testing (unit, integration, security), implement multi-branch strategy with branch protection rules (main for production, develop for staging, feature branches for development), add environment separation (staging vs production), and eventually migrate to AWS using free tier components (EC2 t2.micro, RDS db.t3.micro, S3, ECR). The current setup is single-developer focused and lacks testing, proper branching strategy, and cloud deployment. Please help me design an improved CI/CD pipeline that supports team collaboration, multiple environments, comprehensive testing, and AWS migration strategy while maintaining the current Kubernetes-based deployment approach. Focus on practical improvements that can be implemented incrementally without breaking the existing working deployment.

Current Architecture:
- Docker containers for Angular frontend and Node.js backend
- Kubernetes orchestration with MySQL, backend, frontend deployments
- Ansible for Linux server provisioning
- GitHub Actions for CI/CD automation
- Production deployment on Linux server (103.91.186.102)

Required Improvements:
1. Testing Strategy (Unit, Integration, Security)
2. Multi-Branch Strategy with Branch Protection
3. Environment Separation (Staging vs Production)
4. AWS Migration using Free Tier
5. Team Collaboration Features

Please provide detailed implementation steps, YAML configurations, and migration strategies.
```

---

## Current Architecture Analysis

### ✅ **What's Working:**
```
Developer → Git → GitHub Actions → Docker Build → Kubernetes → Linux Server
```

### 🎯 **Current Strengths:**
- ✅ **Containerization**: Docker images for consistency
- ✅ **Orchestration**: Kubernetes for scaling and management
- ✅ **Infrastructure as Code**: Ansible for server provisioning
- ✅ **CI/CD Pipeline**: GitHub Actions for automation
- ✅ **Production Deployment**: Working on Linux server

## 🚀 **Recommended Improvements:**

### **1. Testing Strategy (Critical)**
```yaml
# Add to your cicd.yml
- name: Run Unit Tests
  run: |
    cd backend && npm test
    cd ../frontend && npm test

- name: Run Integration Tests
  run: |
    # Test API endpoints
    curl -f http://localhost:30008/health
    curl -f http://localhost:30008/api/health

- name: Security Scan
  run: |
    npm audit
    docker run --rm -v $(pwd):/app aquasec/trivy fs /app
```

### **2. Multi-Branch Strategy**
```yaml
# Branch Protection Rules
main:
  - Require pull request reviews
  - Require status checks to pass
  - Restrict pushes (only you)
  - Auto-deploy to production

develop:
  - Allow team pushes
  - Auto-deploy to staging
  - Merge to main via PR

feature/*:
  - Allow team pushes
  - No auto-deploy
  - Merge to develop via PR
```

### **3. Environment Strategy**
```yaml
# Multiple environments
staging:
  - Auto-deploy from develop branch
  - Test data
  - Smaller resources

production:
  - Manual approval required
  - Production data
  - Full resources
```

### **4. AWS Migration Strategy (Free Tier)**
```yaml
# AWS Free Tier Components
EC2:
  - t2.micro (1 year free)
  - Ubuntu 22.04 LTS
  - Install Docker + Kubernetes

RDS:
  - db.t3.micro (1 year free)
  - MySQL 8.0
  - 20GB storage

S3:
  - 5GB storage (always free)
  - Store static assets

ECR:
  - 500MB storage (always free)
  - Store Docker images
```

## 📋 **Implementation Phases:**

### **Phase 1: Testing (1-2 weeks)**
1. Add unit tests to backend/frontend
2. Add integration tests
3. Add security scanning
4. Update CI/CD to run tests

### **Phase 2: Branching Strategy (1 week)**
1. Create develop branch
2. Set up branch protection rules
3. Configure staging environment
4. Update deployment scripts

### **Phase 3: AWS Migration (2-3 weeks)**
1. Set up AWS account with free tier
2. Create EKS cluster (or use EC2 with K8s)
3. Set up RDS for MySQL
4. Configure S3 for static assets
5. Update deployment scripts

## 🎯 **Immediate Next Steps:**

### **Testing Implementation:**
```bash
# Backend tests
cd backend && npm install --save-dev jest supertest
# Frontend tests
cd frontend && npm install --save-dev @angular/cli karma
```

### **Branch Strategy Setup:**
```bash
# Create develop branch
git checkout -b develop
git push -u origin develop

# Set up branch protection in GitHub
# Settings → Branches → Add rule
```

### **AWS Migration Preparation:**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

---

## Usage Notes
- Implement improvements incrementally to avoid breaking existing deployment
- Test each phase thoroughly before moving to the next
- Document all changes for team onboarding
- Monitor costs carefully when using AWS free tier
- Consider using Terraform for AWS infrastructure as code

📋 Prompt for Gemini CLI:
Hi Gemini, I have successfully deployed a full-stack application (Angular frontend + Node.js backend + MySQL) using Docker, Kubernetes, Ansible, and GitHub Actions CI/CD on a Linux server. The current architecture works but needs improvements for production readiness and team collaboration. I want to enhance the CI/CD pipeline with proper testing (unit, integration, security), implement multi-branch strategy with branch protection rules (main for production, develop for staging, feature branches for development), add environment separation (staging vs production), and eventually migrate to AWS using free tier components (EC2 t2.micro, RDS db.t3.micro, S3, ECR). The current setup is single-developer focused and lacks testing, proper branching strategy, and cloud deployment. Please help me design an improved CI/CD pipeline that supports team collaboration, multiple environments, comprehensive testing, and AWS migration strategy while maintaining the current Kubernetes-based deployment approach. Focus on practical improvements that can be implemented incrementally without breaking the existing working deployment.
