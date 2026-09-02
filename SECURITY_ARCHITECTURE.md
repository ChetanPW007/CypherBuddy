# CypherBuddy Security Architecture Specification

## 1. Executive Summary
CypherBuddy is engineered around a **Zero-Trust, Security-by-Design** philosophy. Security is not an overlay or single screen—it is enforced across every architectural layer from the mobile client interface down to isolated file sandbox execution environments.

---

## 2. High-Level Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 CYPHERBUDDY MOBILE / WEB CLIENT              │
│       React + Vite + Glassmorphism UI (Light & Dark)        │
│          SSRF URL Input | File Uploader | Message NLP       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / TLS 1.3
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            HARDENED FASTAPI GATEWAY & SECURITY BUS           │
│  ├── JWT Authentication & Bcrypt Password Hashing           │
│  ├── Sliding Window Rate Limiting & Account Lockout Guard   │
│  ├── SSRF RFC1918 Private IP & Cloud Metadata Filter        │
│  ├── Magic-Byte File Header Inspector                       │
│  ├── Security Audit Logger & Generic Exception Handler      │
│  └── Role-Based Access Control (USER, PARENT, ADMIN)        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│ ISOLATED MALWARE ANALYSIS    ││ THREAT INTELLIGENCE FEED    │
│ Quarantine Directory Storage ││ VirusTotal Fallback Engine   │
│ SHA-256 Crypto Digest        ││ Open-Source YARA Rules       │
│ MobSF Sandbox Container      ││ YouTube Data API Integration │
└──────────────────────────────┘└──────────────────────────────┘
```

---

## 3. Defense-in-Depth Control Matrix

| Component | Threat Addressed | Defense Mechanism Implemented |
|---|---|---|
| **API Gateway** | SSRF, Unauthenticated Access | RFC1918 Private IP Regex Filter, JWT Authorization Headers |
| **Authentication** | Brute-force, User Enumeration | Bcrypt Hashing, 5-minute Account Lockout, Generic Error Responses |
| **File Handler** | Extension Spoofing, Malware | Magic-Byte Signature Verification, Random UUID Renaming, Quarantined Storage |
| **Response Headers**| XSS, Clickjacking, MIME Sniffing | CSP, HSTS, X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff |
| **Logging** | Data Leakage | Structured Security Audit Logs excluding passwords, tokens, and private chat data |

---

## 4. Environment Secrets Management
All secrets (JWT signing keys, database credentials, API keys) must be injected via system environment variables (`.env`). Secrets are never committed to version control.
