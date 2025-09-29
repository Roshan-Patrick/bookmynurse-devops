# Kubernetes Secrets Management - Enterprise Security Guide

## Overview
This document explains the critical security differences between ConfigMaps and Secrets in Kubernetes, and how to implement enterprise-grade secret management for monitoring systems.

## The Security Problem

### **❌ What We Had Before (Security Risk):**
```yaml
# grafana-datasources.yaml (ConfigMap)
data:
  datasources.yml: |
    - name: Redis
      password: BookMyNurseRedis2024!  # ❌ PLAIN TEXT IN CONFIGMAP!
```

**Security Issues:**
```bash
# 1. Plain Text Storage
ConfigMaps store data in plain text - anyone can read it

# 2. Easy Access
kubectl get configmap grafana-datasources -o yaml
# Shows password in plain text!

# 3. Git Repository Exposure
ConfigMaps are committed to Git - passwords in version control

# 4. RBAC Bypass
Anyone with namespace access can read ConfigMaps
```

### **✅ What We Have Now (Enterprise Security):**
```yaml
# grafana-datasource-secret.yaml (Secret)
data:
  redis-password: UmVkaXNQYXNzMTIz  # ✅ BASE64 ENCODED IN SECRET!

# grafana-datasources.yaml (ConfigMap)
secureJsonData:
  password: ${REDIS_GF_PASSWORD}  # ✅ ENVIRONMENT VARIABLE REFERENCE!
```

**Security Benefits:**
```bash
# 1. Encrypted Storage
Secrets are encrypted at rest in etcd

# 2. RBAC Protection
Secrets require explicit permissions to read

# 3. No Git Exposure
Secrets are created dynamically, not committed

# 4. Environment Variable Injection
Passwords injected at runtime, not stored in config
```

## ConfigMap vs Secret - The Complete Comparison

### **📊 Security Comparison:**

| **Aspect** | **ConfigMap** | **Secret** |
|------------|---------------|------------|
| **Storage** | Plain text | Base64 encoded |
| **Encryption** | None | Encrypted at rest |
| **RBAC** | Basic namespace access | Explicit secret permissions |
| **Git Safety** | ❌ Committed to repo | ✅ Created dynamically |
| **Use Case** | Non-sensitive config | Sensitive data |

### **🔍 Real-World Examples:**

**ConfigMap (Safe for):**
```yaml
# Application configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_url: "mysql://mysql-service:3306"
  log_level: "info"
  feature_flags: "redis_cache=true"
```

**Secret (Required for):**
```yaml
# Sensitive credentials
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database_password: bXlzcWxwYXNzd29yZA==  # Base64 encoded
  api_key: YWJjZGVmZ2hpams=              # Base64 encoded
  jwt_secret: c2VjcmV0a2V5MTIz            # Base64 encoded
```

## How Our Enterprise Security Works

### **🔧 Step 1: Secret Creation**
```yaml
# grafana-datasource-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: grafana-datasource-secret
  namespace: bookmynurse
type: Opaque
data:
  redis-password: UmVkaXNQYXNzMTIz  # Base64 encoded: RedisPass123
```

**What Happens:**
```bash
# Kubernetes stores this secret:
1. Base64 decodes the password
2. Encrypts it in etcd
3. Only authorized users can access it
```

### **🔧 Step 2: Environment Variable Injection**
```yaml
# grafana-deployment.yaml
env:
- name: REDIS_GF_PASSWORD
  valueFrom:
    secretKeyRef:
      name: grafana-datasource-secret
      key: redis-password
```

**What Happens:**
```bash
# At pod startup:
1. Kubernetes reads the secret
2. Decodes the base64 password
3. Injects it as environment variable
4. Grafana container receives REDIS_GF_PASSWORD=RedisPass123
```

### **🔧 Step 3: Secure Configuration Reference**
```yaml
# grafana-datasources.yaml
secureJsonData:
  password: ${REDIS_GF_PASSWORD}
```

**What Happens:**
```bash
# Grafana processes this:
1. Reads REDIS_GF_PASSWORD environment variable
2. Uses it for Redis datasource authentication
3. Password never appears in ConfigMap
4. Password never logged or exposed
```

## Advanced Security Patterns

### **🔐 Pattern 1: External Secret Management**
```yaml
# For enterprise environments
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: grafana-secrets
spec:
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: grafana-datasource-secret
  data:
  - secretKey: redis-password
    remoteRef:
      key: grafana/redis
      property: password
```

### **🔐 Pattern 2: Secret Rotation**
```yaml
# Automated secret rotation
apiVersion: v1
kind: Secret
metadata:
  name: redis-secret
  annotations:
    secret-manager.io/rotation-schedule: "0 0 1 * *"  # Monthly rotation
data:
  redis-password: <rotated-password>
```

### **🔐 Pattern 3: Namespace Isolation**
```yaml
# Different secrets per environment
apiVersion: v1
kind: Secret
metadata:
  name: grafana-datasource-secret
  namespace: bookmynurse-prod  # Production namespace
data:
  redis-password: <prod-password>

---
apiVersion: v1
kind: Secret
metadata:
  name: grafana-datasource-secret
  namespace: bookmynurse-dev   # Development namespace
data:
  redis-password: <dev-password>
```

## Interview Questions & Answers

### **Q: "What's the difference between ConfigMaps and Secrets?"**

**A:**
> "ConfigMaps and Secrets serve different purposes in Kubernetes:
> 
> **ConfigMaps**:
> - Store non-sensitive configuration data
> - Plain text storage (no encryption)
> - Safe to commit to Git repositories
> - Examples: database URLs, log levels, feature flags
> 
> **Secrets**:
> - Store sensitive data (passwords, API keys, certificates)
> - Base64 encoded and encrypted at rest
> - Never committed to Git
> - Examples: database passwords, JWT secrets, SSL certificates
> 
> **Security Rule**: If it's sensitive, use Secrets. If it's configuration, use ConfigMaps."

### **Q: "How do you handle secret management in production?"**

**A:**
> "I implement a multi-layered secret management strategy:
> 
> **1. Kubernetes Secrets**: For application-level secrets
> ```yaml
> apiVersion: v1
> kind: Secret
> metadata:
>   name: app-secrets
> data:
>   db-password: <base64-encoded>
> ```
> 
> **2. External Secret Management**: For enterprise environments
> - HashiCorp Vault for centralized secret storage
> - AWS Secrets Manager for cloud-native secrets
> - Azure Key Vault for Microsoft environments
> 
> **3. Secret Rotation**: Automated password rotation
> - Monthly rotation for database passwords
> - Quarterly rotation for API keys
> - Annual rotation for certificates
> 
> **4. RBAC**: Strict access controls
> - Service accounts with minimal permissions
> - Namespace-level secret isolation
> - Audit logging for secret access
> 
> **5. CI/CD Integration**: Dynamic secret creation
> - Secrets created from GitHub Actions secrets
> - No hardcoded passwords in manifests
> - Environment-specific secret injection"

### **Q: "What are the security risks of storing passwords in ConfigMaps?"**

**A:**
> "Storing passwords in ConfigMaps creates several critical security risks:
> 
> **1. Plain Text Exposure**:
> ```bash
> kubectl get configmap app-config -o yaml
> # Shows password in plain text!
> ```
> 
> **2. Git Repository Exposure**:
> - ConfigMaps are committed to version control
> - Passwords visible in Git history
> - Anyone with repo access sees credentials
> 
> **3. RBAC Bypass**:
> - Basic namespace access can read ConfigMaps
> - No additional permissions required
> - Easy privilege escalation
> 
> **4. Audit Trail Issues**:
> - No logging of secret access
> - Difficult to track who accessed what
> - Compliance violations
> 
> **5. Production Incidents**:
> - Accidental password exposure in logs
> - Debugging tools reveal credentials
> - Monitoring systems capture sensitive data
> 
> **Enterprise Solution**: Always use Secrets with proper RBAC and external secret management."

### **Q: "How do you implement secure secret injection in Grafana?"**

**A:**
> "I implement secure secret injection using Grafana's `secureJsonData` feature:
> 
> **1. Create Kubernetes Secret**:
> ```yaml
> apiVersion: v1
> kind: Secret
> metadata:
>   name: grafana-datasource-secret
> data:
>   redis-password: <base64-encoded>
> ```
> 
> **2. Inject Environment Variable**:
> ```yaml
> env:
> - name: REDIS_GF_PASSWORD
>   valueFrom:
>     secretKeyRef:
>       name: grafana-datasource-secret
>       key: redis-password
> ```
> 
> **3. Use secureJsonData in Datasource**:
> ```yaml
> datasources:
> - name: Redis
>   type: redis-datasource
>   secureJsonData:
>     password: ${REDIS_GF_PASSWORD}
> ```
> 
> **Benefits**:
> - Password never appears in ConfigMap
> - Encrypted storage in etcd
> - RBAC protection
> - No Git exposure
> - Runtime injection only"

## Security Best Practices

### **🔐 Do's:**
```bash
✅ Use Secrets for all sensitive data
✅ Implement RBAC for secret access
✅ Use external secret management in production
✅ Rotate secrets regularly
✅ Use namespace isolation
✅ Audit secret access
✅ Use secureJsonData in Grafana
```

### **❌ Don'ts:**
```bash
❌ Never store passwords in ConfigMaps
❌ Never commit secrets to Git
❌ Never use plain text passwords
❌ Never share secret access broadly
❌ Never skip secret rotation
❌ Never ignore audit logs
```

## Deployment Commands

```bash
# Deploy the secure monitoring stack
kubectl apply -f k8s/monitoring/ -n bookmynurse

# Verify secrets are created
kubectl get secrets -n bookmynurse

# Verify secret content (base64 encoded)
kubectl get secret grafana-datasource-secret -n bookmynurse -o yaml

# Verify Grafana can access the secret
kubectl describe pod -l app=grafana -n bookmynurse
```

## Security Audit Checklist

- [ ] ✅ No passwords in ConfigMaps
- [ ] ✅ All secrets use Kubernetes Secrets
- [ ] ✅ Secrets are base64 encoded
- [ ] ✅ RBAC configured for secret access
- [ ] ✅ No secrets committed to Git
- [ ] ✅ Environment variables used for injection
- [ ] ✅ secureJsonData used in Grafana
- [ ] ✅ Secret rotation implemented
- [ ] ✅ Audit logging enabled
- [ ] ✅ Namespace isolation configured

---
*Generated: 2025-01-23*
*Purpose: Enterprise Kubernetes Secrets Management Documentation*
*Status: Enterprise-grade secret management implemented*
