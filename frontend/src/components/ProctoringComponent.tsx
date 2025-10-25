import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Camera, Mic, MicOff, CameraOff, Eye, EyeOff, Shield, CheckCircle, XCircle } from 'lucide-react';

interface ProctoringData {
  behaviorScore: number;
  violations: any[];
  faceDetected: boolean;
  audioLevel: number;
}

interface ProctoringComponentProps {
  userId: string;
  courseId: string;
  onTestComplete: (finalScore: number, certificateStatus: string) => void;
  testDuration?: number; // in minutes
}

const ProctoringComponent: React.FC<ProctoringComponentProps> = ({
  userId,
  courseId,
  onTestComplete,
  testDuration = 60
}) => {
  const [isProctoring, setIsProctoring] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [proctoringData, setProctoringData] = useState<ProctoringData>({
    behaviorScore: 100,
    violations: [],
    faceDetected: true,
    audioLevel: 0
  });
  const [timeRemaining, setTimeRemaining] = useState(testDuration * 60);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize media devices
  const initializeMediaDevices = useCallback(async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize audio context for audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      return true;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setWarnings(prev => [...prev, 'Failed to access camera or microphone']);
      return false;
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const wsUrl = `ws://localhost:8000/ws/proctoring/${userId}/${courseId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsProctoring(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'video_result') {
        setProctoringData(prev => ({
          ...prev,
          behaviorScore: data.behavior_score,
          faceDetected: data.result.face_present
        }));
      } else if (data.type === 'audio_result') {
        setProctoringData(prev => ({
          ...prev,
          behaviorScore: data.behavior_score,
          audioLevel: data.result.db_level
        }));
      } else if (data.type === 'tab_switch_result') {
        setProctoringData(prev => ({
          ...prev,
          behaviorScore: data.behavior_score
        }));
        setWarnings(prev => [...prev, 'Tab switching detected - penalty applied']);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsProctoring(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWarnings(prev => [...prev, 'Connection error - proctoring may be affected']);
    };

    websocketRef.current = ws;
  }, [userId, courseId]);

  // Capture and send video frames
  const captureVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !websocketRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    websocketRef.current.send(JSON.stringify({
      type: 'video_frame',
      data: frameData
    }));
  }, []);

  // Capture and send audio chunks
  const captureAudioChunk = useCallback(async () => {
    if (!audioContextRef.current || !mediaStreamRef.current || !websocketRef.current) return;

    try {
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Convert float32 to int16
        const int16Array = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }

        // Convert to base64
        const audioData = btoa(String.fromCharCode(...new Uint8Array(int16Array.buffer)));
        
        websocketRef.current?.send(JSON.stringify({
          type: 'audio_chunk',
          data: audioData
        }));
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
    } catch (error) {
      console.error('Error capturing audio:', error);
    }
  }, []);

  // Monitor tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && websocketRef.current) {
        websocketRef.current.send(JSON.stringify({
          type: 'tab_switch'
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Start proctoring
  const startProctoring = async () => {
    const mediaSuccess = await initializeMediaDevices();
    if (mediaSuccess) {
      connectWebSocket();
      
      // Start capturing video frames (30 FPS)
      intervalRef.current = setInterval(captureVideoFrame, 1000 / 30);
      
      // Start capturing audio chunks (every 200ms)
      audioIntervalRef.current = setInterval(captureAudioChunk, 200);
      
      // Start timer
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Stop proctoring
  const stopProctoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsProctoring(false);
  };

  // Handle test completion
  const handleTestComplete = async () => {
    stopProctoring();
    
    try {
      const response = await fetch(`http://localhost:8000/api/proctoring/submit-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          course_id: courseId,
          test_score: 85, // This would come from actual test results
          difficulty: 'medium'
        })
      });

      const result = await response.json();
      onTestComplete(result.final_score, result.certificate_status);
    } catch (error) {
      console.error('Error submitting test:', error);
      onTestComplete(0, 'not_issued');
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicrophoneEnabled(audioTrack.enabled);
      }
    }
  };

  // Request fullscreen
  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('Error requesting fullscreen:', error);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Shield className="h-8 w-8 text-blue-accent" />
          <h1 className="text-xl font-bold text-dark-text">LearnQuest Proctoring</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-dark-text-muted">
            Time: {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-dark-text-muted">
            Score: {proctoringData.behaviorScore}/100
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Video Feed */}
        <div className="flex-1 relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20">
            <div className="absolute top-4 left-4 flex space-x-2">
              {proctoringData.faceDetected ? (
                <CheckCircle className="h-6 w-6 text-success" />
              ) : (
                <XCircle className="h-6 w-6 text-error" />
              )}
              <span className="text-sm text-dark-text">
                {proctoringData.faceDetected ? 'Face Detected' : 'No Face Detected'}
              </span>
            </div>
            
            <div className="absolute top-4 right-4">
              <div className="bg-dark-card/80 border border-dark-border p-2 rounded">
                <div className="text-xs text-dark-text-muted">Audio Level</div>
                <div className="text-sm text-blue-accent">{proctoringData.audioLevel.toFixed(1)} dB</div>
              </div>
            </div>
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Control Panel */}
        <div className="w-80 bg-dark-card border-l border-dark-border p-4 space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-dark-text">Proctoring Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-text">Camera</span>
                <button
                  onClick={toggleCamera}
                  className={`p-2 rounded ${cameraEnabled ? 'bg-success' : 'bg-error'}`}
                >
                  {cameraEnabled ? <Camera className="h-4 w-4 text-white" /> : <CameraOff className="h-4 w-4 text-white" />}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-text">Microphone</span>
                <button
                  onClick={toggleMicrophone}
                  className={`p-2 rounded ${microphoneEnabled ? 'bg-success' : 'bg-error'}`}
                >
                  {microphoneEnabled ? <Mic className="h-4 w-4 text-white" /> : <MicOff className="h-4 w-4 text-white" />}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-text">Fullscreen</span>
                <button
                  onClick={requestFullscreen}
                  className={`p-2 rounded ${isFullscreen ? 'bg-success' : 'bg-warning'}`}
                >
                  {isFullscreen ? <Eye className="h-4 w-4 text-white" /> : <EyeOff className="h-4 w-4 text-white" />}
                </button>
              </div>
            </div>
          </div>

          {/* Behavior Score */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-dark-text">Behavior Score</h3>
            <div className="bg-dark-surface border border-dark-border p-3 rounded">
              <div className="text-2xl font-bold text-center text-blue-accent">
                {proctoringData.behaviorScore}
              </div>
              <div className="text-sm text-center text-dark-text-muted">/ 100</div>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-dark-text">Warnings</h3>
              <div className="space-y-1">
                {warnings.map((warning, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {!isProctoring ? (
              <button
                onClick={startProctoring}
                className="w-full bg-blue-primary hover:bg-blue-secondary px-4 py-2 rounded font-semibold text-white"
              >
                Start Proctoring
              </button>
            ) : (
              <button
                onClick={stopProctoring}
                className="w-full bg-error hover:bg-error/80 px-4 py-2 rounded font-semibold text-white"
              >
                Stop Proctoring
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringComponent;
