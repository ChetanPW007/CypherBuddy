# CypherBuddy API Security Specification

## 1. Authentication Endpoints

### `POST /api/auth/register`
- **Request Validation**: Validates name, email format, minimum 8-char password, and explicit `termsAccepted: true`.
- **Security Control**: Hashes password using Bcrypt. Returns non-enumerating error if account exists.
- **Response**: JWT Access & Refresh Token pair.

### `POST /api/auth/login`
- **Security Control**: Rate limited to 5 attempts per 5 minutes per IP address. Account locked upon threshold breach.
- **Response**: JWT Access Token (Expires in 60 mins), Refresh Token (Expires in 7 days).

---

## 2. Threat Analysis Endpoints (Requires Bearer Token)

### `POST /api/scan/url`
- **Protection**: SSRF Validation Guard filters out loopback, private IPv4/IPv6 networks, and AWS/GCP metadata endpoints (`169.254.169.254`).
- **Input**: `{ "url": "https://example.com" }`

### `POST /api/scan/file`
- **Protection**: 50MB Size Cap + Magic-Byte binary header inspection. Files stored in isolated quarantine folder with random UUID filename.

---

## 3. Administrative Endpoints (Requires ADMIN Role)

### `GET /api/admin/telemetry`
- **Authorization**: Protected via `require_role(["ADMIN"])` backend dependency. Rejects unauthorized normal users with HTTP 403 Forbidden.
