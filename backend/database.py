import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, mongodb_url: str = "mongodb://localhost:27017"):
        self.client = AsyncIOMotorClient(mongodb_url)
        self.db = self.client.learnquest_proctoring
        self._ensure_indexes()
    
    def _ensure_indexes(self):
        """Create necessary database indexes"""
        try:
            # Create indexes for better performance
            self.db.violations.create_index([("user_id", 1), ("course_id", 1)])
            self.db.test_results.create_index([("user_id", 1)])
            self.db.test_results.create_index([("course_id", 1)])
            self.db.test_results.create_index([("submitted_at", -1)])
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating database indexes: {e}")
    
    async def log_violation(self, user_id: str, course_id: str, violation: dict):
        """Log a violation to the database"""
        try:
            violation_doc = {
                "user_id": user_id,
                "course_id": course_id,
                "violation": violation,
                "logged_at": violation.get("timestamp")
            }
            await self.db.violations.insert_one(violation_doc)
            return True
        except Exception as e:
            logger.error(f"Error logging violation: {e}")
            return False
    
    async def save_test_result(self, test_result: dict):
        """Save test result to the database"""
        try:
            await self.db.test_results.insert_one(test_result)
            return True
        except Exception as e:
            logger.error(f"Error saving test result: {e}")
            return False
    
    async def get_test_results(self, user_id: str, limit: int = 100):
        """Get test results for a user"""
        try:
            results = await self.db.test_results.find(
                {"user_id": user_id}
            ).sort("submitted_at", -1).limit(limit).to_list(length=limit)
            return results
        except Exception as e:
            logger.error(f"Error fetching test results: {e}")
            return []
    
    async def get_violations(self, user_id: str, course_id: str, limit: int = 1000):
        """Get violations for a specific test session"""
        try:
            violations = await self.db.violations.find({
                "user_id": user_id,
                "course_id": course_id
            }).sort("logged_at", -1).limit(limit).to_list(length=limit)
            return violations
        except Exception as e:
            logger.error(f"Error fetching violations: {e}")
            return []
    
    async def get_certificate_status(self, user_id: str, course_id: str):
        """Get certificate status for a user and course"""
        try:
            result = await self.db.test_results.find_one({
                "user_id": user_id,
                "course_id": course_id
            }, sort=[("submitted_at", -1)])
            
            if result:
                return {
                    "certificate_status": result.get("certificate_status"),
                    "final_score": result.get("final_score"),
                    "submitted_at": result.get("submitted_at")
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching certificate status: {e}")
            return None
    
    async def close(self):
        """Close database connection"""
        self.client.close()

# Global database manager instance
db_manager = DatabaseManager()
