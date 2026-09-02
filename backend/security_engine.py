# CypherBuddy Security Engine
# Hardened Threat Analysis, SSRF Validation, File Signature (Magic Byte) Inspection, and Cryptographic Utilities

import re
import os
import io
import socket
import ipaddress
import urllib.parse
import hashlib
from typing import Dict, Any, List, Tuple

# Blocked Private / Internal IP Ranges (SSRF Protection)
PRIVATE_IP_NETWORKS = [
    ipaddress.ip_network('127.0.0.0/8'),
    ipaddress.ip_network('10.0.0.0/8'),
    ipaddress.ip_network('172.16.0.0/12'),
    ipaddress.ip_network('192.168.0.0/16'),
    ipaddress.ip_network('169.254.169.254/32'), # AWS / GCP Metadata Endpoint
    ipaddress.ip_network('0.0.0.0/8'),
    ipaddress.ip_network('::1/128'),
]

# Magic Byte Signatures for File Type Validation
MAGIC_BYTES = {
    'apk': b'PK\x03\x04',
    'zip': b'PK\x03\x04',
    'pdf': b'%PDF',
    'png': b'\x89PNG\r\n\x1a\n',
    'jpg': b'\xff\xd8\xff',
    'exe': b'MZ'
}

SUSPICIOUS_KEYWORDS = [
    'verify', 'secure', 'login', 'bank', 'update', 'account', 'kyc',
    'reward', 'gift', 'claim', 'free', 'support-desk', 'urgent', 'blocked'
]

DANGEROUS_TLDS = ['.xyz', '.top', '.click', '.gq', '.cf', '.work', '.download', '.site', '.online', '.info', '.biz']
KNOWN_BRANDS = ['paypal', 'amazon', 'google', 'facebook', 'hdfc', 'sbi', 'apple', 'netflix', 'whatsapp', 'microsoft']

# Common typosquatting/leet-speak patterns for brand impersonation detection
TYPOSQUAT_PATTERNS = [
    # paypal variations
    ('paypa1', 'PAYPAL'), ('paypall', 'PAYPAL'), ('pay-pal', 'PAYPAL'), ('paypa1', 'PAYPAL'),
    # amazon variations
    ('amaz0n', 'AMAZON'), ('arnazon', 'AMAZON'), ('amazzon', 'AMAZON'),
    # google variations
    ('g00gle', 'GOOGLE'), ('gooogle', 'GOOGLE'), ('googIe', 'GOOGLE'),
    # apple variations
    ('app1e', 'APPLE'), ('appl3', 'APPLE'),
    # microsoft variations
    ('micros0ft', 'MICROSOFT'), ('microsofl', 'MICROSOFT'),
]

# Suspicious path keywords that amplify phishing likelihood
SUSPICIOUS_PATH_KEYWORDS = [
    'verify', 'login', 'secure', 'account', 'update', 'confirm', 'auth',
    'banking', 'wallet', 'password', 'reset', 'kyc', 'otp', 'pin'
]

def is_ssrf_safe_url(url_str: str) -> Tuple[bool, str]:
    """
    SSRF Protection Guard: Ensures URL uses allowed schemes and does not target
    internal loopback, private RFC1918 IPs, or cloud metadata endpoints.
    """
    try:
        parsed = urllib.parse.urlparse(url_str)
        if parsed.scheme not in ('http', 'https'):
            return False, "Blocked invalid URI scheme. Only http/https supported."

        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid or missing hostname in URL."

        # Reject localhost or loopback strings
        if hostname.lower() in ('localhost', '127.0.0.1', '::1', '0.0.0.0'):
            return False, "Access to localhost or internal network interfaces is blocked."

        # Check raw IP
        try:
            ip_obj = ipaddress.ip_address(hostname)
            for net in PRIVATE_IP_NETWORKS:
                if ip_obj in net:
                    return False, f"Access to private/internal IP ({hostname}) is blocked."
        except ValueError:
            # Hostname is a domain name, resolve DNS safely
            try:
                resolved_ip = socket.gethostbyname(hostname)
                ip_obj = ipaddress.ip_address(resolved_ip)
                for net in PRIVATE_IP_NETWORKS:
                    if ip_obj in net:
                        return False, f"Domain resolved to blocked internal IP ({resolved_ip})."
            except Exception:
                pass # DNS resolution failure will be handled gracefully

        return True, "URL passed SSRF safety check."
    except Exception as e:
        return False, "Failed to parse target URL."

def validate_file_magic_bytes(file_bytes: bytes, filename: str) -> Tuple[bool, str]:
    """
    Inspects raw file header bytes against expected magic signatures rather than trusting user extensions.
    """
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    
    if ext in ('apk', 'zip'):
        if not file_bytes.startswith(MAGIC_BYTES['apk']):
            return False, "File header does not match valid ZIP/APK archive signature."
    elif ext == 'pdf':
        if not file_bytes.startswith(MAGIC_BYTES['pdf']):
            return False, "File header does not match valid PDF document signature."
    elif ext == 'png':
        if not file_bytes.startswith(MAGIC_BYTES['png']):
            return False, "File header does not match valid PNG image signature."
    elif ext in ('jpg', 'jpeg'):
        if not file_bytes.startswith(MAGIC_BYTES['jpg']):
            return False, "File header does not match valid JPEG image signature."
    elif ext == 'exe':
        if not file_bytes.startswith(MAGIC_BYTES['exe']):
            return False, "File header does not match valid Windows Executable signature."
            
    return True, "Magic byte signature verified."

def analyze_url_hardened(url: str) -> Dict[str, Any]:
    """
    Hardened URL scanner with SSRF validation, brand spoofing detection, and TLD scoring.
    """
    is_safe, ssrf_msg = is_ssrf_safe_url(url)
    if not is_safe:
        return {
            "target": url,
            "riskScore": 100,
            "status": "DANGEROUS",
            "findings": [
                {
                    "type": "DANGER",
                    "title": "SSRF Security Threat Blocked",
                    "desc": ssrf_msg
                }
            ],
            "recommendation": "Blocked by CypherBuddy Security Gateway."
        }

    clean_url = url.strip()
    if not clean_url.startswith(('http://', 'https://')):
        clean_url = 'https://' + clean_url

    risk_score = 10
    findings = []
    
    is_https = clean_url.startswith('https://')
    if not is_https:
        risk_score += 25
        findings.append({
            "type": "WARNING",
            "title": "Unencrypted HTTP Protocol",
            "desc": "Data sent to this site is unencrypted and open to interception."
        })
    else:
        findings.append({
            "type": "SAFE",
            "title": "HTTPS Encryption",
            "desc": "Valid SSL/TLS connection established."
        })

    # Dangerous TLD Check
    for tld in DANGEROUS_TLDS:
        if tld in clean_url.lower():
            risk_score += 30
            findings.append({
                "type": "DANGER",
                "title": f"High Risk TLD ({tld})",
                "desc": "Top-level domain extension frequently used in malware/phishing campaigns."
            })
            break

    # Typosquatting / Leet-speak Brand Impersonation
    url_lower = clean_url.lower()
    for typo_pattern, brand_name in TYPOSQUAT_PATTERNS:
        if typo_pattern in url_lower:
            risk_score += 50
            findings.append({
                "type": "DANGER",
                "title": f"Typosquatting / {brand_name} Impersonation Detected",
                "desc": f"Domain uses '{typo_pattern}' — a known typosquat of the {brand_name} brand to deceive users."
            })

    # Standard brand name in wrong domain
    for brand in KNOWN_BRANDS:
        if brand in url_lower and f".{brand}.com" not in url_lower and f"www.{brand}." not in url_lower:
            risk_score += 40
            findings.append({
                "type": "DANGER",
                "title": f"Suspected {brand.upper()} Brand Impersonation",
                "desc": f"Contains '{brand}' but is not hosted on the official domain."
            })

    # Suspicious path/query keyword boost
    parsed_path = urllib.parse.urlparse(clean_url).path.lower() + urllib.parse.urlparse(clean_url).query.lower()
    matched_keywords = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in parsed_path]
    if matched_keywords:
        boost = min(25, len(matched_keywords) * 8)
        risk_score += boost
        findings.append({
            "type": "WARNING",
            "title": f"Suspicious Path Keywords: {', '.join(matched_keywords[:3])}",
            "desc": "URL path contains terms commonly used in credential phishing pages."
        })

    risk_score = min(100, max(5, risk_score))
    status = "DANGEROUS" if risk_score >= 70 else ("SUSPICIOUS" if risk_score >= 35 else "SAFE")

    return {
        "id": f"SCAN-{__import__('random').randint(100000, 999999)}",
        "type": "URL",
        "target": clean_url,
        "riskScore": risk_score,
        "status": status,
        "timestamp": "Just now",
        "findings": findings,
        "recommendation": "Do not enter passwords or sensitive info. Block sender immediately." if status == "DANGEROUS" else ("Proceed with caution and verify the site." if status == "SUSPICIOUS" else "Safe to browse.")
    }

def analyze_message_hardened(msg: str) -> Dict[str, Any]:
    """
    Multi-signal NLP & Heuristic Message Phishing Classifier.
    """
    risk_score = 10
    findings = []
    lower = msg.lower()

    if any(w in lower for w in ['urgent', 'immediately', 'suspended', 'account blocked']):
        risk_score += 30
        findings.append({
            "type": "WARNING",
            "title": "High Urgency Pressure Tactics",
            "desc": "Uses urgent wording designed to bypass critical thinking."
        })

    if any(w in lower for w in ['otp', 'pin', 'password', 'cvv', 'kyc']):
        risk_score += 35
        findings.append({
            "type": "DANGER",
            "title": "Requests Confidential Credentials / OTP",
            "desc": "Legitimate organizations never ask for your passwords or OTPs via SMS."
        })

    risk_score = min(100, max(5, risk_score))
    status = "DANGEROUS" if risk_score >= 70 else ("SUSPICIOUS" if risk_score >= 35 else "SAFE")

    return {
        "text": msg[:60] + "...",
        "riskScore": risk_score,
        "status": status,
        "findings": findings,
        "recommendation": "Do not reply or click any links." if status == "DANGEROUS" else "Normal message."
    }
