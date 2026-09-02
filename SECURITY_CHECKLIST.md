# CypherBuddy Pre-Deployment Security Checklist

Use this checklist before releasing any new feature or build to production.

---

## 🔒 1. Authentication & Authorization Checklist
- [x] Passwords are never stored in plaintext (Bcrypt hashed with salt).
- [x] Generic error messages returned on login failure (no account enumeration).
- [x] Rate limiting active on `/api/auth/login` (Account lockout after 5 failed attempts).
- [x] JWT tokens signed with strong secret and short expiration times.
- [x] Role-Based Access Control (RBAC) enforced on backend API endpoints for `USER`, `PARENT`, and `ADMIN`.

## 🌐 2. API & Network Security Checklist
- [x] SSRF Protection blocks `127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, and non-HTTP/HTTPS schemes.
- [x] Security headers injected (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`).
- [x] CORS allowed origins restricted strictly to trusted frontend domain (`http://localhost:5173`).
- [x] Request payload size limits enforced (Max 50MB for file uploads).

## 📁 3. File Upload & Sandbox Inspection Checklist
- [x] Magic-byte header verification checks raw binary signatures for `.apk`, `.pdf`, `.png`, `.jpg`, `.exe`.
- [x] Uploaded files saved outside public web root in `uploads_quarantine/`.
- [x] Random UUID renaming applied to prevent path traversal and overwrites.
- [x] SHA-256 cryptographic digest computed for threat reporting.

## 📝 4. Privacy & Audit Logging Checklist
- [x] Security audit logs contain zero passwords, access tokens, OTPs, or private user chats.
- [x] Explicit checkboxes required for Privacy Policy and Terms of Service during registration.
- [x] Mobile permissions requested with clear explanation of WHY and WHAT it is used for.
