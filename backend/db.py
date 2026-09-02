# CypherBuddy MongoDB Database Layer
# Manages Motor (async MongoDB client), collection initializations, index creations, and initial Admin Seed

import os
import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

logger = logging.getLogger("cypherbuddy.db")

MONGODB_URI = os.getenv("MONGODB_URI", "")
DATABASE_NAME = os.getenv("DATABASE_NAME", "cypherbuddy")

# Global Motor MongoDB client and database handles
mongo_client: Optional[AsyncIOMotorClient] = None
db = None

async def init_db():
    """Initializes MongoDB connection and creates required indexes."""
    global mongo_client, db
    
    if not MONGODB_URI:
        logger.warning("MONGODB_URI not provided in environment. Running with in-memory state fallback.")
        return False

    try:
        mongo_client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = mongo_client[DATABASE_NAME]
        
        # Ping server to confirm connection
        await mongo_client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database '{DATABASE_NAME}'")

        # Create Indexes for Collections
        await db.users.create_index([("email", ASCENDING)], unique=True)
        await db.users.create_index([("id", ASCENDING)], unique=True)

        await db.admin_users.create_index([("email", ASCENDING)], unique=True, sparse=True)
        await db.admin_users.create_index([("phone", ASCENDING)], unique=True, sparse=True)

        # OTP Requests: TTL index to automatically expire OTP records after 10 minutes
        await db.otp_requests.create_index([("contact", ASCENDING)])
        await db.otp_requests.create_index([("created_at", ASCENDING)], expireAfterSeconds=600)

        await db.security_scans.create_index([("userId", ASCENDING), ("timestamp", DESCENDING)])
        await db.audit_logs.create_index([("timestamp", DESCENDING)])
        await db.audit_logs.create_index([("user_id", ASCENDING)])

        logger.info("MongoDB collection indexes initialized successfully.")
        return True

    except Exception as e:
        logger.error(f"Failed to connect to MongoDB at {MONGODB_URI}: {str(e)}")
        mongo_client = None
        db = None
        return False

async def get_database():
    """Returns active MongoDB database handle or None."""
    return db

async def close_db():
    """Closes MongoDB client connection."""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB connection closed.")
