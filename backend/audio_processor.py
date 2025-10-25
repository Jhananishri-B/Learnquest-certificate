import numpy as np
import librosa
import webrtcvad
import pyaudio
import logging
import time
from typing import Dict, Any, List
import io
import wave

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self, sample_rate: int = 16000, chunk_size: int = 320):
        self.sample_rate = sample_rate
        self.chunk_size = chunk_size  # 20ms chunks for VAD
        self.vad = None
        self.audio_stream = None
        self._initialize_vad()
    
    def _initialize_vad(self):
        """Initialize Voice Activity Detection"""
        try:
            self.vad = webrtcvad.Vad(2)  # Aggressiveness level 2 (0-3)
            logger.info("VAD initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing VAD: {e}")
    
    def decode_audio_chunk(self, audio_data: bytes) -> np.ndarray:
        """Decode audio chunk from bytes to numpy array"""
        try:
            # Convert bytes to numpy array (assuming 16-bit PCM)
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            
            # Convert to float32 for librosa processing
            audio_float = audio_array.astype(np.float32) / 32768.0
            
            return audio_float
            
        except Exception as e:
            logger.error(f"Error decoding audio chunk: {e}")
            return np.array([])
    
    def calculate_rms_db(self, audio_array: np.ndarray) -> float:
        """Calculate RMS and convert to dB"""
        try:
            if len(audio_array) == 0:
                return -100.0  # Very quiet
            
            # Calculate RMS
            rms = np.sqrt(np.mean(audio_array**2))
            
            # Convert to dB, avoiding log(0)
            db = 20 * np.log10(rms + 1e-10)
            
            return db
            
        except Exception as e:
            logger.error(f"Error calculating RMS dB: {e}")
            return -100.0
    
    def detect_speech(self, audio_data: bytes) -> bool:
        """Detect speech using VAD"""
        try:
            if self.vad is None or len(audio_data) < self.chunk_size:
                return False
            
            # VAD requires specific chunk sizes
            if len(audio_data) == self.chunk_size:
                return self.vad.is_speech(audio_data, self.sample_rate)
            
            # For larger chunks, process in segments
            speech_detected = False
            for i in range(0, len(audio_data) - self.chunk_size + 1, self.chunk_size):
                chunk = audio_data[i:i + self.chunk_size]
                if self.vad.is_speech(chunk, self.sample_rate):
                    speech_detected = True
                    break
            
            return speech_detected
            
        except Exception as e:
            logger.error(f"Error detecting speech: {e}")
            return False
    
    def analyze_spectral_features(self, audio_array: np.ndarray) -> Dict[str, float]:
        """Analyze spectral features of audio"""
        try:
            if len(audio_array) == 0:
                return {"spectral_centroid": 0.0, "spectral_rolloff": 0.0, "zero_crossing_rate": 0.0}
            
            # Calculate spectral features
            spectral_centroid = librosa.feature.spectral_centroid(y=audio_array, sr=self.sample_rate)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=audio_array, sr=self.sample_rate)[0]
            zero_crossing_rate = librosa.feature.zero_crossing_rate(audio_array)[0]
            
            return {
                "spectral_centroid": float(np.mean(spectral_centroid)),
                "spectral_rolloff": float(np.mean(spectral_rolloff)),
                "zero_crossing_rate": float(np.mean(zero_crossing_rate))
            }
            
        except Exception as e:
            logger.error(f"Error analyzing spectral features: {e}")
            return {"spectral_centroid": 0.0, "spectral_rolloff": 0.0, "zero_crossing_rate": 0.0}
    
    def detect_background_noise(self, audio_array: np.ndarray, threshold_db: float = -40.0) -> Dict[str, Any]:
        """Detect background noise levels"""
        try:
            db_level = self.calculate_rms_db(audio_array)
            
            noise_detected = db_level > threshold_db
            noise_level = "low" if db_level < -50 else "medium" if db_level < -30 else "high"
            
            return {
                "noise_detected": noise_detected,
                "db_level": db_level,
                "noise_level": noise_level,
                "threshold_exceeded": db_level > threshold_db
            }
            
        except Exception as e:
            logger.error(f"Error detecting background noise: {e}")
            return {
                "noise_detected": False,
                "db_level": -100.0,
                "noise_level": "low",
                "threshold_exceeded": False
            }
    
    def process_audio_chunk(self, audio_data: bytes) -> Dict[str, Any]:
        """Process a single audio chunk for proctoring analysis"""
        try:
            # Decode audio
            audio_array = self.decode_audio_chunk(audio_data)
            
            if len(audio_array) == 0:
                return {"error": "Invalid audio data", "success": False}
            
            # Calculate basic metrics
            db_level = self.calculate_rms_db(audio_array)
            
            # Detect speech
            speech_detected = self.detect_speech(audio_data)
            
            # Analyze noise
            noise_analysis = self.detect_background_noise(audio_array)
            
            # Analyze spectral features
            spectral_features = self.analyze_spectral_features(audio_array)
            
            # Determine audio quality
            audio_quality = "good"
            if db_level < -60:
                audio_quality = "too_quiet"
            elif db_level > -20:
                audio_quality = "too_loud"
            elif noise_analysis["threshold_exceeded"]:
                audio_quality = "noisy"
            
            result = {
                "db_level": db_level,
                "speech_detected": speech_detected,
                "noise_analysis": noise_analysis,
                "spectral_features": spectral_features,
                "audio_quality": audio_quality,
                "chunk_size": len(audio_data),
                "processing_time": time.time(),
                "success": True
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}")
            return {"error": str(e), "success": False}
    
    def setup_audio_stream(self, device_index: int = None) -> bool:
        """Setup PyAudio stream for real-time audio capture"""
        try:
            self.audio_stream = pyaudio.PyAudio()
            
            stream = self.audio_stream.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=self.sample_rate,
                input=True,
                input_device_index=device_index,
                frames_per_buffer=self.chunk_size
            )
            
            logger.info("Audio stream setup successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error setting up audio stream: {e}")
            return False
    
    def cleanup(self):
        """Cleanup audio resources"""
        if self.audio_stream:
            self.audio_stream.stop_stream()
            self.audio_stream.close()
            self.audio_stream = None
