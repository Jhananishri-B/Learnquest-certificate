from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class ViolationType(str, Enum):
    FACE_ABSENT = "face_absent"
    MULTIPLE_FACES = "multiple_faces"
    NOISE_DETECTED = "noise_detected"
    SPEECH_DETECTED = "speech_detected"
    TAB_SWITCH = "tab_switch"
    HEAD_TURN = "head_turn"

class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Violation(BaseModel):
    type: ViolationType
    timestamp: datetime
    severity: SeverityLevel
    db_level: Optional[float] = None

class TestSubmission(BaseModel):
    user_id: str
    course_id: str
    test_score: float
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM

class IdentityVerification(BaseModel):
    user_id: str
    reference_image: str  # Base64 encoded image

class TestResult(BaseModel):
    user_id: str
    course_id: str
    difficulty: DifficultyLevel
    test_score: float
    behavior_score: float
    final_score: float
    violations: List[Violation]
    certificate_status: str
    submitted_at: datetime

class ProctoringResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
