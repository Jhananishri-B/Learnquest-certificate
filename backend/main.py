from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import asyncio
from datetime import datetime
import logging
from typing import List, Dict, Any
import time
import base64

# Import our custom modules
from models import TestSubmission, IdentityVerification, ProctoringResponse
from database import db_manager
from video_processor import VideoProcessor
from audio_processor import AudioProcessor
from behavior_scorer import BehaviorScorer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LearnQuest Proctoring API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
video_processor = None
audio_processor = None
behavior_scorer = None

@app.on_event("startup")
async def startup_event():
    """Initialize models and services on startup"""
    global video_processor, audio_processor, behavior_scorer
    
    try:
        # Initialize processors
        video_processor = VideoProcessor()
        audio_processor = AudioProcessor()
        behavior_scorer = BehaviorScorer()
        
        logger.info("All processors initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing processors: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        if video_processor:
            video_processor.cleanup()
        if audio_processor:
            audio_processor.cleanup()
        await db_manager.close()
        logger.info("Cleanup completed successfully")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

@app.websocket("/ws/proctoring/{user_id}/{course_id}")
async def websocket_proctoring(websocket: WebSocket, user_id: str, course_id: str):
    """WebSocket endpoint for real-time proctoring"""
    await websocket.accept()
    logger.info(f"Proctoring session started for user {user_id}, course {course_id}")
    
    # Reset behavior scorer for new session
    behavior_scorer.reset_scores()
    
    try:
        while True:
            # Receive data from frontend
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "video_frame":
                # Process video frame
                if video_processor:
                    result = video_processor.process_frame(message["data"])
                    
                    if result.get("success", False):
                        # Process violations
                        violations = behavior_scorer.process_video_analysis(result)
                        
                        # Log violations to database
                        for violation in violations:
                            await db_manager.log_violation(user_id, course_id, violation)
                    
                    # Send response back to frontend
                    await websocket.send_text(json.dumps({
                        "type": "video_result",
                        "result": result,
                        "behavior_score": behavior_scorer.get_current_score()
                    }))
                
            elif message["type"] == "audio_chunk":
                # Process audio chunk
                if audio_processor:
                    # Convert base64 audio data to bytes
                    audio_bytes = base64.b64decode(message["data"])
                    result = audio_processor.process_audio_chunk(audio_bytes)
                    
                    if result.get("success", False):
                        # Process violations
                        violations = behavior_scorer.process_audio_analysis(result)
                        
                        # Log violations to database
                        for violation in violations:
                            await db_manager.log_violation(user_id, course_id, violation)
                    
                    # Send response back to frontend
                    await websocket.send_text(json.dumps({
                        "type": "audio_result",
                        "result": result,
                        "behavior_score": behavior_scorer.get_current_score()
                    }))
                
            elif message["type"] == "tab_switch":
                # Handle tab switching violation
                violation = behavior_scorer.add_tab_switch_violation()
                await db_manager.log_violation(user_id, course_id, violation)
                
                await websocket.send_text(json.dumps({
                    "type": "tab_switch_result",
                    "behavior_score": behavior_scorer.get_current_score(),
                    "violation": violation
                }))
                
    except WebSocketDisconnect:
        logger.info(f"Proctoring session ended for user {user_id}")
    except Exception as e:
        logger.error(f"Error in proctoring WebSocket: {e}")

@app.post("/api/proctoring/verify-identity")
async def verify_identity(request: IdentityVerification):
    """Verify candidate identity using DeepFace"""
    try:
        # Decode reference image
        reference_image_bytes = base64.b64decode(request.reference_image)
        
        # This would typically compare with a stored reference image
        # For now, we'll return a placeholder response
        result = {
            "verified": True,
            "confidence": 0.95,
            "message": "Identity verified successfully"
        }
        
        return JSONResponse(result)
        
    except Exception as e:
        logger.error(f"Error verifying identity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/proctoring/submit-test")
async def submit_test(request: TestSubmission):
    """Submit test results and calculate final score"""
    try:
        # Calculate final score using behavior scorer
        final_score_result = behavior_scorer.calculate_final_score(request.test_score)
        
        # Create test result document
        test_result = {
            "user_id": request.user_id,
            "course_id": request.course_id,
            "difficulty": request.difficulty.value,
            "test_score": request.test_score,
            "behavior_score": final_score_result["behavior_score"],
            "final_score": final_score_result["final_score"],
            "violations": behavior_scorer.violations,
            "certificate_status": final_score_result["certificate_status"],
            "submitted_at": datetime.utcnow()
        }
        
        # Save to MongoDB
        success = await db_manager.save_test_result(test_result)
        
        if success:
            return JSONResponse({
                "success": True,
                "final_score": final_score_result["final_score"],
                "certificate_status": final_score_result["certificate_status"],
                "violations_count": len(behavior_scorer.violations),
                "detailed_report": behavior_scorer.get_detailed_report()
            })
        else:
            raise HTTPException(status_code=500, detail="Failed to save test result")
        
    except Exception as e:
        logger.error(f"Error submitting test: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/proctoring/test-results/{user_id}")
async def get_test_results(user_id: str):
    """Get test results for a user"""
    try:
        results = await db_manager.get_test_results(user_id)
        return JSONResponse({"results": results})
    except Exception as e:
        logger.error(f"Error fetching test results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/proctoring/violations/{user_id}/{course_id}")
async def get_violations(user_id: str, course_id: str):
    """Get violations for a specific test session"""
    try:
        violations = await db_manager.get_violations(user_id, course_id)
        return JSONResponse({"violations": violations})
    except Exception as e:
        logger.error(f"Error fetching violations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/proctoring/certificate-status/{user_id}/{course_id}")
async def get_certificate_status(user_id: str, course_id: str):
    """Get certificate status for a user and course"""
    try:
        status = await db_manager.get_certificate_status(user_id, course_id)
        return JSONResponse({"certificate_status": status})
    except Exception as e:
        logger.error(f"Error fetching certificate status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/proctoring/current-score")
async def get_current_score():
    """Get current behavior score"""
    try:
        return JSONResponse({
            "behavior_score": behavior_scorer.get_current_score(),
            "violation_summary": behavior_scorer.get_violation_summary()
        })
    except Exception as e:
        logger.error(f"Error fetching current score: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
