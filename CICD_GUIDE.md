# 🔄 CI/CD Pipeline Guide

Complete guide to setting up Continuous Integration and Continuous Deployment for SkyNest Hotels.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [GitHub Actions Setup](#github-actions-setup)
3. [Docker Hub Deployment](#docker-hub-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Azure Deployment](#azure-deployment)
6. [Environment Variables](#environment-variables)
7. [Testing Strategy](#testing-strategy)

---

## Overview

### CI/CD Workflow

```
┌─────────────┐
│  Git Push   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ GitHub      │
│ Actions     │
│ Triggered   │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐ ┌──────────┐
│  Build   │ │   Test   │
│  Docker  │ │  Suite   │
│  Images  │ │          │
└────┬─────┘ └────┬─────┘
     │            │
     │     ┌──────┘
     │     │
     ▼     ▼
┌─────────────┐
│   Deploy    │
│ Production  │
└─────────────┘
```

---

## GitHub Actions Setup

### Step 1: Create Workflow Directory

```bash
mkdir -p .github/workflows
```

### Step 2: Create CI/CD Workflow File

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  DOCKER_IMAGE_BACKEND: skynest/backend
  DOCKER_IMAGE_FRONTEND: skynest/frontend
  NODE_VERSION: '18'

jobs:
  # ============================================
  # JOB 1: Test Backend
  # ============================================
  test-backend:
    name: Test Backend
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: testpassword
          MYSQL_DATABASE: skynest_hotels_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Setup test database
        run: |
          mysql -h 127.0.0.1 -u root -ptestpassword skynest_hotels_test < database/schema.sql
          mysql -h 127.0.0.1 -u root -ptestpassword skynest_hotels_test < database/procedures.sql
          mysql -h 127.0.0.1 -u root -ptestpassword skynest_hotels_test < database/triggers.sql
      
      - name: Run tests
        working-directory: ./backend
        env:
          DB_HOST: 127.0.0.1
          DB_USER: root
          DB_PASSWORD: testpassword
          DB_NAME: skynest_hotels_test
          JWT_SECRET: test_secret_key
        run: npm test
  
  # ============================================
  # JOB 2: Test Frontend
  # ============================================
  test-frontend:
    name: Test Frontend
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run linter
        working-directory: ./frontend
        run: npm run lint || true
      
      - name: Build frontend
        working-directory: ./frontend
        run: npm run build
  
  # ============================================
  # JOB 3: Build and Push Docker Images
  # ============================================
  build-and-push:
    name: Build and Push Docker Images
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.backend
          push: true
          tags: |
            ${{ env.DOCKER_IMAGE_BACKEND }}:latest
            ${{ env.DOCKER_IMAGE_BACKEND }}:${{ github.sha }}
          cache-from: type=registry,ref=${{ env.DOCKER_IMAGE_BACKEND }}:buildcache
          cache-to: type=registry,ref=${{ env.DOCKER_IMAGE_BACKEND }}:buildcache,mode=max
      
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.frontend
          push: true
          tags: |
            ${{ env.DOCKER_IMAGE_FRONTEND }}:latest
            ${{ env.DOCKER_IMAGE_FRONTEND }}:${{ github.sha }}
          cache-from: type=registry,ref=${{ env.DOCKER_IMAGE_FRONTEND }}:buildcache
          cache-to: type=registry,ref=${{ env.DOCKER_IMAGE_FRONTEND }}:buildcache,mode=max
  
  # ============================================
  # JOB 4: Deploy to Production
  # ============================================
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/skynest
            docker-compose pull
            docker-compose up -d
            docker system prune -f
```

### Step 3: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `yourusername` |
| `DOCKER_PASSWORD` | Docker Hub password/token | `dckr_pat_xxxxx` |
| `DEPLOY_HOST` | Production server IP | `203.0.113.1` |
| `DEPLOY_USER` | SSH username | `ubuntu` |
| `DEPLOY_SSH_KEY` | Private SSH key | `-----BEGIN RSA...` |

---

## Docker Hub Deployment

### Step 1: Create Docker Hub Account

1. Go to https://hub.docker.com/
2. Sign up for free account
3. Create repository: `skynest/backend`
4. Create repository: `skynest/frontend`

### Step 2: Generate Access Token

1. Docker Hub → Account Settings → Security
2. Click "New Access Token"
3. Name: `GitHub Actions`
4. Permissions: `Read, Write, Delete`
5. Copy token (save it, shown only once)

### Step 3: Test Local Build

```bash
# Build images
docker build -f Dockerfile.backend -t skynest/backend:latest .
docker build -f Dockerfile.frontend -t skynest/frontend:latest .

# Test locally
docker-compose up

# Push to Docker Hub
docker login
docker push skynest/backend:latest
docker push skynest/frontend:latest
```

---

## AWS Deployment

### Option 1: AWS EC2

**Step 1: Launch EC2 Instance**

```bash
# Instance type: t2.medium or larger
# OS: Ubuntu 22.04 LTS
# Security Group: Allow ports 22, 80, 443, 3306, 5000
```

**Step 2: Connect and Setup**

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/yourusername/skynestwindsurf.git
cd skynestwindsurf

# Setup environment
cp .env.docker .env
nano .env  # Edit with production values

# Start services
docker-compose up -d
```

**Step 3: Setup Domain (Optional)**

```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Configure reverse proxy
sudo nano /etc/nginx/sites-available/skynest

# Add configuration:
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/skynest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 2: AWS ECS (Elastic Container Service)

**Step 1: Create ECS Cluster**

```bash
# Using AWS CLI
aws ecs create-cluster --cluster-name skynest-cluster
```

**Step 2: Create Task Definition**

Create `ecs-task-definition.json`:

```json
{
  "family": "skynest-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "skynest/backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."}
      ]
    },
    {
      "name": "frontend",
      "image": "skynest/frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ]
    }
  ]
}
```

**Step 3: Create Service**

```bash
aws ecs create-service \
  --cluster skynest-cluster \
  --service-name skynest-service \
  --task-definition skynest-app \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

---

## Azure Deployment

### Option 1: Azure Container Instances

```bash
# Login to Azure
az login

# Create resource group
az group create --name skynest-rg --location eastus

# Create container group
az container create \
  --resource-group skynest-rg \
  --name skynest-app \
  --image skynest/backend:latest \
  --dns-name-label skynest-unique \
  --ports 5000 80 \
  --environment-variables \
    NODE_ENV=production \
  --secure-environment-variables \
    DB_PASSWORD=your_password \
    JWT_SECRET=your_secret
```

### Option 2: Azure App Service

```bash
# Create App Service plan
az appservice plan create \
  --name skynest-plan \
  --resource-group skynest-rg \
  --is-linux \
  --sku B1

# Create web app
az webapp create \
  --resource-group skynest-rg \
  --plan skynest-plan \
  --name skynest-app \
  --deployment-container-image-name skynest/backend:latest

# Configure app settings
az webapp config appsettings set \
  --resource-group skynest-rg \
  --name skynest-app \
  --settings \
    NODE_ENV=production \
    DB_HOST=your-db-host \
    DB_USER=your-db-user
```

---

## Environment Variables

### Production Environment Variables

Create `.env.production`:

```env
# Database
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-secure-password
DB_NAME=skynest_hotels
DB_PORT=3306

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Email (if implemented)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Managing Secrets

**Option 1: AWS Secrets Manager**

```bash
# Store secret
aws secretsmanager create-secret \
  --name skynest/db-password \
  --secret-string "your-password"

# Retrieve in application
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const secret = await secretsManager.getSecretValue({SecretId: 'skynest/db-password'}).promise();
```

**Option 2: Azure Key Vault**

```bash
# Create key vault
az keyvault create \
  --name skynest-vault \
  --resource-group skynest-rg

# Store secret
az keyvault secret set \
  --vault-name skynest-vault \
  --name db-password \
  --value "your-password"
```

**Option 3: Docker Secrets**

```bash
# Create secret
echo "your-password" | docker secret create db_password -

# Use in docker-compose.yml
services:
  backend:
    secrets:
      - db_password
secrets:
  db_password:
    external: true
```

---

## Testing Strategy

### Unit Tests

Create `backend/tests/unit/auth.test.js`:

```javascript
const { login } = require('../../controllers/authController');

describe('Auth Controller', () => {
  test('should login with valid credentials', async () => {
    // Test implementation
  });
  
  test('should reject invalid credentials', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Create `backend/tests/integration/booking.test.js`:

```javascript
const request = require('supertest');
const app = require('../../server');

describe('Booking API', () => {
  test('POST /api/bookings should create booking', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send({
        guest_id: 1,
        room_id: 101,
        check_in_date: '2025-01-15',
        check_out_date: '2025-01-18'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Add Test Scripts

In `backend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0"
  }
}
```

---

## Monitoring and Logging

### Add Health Check Endpoint

In `backend/server.js`:

```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

### Setup Logging

```bash
npm install winston
```

Create `backend/config/logger.js`:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

---

## Rollback Strategy

### Quick Rollback

```bash
# Rollback to previous version
docker-compose down
docker-compose pull
docker tag skynest/backend:previous skynest/backend:latest
docker tag skynest/frontend:previous skynest/frontend:latest
docker-compose up -d
```

### Database Rollback

```bash
# Restore from backup
mysql -u root -p skynest_hotels < backup_YYYYMMDD.sql
```

---

## Summary

### CI/CD Checklist

- ✅ GitHub Actions workflow configured
- ✅ Docker images build automatically
- ✅ Tests run on every push
- ✅ Automatic deployment to production
- ✅ Environment variables secured
- ✅ Health checks implemented
- ✅ Logging configured
- ✅ Rollback strategy defined

### Deployment Options

1. **Docker Compose** - Simple, single server
2. **AWS EC2** - Full control, scalable
3. **AWS ECS** - Managed containers
4. **Azure Container Instances** - Serverless containers
5. **Azure App Service** - Fully managed

---

**Your CI/CD pipeline is ready! 🚀**
