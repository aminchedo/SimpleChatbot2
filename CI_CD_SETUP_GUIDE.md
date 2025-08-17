# GitLab CI/CD Setup Guide for Persian AI Chatbot

This guide will help you set up the complete CI/CD pipeline for the Persian AI Chatbot with automatic dependency installation and deployment.

## 🚀 Quick Start

1. **Copy the environment file**: `cp .env.example .env`
2. **Configure your variables** in `.env` and GitLab CI/CD settings
3. **Push to GitLab** and the pipeline will automatically start
4. **Deploy to staging/production** using the manual deployment jobs

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [GitLab CI/CD Variables](#gitlab-cicd-variables)
- [Pipeline Stages](#pipeline-stages)
- [Environment Configuration](#environment-configuration)
- [Deployment Process](#deployment-process)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🛠 Prerequisites

### Required Software on Deployment Servers

- **Docker** (will be auto-installed by the pipeline)
- **Docker Compose** (will be auto-installed by the pipeline)
- **SSH access** configured
- **Sudo privileges** for the deployment user

### GitLab Runner Requirements

- GitLab Runner with Docker executor
- At least 4GB RAM for building images
- Docker-in-Docker (dind) capability

## 🔐 GitLab CI/CD Variables

Configure these variables in your GitLab project: **Settings > CI/CD > Variables**

### 🔑 Registry and Authentication

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `CI_REGISTRY` | GitLab Container Registry URL | ✅ | `registry.gitlab.com` |
| `CI_REGISTRY_IMAGE` | Your project's registry image | ✅ | `registry.gitlab.com/group/project` |
| `CI_REGISTRY_USER` | Registry username | ✅ | `gitlab-ci-token` |
| `CI_REGISTRY_PASSWORD` | Registry password | ✅ | `$CI_JOB_TOKEN` |

### 🌐 Deployment Servers

#### Staging Environment

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `STAGING_SERVER` | Staging server hostname/IP | ✅ | `staging.yourdomain.com` |
| `STAGING_USER` | SSH username for staging | ✅ | `deploy` |
| `STAGING_PATH` | Deployment path on staging | ✅ | `/opt/persian-chatbot` |
| `STAGING_URL` | Staging application URL | ✅ | `https://staging.yourdomain.com` |

#### Production Environment

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PRODUCTION_SERVER` | Production server hostname/IP | ✅ | `production.yourdomain.com` |
| `PRODUCTION_USER` | SSH username for production | ✅ | `deploy` |
| `PRODUCTION_PATH` | Deployment path on production | ✅ | `/opt/persian-chatbot` |
| `PRODUCTION_URL` | Production application URL | ✅ | `https://yourdomain.com` |

### 🔐 SSH Configuration

| Variable | Description | Required | Type |
|----------|-------------|----------|------|
| `SSH_PRIVATE_KEY` | Base64 encoded SSH private key | ✅ | File |

#### How to generate SSH_PRIVATE_KEY:

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "gitlab-ci@yourdomain.com" -f gitlab_ci_key

# Copy public key to your servers
ssh-copy-id -i gitlab_ci_key.pub deploy@staging.yourdomain.com
ssh-copy-id -i gitlab_ci_key.pub deploy@production.yourdomain.com

# Base64 encode the private key for GitLab CI/CD
base64 -w 0 gitlab_ci_key > gitlab_ci_key_base64.txt
# Copy the contents of gitlab_ci_key_base64.txt to SSH_PRIVATE_KEY variable
```

### 🤖 AI Service Configuration (Optional)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `HUGGINGFACE_API_KEY` | Hugging Face API key | ⚠️ | `hf_xxxxxxxxxxxxxxxxx` |
| `OPENAI_API_KEY` | OpenAI API key | ⚠️ | `sk-xxxxxxxxxxxxxxxx` |

## 🔄 Pipeline Stages

### 1. 📦 Prepare Stage
**Automatically installs all dependencies**

- **`prepare_frontend_dependencies`**: Installs Node.js dependencies with npm ci
- **`prepare_backend_dependencies`**: Creates Python virtual environment and installs requirements

**Features:**
- ✅ Comprehensive error handling with retries
- ✅ Advanced caching for faster subsequent builds
- ✅ System dependency auto-installation
- ✅ Verification of successful installation

### 2. ✅ Validate Stage
**Ensures all dependencies are properly installed**

- **`validate_dependencies`**: Verifies node_modules and virtual environment exist

### 3. 🧪 Test Stage
**Runs comprehensive testing**

- **`test_frontend`**: Linting, type checking, unit tests, and build verification
- **`test_backend`**: Code quality checks, security scans, and unit tests

**Services automatically started:**
- Redis for caching tests
- PostgreSQL for database tests

### 4. 🔒 Security Stage
**Comprehensive security scanning**

- **`security_scan`**: 
  - Frontend: npm audit
  - Backend: safety check, bandit security scan
  - Docker: Dockerfile linting with hadolint

### 5. 🏗️ Build Stage
**Docker image building with dependency caching**

- **`build_docker_image`**: 
  - Multi-stage Docker build
  - BuildKit for optimal caching
  - Security scanning with Trivy
  - Automatic registry push

### 6. 🚀 Deploy Stage
**Automated deployment with health checks**

- **`deploy_staging`**: Automatic deployment to staging (develop branch)
- **`deploy_production`**: Manual deployment to production (main branch)

**Deployment Features:**
- ✅ Automatic Docker/Docker Compose installation
- ✅ Zero-downtime rolling updates
- ✅ Comprehensive health checks with retries
- ✅ Automatic rollback on failure
- ✅ Backup creation before deployment

### 7. 📢 Notify Stage
**Deployment notifications and cleanup**

- **`notify_success`**: Success notifications
- **`notify_failure`**: Failure notifications  
- **`cleanup`**: Resource cleanup

## 🌍 Environment Configuration

### Development Environment

```bash
# Local development
docker-compose up --build

# Or build specific stage
docker build --target development .
```

### Staging Environment

- **Trigger**: Automatic on push to `develop` branch
- **URL**: Configured via `STAGING_URL` variable
- **Features**: Full production simulation with debug enabled

### Production Environment

- **Trigger**: Manual deployment from `main` branch
- **URL**: Configured via `PRODUCTION_URL` variable
- **Features**: Optimized performance, security hardened, monitoring enabled

## 🚀 Deployment Process

### Staging Deployment (Automatic)

1. Push changes to `develop` branch
2. Pipeline automatically runs all stages
3. If all tests pass, deploys to staging
4. Health checks verify deployment success
5. Notification sent on completion

### Production Deployment (Manual)

1. Merge `develop` into `main` branch
2. Pipeline runs prepare, test, security, and build stages
3. **Manual approval required** for production deployment
4. Click "Deploy to Production" in GitLab pipeline
5. Automatic backup creation
6. Zero-downtime rolling update
7. Comprehensive health checks
8. Automatic rollback if health checks fail

## 🔧 Server Setup

### Staging Server Setup

```bash
# Create deployment user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy

# Create application directory
sudo mkdir -p /opt/persian-chatbot
sudo chown deploy:deploy /opt/persian-chatbot

# Configure SSH key access
sudo -u deploy mkdir -p /home/deploy/.ssh
# Add your public key to /home/deploy/.ssh/authorized_keys
```

### Production Server Setup

```bash
# Same as staging, but with additional security
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Install fail2ban for SSH protection
sudo apt-get install fail2ban

# Configure firewall rules for your specific needs
```

## 🐛 Troubleshooting

### Common Issues

#### 1. **Dependency Installation Fails**

```bash
# Check the prepare stage logs
# Common fixes:
- Increase runner memory (minimum 4GB recommended)
- Check if requirements.txt/package.json exists
- Verify system dependencies are available
```

#### 2. **Docker Build Fails**

```bash
# Enable BuildKit debugging
DOCKER_BUILDKIT=1 docker build --progress=plain .

# Common fixes:
- Clear Docker cache: docker builder prune
- Check Dockerfile syntax
- Verify base image availability
```

#### 3. **Deployment Fails**

```bash
# Check SSH connectivity
ssh -i your_key deploy@your_server "docker --version"

# Common fixes:
- Verify SSH_PRIVATE_KEY is correctly base64 encoded
- Check server has sufficient disk space
- Ensure Docker daemon is running on target server
```

#### 4. **Health Checks Fail**

```bash
# Debug health check endpoints
curl -f http://your_server:8000/health
curl -f http://your_server/

# Common fixes:
- Check application logs: docker-compose logs
- Verify environment variables are set
- Ensure required services (Redis, DB) are running
```

### Debug Commands

```bash
# Check pipeline logs in GitLab
# Navigate to: Project > CI/CD > Pipelines > [Pipeline] > [Job]

# Local debugging
docker-compose -f docker-compose.yml logs

# Check container health
docker-compose ps
docker inspect container_name

# SSH into deployment server
ssh deploy@your_server
cd /opt/persian-chatbot
docker-compose logs --tail=50
```

## ✨ Best Practices

### 🔐 Security

1. **Never commit sensitive data** to repository
2. **Use GitLab CI/CD variables** for all secrets
3. **Regularly rotate SSH keys** and API tokens
4. **Enable 2FA** on GitLab account
5. **Use least privilege principle** for deployment users

### 🚀 Performance

1. **Use Docker layer caching** effectively
2. **Keep Docker images small** with multi-stage builds
3. **Cache dependencies** between pipeline runs
4. **Use specific version tags** instead of `latest`
5. **Monitor resource usage** on runners

### 🔄 Deployment

1. **Always test in staging** before production
2. **Use feature branches** for development
3. **Tag releases** for easy rollbacks
4. **Monitor deployments** with health checks
5. **Have rollback procedures** documented

### 📊 Monitoring

1. **Set up application monitoring** (logs, metrics)
2. **Configure alerting** for critical issues
3. **Monitor pipeline performance** and optimize
4. **Track deployment success rates**
5. **Review security scan results** regularly

## 🆘 Support

### Getting Help

1. **Check pipeline logs** first
2. **Review this documentation**
3. **Search GitLab issues** for similar problems
4. **Contact the development team**

### Useful Links

- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 📝 Pipeline Configuration Summary

```yaml
# Pipeline triggers:
- Merge Requests: Full pipeline except deployment
- develop branch: Full pipeline + staging deployment
- main branch: Full pipeline + manual production deployment
- feature/* branches: Full pipeline except deployment

# Automatic features:
✅ Dependency installation with retries
✅ Comprehensive testing and security scanning
✅ Docker image building with caching
✅ Health checks with automatic rollback
✅ Backup creation before deployment
✅ Resource cleanup after pipeline completion
```

---

## 🎉 You're All Set!

Your CI/CD pipeline is now configured to:

1. **Automatically install all dependencies** when code is pushed
2. **Run comprehensive tests** and security scans
3. **Build optimized Docker images** with caching
4. **Deploy to staging automatically** on develop branch
5. **Deploy to production manually** with approval on main branch
6. **Monitor health** and rollback automatically on failure

Push your code to GitLab and watch the magic happen! 🚀