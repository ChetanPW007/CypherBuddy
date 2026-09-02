# CypherBuddy Security Test Suite
# Purpose: Validates authentication, authorization, SSRF protection, rate limiting,
# file upload safety, and API error handling using harmless test payloads only.

import requests
import time

BASE_URL = "http://127.0.0.1:8000"

PASS = "[PASS]"
FAIL = "[FAIL]"
results = []

def log_test(name, passed, detail=""):
    status = PASS if passed else FAIL
    results.append((name, status, detail))
    print(f"  {status} {name}" + (f" — {detail}" if detail else ""))

print("\n" + "=" * 60)
print("  CypherBuddy Security Test Suite v2.4")
print("=" * 60 + "\n")

# ============================================================
# 1. AUTHENTICATION TESTS
# ============================================================
print("--- 1. Authentication Tests ---")

# 1.1 Invalid login should return 401 with generic message
r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "nonexistent@test.com", "password": "wrongpass"})
log_test("Invalid login returns 401", r.status_code == 401)
log_test("Error message is generic (no enumeration)", "Invalid email or password" in r.json().get("detail", ""), r.json().get("detail", ""))

# 1.2 Valid login with demo credentials
r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "user@cypherbuddy.org", "password": "Password123!"})
log_test("Valid login returns 200", r.status_code == 200)
data = r.json()
access_token = data.get("accessToken", "")
log_test("Access token is present", len(access_token) > 20)
log_test("Role is USER", data.get("role") == "USER")

# 1.3 Registration without terms acceptance should fail
r = requests.post(f"{BASE_URL}/api/auth/register", json={"name": "Test", "email": "test@new.com", "password": "TestPass123!", "termsAccepted": False})
log_test("Registration without terms acceptance rejected", r.status_code == 400)

# 1.4 Registration with duplicate email should return generic error
r = requests.post(f"{BASE_URL}/api/auth/register", json={"name": "Dup", "email": "user@cypherbuddy.org", "password": "TestPass123!", "termsAccepted": True})
log_test("Duplicate registration returns generic error", r.status_code == 400)
log_test("No email enumeration in duplicate error", "Unable to create" in r.json().get("detail", ""))

# ============================================================
# 2. AUTHORIZATION / RBAC TESTS
# ============================================================
print("\n--- 2. Authorization / RBAC Tests ---")

headers_user = {"Authorization": f"Bearer {access_token}"}

# 2.1 USER cannot access admin telemetry
r = requests.get(f"{BASE_URL}/api/admin/telemetry", headers=headers_user)
log_test("USER role blocked from admin telemetry (403)", r.status_code == 403)

# 2.2 No token should return 401
r = requests.get(f"{BASE_URL}/api/admin/telemetry")
log_test("Missing auth token returns 401", r.status_code == 401 or r.status_code == 422)

# 2.3 Admin login and access
r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@cypherbuddy.org", "password": "AdminPass123!"})
admin_token = r.json().get("accessToken", "")
headers_admin = {"Authorization": f"Bearer {admin_token}"}
r = requests.get(f"{BASE_URL}/api/admin/telemetry", headers=headers_admin)
log_test("ADMIN can access telemetry (200)", r.status_code == 200)

# ============================================================
# 3. SSRF PROTECTION TESTS
# ============================================================
print("\n--- 3. SSRF Protection Tests ---")

ssrf_targets = [
    ("http://127.0.0.1/admin", "Localhost blocked"),
    ("http://169.254.169.254/latest/meta-data/", "AWS metadata blocked"),
    ("http://10.0.0.1/internal", "RFC1918 10.x blocked"),
    ("http://192.168.1.1/router", "RFC1918 192.168.x blocked"),
    ("ftp://evil.com/malware.apk", "Non-HTTP scheme blocked")
]

for url, desc in ssrf_targets:
    r = requests.post(f"{BASE_URL}/api/scan/url", json={"url": url}, headers=headers_user)
    data = r.json()
    is_blocked = data.get("riskScore", 0) == 100 or data.get("status") == "DANGEROUS"
    log_test(f"SSRF: {desc}", is_blocked, url)

# ============================================================
# 4. URL ANALYSIS TESTS
# ============================================================
print("\n--- 4. URL Security Analysis Tests ---")

r = requests.post(f"{BASE_URL}/api/scan/url", json={"url": "https://paypa1-account-verify.xyz/login"}, headers=headers_user)
data = r.json()
log_test("Phishing URL (typosquat) detected as DANGEROUS", data.get("status") == "DANGEROUS", f"status={data.get('status')}, score={data.get('riskScore')}")
log_test("Risk score >= 70 for phishing URL", data.get("riskScore", 0) >= 70, str(data.get('riskScore')))

r = requests.post(f"{BASE_URL}/api/scan/url", json={"url": "https://support.google.com/android"}, headers=headers_user)
data = r.json()
log_test("Safe URL detected as SAFE", data.get("status") == "SAFE")
log_test("Risk score < 35 for safe URL", data.get("riskScore", 0) < 35)

# ============================================================
# 5. MESSAGE ANALYSIS TESTS
# ============================================================
print("\n--- 5. Message / SMS Analysis Tests ---")

r = requests.post(f"{BASE_URL}/api/scan/message", json={"message": "URGENT: Your account has been blocked. Share OTP immediately to restore."}, headers=headers_user)
data = r.json()
log_test("Scam message with urgency + OTP flagged", data.get("status") in ["DANGEROUS", "SUSPICIOUS"])
log_test("Scam message risk score >= 35", data.get("riskScore", 0) >= 35)

r = requests.post(f"{BASE_URL}/api/scan/message", json={"message": "Hey, are we still meeting for coffee tomorrow at 3pm?"}, headers=headers_user)
data = r.json()
log_test("Normal message classified as SAFE", data.get("status") == "SAFE")

# ============================================================
# 6. FILE UPLOAD SIZE LIMIT TEST
# ============================================================
print("\n--- 6. File Upload Security Tests ---")

# Test with a small valid file (just a test, not actual malware)
test_content = b"PK\x03\x04" + b"\x00" * 100  # Valid ZIP/APK header
import io
files = {"file": ("test_safe.apk", io.BytesIO(test_content), "application/vnd.android.package-archive")}
r = requests.post(f"{BASE_URL}/api/scan/file", files=files, headers=headers_user)
log_test("Small APK upload accepted (200)", r.status_code == 200)
data = r.json()
log_test("SHA-256 hash returned in response", len(data.get("hash", "")) == 64)

# ============================================================
# 7. ERROR HANDLING TESTS
# ============================================================
print("\n--- 7. Error Handling Tests ---")

r = requests.post(f"{BASE_URL}/api/scan/url", json={"url": ""}, headers=headers_user)
log_test("Empty URL handled safely", r.status_code in [200, 400, 422])

# Expired/invalid token
headers_bad = {"Authorization": "Bearer invalid.token.here"}
r = requests.post(f"{BASE_URL}/api/scan/url", json={"url": "https://test.com"}, headers=headers_bad)
log_test("Invalid JWT token returns 401", r.status_code == 401)

# ============================================================
# 8. SECURITY HEADERS TEST
# ============================================================
print("\n--- 8. Security Headers Tests ---")

r = requests.get(f"{BASE_URL}/")
log_test("X-Content-Type-Options: nosniff", r.headers.get("X-Content-Type-Options") == "nosniff")
log_test("X-Frame-Options: SAMEORIGIN", r.headers.get("X-Frame-Options") == "SAMEORIGIN")
log_test("Strict-Transport-Security present", "max-age" in r.headers.get("Strict-Transport-Security", ""))
log_test("Content-Security-Policy present", "default-src" in r.headers.get("Content-Security-Policy", ""))
log_test("Referrer-Policy present", r.headers.get("Referrer-Policy", "") != "")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 60)
passed = sum(1 for _, s, _ in results if s == PASS)
failed = sum(1 for _, s, _ in results if s == FAIL)
total = len(results)
print(f"  RESULTS: {passed}/{total} passed, {failed} failed")
print("=" * 60 + "\n")

if failed > 0:
    print("  Failed tests:")
    for name, status, detail in results:
        if status == FAIL:
            print(f"    {FAIL} {name}: {detail}")
