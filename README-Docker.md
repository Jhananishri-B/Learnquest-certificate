# 🐳 Docker Setup for LearnQuest Proctoring System

This guide provides Docker-based setup instructions for the LearnQuest Proctoring System.

## 📋 Prerequisites

- **Docker** (https://docs.docker.com/get-docker/)
- **Docker Compose** (usually included with Docker Desktop)

## 🚀 Quick Start with Docker

### Option 1: Production Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/Jhananishri-B/Learnquest-_certificate-.git
cd Learnquest-_certificate-

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 2: Development Setup
```bash
# Clone the repository
git clone https://github.com/Jhananishri-B/Learnquest-_certificate-.git
cd Learnquest-_certificate-

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 🌐 Access the Application

After running Docker Compose:

- **Frontend**: http://localhost:3000 (production) or http://localhost:5173 (development)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

## 🔧 Docker Commands

### Start Services
```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

### Stop Services
```bash
# Production
docker-compose down

# Development
docker-compose -f docker-compose.dev.yml down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Rebuild Services
```bash
# Rebuild all
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: This will delete all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 🏗️ Service Architecture

### MongoDB
- **Image**: mongo:6.0
- **Port**: 27017
- **Database**: learnquest
- **Credentials**: admin/password123

### Backend
- **Port**: 8000
- **Environment**: Python 3.9
- **Features**: FastAPI, YOLOv8, DeepFace, WebSocket

### Frontend
- **Port**: 3000 (production) / 5173 (development)
- **Environment**: Node.js 18
- **Features**: React, Vite, Tailwind CSS, Dark Theme

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :8000
netstat -tulpn | grep :3000

# Kill the process
sudo kill -9 <PID>
```

### Container Issues
```bash
# Check container status
docker-compose ps

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend
```

### Database Connection Issues
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Connect to MongoDB
docker-compose exec mongodb mongosh -u admin -p password123
```

## 📱 Features Included

- ✅ **Dark Blue Theme** - Professional dark interface
- ✅ **Real-time Proctoring** - Video and audio monitoring
- ✅ **AI-Powered Detection** - Face recognition and behavior analysis
- ✅ **Certificate System** - Automated certificate generation
- ✅ **MongoDB Integration** - Violation logging and data storage
- ✅ **Docker Support** - Easy deployment and scaling
- ✅ **Development Mode** - Hot reloading for development

## 🎯 Next Steps

1. **Access the application** at http://localhost:3000
2. **Test the proctoring features** with camera and microphone
3. **View the API documentation** at http://localhost:8000/docs
4. **Customize the configuration** in docker-compose.yml

## 📞 Support

If you encounter any issues:
1. Check the logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Rebuild the containers: `docker-compose build --no-cache`
4. Check the GitHub repository for updates
