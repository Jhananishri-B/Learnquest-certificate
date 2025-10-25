# LearnQuest Exam Proctoring System

A comprehensive real-time exam proctoring system built with React, FastAPI, and MongoDB.

## Features

### Video Monitoring
- **YOLOv8 Face Detection**: Real-time face detection and tracking
- **DeepFace Identity Verification**: Compare candidate with reference photos
- **OpenCV Processing**: Advanced computer vision capabilities
- **Movement Analysis**: Detect head turning and suspicious movements
- **Multiple Face Detection**: Flag when multiple people are detected

### Audio Monitoring
- **Real-time Audio Capture**: Continuous microphone monitoring
- **librosa Analysis**: Advanced audio processing and spectral analysis
- **WebRTC VAD**: Voice Activity Detection for speech recognition
- **Noise Detection**: Monitor ambient noise levels
- **Speech Analysis**: Detect unauthorized speech patterns

### Behavior Scoring
- **Real-time Scoring**: Live behavior score calculation
- **Violation Tracking**: Comprehensive violation logging
- **Penalty System**: Automated penalty application
- **Score Weighting**: 40% behavior + 60% test score
- **Certificate Logic**: Automatic certificate issuance (≥85% final score)

### Frontend Features
- **React + Vite**: Modern, fast frontend framework
- **Tailwind CSS**: Beautiful, responsive UI
- **WebRTC Integration**: Direct camera/microphone access
- **Full-screen Monitoring**: Prevent tab switching
- **Real-time Updates**: Live proctoring status
- **Certificate Display**: Downloadable certificates

## Project Structure

```
learnquest-proctoring/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── models.py              # Pydantic models
│   ├── database.py            # MongoDB connection
│   ├── video_processor.py     # Video analysis
│   ├── audio_processor.py     # Audio analysis
│   ├── behavior_scorer.py     # Scoring system
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProctoringComponent.tsx
│   │   │   └── CertificateDisplay.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

## Installation

### Backend Setup

1. **Install Python Dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Install System Dependencies**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y python3-opencv portaudio19-dev

# macOS
brew install portaudio

# Windows
# Install Visual Studio Build Tools
```

3. **Start MongoDB**:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
```

4. **Run Backend**:
```bash
cd backend
python main.py
```

### Frontend Setup

1. **Install Node.js Dependencies**:
```bash
cd frontend
npm install
```

2. **Start Development Server**:
```bash
npm run dev
```

## Usage

### Starting a Proctoring Session

1. **Open the Application**: Navigate to `http://localhost:5173`
2. **Enter User Information**: Provide User ID and Course ID
3. **Grant Permissions**: Allow camera and microphone access
4. **Start Exam**: Click "Start Exam" to begin proctoring
5. **Monitor Behavior**: Real-time behavior scoring and violation detection
6. **Complete Test**: Automatic test completion and certificate generation

### API Endpoints

#### WebSocket Endpoints
- `ws://localhost:8000/ws/proctoring/{user_id}/{course_id}` - Real-time proctoring

#### REST Endpoints
- `POST /api/proctoring/verify-identity` - Identity verification
- `POST /api/proctoring/submit-test` - Submit test results
- `GET /api/proctoring/test-results/{user_id}` - Get user results
- `GET /api/proctoring/violations/{user_id}/{course_id}` - Get violations
- `GET /api/proctoring/certificate-status/{user_id}/{course_id}` - Certificate status
- `GET /api/proctoring/current-score` - Current behavior score

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=your-secret-key-here
DEBUG=True
```

### Proctoring Settings

Modify behavior scoring thresholds in `behavior_scorer.py`:

```python
self.violation_penalties = {
    ViolationType.FACE_ABSENT: 5,      # Points deducted
    ViolationType.MULTIPLE_FACES: 10,  # Points deducted
    ViolationType.NOISE_DETECTED: 3,   # Points deducted
    ViolationType.SPEECH_DETECTED: 5,  # Points deducted
    ViolationType.TAB_SWITCH: 5,       # Points deducted
    ViolationType.HEAD_TURN: 3         # Points deducted
}
```

## Violation Types

### Video Violations
- **Face Absent**: No face detected for >3 seconds
- **Multiple Faces**: More than one person detected
- **Head Turn**: Excessive head movement detected

### Audio Violations
- **Noise Detected**: Ambient noise above threshold (-40 dB)
- **Speech Detected**: Unauthorized speech detected

### System Violations
- **Tab Switch**: Browser tab switching detected

## Scoring System

### Behavior Score Calculation
- **Starting Score**: 100 points
- **Penalties**: Applied based on violation type and frequency
- **Cooldown Period**: 5 seconds between penalties for same violation type
- **Thresholds**: Minimum violations before penalty application

### Final Score Formula
```
Final Score = (0.4 × Behavior Score) + (0.6 × Test Score)
```

### Certificate Eligibility
- **Issued**: Final Score ≥ 85%
- **Not Issued**: Final Score < 85%

## Database Schema

### Test Results Collection
```json
{
  "user_id": "string",
  "course_id": "string",
  "difficulty": "easy|medium|hard",
  "test_score": "float",
  "behavior_score": "float",
  "final_score": "float",
  "violations": [
    {
      "type": "face_absent|multiple_faces|noise_detected|speech_detected|tab_switch|head_turn",
      "timestamp": "ISODate",
      "severity": "low|medium|high|critical",
      "penalty_applied": "boolean",
      "additional_data": "object"
    }
  ],
  "certificate_status": "issued|not_issued",
  "submitted_at": "ISODate"
}
```

### Violations Collection
```json
{
  "user_id": "string",
  "course_id": "string",
  "violation": "object",
  "logged_at": "ISODate"
}
```

## Performance Requirements

- **Video Processing**: 30 FPS minimum
- **Audio Processing**: 100-200ms frame intervals
- **Latency**: <100ms for real-time feedback
- **CPU Usage**: Optimized for concurrent sessions
- **Memory**: Efficient processing without storing raw data

## Security Features

- **No Data Storage**: Raw video/audio not stored
- **In-Memory Processing**: All analysis done in real-time
- **Secure WebSocket**: Encrypted communication
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Pydantic models for data validation

## Troubleshooting

### Common Issues

1. **Camera/Microphone Access Denied**:
   - Check browser permissions
   - Ensure HTTPS in production
   - Verify device availability

2. **WebSocket Connection Failed**:
   - Check backend server status
   - Verify CORS configuration
   - Check firewall settings

3. **Model Loading Errors**:
   - Ensure all dependencies installed
   - Check system requirements
   - Verify model files downloaded

4. **Audio Processing Issues**:
   - Check audio device permissions
   - Verify PyAudio installation
   - Check audio format compatibility

### Performance Optimization

1. **Reduce Video Quality**: Lower resolution for better performance
2. **Adjust Frame Rate**: Reduce FPS if needed
3. **Optimize Models**: Use smaller model variants
4. **Resource Monitoring**: Monitor CPU/memory usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## Future Enhancements

- [ ] Multi-language support
- [ ] Advanced AI models
- [ ] Mobile app support
- [ ] Cloud deployment options
- [ ] Advanced analytics dashboard
- [ ] Integration with LMS platforms
