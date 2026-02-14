# 🚀 ExpiryTracker Docker Deployment Guide

## 📋 **Prerequisites**

- **Docker Desktop** installed and running
- **Git** for cloning the repository
- **Command line/terminal** access

## ⚡ **Quick Start - 5 Minute Deployment**

### **Step 1: Clone & Setup**
```bash
git clone <your-repo-url> expirytracker
cd expirytracker
```

### **Step 2: Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit with your secure values (required!)
notepad .env  # Windows
# or
nano .env      # Mac/Linux
```

**Important - Set These Values:**
- `MONGO_INITDB_ROOT_PASSWORD` - Secure MongoDB password
- `JWT_SECRET` - Minimum 32 characters, random string

### **Step 3: Deploy All Services**
```bash
# Build and start all containers
docker-compose up -d

# Check service status
docker-compose ps
```

### **Step 4: Verify Deployment**
- **Frontend:** http://localhost (main app)
- **Backend API:** http://localhost/api
- **OCR Service:** http://localhost:5001/health

## 🔧 **Service Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │   OCR Service   │
│   (Next.js)     │◄──►│   (Express)     │◄──►│  (Smart OCR)    │
│   Port 80       │    │   Port 5000     │    │   Port 5001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    MongoDB      │    │     Redis       │
│  (Proxy/Router) │    │   (Database)    │    │    (Cache)      │
│   Port 80       │    │   Port 27017    │    │   Port 6379     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 **Container Services**

| Service | Port | Purpose | Health Check |
|---------|------|---------|-------------|
| **nginx** | 80 | Reverse proxy & load balancer | ✅ |
| **frontend** | 3000 | Next.js web application | ✅ |
| **backend** | 5000 | Express API server | ✅ |
| **ocr-service** | 5001 | Smart OCR detection | ✅ |
| **mongodb** | 27017 | NoSQL database | ✅ |
| **redis** | 6379 | Cache & session storage | ✅ |

## 🛠️ **Management Commands**

### **Service Control**
```bash
# Start all services
docker-compose up -d

# Stop all services  
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f ocr-service
```

### **Database Management**
```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh

# Access Redis CLI
docker-compose exec redis redis-cli

# Backup MongoDB
docker-compose exec mongodb mongodump --out /backup

# Restore MongoDB
docker-compose exec mongodb mongorestore /backup
```

### **Maintenance**
```bash
# Clean up unused images
docker image prune -f

# Update all images
docker-compose pull

# Restart specific service
docker-compose restart backend
```

## 📝 **Configuration Options**

### **OCR Detection Settings**
```yaml
# In docker-compose.yml or environment
OCR_CONFIDENCE_THRESHOLD=0.85  # Auto-set threshold (0.0-1.0)
TESSDATA_PREFIX=./tessdata     # Tesseract data location
```

### **Performance Tuning**
```yaml
# Memory limits (in docker-compose.yml)
services:
  ocr-service:
    mem_limit: 2g
    cpus: 1.0
  backend:
    mem_limit: 1g
    cpus: 0.5
```

### **Security Settings**
```bash
# Generate secure JWT secret (32+ chars)
openssl rand -base64 32

# Generate MongoDB password
openssl rand -base64 16
```

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

#### **Port Conflicts**
```bash
# Check what's using ports
netstat -ano | findstr :80
netstat -ano | findstr :5000

# Kill processes using ports
taskkill //F //PID <PID>
```

#### **Container Startup Issues**
```bash
# View detailed logs
docker-compose logs service-name

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart service-name
```

#### **Database Connection Issues**
```bash
# Verify MongoDB is running
docker-compose exec mongodb mongosh --eval "db.adminCommand('ismaster')"

# Check network connectivity
docker network ls
docker network inspect expirytracker_expirytracker-network
```

#### **OCR Service Issues**
```bash
# Test OCR service directly
curl -f http://localhost:5001/health

# Check OCR service logs
docker-compose logs ocr-service

# Test with sample image
curl -X POST http://localhost:5001/detect-expiry -F "image=@test.jpg"
```

### **Performance Issues**

#### **High Memory Usage**
```bash
# Monitor resource usage
docker stats

# Clean up unused containers
docker system prune -a
```

#### **Slow OCR Processing**
- **Reduce image size:** Optimize uploads before processing
- **Adjust confidence threshold:** Lower for faster processing
- **Scale OCR service:** Add more OCR containers

## 🚀 **Production Best Practices**

### **Security**
1. **Change Default Passwords:** Never use default passwords
2. **Use HTTPS:** Configure SSL certificates
3. **Regular Updates:** Keep Docker images updated
4. **Firewall Rules:** Restrict access to necessary ports only

### **Monitoring**
```bash
# Set up monitoring with health checks
docker-compose exec backend curl http://localhost:5000/api/health
docker-compose exec ocr-service curl http://localhost:5001/health
```

### **Backups**
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec mongodb mongodump --out /backup/backup_$DATE
```

### **Scaling**
```bash
# Scale frontend for load
docker-compose up -d --scale frontend=3

# Scale OCR service for processing
docker-compose up -d --scale ocr-service=2
```

## 📞 **Support**

### **Debug Information**
```bash
# Get system info for support
docker-compose version
docker version
systeminfo  # Windows
uname -a    # Mac/Linux
```

### **Log Locations**
- **Application Logs:** `docker-compose logs`
- **System Logs:** Docker Desktop logs
- **Database Logs:** MongoDB container logs

## ✅ **Deployment Checklist**

- [ ] Copy and configure `.env` file
- [ ] Set secure passwords and secrets  
- [ ] Verify Docker Desktop is running
- [ ] Run `docker-compose up -d`
- [ ] Check all containers are healthy (`docker-compose ps`)
- [ ] Test frontend at http://localhost
- [ ] Test user registration/login
- [ ] Test image upload and OCR detection
- [ ] Verify database persistence
- [ ] Set up monitoring and backups

**🎉 Your ExpiryTracker is now running in production with Docker!**

---

## 🔄 **Updates & Maintenance**

### **Updating the Application**
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

### **Rolling Back**
```bash
# Deploy specific version
git checkout <commit-hash>
docker-compose up -d --build
```

**For technical support or questions, check the logs and refer to the troubleshooting section above.**