# LearnQuest Proctoring System - Installation Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB 4.4+
- Git

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd learnquest-proctoring
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y python3-opencv portaudio19-dev ffmpeg
```

**macOS:**
```bash
brew install portaudio ffmpeg
```

**Windows:**
- Install Visual Studio Build Tools
- Install PortAudio from official website

#### Start MongoDB
```bash
# Using Docker (Recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
# Follow MongoDB installation guide for your OS
```

#### Run Backend Server
```bash
cd backend
python main.py
```

The backend will start on `http://localhost:8000`

### 3. Frontend Setup

#### Install Node.js Dependencies
```bash
cd frontend
npm install
```

#### Start Development Server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Detailed Installation

### Backend Dependencies

The backend requires the following Python packages:

```
fastapi==0.104.1          # Web framework
uvicorn[standard]==0.24.0  # ASGI server
websockets==12.0          # WebSocket support
motor==3.3.2              # Async MongoDB driver
pymongo==4.6.0            # MongoDB driver
opencv-python==4.8.1.78  # Computer vision
ultralytics==8.0.196     # YOLOv8 models
deepface==0.0.79         # Face recognition
librosa==0.10.1          # Audio processing
webrtcvad==2.0.10        # Voice activity detection
pyaudio==0.2.11          # Audio I/O
numpy==1.24.3            # Numerical computing
pydantic==2.5.0          # Data validation
python-multipart==0.0.6  # File uploads
python-jose[cryptography]==3.3.0  # JWT tokens
passlib[bcrypt]==1.7.4   # Password hashing
python-dotenv==1.0.0     # Environment variables
pillow==10.1.0           # Image processing
scipy==1.11.4            # Scientific computing
soundfile==0.12.1        # Audio file I/O
```

### Frontend Dependencies

The frontend requires the following Node.js packages:

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "lucide-react": "^0.294.0",
  "@vitejs/plugin-react": "^4.2.1",
  "typescript": "^5.2.2",
  "vite": "^5.0.8",
  "tailwindcss": "^3.3.6",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32"
}
```

## System Requirements

### Minimum Requirements
- **CPU**: 4 cores, 2.0 GHz
- **RAM**: 8 GB
- **Storage**: 10 GB free space
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Recommended Requirements
- **CPU**: 8 cores, 3.0 GHz
- **RAM**: 16 GB
- **Storage**: 20 GB free space
- **GPU**: NVIDIA GPU with CUDA support (optional, for faster processing)

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=learnquest_proctoring

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Proctoring Settings
FACE_DETECTION_CONFIDENCE=0.5
AUDIO_THRESHOLD_DB=-40
BEHAVIOR_SCORE_THRESHOLD=85
```

### Frontend Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_APP_NAME=LearnQuest Proctoring
```

## Production Deployment

### Backend Deployment

#### Using Docker
```bash
# Create Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Using Gunicorn
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment

#### Build for Production
```bash
cd frontend
npm run build
```

#### Serve with Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Troubleshooting

### Common Installation Issues

#### 1. PyAudio Installation Error
```bash
# Ubuntu/Debian
sudo apt-get install portaudio19-dev

# macOS
brew install portaudio

# Windows
# Download and install PortAudio from official website
```

#### 2. OpenCV Installation Error
```bash
# Install system dependencies
sudo apt-get install libopencv-dev python3-opencv

# Or use conda
conda install opencv
```

#### 3. MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection
mongo --eval "db.runCommand('ping')"
```

#### 4. WebSocket Connection Error
- Check CORS settings in backend
- Verify firewall settings
- Ensure WebSocket URL is correct

#### 5. Camera/Microphone Access Denied
- Use HTTPS in production
- Check browser permissions
- Verify device availability

### Performance Issues

#### 1. High CPU Usage
- Reduce video frame rate
- Use smaller model variants
- Optimize processing intervals

#### 2. Memory Leaks
- Monitor memory usage
- Restart services periodically
- Check for resource cleanup

#### 3. Slow Processing
- Use GPU acceleration if available
- Optimize model parameters
- Reduce processing resolution

## Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Start all services
docker-compose up -d

# Run integration tests
python tests/integration_test.py
```

## Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Database connection
curl http://localhost:8000/api/proctoring/current-score
```

### Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend logs
# Check browser console
```

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **CORS**: Configure CORS properly
3. **Authentication**: Implement proper authentication
4. **Data Privacy**: No raw video/audio storage
5. **Input Validation**: Validate all inputs
6. **Rate Limiting**: Implement rate limiting
7. **Monitoring**: Monitor for suspicious activity

## Support

For additional support:
- Check the troubleshooting section
- Review the API documentation
- Create an issue in the repository
- Contact the development team
