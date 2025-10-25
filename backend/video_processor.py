import cv2
import numpy as np
import base64
import logging
from ultralytics import YOLO
from deepface import DeepFace
import time
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self):
        self.yolo_model = None
        self.face_cascade = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize computer vision models"""
        try:
            # Initialize YOLOv8 model
            self.yolo_model = YOLO('yolov8n.pt')
            logger.info("YOLOv8 model loaded successfully")
            
            # Initialize OpenCV face cascade
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            logger.info("OpenCV face cascade loaded successfully")
            
        except Exception as e:
            logger.error(f"Error initializing video models: {e}")
    
    def decode_frame(self, frame_data: str) -> np.ndarray:
        """Decode base64 frame data to OpenCV image"""
        try:
            frame_bytes = base64.b64decode(frame_data)
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return frame
        except Exception as e:
            logger.error(f"Error decoding frame: {e}")
            return None
    
    def detect_faces_yolo(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Detect faces using YOLOv8"""
        try:
            if self.yolo_model is None:
                return []
            
            # Run YOLOv8 detection for person class (class 0)
            results = self.yolo_model(frame, classes=[0], verbose=False)
            
            faces = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = box.conf[0].cpu().numpy()
                        
                        faces.append({
                            "bbox": [int(x1), int(y1), int(x2), int(y2)],
                            "confidence": float(confidence),
                            "center": [int((x1 + x2) / 2), int((y1 + y2) / 2)]
                        })
            
            return faces
            
        except Exception as e:
            logger.error(f"Error detecting faces with YOLO: {e}")
            return []
    
    def detect_faces_opencv(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Detect faces using OpenCV Haar Cascade"""
        try:
            if self.face_cascade is None:
                return []
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
            
            face_data = []
            for (x, y, w, h) in faces:
                face_data.append({
                    "bbox": [x, y, x + w, y + h],
                    "confidence": 1.0,  # Haar cascade doesn't provide confidence
                    "center": [x + w // 2, y + h // 2]
                })
            
            return face_data
            
        except Exception as e:
            logger.error(f"Error detecting faces with OpenCV: {e}")
            return []
    
    def verify_identity(self, frame: np.ndarray, reference_image_path: str) -> Dict[str, Any]:
        """Verify identity using DeepFace"""
        try:
            # This is a placeholder implementation
            # In a real scenario, you would compare with a stored reference image
            result = {
                "verified": True,
                "confidence": 0.95,
                "distance": 0.1,
                "model": "VGG-Face"
            }
            return result
            
        except Exception as e:
            logger.error(f"Error verifying identity: {e}")
            return {"verified": False, "confidence": 0.0, "error": str(e)}
    
    def analyze_movement(self, current_faces: List[Dict], previous_faces: List[Dict]) -> Dict[str, Any]:
        """Analyze movement patterns between frames"""
        try:
            movement_data = {
                "head_turn_detected": False,
                "movement_score": 0.0,
                "face_stability": 1.0
            }
            
            if not current_faces or not previous_faces:
                return movement_data
            
            # Calculate movement between face centers
            current_center = current_faces[0]["center"]
            previous_center = previous_faces[0]["center"]
            
            # Calculate distance moved
            distance = np.sqrt(
                (current_center[0] - previous_center[0])**2 + 
                (current_center[1] - previous_center[1])**2
            )
            
            # Normalize movement (assuming frame size ~640x480)
            normalized_movement = distance / 100.0
            
            movement_data["movement_score"] = min(normalized_movement, 1.0)
            
            # Detect head turning (significant horizontal movement)
            horizontal_movement = abs(current_center[0] - previous_center[0])
            if horizontal_movement > 50:  # Threshold for head turn
                movement_data["head_turn_detected"] = True
            
            return movement_data
            
        except Exception as e:
            logger.error(f"Error analyzing movement: {e}")
            return {"head_turn_detected": False, "movement_score": 0.0, "face_stability": 1.0}
    
    def process_frame(self, frame_data: str, previous_faces: List[Dict] = None) -> Dict[str, Any]:
        """Process a single video frame for proctoring analysis"""
        try:
            # Decode frame
            frame = self.decode_frame(frame_data)
            if frame is None:
                return {"error": "Invalid frame data"}
            
            # Detect faces using both methods
            yolo_faces = self.detect_faces_yolo(frame)
            opencv_faces = self.detect_faces_opencv(frame)
            
            # Use YOLO results as primary, fallback to OpenCV
            faces = yolo_faces if yolo_faces else opencv_faces
            
            # Analyze movement if previous frame data is available
            movement_analysis = {}
            if previous_faces is not None:
                movement_analysis = self.analyze_movement(faces, previous_faces)
            
            # Calculate frame metrics
            frame_height, frame_width = frame.shape[:2]
            face_count = len(faces)
            
            # Determine if face is present and stable
            face_present = face_count > 0
            face_stable = face_count == 1
            
            result = {
                "face_count": face_count,
                "face_present": face_present,
                "face_stable": face_stable,
                "faces": faces,
                "frame_dimensions": [frame_width, frame_height],
                "movement_analysis": movement_analysis,
                "processing_time": time.time(),
                "success": True
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return {"error": str(e), "success": False}
    
    def cleanup(self):
        """Cleanup resources"""
        if self.yolo_model:
            del self.yolo_model
        if self.face_cascade:
            del self.face_cascade
