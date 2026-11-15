# CypherBuddy Third-Party API & Open-Source Integration Guide

CypherBuddy is designed to operate primarily with **free, open-source technologies** so that it can run autonomously without requiring paid third-party services.

---

## 0. What is implemented today

The URL / link engine (`backend/security_engine.py` and the identical on-device port `src/services/urlEngine.js`)
is **heuristic only**: registrable-domain brand matching, typosquat / homograph detection, TLD reputation,
scam-word and path analysis, and safe short-link expansion. It calls **no third-party service**. Both engines read the
same data file, `shared/url_intel.json`, and are checked against `shared/url_test_corpus.json`.

The tools listed in section 1 are the **planned / optional integrations**; they are not wired into the code yet.

## 1. Open-Source Engine Integrations (planned / optional)

- **MobSF (Mobile Security Framework)**: Used for isolated Android APK static/dynamic analysis.
- **YARA Rules Engine**: Used for pattern matching malware signatures against uploaded binaries.
- **ClamAV**: Open-source antivirus engine for file scanning.
- **Tesseract OCR & OpenCV**: Extracts text and QR codes from uploaded screenshots safely on the backend.

---

## 2. Optional Third-Party Services (Graceful Fallback)

### VirusTotal API v3 (Optional Reputation Analysis)
- **Usage**: Querying file hashes and domain reputation.
- **Rate Limit Caution**: VirusTotal Public API is strictly limited to 4 requests/minute and 500 requests/day.
- **Fallback Design**: If VirusTotal is unavailable or rate-limited, CypherBuddy automatically falls back to local heuristic analysis without throwing errors.

### YouTube Data API v3 (Tutorial Recommendations)
- **Usage**: Fetching verified step-by-step video tutorials for digital troubleshooting.
- **Security Rule**: API Key is stored strictly on the backend (`.env`).
- **Fallback Design**: Provides local search fallback URLs if the API quota is exhausted.
