Production Linux Server:
host=103.91.186.102 port=2244
root@server:~# dpkg -l | grep -E "docker|kubelet|kubeadm|kubectl"
root@server:~# sudo ufw status verbose
Status: inactive
root@server:~# cat /etc/os-release
PRETTY_NAME="Ubuntu 22.04.5 LTS"
NAME="Ubuntu"
VERSION_ID="22.04"
VERSION="22.04.5 LTS (Jammy Jellyfish)"
VERSION_CODENAME=jammy
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
UBUNTU_CODENAME=jammy
root@server:~#



Testing Linux Server:
host=192.168.3.194 ansible_port=22
rndvm01@rndvm01:~$ dpkg -l | grep -E "docker|kubelet|kubeadm|kubectl"
rndvm01@rndvm01:~$ sudo ufw status verbose
[sudo] password for rndvm01:
Status: inactive
rndvm01@rndvm01:~$ sudo ufw status verbose
Status: inactive
rndvm01@rndvm01:~$ cat /etc/os-release
PRETTY_NAME="Ubuntu 24.04 LTS"
NAME="Ubuntu"
VERSION_ID="24.04"
VERSION="24.04 LTS (Noble Numbat)"
VERSION_CODENAME=noble
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
UBUNTU_CODENAME=noble
LOGO=ubuntu-logo
rndvm01@rndvm01:~$



## 🔧 DevOps Explained: The `ImagePullBackOff` Error

### The Problem in Simple Terms (The "Why")

Imagine your computer is a big factory. When you run **Kind (Kubernetes in Docker)**, you are building a special, high-tech, isolated clean room inside your factory. This clean room is your **Kubernetes cluster**. It has its own tools and workers, but it's completely sealed off from the rest of the factory for security and consistency.

Meanwhile, in the main factory area (your regular command line), you are building your application "packages" (**Docker images**). Think of these as flat-pack furniture kits (like from IKEA).

The error you saw, `ImagePullBackOff`, is like telling the workers inside the clean room, "Go build the 'backend' furniture," but the furniture kits were never delivered *inside* the clean room. The workers look around, can't find the kits, and after a few tries, they "back off" and report the failure. The cluster (the clean room) doesn't know how to access the main factory floor where the kits are stored.

### The Solution in Simple Terms (The "What")

To fix this, we need to establish a clear delivery process for our furniture kits (Docker images).

1.  **Set Up a Local Warehouse (Docker Registry):** First, we designate a specific spot on the factory floor to be our official "warehouse" for all completed furniture kits. The `local_k8s_setup.sh` script already does this by running a local Docker registry. This registry is our warehouse, located at the address `localhost:5000`.

2.  **Give the Clean Room a Keycard:** This is the crucial step we fixed. The change I made to the `local_k8s_setup.sh` script is like giving the workers in the clean room a special keycard and a note. The note says:
    > "If you ever need a kit from `localhost:5000`, use this keycard. It will grant you access to the warehouse at `http://kind-registry:5000` so you can pick up any kit you need."

    This `containerdConfigPatches` block is that note. It tells the cluster's container system (`containerd`) about our local warehouse and gives it permission to pull from it.

3.  **Rebuild the Clean Room:** This "warehouse access" rule is a fundamental part of the clean room's design. We can't just shout the instructions through the door. We have to tear down the old clean room that didn't have the rule (`kind delete cluster`) and build a brand new one using the updated blueprints that include the rule (`kind create cluster`).

By doing this, when we finally ask the cluster to deploy our application, it knows exactly where to go to "pull" the images, and the deployment succeeds.



## DevOps Concepts for Beginners: A Clear Explanation

Here is a simple breakdown of the technologies we are using and why they are important.

### 1. Docker (The Shipping Container)

-   **What it is:** Docker is a tool that packages an application and all its needs (like code, libraries, and settings) into a single, neat box called a **container**. 
-   **Simple Example:** Imagine your backend code needs Node.js version 18 and a specific library to run. Instead of manually installing Node.js on the server, we put the code and Node.js inside a Docker container. 
-   **Why we use it:** This container can now run on any server that has Docker installed, and it will *always* work the same way. It solves the classic problem of "it works on my machine, but not on the server."

### 2. Kubernetes (The Port Authority / Orchestra Conductor)

-   **What it is:** Now that we have our application in containers, we need someone to manage them. That's Kubernetes. It's like a port authority that manages thousands of shipping containers, or an orchestra conductor telling all the musicians when to play.
-   **Simple Example:** You tell Kubernetes, "I need to run three copies of my backend container." Kubernetes finds space on the server and starts them. If one container crashes, Kubernetes automatically starts a new one to replace it (this is called **self-healing**). If your website gets busy, you can tell Kubernetes, "I need ten copies now," and it will scale up your application instantly.
-   **Why we use it:** It automates everything about running containers, making our application highly reliable and scalable without manual work.

### 3. Ansible (The Server Setup Robot)

-   **What it is:** Ansible is a tool that automates setting up a server. Instead of logging in and typing hundreds of commands by hand to install Docker, set up networking, and configure security, we write all those steps down in a simple file called a **playbook**.
-   **Simple Example:** Our `playbook.yml` file has a list of tasks: "Task 1: Install Docker," "Task 2: Install Kubernetes," "Task 3: Configure the firewall." When we run Ansible, it reads this list and performs each task on the server automatically.
-   **Why we use it:** It makes our server setup 100% repeatable and consistent. If we need to set up a new server, we just run the same playbook, and it will be an identical copy. This is a core concept called **Infrastructure as Code (IaC)**.

### 4. GitHub Actions (The Assembly Line)

-   **What it is:** This is our **CI/CD (Continuous Integration/Continuous Deployment)** pipeline. Think of it as a factory assembly line for our code.
-   **Simple Example:**
    1.  A developer writes new code and pushes it to GitHub.
    2.  GitHub Actions (the assembly line) automatically detects the new code.
    3.  It runs automated tests to make sure the new code didn't break anything (**Continuous Integration**).
    4.  If the tests pass, it automatically builds the new Docker containers.
    5.  Finally, it tells our Kubernetes cluster to deploy the new containers, updating the application with zero downtime (**Continuous Deployment**).
-   **Why we use it:** It completely automates the process from code check-in to deployment, making our releases fast, safe, and reliable.

### 5. Nginx Ingress Controller (The Smart Traffic Cop)

-   **What it is:** Inside our Kubernetes cluster, we have many different services running (frontend, backend, etc.). The Ingress Controller acts as the single entry point for all traffic from the outside world.
-   **Simple Example:** When a user goes to `app.bookmynurse.com`, the request first hits the Ingress Controller. It looks at the URL and decides where to send the traffic. If the URL is `app.bookmynurse.com/api/nurses`, the Ingress sends it to a backend container. If it's just `app.bookmynurse.com`, it sends it to a frontend container.
-   **Why we use it:** It's a smart and flexible reverse proxy that lets us manage all our application's routing from one central place.

---

## From Self-Hosted to Enterprise Cloud: The Next Step

This project is the perfect blueprint for a full-scale, enterprise-grade cloud deployment. The skills and architecture are directly transferable.

**How does this compare to a cloud setup (like AWS, Azure, or Google Cloud)?**

The core technologies we are using (Docker, Kubernetes, Ansible, CI/CD) are exactly the same. The only difference is who manages the underlying hardware and services.

| Our Current Plan (Self-Hosted) | Enterprise Standard (Cloud) | The Key Difference |
| :--- | :--- | :--- |
| A physical Linux server | **AWS (EC2), Azure (VMs), Google Cloud (Compute Engine)** | Instead of your own server, you rent virtual servers from a cloud provider. |
| `kubeadm` to install Kubernetes | **Managed Kubernetes (EKS, AKS, GKE)** | The cloud provider manages the complex parts of Kubernetes for you. You get a ready-to-use cluster with the click of a button. |
| Ansible to provision the server | **Terraform or CloudFormation** | You use a tool like Terraform to define your *entire cloud infrastructure* (servers, networks, databases, load balancers) as code. |
| Local server storage | **Cloud Storage (EBS, Azure Disk, Google Persistent Disk)** | You use the cloud provider's highly reliable, network-attached storage instead of the server's local disk. |

**Why is this project so valuable for your career?**

By building this pipeline on a Linux server from scratch, you are learning how everything works "under the hood." This provides a much deeper level of understanding than just using a simplified cloud console. 

For your interviews, you can confidently state:

> *"I built a complete, production-style DevOps pipeline from scratch on a Linux server. This involved provisioning the Kubernetes cluster with Ansible, containerizing the applications with Docker, and building a full CI/CD workflow with GitHub Actions. This entire architecture is directly transferable to a managed cloud environment like AWS EKS or Google GKE."*

This demonstrates a mastery of the fundamental principles that are in high demand across the industry.

 The short answer is: We will be using Nginx.


  Our Ansible playbook installs a special version of Nginx called the Nginx Ingress Controller      
   inside our Kubernetes cluster. This will completely replace the role of your old Apache
  server.

  Here’s a simple breakdown of what that means.

  What is a Web Server (like Apache or Nginx)?


  At its core, a web server is a program that listens for incoming requests from the internet       
  (like from a user's web browser) and "serves" them the correct content.


   * Your Old Setup (Apache):
       1. A user requests app.bookmynurse.com.
       2. The request hits your server on port 80 or 443.
       3. Apache is listening on those ports. It sees the request and serves the frontend
          files from /var/www/bnm.
       4. If the request is for /api, Apache knows to "proxy" or forward that request to your       
          backend Node.js application running on port 3000.


  Apache was acting as both the file server for your frontend and the reverse proxy for your        
  backend.

  Our New Setup (Nginx Ingress Controller in Kubernetes)

  In our new DevOps practice, we separate these jobs for better scalability and management.


   1. Frontend Container: Your frontend code is now baked into its own Nginx Docker container.      
      This container's only job is to serve the static HTML, CSS, and JavaScript files. It's a      
      tiny, efficient, self-contained web server just for the frontend.

   2. Backend Container: Your backend code runs in its own Node.js container.


   3. Nginx Ingress Controller (The "Smart" Web Server): This is the most important piece. It       
      sits at the very edge of our Kubernetes cluster and acts as the main entry point, just        
      like Apache did. However, it's much more powerful and designed for a containerized
      world.


       * What it does: When a user requests app.bookmynurse.com, the request hits the Ingress       
         Controller. The Ingress Controller doesn't have any files itself. Instead, it reads a      
         set of rules (our Ingress.yaml manifest) and acts as a "smart traffic cop."
       * The Rules:
           * If the request is for the main domain (/), the Ingress forwards the traffic to
             the Frontend Container.
           * If the request is for /api, the Ingress forwards the traffic to the Backend 
             Container.

  Why is this a Better DevOps Practice?


   1. Decoupling: Each part of our application (frontend, backend) is completely independent.       
      We can update, restart, or scale the frontend without ever touching the backend, and
      vice-versa. This is impossible in the old Apache model where everything is configured in      
      one place.


   2. Configuration as Code: We no longer have to log into a server and edit complex Apache
      config files. The routing rules are now in a simple, version-controlled YAML file
      (Ingress.yaml). This is a core principle of modern DevOps.


   3. Automation: Kubernetes can automatically configure the Nginx Ingress Controller. When we      
      deploy a new service, we just give Kubernetes a new Ingress rule, and the routing is set      
      up instantly and automatically.


  In summary: We are replacing the single, manual Apache server with a more powerful, 
  automated system where a dedicated Nginx Ingress Controller directs traffic to specialized,       
  independent containers. This is the standard for building scalable and maintainable web
  applications.

  1. mysql-init-db-configmap.yaml
Purpose:
This file creates a Kubernetes ConfigMap that stores your entire nursingBackend.sql database dump as a configuration object inside the cluster.
Why?
Kubernetes ConfigMaps are used to inject configuration data (like scripts, SQL, or config files) into pods.
By storing your SQL dump in a ConfigMap, you make it available to your MySQL pod at startup, and you keep your database schema/data version-controlled and reproducible.
How is it used?
The ConfigMap is mounted as a file (e.g., /docker-entrypoint-initdb.d/init.sql) inside the MySQL pod, so it can be executed by an initialization process.
2. mysql-deployment.yaml
Purpose:
This file defines the Kubernetes Deployment for your MySQL database, and it is enhanced to include an initContainer that loads your SQL dump into the database before the main MySQL container starts.
Key sections:
initContainers:
Runs a temporary MySQL container that waits for the main MySQL service to be ready, then executes the SQL dump from the ConfigMap to initialize the database.
Ensures your schema and initial data are loaded before the main MySQL container is considered “ready.”
volumes:
Mounts the ConfigMap (from the first file) into the pod so the initContainer can access the SQL file.
main MySQL container:
Starts up with the initialized database, ready for your backend/frontend apps to connect.
Why Two Files?
Separation of Concerns:
The ConfigMap is purely for storing and injecting configuration/data.
The Deployment is for running the actual MySQL database and orchestrating the initialization process.
Reusability & Modularity:
You can update the SQL dump (ConfigMap) without changing the deployment logic.
You can reuse the deployment logic for other environments or with different initialization scripts.
Summary Table
File Name	Purpose
mysql-init-db-configmap.yaml	Stores your SQL dump as a ConfigMap for use in the cluster
mysql-deployment.yaml	Deploys MySQL and uses an initContainer to load the SQL dump
In short:
The ConfigMap holds your SQL data.
The Deployment uses that ConfigMap to initialize the database before MySQL starts serving requests.
This is a Kubernetes-native, best-practice way to ensure your database is always initialized correctly and reproducible!
If you want, I can walk you through the YAMLs line by line or help you with the next steps.


---

## CI/CD Pipeline Flow Reference (BookMyNurse)

- **cicd.yml** in `.github/workflows/` is the starting point for CI/CD. It triggers on every push to main or manual dispatch.
- **Build & Push:**
  - Checks out code, logs in to Docker Hub.
  - Builds backend and frontend Docker images and pushes them to Docker Hub.
- **Deploy:**
  - Installs Ansible, sets up SSH, and runs an Ansible playbook on the target server.
  - The playbook provisions the server, pulls the latest Docker images, and starts/restarts containers.
  - If configured, the playbook also sets up MySQL and can import a SQL dump for database initialization.
- **MySQL:**
  - The workflow itself does not build a MySQL Docker image or directly initialize the database.
  - MySQL setup and initialization (including importing a dump) are handled by the Ansible playbook, if scripted.
- **Nginx & Routing:**
  - The frontend container uses Nginx to serve static files and reverse proxy API calls to the backend container.
- **Kubernetes (if used):**
  - MySQL initialization can be handled via ConfigMap and initContainer in Kubernetes manifests.

**Summary:**
- cicd.yml is the entry point for CI/CD, building and pushing Docker images.
- Ansible handles deployment and infrastructure setup, including MySQL if scripted.
- MySQL dump is initialized only if the playbook or K8s manifests include those steps.
- This flow is a modern DevOps best practice and is directly transferable to cloud environments.

1. What cicd.yml Does (Your GitHub Actions Workflow)
Trigger:
The workflow in .github/workflows/cicd.yml is triggered on every push to the main branch or when you manually run it (workflow_dispatch).
Build and Push Docker Images:
It checks out your code.
Logs in to Docker Hub using your secrets.
Builds the backend Docker image from ./backend/Dockerfile and pushes it to Docker Hub as emmamyers/bmn-backend:latest.
Builds the frontend Docker image from ./frontend/Dockerfile and pushes it to Docker Hub as emmamyers/bmn-frontend:latest.
Deploy:
Installs Ansible and sets up SSH to your server.
Runs an Ansible playbook (provided via GitHub Secrets) to deploy your application to your testing or production server, depending on the workflow input.


2. What About MySQL?
The workflow itself does not build a MySQL Docker image or directly initialize a MySQL database.
Instead, the Ansible playbook (referenced in the deploy job) is responsible for provisioning the server, which may include:
Setting up MySQL (installing, configuring, starting the service).
Importing your MySQL dump (if the playbook is written to do so).
Setting up environment variables or secrets for the backend to connect to MySQL.
So:
The MySQL database is handled by your Ansible playbook, not by the Docker build steps in cicd.yml.
The backend Docker image expects to connect to a MySQL database, which should already be running and initialized (possibly with your dump) by the time the backend container starts.

3. The Flow in Simple Steps
Code push or manual trigger starts the workflow.
GitHub Actions:
Builds and pushes backend and frontend Docker images to Docker Hub.
Ansible (via deploy job):
Connects to your server via SSH.
Runs the playbook to:
Pull the latest Docker images.
Start/restart the backend and frontend containers.
(If configured) Set up MySQL and import your dump.
Nginx (in frontend container) reverse proxies API calls to the backend container.
Backend connects to MySQL using credentials/secrets set up by Ansible or environment variables.


1. How Secrets and Credentials Work in Your Pipeline
GitHub Secrets are stored in your GitHub repository (or organization) and are used by GitHub Actions workflows.
These secrets include things like:
SSH private keys (for connecting to your servers)
Docker Hub credentials (for pushing images)
MySQL passwords
Ansible inventory and playbook content
When your workflow runs, it injects these secrets into the runner environment, so only your workflow (and not the public) can access them.
2. Why Only Your GitHub Account Can Deploy to Testing
The SSH key and other secrets you added to GitHub are tied to your personal GitHub account and your testing server.
The public part of your SSH key is on the testing server’s authorized_keys, so only your GitHub Actions (from your account) can SSH in and deploy.
This is secure for testing, but not ideal for production

3. What to Do for Production Deployments
Best Practice:
Use a dedicated company GitHub account or organization for production.
This account should own the production repository and manage production secrets.
Only trusted team members should have access.
Store production secrets in the production repo’s GitHub Secrets.
These should be different from your testing secrets (different SSH keys, different MySQL passwords, etc.).
On the production server:
Add the public SSH key from the production GitHub account to the server’s authorized_keys.
Make sure only the production GitHub Actions workflow can SSH in and deploy.
4. Why This Matters
Separation of environments: Testing and production should have separate credentials, secrets, and access controls. This prevents accidental or malicious changes to production from a personal or less-secure account.
Auditability and security: Using a company account/organization for production means you can control who has access, rotate secrets, and audit deployments.
Compliance: Many companies require production credentials to be managed centrally, not by individuals.

5. Summary Table

| Environment | GitHub Account         | Secrets Location         | Server SSH Key         | Who Can Deploy?         |
|-------------|-----------------------|-------------------------|------------------------|-------------------------|
| Testing     | Your personal account | Repo’s GitHub Secrets   | Your public key        | Only you (or team)      |
| Production  | Company/org account   | Production repo secrets | Company/org public key | Only company workflows  |

6. What You Should Do for Production
Create a company GitHub account or organization.
Create a production repository (or use a private repo in the org).
Generate a new SSH keypair for production deployments.
Add the public key to the production server’s authorized_keys.
Add the private key and other production secrets to the production repo’s GitHub Secrets.
Update your GitHub Actions workflow to use these secrets.
Test the deployment from the company account to the production server.


---

## Explanation of `cicd.yml` Workflow

This `cicd.yml` file defines a GitHub Actions workflow for the BookMyNurse application, orchestrating its Continuous Integration (CI) and Continuous Deployment (CD) processes.

Here's an elaborate breakdown:

1.  **`name: BookMyNurse CI/CD`**:
    *   This simply gives a human-readable name to your workflow, which appears in the GitHub Actions UI.

2.  **`on:`**:
    *   This section defines when the workflow will be triggered.
    *   **`push:`**:
        *   `branches: - main`: The workflow automatically runs whenever code is pushed to the `main` branch of your repository. This is the typical CI trigger.
    *   **`workflow_dispatch:`**:
        *   This allows you to manually trigger the workflow from the GitHub Actions UI.
        *   `inputs:`: It defines input parameters for the manual trigger.
            *   `environment`: This is a required dropdown input that lets you choose the deployment environment (`testing` or `production`) when manually triggering the workflow. It defaults to `testing`. This is crucial for deploying to different target environments.

3.  **`jobs:`**:
    *   Workflows are composed of one or more jobs that run in parallel by default, or sequentially if dependencies are defined.

    *   **`build-and-push` job**:
        *   **Purpose**: This job is responsible for building the Docker images for both the backend and frontend applications and pushing them to Docker Hub.
        *   `runs-on: ubuntu-latest`: Specifies that this job will run on a fresh Ubuntu Linux virtual machine hosted by GitHub.
        *   `steps:`: A sequence of tasks to be executed within this job.
            *   `name: Checkout`, `uses: actions/checkout@v3`: This step checks out your repository's code onto the runner, making it available for subsequent steps (like building Docker images).
            *   `name: Set up QEMU`, `uses: docker/setup-qemu-action@v2`: QEMU is a generic processor emulator. This action sets it up to enable Docker Buildx to build images for multiple architectures (e.g., ARM, AMD64), though in this specific workflow, it's primarily a prerequisite for `setup-buildx-action`.
            *   `name: Set up Docker Buildx`, `uses: docker/setup-buildx-action@v2`: Docker Buildx is a Docker CLI plugin that extends the `docker build` command with powerful features like building for multiple platforms, caching, and more. This step initializes it.
            *   `name: Login to Docker Hub`, `uses: docker/login-action@v2`: This step securely logs into Docker Hub using credentials stored as GitHub Secrets (`DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`). This is necessary to push your built images to your Docker Hub repository.
            *   `name: Build and push backend`, `uses: docker/build-push-action@v4`:
                *   `context: ./backend`: Specifies the build context (the directory containing the `Dockerfile` and application code) for the backend.
                *   `file: ./backend/Dockerfile`: Points to the specific Dockerfile for the backend.
                *   `push: true`: Instructs the action to push the built image to Docker Hub.
                *   `tags: emmamyers/bmn-backend:latest`: Defines the tag for the Docker image. It will be pushed to `docker.io/emmamyers/bmn-backend` with the `latest` tag.
            *   `name: Build and push frontend`, `uses: docker/build-push-action@v4`: Similar to the backend, this step builds and pushes the frontend Docker image (`emmamyers/bmn-frontend:latest`) using its respective Dockerfile and context.

    *   **`deploy` job**:
        *   **Purpose**: This job takes the newly built Docker images and deploys them to your target server(s) using Ansible.
        *   `runs-on: ubuntu-latest`: This job also runs on an Ubuntu Linux virtual machine.
        *   `needs: build-and-push`: This is a crucial dependency. The `deploy` job will **only start after** the `build-and-push` job has successfully completed. This ensures that the Docker images are available before deployment attempts.
        *   `steps:`:
            *   `name: Checkout`, `uses: actions/checkout@v3`: Checks out the repository again. This is important because each job runs on a fresh runner, so the code needs to be checked out for the `deploy` job to access the Ansible playbooks and inventory.
            *   `name: Install Ansible`:
                *   `run: | ...`: Executes shell commands to update the package list and install Ansible on the runner.
            *   `name: Set up SSH agent`, `uses: webfactory/ssh-agent@v0.7.0`: This action sets up an SSH agent on the runner and adds your `SSH_PRIVATE_KEY` (retrieved from GitHub Secrets) to it. This allows Ansible to securely connect to your remote servers without requiring passwords.
            *   `name: Write extra vars file`:
                *   `env:`: Defines environment variables that will be available within this step.
                    *   `ENVIRONMENT`: Gets the value from the `workflow_dispatch` input (if manually triggered) or defaults to `testing`.
                    *   `MYSQL_ROOT_PASSWORD`, `MYSQL_APP_PASSWORD`: Retrieves sensitive database passwords from GitHub Secrets.
                *   `run: | ...`: This shell script creates a YAML file named `extra-vars.yml`. This file contains variables (`mysql_root_password`, `mysql_app_password`, `target_host_group`) that Ansible will use during the deployment. The use of `cat <<EOF ... EOF` is a robust way to write multi-line content, especially when variables might contain special characters.
            *   `name: Run Ansible playbook`:
                *   `env: ANSIBLE_HOST_KEY_CHECKING: false`: This environment variable disables SSH host key checking for Ansible. While convenient for CI/CD, it's generally recommended to manage host keys properly in production environments for security.
                *   `run: | ...`: This command executes your Ansible playbook:
                    *   `ansible-playbook`: The command to run an Ansible playbook.
                    *   `-i ansible/ansible_inventory.txt`: Specifies the inventory file that defines your target hosts (e.g., `testing` and `production` servers). This file is expected to be in the `ansible/` directory of your repository.
                    *   `ansible/ansible_playbook.txt`: Specifies the main Ansible playbook file to execute, also expected in the `ansible/` directory.
                    *   `--extra-vars "@extra-vars.yml"`: Passes the variables defined in the `extra-vars.yml` file (created in the previous step) to the Ansible playbook. This allows the playbook to dynamically adjust its behavior based on the chosen environment and sensitive credentials.

In summary, this `cicd.yml` workflow automates the entire process from code push to deployment. It ensures that your application's Docker images are always up-to-date on Docker Hub and that deployments to your servers are consistent and automated using Ansible.