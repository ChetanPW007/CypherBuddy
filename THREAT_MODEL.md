# CypherBuddy STRIDE Threat Model

This document outlines the threat analysis for CypherBuddy using the **STRIDE** methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).

---

## 1. STRIDE Threat Analysis Matrix

| Threat Category | Potential Attack Vector | Impact | Mitigations Implemented in CypherBuddy |
|---|---|---|---|
| **S**poofing | Attacker impersonates legitimate user or brand domain | High | Bcrypt password hashing + JWT authentication signatures; Brand impersonation scanner flags fake domains. |
| **T**ampering | Attacker spoofs file extensions (e.g. rename `.exe` to `.png`) | High | **Magic-Byte Binary Inspection** verifies raw byte headers (`PK`, `%PDF`, `PNG`, `JPG`, `MZ`). |
| **R**epudiation | User denies creating malicious report or uploading file | Medium | Structured **Security Audit Logging** records IP, timestamp, and SHA-256 hash digests. |
| **I**nformation Disclosure | Attacker probes endpoints to discover user emails | Medium | **Generic Non-Enumerating Error Messages** on login/register endpoints; Error handler suppresses stack traces. |
| **D**enial of Service | Brute-force login attempts or massive file uploads | High | **Sliding Window Rate Limiter** locks accounts after 5 failed attempts; 50MB request payload limit. |
| **E**levation of Privilege | User attempts to call `/api/admin/*` endpoints | High | **Role-Based Access Control (RBAC)** enforced on backend via `require_role(["ADMIN"])` dependencies. |

---

## 2. SSRF Threat Mitigation (Server-Side Request Forgery)
- **Attacker Goal**: User inputs target URL `http://169.254.169.254/latest/meta-data/` or `http://127.0.0.1:8000/admin` to scan internal services.
- **CypherBuddy Defense**: `is_ssrf_safe_url()` parses hostname and resolves DNS to verify IP does not fall within RFC1918 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`), or AWS/GCP cloud metadata ranges.
