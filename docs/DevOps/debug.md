# BookMyNurse DevOps: From Network Latency to Liveness Probes

This document tracks the complete debugging journey of deploying the BookMyNurse application to a local Kind Kubernetes cluster.

---
ssh -p 2244 root@103.91.186.102
## PHASE 1: Infrastructure & Network (SOLVED)

- **Initial Problem:** Ingress-Nginx controller was stuck in `ContainerCreating` due to severe network latency in the WSL/Docker environment, causing image pull timeouts.
- **Solution:** The `local_k8s_setup.sh` script was modified to pre-pull all required container images onto the host and use the `--image` flag during `kind create cluster`. This removed the network dependency from the critical setup path.

---

## PHASE 2: Kubernetes Configuration (SOLVED)

- **Initial Problem:** Backend pods were stuck in `CreateContainerConfigError` because the deployment manifest was trying to source a `DB_USER` from a secret key (`user`) that didn't exist.
- **Solution:** The `build_deploy_local.sh` script, which dynamically generates the manifests, was corrected.
    1.  The backend deployment was fixed to use a `ConfigMap` for all non-sensitive environment variables (`DB_HOST`, `DB_USER`, etc.).
    2.  The backend now only sources the `DB_PASSWORD` from the `mysql-secret`.
    3.  The script was enhanced to automatically create the required `ConfigMap` and `Secret` on every run, ensuring consistency.

---

## PHASE 3: Database Persistence & Authentication (SOLVED)

- **Initial Problem:** Even with correct secrets, the backend received an `Access denied for user 'app_user'` error. We discovered the MySQL root password was also incorrect.
- **Root Cause:** The MySQL container only uses secrets to initialize a **new, empty volume**. The `PersistentVolume` was using a `hostPath` (`/tmp/mysql-data`) with a `Retain` policy, so old, corrupted database files with incorrect passwords were being re-used on every deployment.
- **Solution:** A full reset was performed.
    1.  All Kubernetes resources in the namespace were deleted (`pvc`, `pv`, `deployments`, etc.).
    2.  We shelled into the Kind container (`docker exec -it <kind-node> bash`).
    3.  The stale data directory was manually deleted: `rm -rf /tmp/mysql-data`.
- **Outcome:** This forced a true clean slate. On the next run of `build_deploy_local.sh`, the MySQL database initialized correctly with the proper credentials from the secret.

---

## PHASE 4: Application Health Probes (CURRENT ISSUE)

After resolving all infrastructure, configuration, and database issues, the backend pod now successfully connects to the database but enters a restart loop.

### Current Status (2025-07-10)

- **MySQL & Frontend:** Healthy and `Running`.
- **Backend Pod:** Connects to the database, then gets killed and restarted by Kubernetes.
- **Backend Logs:**
  ```
  Server running on port 3000
  Successfully connected to database.
  ```
- **Pod Events:**
  ```
  Warning  Unhealthy  ...  kubelet  Readiness probe failed: HTTP probe failed with statuscode: 404
  Warning  Unhealthy  ...  kubelet  Liveness probe failed: HTTP probe failed with statuscode: 404
  Normal   Killing    ...  kubelet  Container backend failed liveness probe, will be restarted
  ```

### Analysis of the Current Issue

The `CrashLoopBackOff` is no longer caused by the application crashing on its own. It's being caused by **Kubernetes**.

The backend deployment is configured with liveness and readiness probes that check the `/health` endpoint. Kubernetes is sending a request to `http://<pod-ip>:3000/health`, receiving a `404 Not Found` error, and concluding that the application is unhealthy. It then kills the pod as designed.

The database connection is working perfectly. The issue is now entirely focused on the application's HTTP routes.

### Next Steps

We need to verify that the `/health` endpoint is correctly implemented in the backend's `app.js` and is accessible.

---

## Appendix: Understanding PersistentVolume (PV) and PersistentVolumeClaim (PVC) in Kubernetes

### What is a PersistentVolume (PV)?
- A **PersistentVolume (PV)** is a cluster-wide storage resource provisioned by an admin or dynamically by Kubernetes.
- It represents actual storage (disk, NFS, cloud volume, etc.) and is independent of any specific pod or namespace.
- PVs have properties like capacity, access modes, and a reclaim policy (e.g., Retain, Delete).

### What is a PersistentVolumeClaim (PVC)?
- A **PersistentVolumeClaim (PVC)** is a request for storage by a user or pod.
- It is namespaced and acts as a ticket asking for a certain amount and type of storage.
- When a PVC is created, Kubernetes binds it to a suitable PV.

### Why are PV and PVC important?
- They allow stateful applications (like MySQL) to persist data across pod restarts, upgrades, and failures.
- Without PV/PVC, all data would be lost when a pod is deleted or recreated.

### Common Issues (and How We Fixed Them)
- **PV stuck in Released/Terminating:**
  - When a PVC is deleted, the PV may enter a `Released` state but not be deleted, especially with `Retain` policy.
  - If the PV has a lingering `claimRef` or `finalizer`, it cannot be reused or deleted, blocking new PVCs.
  - **Fix:** Patch the PV to remove finalizers, then delete and recreate it.
- **Stale Data and Password Sync:**
  - If the PV is backed by a `hostPath` (like `/tmp/mysql-data`), old data can persist across deployments.
  - MySQL only uses the Kubernetes secret to set passwords on first initialization. If old data exists, the secret is ignored.
  - **Fix:** Manually delete the data directory on the host (or Kind node) to force a clean MySQL initialization.

### Best Practices
- Always clean up old PVs and data directories when resetting your environment.
- Automate PV/PVC cleanup in deployment scripts, including patching and deleting stuck PVs.
- Monitor PV/PVC status with `kubectl get pv` and `kubectl get pvc -n <namespace>`.
- Understand reclaim policies: `Retain` (manual cleanup), `Delete` (auto cleanup with dynamic provisioners).

---

## Current Terminal State (2025-07-10)

- You have performed all the correct PV/PVC and data cleanup steps:
  - Patched and deleted the PV.
  - Deleted `/tmp/mysql-data`.
  - Recreated the PV and PVC.
- The deployment script (`build_deploy_local.sh`) is still getting stuck, even after all manual fixes.
- Backend pods are still not becoming ready, and health probes are failing with 404 errors.

### Next Troubleshooting Steps
1. **Double-check that your backend image is rebuilt and redeployed after code changes.**
2. **Manually test the /health endpoint inside the backend pod:**
   - `kubectl exec -it <backend-pod> -n bookmynurse -- curl http://localhost:3000/health`
   - Confirm the endpoint returns a 200 response.
3. **If the script hangs on sudo commands, run them manually and rerun the script.**
4. **If PV/PVC issues persist, consider using a different storage class or dynamic provisioner for local testing.**

---

*This appendix and summary should help anyone (including Gemini AI) quickly understand the PV/PVC concepts, the issues you faced, and the current state of your deployment.*

---

## PHASE 6: YAML Concatenation Issue - Individual Files Valid but Concatenation Fails (CURRENT)

### Problem Summary (2025-07-31)
- **Individual YAML Validation**: All YAML files pass validation when tested individually using `kubectl apply --dry-run=client`
- **Concatenation Failure**: When attempting to apply all files together using `find ... | xargs -0 cat | kubectl apply -f -`, the command fails with:
  ```
  error: error parsing STDIN: error converting YAML to JSON: yaml: line 61: did not find expected key
  ```
- **Root Cause**: The concatenation process creates a YAML parsing conflict, likely due to missing YAML document separators (`---`) between files or other formatting issues when multiple YAML documents are combined into a single stream.

### Current Status
- **StorageClass Missing**: `kubectl get sc` shows "No resources found"
- **PersistentVolume Missing**: `kubectl get pv` shows "No resources found"  
- **PVC Pending**: `mysql-pv-claim` is stuck in `Pending` status
- **MySQL Pod Pending**: Can't start due to PVC binding failure
- **Backend Pod Init:0/1**: Waiting for MySQL service
- **Frontend Pod Running**: 1/1 ready (but can't communicate with backend)

### Attempted Solutions
1. **Individual File Validation**: ✅ All files are syntactically correct
2. **Concatenation with cat**: ❌ Fails with line 61 parsing error
3. **Directory-based apply**: ❌ `kubectl apply -f bookmynurse-devops/k8s/` not supported
4. **xargs with multiple files**: ❌ Argument limit exceeded

### Next Steps for Gemini AI
**Recommended Solution**: Apply files individually in the correct dependency order:

```bash
# Step 1: Apply namespace first
kubectl apply -f bookmynurse-devops/k8s/namespace/namespace.yaml

# Step 2: Apply storage infrastructure  
kubectl apply -f bookmynurse-devops/k8s/storage/storage-class.yaml
kubectl apply -f bookmynurse-devops/k8s/storage/mysql-pv.yaml

# Step 3: Apply MySQL components
kubectl apply -f bookmynurse-devops/k8s/mysql/secret.yaml
kubectl apply -f bookmynurse-devops/k8s/mysql/configmap.yaml
kubectl apply -f bookmynurse-devops/k8s/mysql/pvc.yaml
kubectl apply -f bookmynurse-devops/k8s/mysql/deployment.yaml
kubectl apply -f bookmynurse-devops/k8s/mysql/service.yaml

# Step 4: Apply backend components
kubectl apply -f bookmynurse-devops/k8s/backend/secret.yaml
kubectl apply -f bookmynurse-devops/k8s/backend/deployment.yaml
kubectl apply -f bookmynurse-devops/k8s/backend/service.yaml

# Step 5: Apply frontend components
kubectl apply -f bookmynurse-devops/k8s/frontend/nginx-configmap.yaml
kubectl apply -f bookmynurse-devops/k8s/frontend/deployment.yaml
kubectl apply -f bookmynurse-devops/k8s/frontend/service.yaml

# Step 6: Apply ingress and network components
kubectl apply -f bookmynurse-devops/k8s/ingress/ingress.yaml
kubectl apply -f bookmynurse-devops/k8s/network/nginx-ingress-service.yaml
kubectl apply -f bookmynurse-devops/k8s/network/network-policy.yaml
```

### Questions for Gemini AI
1. **Why does concatenation fail when individual files are valid?**
2. **Is there a way to fix the YAML document separator issue in the concatenation?**
3. **Should we modify the CI/CD pipeline to apply files individually instead of using concatenation?**
4. **Are there alternative approaches to apply multiple YAML files recursively?**

### Expected Outcome
Once the storage infrastructure is properly applied, the PVC should bind to the PV, allowing the MySQL pod to start, which will then allow the backend pod to complete its init container and become ready, finally enabling the frontend to communicate with the backend.

---

*This phase documents the transition from infrastructure issues to deployment methodology issues, where the problem is not with the Kubernetes manifests themselves but with how they are being applied to the cluster.*

---

## PHASE 5: WSL Filesystem Lock & Persistent Health Probe Failure (CURRENT)

### Problem Summary
- After all PV/PVC and MySQL data cleanup, the deployment script (`build_deploy_local.sh`) repeatedly hangs after deleting the PVC, specifically on the `sudo rm -rf /tmp/mysql-data` step.
- Manual attempts to delete `/tmp/mysql-data` also hang, even after running `wsl --shutdown` from Windows and restarting the WSL environment.
- Diagnostic steps (from Gemini AI):
  1. Test `sudo` with a harmless command (`sudo ls`) — works fine.
  2. Try to delete `/tmp/mysql-data` — hangs, indicating a possible filesystem lock or corruption.
  3. Attempted to move the directory (`sudo mv /tmp/mysql-data /tmp/mysql-data-BROKEN`) — also hangs or fails.
  4. No processes appear to be holding the directory (checked with `lsof`).
- Even after all these steps, the backend pod continues to fail readiness/liveness probes with HTTP 404 on `/health`, despite the code being correct and the image rebuilt.

### Current State (2025-07-10)
- WSL filesystem may be in a corrupted or locked state, preventing proper cleanup and redeployment.
- All standard Kubernetes, Docker, and WSL troubleshooting steps have been exhausted.
- Backend pod is running, connects to the database, but health probes still fail, blocking the deployment.

### Next Steps for Gemini AI
- Diagnose deeper WSL filesystem issues or recommend a more forceful reset (e.g., full WSL instance reset, new hostPath, or even a new Kind cluster).
- Suggest alternative approaches for persistent storage in local Kubernetes on WSL2.

---

## PHASE 7: PVC Binding Issue - WaitForFirstConsumer Deadlock (CURRENT)

### Problem Summary (2025-07-31)
- **Storage Infrastructure Created**: StorageClass `local-storage` and PersistentVolume `mysql-pv` are successfully created
- **PVC Still Pending**: `mysql-pv-claim` remains in `Pending` status despite available PV
- **Old Pods Persist**: All pods show old age (86m) indicating they're old pods that can't start
- **Deadlock Situation**: PVC uses `WaitForFirstConsumer` mode but old pods can't start due to PVC issues

### Terminal Output Analysis

```bash
root@server:~# kubectl get sc
NAME            PROVISIONER                    RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
local-storage   kubernetes.io/no-provisioner   Delete          WaitForFirstConsumer   false                  28m

root@server:~# kubectl get pv
NAME       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS    VOLUMEATTRIBUTESCLASS   REASON   AGE
mysql-pv   10Gi       RWO            Retain           Available           local-storage   <unset>                          28m

root@server:~# kubectl get pvc -n bookmynurse
NAME             STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS    VOLUMEATTRIBUTESCLASS   AGE
mysql-pv-claim   Pending                                      local-storage   <unset>                 3m42s

root@server:~# kubectl get pods -n bookmynurse
NAME                                       READY   STATUS     RESTARTS   AGE
backend-deployment-77655998-zxhqq          0/1     Init:0/1   0          86m
frontend-deployment-77449684c7-5rt7f       1/1     Running    0          86m
health-check-deployment-79fdc9545d-xxsd4   1/1     Running    0          18m
mysql-deployment-667b9dbd75-hbzhl          0/1     Pending    0          86m
```

### Root Cause Analysis

**The Issue is a Circular Dependency:**

1. **StorageClass Configuration**: Uses `WaitForFirstConsumer` volume binding mode
2. **PVC Behavior**: PVC stays `Pending` until a pod actually tries to use it
3. **Old Pods**: The existing pods (86m age) are old pods that were created before storage was properly configured
4. **Pod Scheduling**: Old pods can't be scheduled because they reference the old PVC configuration
5. **Deadlock**: 
   - PVC needs a pod to bind to it (`WaitForFirstConsumer`)
   - Pods need PVC to be bound to start
   - Old pods can't start due to old configuration
   - New pods aren't being created because deployments are "unchanged"

### Debugging Steps Attempted

1. **✅ Individual File Application**: Successfully applied all YAML files individually
2. **✅ Storage Infrastructure**: StorageClass and PV created successfully
3. **❌ PVC Recreation**: Deleting and recreating PVC didn't help
4. **❌ Pod Age**: Pods still show 86m age, indicating they're old pods

### Questions for Gemini AI

1. **Why are the old pods (86m age) still persisting despite applying new configurations?**
2. **Should we force delete the old pods to trigger new pod creation?**
3. **Is the `WaitForFirstConsumer` mode causing the deadlock?**
4. **Should we temporarily change the StorageClass to `Immediate` binding mode?**
5. **Do we need to restart the deployments to create new pods with the correct configuration?**

### Proposed Solutions for Gemini

**Option 1: Force Pod Recreation**
```bash
# Delete old pods to force new ones
kubectl delete pod mysql-deployment-667b9dbd75-hbzhl -n bookmynurse
kubectl delete pod backend-deployment-77655998-zxhqq -n bookmynurse
```

**Option 2: Restart Deployments**
```bash
# Restart deployments to create new pods
kubectl rollout restart deployment mysql-deployment -n bookmynurse
kubectl rollout restart deployment backend-deployment -n bookmynurse
```

**Option 3: Change StorageClass Binding Mode**
```bash
# Temporarily change to Immediate binding
kubectl patch storageclass local-storage -p '{"volumeBindingMode":"Immediate"}'
```

### Expected Outcome
Once new pods are created with the correct PVC configuration, the PVC should bind to the available PV, allowing MySQL to start, which will then allow the backend to complete its init container and become ready.

---

*This phase documents the transition from YAML application issues to Kubernetes pod lifecycle and PVC binding issues, where the problem is not with the manifests but with the runtime state of the cluster.*

---

## PHASE 8: Rollout Restart - Back to Square One (CURRENT)

### Problem Summary (2025-07-31)
- **Rollout Restart Attempted**: Successfully restarted MySQL and Backend deployments
- **New Pods Created**: New pods are being created (32s and 46s age)
- **Same PVC Issue**: PVC still `Pending` despite new pods trying to use it
- **Multiple Pods**: Now have both old pods (91m age) and new pods (32s, 46s age)

### Terminal Output After Rollout Restart

```bash
root@server:~# kubectl rollout restart deployment mysql-deployment -n bookmynurse
deployment.apps/mysql-deployment restarted

root@server:~# kubectl rollout restart deployment backend-deployment -n bookmynurse
deployment.apps/backend-deployment restarted

root@server:~# kubectl get pods -n bookmynurse
NAME                                       READY   STATUS     RESTARTS   AGE
backend-deployment-77655998-zxhqq          0/1     Init:0/1   0          91m
backend-deployment-855cb4444c-kcwv7        0/1     Init:0/1   0          32s
frontend-deployment-77449684c7-5rt7f       1/1     Running    0          91m
health-check-deployment-79fdc9545d-xxsd4   1/1     Running    0          23m
mysql-deployment-667b9dbd75-hbzhl          0/1     Pending    0          91m
mysql-deployment-6bbc6d64f5-7zpst          0/1     Pending    0          46s

root@server:~# kubectl get pvc -n bookmynurse
NAME             STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS    VOLUMEATTRIBUTESCLASS   AGE
mysql-pv-claim   Pending                                      local-storage   <unset>                 9m43s
```

### Analysis of Current Situation

**What Happened:**
1. **✅ Rollout Restart Successful**: New pods were created
2. **❌ PVC Still Pending**: Even new pods can't bind to the PVC
3. **❌ Multiple Pods**: Now have both old and new pods in various states
4. **❌ Same Core Issue**: PVC binding problem persists

**Pod Status Breakdown:**
- **Old Backend Pod**: `backend-deployment-77655998-zxhqq` (91m age) - Init:0/1
- **New Backend Pod**: `backend-deployment-855cb4444c-kcwv7` (32s age) - Init:0/1  
- **Old MySQL Pod**: `mysql-deployment-667b9dbd75-hbzhl` (91m age) - Pending
- **New MySQL Pod**: `mysql-deployment-6bbc6d64f5-7zpst` (46s age) - Pending

### Root Cause Analysis

**The Issue is NOT with old pods - it's with the PVC configuration itself:**

1. **WaitForFirstConsumer Mode**: PVC requires a pod to actually try to mount it
2. **Pod Scheduling**: New pods are being created but can't be scheduled due to PVC issues
3. **PVC Specification**: There might be a mismatch between PVC and PV specifications
4. **Node Affinity**: The PV's nodeAffinity might not match the current node

### Questions for Gemini AI

1. **Why are new pods still Pending even after rollout restart?**
2. **Should we check the PVC and PV specifications for mismatches?**
3. **Is there a nodeAffinity issue with the PV?**
4. **Should we temporarily change to Immediate binding mode?**
5. **Do we need to clean up old pods manually?**

### Next Steps for Gemini

**Option 1: Check PVC/PV Specifications**
```bash
# Check detailed PVC and PV specifications
kubectl describe pvc mysql-pv-claim -n bookmynurse
kubectl describe pv mysql-pv
```

**Option 2: Change StorageClass Binding Mode**
```bash
# Temporarily change to Immediate binding
kubectl patch storageclass local-storage -p '{"volumeBindingMode":"Immediate"}'
```

**Option 3: Clean Up Old Pods**
```bash
# Force delete old pods
kubectl delete pod backend-deployment-77655998-zxhqq -n bookmynurse
kubectl delete pod mysql-deployment-667b9dbd75-hbzhl -n bookmynurse
```

**Option 4: Check Node Affinity**
```bash
# Verify the PV's nodeAffinity matches current node
kubectl get nodes
kubectl describe pv mysql-pv
```

### Expected Outcome
Once the PVC binding issue is resolved, the new pods should be able to start, allowing the application to function properly.

---

*This phase documents that the rollout restart approach created new pods but didn't resolve the underlying PVC binding issue, indicating the problem is deeper than just old pods.*

---

## PHASE 9: MySQL Connection Issue - Init Container Can't Connect to MySQL (CURRENT)

### Problem Summary (2025-07-31)
- **✅ PVC Binding Resolved**: Successfully fixed node affinity issue, PVC is now bound
- **✅ Pods Scheduled**: MySQL and Backend pods are now scheduled and running
- **❌ MySQL Init Container Issue**: MySQL init container can't connect to MySQL on `127.0.0.1:3306`
- **❌ Backend Init Container Issue**: Backend init container can't connect to `mysql-service:3306`

### Terminal Output Analysis

**Backend Init Container Logs:**
```bash
MySQL is not ready yet. Sleeping for 5 seconds...
MySQL is not ready yet. Sleeping for 5 seconds...
MySQL is not ready yet. Sleeping for 5 seconds...
# (Repeating continuously for 38+ minutes)
```

**MySQL Init Container Error:**
```bash
ERROR 2003 (HY000): Can't connect to MySQL server on '127.0.0.1:3306' (111)
```

**Current Pod Status:**
```bash
NAME                                       READY   STATUS     RESTARTS   AGE
backend-deployment-77655998-zxhqq          0/1     Init:0/1   0          129m
backend-deployment-855cb4444c-kcwv7        0/1     Init:0/1   0          38m
frontend-deployment-77449684c7-5rt7f       1/1     Running    0          129m
health-check-deployment-79fdc9545d-xxsd4   1/1     Running    0          61m
mysql-deployment-667b9dbd75-hbzhl          0/1     Pending    0          129m
mysql-deployment-6bbc6d64f5-7zpst          0/1     Init:0/1   0          38m
```

### Root Cause Analysis

**The Issue is a Circular Dependency in Init Containers:**

1. **MySQL Init Container**: Trying to connect to MySQL on `127.0.0.1:3306` before MySQL is running
2. **MySQL Main Container**: Can't start because init container hasn't completed
3. **Backend Init Container**: Trying to connect to `mysql-service:3306` but MySQL service has no endpoints
4. **Circular Dependency**: 
   - MySQL init container waits for MySQL to be ready
   - MySQL main container waits for init container to complete
   - Backend init container waits for MySQL service
   - No component can start

### Questions for Gemini AI

1. **Why is the MySQL init container trying to connect to MySQL before MySQL is running?**
2. **Should the MySQL init container logic be changed to not wait for MySQL?**
3. **Is the init container approach causing this circular dependency?**
4. **Should we remove the init containers and use a different approach?**
5. **How should we handle the SQL dump initialization without init containers?**

### Proposed Solutions for Gemini

**Option 1: Remove MySQL Init Container**
- Remove the init container that waits for MySQL
- Let MySQL start normally and load SQL dump via `/docker-entrypoint-initdb.d/`
- Update backend init container to wait for MySQL service properly

**Option 2: Fix Init Container Logic**
- Change MySQL init container to not wait for MySQL
- Let it just copy SQL files and exit
- Use MySQL's built-in initialization mechanism

**Option 3: Use Job for Database Initialization**
- Create a separate Job to initialize the database
- Remove init containers from deployments
- Use proper dependency management

### Expected Outcome
Once the init container circular dependency is resolved, MySQL should start properly, the service should have endpoints, and the backend should be able to connect and start.

---

*This phase documents the transition from storage issues to application initialization issues, where the problem is with the init container logic creating circular dependencies.*

---

## PHASE 10: MySQL Readiness Probe Issue - Access Denied for Root User (CURRENT)

### Problem Summary (2025-08-01)
- **✅ PVC Binding Resolved**: Successfully fixed node affinity issue, PVC is now bound
- **✅ Init Container Circular Dependency Resolved**: Removed MySQL init container, MySQL pod is now running
- **✅ MySQL Container Running**: MySQL is starting up and ready for connections
- **❌ MySQL Readiness Probe Failing**: Readiness probe failing with "Access denied for user 'root'@'localhost' (using password: NO)"
- **❌ MySQL Service No Endpoints**: Service has no endpoints due to readiness probe failure

### Terminal Output Analysis

**Pod Status:**
```bash
NAME                                   READY   STATUS     RESTARTS   AGE
backend-deployment-977bbd554-kmjrh     0/1     Init:0/1   0          67m
frontend-deployment-7c697b587c-hjh67   1/1     Running    0          67m
mysql-deployment-5746864565-fps24      0/1     Running    0          60m
```

**MySQL Pod Details:**
```bash
Status:           Running
IP:               10.244.0.112
State:          Running
      Started:      Fri, 01 Aug 2025 10:42:30 +0530
Ready:          False
```

**MySQL Readiness Probe Configuration:**
```bash
Readiness:  exec [mysql -h localhost -u root -p$(MYSQL_ROOT_PASSWORD) -e SELECT 1] delay=15s timeout=3s period=5s #success=1 #failure=3
```

**Readiness Probe Error:**
```bash
Warning  Unhealthy  11s (x62 over 4m59s)  kubelet  Readiness probe failed: Enter password: ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: NO)
```

**MySQL Container Logs (SUCCESS):**
```bash
2025-08-01T05:12:34.372463Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. Version: '8.0.43'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server - GPL.
```

**MySQL Service Endpoints:**
```bash
NAME            ENDPOINTS   AGE
mysql-service               69m
```

### Root Cause Analysis

**The Issue is Readiness Probe Password Handling:**

1. **MySQL is Running Successfully**: The container logs show MySQL is ready for connections
2. **Readiness Probe Configuration**: Uses `$(MYSQL_ROOT_PASSWORD)` environment variable
3. **Password Expansion Issue**: The `$(MYSQL_ROOT_PASSWORD)` is not expanding properly in the readiness probe
4. **Access Denied**: Probe is trying to connect without password (`using password: NO`)
5. **Service Endpoints**: MySQL service has no endpoints because pod is not ready

### Questions for Gemini AI

1. **Why is the `$(MYSQL_ROOT_PASSWORD)` environment variable not expanding in the readiness probe?**
2. **Should we use a different approach for the readiness probe password?**
3. **Is there a way to test the readiness probe manually to verify the password issue?**
4. **Should we temporarily disable the readiness probe to get the service working?**
5. **How should we handle the password in the readiness probe command?**

### Proposed Solutions for Gemini

**Option 1: Fix Readiness Probe Password**
- Use a different syntax for the password in the readiness probe
- Test with a literal password temporarily
- Use a different readiness probe approach

**Option 2: Temporarily Disable Readiness Probe**
- Remove the readiness probe temporarily
- Let the pod become ready so service gets endpoints
- Fix the probe later

**Option 3: Use Different Readiness Probe**
- Use `mysqladmin ping` instead of `mysql` command
- Use a different authentication method
- Create a custom readiness script

### Expected Outcome
Once the readiness probe issue is resolved, the MySQL pod should become ready (1/1), the MySQL service should have endpoints, and the backend init container should be able to connect to MySQL service.

---

*This phase documents the transition from init container issues to readiness probe issues, where MySQL is running but the readiness probe is preventing the pod from becoming ready.*

---

## PHASE 11: MySQL Readiness Probe Fix Applied - Duplicate Pod Issue (CURRENT)

### Problem Summary (2025-08-01)
- **✅ Fix Applied**: Gemini's readiness probe fix (wrapping command in `sh -c`) has been successfully applied to the server
- **✅ File Updated**: `bookmynurse-devops/k8s/mysql/deployment.yaml` now has the correct readiness probe configuration
- **❌ Duplicate Pods**: After applying the fix, a new MySQL pod was created but the old pod wasn't terminated
- **❌ Both Pods Not Ready**: Both old and new MySQL pods are still `0/1` ready

### Current Status After Applying Gemini's Fix:

**Pod Status:**
```bash
NAME                                   READY   STATUS     RESTARTS   AGE
backend-deployment-977bbd554-kmjrh     0/1     Init:0/1   0          105m
frontend-deployment-7c697b587c-hjh67   1/1     Running    0          105m
mysql-deployment-5746864565-fps24      0/1     Running    0          99m    # OLD POD
mysql-deployment-6c59b6dc4-hwnfp       0/1     Running    0          27s    # NEW POD
```

**Applied Fix:**
```yaml
readinessProbe:
  exec:
    command:
    - sh
    - -c
    - mysql -h localhost -u root -p$(MYSQL_ROOT_PASSWORD) -e "SELECT 1"
  initialDelaySeconds: 15
  periodSeconds: 5
  timeoutSeconds: 3
```

### Root Cause Analysis:

**The Issue is Duplicate Pods:**
1. **Old Pod**: `mysql-deployment-5746864565-fps24` (99m age) - still running with old configuration
2. **New Pod**: `mysql-deployment-6c59b6dc4-hwnfp` (27s age) - newly created with Gemini's fix
3. **PVC Conflict**: Both pods are trying to use the same PVC, causing conflicts
4. **Service Confusion**: MySQL service doesn't know which pod to route traffic to

### Message for Gemini AI:

**File:** `Debug/debug.md` - **Hi Gemini, your readiness probe fix has been successfully applied to the server. The `bookmynurse-devops/k8s/mysql/deployment.yaml` file now has the correct configuration with `sh -c` wrapper for environment variable expansion. However, we now have a duplicate pod issue where both the old pod (`mysql-deployment-5746864565-fps24` at 99m age) and new pod (`mysql-deployment-6c59b6dc4-hwnfp` at 27s age) are running simultaneously, and both are still `0/1` ready. The old pod is still running with the old configuration while the new pod has your fix, but neither pod is becoming ready. We suspect there might be a PVC conflict since both pods are trying to use the same persistent volume claim. Should we delete the old pod to let the new pod with your readiness probe fix take over, or should we restart the entire deployment for a clean replacement? We need your guidance on the best approach to resolve this duplicate pod issue and get your readiness probe fix working properly.**

### Expected Outcome:
Once the duplicate pod issue is resolved, the new pod with Gemini's readiness probe fix should become ready (1/1), allowing the MySQL service to have endpoints and the backend to connect successfully.

---

*This phase documents the successful application of Gemini's readiness probe fix and the subsequent duplicate pod issue that needs resolution.*

## PHASE 12: Endless Loop - Readiness Probe Fix Not Working (CURRENT)

### Problem Summary (2025-08-01)
- **✅ Gemini's Fix Applied**: Readiness probe wrapped in `sh -c` for environment variable expansion
- **✅ Deployment Restarted**: Multiple rollout restarts performed
- **❌ Still Not Working**: MySQL pods still `0/1` ready after multiple attempts
- **❌ Endless Loop**: Same issue persists despite all fixes

### Current Terminal Output After Multiple Attempts:

**Latest Pod Status:**
```bash
NAME                                   READY   STATUS             RESTARTS      AGE
backend-deployment-977bbd554-kmjrh     0/1     Init:0/1           0             119m
frontend-deployment-7c697b587c-hjh67   1/1     Running            0             119m
mysql-deployment-6bb58c56c9-wdjzc      0/1     Running            0             2m39s
mysql-deployment-6c59b6dc4-hwnfp       0/1     CrashLoopBackOff   7 (36s ago)   14m
```

**MySQL Service Endpoints:**
```bash
NAME            ENDPOINTS   AGE
mysql-service               119m
```

**Applied Readiness Probe Configuration:**
```yaml
readinessProbe:
  exec:
    command:
    - sh
    - -c
    - mysql -h localhost -u root -p$(MYSQL_ROOT_PASSWORD) -e "SELECT 1"
  initialDelaySeconds: 15
  periodSeconds: 5
  timeoutSeconds: 3
```

**Actions Taken:**
1. ✅ Applied Gemini's readiness probe fix (sh -c wrapper)
2. ✅ Deleted old pod manually
3. ✅ Restarted deployment multiple times
4. ✅ New pods created but still `0/1` ready
5. ✅ Old pods still persisting in CrashLoopBackOff

### Root Cause Analysis:

**The Issue is Persistent:**
1. **Readiness Probe Still Failing**: Despite `sh -c` wrapper, probe still not working
2. **Environment Variable Issue**: `$(MYSQL_ROOT_PASSWORD)` still not expanding properly
3. **Pod Lifecycle**: New pods created but can't become ready
4. **Service Impact**: MySQL service has no endpoints, blocking backend

### Questions for LLM (Gemini or Alternative):

1. **Why is the `sh -c` wrapper not fixing the environment variable expansion?**
2. **Should we try a different approach for the readiness probe?**
3. **Is there a fundamental issue with the MySQL secret or environment variable setup?**
4. **Should we temporarily disable the readiness probe to get the service working?**
5. **Are we missing something in the MySQL configuration that's preventing authentication?**

### Proposed Alternative Solutions:

**Option 1: Use Literal Password in Probe**
```yaml
readinessProbe:
  exec:
    command:
    - sh
    - -c
    - mysql -h localhost -u root -prootpassword -e "SELECT 1"
```

**Option 2: Use mysqladmin Instead**
```yaml
readinessProbe:
  exec:
    command:
    - mysqladmin
    - ping
    - -h
    - localhost
    - -u
    - root
    - -prootpassword
```

**Option 3: Temporarily Disable Readiness Probe**
```yaml
# Remove readinessProbe section temporarily
```

**Option 4: Use Different Authentication Method**
```yaml
readinessProbe:
  exec:
    command:
    - sh
    - -c
    - mysql -h localhost -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1"
```

### Current State:
- **Backend**: Stuck in Init:0/1 (waiting for MySQL service)
- **Frontend**: Running but can't communicate with backend
- **MySQL**: Running but not ready, service has no endpoints
- **Application**: Completely blocked due to MySQL readiness issue

### Request for LLM Help:
**We need a fresh perspective on this readiness probe issue. All standard fixes have been attempted but the problem persists. Please provide alternative approaches or identify what we might be missing in the MySQL configuration.**

---

*This phase documents the endless loop situation where standard fixes are not resolving the MySQL readiness probe issue, requiring alternative LLM assistance.*

## PHASE 13: Gemini's Syntax Fix - Environment Variable Expansion Issue (CURRENT)

### Problem Summary (2025-08-02)
- **✅ Gemini's Fix Applied**: Readiness probe wrapped in `sh -c` for environment variable expansion
- **✅ Deployment Restarted**: Multiple rollout restarts performed
- **❌ Still Not Working**: MySQL pods still `0/1` ready after multiple attempts
- **❌ Critical Syntax Error**: Gemini identified `$(MYSQL_ROOT_PASSWORD)` vs `$MYSQL_ROOT_PASSWORD` issue

### Gemini's Latest Analysis (2025-08-02):

**Root Cause Identified:**
- **Syntax Error**: Using `$(MYSQL_ROOT_PASSWORD)` is **shell command substitution syntax**
- **Correct Syntax**: Should be `$MYSQL_ROOT_PASSWORD` (simple variable expansion)
- **The Problem**: Shell was trying to execute a command named `MYSQL_ROOT_PASSWORD` instead of expanding the variable

### Gemini's Fix Applied:

**Before (Wrong):**
```yaml
readinessProbe:
  exec:
    command:
    - sh
    - -c
    - mysql -h localhost -u root -p$(MYSQL_ROOT_PASSWORD) -e "SELECT 1"
```

**After (Correct):**
```yaml
readinessProbe:
  exec:
    command:
    - sh
    - -c
    - mysql -h localhost -u root -p$MYSQL_ROOT_PASSWORD -e "SELECT 1"
```

### Current Terminal Output After Gemini's Syntax Fix:

```bash
root@server:~# kubectl get pods -n bookmynurse
NAME                                   READY   STATUS     RESTARTS   AGE
backend-deployment-977bbd554-kmjrh     0/1     Init:0/1   0          23h
frontend-deployment-7c697b587c-hjh67   1/1     Running    0          23h
mysql-deployment-6bb58c56c9-wdjzc      0/1     Running    0          21h
mysql-deployment-7688d47b46-6wgdt      0/1     Running    0          25s

root@server:~# kubectl get endpoints mysql-service -n bookmynurse
NAME            ENDPOINTS   AGE
mysql-service               23h

root@server:~# kubectl get secret mysql-secret -n bookmynurse -o yaml
apiVersion: v1
data:
  mysql-database: Ym9va215bnVyc2U=
  mysql-password: Ym5tcGFzc3dvcmQ=
  mysql-root-password: cm9vdHBhc3N3b3Jk
  mysql-user: Ym5tdXNlcg==
kind: Secret
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","data":{"mysql-database":"Ym9va215bnVyc2U=","mysql-password":"Ym5tcGFzc3dvcmQ=","mysql-root-password":"cm9vdHBhc3N3b3Jk","mysql-user":"Ym5tdXNlcg=="},"kind":"Secret","metadata":{"annotations":{},"name":"mysql-secret","namespace":"bookmynurse"},"type":"Opaque"}
  creationTimestamp: "2025-08-01T04:06:41Z"
  name: mysql-secret
  namespace: bookmynurse
  resourceVersion: "977"
  uid: 130e5601-191d-4bbd-868d-89a0c20c20f3
type: Opaque
```

### Current Status Analysis:

**✅ Good News:**
- **MySQL Secret is Correct**: The secret shows `mysql-root-password: cm9vdHBhc3N3b3Jk` (base64 for "rootpassword")
- **Syntax is Fixed**: The deployment file now has `-p$MYSQL_ROOT_PASSWORD` (correct syntax)
- **New Pod Created**: `mysql-deployment-7688d47b46-6wgdt` (25s age) - fresh pod with the fix

**❌ Still Not Working:**
- **Still 0/1 Ready**: New pod still not becoming ready
- **Old Pod Persisting**: `mysql-deployment-6bb58c56c9-wdjzc` (21h age) - old pod still running
- **Service Empty**: `mysql-service` still has no endpoints
- **Backend Still Stuck**: Backend still showing "MySQL is not ready yet. Sleeping for 5 seconds..."

### Questions for Gemini AI:

**File:** `Debug/debug.md` - **Hi Gemini, your syntax fix has been successfully applied to the server. The `bookmynurse-devops/k8s/mysql/deployment.yaml` file now has the correct environment variable syntax `-p$MYSQL_ROOT_PASSWORD` instead of the problematic `-p$(MYSQL_ROOT_PASSWORD)` command substitution syntax. However, we still have the same issue where MySQL pods are `0/1` ready and the service has no endpoints. The new pod `mysql-deployment-7688d47b46-6wgdt` (25s age) was created with your fix, but the old pod `mysql-deployment-6bb58c56c9-wdjzc` (21h age) is still running, and both pods are still not becoming ready. The MySQL secret is correct with the proper base64 encoded password, and the syntax fix is in place, but the readiness probe is still failing. Should we delete the old pod to let the new pod with your syntax fix take over, or is there another issue we're missing that's preventing the readiness probe from working properly despite the correct syntax?**

### Proposed Solutions for Gemini:

**Option 1: Clean Up Old Pod**
```bash
kubectl delete pod mysql-deployment-6bb58c56c9-wdjzc -n bookmynurse
```

**Option 2: Check New Pod Logs**
```bash
kubectl logs mysql-deployment-7688d47b46-6wgdt -n bookmynurse
kubectl describe pod mysql-deployment-7688d47b46-6wgdt -n bookmynurse
```

**Option 3: Test Readiness Probe Manually**
```bash
kubectl exec -it mysql-deployment-7688d47b46-6wgdt -n bookmynurse -- sh -c 'mysql -h localhost -u root -p$MYSQL_ROOT_PASSWORD -e "SELECT 1"'
```

**Option 4: Temporarily Disable Readiness Probe**
```bash
# Patch deployment to remove readiness probe temporarily
kubectl patch deployment mysql-deployment -n bookmynurse -p '{"spec":{"template":{"spec":{"containers":[{"name":"mysql","readinessProbe":null}]}}}}'
```

### Next Steps:
1. **Wait for Gemini's response** on the best approach
2. **Check if the syntax fix resolves the issue** once old pod is removed
3. **Investigate if there are other MySQL configuration issues** preventing readiness
4. **Consider alternative readiness probe approaches** if the current one continues to fail

---

## PHASE 14: MySQL SUCCESS! Backend/Frontend Deadlock Issue (CURRENT)

### Problem Summary (2025-08-02)
- **✅ MySQL FIXED**: Gemini's `Recreate` strategy + syntax fix worked perfectly!
- **✅ MySQL Status**: `mysql-deployment-7688d47b46-6wgdt` is `1/1` Running
- **✅ MySQL Service**: Has endpoints `10.244.0.116:3306`
- **❌ Backend Deadlock**: Same issue as MySQL - old pod (25h) + new pod (18s) both running
- **❌ Frontend Deadlock**: Same issue as MySQL - old pod (25h) + new pod (8s) both running

### Gemini's MySQL Fix Success (2025-08-02):

**What Worked:**
1. **✅ Syntax Fix**: `-p$MYSQL_ROOT_PASSWORD` (correct variable expansion)
2. **✅ Recreate Strategy**: `strategy: type: Recreate` in deployment
3. **✅ PVC Deadlock Resolved**: Old pod terminated before new pod created
4. **✅ Readiness Probe Working**: MySQL pod is `1/1` ready

**Current MySQL Status:**
```bash
mysql-deployment-7688d47b46-6wgdt      1/1     Running   33 (5m46s ago)   120m
mysql-service   10.244.0.116:3306   25h
```

### New Issue: Backend and Frontend Deadlock

**Current Status After Restart:**
```bash
NAME                                   READY   STATUS    RESTARTS         AGE
backend-deployment-66759c5d5c-ml7fc    0/1     Running   0                18s  # NEW POD
backend-deployment-977bbd554-kmjrh     0/1     Running   0                25h  # OLD POD
frontend-deployment-694665b64f-zw8qp   0/1     Running   0                8s   # NEW POD
frontend-deployment-7c697b587c-hjh67   1/1     Running   0                25h  # OLD POD
mysql-deployment-7688d47b46-6wgdt      1/1     Running   33 (5m46s ago)   120m # ✅ WORKING!
```

**Root Cause:**
- **Same Deadlock Issue**: Backend and frontend deployments still use default `RollingUpdate` strategy
- **Old Pods Not Terminated**: 25h old pods still running alongside new pods
- **New Pods Can't Start**: Same PVC/volume conflict as MySQL had

### Solution Needed:

**Add `Recreate` Strategy to Backend and Frontend Deployments:**

**Backend Deployment Fix:**
```yaml
spec:
  strategy:
    type: Recreate  # Add this to prevent deadlock
  replicas: 1
```

**Frontend Deployment Fix:**
```yaml
spec:
  strategy:
    type: Recreate  # Add this to prevent deadlock
  replicas: 1
```

### Message for Gemini AI:

**File:** `Debug/debug.md` - **Hi Gemini, your MySQL fix worked perfectly! The `Recreate` strategy and syntax fix resolved the MySQL deadlock completely. MySQL is now `1/1` ready with proper service endpoints. However, we now have the same deadlock issue with backend and frontend deployments. When we restarted them, they created new pods but the old 25h pods are still running alongside the new pods, creating the same PVC/volume conflict that MySQL had. The backend and frontend deployments still use the default `RollingUpdate` strategy instead of `Recreate`. Should we add the same `strategy: type: Recreate` fix to both `bookmynurse-devops/k8s/backend/deployment.yaml` and `bookmynurse-devops/k8s/frontend/deployment.yaml` to resolve this deadlock issue? This would ensure old pods are terminated before new pods are created, just like it worked for MySQL.**

### Next Steps:
1. **Add `Recreate` strategy** to backend deployment
2. **Add `Recreate` strategy** to frontend deployment
3. **Apply the changes** to resolve the deadlock
4. **Verify all pods** become ready with working MySQL service

### Files to Modify:
- `bookmynurse-devops/k8s/backend/deployment.yaml`
- `bookmynurse-devops/k8s/frontend/deployment.yaml`

---


root@server:~# kubectl get sc
No resources found
root@server:~# kubectl get pv
No resources found
root@server:~# kubectl get pvc -n bookmynurse
NAME             STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS    VOLUMEATTRIBUTESCLASS   AGE
mysql-pv-claim   Pending                                      local-storage   <unset>                 24m
root@server:~# kubectl get pods -n bookmynurse
NAME                                   READY   STATUS     RESTARTS   AGE
backend-deployment-77655998-zxhqq      0/1     Init:0/1   0          24m
frontend-deployment-77449684c7-5rt7f   1/1     Running    0          24m
mysql-deployment-667b9dbd75-hbzhl      0/1     Pending    0          24m

root@server:~# kubectl get pvc -n bookmynurse
NAME             STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS    VOLUMEATTRIBUTESCLASS   AGE
mysql-pv-claim   Pending                                      local-storage   <unset>                 9m43s
root@server:~# kubectl describe pvc mysql-pv-claim -n bookmynurse
Name:          mysql-pv-claim
Namespace:     bookmynurse
StorageClass:  local-storage
Status:        Pending
Volume:
Labels:        <none>
Annotations:   <none>
Finalizers:    [kubernetes.io/pvc-protection]
Capacity:
Access Modes:
VolumeMode:    Filesystem
Used By:       mysql-deployment-667b9dbd75-hbzhl
               mysql-deployment-6bbc6d64f5-7zpst
Events:
  Type    Reason               Age                   From                         Message
  ----    ------               ----                  ----                         -------
  Normal  WaitForPodScheduled  18m (x26 over 24m)    persistentvolume-controller  waiting for pod mysql-deployment-667b9dbd75-hbzhl to be scheduled
  Normal  WaitForPodScheduled  4m15s (x39 over 15m)  persistentvolume-controller  waiting for pods mysql-deployment-667b9dbd75-hbzhl,mysql-deployment-6bbc6d64f5-7zpst to be scheduled
root@server:~# kubectl describe pv mysql-pv
Name:              mysql-pv
Labels:            <none>
Annotations:       <none>
Finalizers:        [kubernetes.io/pv-protection]
StorageClass:      local-storage
Status:            Available
Claim:
Reclaim Policy:    Retain
Access Modes:      RWO
VolumeMode:        Filesystem
Capacity:          10Gi
Node Affinity:
  Required Terms:
    Term 0:        kubernetes.io/hostname in [$(hostname)]
Message:
Source:
    Type:  LocalVolume (a persistent volume backed by local storage on a node)
    Path:  /mnt/data
Events:    <none>
root@server:~#  kubectl get nodes -o wide
NAME                     STATUS   ROLES           AGE    VERSION    INTERNAL-IP      EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION       CONTAINER-RUNTIME
server.bookmynurse.com   Ready    control-plane   110m   v1.30.14   103.91.186.102   <none>        Ubuntu 22.04.5 LTS   5.15.0-130-generic   containerd://1.7.27
root@server:~# kubectl describe pod mysql-deployment-6bbc6d64f5-7zpst -n bookmynurse
Name:             mysql-deployment-6bbc6d64f5-7zpst
Namespace:        bookmynurse
Priority:         0
Service Account:  default
Node:             <none>
Labels:           app=mysql
                  pod-template-hash=6bbc6d64f5
                  tier=database
Annotations:      kubectl.kubernetes.io/restartedAt: 2025-07-31T17:11:57+05:30
Status:           Pending
IP:
IPs:              <none>
Controlled By:    ReplicaSet/mysql-deployment-6bbc6d64f5
Init Containers:
  init-db:
    Image:      mysql:8.0
    Port:       <none>
    Host Port:  <none>
    Command:
      bash
      -c
      echo "Waiting for MySQL to be ready..."
      until mysql -h 127.0.0.1 -P 3306 -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1"; do
        sleep 2
      done
      echo "MySQL is ready. Loading data..."
      mysql -h 127.0.0.1 -P 3306 -u root -p"$MYSQL_ROOT_PASSWORD" bookmynurse < /docker-entrypoint-initdb.d/init-db.sql

    Environment:
      MYSQL_ROOT_PASSWORD:  <set to the key 'mysql-root-password' in secret 'mysql-secret'>  Optional: false
    Mounts:
      /docker-entrypoint-initdb.d from mysql-init-scripts (rw)
      /var/lib/mysql from mysql-persistent-storage (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-9pdvg (ro)
Containers:
  mysql:
    Image:      mysql:8.0
    Port:       3306/TCP
    Host Port:  0/TCP
    Limits:
      cpu:     500m
      memory:  1Gi
    Requests:
      cpu:      250m
      memory:   512Mi
    Liveness:   exec [mysqladmin ping -h localhost] delay=30s timeout=5s period=10s #success=1 #failure=3
    Readiness:  exec [mysql -h localhost -u root -p$(MYSQL_ROOT_PASSWORD) -e SELECT 1] delay=15s timeout=3s period=5s #success=1 #failure=3
    Environment:
      MYSQL_ROOT_PASSWORD:  <set to the key 'mysql-root-password' in secret 'mysql-secret'>  Optional: false
      MYSQL_USER:           <set to the key 'mysql-user' in secret 'mysql-secret'>           Optional: false
      MYSQL_PASSWORD:       <set to the key 'mysql-password' in secret 'mysql-secret'>       Optional: false
      MYSQL_DATABASE:       <set to the key 'mysql-database' in secret 'mysql-secret'>       Optional: false
    Mounts:
      /docker-entrypoint-initdb.d from mysql-init-scripts (rw)
      /etc/mysql/conf.d from mysql-config (rw)
      /var/lib/mysql from mysql-persistent-storage (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-9pdvg (ro)
Conditions:
  Type           Status
  PodScheduled   False
Volumes:
  mysql-persistent-storage:
    Type:       PersistentVolumeClaim (a reference to a PersistentVolumeClaim in the same namespace)   
    ClaimName:  mysql-pv-claim
    ReadOnly:   false
  mysql-config:
    Type:      ConfigMap (a volume populated by a ConfigMap)
    Name:      mysql-config
    Optional:  false
  mysql-init-scripts:
    Type:      ConfigMap (a volume populated by a ConfigMap)
    Name:      mysql-init-scripts
    Optional:  false
  kube-api-access-9pdvg:
    Type:                    Projected (a volume that contains injected data from multiple sources)    
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   Burstable
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason            Age                From               Message
  ----     ------            ----               ----               -------
  Warning  FailedScheduling  92s (x4 over 16m)  default-scheduler  0/1 nodes are available: 1 node(s) didn't find available persistent volumes to bind. preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.
root@server:~#









---

## PHASE 15: Missing Storage Infrastructure - Production Server Deployment (CURRENT)

### Problem Summary (2025-08-02)
- **❌ StorageClass Missing**: `kubectl get sc` shows "No resources found"
- **❌ PersistentVolume Missing**: `kubectl get pv` shows "No resources found"
- **❌ PVC Pending**: `mysql-pv-claim` is stuck in `Pending` status
- **❌ MySQL Pod Pending**: Can't start due to PVC binding failure
- **❌ Backend Pod Init:0/1**: Waiting for MySQL service
- **✅ Frontend Pod Running**: 1/1 ready (but can't communicate with backend)

### Current Terminal Output Analysis:

**Storage Infrastructure Status:**
```bash
root@server:~# kubectl get sc
No resources found

root@server:~# kubectl get pv
No resources found

root@server:~# kubectl get pvc -n bookmynurse
NAME             STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS    VOLUMEATTRIBUTESCLASS   AGE
mysql-pv-claim   Pending                                      local-storage   <unset>                 24m
```

**Pod Status:**
```bash
NAME                                   READY   STATUS     RESTARTS   AGE
backend-deployment-77655998-zxhqq      0/1     Init:0/1   0          24m
frontend-deployment-77449684c7-5rt7f   1/1     Running    0          24m
mysql-deployment-667b9dbd75-hbzhl      0/1     Pending    0          24m
```

**PVC Events:**
```bash
Events:
  Type    Reason               Age                   From                         Message
  ----    ------               ----                  ----                         -------
  Normal  WaitForPodScheduled  18m (x26 over 24m)    persistentvolume-controller  waiting for pod mysql-deployment-667b9dbd75-hbzhl to be scheduled
  Normal  WaitForPodScheduled  4m15s (x39 over 15m)  persistentvolume-controller  waiting for pods mysql-deployment-667b9dbd75-hbzhl,mysql-deployment-6bbc6d64f5-7zpst to be scheduled
```

**MySQL Pod Scheduling Error:**
```bash
Events:
  Type     Reason            Age                From               Message
  ----     ------            ----               ----               -------
  Warning  FailedScheduling  92s (x4 over 16m)  default-scheduler  0/1 nodes are available: 1 node(s) didn't find available persistent volumes to bind. preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.
```

### Root Cause Analysis:

**The Issue is Missing Storage Infrastructure:**
1. **StorageClass Not Applied**: The `local-storage` StorageClass is missing from the cluster
2. **PersistentVolume Not Applied**: The `mysql-pv` PersistentVolume is missing from the cluster
3. **PVC Can't Bind**: Without StorageClass and PV, the PVC remains in `Pending` status
4. **Pod Can't Schedule**: MySQL pod can't be scheduled because it needs the PVC to be bound
5. **Backend Can't Start**: Backend init container can't connect to MySQL service

### Files Available but Not Applied:

**StorageClass File:** `bookmynurse-devops/k8s/storage/storage-class.yaml`
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
```

**PersistentVolume File:** `bookmynurse-devops/k8s/storage/mysql-pv.yaml`
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mysql-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  local:
    path: /mnt/data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - server.bookmynurse.com
```

### Questions for Gemini AI:

**File:** `Debug/debug.md` - **Hi Gemini, we have a production server deployment issue where the storage infrastructure is completely missing from the Kubernetes cluster. The `kubectl get sc` and `kubectl get pv` commands show "No resources found", which means the StorageClass and PersistentVolume haven't been applied to the cluster. We have the correct YAML files available at `bookmynurse-devops/k8s/storage/storage-class.yaml` and `bookmynurse-devops/k8s/storage/mysql-pv.yaml`, but they haven't been applied to the cluster. The PVC `mysql-pv-claim` is stuck in `Pending` status because there's no StorageClass or PV to bind to. The MySQL pod can't be scheduled because it needs the PVC to be bound, and the backend pod is stuck in Init:0/1 waiting for the MySQL service. Should we apply the storage infrastructure files individually using `kubectl apply -f bookmynurse-devops/k8s/storage/storage-class.yaml` and `kubectl apply -f bookmynurse-devops/k8s/storage/mysql-pv.yaml`, then create the data directory `/mnt/data` on the server? This should resolve the PVC binding issue and allow the MySQL pod to start, which will then allow the backend to connect and the application to work properly.**

### Proposed Solution for Gemini:

**Step 1: Apply Storage Infrastructure**
```bash
# Apply StorageClass
kubectl apply -f bookmynurse-devops/k8s/storage/storage-class.yaml

# Create data directory
mkdir -p /mnt/data
chmod 755 /mnt/data

# Apply PersistentVolume
kubectl apply -f bookmynurse-devops/k8s/storage/mysql-pv.yaml
```

**Step 2: Verify Storage Infrastructure**
```bash
# Check StorageClass
kubectl get sc

# Check PersistentVolume
kubectl get pv

# Check PVC binding
kubectl get pvc -n bookmynurse
```

**Step 3: Monitor Pod Status**
```bash
# Check if MySQL pod can be scheduled
kubectl get pods -n bookmynurse

# Check if backend can connect
kubectl logs <backend-pod-name> -n bookmynurse
```

### Expected Outcome:
Once the storage infrastructure is applied, the PVC should bind to the PV, allowing the MySQL pod to be scheduled and start, which will then allow the backend to connect and the application to function properly.

### Files to Apply:
- `bookmynurse-devops/k8s/storage/storage-class.yaml`
- `bookmynurse-devops/k8s/storage/mysql-pv.yaml`

### Server Commands Needed:
- Create `/mnt/data` directory
- Apply the storage YAML files
- Verify the infrastructure is working

---

*This phase documents the current production server deployment issue where storage infrastructure is missing, preventing the application from starting properly.*

### Next Steps:
1. Test backend directly: `kubectl port-forward backend-service 3000:3000 -n bookmynurse`
2. Fix Ingress routing to handle health endpoints properly
3. Ensure backend service is correctly configured
4. Test frontend-backend communication









---

## PHASE 17: Backend Health Endpoints Returning 404 - Ingress Routing Issue (CURRENT)

### Problem Summary (2025-08-03)
- **✅ Backend Pod Running**: `backend-deployment-d558567fc-l8jgn` is Running 1/1
- **✅ Database Connected**: "Successfully connected to database" and "Database connection is alive"
- **✅ Storage Working**: PVC bound, StorageClass created
- **❌ Health Endpoints 404**: Both `/health` and `/api/health` return 404 Not Found
- **❌ Frontend Can't Connect**: Frontend can't reach backend APIs

### Current Terminal Output Analysis:

**Backend Status:**
```bash
root@server:~# kubectl get pods -n bookmynurse
NAME                                  READY   STATUS    RESTARTS   AGE
backend-deployment-d558567fc-l8jgn    1/1     Running   0          9m32s
frontend-deployment-6668878d5-nkbt9   1/1     Running   0          9m31s
mysql-deployment-657b46c495-j7r4f     1/1     Running   0          9m33s

root@server:~# kubectl logs backend-deployment-d558567fc-l8jgn -n bookmynurse
Server running on port 3000
Successfully connected to database.
Database connection is alive
```

**Health Endpoint Tests:**
```bash
root@server:~# curl -I http://103.91.186.102:3000/health
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Security-Policy: default-src 'none'
X-Content-Type-Options: nosniff
Content-Type: text/html; charset=utf-8
Content-Length: 146
Date: Sun, 03 Aug 2025 06:27:54 GMT
Connection: keep-alive
Keep-Alive: timeout=5

root@server:~# curl -I http://103.91.186.102:3000/api/health
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Security-Policy: default-src 'none'
X-Content-Type-Options: nosniff
Content-Type: text/html; charset=utf-8
Content-Length: 150
Date: Sun, 03 Aug 2025 06:27:15 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

**Ingress Configuration:**
```bash
root@server:~# kubectl describe ingress -n bookmynurse
Name:             bmn-ingress
Labels:           <none>
Namespace:        bookmynurse
Address:          103.91.186.102
Ingress Class:    <none>
Default backend:  <default>
Rules:
  Host        Path  Backends
  ----        ----  --------
  *
              /api/(.*)   backend-service:3000 (10.244.0.143:3000)
              /(.*)       frontend-service:8080 ()
Annotations:  cert-manager.io/cluster-issuer: letsencrypt-prod
              kubernetes.io/ingress.class: nginx
              nginx.ingress.kubernetes.io/cors-allow-origin: *
              nginx.ingress.kubernetes.io/enable-cors: true
              nginx.ingress.kubernetes.io/proxy-body-size: 50m
              nginx.ingress.kubernetes.io/rate-limit-connections: 10
              nginx.ingress.kubernetes.io/rate-limit-window: 1m
              nginx.ingress.kubernetes.io/rewrite-target: /$1
              nginx.ingress.kubernetes.io/ssl-redirect: true
              nginx.ingress.kubernetes.io/use-proxy-protocol: true
```

**Backend Code Analysis:**
```javascript
// app.js - Lines 28-32
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

### Root Cause Analysis:
1. **Backend is running correctly** on port 3000
2. **Database connection is working**
3. **Health endpoints are defined** in the code
4. **Ingress is routing** `/api/*` to backend-service:3000
5. **The issue**: The Ingress rewrite rule `nginx.ingress.kubernetes.io/rewrite-target: /$1` is causing path rewriting issues

### Required Fixes:
1. **Test direct backend access** without Ingress
2. **Fix Ingress routing rules** to properly handle health endpoints
3. **Verify backend service** is correctly exposing port 3000
4. **Check if backend is listening** on the correct interface

### Files to Check:
- `bookmynurse-devops/k8s/ingress/ingress.yaml` - Ingress configuration
- `bookmynurse-devops/k8s/backend/backend-service.yaml` - Backend service
- `bookmynurse-devops/backend/app.js` - Backend routes

### Next Steps:
1. Test backend directly: `kubectl port-forward backend-service 3000:3000 -n bookmynurse`
2. Fix Ingress routing to handle health endpoints properly
3. Ensure backend service is correctly configured
4. Test frontend-backend communication









---

## PHASE 18: Ingress Routing Issue - /health Returns 404 but /api/health Works (CURRENT)

### Problem Summary (2025-08-03)
- **✅ Backend Pod Running**: `backend-deployment-7c6d55c649-69rbw` is Running 1/1 on port 30008
- **✅ Database Connected**: "Successfully connected to database" and "Database connection is alive"
- **✅ Storage Working**: PVC bound, StorageClass created
- **✅ Port Conflict Resolved**: Backend moved from port 3000 to 30008 successfully
- **❌ Ingress Routing Issue**: `/health` returns 404 but `/api/health` works on port 8080
- **❌ Frontend Can't Connect**: Frontend can't reach backend APIs through Ingress

### Current Terminal Output Analysis:

**Backend Status:**
```bash
root@server:~# kubectl get pods -n bookmynurse
NAME                                   READY   STATUS    RESTARTS   AGE
backend-deployment-7c6d55c649-69rbw    1/1     Running   0          11m
frontend-deployment-54fb749d57-bnrs7   1/1     Running   0          11m
mysql-deployment-657b46c495-mkpsm      1/1     Running   0          11m

root@server:~# kubectl logs backend-deployment-7c6d55c649-69rbw -n bookmynurse
Server running on port 30008
Successfully connected to database.
Database connection is alive
```

**Health Endpoint Tests:**
```bash
# ❌ This fails - returns 404
root@server:~# curl -I http://103.91.186.102:8080/health
HTTP/1.1 404 Not Found
Date: Sun, 03 Aug 2025 07:29:18 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 140
Connection: keep-alive
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Security-Policy: default-src 'none'
X-Content-Type-Options: nosniff

# ✅ This works - returns 200 OK
root@server:~# curl -I http://103.91.186.102:8080/api/health
HTTP/1.1 200 OK
Date: Sun, 03 Aug 2025 07:29:44 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 59
Connection: keep-alive
X-Powered-By: Express
Access-Control-Allow-Origin: *
ETag: W/"3b-sdQcpkmUttAiHgsKkA9Fp7jdJV0"
```

**Ingress Configuration:**
```bash
root@server:~# kubectl describe ingress bmn-ingress -n bookmynurse
Name:             bmn-ingress
Labels:           <none>
Namespace:        bookmynurse
Address:          103.91.186.102
Ingress Class:    <none>
Default backend:  <default>
Rules:
  Host        Path  Backends
  ----        ----  --------
  *
              /api/(.*)   backend-service:30008 (10.244.0.154:30008)
              /health     backend-service:30008 (10.244.0.154:30008)  # ← This rule exists!
              /(.*)       frontend-service:8080 ()
```

**Backend Service Status:**
```bash
root@server:~# kubectl get svc backend-service -n bookmynurse
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)     AGE
backend-service   ClusterIP   10.104.190.82   <none>        30008/TCP   10m

root@server:~# kubectl describe svc backend-service -n bookmynurse
Name:              backend-service
Namespace:         bookmynurse
Labels:            app=backend
                   tier=api
Annotations:       <none>
Selector:          app=backend,tier=api
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                10.104.190.82
IPs:               10.104.190.82
Port:              http  30008/TCP
TargetPort:        30008/TCP
Endpoints:         10.244.0.165:30008
Session Affinity:  None
Events:            <none>
```

### Root Cause Analysis:

**The Issue is Ingress Rule Order and Path Matching:**

1. **✅ Backend is running correctly** on port 30008
2. **✅ Database connection is working**
3. **✅ Health endpoints are defined** in the code
4. **✅ Ingress has `/health` rule** pointing to backend-service:30008
5. **❌ The problem**: The catch-all rule `/(.*)` is intercepting `/health` requests before they reach the specific `/health` rule

**Ingress Rule Order Issue:**
```yaml
# Current Ingress Rules (WRONG ORDER):
- path: /api/(.*)   backend-service:30008  # ← This works
- path: /health     backend-service:30008  # ← This should work but doesn't
- path: /(.*)       frontend-service:8080  # ← This catches /health before it reaches the specific rule!
```

**The Problem:**
- The catch-all rule `/(.*)` matches `/health` and routes it to frontend-service:8080
- The specific `/health` rule never gets a chance to match
- The frontend service returns 404 for `/health` because it doesn't have that endpoint

### Required Fix:

**Reorder Ingress Rules** so that specific paths come before the catch-all rule:

```yaml
# Correct Ingress Rules (RIGHT ORDER):
- path: /api/(.*)   backend-service:30008  # API routes first
- path: /health     backend-service:30008  # Health route second
- path: /(.*)       frontend-service:8080  # Catch-all last
```

### Files to Modify:
- `bookmynurse-devops/k8s/ingress/ingress.yaml` - Reorder the rules

### Expected Outcome:
Once the Ingress rules are reordered, `/health` should route to the backend service and return 200 OK, allowing the frontend to communicate with the backend properly.

---

## 📋 **Prompt for Gemini AI:**

**File:** `FULL STACK/Debug/debug.md` - **Hi Gemini, we have an Ingress routing issue in our Kubernetes deployment. The backend Node.js application is running correctly on port 30008 (we moved from port 3000 to avoid conflicts), and the database connection is working perfectly. However, there's a specific Ingress routing problem where `/health` returns 404 Not Found but `/api/health` works correctly. The issue is in the Ingress rule order in `bookmynurse-devops/k8s/ingress/ingress.yaml`. Currently, the rules are ordered as: 1) `/api/(.*)` to backend-service:30008, 2) `/health` to backend-service:30008, 3) `/(.*)` to frontend-service:8080. The problem is that the catch-all rule `/(.*)` is intercepting `/health` requests before they reach the specific `/health` rule, routing them to the frontend service which returns 404. We need to reorder the Ingress rules so that specific paths come before the catch-all rule. The correct order should be: 1) `/api/(.*)` to backend-service:30008, 2) `/health` to backend-service:30008, 3) `/(.*)` to frontend-service:8080. Please help us fix the Ingress configuration to ensure that `/health` requests are properly routed to the backend service instead of being caught by the catch-all rule. The backend has both `/health` and `/api/health` endpoints defined in the code and is running correctly on port 30008.**

### Next Steps:
1. **Reorder Ingress rules** in `bookmynurse-devops/k8s/ingress/ingress.yaml`
2. **Apply the updated Ingress** configuration
3. **Test both endpoints** to verify they work correctly
4. **Verify frontend-backend communication** is working

### Files to Modify:
- `bookmynurse-devops/k8s/ingress/ingress.yaml`

---

*This phase documents the Ingress routing issue where rule order is preventing the `/health` endpoint from working properly, requiring a reordering of the Ingress rules to fix the path matching priority.*

---

## PHASE 19: Ingress Rewrite-Target Issue - All Backend Endpoints Returning "Cannot GET /" (CURRENT)

### Problem Summary (2025-08-04)
- **✅ Backend Pod Running**: `backend-deployment-68dff9fc54-7x72p` is Running 1/1 on port 30008
- **✅ Database Connected**: "Successfully connected to database" and "Database connection is alive"
- **✅ Frontend Working**: Angular application loads correctly on `/`
- **❌ Backend Endpoints Broken**: Both `/health` and `/api/health` return "Cannot GET /" through Ingress
- **❌ Rewrite-Target Issue**: The `nginx.ingress.kubernetes.io/rewrite-target: /` annotation is causing path rewriting problems

### Current Terminal Output Analysis:

**Backend Status:**
```bash
root@server:~# kubectl get pods -n bookmynurse
NAME                                   READY   STATUS    RESTARTS   AGE
backend-deployment-68dff9fc54-7x72p    1/1     Running   0          50s
frontend-deployment-5bf8d48f8-jp25x    1/1     Running   0          84s
mysql-deployment-657b46c495-mvk8w      1/1     Running   0          19h

root@server:~# kubectl logs backend-deployment-68dff9fc54-7x72p -n bookmynurse
Server running on port 30008
Successfully connected to database.
Database connection is alive
```

**Ingress Configuration:**
```bash
root@server:~# kubectl describe ingress bmn-ingress -n bookmynurse
Name:             bmn-ingress
Labels:           <none>
Namespace:        bookmynurse
Address:          103.91.186.102
Ingress Class:    nginx
Default backend:  <default>
Rules:
  Host        Path  Backends
  ----        ----  --------
  *
              /health       backend-service:30008 (10.244.0.179:30008)
              /api/health   backend-service:30008 (10.244.0.179:30008)
              /             frontend-service:8080 (10.244.0.180:8080)
Annotations:  cert-manager.io/cluster-issuer: letsencrypt-prod
              nginx.ingress.kubernetes.io/cors-allow-origin: *
              nginx.ingress.kubernetes.io/enable-cors: true
              nginx.ingress.kubernetes.io/proxy-body-size: 50m
              nginx.ingress.kubernetes.io/rate-limit-connections: 10
              nginx.ingress.kubernetes.io/rate-limit-window: 1m
              nginx.ingress.kubernetes.io/rewrite-target: /
              nginx.ingress.kubernetes.io/use-proxy-protocol: true
```

**Health Endpoint Tests:**
```bash
# ❌ Both endpoints return "Cannot GET /"
root@server:~# curl -k https://103.91.186.102:8443/health
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /</pre>
</body>
</html>

root@server:~# curl -k https://103.91.186.102:8443/api/health
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /</pre>
</body>
</html>

# ✅ Frontend works correctly
root@server:~# curl -k https://103.91.186.102:8443/
<!DOCTYPE html>
<html lang="en" data-critters-container>
<head>
  <meta charset="utf-8">
  <base href="./">
  <!-- Angular application HTML content -->
</head>
<body>
  <!-- Angular application content -->
</body>
</html>
```

### Root Cause Analysis:

**The Issue is the Rewrite-Target Annotation:**

1. **✅ Backend is running correctly** on port 30008
2. **✅ Database connection is working**
3. **✅ Health endpoints are defined** in the code
4. **✅ Ingress rules are correctly ordered**
5. **❌ The problem**: The `nginx.ingress.kubernetes.io/rewrite-target: /` annotation is rewriting all paths to `/`

**Rewrite-Target Problem:**
```yaml
# Current Ingress Configuration (PROBLEMATIC):
annotations:
  nginx.ingress.kubernetes.io/rewrite-target: /  # ← This rewrites ALL paths to /
```

**What's Happening:**
- **`/health`** gets rewritten to `/` → Backend receives request for `/` (which doesn't exist)
- **`/api/health`** gets rewritten to `/` → Backend receives request for `/` (which doesn't exist)
- **Backend returns "Cannot GET /"** because it doesn't have a root `/` endpoint

### Required Fix:

**Remove or Fix the Rewrite-Target Annotation:**

**Option 1: Remove Rewrite-Target (Recommended)**
```yaml
# Remove this line from annotations:
# nginx.ingress.kubernetes.io/rewrite-target: /
```

**Option 2: Use Proper Rewrite-Target for Specific Paths**
```yaml
# Only use rewrite-target for paths that need it:
# nginx.ingress.kubernetes.io/rewrite-target: /$1  # For regex paths only
```

### Files to Modify:
- `bookmynurse-devops/k8s/ingress/ingress.yaml` - Remove or fix the rewrite-target annotation

### Expected Outcome:
Once the rewrite-target issue is resolved, `/health` and `/api/health` should return proper JSON responses from the backend, allowing the frontend to communicate with the backend properly.

### Backend Endpoints Available:
```javascript
// From backend/app.js
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

---

*This phase documents the Ingress rewrite-target issue where the global rewrite-target annotation is causing all backend endpoints to be rewritten to the root path, resulting in "Cannot GET /" errors.*

---

## PHASE 20: Gemini's Changes Broke Everything - All Endpoints Now Failing (CURRENT)

### Problem Summary (2025-08-04)
- **❌ All Endpoints Broken**: After Gemini's changes, not a single endpoint is working
- **❌ Backend Endpoints**: Both `/health` and `/api/health` still return "Cannot GET /"
- **❌ Frontend**: May also be affected by the changes
- **❌ Gemini's "Fix"**: Made changes that made the situation worse

### Gemini's Changes Applied:

**What Gemini Did:**
1. **Added rewrite-target**: `nginx.ingress.kubernetes.io/rewrite-target: /`
2. **Removed TLS configuration**: Commented out TLS section
3. **Commented out SSL redirect**: `# nginx.ingress.kubernetes.io/ssl-redirect: "true"`
4. **Removed host field**: Changed from `host: "*"` to no host

**Current Ingress Configuration After Gemini's Changes:**
```bash
root@server:~# kubectl describe ingress bmn-ingress -n bookmynurse
Name:             bmn-ingress
Labels:           <none>
Namespace:        bookmynurse
Address:          103.91.186.102
Ingress Class:    nginx
Default backend:  <default>
Rules:
  Host        Path  Backends
  ----        ----  --------
  *
              /health       backend-service:30008 (10.244.0.179:30008)
              /api/health   backend-service:30008 (10.244.0.179:30008)
              /             frontend-service:8080 (10.244.0.180:8080)
Annotations:  cert-manager.io/cluster-issuer: letsencrypt-prod
              nginx.ingress.kubernetes.io/cors-allow-origin: *
              nginx.ingress.kubernetes.io/enable-cors: true
              nginx.ingress.kubernetes.io/proxy-body-size: 50m
              nginx.ingress.kubernetes.io/rate-limit-connections: 10
              nginx.ingress.kubernetes.io/rate-limit-window: 1m
              nginx.ingress.kubernetes.io/rewrite-target: /
              nginx.ingress.kubernetes.io/use-proxy-protocol: true
```

### Current Test Results:

**All Endpoints Still Failing:**
```bash
# ❌ Backend endpoints still return "Cannot GET /"
root@server:~# curl -k https://103.91.186.102:8443/health
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /</pre>
</body>
</html>

root@server:~# curl -k https://103.91.186.102:8443/api/health
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /</pre>
</body>
</html>

# ✅ Frontend still works (this is the only thing working)
root@server:~# curl -k https://103.91.186.102:8443/
<!DOCTYPE html>
<html lang="en" data-critters-container>
<!-- Angular application HTML content -->
</html>
```

### Root Cause Analysis:

**Gemini's Changes Made Things Worse:**

1. **✅ Backend is still running correctly** on port 30008
2. **✅ Database connection is still working**
3. **✅ Health endpoints are still defined** in the code
4. **❌ The rewrite-target annotation is STILL the problem**: `nginx.ingress.kubernetes.io/rewrite-target: /`
5. **❌ Gemini added the exact problem**: The rewrite-target that rewrites all paths to `/`

**The Issue:**
- **Gemini added `nginx.ingress.kubernetes.io/rewrite-target: /`** which is exactly what was causing the problem
- **This rewrites ALL paths to `/`** including `/health` and `/api/health`
- **Backend receives requests for `/`** instead of the actual endpoints
- **Backend returns "Cannot GET /"** because it doesn't have a root `/` endpoint

### Required Fix:

**Remove the Rewrite-Target Annotation Completely:**

```yaml
# Remove this line from annotations:
# nginx.ingress.kubernetes.io/rewrite-target: /
```

### Message for Gemini CLI:

**File:** `Debug/debug.md` - **Hi Gemini, your changes to the Ingress configuration have made the situation worse. You added `nginx.ingress.kubernetes.io/rewrite-target: /` which is exactly the problem we were trying to solve. This annotation rewrites ALL paths to `/`, including `/health` and `/api/health`, causing the backend to receive requests for `/` instead of the actual endpoints. The backend doesn't have a root `/` endpoint, so it returns "Cannot GET /". We need to REMOVE the rewrite-target annotation completely, not add it. The backend endpoints `/health` and `/api/health` are defined in the code and should work without any rewrite-target. Please help us remove the `nginx.ingress.kubernetes.io/rewrite-target: /` annotation from the Ingress configuration so that the paths are not rewritten and the backend endpoints can work properly.**

### Files to Fix:
- `bookmynurse-devops/k8s/ingress/ingress.yaml` - Remove the rewrite-target annotation

### Expected Outcome:
Once the rewrite-target annotation is removed, `/health` and `/api/health` should return proper JSON responses from the backend.

---

*This phase documents that Gemini's changes to add the rewrite-target annotation made the situation worse, and the annotation needs to be removed completely.*

---

## PHASE 21: SMTP Configuration Issue - 500 Internal Server Error on API Endpoints (CURRENT)

### Problem Summary (2025-08-04)
- **✅ Infrastructure Working**: All pods running, database connected, storage working
- **✅ Frontend Loading**: Angular application loads correctly on `/`
- **✅ Health Endpoints Working**: Both `/health` and `/api/health` return 200 OK
- **❌ API Endpoints Failing**: Frontend API calls to `/api/register/registrations` return 500 Internal Server Error
- **❌ SMTP Configuration Missing**: Backend trying to initialize nodemailer with missing environment variables

### Current Terminal Output Analysis:

**Pod Status (All Healthy):**
```bash
root@server:~# kubectl get pods -n bookmynurse
NAME                                  READY   STATUS    RESTARTS   AGE
backend-deployment-6c549474d4-2cgk9   1/1     Running   0          11m
frontend-deployment-7b967f896-99pt9   1/1     Running   0          11m
mysql-deployment-657b46c495-xbmdp     1/1     Running   0          11m
```

**Health Endpoints Working:**
```bash
root@server:~# curl -k https://103.91.186.102:8443/health
{"status":"healthy","timestamp":"2025-08-04T07:08:33.241Z"}

root@server:~# curl -k https://103.91.186.102:8443/api/health
{"status":"healthy","timestamp":"2025-08-04T07:08:47.986Z"}
```

**Frontend Application Loading:**
```bash
root@server:~# curl -k https://103.91.186.102:8443/
<!DOCTYPE html>
<html lang="en" data-critters-container>
<head>
  <meta charset="utf-8">
  <base href="./">
  <!-- Angular application HTML content -->
</head>
<body>
  <!-- Angular application content -->
</body>
</html>
```

**API Endpoint Failing (500 Error):**
```bash
# Frontend making this request and getting 500 Internal Server Error
GET https://103.91.186.102:8443/api/register/registrations?approval_status=Approved
```

### Root Cause Analysis:

**The Issue is SMTP Configuration in Backend Controller:**

1. **✅ Backend is running correctly** on port 30008
2. **✅ Database connection is working**
3. **✅ Health endpoints are working**
4. **❌ The problem**: The `nursingRegistration.controller.js` initializes nodemailer at module level using environment variables that don't exist

**SMTP Configuration Problem:**
```javascript
// In bookmynurse-devops/backend/controllers/nursingRegistration.controller.js
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // ← Undefined
  port: process.env.SMTP_PORT,        // ← Undefined  
  secure: true,
  auth: {
    user: process.env.SMTP_USER,      // ← Undefined
    pass: process.env.SMTP_PASS,      // ← Undefined
  },
  tls: {
    rejectUnauthorized: false,
  },
});
```

**What's Happening:**
- **Module Loading**: When the controller module is loaded, it tries to create the nodemailer transporter
- **Missing Environment Variables**: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` are not defined in the Kubernetes deployment
- **Transporter Creation Fails**: The transporter creation fails, causing the entire module to crash
- **500 Error**: When the `/api/register/registrations` endpoint is called, the module is already broken

**Kubernetes Deployment Analysis:**
```yaml
# Current backend deployment (bookmynurse-devops/k8s/backend/deployment.yaml)
env:
- name: NODE_ENV
  value: "production"
- name: PORT
  value: "30008"
- name: DB_HOST
  value: "mysql-service"
# ... database environment variables ...
# ❌ Missing SMTP environment variables!
```

### Proposed Fix:

**Make SMTP Configuration Optional:**

**Option 1: Conditional Transporter Creation (Recommended)**
```javascript
// Create transporter only if SMTP configuration is available
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false, // Use TLS instead of SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}
```

**Option 2: Graceful Email Handling**
```javascript
// In the registration function
if (transporter) {
  try {
    await transporter.sendMail(mailOptions);
    console.log("Acknowledgment Email Sent");
  } catch (emailError) {
    console.error('Failed to send registration email:', emailError);
  }
} else {
  console.log('SMTP not configured, skipping email notification');
}
```

### Files to Modify:
- `bookmynurse-devops/backend/controllers/nursingRegistration.controller.js` - Make SMTP optional

### Expected Outcome:
Once the SMTP configuration is made optional, the backend module should load successfully, and the `/api/register/registrations` endpoint should return proper JSON responses instead of 500 errors.

### Validation Questions for Gemini:
1. Is the root cause analysis correct? Could missing SMTP environment variables cause a 500 error on a GET request to `/registrations`?
2. Does the proposed fix address the actual issue, or are we missing something?
3. Are there any potential side effects or edge cases to consider?
4. Should we also check for other missing environment variables that might cause similar issues?
5. Is there a better approach to handle this, such as using Kubernetes secrets for SMTP configuration?

---

*This phase documents the SMTP configuration issue where missing environment variables are causing the backend controller module to fail, resulting in 500 Internal Server Error on API endpoints.*

---

## PHASE 22: Database Initialization Failed - Tables Still Missing (CURRENT)

### Problem Summary (2025-08-04)
- **✅ SMTP Fix Applied**: Backend no longer crashes on module loading
- **✅ MySQL Pod Ready**: `mysql-deployment-684f6dbb4b-7jr4c` is `1/1` Running
- **✅ ConfigMap Applied**: `mysql-init-scripts` ConfigMap exists and is mounted
- **❌ Database Tables Missing**: `registration` and `images` tables still don't exist
- **❌ API Still Failing**: Endpoint returns `{"success":false,"message":"Error fetching registrations"}`

### Current Terminal Output Analysis:

**Pod Status (All Healthy):**
```bash
root@server:~# kubectl get pods -n bookmynurse
NAME                                   READY   STATUS    RESTARTS   AGE
backend-deployment-58c455d6f-wk2lh     1/1     Running   0          82m
frontend-deployment-84cf999945-xd6mh   1/1     Running   0          82m
mysql-deployment-684f6dbb4b-7jr4c      1/1     Running   0          87s
```

**API Endpoint Test:**
```bash
root@server:~# curl -k https://103.91.186.102:8443/api/register/registrations?approval_status=Approved
{"success":false,"message":"Error fetching registrations"}
```

**Backend Logs (Still Showing Table Missing Error):**
```bash
root@server:~# kubectl logs backend-deployment-58c455d6f-wk2lh -n bookmynurse
Server running on port 30008
Successfully connected to database.
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Database connection is alive
Query error: Error: Table 'bookmynurse.registration' doesn't exist
    at PromisePool.query (/app/node_modules/mysql2/lib/promise/pool.js:36:22)
    at query (/app/config/db.js:87:49)
    at Object.getAllRegistrations (/app/models/nursingRegistration.model.js:106:29)
    at fetchAllRegistrationsNurse (/app/controllers/nursingRegistration.controller.js:116:41)       
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:149:13)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
    at Route.dispatch (/app/router/route.js:119:3)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)        
    at /app/node_modules/express/lib/router/index.js:284:15
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12) {
  code: 'ER_NO_SUCH_TABLE',
  errno: 1146,
  sql: '\n' +
    '        SELECT r.*, \n' +
    '        JSON_UNQUOTE(r.languages) AS languages, \n' +
    '        JSON_UNQUOTE(r.serviceopt) AS serviceopt, \n' +
    '        i.file_path \n' +
    '        FROM registration r \n' +
    '        JOIN images i ON r.image_id = i.id\n' +
    "       WHERE r.approval_status = 'Approved'",
  sqlState: '42S02',
  sqlMessage: "Table 'bookmynurse.registration' doesn't exist"
}
Error fetching registrations: Error: Table 'bookmynurse.registration' doesn't exist
```

**MySQL Pod Details (ConfigMap Mounted):**
```bash
root@server:~# kubectl describe pod mysql-deployment-684f6dbb4b-7jr4c -n bookmynurse
Name:             mysql-deployment-684f6dbb4b-7jr4c
Namespace:        bookmynurse
Status:           Running
Ready:            True
Containers:
  mysql:
    State:          Running
    Ready:          True
    Mounts:
      /docker-entrypoint-initdb.d from mysql-init-scripts (rw)
      /etc/mysql/conf.d from mysql-config (rw)
      /var/lib/mysql from mysql-persistent-storage (rw)
```

### Root Cause Analysis:

**The Issue is Database Initialization Not Running:**

1. **✅ SMTP fix worked** - no more 500 errors, backend responds with JSON
2. **✅ MySQL pod is ready** - `1/1` Running and healthy
3. **✅ ConfigMap is mounted** - `/docker-entrypoint-initdb.d` volume is mounted
4. **❌ Database initialization script didn't run** - tables still don't exist

**Possible Causes:**
- **Persistent Volume Issue**: The MySQL pod might be using an existing persistent volume with old data
- **Initialization Script Not Executed**: The `init-db.sql` script might not have run during MySQL startup
- **Volume Mount Issue**: The ConfigMap might not be properly mounted or accessible

### Required Investigation:

**1. Check if Database Initialization Script Ran:**
```bash
# Connect to MySQL and check if tables exist
kubectl exec -it mysql-deployment-684f6dbb4b-7jr4c -n bookmynurse -- mysql -u root -p
```

**2. Check MySQL Logs for Initialization:**
```bash
# Look for initialization messages in MySQL logs
kubectl logs mysql-deployment-684f6dbb4b-7jr4c -n bookmynurse
```

**3. Check Persistent Volume:**
```bash
# Verify if MySQL is using existing data
kubectl get pvc mysql-pv-claim -n bookmynurse
kubectl describe pv mysql-pv
```

### Questions for Gemini AI:

**File:** `Debug/debug.md` - **Hi Gemini, we have successfully resolved the SMTP configuration issue and the backend is now responding properly with JSON instead of 500 errors. However, we now have a database initialization issue. The MySQL pod is running correctly (`1/1` Ready) and the `mysql-init-scripts` ConfigMap is mounted to `/docker-entrypoint-initdb.d`, but the database tables (`registration` and `images`) still don't exist. The backend logs show "Table 'bookmynurse.registration' doesn't exist" errors. We applied the ConfigMap and restarted the MySQL deployment, but the initialization script doesn't seem to have run. The MySQL pod is using a persistent volume, so it might be reusing old data instead of running the initialization script. Should we check if the MySQL pod is using existing persistent data that's preventing the initialization script from running? Do we need to delete the persistent volume to force a fresh database initialization, or is there another way to trigger the initialization script to run?**

### Proposed Solutions:

**Option 1: Force Fresh Database Initialization**
```bash
# Delete PVC to force fresh initialization
kubectl delete pvc mysql-pv-claim -n bookmynurse
kubectl apply -f bookmynurse-devops/k8s/mysql/pvc.yaml
kubectl rollout restart deployment mysql-deployment -n bookmynurse
```

**Option 2: Manual Database Initialization**
```bash
# Connect to MySQL and manually run the initialization script
kubectl exec -it mysql-deployment-684f6dbb4b-7jr4c -n bookmynurse -- mysql -u root -p bookmynurse < bookmynurse-devops/k8s/mysql/init-configmap.yaml
```

**Option 3: Check MySQL Initialization Logs**
```bash
# Look for initialization messages in MySQL logs
kubectl logs mysql-deployment-684f6dbb4b-7jr4c -n bookmynurse | grep -i "init\|create\|table"
```

### Expected Outcome:
Once the database initialization is properly executed, the `registration` and `images` tables should be created, and the API endpoint should return proper data instead of "Error fetching registrations".

---

*This phase documents the database initialization issue where the MySQL pod is running but the initialization script didn't execute, leaving the required tables missing.*

---

## PHASE 23: PersistentVolume Not Recreated - MySQL Pod Stuck in Pending (CURRENT)

### Problem Summary (2025-08-04)
- **✅ PVC Deleted Successfully**: `mysql-pv-claim` removed from namespace
- **✅ PV Deleted Successfully**: `mysql-pv` removed from cluster
- **✅ Host Data Cleaned**: `/mnt/data/*` directory cleared
- **✅ MySQL Deployment Restarted**: New pod `mysql-deployment-5994d7594b-dj484` created
- **❌ PV Not Recreated**: PersistentVolume not automatically recreated after deletion
- **❌ MySQL Pod Stuck**: Pod stuck in `Pending` status for 5+ minutes

### Terminal Output Analysis
```bash
# Pod Status - Stuck in Pending
mysql-deployment-5994d7594b-dj484      0/1     Pending   0          5m1s

# Pod Description - Shows the exact issue
Warning  FailedScheduling  27s (x2 over 5m55s)  default-scheduler  0/1 nodes are available: persistentvolumeclaim "mysql-pv-claim" not found.

# No PersistentVolume exists
kubectl get pv
No resources found

# No PersistentVolumeClaim exists
kubectl get pvc -n bookmynurse
No resources found in bookmynurse namespace
```

### Root Cause Analysis
The MySQL deployment is trying to create a pod that requires a PersistentVolumeClaim (`mysql-pv-claim`), but:
1. **PVC was deleted** during the cleanup process
2. **PV was deleted** during the cleanup process  
3. **PV was not recreated** - this is the missing step
4. **PVC cannot be bound** without an available PV
5. **Pod cannot be scheduled** without a bound PVC

### Required Solution
The PersistentVolume needs to be manually recreated before the MySQL pod can start. The PV is not automatically recreated when deleted.

### Commands to Fix
```bash
# 1. Recreate the PersistentVolume
kubectl apply -f bookmynurse-devops/k8s/mysql/persistent-volume.yaml

# 2. Verify PV is created
kubectl get pv

# 3. Check if PVC gets bound automatically
kubectl get pvc -n bookmynurse

# 4. Monitor MySQL pod status
kubectl get pods -n bookmynurse -w
```

### Expected Outcome
After recreating the PV:
- ✅ PV should be created and available
- ✅ PVC should be bound automatically
- ✅ MySQL pod should transition from `Pending` to `Running`
- ✅ Database initialization scripts should run
- ✅ Tables should be created successfully

---

## PHASE 24: Database Tables Still Missing - API Endpoint Still Failing (CURRENT)

### Problem Summary (2025-08-04)
- **✅ MySQL Pod Running**: `mysql-deployment-fd986f4d-xzbqs` is `1/1` Running
- **✅ Database Initialized**: Clean directory allowed MySQL to start properly
- **✅ SMTP Fix Applied**: Backend no longer crashes on module loading
- **❌ API Still Failing**: Endpoint returns `{"success":false,"message":"Error fetching registrations"}`
- **❌ Tables Missing**: Database initialization scripts may not have run properly

### Terminal Output Analysis
```bash
# MySQL Pod Status - Successfully Running
mysql-deployment-fd986f4d-xzbqs        1/1     Running   0          2m12s

# API Test - Still Failing
curl -k https://103.91.186.102:8443/api/register/registrations?approval_status=Approved
{"success":false,"message":"Error fetching registrations"}
```

### Root Cause Analysis
The MySQL pod is running successfully, but the API endpoint is still returning the same error. This suggests:
1. **Database initialization scripts didn't run** - The `init-db.sql` script may not have executed
2. **Tables don't exist** - The `registration` and `images` tables are still missing
3. **Backend still getting "Table doesn't exist" errors** - The database schema is not properly initialized

### Required Investigation
We need to verify if the database initialization scripts actually ran and created the required tables.

### Commands to Investigate
```bash
# 1. Check MySQL logs for initialization messages
kubectl logs mysql-deployment-fd986f4d-xzbqs -n bookmynurse

# 2. Connect to MySQL and check if tables exist
kubectl exec -it mysql-deployment-fd986f4d-xzbqs -n bookmynurse -- mysql -u root -p bookmynurse -e "SHOW TABLES;"

# 3. Check backend logs for specific error messages
kubectl logs backend-deployment-58c455d6f-wk2lh -n bookmynurse

# 4. Verify ConfigMap is properly mounted
kubectl describe pod mysql-deployment-fd986f4d-xzbqs -n bookmynurse
```

### Expected Outcome
After investigation, we should either:
- ✅ **Find that tables exist** and debug why the API is still failing
- ❌ **Find that tables don't exist** and manually run the initialization script
- ❌ **Find that ConfigMap is not properly mounted** and fix the mounting issue








