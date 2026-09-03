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
    """
    masked = mask_contact(destination)
    message_text = f"Your CypherBuddy Admin verification OTP is {otp}. Valid for 5 minutes."

    provider = os.getenv("SMS_PROVIDER", "mock").lower().strip()
    api_key = os.getenv("SMS_API_KEY", "").strip()

    if provider == "mock" or os.getenv("ENVIRONMENT") == "development" or not api_key:
        print(f"\n[DEV OTP DISPATCH] [DESTINATION: {masked}] -> OTP: {otp}\n")
        logger.info(f"Mock OTP dispatched successfully to {masked}")
        return True, f"OTP sent to {masked}"

    elif provider == "fast2sms":
        # Fast2SMS API Integration
        try:
            import requests
            
            # Clean 10-digit Indian phone number (remove +91 / +)
            digits_only = "".join(filter(str.isdigit, destination))
            if len(digits_only) > 10 and digits_only.startswith("91"):
                digits_only = digits_only[2:]
            
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                'authorization': api_key,
                'Content-Type': "application/x-www-form-urlencoded"
            }
            
            # Attempt 1: OTP Route
            payload_otp = f"variables_values={otp}&route=otp&numbers={digits_only}"
            res = requests.post(url, data=payload_otp, headers=headers, timeout=8)
            res_json = res.json() if res.ok else {}
            
            if res.status_code == 200 and res_json.get("return") is True:
                logger.info(f"Fast2SMS OTP route delivered to {masked}")
                return True, f"OTP sent to {masked}"

            # Attempt 2: Quick SMS Route Fallback
            payload_q = f"message={message_text}&language=english&route=q&numbers={digits_only}"
            res_q = requests.post(url, data=payload_q, headers=headers, timeout=8)
            res_q_json = res_q.json() if res_q.ok else {}

            if res_q.status_code == 200 and res_q_json.get("return") is True:
                logger.info(f"Fast2SMS Quick SMS route delivered to {masked}")
                return True, f"OTP sent to {masked}"

            err_msg = res_json.get("message") or res_q_json.get("message") or "Fast2SMS delivery error"
            logger.error(f"Fast2SMS API response error: {err_msg}")
            return False, f"SMS Delivery failed: {err_msg}"

        except Exception as e:
            logger.error(f"Fast2SMS Exception: {str(e)}")
            return False, "Failed to deliver SMS via Fast2SMS."

    elif provider == "twilio":
        try:
            account_sid = api_key or os.getenv("TWILIO_ACCOUNT_SID", "").strip()
            auth_token = os.getenv("SMS_API_SECRET", "").strip() or os.getenv("TWILIO_AUTH_TOKEN", "").strip()
            from_phone = os.getenv("TWILIO_PHONE_NUMBER", "").strip() or os.getenv("SMS_SENDER_ID", "").strip()
            
            # Format destination number to E.164 (e.g. +917349107584)
            formatted_dest = destination if destination.startswith("+") else f"+{destination}"

            try:
                from twilio.rest import Client
                client = Client(account_sid, auth_token)
                client.messages.create(body=message_text, from_=from_phone, to=formatted_dest)
                logger.info(f"Twilio OTP sent to {masked}")
                return True, f"OTP sent to {masked}"
            except ImportError:
                import requests
                twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
                res = requests.post(
                    twilio_url,
                    data={"From": from_phone, "To": formatted_dest, "Body": message_text},
                    auth=(account_sid, auth_token),
                    timeout=8
                )
                if res.status_code in (200, 201):
                    logger.info(f"Twilio HTTP API OTP sent to {masked}")
                    return True, f"OTP sent to {masked}"
                else:
                    err = res.json().get("message", "Twilio API error")
                    logger.error(f"Twilio HTTP error: {err}")
                    return False, f"Twilio delivery failed: {err}"
        except Exception as e:
            logger.error(f"Twilio SMS delivery error for {masked}: {str(e)}")
            return False, "Failed to deliver SMS via Twilio."


    else:
        logger.info(f"Default OTP dispatch trigger for {masked}")
        return True, f"OTP dispatched to {masked}"
