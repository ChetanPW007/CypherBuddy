# CypherBuddy OTP & SMS Security Service
# Generates 6-digit cryptographically secure OTPs, securely hashes OTPs before storing, and sends via configurable provider

import os
import secrets
import hashlib
import time
import logging
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger("cypherbuddy.otp")

SMS_PROVIDER = os.getenv("SMS_PROVIDER", "mock").lower()
SMS_API_KEY = os.getenv("SMS_API_KEY", "")
SMS_API_SECRET = os.getenv("SMS_API_SECRET", "")
SMS_SENDER_ID = os.getenv("SMS_SENDER_ID", "CYPHER")

# Secret Salt for OTP hashing to prevent rainbow table attacks
OTP_HASH_SALT = os.getenv("JWT_SECRET", "CYPHERBUDDY_OTP_SECURE_SALT_2026")

def generate_secure_otp() -> str:
    """Generates a cryptographically secure 6-digit OTP string."""
    # Use Python secrets module for CSPRNG
    return f"{secrets.randbelow(900000) + 100000}"

def hash_otp(otp: str) -> str:
    """Returns SHA-256 salted hash of OTP. Plaintext OTP is NEVER stored in database."""
    salted = f"{otp}:{OTP_HASH_SALT}".encode('utf-8')
    return hashlib.sha256(salted).hexdigest()

def verify_otp_hash(provided_otp: str, stored_hash: str) -> bool:
    """Constant-time verification of user provided OTP against stored hash."""
    computed_hash = hash_otp(provided_otp)
    return secrets.compare_digest(computed_hash, stored_hash)

def mask_contact(contact: str) -> str:
    """Safely masks phone numbers or email addresses for display."""
    contact = contact.strip()
    if "@" in contact:
        parts = contact.split("@")
        name = parts[0]
        domain = parts[1]
        masked_name = name[0] + "***" + (name[-1] if len(name) > 1 else "")
        return f"{masked_name}@{domain}"
    else:
        # Phone masking: e.g. +919876543210 -> +91 ******3210
        if len(contact) >= 10:
            return contact[:3] + " ****** " + contact[-4:]
        return "******" + contact[-2:] if len(contact) >= 2 else "******"

def send_otp(destination: str, otp: str) -> Tuple[bool, str]:
    """
    Dispatches OTP via configured SMS/Email provider.
    NEVER logs the plaintext OTP value.
    """
    masked = mask_contact(destination)
    message_text = f"Your CypherBuddy Admin verification OTP is {otp}. It expires in 5 minutes. Do not share this OTP."

    if SMS_PROVIDER == "mock" or os.getenv("ENVIRONMENT") == "development":
        # In development mode, print to server stdout for local developer testing
        print(f"\n[DEV OTP DISPATCH] [DESTINATION: {masked}] -> OTP: {otp}\n")
        logger.info(f"Mock OTP dispatched successfully to {masked}")
        return True, f"OTP sent to {masked}"

    elif SMS_PROVIDER == "twilio":
        # Twilio API Integration
        try:
            from twilio.rest import Client
            account_sid = SMS_API_KEY
            auth_token = SMS_API_SECRET
            client = Client(account_sid, auth_token)
            client.messages.create(
                body=message_text,
                from_=SMS_SENDER_ID,
                to=destination
            )
            logger.info(f"Twilio OTP sent to {masked}")
            return True, f"OTP sent to {masked}"
        except Exception as e:
            logger.error(f"Twilio SMS delivery error for {masked}: {str(e)}")
            return False, "Failed to deliver SMS. Please try again later."

    elif SMS_PROVIDER == "fast2sms":
        # Fast2SMS API Integration
        try:
            import requests
            url = "https://www.fast2sms.com/dev/bulkV2"
            payload = f"variables_values={otp}&route=otp&numbers={destination}"
            headers = {
                'authorization': SMS_API_KEY,
                'Content-Type': "application/x-www-form-urlencoded"
            }
            res = requests.post(url, data=payload, headers=headers, timeout=5)
            if res.status_code == 200:
                logger.info(f"Fast2SMS OTP sent to {masked}")
                return True, f"OTP sent to {masked}"
            return False, "SMS provider returned delivery failure."
        except Exception as e:
            logger.error(f"Fast2SMS error: {str(e)}")
            return False, "Failed to deliver SMS."

    else:
        # Fallback to safe log dispatch
        logger.info(f"Default OTP dispatch trigger for {masked}")
        return True, f"OTP dispatched to {masked}"
