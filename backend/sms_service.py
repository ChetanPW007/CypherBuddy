# CypherBuddy OTP & SMS Security Service
# Generates 6-digit cryptographically secure OTPs, securely hashes OTPs before storing, and sends via Fast2SMS

import os
import secrets
import hashlib
import time
import logging
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger("cypherbuddy.otp")

SMS_PROVIDER = os.getenv("SMS_PROVIDER", "fast2sms").lower()
SMS_API_KEY = os.getenv("SMS_API_KEY", "")

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
        # Phone masking: e.g. +917349107584 -> +91 ******7584
        if len(contact) >= 10:
            return contact[:3] + " ****** " + contact[-4:]
        return "******" + contact[-2:] if len(contact) >= 2 else "******"

def send_email_otp(email_addr: str, otp: str) -> bool:
    """Dispatches free OTP email via SMTP (e.g. Gmail SMTP)."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", "").strip()

    if not smtp_user or not smtp_pass:
        return False

    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 CypherBuddy Verification OTP: {otp}"
        msg["From"] = f"CypherBuddy Security <{smtp_user}>"
        msg["To"] = email_addr

        html_content = f"""
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #38bdf8; text-align: center;">CypherBuddy Security Gateway</h2>
          <p style="font-size: 16px;">Hello Admin,</p>
          <p style="font-size: 14px; color: #94a3b8;">Your 6-digit 2-step authentication OTP code is:</p>
          <div style="background-color: #1e293b; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4ade80;">
            {otp}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px; text-align: center;">This code is valid for 5 minutes. Do not share this OTP with anyone.</p>
        </div>
        """
        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=8)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, [email_addr], msg.as_string())
        server.quit()
        logger.info(f"Free SMTP Email OTP dispatched successfully to {email_addr}")
        return True
    except Exception as e:
        logger.error(f"SMTP Email OTP dispatch error: {str(e)}")
        return False

def send_otp(destination: str, otp: str) -> Tuple[bool, str]:
    """
    Dispatches 6-digit OTP via Email, Fast2SMS, or In-App Banner.
    """
    masked = mask_contact(destination)
    message_text = f"Your CypherBuddy Admin verification OTP is {otp}. Valid for 5 minutes."

    # If destination is an email address, send free Email OTP
    if "@" in destination:
        if send_email_otp(destination, otp):
            return True, f"OTP sent to email {masked}"

    provider = os.getenv("SMS_PROVIDER", "fast2sms").lower().strip()
    api_key = os.getenv("SMS_API_KEY", "").strip()

    if provider == "mock" or os.getenv("ENVIRONMENT") == "development" or not api_key:
        print(f"\n[DEV OTP DISPATCH] [DESTINATION: {masked}] -> OTP: {otp}\n")
        logger.info(f"Mock OTP dispatched successfully to {masked}")
        return True, f"OTP sent to {masked}"



    # Fast2SMS Provider Integration
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
        
        # Attempt 1: OTP Route (URL Encoded)
        payload_otp = f"variables_values={otp}&route=otp&numbers={digits_only}"
        res = requests.post(url, data=payload_otp, headers=headers, timeout=8)
        res_json = res.json() if res.content else {}
        
        if res.status_code == 200 and res_json.get("return") is True:
            logger.info(f"Fast2SMS OTP route delivered to {masked}")
            return True, f"OTP sent to {masked}"

        # Attempt 2: OTP Route (JSON Payload)
        headers_json = {'authorization': api_key, 'Content-Type': "application/json"}
        res_j = requests.post(url, json={"route": "otp", "variables_values": str(otp), "numbers": digits_only}, headers=headers_json, timeout=8)
        res_j_json = res_j.json() if res_j.content else {}
        if res_j.status_code == 200 and res_j_json.get("return") is True:
            logger.info(f"Fast2SMS JSON OTP route delivered to {masked}")
            return True, f"OTP sent to {masked}"

        # Attempt 3: Quick SMS Route Fallback
        payload_q = f"message={message_text}&language=english&route=q&numbers={digits_only}"
        res_q = requests.post(url, data=payload_q, headers=headers, timeout=8)
        res_q_json = res_q.json() if res_q.content else {}

        if res_q.status_code == 200 and res_q_json.get("return") is True:
            logger.info(f"Fast2SMS Quick SMS route delivered to {masked}")
            return True, f"OTP sent to {masked}"

        err_msg = res_json.get("message") or res_j_json.get("message") or res_q_json.get("message") or "Fast2SMS delivery error"
        logger.error(f"Fast2SMS API response error: {err_msg}")
        return False, f"SMS Delivery failed: {err_msg}"

    except Exception as e:
        logger.error(f"Fast2SMS Exception: {str(e)}")
        return False, "Failed to deliver SMS via Fast2SMS."

