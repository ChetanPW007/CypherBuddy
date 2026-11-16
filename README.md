# CypherBuddy

**CypherBuddy** is an AI-powered cybersecurity companion and link protection application designed for personal and family safety. Built with React, Vite, Capacitor for Android cross-platform support, and a Python FastAPI backend.

---

## Features

- **Link & QR Code Protection**: Real-time inspection of URLs, suspicious links, and QR codes for phishing, malware, and brand impersonation.
- **APK Scanner**: Analyzes Android APK packages for dangerous permissions (e.g., SMS interception, overlay windows).
- **AI Security Assistant**: Natural language security queries and troubleshooting powered by security-focused LLM integration.
- **Family Safety Network**: Share real-time threat alerts with family members to protect vulnerable relatives.
- **Security Gateway Banner**: Background notification overlay for active threat warnings and swift remediation.
- **In-App Auto Update**: Built-in application version tracking and updates.
- **Admin Security Dashboard**: 2-Step OTP-protected administrative monitoring panel.

---

## Tech Stack

### Frontend & Mobile
- **Framework**: React 19 + Vite 8
- **Mobile Runtime**: Capacitor 8 (Android target)
- **Styling**: Glassmorphism CSS, Lucide Icons
- **Linting**: Oxlint

### Backend
- **Framework**: Python FastAPI / Starlette
- **Database**: SQLite / Async Engine
- **SMS & Threat Intelligence**: Custom threat analysis engine & SMS integration

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Android Studio (for Android build and emulation)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/CypherBuddy.git
   cd CypherBuddy
   ```

2. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## Development Workflow

### Run Frontend Development Server
```bash
npm run dev
```

### Run Code Linter
```bash
npm run lint
```

### Build Web Distribution & Sync with Capacitor
```bash
npm run build
npx cap sync android
```

### Run Backend Server
```bash
python backend/main.py
```

---

## WhatsApp Link Gateway (how a tapped link is handled)

1. The user taps a link in WhatsApp. CypherBuddy receives it (Android "Open with" / default-browser role; the
   Settings screen can request the default-browser role through `LinkOpenerPlugin`).
2. `LinkProtectionOverlay` scans it **before anything is opened**. The on-device engine answers in well under a
   millisecond; only link shorteners (bit.ly, tinyurl, ...) are sent to `/api/security/analyze-url`, which expands the
   redirect chain safely (every hop is SSRF-checked and the final site is never contacted).
3. **Safe** -> opened straight in Chrome (never back in CypherBuddy), and CypherBuddy steps behind the chat.
   **Suspicious** -> warning with "Don't open" / "Open anyway". **Dangerous** -> blocked, with the reasons, a full
   report, and a **Report to Cyber Crime** button.
4. **Report** records a reference ID (`POST /api/report/threat`), copies a ready-written complaint, and opens
   https://cybercrime.gov.in (helpline **1930**). The complaint is filed by the user: the portal requires their own
   login and OTP and offers no public API for third-party apps.

### Tests

```bash
python -m pytest backend/test_url_engine.py -q   # backend URL engine (no FastAPI needed)
node scripts/check-url-engine.mjs                # on-device engine vs the same shared corpus
python backend/security_tests.py                 # full API suite (needs requirements.txt installed)
```

### Required environment variables (production)

`JWT_SECRET`, `ADMIN_PASSWORD` (the admin account is only created when it is set), `ADMIN_EMAIL`, `ADMIN_PHONE`.
Keep `ALLOW_DEV_OTP` unset/`false`: when `true` the master OTP `123456` is accepted for admin login.

## Documentation

- [API Security Policy](API_SECURITY.md)
- [Privacy Policy](PRIVACY.md)
- [Security Architecture](SECURITY_ARCHITECTURE.md)
- [Security Checklist](SECURITY_CHECKLIST.md)
- [Third-Party APIs](THIRD_PARTY_APIS.md)
- [Threat Model](THREAT_MODEL.md)

---

## License

Private & Proprietary - CypherBuddy
