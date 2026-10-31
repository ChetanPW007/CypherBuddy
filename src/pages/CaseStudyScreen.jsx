import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  FileCode,
  Lock,
  KeyRound,
  AlertTriangle,
  Layers,
  CheckCircle2,
  ListOrdered,
  BookOpen,
  Copy,
  Check,
  ArrowRight,
  Flame,
  HelpCircle,
  Award,
  PackageCheck
} from 'lucide-react';

export default function CaseStudyScreen() {
  const [activeTab, setActiveTab] = useState('weaknesses'); // 'weaknesses' | 'prioritization' | 'principles' | 'ssdlc' | 'roadmap' | 'viva'
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const VULNERABILITIES = [
    {
      id: 'cmd-injection',
      title: '1. Command Injection',
      severity: 'CRITICAL',
      priority: 'P1 - Immediate Fix',
      cwe: 'CWE-78',
      icon: Terminal,
      color: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      simpleExplanation: 'Occurs when user input (like a IP address or string) is directly passed into system shell commands without validation. An attacker can append custom shell commands to execute arbitrary code on the server.',
      impact: 'Total System Compromise. Attackers can gain remote shell access, delete files, steal secrets, or install malware.',
      whyFixFirst: 'Command Injection allows direct Remote Code Execution (RCE). An attacker can take complete control of the hosting server instantly.',
      vulnerableCode: `# VULNERABLE PYTHON CODE
import os

def ping_host(user_input):
    # Unsanitized user input concatenated into shell string
    cmd = "ping -c 1 " + user_input
    return os.system(cmd)  # Attacker input: "127.0.0.1; cat /etc/passwd"`,
      secureCode: `# SECURE PYTHON FIX
import subprocess
import shlex

def ping_host(user_input):
    # Use array form without shell=True to avoid shell parsing
    # Input is passed as arguments, not executable commands
    args = ["ping", "-c", "1", user_input.strip()]

    # Safe execution with timeout and no shell evaluation
    result = subprocess.run(args, capture_output=True, text=True, timeout=5)
    return result.returncode == 0`
    },
    {
      id: 'path-traversal',
      title: '2. Path Traversal (Directory Traversal)',
      severity: 'CRITICAL',
      priority: 'P1 - Immediate Fix',
      cwe: 'CWE-22',
      icon: FileCode,
      color: '#f97316',
      badgeBg: 'rgba(249, 115, 22, 0.15)',
      simpleExplanation: 'Occurs when a web application uses user-supplied filenames to construct file paths without checking if the path stays inside the intended folder. Attackers can navigate up directories using "../" sequences.',
      impact: 'Unauthorized Reading & Writing of Confidential Files. Attackers can read configuration files, source code, system passwords (`/etc/passwd`), or overwrite critical app files.',
      whyFixFirst: 'Allows attackers to read sensitive application secrets (like secret keys, database credentials) which can then be used to bypass all other security controls.',
      vulnerableCode: `# VULNERABLE PYTHON CODE
from flask import send_file

def download_file(filename):
    # Directly reading filename provided by user
    # Attacker input: "../../etc/passwd" or "../../config.env"
    file_path = "/var/www/uploads/" + filename
    return send_file(file_path)`,
      secureCode: `# SECURE PYTHON FIX
import os
from pathlib import Path
from flask import abort, send_from_directory

UPLOAD_DIR = Path("/var/www/uploads").resolve()

def download_file(filename):
    # 1. Sanitize base filename using os.path.basename
    safe_name = os.path.basename(filename)
    target_path = (UPLOAD_DIR / safe_name).resolve()

    # 2. Verify target file resides within allowed base directory
    if not str(target_path).startswith(str(UPLOAD_DIR)):
        abort(403, "Directory traversal attempt blocked")

    return send_from_directory(UPLOAD_DIR, safe_name)`
    },
    {
      id: 'plaintext-passwords',
      title: '3. Plain-text Password Storage',
      severity: 'HIGH',
      priority: 'P2 - High Priority',
      cwe: 'CWE-256',
      icon: Lock,
      color: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      simpleExplanation: 'Storing passwords in clear text or using weak hashing algorithms (like MD5 or SHA1) inside database records. If the database is compromised, all user passwords are revealed instantly.',
      impact: 'Mass Credential Exposure. Leaked plain-text passwords allow attackers to compromise user accounts across multiple services (credential stuffing attacks).',
      whyFixFirst: 'Protects user data privacy. While it does not grant direct server access, a database leak immediately exposes all users if passwords are not salted and hashed with Argon2 or bcrypt.',
      vulnerableCode: `# VULNERABLE PYTHON CODE
def register_user(username, raw_password):
    # Storing password as plain text in SQL database
    db.execute("INSERT INTO users (name, pass) VALUES (?, ?)", (username, raw_password))

def check_login(username, raw_password):
    user = db.query("SELECT * FROM users WHERE name=?", username)
    return user.password == raw_password  # Plain text equality check`,
      secureCode: `# SECURE PYTHON FIX
from passlib.hash import argon2

def register_user(username, raw_password):
    # Hash password using Argon2id with automatic salt generation
    hashed_password = argon2.hash(raw_password)
    db.execute("INSERT INTO users (name, pass) VALUES (?, ?)", (username, hashed_password))

def check_login(username, raw_password):
    user = db.query("SELECT * FROM users WHERE name=?", username)
    # Verify using secure constant-time algorithm
    return argon2.verify(raw_password, user.hashed_password)`
    },
    {
      id: 'generic-exceptions',
      title: '4. Generic Exception Handling & Info Disclosure',
      severity: 'MEDIUM',
      priority: 'P3 - Moderate Priority',
      cwe: 'CWE-209 / CWE-390',
      icon: AlertTriangle,
      color: '#3b82f6',
      badgeBg: 'rgba(59, 130, 246, 0.15)',
      simpleExplanation: 'Using bare `except:` or returning full internal error stack traces to end users. This either hides critical application errors silently or leaks database structure, file paths, and library versions to attackers.',
      impact: 'Information Reconnaissance & Silent System Corruption. Detailed error logs assist attackers in mapping application vulnerabilities; silent ignores cause data corruption.',
      whyFixFirst: 'Helps debugging and prevents leaking system details to malicious actors. Essential for operational reliability and secure error handling.',
      vulnerableCode: `# VULNERABLE PYTHON CODE
from flask import jsonify

def process_payment(data):
    try:
        charge_credit_card(data)
    except Exception as e:
        # LEAKING FULL STACK TRACE TO END USER
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

def save_log(entry):
    try:
        write_file(entry)
    except:
        pass  # SILENT FAILURE: Error ignored completely`,
      secureCode: `# SECURE PYTHON FIX
import logging
from flask import jsonify

logger = logging.getLogger("sec_app")

def process_payment(data):
    try:
        charge_credit_card(data)
    except CardDeclinedException as e:
        return jsonify({"status": "failed", "message": "Card declined."}), 400
    except Exception as e:
        # Log complete stack trace internally for developers
        logger.error("Payment processing error: %s", str(e), exc_info=True)
        # Return generic safe error message to user
        return jsonify({"status": "error", "message": "An internal error occurred."}), 500`
    },
    {
      id: 'predictable-tempfiles',
      title: '5. Predictable Temporary Files',
      severity: 'MEDIUM',
      priority: 'P3 - Moderate Priority',
      cwe: 'CWE-377',
      icon: KeyRound,
      color: '#06b6d4',
      badgeBg: 'rgba(6, 182, 212, 0.15)',
      simpleExplanation: 'Creating temporary files in shared directories (like `/tmp`) using static or predictable file names. Local attackers can predict file names and manipulate symlinks or race conditions (TOCTOU).',
      impact: 'Local File Tampering & Information Leakage. Unprivileged local users can read, modify, or intercept temporary data generated by the application.',
      whyFixFirst: 'Prevents local privilege escalation and race condition exploits in multi-tenant or shared hosting environments.',
      vulnerableCode: `# VULNERABLE PYTHON CODE
def create_report(user_id):
    # Static, predictable temporary file path
    temp_path = "/tmp/report_" + str(user_id) + ".txt"
    with open(temp_path, "w") as f:
        f.write("Confidential User Report Data")
    return temp_path`,
      secureCode: `# SECURE PYTHON FIX
import tempfile
import os

def create_report(user_id):
    # Uses OS secure tempfile creator with strict 0600 file permissions
    # Generates cryptographically random filename in isolated directory
    with tempfile.NamedTemporaryFile(mode="w+", prefix="report_", suffix=".tmp", delete=False) as temp_file:
        temp_file.write("Confidential User Report Data")
        secure_path = temp_file.name

    return secure_path`
    },
    {
      id: 'outdated-dependencies',
      title: '6. Vulnerable & Outdated Dependencies',
      severity: 'HIGH',
      priority: 'P2 - High Priority',
      cwe: 'CWE-1395',
      icon: PackageCheck,
      color: '#a855f7',
      badgeBg: 'rgba(168, 85, 247, 0.15)',
      simpleExplanation: 'Using third-party Python packages (`requirements.txt`) that have known, publicly disclosed security vulnerabilities (CVEs). Attackers search for known exploits in outdated library versions.',
      impact: 'Vulnerability Inheritance. Known exploits in libraries (e.g. vulnerable XML parsers, outdated Flask/Django versions, unsafe YAML loads) allow attackers to bypass custom code defenses.',
      whyFixFirst: 'Third-party code accounts for 80%+ of modern application code. Using unpatched libraries introduces pre-packaged attack vectors.',
      vulnerableCode: `# VULNERABLE REQUIREMENTS.TXT
flask==0.12.2          # Outdated Flask with security flaws
pyyaml==3.12           # Vulnerable to Arbitrary Code Execution (CVE-2017-18342)
requests==2.18.4       # Outdated HTTP library`,
      secureCode: `# SECURE REQUIREMENTS.TXT & CI AUDIT
flask>=3.0.0
pyyaml>=6.0.1          # Uses SafeLoader by default
requests>=2.31.0

# SECURE BUILD STEP (In Terminal / CI/CD Pipeline):
# Run automated security auditing tools:
$ pip install safety pip-audit
$ pip-audit -r requirements.txt`
    }
  ];

  const SECURE_PRINCIPLES = [
    {
      title: 'Input Validation & Sanitization',
      desc: 'Never trust user input. Validate data type, length, format, and range using strict allowlists (reject anything that does not match expected pattern).',
      example: 'Use `pydantic` or `marshmallow` schemas to enforce strict data constraints.'
    },
    {
      title: 'Principle of Least Privilege',
      desc: 'Run processes, applications, and database users with the minimum permissions required to perform their task.',
      example: 'Application database user should only have `SELECT`/`INSERT`/`UPDATE` rights, never `DROP TABLE` or `GRANT` permissions.'
    },
    {
      title: 'Defense in Depth',
      desc: 'Layer multiple independent security mechanisms so that if one control fails, subsequent controls prevent exposure.',
      example: 'Combine WAF rules + Input Sanitization + Container isolation + Database encryption.'
    },
    {
      title: 'Secure by Default',
      desc: 'Configure application defaults to be as safe as possible out-of-the-box without requiring user intervention.',
      example: 'Enable HTTPS/HSTS, set `HttpOnly` and `SameSite=Strict` flags on cookies by default.'
    },
    {
      title: 'Fail Securely',
      desc: 'Ensure that system failures or exceptions default to a safe state without granting unintended access or leaking details.',
      example: 'When authentication throws an unexpected exception, deny access and log internally.'
    },
    {
      title: 'Secure Data Handling',
      desc: 'Protect sensitive information in transit with TLS 1.3 and at rest with strong hashing (Argon2) or encryption (AES-256-GCM).',
      example: 'Never store API keys or passwords in source code; use environment variables and key vaults.'
    },
    {
      title: 'Minimize Attack Surface',
      desc: 'Disable unused endpoints, remove debugging features in production, and uninstall unnecessary libraries or software.',
      example: 'Turn off `DEBUG=True` in production frameworks and lock down administrative endpoints.'
    }
  ];

  const SSDLC_PHASES = [
    {
      step: '1',
      name: 'Security Requirements',
      desc: 'Define CIA triad goals, compliance criteria (OWASP Top 10), and privacy guidelines before coding starts.',
      tool: 'OWASP ASVS, Security Checklist'
    },
    {
      step: '2',
      name: 'Threat Modelling',
      desc: 'Identify system assets, entry points, and potential attack vectors using frameworks like STRIDE.',
      tool: 'OWASP Threat Dragon, Data Flow Diagrams'
    },
    {
      step: '3',
      name: 'Secure Design',
      desc: 'Architect system controls: choose strong cryptographic standards, authentication mechanisms, and access controls.',
      tool: 'Architecture Review, Security Patterns'
    },
    {
      step: '4',
      name: 'Secure Coding',
      desc: 'Implement code adhering to secure coding guidelines. Enforce parameterization, sanitization, and password hashing.',
      tool: 'IDE Security Linter, Pre-commit Hooks'
    },
    {
      step: '5',
      name: 'Security Testing',
      desc: 'Execute static analysis (SAST), dynamic testing (DAST), dependency checks, and code reviews.',
      tool: 'Bandit (SAST), pip-audit, OWASP ZAP'
    },
    {
      step: '6',
      name: 'Deployment',
      desc: 'Deploy using hardened container configurations, strict firewall rules, and automated CI/CD security gates.',
      tool: 'Docker Hardening, GitHub Actions'
    },
    {
      step: '7',
      name: 'Monitoring & Incident Management',
      desc: 'Continuously log security events, monitor runtime anomalies, and establish a vulnerability response plan.',
      tool: 'SIEM, Prometheus, Logcat, Sentry'
    }
  ];

  const VIVA_QUESTIONS = [
    {
      q: 'Q1: What is the main difference between Command Injection and SQL Injection?',
      a: 'Command Injection targets the underlying operating system shell (e.g. executing Linux/Windows shell commands), whereas SQL Injection targets relational database engines (e.g. manipulating SQL query logic).'
    },
    {
      q: 'Q2: Why is os.system() considered dangerous in Python?',
      a: 'os.system() passes the entire command string directly to the OS shell interpreter. If user input is concatenated into the command, the shell evaluates special characters like ;, &&, |, or ` command substitutions, allowing attackers to execute extra commands.'
    },
    {
      q: 'Q3: Why should we fix Command Injection and Path Traversal before Plain-text Passwords?',
      a: 'Command Injection and Path Traversal grant attackers immediate control over the server and access to file system secrets. With server control, an attacker can steal the database, bypass password checks entirely, or inspect memory.'
    },
    {
      q: 'Q4: What is the recommended algorithm for password hashing in Python modern applications?',
      a: 'Argon2 (specifically Argon2id) or bcrypt. Plain SHA-256 or MD5 are fast and susceptible to GPU brute-forcing and dictionary attacks without proper salting and key-stretching.'
    },
    {
      q: 'Q5: How does subprocess.run(..., shell=False) protect against Command Injection?',
      a: 'When shell=False (the default), Python passes the list of arguments directly to the OS system call (execvp) without passing through a shell interpreter like /bin/sh. Thus, metacharacters like ; or | are treated as literal text arguments rather than command separators.'
    }
  ];

  const filteredVulnerabilities = VULNERABILITIES.filter(v => {
    if (filterSeverity === 'ALL') return true;
    return v.severity === filterSeverity;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '90px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* CASE STUDY HERO HEADER */}
      <GlassCard style={{ padding: '28px 24px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(9, 13, 22, 0.98))', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="glass-pill" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                <Award size={13} color="#38bdf8" /> Case Study & Viva Guide
              </span>
              <span className="glass-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                Python Web Application Security
              </span>
            </div>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Secure Coding in a Python Web Application
            </h1>

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '6px', maxWidth: '750px', lineHeight: 1.5 }}>
              A structured analysis of 6 key web security weaknesses, remediation techniques, secure coding principles, and the SSDLC engineering process. Designed for academic presentation & viva defense.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ textAlign: 'center', padding: '8px 14px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>6</span>
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: 0 }}>Weaknesses</p>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 14px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>7</span>
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: 0 }}>SSDLC Phases</p>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', overflowX: 'auto', paddingBottom: '4px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          {[
            { id: 'weaknesses', label: '6 Security Weaknesses', icon: ShieldAlert },
            { id: 'prioritization', label: 'Fix Priority & Ordering', icon: ListOrdered },
            { id: 'principles', label: 'Secure Coding Principles', icon: BookOpen },
            { id: 'ssdlc', label: 'SSDLC Process Lifecycle', icon: Layers },
            { id: 'roadmap', label: 'Recommended Approach', icon: CheckCircle2 },
            { id: 'viva', label: 'College Viva Q&A Guide', icon: HelpCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn-${isActive ? 'primary' : 'secondary'}`}
                style={{
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minHeight: '38px',
                  background: isActive ? 'linear-gradient(135deg, #0284c7, #0369a1)' : undefined
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* SECTION 1: THE SIX SECURITY WEAKNESSES */}
      {activeTab === 'weaknesses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* SEVERITY FILTER BAR */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#ef4444" />
                Detailed Vulnerability Analysis & Secure Python Fixes
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Each weakness includes a simple explanation, CWE classification, security impact, and secure Python implementation.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className="btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    minHeight: '28px',
                    borderColor: filterSeverity === sev ? '#38bdf8' : undefined,
                    color: filterSeverity === sev ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* VULNERABILITY CARDS LIST */}
          {filteredVulnerabilities.map((vuln, index) => {
            const Icon = vuln.icon;
            return (
              <GlassCard key={vuln.id} style={{ borderLeft: `4px solid ${vuln.color}`, padding: '20px' }}>

                {/* VULNERABILITY HEADER */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: vuln.badgeBg, padding: '10px', borderRadius: '12px' }}>
                      <Icon size={22} color={vuln.color} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                          {vuln.title}
                        </h3>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', fontFamily: 'monospace' }}>
                          {vuln.cwe}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                        Priority: <strong style={{ color: vuln.color }}>{vuln.priority}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="glass-pill" style={{ background: vuln.badgeBg, color: vuln.color, borderColor: vuln.color, fontSize: '0.75rem', fontWeight: 700 }}>
                    {vuln.severity} SEVERITY
                  </span>
                </div>

                {/* SIMPLE EXPLANATION & IMPACT GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 style={{ fontSize: '0.82rem', color: '#38bdf8', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      💡 Simple Words Explanation
                    </h4>
                    <p style={{ fontSize: '0.83rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
                      {vuln.simpleExplanation}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 style={{ fontSize: '0.82rem', color: '#f43f5e', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🔥 Security Impact
                    </h4>
                    <p style={{ fontSize: '0.83rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
                      {vuln.impact}
                    </p>
                  </div>
                </div>

                {/* CODE COMPARISON SIDE-BY-SIDE */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>

                  {/* VULNERABLE CODE BLOCK */}
                  <div style={{ background: '#090d16', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Flame size={14} /> Vulnerable Pattern (DO NOT USE)
                      </span>
                    </div>
                    <pre style={{ margin: 0, padding: '12px 14px', fontSize: '0.78rem', color: '#f87171', fontFamily: 'Fira Code, monospace', overflowX: 'auto', lineHeight: 1.45 }}>
                      <code>{vuln.vulnerableCode}</code>
                    </pre>
                  </div>

                  {/* SECURE CODE BLOCK */}
                  <div style={{ background: '#090d16', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} /> Secure Solution (RECOMMENDED)
                      </span>

                      <button
                        onClick={() => handleCopyCode(vuln.secureCode, index)}
                        className="btn-secondary"
                        style={{ padding: '2px 8px', minHeight: '24px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {copiedIndex === index ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        {copiedIndex === index ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre style={{ margin: 0, padding: '12px 14px', fontSize: '0.78rem', color: '#6ee7b7', fontFamily: 'Fira Code, monospace', overflowX: 'auto', lineHeight: 1.45 }}>
                      <code>{vuln.secureCode}</code>
                    </pre>
                  </div>

                </div>

              </GlassCard>
            );
          })}

        </div>
      )}

      {/* SECTION 2: PRIORITIZATION & WHAT TO FIX FIRST */}
      {activeTab === 'prioritization' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <GlassCard style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListOrdered size={22} color="#38bdf8" />
              Which Vulnerabilities Should Be Fixed First?
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Remediation priority is determined using risk scoring based on **Exploitability**, **Impact Severity**, and **Scope of Damage**. In secure coding, vulnerabilities allowing **Remote Code Execution (RCE)** or **Arbitrary File Access** must always be mitigated first.
            </p>
          </GlassCard>

          {/* PRIORITY TIERS GRID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* TIER 1: CRITICAL IMMEDIATE */}
            <GlassCard style={{ borderLeft: '4px solid #ef4444', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="glass-pill" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 800, fontSize: '0.8rem' }}>
                  PRIORITY 1 — IMMEDIATE FIX (CRITICAL)
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Remediation Window: &lt; 24 Hours</span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                1. Command Injection & 2. Path Traversal
              </h3>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <strong style={{ color: '#ef4444' }}>Why Fix First:</strong> These weaknesses grant attackers direct control over the host server or file system. A successful Command Injection allows arbitrary commands to run as the web server user. Path Traversal allows stealing application secrets, database configuration credentials, or internal environment variables.
              </div>
            </GlassCard>

            {/* TIER 2: HIGH PRIORITY */}
            <GlassCard style={{ borderLeft: '4px solid #f59e0b', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="glass-pill" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 800, fontSize: '0.8rem' }}>
                  PRIORITY 2 — HIGH PRIORITY
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Remediation Window: &lt; 48 Hours</span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                3. Plain-text Password Storage & 6. Outdated Dependencies
              </h3>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <strong style={{ color: '#f59e0b' }}>Why Fix Second:</strong> Plain-text password storage violates core privacy laws and leaves user credentials wide open during database leaks. Outdated third-party packages contain publicly available exploit code that automated attack bots actively scan for.
              </div>
            </GlassCard>

            {/* TIER 3: MODERATE PRIORITY */}
            <GlassCard style={{ borderLeft: '4px solid #3b82f6', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="glass-pill" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', fontWeight: 800, fontSize: '0.8rem' }}>
                  PRIORITY 3 — MODERATE PRIORITY
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Remediation Window: Next Release Cycle</span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                4. Generic Exception Handling & 5. Predictable Temporary Files
              </h3>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <strong style={{ color: '#3b82f6' }}>Why Fix Third:</strong> While important for robust software hygiene, these typically require local access or specific timing/reconnaissance to exploit. Fix these after blocking direct RCE and data leakage paths.
              </div>
            </GlassCard>

          </div>

          {/* PRIORITY SUMMARY TABLE */}
          <GlassCard style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
              📊 Quick Comparison Matrix
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '10px' }}>Vulnerability</th>
                    <th style={{ padding: '10px' }}>Severity</th>
                    <th style={{ padding: '10px' }}>Exploitability</th>
                    <th style={{ padding: '10px' }}>Primary Impact</th>
                    <th style={{ padding: '10px' }}>Fix Priority</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>Command Injection</td>
                    <td style={{ padding: '10px', color: '#ef4444', fontWeight: 700 }}>Critical</td>
                    <td style={{ padding: '10px' }}>Easy (High)</td>
                    <td style={{ padding: '10px' }}>Remote Code Execution (RCE)</td>
                    <td style={{ padding: '10px', color: '#ef4444', fontWeight: 700 }}>P1</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>Path Traversal</td>
                    <td style={{ padding: '10px', color: '#f97316', fontWeight: 700 }}>Critical</td>
                    <td style={{ padding: '10px' }}>Easy (High)</td>
                    <td style={{ padding: '10px' }}>Arbitrary File Read/Write</td>
                    <td style={{ padding: '10px', color: '#ef4444', fontWeight: 700 }}>P1</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>Plain-text Passwords</td>
                    <td style={{ padding: '10px', color: '#f59e0b', fontWeight: 700 }}>High</td>
                    <td style={{ padding: '10px' }}>Medium</td>
                    <td style={{ padding: '10px' }}>Mass Credential Compromise</td>
                    <td style={{ padding: '10px', color: '#f59e0b', fontWeight: 700 }}>P2</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>Outdated Dependencies</td>
                    <td style={{ padding: '10px', color: '#a855f7', fontWeight: 700 }}>High</td>
                    <td style={{ padding: '10px' }}>Medium</td>
                    <td style={{ padding: '10px' }}>Inherited CVE Exploits</td>
                    <td style={{ padding: '10px', color: '#f59e0b', fontWeight: 700 }}>P2</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>Predictable Temp Files</td>
                    <td style={{ padding: '10px', color: '#06b6d4', fontWeight: 700 }}>Medium</td>
                    <td style={{ padding: '10px' }}>Low (Local)</td>
                    <td style={{ padding: '10px' }}>Local Tampering / Race Condition</td>
                    <td style={{ padding: '10px', color: '#3b82f6', fontWeight: 700 }}>P3</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', fontWeight: 600 }}>Generic Exceptions</td>
                    <td style={{ padding: '10px', color: '#3b82f6', fontWeight: 700 }}>Medium</td>
                    <td style={{ padding: '10px' }}>Low</td>
                    <td style={{ padding: '10px' }}>Info Leakage & Silent Failure</td>
                    <td style={{ padding: '10px', color: '#3b82f6', fontWeight: 700 }}>P3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlassCard>

        </div>
      )}

      {/* SECTION 3: SECURE CODING PRINCIPLES */}
      {activeTab === 'principles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <GlassCard style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={22} color="#38bdf8" />
              Core Secure Coding Principles
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Fundamental design rules that software engineers must apply throughout the software lifecycle to minimize security flaws by design.
            </p>
          </GlassCard>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {SECURE_PRINCIPLES.map((principle, idx) => (
              <GlassCard key={idx} style={{ padding: '18px', background: 'rgba(15, 23, 42, 0.7)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '8px', borderRadius: '10px', color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem' }}>
                    0{idx + 1}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    {principle.title}
                  </h3>
                </div>

                <p style={{ fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                  {principle.desc}
                </p>

                <div style={{ background: 'rgba(3, 7, 18, 0.6)', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #38bdf8', fontSize: '0.78rem', color: '#38bdf8' }}>
                  <strong>Example:</strong> {principle.example}
                </div>
              </GlassCard>
            ))}
          </div>

        </div>
      )}

      {/* SECTION 4: SSDLC SECURITY PROCESS */}
      {activeTab === 'ssdlc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <GlassCard style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={22} color="#38bdf8" />
              Secure Software Development Life Cycle (SSDLC) Process
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Integrating security controls into every stage of application development ensures security is a continuous process rather than an afterthought.
            </p>
          </GlassCard>

          {/* SSDLC FLOW DIAGRAM */}
          <GlassCard style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🔄 Continuous SSDLC Pipeline Flow
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SSDLC_PHASES.map((phase, idx) => (
                <div
                  key={phase.step}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 18px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    borderRadius: '12px',
                    border: '1px solid rgba(56, 189, 248, 0.15)',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    {phase.step}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                        {phase.name}
                      </h4>
                      <span className="glass-pill" style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                        Tools: {phase.tool}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {phase.desc}
                    </p>
                  </div>

                  {idx < SSDLC_PHASES.length - 1 && (
                    <div style={{ display: 'none' }}>
                      <ArrowRight size={16} color="#38bdf8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

        </div>
      )}

      {/* SECTION 5: RECOMMENDED APPROACH */}
      {activeTab === 'roadmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <GlassCard style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={22} color="#10b981" />
              Recommended Remediation Approach
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              A step-by-step engineering roadmap for securing the Python web application systematically.
            </p>
          </GlassCard>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

            <GlassCard style={{ padding: '20px', borderTop: '3px solid #ef4444' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', marginBottom: '6px' }}>STEP 1 — IMMEDIATE ACTION</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0' }}>Eliminate RCE & Arbitrary File Access</h3>
              <ul style={{ fontSize: '0.82rem', color: '#cbd5e1', paddingLeft: '18px', margin: 0, lineHeight: 1.6 }}>
                <li>Replace `os.system()` with `subprocess.run(..., shell=False)`.</li>
                <li>Sanitize file paths with `os.path.basename()` and enforce root folder containment checks.</li>
              </ul>
            </GlassCard>

            <GlassCard style={{ padding: '20px', borderTop: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f59e0b', marginBottom: '6px' }}>STEP 2 — CREDENTIAL & DEPENDENCY HYGIENE</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0' }}>Enforce Passlib & Dependency Auditing</h3>
              <ul style={{ fontSize: '0.82rem', color: '#cbd5e1', paddingLeft: '18px', margin: 0, lineHeight: 1.6 }}>
                <li>Migrate all user passwords to Argon2id / bcrypt hashing.</li>
                <li>Run `pip-audit` / `safety` and upgrade outdated PyPI packages in `requirements.txt`.</li>
              </ul>
            </GlassCard>

            <GlassCard style={{ padding: '20px', borderTop: '3px solid #38bdf8' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>STEP 3 — HARDEN SYSTEM LOGGING & TEMPS</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0' }}>Clean Exception Handling & Tempfiles</h3>
              <ul style={{ fontSize: '0.82rem', color: '#cbd5e1', paddingLeft: '18px', margin: 0, lineHeight: 1.6 }}>
                <li>Use `tempfile.NamedTemporaryFile()` for secure random temporary file creation.</li>
                <li>Catch specific exceptions and return generic safe user messages while logging internal stack traces securely.</li>
              </ul>
            </GlassCard>

          </div>

        </div>
      )}

      {/* SECTION 6: COLLEGE VIVA Q&A GUIDE */}
      {activeTab === 'viva' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <GlassCard style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={22} color="#38bdf8" />
              College Viva & Presentation Defense Guide
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Common examiner questions and concise, high-scoring technical answers for your project presentation.
            </p>
          </GlassCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {VIVA_QUESTIONS.map((qa, idx) => (
              <GlassCard key={idx} style={{ padding: '18px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', margin: '0 0 8px 0' }}>
                  {qa.q}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5, background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px' }}>
                  <strong style={{ color: '#10b981' }}>Answer:</strong> {qa.a}
                </p>
              </GlassCard>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
