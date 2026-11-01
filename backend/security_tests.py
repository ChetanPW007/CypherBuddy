# CypherBuddy Comprehensive 100% Verification Test Suite
# Tests authentication, RBAC, SSRF protection, URL analysis, real APK bytecode parsing,
# Family Safety network, AI assistant diagnostics, and HTTP security headers.

import io
import os
import sys
import zipfile
import time

# Ensure project root and backend folder are in Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from starlette.testclient import TestClient

# Ensure development mode is active for test OTP verification
os.environ["ALLOW_DEV_OTP"] = "true"

try:
    from backend.main import app
except ImportError:
    from main import app

client = TestClient(app)

PASS = "[PASS]"
FAIL = "[FAIL]"
results = []

def log_test(name, passed, detail=""):
    status = PASS if passed else FAIL
    results.append((name, status, detail))
    print(f"  {status} {name}" + (f" — {detail}" if detail else ""))

print("\n" + "=" * 65)
print("  CYPHERBUDDY 100% FULL-SYSTEM VERIFICATION TEST SUITE")
print("=" * 65 + "\n")

# ============================================================
# 1. SYSTEM HEALTH & SERVICE DISCOVERY
# ============================================================
print("--- 1. System Health & Gateway Discovery ---")

r = client.get("/")
log_test("Root endpoint returns 200 ONLINE", r.status_code == 200 and r.json().get("status") == "ONLINE")

r = client.get("/health")
log_test("Health endpoint returns 200 OK", r.status_code == 200 and r.json().get("status") == "ok")

r = client.get("/api/app/version")
log_test("App version manifest accessible", r.status_code == 200 and "latest_version" in r.json())


# ============================================================
# 2. AUTHENTICATION & ACCESS CONTROL (RBAC)
# ============================================================
print("\n--- 2. Authentication & Role-Based Access Control ---")

# 2.1 Invalid user login
r = client.post("/api/auth/login", json={"email": "nonexistent@test.com", "password": "wrongpassword123"})
log_test("Invalid credentials return 401", r.status_code == 401)
log_test("Generic non-enumerating error message", "Invalid email or password" in r.json().get("detail", ""))

# 2.2 Valid user login
r = client.post("/api/auth/login", json={"email": "user@cypherbuddy.org", "password": "Password123!"})
log_test("Valid user login returns 200", r.status_code == 200)
user_data = r.json()
user_token = user_data.get("accessToken", "")
log_test("User JWT access token generated", len(user_token) > 20)
log_test("User role is USER", user_data.get("role") == "USER")

user_headers = {"Authorization": f"Bearer {user_token}"}

# 2.3 Registration with terms
new_email = f"test_{int(time.time())}@cypherbuddy.org"
r = client.post("/api/auth/register", json={
    "name": "Safety Tester",
    "email": new_email,
    "password": "StrongPassword123!",
    "termsAccepted": True
})
log_test("New user registration with terms returns 200", r.status_code == 200)

# 2.4 Registration without terms must be rejected
r = client.post("/api/auth/register", json={
    "name": "No Terms",
    "email": "noterms@test.com",
    "password": "Password123!",
    "termsAccepted": False
})
log_test("Registration without terms rejected (400)", r.status_code == 400)

# 2.5 USER cannot access admin dashboard
r = client.get("/api/admin/dashboard", headers=user_headers)
log_test("USER role blocked from Admin Dashboard (403)", r.status_code == 403)

# 2.6 Missing token blocked
r = client.get("/api/admin/dashboard")
log_test("Unauthenticated access blocked (401)", r.status_code == 401)

# 2.7 Admin login: Step 1 (Triggers 2-Step OTP)
r = client.post("/api/auth/login", json={"email": "admin@cypherbuddy.org", "password": "AdminPass123!"})
log_test("Admin login triggers Step 2 OTP flow", r.status_code == 200 and r.json().get("status") == "otp_required")

# 2.8 Admin login: Step 2 (Verify OTP)
r = client.post("/api/auth/admin/verify-otp", json={"phone_or_email": "admin@cypherbuddy.org", "otp": "123456"})
log_test("Admin OTP verification succeeds (200)", r.status_code == 200)
admin_token = r.json().get("accessToken", "")
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# 2.9 Admin accessing Admin Dashboard
r = client.get("/api/admin/dashboard", headers=admin_headers)
log_test("ADMIN can access Dashboard telemetry (200)", r.status_code == 200 and "totalScans" in r.json())


# ============================================================
# 3. SSRF PROTECTION & NETWORK FILTERING
# ============================================================
print("\n--- 3. SSRF Protection & Private Network Filtering ---")

ssrf_payloads = [
    ("http://127.0.0.1:8000/api/admin/dashboard", "Localhost loopback blocked"),
    ("http://169.254.169.254/latest/meta-data/", "AWS/GCP Cloud metadata blocked"),
    ("http://10.0.0.1/admin-panel", "RFC1918 10.x private network blocked"),
    ("http://192.168.1.1/router-login", "RFC1918 192.168.x private network blocked"),
    ("ftp://malicious.org/trojan.apk", "Non-HTTP protocol scheme blocked")
]

for url, label in ssrf_payloads:
    r = client.post("/api/scan/url", json={"url": url}, headers=user_headers)
    data = r.json()
    is_blocked = data.get("riskScore", 0) == 100 or data.get("status") == "DANGEROUS"
    log_test(f"SSRF: {label}", is_blocked)


# ============================================================
# 4. URL PHISHING, PUNYCODE & BRAND DEFENSE
# ============================================================
print("\n--- 4. URL Threat & Homograph Phishing Tests ---")

# 4.1 Typosquatting / Brand impersonation
r = client.post("/api/scan/url", json={"url": "https://paypa1-account-security-update.xyz/login"}, headers=user_headers)
data = r.json()
log_test("Typosquat domain detected as DANGEROUS", data.get("status") == "DANGEROUS" and data.get("riskScore", 0) >= 70)

# 4.2 Punycode / IDN Homograph
r = client.post("/api/scan/url", json={"url": "https://xn--pple-43d.com/verify"}, headers=user_headers)
data = r.json()
log_test("Punycode homograph domain detected as DANGEROUS", data.get("status") == "DANGEROUS")

# 4.3 Direct IP Hostname
r = client.post("/api/scan/url", json={"url": "http://185.220.101.5/login.php"}, headers=user_headers)
data = r.json()
log_test("Direct IP address hostname flagged", data.get("riskScore", 0) >= 50)

# 4.4 Legitimate official domain
r = client.post("/api/scan/url", json={"url": "https://support.google.com/android"}, headers=user_headers)
data = r.json()
log_test("Legitimate site detected as SAFE", data.get("status") == "SAFE" and data.get("riskScore", 0) < 35)


# ============================================================
# 5. REAL APK STATIC BYTECODE & MANIFEST INSPECTION
# ============================================================
print("\n--- 5. Real APK Bytecode & Manifest Inspection Tests ---")

# 5.1 Create mock APK ZIP in memory with high-risk AndroidManifest permissions
apk_buf = io.BytesIO()
with zipfile.ZipFile(apk_buf, 'w') as zf:
    manifest_bytes = (
        b"AndroidManifest.xml binary header\x00"
        b"android.permission.SEND_SMS\x00"
        b"android.permission.SYSTEM_ALERT_WINDOW\x00"
        b"android.permission.BIND_ACCESSIBILITY_SERVICE\x00"
    )
    zf.writestr("AndroidManifest.xml", manifest_bytes)
    zf.writestr("classes.dex", b"\x64\x65\x78\x0a\x30\x33\x35\x00")  # DEX magic header
apk_bytes = apk_buf.getvalue()

r = client.post(
    "/api/scan/file",
    files={"file": ("Banking_Helper_Update.apk", io.BytesIO(apk_bytes), "application/vnd.android.package-archive")},
    headers=user_headers
)
log_test("APK upload accepted (200)", r.status_code == 200)
apk_result = r.json()
log_test("APK classified as DANGEROUS based on real permissions", apk_result.get("status") == "DANGEROUS")
log_test("Dangerous permissions correctly extracted from manifest", 
         "SEND_SMS" in apk_result.get("permissions", []) and "SYSTEM_ALERT_WINDOW" in apk_result.get("permissions", []))
log_test("Cryptographic SHA-256 returned", len(apk_result.get("hash", "")) == 64)

# 5.2 Test disguised Windows Executable (MZ header)
exe_bytes = b"MZ\x90\x00\x03\x00\x00\x00" + b"\x00" * 64
r = client.post(
    "/api/scan/file",
    files={"file": ("document_receipt.exe", io.BytesIO(exe_bytes), "application/octet-stream")},
    headers=user_headers
)
exe_result = r.json()
log_test("Disguised Windows executable flagged as DANGEROUS", exe_result.get("status") == "DANGEROUS" and exe_result.get("riskScore") >= 90)


# ============================================================
# 6. MESSAGE & SMS SCAM CLASSIFIER
# ============================================================
print("\n--- 6. Message / SMS Scam Heuristics ---")

r = client.post("/api/scan/message", json={
    "message": "URGENT: Your SBI bank account will be blocked within 24 hours due to pending KYC. Share your OTP now."
}, headers=user_headers)
msg_result = r.json()
log_test("Urgent banking OTP smishing classified as DANGEROUS", msg_result.get("status") == "DANGEROUS")

r = client.post("/api/scan/message", json={
    "message": "Hi grandpa, I am on the way home from school. See you at dinner!"
}, headers=user_headers)
safe_msg = r.json()
log_test("Normal personal message classified as SAFE", safe_msg.get("status") == "SAFE")


# ============================================================
# 7. CLOUD-SYNCHRONIZED FAMILY SAFETY NETWORK
# ============================================================
print("\n--- 7. Cloud-Synchronized Family Safety Shield ---")

# 7.1 Pair a new family device
r = client.post("/api/family/pair", json={"name": "Grandma's Galaxy A34", "relation": "Grandmother"}, headers=user_headers)
log_test("Family device pairing returns 200", r.status_code == 200)
pair_data = r.json()
pair_token = pair_data.get("member", {}).get("pair_token", "")
member_id = pair_data.get("member", {}).get("id", "")
log_test("Pairing key generated (PAIR-XXXX)", pair_token.startswith("PAIR-"))

# 7.2 List family members
r = client.get("/api/family/members", headers=user_headers)
log_test("Family members list retrieved", r.status_code == 200 and len(r.json().get("members", [])) >= 1)

# 7.3 Report a threat alert from a family member
r = client.post("/api/family/alert", json={
    "device_name": "Grandma's Galaxy A34",
    "threat_type": "PHISHING_URL",
    "risk_score": 92,
    "target": "sbi-kyc-scam.online"
}, headers=user_headers)
log_test("Family threat alert reported successfully", r.status_code == 200)
alert_id = r.json().get("alert", {}).get("id", "")

# 7.4 Get active family alerts
r = client.get("/api/family/alerts", headers=user_headers)
log_test("Active family alerts listed", r.status_code == 200 and len(r.json().get("alerts", [])) >= 1)

# 7.5 Resolve alert
r = client.post(f"/api/family/alerts/{alert_id}/resolve", headers=user_headers)
log_test("Family threat alert resolved successfully", r.status_code == 200)

# 7.6 Remove family device
r = client.delete(f"/api/family/members/{member_id}", headers=user_headers)
log_test("Family device removed successfully", r.status_code == 200)


# ============================================================
# 8. AI CYBERSECURITY & DIAGNOSTIC ASSISTANT
# ============================================================
print("\n--- 8. AI Troubleshooting & Diagnostic Assistant ---")

# 8.1 Wi-Fi diagnostic query
r = client.post("/api/assistant/chat", json={"query": "wifi keeps disconnecting on android"}, headers=user_headers)
log_test("Wi-Fi assistant query returns 200", r.status_code == 200)
ai_wifi = r.json()
log_test("Structured troubleshooting steps returned", len(ai_wifi.get("steps", [])) >= 3)
log_test("YouTube video recommendation link provided", "youtube.com" in ai_wifi.get("youtube_search_url", ""))

# 8.2 Popup malware diagnostic query
r = client.post("/api/assistant/chat", json={"query": "how to stop fake virus popups on chrome"}, headers=user_headers)
log_test("Malware popup assistant query returns 200", r.status_code == 200)
ai_popup = r.json()
log_test("Popup defense instructions provided", "popups" in ai_popup.get("title", "").lower() or len(ai_popup.get("steps", [])) > 0)


# ============================================================
# 9. HTTP SECURITY HEADERS ENFORCEMENT
# ============================================================
print("\n--- 9. Security Headers Enforcement ---")

r = client.get("/")
headers = r.headers
log_test("X-Content-Type-Options: nosniff", headers.get("X-Content-Type-Options") == "nosniff")
log_test("X-Frame-Options: SAMEORIGIN", headers.get("X-Frame-Options") == "SAMEORIGIN")
log_test("Strict-Transport-Security enabled", "max-age" in headers.get("Strict-Transport-Security", ""))
log_test("Content-Security-Policy enabled", "default-src" in headers.get("Content-Security-Policy", ""))
log_test("Referrer-Policy enabled", "strict-origin" in headers.get("Referrer-Policy", ""))


# ============================================================
# SUMMARY & VERIFICATION OUTCOME
# ============================================================
print("\n" + "=" * 65)
passed = sum(1 for _, s, _ in results if s == PASS)
failed = sum(1 for _, s, _ in results if s == FAIL)
total = len(results)

print(f"  TOTAL TESTS RUN: {total}")
print(f"  PASSED: {passed}")
print(f"  FAILED: {failed}")
print(f"  SUCCESS RATE: {(passed / total) * 100:.1f}%")
print("=" * 65 + "\n")

if failed > 0:
    print("  Failed Tests List:")
    for name, status, detail in results:
        if status == FAIL:
            print(f"    {FAIL} {name}: {detail}")
    exit(1)
else:
    print("  >>> ALL 100% OF SECURITY AND SYSTEM TESTS PASSED SUCCESSFULLY! <<<\n")
