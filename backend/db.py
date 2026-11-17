# CypherBuddy MongoDB Database Layer
# Manages Motor (async MongoDB client), collection initializations, index creations, and initial Admin Seed

import os
import logging
from typing import Optional, Dict, Any

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    from pymongo import ASCENDING, DESCENDING
    MOTOR_AVAILABLE = True
except ImportError:
    AsyncIOMotorClient = Any  # type: ignore
    ASCENDING, DESCENDING = 1, -1
    MOTOR_AVAILABLE = False

logger = logging.getLogger("cypherbuddy.db")

# Global Motor MongoDB client and database handles
mongo_client: Optional[Any] = None
db = None

async def init_db():
    """Initializes MongoDB connection dynamically from environment variables and creates required indexes."""
    global mongo_client, db
    
    uri = os.getenv("MONGODB_URI", "").strip()
    db_name = os.getenv("DATABASE_NAME", "cypherbuddy").strip()
    
    if not MOTOR_AVAILABLE:
        logger.warning("MongoDB driver (motor) is not installed. Running with local-file fallback.")
        return False
    if not uri:
        logger.warning("MONGODB_URI is not set in the environment. Running with local-file fallback.")
        return False

    try:
        mongo_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=7000)
        db = mongo_client[db_name]
        
        # Ping server to confirm connection
        await mongo_client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database '{db_name}'")

        # Create Indexes for Collections safely
        try:
            await db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
            await db.users.create_index([("id", ASCENDING)], unique=True, sparse=True)

            await db.admin_users.create_index([("email", ASCENDING)], unique=True, sparse=True)
            await db.admin_users.create_index([("phone", ASCENDING)], unique=True, sparse=True)

            # OTP Requests: TTL index to automatically expire OTP records after 10 minutes
            await db.otp_requests.create_index([("contact", ASCENDING)])
            await db.otp_requests.create_index([("created_at", ASCENDING)], expireAfterSeconds=600)

            await db.security_scans.create_index([("userId", ASCENDING), ("timestamp", DESCENDING)])
            await db.audit_logs.create_index([("timestamp", DESCENDING)])
            await db.audit_logs.create_index([("user_id", ASCENDING)])
            logger.info("MongoDB collection indexes initialized successfully.")
        except Exception as idx_err:
            logger.warning(f"Non-critical index creation warning: {str(idx_err)}")

        return True

    except Exception as e:
        # Never log the URI: it contains the database password. The error class and text are enough to diagnose.
        reason = str(e).replace(uri, "<MONGODB_URI>")
        logger.error(f"Failed to connect to MongoDB ({type(e).__name__}): {reason[:300]}")
        logger.error("Common causes: wrong password in MONGODB_URI, Atlas Network Access not allowing 0.0.0.0/0, or special characters in the password that need URL-encoding.")
        mongo_client = None
        db = None
        return False

async def get_database():
    """Returns active MongoDB database handle or None."""
    global db
    return db

async def close_db():
    """Closes MongoDB client connection."""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB connection closed.")
