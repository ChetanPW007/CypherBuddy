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
