import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# Colors for branding
COLOR_NAVY = RGBColor(11, 19, 41)       # #0B1329
COLOR_CYAN = RGBColor(2, 132, 199)      # #0284C7
COLOR_DARK_RED = RGBColor(220, 38, 38)  # #DC2626
COLOR_SLATE = RGBColor(100, 116, 139)   # #64748B
COLOR_DARK_TEXT = RGBColor(30, 41, 59)  # #1E293B

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_docx(filename):
    print(f"Creating Word document: {filename}...")
    doc = docx.Document()

    # Page Margins (0.75 inch)
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # Styles Setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = COLOR_DARK_TEXT
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # --- COVER / TITLE BLOCK ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(36)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("CYPHERBUDDY")
    run_title.font.name = 'Arial'
    run_title.font.size = Pt(30)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_NAVY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(16)
    run_sub = sub_p.add_run("Autonomous Mobile Threat Gateway, Link Protection System & Digital Safety Companion")
    run_sub.font.name = 'Arial'
    run_sub.font.size = Pt(14)
    run_sub.font.color.rgb = COLOR_CYAN

    desc_p = doc.add_paragraph()
    desc_p.paragraph_format.space_after = Pt(24)
    run_desc = desc_p.add_run("Comprehensive Technical Reference Manual, Architectural Specification, and Project Execution Report")
    run_desc.font.size = Pt(11)
    run_desc.font.italic = True
    run_desc.font.color.rgb = COLOR_SLATE

    # Meta Table
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Project Status", "Production-Ready Release (Version 3.0.0)"),
        ("Primary Target Platforms", "Android (Capacitor 8 / SDK 35), Web (React 19 / Vite 8), Cloud (FastAPI / Render)"),
        ("Repository", "https://github.com/ChetanPW007/CypherBuddy"),
        ("Documentation Date", "November 2026"),
        ("Core Engineering Domains", "Mobile Link Interception, On-Device Threat Intelligence, Static Bytecode Analysis, Dual-Core AI Diagnostic Engine")
    ]
    for row_idx, (k, v) in enumerate(meta_data):
        row = meta_table.rows[row_idx]
        c0 = row.cells[0]
        c1 = row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.8)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = COLOR_NAVY
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)
        
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=80, bottom=80, left=120, right=120)
        set_cell_margins(c1, top=80, bottom=80, left=120, right=120)

    doc.add_page_break()

    # Helper function for adding headings
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = COLOR_NAVY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_CYAN
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = COLOR_DARK_TEXT
        return p

    def add_callout(text, title=None, alert_type="info"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.rows[0].cells[0]
        cell.width = Inches(7.0)
        bg = "EFF6FF" if alert_type == "info" else "FEF2F2"
        border_color = "0284C7" if alert_type == "info" else "DC2626"
        set_cell_background(cell, bg)
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        if title:
            rt = p.add_run(f"[{title}] ")
            rt.font.bold = True
            rt.font.size = Pt(10)
            rt.font.color.rgb = COLOR_CYAN if alert_type == "info" else COLOR_DARK_RED
        r = p.add_run(text)
        r.font.size = Pt(10)
        doc.add_paragraph() # spacer

    # --- SECTION 1: EXECUTIVE SUMMARY ---
    add_h1("1. Executive Summary & Problem Space")
    p = doc.add_paragraph()
    p.add_run(
        "CypherBuddy is an AI-powered personal cybersecurity companion and autonomous mobile link gateway "
        "engineered for Android and modern web platforms. Built upon a strict Zero-Trust, Security-by-Design "
        "paradigm, CypherBuddy acts as an active shield between deceptive incoming communications (WhatsApp messages, "
        "SMS smishing, email links, QR codes, APK downloads) and the user's device execution environment."
    )
    p = doc.add_paragraph()
    p.add_run(
        "Traditional consumer security software fails modern smartphone users for three fundamental reasons:\n"
        "1. Latency & Intrusiveness: Enterprise sandbox scanners require 3 to 5 minutes to spin up virtualized instances, making real-time chat link checking impossible.\n"
        "2. The 'Jargon Barrier': Standard antivirus tools present cryptic hexadecimal codes or confusing risk notices that children, elderly family members, and non-technical users dismiss.\n"
        "3. Privacy Infringement: Many security apps inspect personal chats, photos, and contacts to detect malware. CypherBuddy enforces zero content snooping, operating strictly on intercepted URI metadata, binary headers, and user-initiated inputs."
    )
    add_callout(
        "Core Value Proposition: CypherBuddy delivers on-device heuristic URL verdicts in under 15 milliseconds, "
        "allowing safe links to seamlessly continue into external browsers (Chrome) while minimizing itself into the background. "
        "Malicious threats trigger immediate high-contrast warning cards, zero-click cyber crime reporting, and instant family alerts.",
        title="Mission Statement",
        alert_type="info"
    )

    # --- SECTION 2: COMPLETE TECH STACK ---
    add_h1("2. Comprehensive Technology Stack & Justification Matrix")
    p = doc.add_paragraph()
    p.add_run(
        "Every single library, framework, protocol, and language in CypherBuddy was deliberately selected "
        "to satisfy strict performance, privacy, battery conservation, and security criteria. The complete stack is detailed below:"
    )

    stack_data = [
        ("Component", "Technology / Tool", "Exact Purpose in CypherBuddy", "Architectural Justification"),
        ("Client Framework", "React 19.2", "User interface, reactive view management, lifecycle hooks", "Concurrent rendering ensures the link intercept overlay mounts in <5ms without blocking UI"),
        ("Web Build Tool", "Vite 8.2 (Rolldown engine)", "Client bundling, tree-shaking, CSS minification", "Sub-second hot module replacement and compact production bundle (~307 kB gzipped)"),
        ("Mobile Runtime", "Capacitor 8.5.1", "Native Android bridge, WebView lifecycle, intent listeners", "Native Android capabilities without the heavy binary bloat and memory footprint of Flutter/Electron"),
        ("Native Android", "Java 21 / Android SDK 35", "Custom LinkOpenerPlugin, Intent Filters, MainActivity", "Direct interaction with Android Intent architecture, Chrome Custom Tabs, and package visibility"),
        ("On-Device Engine", "Vanilla JS + url_intel.json", "Local heuristic URL scanner (urlEngine.js)", "Sub-15ms threat analysis executed directly on the handset with zero network round-trip"),
        ("Threat Corpus", "url_intel.json (Shared)", "Standardized rules for IDN, typosquatting, bait tokens", "Shared identical detection dataset between client-side JavaScript and Python backend"),
        ("Backend Framework", "Python 3.12 / FastAPI 0.115", "High-throughput asynchronous REST API gateway", "Asynchronous Starlette core handles concurrent scans; native Pydantic validation sanitizes input"),
        ("ASGI Server", "Uvicorn 0.34", "High-performance ASGI server hosting FastAPI", "Ultra-fast event loop supporting production WebSocket/HTTP connections"),
        ("Cryptography", "Bcrypt & PyJWT", "Password hashing (salted) and stateless token auth", "72-byte safe bcrypt password hashing prevents rainbow tables; JWTs support zero-database auth checks"),
        ("Static Analysis", "Python zipfile & io.BytesIO", "In-memory binary APK manifest & DEX parser", "Performs deep bytecode & permission auditing without unpacking files to disk or requiring VM sandboxes"),
        ("AI Diagnostic Core", "Google Gemini 1.5 Flash API", "Natural language device troubleshooting", "Fast, context-aware responses converted to simple, non-technical numbered action steps"),
        ("Offline AI Fallback", "Deterministic Rule Engine", "Offline device troubleshooting knowledge base", "Ensures users can resolve Wi-Fi, Bluetooth, and overlay lockouts even during network loss"),
        ("Primary Database", "MongoDB Atlas (Motor 3.7)", "Persistent document store for users, reports, alerts", "Flexible asynchronous document schemas naturally accommodate dynamic scan findings"),
        ("Resilient Fallback", "In-Memory Python Structures", "Automatic failover memory store (USERS_DB, etc.)", "Zero-downtime operation even if MongoDB network connection is severed or unconfigured"),
        ("DevOps / CI/CD", "GitHub Actions (Ubuntu 24.04)", "Automated Android APK build, test, and release", "Automates Gradle packaging, release keystore signing, and SHA-256 fingerprint generation"),
        ("Edge Hosting", "Vercel", "Production frontend global CDN edge distribution", "Global edge caching for instant PWA loading and automatic HTTPS SSL certificate management"),
        ("Cloud Backend", "Render", "Hosting containerized FastAPI security backend", "Automated GitHub deployments, secret isolation, health checks, and HTTPS termination")
    ]

    t_stack = doc.add_table(rows=len(stack_data), cols=4)
    t_stack.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(stack_data):
        for c_idx, val in enumerate(row):
            cell = t_stack.rows[r_idx].cells[c_idx]
            p = cell.paragraphs[0]
            r = p.add_run(val)
            if r_idx == 0:
                r.font.bold = True
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(cell, "0B1329")
            else:
                r.font.size = Pt(8.5)
                bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)

    # Set column widths
    col_widths = [Inches(1.2), Inches(1.5), Inches(2.2), Inches(2.1)]
    for row in t_stack.rows:
        for i, w in enumerate(col_widths):
            row.cells[i].width = w

    doc.add_page_break()

    # --- SECTION 3: SYSTEM ARCHITECTURE & DATA FLOWS ---
    add_h1("3. End-to-End System Architecture & Workflows")
    p = doc.add_paragraph()
    p.add_run(
        "CypherBuddy operates as a multi-tier reactive security fabric. The system is split across two core operational environments: "
        "the On-Device Android Execution Environment and the Hardened Cloud Security Gateway."
    )

    add_h2("3.1 The Link Interception Lifecycle (Zero-Click Flow)")
    p = doc.add_paragraph()
    p.add_run(
        "When an Android user taps an external hyperlink inside WhatsApp, Telegram, SMS, or Gmail, CypherBuddy intercepts the intent "
        "before any browser executes malicious payloads. The exact technical execution sequence is as follows:\n\n"
        "1. Intent Capture: Android OS matches the incoming URI against CypherBuddy's intent-filters in AndroidManifest.xml (scheme: http, https; action: ACTION_VIEW, ACTION_SEND).\n"
        "2. Normalization (MainActivity.java): If the link was shared as plain text (ACTION_SEND), normalizeSendIntent() uses compiled regex to isolate the raw URL, sanitizing trailing punctuation and whitespace.\n"
        "3. Bridge Dispatch (nativeBridge.js): The native Capacitor bridge fires an appUrlOpen event (or resolves getLaunchUrl() during cold starts).\n"
        "4. Seamless Overlay Mount (LinkProtectionOverlay.jsx): The app immediately renders a full-screen solid dark backdrop (rgba(3, 10, 26, 0.95)) with an animated shield loader. This completely eliminates cold-start white screen flashes.\n"
        "5. Sub-15ms On-Device Inspection (urlEngine.js): The local engine analyzes hostname, IP characteristics, brand imposters, and Punycode without sending data over the internet.\n"
        "6. Conditional Safe Continuation: If the link is classified as SAFE (score < 40), LinkOpenerPlugin.java immediately dispatches an Android Intent launching Google Chrome or Chrome Custom Tabs externally, while minimizeApp() moves CypherBuddy to the background, returning the user to their chat seamlessly.\n"
        "7. Threat Containment: If the link is classified as DANGEROUS (score >= 75) or SUSPICIOUS (score 40-74), the external browser is blocked. The overlay renders the threat score, detailed reason badges, a 1-tap Cyber Crime report button, and an explicit manual override button for advanced users."
    )

    add_h2("3.2 The Static APK Bytecode & Manifest Inspection Flow")
    p = doc.add_paragraph()
    p.add_run(
        "Rather than relying on file extensions or slow dynamic emulators, CypherBuddy uses an in-memory stream parser in backend/security_engine.py:\n\n"
        "1. Stream Ingestion: The file is ingested via multipart/form-data into an in-memory BytesIO buffer (capped at 50 MB to prevent DoS).\n"
        "2. Magic Byte Verification: Confirms standard ZIP magic bytes (0x50 0x4B 0x03 0x04). If an executable (.exe) was renamed to .apk, the MZ header (0x4D 0x5A) is immediately flagged as a high-severity trojan.\n"
        "3. AXML String Pool Extraction: Using compiled regular expressions over the binary AndroidManifest.xml string pool, the parser identifies requested Android permissions without decompiling the entire APK.\n"
        "4. Risk Weight Evaluation:\n"
        "   - BIND_ACCESSIBILITY_SERVICE (+45 Risk): Used by banking trojans for screen logging and automated fund transfers.\n"
        "   - SYSTEM_ALERT_WINDOW (+30 Risk): Used to render invisible credential-harvesting overlays over legitimate banking apps.\n"
        "   - SEND_SMS / RECEIVE_SMS (+35 Risk): Used for silent background premium billing and 2FA OTP interception.\n"
        "   - REQUEST_INSTALL_PACKAGES (+25 Risk): Used by dropper malware to silently download secondary payloads."
    )

    add_h2("3.3 Cloud-Synchronized Family Safety Network Flow")
    p = doc.add_paragraph()
    p.add_run(
        "Family protection is engineered around cryptographic pairing and zero content surveillance:\n"
        "1. Pairing Generation: A guardian creates a pairing code on the Family Dashboard. The server issues a cryptographically secure token (PAIR-XXXX) generated via secrets.token_hex(4).\n"
        "2. Device Association: The child or senior enters the pairing code. The device's non-hardware installation UUID is bound to the guardian account in MongoDB.\n"
        "3. Incident Telemetry: When the protected device intercepts a dangerous link or malicious APK, it automatically posts an encrypted threat payload to /api/family/alerts.\n"
        "4. Guardian Dashboard Update: The guardian sees the exact threat type, risk score, and device name in real-time, enabling immediate family intervention before financial fraud occurs."
    )

    doc.add_page_break()

    # --- SECTION 4: THREAT DETECTION ENGINE DETAILS ---
    add_h1("4. Threat Detection Engine In-Depth")
    p = doc.add_paragraph()
    p.add_run(
        "The CypherBuddy threat evaluation engine combines lexical, topological, cryptographic, and algorithmic rules "
        "into a standardized score between 0 (Completely Safe) and 100 (Critical Danger)."
    )

    add_h2("4.1 Heuristic Algorithms & Rule Weights")
    
    rules_data = [
        ("Rule Category", "Algorithmic Trigger / Pattern", "Risk Points Added", "Severity Level"),
        ("Transport Security", "Plain HTTP protocol (unencrypted)", "+15", "Warning"),
        ("Obfuscated Host", "Deceptive user-info '@' trick (e.g. google.com@phishing.xyz)", "+35", "Danger"),
        ("Raw IP Destination", "Direct IPv4 / IPv6 host without domain name", "+45", "Danger"),
        ("IDN Homograph", "Internationalized Domain Names with xn-- punycode or cyrillic spoofing", "+35 to +65", "Danger"),
        ("Brand Impersonation", "35+ monitored financial & tech brands with leet-speak / typo variants", "+50 to +65", "Danger"),
        ("High-Risk TLD", "TLDs with high spam rates: .xyz, .top, .click, .monster, .cyou, .live", "+20", "Warning"),
        ("Scam Bait Tokens", "Keywords in domain: kyc, verify, urgent, support, reward, bonus, gift", "+10 to +35", "Warning"),
        ("Subdomain Nesting", "More than 3 levels of nested subdomains hiding root domain", "+20", "Warning"),
        ("Credential Harvest Path", "Paths containing: /login, /signin, /wallet, /seed, /pan-verify", "+10 to +30", "Warning"),
        ("SMS Urgency Language", "Urgent deadline keywords: immediately, blocked, 24 hours, penalty", "+30", "Warning"),
        ("SMS Sensitive Data", "Requests for OTP, PIN, password, CVV, Card Number via SMS", "+35", "Danger"),
        ("Trojan Permissions", "APK requesting BIND_ACCESSIBILITY_SERVICE or SYSTEM_ALERT_WINDOW", "+30 to +45", "Danger")
    ]

    t_rules = doc.add_table(rows=len(rules_data), cols=4)
    t_rules.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(rules_data):
        for c_idx, val in enumerate(row):
            cell = t_rules.rows[r_idx].cells[c_idx]
            p = cell.paragraphs[0]
            r = p.add_run(val)
            if r_idx == 0:
                r.font.bold = True
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(cell, "0B1329")
            else:
                r.font.size = Pt(8.5)
                bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)

    col_widths_r = [Inches(1.5), Inches(3.2), Inches(1.1), Inches(1.2)]
    for row in t_rules.rows:
        for i, w in enumerate(col_widths_r):
            row.cells[i].width = w

    add_h2("4.2 SSRF (Server-Side Request Forgery) Protection")
    p = doc.add_paragraph()
    p.add_run(
        "To prevent attackers from using CypherBuddy's backend link expander to probe internal cloud servers, "
        "is_ssrf_safe_url() performs DNS pre-resolution. The IP address is checked against private RFC1918 subnets "
        "(10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), loopback addresses (127.0.0.1), and cloud metadata endpoints "
        "(169.254.169.254). Any request pointing to internal resources is rejected immediately with a 400 Bad Request error."
    )

    doc.add_page_break()

    # --- SECTION 5: SECURITY HARDENING & BUG RESOLUTION ---
    add_h1("5. Critical Engineering Challenges & Resolved Bugs")
    p = doc.add_paragraph()
    p.add_run(
        "During the development and production hardening of CypherBuddy, several complex edge cases were identified, "
        "diagnosed, and permanently resolved. These demonstrate the rigor applied to the system's architecture."
    )

    add_h2("5.1 Bug 1: Cold-Start White Screen on Link Taps")
    p = doc.add_paragraph()
    p.add_run(
        "Symptom: When CypherBuddy was cold-started from an external app via an Android Intent, the user experienced a blank white screen.\n"
        "Root Cause: The LinkProtectionOverlay initially used a transparent backdrop during its scanning phase. On cold starts, React had not yet populated the underlying view, exposing an unstyled WebView background.\n"
        "Resolution: Refactored LinkProtectionOverlay.jsx to always enforce a solid dark backdrop (rgba(3, 10, 26, 0.95)) with an animated spinning shield card. Updated App.jsx closeLinkOverlay() to automatically navigate authenticated users to the home dashboard upon overlay dismissal."
    )

    add_h2("5.2 Bug 2: TypeError: Cannot read properties of undefined (reading 'split')")
    p = doc.add_paragraph()
    p.add_run(
        "Symptom: Users opening the app or website a second time experienced a crash caught by ErrorBoundary with the message: Cannot read properties of undefined (reading 'split').\n"
        "Root Cause: App.jsx stored the authentication token in localStorage under cypherbuddy_token, but failed to store the user profile object. On app restart, user was initialized to { role: 'USER' } without a name property. When Header.jsx attempted user.name.split(' ')[0], an unhandled TypeError was thrown.\n"
        "Resolution: Fully hardened Header.jsx with safe optional chaining (user?.name ? user.name.split(' ')[0] : 'User'). Synchronized user profile storage in localStorage under cypherbuddy_user. Audited and defensively guarded all 12 .split() occurrences across the entire codebase (urlEngine.js, securityService.js, App.jsx)."
    )

    add_h2("5.3 Bug 3: WebView Containment Security Vulnerability")
    p = doc.add_paragraph()
    p.add_run(
        "Symptom: Naive in-app link opening inside a mobile WebView allows malicious sites to attempt session hijacking, access localStorage tokens, or execute malicious JavaScript.\n"
        "Resolution: Implemented a native Android plugin (LinkOpenerPlugin.java). Safe links are strictly launched in Google Chrome or Chrome Custom Tabs using FLAG_ACTIVITY_NEW_TASK, ensuring total sandbox isolation from CypherBuddy's internal storage and credentials."
    )

    # --- SECTION 6: API ENDPOINTS SPECIFICATION ---
    add_h1("6. REST API Endpoint Specifications")
    api_endpoints = [
        ("Method", "Endpoint", "Auth / Role", "Description", "Primary Payload / Status"),
        ("POST", "/api/auth/register", "Public", "Registers new user account", "{ name, email, password, termsAccepted }"),
        ("POST", "/api/auth/login", "Public", "Unified login (Auto-detects Admin)", "{ email, password } -> JWT or OTP"),
        ("POST", "/api/auth/admin/verify-otp", "Public", "Step 2 Admin OTP Verification", "{ phone_or_email, otp } -> JWT"),
        ("POST", "/api/security/analyze-url", "Public / User", "Expands short links & SSRF check", "{ url } -> Analysis JSON"),
        ("POST", "/api/scan/url", "User / Admin", "Deep scans URL for phishing/homographs", "{ url } -> Risk Report JSON"),
        ("POST", "/api/scan/file", "User / Admin", "Uploads APK/file for static byte analysis", "multipart/form-data (file)"),
        ("POST", "/api/scan/message", "User / Admin", "Evaluates SMS for urgency and scam clues", "{ message } -> Scam Score"),
        ("GET", "/api/family/members", "User / Admin", "Lists linked family protection devices", "Bearer Token Header"),
        ("POST", "/api/family/pair", "User / Admin", "Generates cryptographic PAIR-XXXX key", "{ name, relation } -> Pairing Key"),
        ("GET", "/api/family/alerts", "User / Admin", "Fetches real-time family threat alerts", "Bearer Token Header"),
        ("POST", "/api/assistant/chat", "User / Admin", "Queries Gemini 1.5 / Offline Troubleshooter", "{ query, device_type } -> Steps"),
        ("GET", "/api/admin/dashboard", "Admin Only", "System health and telemetry statistics", "Bearer Token (Role: ADMIN)"),
        ("GET", "/api/app/version", "Public", "In-app version manifest and APK download URL", "Returns latest_version & apk_url")
    ]

    t_api = doc.add_table(rows=len(api_endpoints), cols=5)
    t_api.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(api_endpoints):
        for c_idx, val in enumerate(row):
            cell = t_api.rows[r_idx].cells[c_idx]
            p = cell.paragraphs[0]
            r = p.add_run(val)
            if r_idx == 0:
                r.font.bold = True
                r.font.size = Pt(8.5)
                r.font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(cell, "0B1329")
            else:
                r.font.size = Pt(8)
                bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
            set_cell_margins(cell, top=50, bottom=50, left=60, right=60)

    col_widths_api = [Inches(0.8), Inches(2.0), Inches(1.1), Inches(1.8), Inches(1.3)]
    for row in t_api.rows:
        for i, w in enumerate(col_widths_api):
            row.cells[i].width = w

    doc.add_page_break()

    # --- SECTION 7: VIVA / ACADEMIC DEFENSE GUIDE ---
    add_h1("7. Academic Defense & Viva Q&A Reference Guide")
    p = doc.add_paragraph()
    p.add_run(
        "This section prepares engineering presenters, evaluators, and stakeholders with comprehensive "
        "answers to rigorous technical defense questions."
    )

    viva_qa = [
        ("Q1: Why is on-device link analysis critical compared to conventional cloud-based URL lookup tables?",
         "Answer: Cloud lookups introduce significant latency (300ms to 2000ms), which ruins the user experience of tapping a chat link. Furthermore, transmitting every link tapped by a user over the network creates severe privacy concerns. CypherBuddy's on-device engine evaluates lexical patterns, IDN confusables, and brand imposters in under 15ms directly on the CPU, only calling the cloud when a shortened redirect chain (like bit.ly) must be safely expanded."),

        ("Q2: How does CypherBuddy prevent false positives on legitimate subdomains (e.g., support.google.com)?",
         "Answer: The engine uses a multi-tiered registrable domain extractor (registrableDomain()). Known high-reputation domains (google.com, apple.com, microsoft.com) are whitelisted, while user-content subdomains (e.g., github.io, firebaseapp.com, pages.dev) are recognized and permitted to proceed through deeper lexical and path keyword inspections without blind rejection."),

        ("Q3: How does CypherBuddy inspect APK permissions without decompiling the entire package?",
         "Answer: Standard decompilers (like apktool or jadx) unpack the entire application, requiring several seconds and massive storage. CypherBuddy treats the APK as an in-memory ZIP archive, extracts the binary AndroidManifest.xml string pool directly, and executes compiled binary regular expressions over the UTF-8/UTF-16 chunks in under 200ms."),

        ("Q4: What happens if the MongoDB database goes offline during active threat scanning?",
         "Answer: CypherBuddy features a dual-state resilient architecture. The FastAPI backend maintains synchronized in-memory dictionaries (USERS_DB, OTP_REQUESTS_DB, AUDIT_LOGS_DB). If MongoDB is unreachable, the system automatically falls back to in-memory state without crashing or dropping active user sessions."),

        ("Q5: Why does CypherBuddy minimize itself after launching Chrome for safe links?",
         "Answer: User experience testing revealed that users hate having an extra intermediary app left in their recent apps tray. When a link is safe, CypherBuddy launches Chrome via LinkOpenerPlugin and invokes CapApp.minimizeApp(). This returns the user's task stack to the exact WhatsApp or SMS conversation they were having, creating an invisible, frictionless protection experience.")
    ]

    for q, a in viva_qa:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(8)
        p_q.paragraph_format.space_after = Pt(2)
        p_q.paragraph_format.keep_with_next = True
        r_q = p_q.add_run(q)
        r_q.font.bold = True
        r_q.font.size = Pt(10.5)
        r_q.font.color.rgb = COLOR_NAVY

        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_after = Pt(8)
        r_a = p_a.add_run(a)
        r_a.font.size = Pt(10)
        r_a.font.color.rgb = COLOR_DARK_TEXT

    # Save document
    doc.save(filename)
    print(f"Successfully generated Word document: {filename} ({os.path.getsize(filename):,} bytes)")

# --- REPORTLAB PDF GENERATOR ---
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Don't draw headers/footers on cover page
        if self._pageNumber > 1:
            # Header
            self.drawString(54, 842 - 36, "CypherBuddy: System Architecture & Technical Reference Manual")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 842 - 42, 595 - 54, 842 - 42)
            
            # Footer
            self.line(54, 48, 595 - 54, 48)
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(595 - 54, 36, page_text)
            self.drawString(54, 36, "CONFIDENTIAL - CypherBuddy Project Documentation - Version 3.0.0")
        
        self.restoreState()

def create_pdf(filename):
    print(f"Creating PDF document: {filename}...")
    pdf_doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0B1329'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0284C7'),
        spaceAfter=12
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=20
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0B1329'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0284C7'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6
    )
    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#0B1329')
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#1E293B')
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#FFFFFF')
    )

    story = []

    # Title Page
    story.append(Spacer(1, 40))
    story.append(Paragraph("CYPHERBUDDY", title_style))
    story.append(Paragraph("Autonomous Mobile Threat Gateway, Link Protection System & Digital Safety Companion", subtitle_style))
    story.append(Paragraph("Comprehensive Technical Reference Manual, Architectural Specification, and Project Execution Report", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284C7"), spaceAfter=18))

    meta_rows = [
        [Paragraph("<b>Project Status</b>", table_cell), Paragraph("Production-Ready Release (Version 3.0.0)", table_cell)],
        [Paragraph("<b>Target Platforms</b>", table_cell), Paragraph("Android (Capacitor 8 / SDK 35), Web (React 19 / Vite 8), Cloud (FastAPI / Render)", table_cell)],
        [Paragraph("<b>Repository</b>", table_cell), Paragraph("https://github.com/ChetanPW007/CypherBuddy", table_cell)],
        [Paragraph("<b>Documentation Date</b>", table_cell), Paragraph("November 2026", table_cell)],
        [Paragraph("<b>Core Engineering</b>", table_cell), Paragraph("Mobile Link Interception, On-Device Heuristics, Static Bytecode Analysis, Dual AI Engine", table_cell)]
    ]
    meta_table = Table(meta_rows, colWidths=[130, 350])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#FFFFFF')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(PageBreak())

    # Section 1
    story.append(Paragraph("1. Executive Summary & Problem Space", h1_style))
    story.append(Paragraph(
        "CypherBuddy is an AI-powered personal cybersecurity companion and autonomous mobile link gateway "
        "engineered for Android and modern web platforms. Built upon a strict Zero-Trust, Security-by-Design "
        "paradigm, CypherBuddy acts as an active shield between deceptive incoming communications (WhatsApp messages, "
        "SMS smishing, email links, QR codes, APK downloads) and the user's device execution environment.",
        body_style
    ))
    story.append(Paragraph(
        "Traditional consumer security software fails modern smartphone users due to high latency (3-5 min sandbox delays), "
        "confusing technical jargon that causes notification fatigue, and invasive privacy violations. CypherBuddy delivers on-device "
        "heuristic verdicts in under 15ms, allowing safe links to continue seamlessly into Chrome while intercepting threats with zero chat snooping.",
        body_style
    ))

    # Section 2: Complete Tech Stack
    story.append(Paragraph("2. Comprehensive Technology Stack", h1_style))
    story.append(Paragraph(
        "Every library and protocol in CypherBuddy was deliberately selected for maximum mobile efficiency, zero battery drain, and robust threat mitigation:",
        body_style
    ))

    stack_rows = [
        [Paragraph("Component", table_cell_bold), Paragraph("Technology", table_cell_bold), Paragraph("Role in CypherBuddy", table_cell_bold), Paragraph("Why Chosen", table_cell_bold)],
        [Paragraph("Frontend", table_cell), Paragraph("React 19.2 + Vite 8", table_cell), Paragraph("Reactive Mobile & Web UI", table_cell), Paragraph("Concurrent rendering, sub-1s HMR, ~307kB gzip", table_cell)],
        [Paragraph("Mobile Runtime", table_cell), Paragraph("Capacitor 8.5.1", table_cell), Paragraph("Native Android Container", table_cell), Paragraph("Native Intent listeners without Flutter/Electron overhead", table_cell)],
        [Paragraph("Native Layer", table_cell), Paragraph("Java 21 / SDK 35", table_cell), Paragraph("LinkOpenerPlugin, MainActivity", table_cell), Paragraph("Direct Intent handling, Chrome Custom Tabs delegation", table_cell)],
        [Paragraph("On-Device Engine", table_cell), Paragraph("Vanilla JS Engine", table_cell), Paragraph("urlEngine.js heuristic scanner", table_cell), Paragraph("Sub-15ms local verdicts without network calls", table_cell)],
        [Paragraph("Threat Corpus", table_cell), Paragraph("url_intel.json", table_cell), Paragraph("Shared threat dictionary", table_cell), Paragraph("Identical lexical rules across client and backend", table_cell)],
        [Paragraph("Backend API", table_cell), Paragraph("Python 3.12 / FastAPI", table_cell), Paragraph("Asynchronous Security Gateway", table_cell), Paragraph("High throughput, Pydantic input sanitation", table_cell)],
        [Paragraph("Cryptography", table_cell), Paragraph("Bcrypt + PyJWT", table_cell), Paragraph("Password hash & token auth", table_cell), Paragraph("72-byte safe boundary, stateless JWT verification", table_cell)],
        [Paragraph("Static Analysis", table_cell), Paragraph("BytesIO + zipfile", table_cell), Paragraph("In-memory APK bytecode parser", table_cell), Paragraph("Deep AXML string pool inspection in <200ms", table_cell)],
        [Paragraph("AI Assistant", table_cell), Paragraph("Gemini 1.5 Flash", table_cell), Paragraph("Natural language troubleshooter", table_cell), Paragraph("Simple, numbered non-technical steps for families", table_cell)],
        [Paragraph("Offline AI Core", table_cell), Paragraph("Rule Engine", table_cell), Paragraph("Deterministic fallback KB", table_cell), Paragraph("Resolves Wi-Fi/Bluetooth lockouts during outages", table_cell)],
        [Paragraph("Database", table_cell), Paragraph("MongoDB Atlas", table_cell), Paragraph("Async document storage", table_cell), Paragraph("Motor async driver with in-memory failover", table_cell)],
        [Paragraph("DevOps CI/CD", table_cell), Paragraph("GitHub Actions", table_cell), Paragraph("Automated APK packaging", table_cell), Paragraph("Automates release keystore signing and artifacts", table_cell)]
    ]
    t_stack_pdf = Table(stack_rows, colWidths=[70, 95, 140, 175])
    t_stack_pdf.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0B1329')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_stack_pdf)
    story.append(PageBreak())

    # Section 3: Workflows
    story.append(Paragraph("3. End-to-End System Workflows", h1_style))
    story.append(Paragraph("3.1 The Link Interception Lifecycle (Zero-Click Flow)", h2_style))
    story.append(Paragraph(
        "<b>1. Intent Capture:</b> Android catches tapped links via Intent Filters (ACTION_VIEW / ACTION_SEND).<br/>"
        "<b>2. Normalization:</b> MainActivity.java normalizes shared message text, extracting the raw target URL.<br/>"
        "<b>3. Anti-White-Screen Backdrop:</b> LinkProtectionOverlay mounts immediately with a solid dark theme (rgba(3, 10, 26, 0.95)) and spinning shield.<br/>"
        "<b>4. On-Device Scan:</b> urlEngine.js evaluates the target locally in ~12ms.<br/>"
        "<b>5. Safe Link Continuation:</b> If safe, LinkOpenerPlugin opens Chrome externally, and CypherBuddy minimizes automatically, returning user to chat.<br/>"
        "<b>6. Threat Block:</b> If dangerous, the overlay displays risk score, threat reasons, 1-click cyber crime reporting, and detailed analysis.",
        body_style
    ))

    story.append(Paragraph("3.2 The Static APK Bytecode & Manifest Parser", h2_style))
    story.append(Paragraph(
        "Files uploaded or intercepted undergo raw magic-byte header validation (0x50 0x4B 0x03 0x04) in memory. "
        "The parser inspects the binary AndroidManifest.xml string pool for high-risk permissions such as "
        "<b>BIND_ACCESSIBILITY_SERVICE</b> (+45), <b>SYSTEM_ALERT_WINDOW</b> (+30), and <b>SEND_SMS</b> (+35) "
        "without unpacking files to disk or requiring VM sandboxes.",
        body_style
    ))

    story.append(Paragraph("3.3 Cloud-Synchronized Family Safety Shield", h2_style))
    story.append(Paragraph(
        "Guardians generate cryptographic pairing keys (PAIR-XXXX) to connect family devices. When a senior or child "
        "intercepts a malicious link or APK, an encrypted threat alert is broadcast in real time to the guardian dashboard, "
        "preventing fraud without invading personal chat privacy.",
        body_style
    ))

    # Section 4: Resolved Bugs
    story.append(Paragraph("4. Critical Engineering Challenges & Resolved Bugs", h1_style))
    story.append(Paragraph(
        "<b>1. Cold-Start White Screen:</b> Resolved by eliminating transparent overlay phases and replacing them with solid dark backdrops and centered loading cards.<br/>"
        "<b>2. TypeError: Cannot read properties of undefined (reading 'split'):</b> Root cause was user.name missing upon app re-opening. Fixed with defensive optional chaining across Header.jsx, urlEngine.js, and App.jsx, and synchronizing user profile persistence in localStorage.<br/>"
        "<b>3. WebView Containment Isolation:</b> Avoided WebView credential theft by delegating external links strictly to Google Chrome / Chrome Custom Tabs.",
        body_style
    ))

    # Section 5: Academic Viva Reference
    story.append(Paragraph("5. Academic Defense & Viva Q&A Reference", h1_style))
    story.append(Paragraph(
        "<b>Q: Why in-memory static analysis over dynamic virtualization?</b><br/>"
        "A: Dynamic analysis requires 3-5 minutes per scan and massive cloud virtualization costs. In-memory AXML string pool parsing completes in under 200ms, enabling real-time mobile protection on mobile data.<br/><br/>"
        "<b>Q: How does CypherBuddy mitigate SSRF attacks?</b><br/>"
        "A: The backend resolves hostnames via DNS and validates that resolved IPs do not belong to RFC1918 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), loopback (127.0.0.1), or cloud metadata services (169.254.169.254).<br/><br/>"
        "<b>Q: Why minimize the app after opening safe links?</b><br/>"
        "A: Tapping links is meant to be frictionless. By launching Chrome externally and minimizing CypherBuddy, pressing 'Back' in Chrome returns the user directly to WhatsApp rather than an intermediary security screen.",
        body_style
    ))

    pdf_doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF document: {filename} ({os.path.getsize(filename):,} bytes)")

if __name__ == "__main__":
    base_dir = r"e:\tmp\CypherBuddy"
    docx_path = os.path.join(base_dir, "CypherBuddy_Comprehensive_System_Report.docx")
    pdf_path = os.path.join(base_dir, "CypherBuddy_Comprehensive_System_Report.pdf")

    create_docx(docx_path)
    create_pdf(pdf_path)
    print("ALL REPORTS GENERATED SUCCESSFULLY!")
