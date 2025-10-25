import time
import logging
from datetime import datetime
from typing import Dict, Any, List
from enum import Enum

logger = logging.getLogger(__name__)

class ViolationType(Enum):
    FACE_ABSENT = "face_absent"
    MULTIPLE_FACES = "multiple_faces"
    NOISE_DETECTED = "noise_detected"
    SPEECH_DETECTED = "speech_detected"
    TAB_SWITCH = "tab_switch"
    HEAD_TURN = "head_turn"

class SeverityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class BehaviorScorer:
    def __init__(self):
        self.base_score = 100
        self.current_score = 100
        self.violations = []
        self.violation_counts = {
            ViolationType.FACE_ABSENT: 0,
            ViolationType.MULTIPLE_FACES: 0,
            ViolationType.NOISE_DETECTED: 0,
            ViolationType.SPEECH_DETECTED: 0,
            ViolationType.TAB_SWITCH: 0,
            ViolationType.HEAD_TURN: 0
        }
        self.violation_penalties = {
            ViolationType.FACE_ABSENT: 5,
            ViolationType.MULTIPLE_FACES: 10,
            ViolationType.NOISE_DETECTED: 3,
            ViolationType.SPEECH_DETECTED: 5,
            ViolationType.TAB_SWITCH: 5,
            ViolationType.HEAD_TURN: 3
        }
        self.thresholds = {
            ViolationType.FACE_ABSENT: 3,  # seconds
            ViolationType.MULTIPLE_FACES: 5,  # consecutive detections
            ViolationType.NOISE_DETECTED: 3,  # consecutive detections
            ViolationType.SPEECH_DETECTED: 10,  # consecutive detections
            ViolationType.TAB_SWITCH: 1,  # immediate penalty
            ViolationType.HEAD_TURN: 3  # consecutive detections
        }
        self.last_violation_times = {}
    
    def reset_scores(self):
        """Reset all scores and violations for a new test session"""
        self.current_score = self.base_score
        self.violations = []
        self.violation_counts = {violation_type: 0 for violation_type in ViolationType}
        self.last_violation_times = {}
        logger.info("Behavior scores reset for new test session")
    
    def _should_penalize(self, violation_type: ViolationType, current_time: float) -> bool:
        """Check if enough time has passed since last violation to apply penalty"""
        if violation_type not in self.last_violation_times:
            return True
        
        time_since_last = current_time - self.last_violation_times[violation_type]
        cooldown_period = 5.0  # 5 seconds cooldown between penalties
        
        return time_since_last > cooldown_period
    
    def add_violation(self, violation_type: ViolationType, severity: SeverityLevel = SeverityLevel.MEDIUM, 
                     additional_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Add a violation and update behavior score"""
        current_time = time.time()
        
        # Increment violation count
        self.violation_counts[violation_type] += 1
        
        # Check if we should apply penalty
        should_penalize = self._should_penalize(violation_type, current_time)
        
        violation_data = {
            "type": violation_type.value,
            "timestamp": datetime.utcnow(),
            "severity": severity.value,
            "count": self.violation_counts[violation_type],
            "penalty_applied": False,
            "additional_data": additional_data or {}
        }
        
        # Apply penalty if threshold exceeded and cooldown passed
        if (self.violation_counts[violation_type] >= self.thresholds[violation_type] and 
            should_penalize):
            
            penalty = self.violation_penalties[violation_type]
            self.current_score = max(0, self.current_score - penalty)
            violation_data["penalty_applied"] = True
            violation_data["penalty_amount"] = penalty
            
            # Reset count after penalty
            self.violation_counts[violation_type] = 0
            self.last_violation_times[violation_type] = current_time
            
            logger.warning(f"Violation penalty applied: {violation_type.value} (-{penalty} points)")
        
        # Add to violations list
        self.violations.append(violation_data)
        
        return violation_data
    
    def process_video_analysis(self, video_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process video analysis results and add violations if needed"""
        violations_added = []
        
        try:
            # Check for face absence
            if not video_result.get("face_present", True):
                violation = self.add_violation(
                    ViolationType.FACE_ABSENT,
                    SeverityLevel.HIGH,
                    {"face_count": video_result.get("face_count", 0)}
                )
                violations_added.append(violation)
            
            # Check for multiple faces
            face_count = video_result.get("face_count", 0)
            if face_count > 1:
                violation = self.add_violation(
                    ViolationType.MULTIPLE_FACES,
                    SeverityLevel.CRITICAL,
                    {"face_count": face_count}
                )
                violations_added.append(violation)
            
            # Check for head turning
            movement_analysis = video_result.get("movement_analysis", {})
            if movement_analysis.get("head_turn_detected", False):
                violation = self.add_violation(
                    ViolationType.HEAD_TURN,
                    SeverityLevel.MEDIUM,
                    {"movement_score": movement_analysis.get("movement_score", 0)}
                )
                violations_added.append(violation)
            
        except Exception as e:
            logger.error(f"Error processing video analysis: {e}")
        
        return violations_added
    
    def process_audio_analysis(self, audio_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process audio analysis results and add violations if needed"""
        violations_added = []
        
        try:
            # Check for noise violations
            noise_analysis = audio_result.get("noise_analysis", {})
            if noise_analysis.get("threshold_exceeded", False):
                violation = self.add_violation(
                    ViolationType.NOISE_DETECTED,
                    SeverityLevel.MEDIUM,
                    {
                        "db_level": noise_analysis.get("db_level", 0),
                        "noise_level": noise_analysis.get("noise_level", "unknown")
                    }
                )
                violations_added.append(violation)
            
            # Check for speech violations
            if audio_result.get("speech_detected", False):
                violation = self.add_violation(
                    ViolationType.SPEECH_DETECTED,
                    SeverityLevel.MEDIUM,
                    {"audio_quality": audio_result.get("audio_quality", "unknown")}
                )
                violations_added.append(violation)
            
        except Exception as e:
            logger.error(f"Error processing audio analysis: {e}")
        
        return violations_added
    
    def add_tab_switch_violation(self) -> Dict[str, Any]:
        """Add tab switch violation (immediate penalty)"""
        violation = self.add_violation(
            ViolationType.TAB_SWITCH,
            SeverityLevel.HIGH,
            {"immediate_penalty": True}
        )
        return violation
    
    def get_current_score(self) -> float:
        """Get current behavior score"""
        return self.current_score
    
    def get_violation_summary(self) -> Dict[str, Any]:
        """Get summary of all violations"""
        return {
            "total_violations": len(self.violations),
            "violation_counts": {k.value: v for k, v in self.violation_counts.items()},
            "current_score": self.current_score,
            "score_deduction": self.base_score - self.current_score,
            "violations_by_type": self._group_violations_by_type()
        }
    
    def _group_violations_by_type(self) -> Dict[str, List[Dict[str, Any]]]:
        """Group violations by type"""
        grouped = {}
        for violation in self.violations:
            violation_type = violation["type"]
            if violation_type not in grouped:
                grouped[violation_type] = []
            grouped[violation_type].append(violation)
        return grouped
    
    def calculate_final_score(self, test_score: float, behavior_weight: float = 0.4, 
                           test_weight: float = 0.6) -> Dict[str, Any]:
        """Calculate final score combining test score and behavior score"""
        try:
            # Ensure scores are within valid range
            behavior_score = max(0, min(100, self.current_score))
            test_score = max(0, min(100, test_score))
            
            # Calculate weighted final score
            final_score = (behavior_weight * behavior_score) + (test_weight * test_score)
            
            # Determine certificate eligibility
            certificate_eligible = final_score >= 85
            
            result = {
                "behavior_score": behavior_score,
                "test_score": test_score,
                "final_score": final_score,
                "certificate_eligible": certificate_eligible,
                "certificate_status": "issued" if certificate_eligible else "not_issued",
                "score_breakdown": {
                    "behavior_contribution": behavior_weight * behavior_score,
                    "test_contribution": test_weight * test_score
                },
                "violation_summary": self.get_violation_summary()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating final score: {e}")
            return {
                "behavior_score": 0,
                "test_score": test_score,
                "final_score": 0,
                "certificate_eligible": False,
                "certificate_status": "not_issued",
                "error": str(e)
            }
    
    def get_detailed_report(self) -> Dict[str, Any]:
        """Get detailed violation report"""
        return {
            "session_summary": self.get_violation_summary(),
            "all_violations": self.violations,
            "violations_by_severity": self._group_violations_by_severity(),
            "timeline": self._create_violation_timeline()
        }
    
    def _group_violations_by_severity(self) -> Dict[str, List[Dict[str, Any]]]:
        """Group violations by severity level"""
        grouped = {}
        for violation in self.violations:
            severity = violation["severity"]
            if severity not in grouped:
                grouped[severity] = []
            grouped[severity].append(violation)
        return grouped
    
    def _create_violation_timeline(self) -> List[Dict[str, Any]]:
        """Create chronological timeline of violations"""
        timeline = []
        for violation in self.violations:
            timeline.append({
                "timestamp": violation["timestamp"],
                "type": violation["type"],
                "severity": violation["severity"],
                "penalty_applied": violation.get("penalty_applied", False)
            })
        
        # Sort by timestamp
        timeline.sort(key=lambda x: x["timestamp"])
        return timeline
