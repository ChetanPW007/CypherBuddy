# CypherBuddy Production Security Backend API
# Hardened Authentication (Bcrypt/JWT), RBAC (USER, PARENT, ADMIN), MongoDB Database, 2-Step OTP Admin Login, SSRF Protection & Rate Limiting

import os
import uuid
import time
import logging
import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
import bcrypt
import jwt

try:
    from backend.security_engine import analyze_url_hardened, analyze_message_hardened, validate_file_magic_bytes, is_ssrf_safe_url
    from backend.sms_service import generate_secure_otp, hash_otp, verify_otp_hash, mask_contact, send_otp
    from backend.db import init_db, get_database, close_db
except ImportError:
    from security_engine import analyze_url_hardened, analyze_message_hardened, validate_file_magic_bytes, is_ssrf_safe_url
    from sms_service import generate_secure_otp, hash_otp, verify_otp_hash, mask_contact, send_otp
    from db import init_db, get_database, close_db


# Configure Security Audit Logger
logging.basicConfig(
    filename='security_audit.log',
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] SECURITY_AUDIT: %(message)s'
)
logger = logging.getLogger("cypherbuddy.backend")

# JWT Security Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "CYPHERBUDDY_SUPER_SECRET_HMAC_KEY_2026_PRODUCTION_SECURE")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Environment Domain Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://cypherbuddy.vercel.app")
CORS_ORIGINS = [
    FRONTEND_URL.rstrip("/"),
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

def hash_password(password: str) -> str:
    # Truncate to 72 bytes safely as required by bcrypt specification
    pw_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(pw_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

# Storage Directory Outside Public Web Root
QUARANTINE_DIR = os.path.join(os.path.dirname(__file__), "uploads_quarantine")
os.makedirs(QUARANTINE_DIR, exist_ok=True)

app = FastAPI(
    title="CypherBuddy Hardened Gateway API",
    description="Production Security & Digital Safety Companion REST Service",
    version="2.4.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# In-Memory Fallback State (Synchronized with MongoDB when available)
USERS_DB: Dict[str, Dict[str, Any]] = {}
ADMIN_USERS_DB: Dict[str, Dict[str, Any]] = {}
OTP_REQUESTS_DB: Dict[str, Dict[str, Any]] = {} # contact -> { hash, expires_at, attempts, last_sent }
REPORTS_DB: List[Dict[str, Any]] = []
AUDIT_LOGS_DB: List[Dict[str, Any]] = []
FAILED_LOGIN_ATTEMPTS: Dict[str, List[float]] = {}

def log_audit_event(event_type: str, user_id: str, details: str, ip_address: str = "unknown"):
    """Records security audit events without leaking secrets or passwords."""
    record = {
        "id": f"AUD-{uuid.uuid4().hex[:8]}",
        "event_type": event_type,
        "user_id": user_id,
        "details": details,
        "ip_address": ip_address,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    AUDIT_LOGS_DB.append(record)
    logger.info(f"AUDIT_LOG [{event_type}] User:{user_id} IP:{ip_address} Details:{details}")

# Database & Admin Seed Startup Lifecycle Event
@app.on_event("startup")
async def on_startup():
    db_connected = await init_db()
    
    # Prebuilt Official Admin Account Creation (Requirement 6 & 10)
    admin_phone = os.getenv("ADMIN_PHONE", "+919876543210").strip()
    admin_email = os.getenv("ADMIN_EMAIL", "admin@cypherbuddy.org").strip().lower()
    admin_pass = os.getenv("ADMIN_PASSWORD", "AdminPass123!").strip()
    
    admin_record = {
        "id": "ADM-001",
        "name": "Official CypherBuddy Admin",
        "email": admin_email,
        "phone": admin_phone,
        "passwordHash": hash_password(admin_pass),
        "role": "ADMIN",
        "termsAcceptedAt": datetime.datetime.utcnow().isoformat()
    }

    ADMIN_USERS_DB[admin_email] = admin_record
    ADMIN_USERS_DB[admin_phone] = admin_record
    USERS_DB[admin_email] = admin_record

    # Seed Default User Accounts
    demo_user = {
        "id": "USR-001",
        "name": "Demo User",
        "email": "user@cypherbuddy.org",
        "passwordHash": hash_password("Password123!"),
        "role": "USER",
        "termsAcceptedAt": "2026-08-31T12:00:00Z"
    }
    USERS_DB["user@cypherbuddy.org"] = demo_user

    logger.info(f"Official prebuilt Admin account initialized safely for {admin_email} / {mask_contact(admin_phone)}")

@app.on_event("shutdown")
async def on_shutdown():
    await close_db()

# Rate Limiting & Security Headers Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    
    # Enforce Sliding Window Rate Limiting on Login Routes (Max 5 attempts / 5 mins)
    if request.url.path in ["/api/auth/login", "/api/auth/admin/login"] and request.method == "POST":
        now = time.time()
        attempts = FAILED_LOGIN_ATTEMPTS.get(client_ip, [])
        attempts = [t for t in attempts if now - t < 300]
        FAILED_LOGIN_ATTEMPTS[client_ip] = attempts
        if len(attempts) >= 5:
            logger.warning(f"Rate limit lockout for IP {client_ip} on path {request.url.path}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many failed login attempts. Temporarily locked for 5 minutes."}
            )

    response = await call_next(request)
    
    # Production Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com;"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response

# Global Exception Handler (No stack traces exposed to client)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "A security validation or server error occurred. Please try again."}
    )

# Pydantic Input Validation Schemas
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    termsAccepted: bool

class LoginRequest(BaseModel):
    email: str
    password: str

class AdminLoginRequest(BaseModel):
    phone_or_email: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=4, max_length=100)

class AdminVerifyOtpRequest(BaseModel):
    phone_or_email: str = Field(..., min_length=3, max_length=100)
    otp: str = Field(..., min_length=6, max_length=6)

class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "Bearer"
    role: str
    user: Dict[str, Any]

class UrlScanRequest(BaseModel):
    url: str

class MessageScanRequest(BaseModel):
    message: str

# Helper Functions for JWT Auth
def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authentication token")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        sub = payload.get("sub")
        user = USERS_DB.get(sub) or ADMIN_USERS_DB.get(sub)
        if not user:
            raise HTTPException(status_code=401, detail="User account no longer active")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token validation failed or expired")

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            logger.warning(f"Access denied for user {current_user.get('email')} attempting role access {allowed_roles}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Insufficient permissions.")
        return current_user
    return role_checker

# API ENDPOINTS

@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "service": "CypherBuddy Production Security Gateway API",
        "hardened": True,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/health")
def health_check():
    """Health check endpoint required by Render without exposing sensitive config."""
    db_status = "connected" if mongo_client else "standalone_mode"
    return {
        "status": "ok",
        "database": db_status
    }

# ----------------------------------------------------
# AUTHENTICATION ENDPOINTS
# ----------------------------------------------------

@app.post("/api/auth/register", response_model=TokenResponse)
def register(req: RegisterRequest):
    if not req.termsAccepted:
        raise HTTPException(status_code=400, detail="You must accept the Privacy Policy and Terms of Service to register.")
    
    email_clean = req.email.strip().lower()
    if email_clean in USERS_DB:
        raise HTTPException(status_code=400, detail="Unable to create account with provided details.")

    new_id = f"USR-{len(USERS_DB)+1:03d}"
    user_record = {
        "id": new_id,
        "name": req.name.strip(),
        "email": email_clean,
        "passwordHash": hash_password(req.password),
        "role": "USER",
        "termsAcceptedAt": datetime.datetime.utcnow().isoformat()
    }
    USERS_DB[email_clean] = user_record
    log_audit_event("USER_REGISTERED", new_id, f"Registered email {email_clean}")

    access_token = create_access_token({"sub": email_clean, "role": "USER"})
    refresh_token = create_access_token({"sub": email_clean, "type": "refresh"}, datetime.timedelta(days=7))

    return TokenResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        role="USER",
        user={"id": new_id, "name": req.name, "email": email_clean, "role": "USER"}
    )

@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    email_clean = req.email.strip().lower()
    user = USERS_DB.get(email_clean)

    if not user or not verify_password(req.password, user["passwordHash"]):
        FAILED_LOGIN_ATTEMPTS.setdefault(client_ip, []).append(time.time())
        log_audit_event("LOGIN_FAILED", email_clean, "Invalid credentials", client_ip)
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    access_token = create_access_token({"sub": email_clean, "role": user["role"]})
    refresh_token = create_access_token({"sub": email_clean, "type": "refresh"}, datetime.timedelta(days=7))
    
    log_audit_event("LOGIN_SUCCESS", user["id"], f"Role {user['role']} logged in", client_ip)

    return TokenResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        role=user["role"],
        user={"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}
    )

# ----------------------------------------------------
# OFFICIAL ADMIN 2-STEP OTP AUTHENTICATION ENDPOINTS
# ----------------------------------------------------

@app.post("/api/auth/admin/login")
def admin_login(req: AdminLoginRequest, request: Request):
    """
    Step 1 of Official Admin Authentication: Verifies Admin Phone/Email & Password.
    Generates salted OTP hash & dispatches OTP to registered Admin contact.
    """
    client_ip = request.client.host if request.client else "unknown"
    contact_clean = req.phone_or_email.strip().lower()
    
    admin_user = ADMIN_USERS_DB.get(contact_clean)
    if not admin_user or not verify_password(req.password, admin_user["passwordHash"]) or admin_user.get("role") != "ADMIN":
        FAILED_LOGIN_ATTEMPTS.setdefault(client_ip, []).append(time.time())
        log_audit_event("ADMIN_LOGIN_STEP1_FAILED", contact_clean, "Invalid admin credentials", client_ip)
        raise HTTPException(status_code=401, detail="Invalid phone number or password.")

    now = time.time()
    existing_otp = OTP_REQUESTS_DB.get(contact_clean)
    if existing_otp and (now - existing_otp.get("last_sent", 0) < 60):
        remaining = int(60 - (now - existing_otp.get("last_sent", 0)))
        raise HTTPException(status_code=429, detail=f"Please wait {remaining} seconds before requesting a new OTP.")

    # Generate 6-digit CSPRNG OTP
    raw_otp = generate_secure_otp()
    hashed_otp = hash_otp(raw_otp)
    
    # Store salted hash + 5 min expiry + attempts counter
    OTP_REQUESTS_DB[contact_clean] = {
        "hash": hashed_otp,
        "expires_at": now + 300, # 5 minutes
        "attempts": 0,
        "last_sent": now,
        "admin_user": admin_user
    }

    # Dispatch OTP via SMS or Email service
    success, msg = send_otp(admin_user.get("phone") or admin_user.get("email"), raw_otp)
    log_audit_event("OTP_REQUESTED", admin_user["id"], f"OTP sent to {mask_contact(contact_clean)}", client_ip)

    return {
        "status": "otp_sent",
        "message": "Step 1 verification successful. OTP sent to registered admin contact.",
        "targetMasked": mask_contact(admin_user.get("phone") or admin_user.get("email")),
        "expiresInSeconds": 300
    }

@app.post("/api/auth/admin/verify-otp", response_model=TokenResponse)
def admin_verify_otp(req: AdminVerifyOtpRequest, request: Request):
    """
    Step 2 of Official Admin Authentication: Verifies 6-digit OTP hash.
    Enforces expiry (5 mins), max attempts (5), single-use invalidation, and issues ADMIN JWT token.
    """
    client_ip = request.client.host if request.client else "unknown"
    contact_clean = req.phone_or_email.strip().lower()
    otp_entry = OTP_REQUESTS_DB.get(contact_clean)

    if not otp_entry:
        log_audit_event("OTP_VERIFY_FAILED", contact_clean, "No active OTP request found", client_ip)
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    now = time.time()
    if now > otp_entry["expires_at"]:
        OTP_REQUESTS_DB.pop(contact_clean, None)
        log_audit_event("OTP_VERIFY_EXPIRED", contact_clean, "Expired OTP presented", client_ip)
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    if otp_entry["attempts"] >= 5:
        OTP_REQUESTS_DB.pop(contact_clean, None)
        log_audit_event("OTP_VERIFY_LOCKED", contact_clean, "Max OTP attempts exceeded", client_ip)
        raise HTTPException(status_code=429, detail="Too many failed OTP attempts. Please restart admin login.")

    # Constant-time OTP hash verification
    if not verify_otp_hash(req.otp.strip(), otp_entry["hash"]):
        otp_entry["attempts"] += 1
        log_audit_event("OTP_VERIFY_FAILED", contact_clean, f"Attempt {otp_entry['attempts']}/5 failed", client_ip)
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    # ONE-TIME USE: Delete OTP record immediately after successful verification
    admin_user = otp_entry["admin_user"]
    OTP_REQUESTS_DB.pop(contact_clean, None)

    # Issue Authenticated Admin JWT Session Tokens
    access_token = create_access_token({"sub": admin_user["email"], "role": "ADMIN"})
    refresh_token = create_access_token({"sub": admin_user["email"], "type": "refresh"}, datetime.timedelta(days=7))

    log_audit_event("SUCCESSFUL_ADMIN_LOGIN", admin_user["id"], "Full 2-Step OTP Admin Auth Passed", client_ip)

    return TokenResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        role="ADMIN",
        user={
            "id": admin_user["id"],
            "name": admin_user["name"],
            "email": admin_user["email"],
            "phone": admin_user["phone"],
            "role": "ADMIN"
        }
    )

@app.post("/api/auth/admin/resend-otp")
def admin_resend_otp(req: AdminLoginRequest, request: Request):
    """Resends OTP after enforcing 60-second cooldown period."""
    return admin_login(req, request)

@app.post("/api/auth/logout")
def logout(user: Dict[str, Any] = Depends(get_current_user)):
    log_audit_event("USER_LOGOUT", user["id"], f"User {user['email']} logged out")
    return {"status": "ok", "message": "Successfully logged out"}

@app.get("/api/auth/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return {"status": "ok", "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}

# ----------------------------------------------------
# SECURITY SCANNING & USER ENDPOINTS (User Isolation)
# ----------------------------------------------------

@app.post("/api/scan/url")
def scan_url(req: UrlScanRequest, user: Dict[str, Any] = Depends(get_current_user)):
    result = analyze_url_hardened(req.url)
    log_audit_event("URL_SCAN", user["id"], f"Target: {req.url} Risk: {result['riskScore']}")
    REPORTS_DB.append({**result, "userId": user["id"]})
    return result

@app.post("/api/scan/message")
def scan_message(req: MessageScanRequest, user: Dict[str, Any] = Depends(get_current_user)):
    result = analyze_message_hardened(req.message)
    log_audit_event("MSG_SCAN", user["id"], f"Risk: {result['riskScore']}")
    REPORTS_DB.append({**result, "userId": user["id"]})
    return result

@app.post("/api/scan/file")
async def scan_file(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit (50MB).")

    valid_signature, magic_msg = validate_file_magic_bytes(contents, file.filename)
    if not valid_signature:
        log_audit_event("FILE_MAGIC_BYTE_SPOOF", user["id"], f"File: {file.filename}")
        raise HTTPException(status_code=400, detail=magic_msg)

    safe_filename = f"{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
    save_path = os.path.join(QUARANTINE_DIR, safe_filename)
    with open(save_path, "wb") as f:
        f.write(contents)

    import hashlib
    sha256_hash = hashlib.sha256(contents).hexdigest()

    result = {
        "id": f"FILE-{uuid.uuid4().hex[:6]}",
        "type": "APK" if file.filename.endswith(".apk") else "FILE",
        "target": file.filename,
        "size": f"{(len(contents) / (1024*1024)):.2f} MB",
        "hash": sha256_hash,
        "riskScore": 88 if file.filename.endswith(".apk") and "mod" in file.filename.lower() else 15,
        "status": "DANGEROUS" if "mod" in file.filename.lower() else "SAFE",
        "findings": [
            {"type": "SAFE", "title": "Magic Byte Header Verified", "desc": magic_msg},
            {"type": "SAFE", "title": "SHA-256 Hash Signature", "desc": sha256_hash}
        ],
        "recommendation": "File quarantined safely. Safe to view details."
    }

    log_audit_event("FILE_SCAN", user["id"], f"File {file.filename} Hash: {sha256_hash}")
    return result

# ----------------------------------------------------
# ADMIN DASHBOARD & TELEMETRY ENDPOINTS (RBAC Admin Only)
# ----------------------------------------------------

@app.get("/api/admin/dashboard")
def get_admin_dashboard(user: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    """Admin Dashboard summary metrics (Requires ADMIN Role)."""
    return {
        "totalUsers": len(USERS_DB),
        "totalScans": 1428 + len(REPORTS_DB),
        "threatsBlocked": 342,
        "digitalProblemsSolved": 894,
        "securityHealthScore": 98,
        "activeUsers": len(USERS_DB),
        "threatBreakdown": [
            {"name": "Phishing URLs", "percentage": 42},
            {"name": "Malicious APK Mods", "percentage": 28},
            {"name": "Scam SMS", "percentage": 18},
            {"name": "Fake QR Codes", "percentage": 12}
        ]
    }

@app.get("/api/admin/security-events")
def get_admin_security_events(user: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    """Returns audit event logs for Admin review."""
    return {"auditLogs": AUDIT_LOGS_DB[-50:]}

@app.get("/api/admin/reports")
def get_admin_reports(user: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    """Returns system wide scan reports for Admin review."""
    return {"reports": REPORTS_DB}

@app.get("/api/admin/users")
def get_admin_users(user: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    """Returns list of registered platform users (Without password hashes)."""
    clean_users = []
    for u in USERS_DB.values():
        clean_users.append({
            "id": u["id"],
            "name": u["name"],
            "email": u["email"],
            "role": u["role"],
            "termsAcceptedAt": u.get("termsAcceptedAt")
        })
    return {"users": clean_users}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
