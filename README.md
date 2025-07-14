# 🚀 BookMyNurse DevOps Migration

> **From Apache to Modern CI/CD Pipeline**

## Project Structure
```
bookmynurse-devops/
├── frontend/           # React/Vue frontend application
├── backend/            # Node.js backend application
├── k8s/               # Kubernetes manifests
├── ansible/           # Server provisioning
├── .github/workflows/ # CI/CD pipelines
├── scripts/           # Utility scripts
├── docs/             # Documentation
└── local-dev/        # Local development environment
```

## Quick Start (WSL Development)
```bash
# 1. Setup local development environment
./scripts/setup-local-dev.sh

# 2. Start local services
docker-compose -f local-dev/docker-compose.yml up -d

# 3. Run tests
npm test

# 4. Deploy to production (when ready)
./scripts/deploy-production.sh
```

## Architecture
- **Frontend**: React/Vue.js with Nginx
- **Backend**: Node.js with Express
- **Database**: MySQL 8.0
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
