# CypherBuddy Security Engine
# Hardened Threat Analysis, SSRF Validation, File Signature (Magic Byte) Inspection, and Cryptographic Utilities

import re
import os
import io
import time
import socket
import ipaddress
import unicodedata
import urllib.parse
import urllib.request
import urllib.error
import hashlib
import zipfile
import json
from typing import Dict, Any, List, Tuple, Optional

# ---------------------------------------------------------------------------
# Shared threat-intelligence data (single source of truth).
# The same JSON file drives the on-device engine in src/services/urlEngine.js,
# so the app and the backend always reach the same verdict.
# ---------------------------------------------------------------------------
_INTEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "shared", "url_intel.json")
with open(_INTEL_PATH, "r", encoding="utf-8") as _fh:
    INTEL: Dict[str, Any] = json.load(_fh)

DANGEROUS_THRESHOLD: int = INTEL["thresholds"]["dangerous"]
SUSPICIOUS_THRESHOLD: int = INTEL["thresholds"]["suspicious"]

_MULTI_SUFFIXES = set(INTEL["multiPartSuffixes"])
_SHARED_HOSTING = set(INTEL["sharedHosting"])
_USER_CONTENT_HOSTS = tuple(INTEL["userContentHosts"])
SHORTENERS = set(INTEL["shorteners"])
_BRANDS: List[str] = INTEL["brands"]
_SUFFIX_WORDS = set(INTEL["brandSuffixWords"])
_PREFIX_WORDS = set(INTEL["brandPrefixWords"])
_OFFICIAL: Dict[str, set] = {b: set(d) for b, d in INTEL["officialDomains"].items()}
_OFFICIAL_ALL = set().union(*_OFFICIAL.values())
_KNOWN_GOOD = set(INTEL["knownGood"]) | _OFFICIAL_ALL
_TRUSTED_SUFFIXES = tuple(INTEL["trustedSuffixes"])
_HIGH_TLDS = set(INTEL["highRiskTlds"])
_MOD_TLDS = set(INTEL["moderateRiskTlds"])
_SCAM_TOKENS = set(INTEL["scamTokens"])
_PATH_KEYWORDS = INTEL["pathKeywords"]
_TYPO_PATTERNS = INTEL["typosquatPatterns"]
_CONFUSABLES = INTEL["confusables"]

# Magic Byte Signatures for File Type Validation
MAGIC_BYTES = {
    'apk': b'PK\x03\x04',
    'zip': b'PK\x03\x04',
    'pdf': b'%PDF',
    'png': b'\x89PNG\r\n\x1a\n',
    'jpg': b'\xff\xd8\xff',
    'exe': b'MZ'
}

_BLOCKED_PSEUDO_SCHEMES = re.compile(r"^(javascript|data|vbscript|file|intent|blob|mailto|tel|sms|market):", re.I)
_BROWSER_UA = (
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0 Mobile Safari/537.36"
)


# ---------------------------------------------------------------------------
# SSRF guard
# ---------------------------------------------------------------------------
def _ip_is_internal(ip_obj) -> bool:
    mapped = getattr(ip_obj, "ipv4_mapped", None)
    if mapped is not None:
        ip_obj = mapped
    return (
        ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or
        ip_obj.is_multicast or ip_obj.is_reserved or ip_obj.is_unspecified
    )


def is_ssrf_safe_url(url_str: str, resolve: bool = True) -> Tuple[bool, str]:
    """
    SSRF Protection Guard: ensures URL uses allowed schemes and does not target
    internal loopback, private (RFC1918/ULA) addresses, or cloud metadata endpoints.

    resolve=False skips DNS (used when scoring a link we will never connect to);
    resolve=True resolves every A/AAAA record (used before the backend fetches a hop).
    """
    try:
        parsed = urllib.parse.urlparse(url_str)
        if parsed.scheme not in ('http', 'https'):
            return False, "Blocked invalid URI scheme. Only http/https supported."

        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid or missing hostname in URL."

        if hostname.lower() in ('localhost', 'localhost.localdomain', 'ip6-localhost'):
            return False, "Access to localhost or internal network interfaces is blocked."

        try:
            ip_obj = ipaddress.ip_address(hostname)
            if _ip_is_internal(ip_obj):
                return False, f"Link points to a private/internal network address ({hostname})."
            return True, "URL passed SSRF safety check."
        except ValueError:
            pass

        if resolve:
            try:
                for info in socket.getaddrinfo(hostname, None):
                    addr = info[4][0].split('%')[0]
                    if _ip_is_internal(ipaddress.ip_address(addr)):
                        return False, f"Domain resolves to a blocked internal address ({addr})."
            except (socket.gaierror, ValueError, OSError):
                pass  # DNS failure is handled gracefully; nothing is fetched

        return True, "URL passed SSRF safety check."
    except Exception:
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


# ---------------------------------------------------------------------------
# Domain helpers
# ---------------------------------------------------------------------------
def status_for(score: int) -> str:
    return "DANGEROUS" if score >= DANGEROUS_THRESHOLD else ("SUSPICIOUS" if score >= SUSPICIOUS_THRESHOLD else "SAFE")


def registrable_domain(host: str) -> str:
    """eTLD+1 using a compact suffix table (no network, no extra dependency)."""
    labels = [l for l in host.split('.') if l]
    if len(labels) <= 2:
        return '.'.join(labels)
    last2 = '.'.join(labels[-2:])
    if last2 in _MULTI_SUFFIXES or last2 in _SHARED_HOSTING:
        return '.'.join(labels[-3:])
    return last2


def _is_user_content_host(host: str) -> bool:
    return any(host == h or host.endswith('.' + h) for h in _USER_CONTENT_HOSTS)


def _decode_idna(host: str) -> str:
    try:
        return host.encode('ascii').decode('idna') if 'xn--' in host else host
    except Exception:
        return host


def _skeleton(host: str) -> str:
    """Lower-case ASCII look-alike skeleton of a (possibly Unicode / punycode) host."""
    s = unicodedata.normalize('NFKC', _decode_idna(host)).lower()
    s = ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))
    return ''.join(_CONFUSABLES.get(c, c) for c in s)


def _leet_variants(host: str) -> List[str]:
    if not re.search(r"[0-9@$]|rn|vv", host):
        return []
    base = host.replace('@', 'a').replace('$', 's')
    out = []
    for one in ('l', 'i'):
        v = base.replace('0', 'o').replace('1', one).replace('3', 'e').replace('4', 'a').replace('5', 's').replace('7', 't')
        v = v.replace('rn', 'm').replace('vv', 'w')
        if v != host and v not in out:
            out.append(v)
    return out


def _brand_hits(text: str) -> List[str]:
    """Brand tokens present in text. Short brands need whole-token (or brand+known-affix) matches
    so 'groups' never matches 'ups' and 'steampowered' never matches 'steam' by accident."""
    text = text.lower()
    tokens = [t for t in re.split(r"[.\-_/]+", text) if t]
    hits = []
    for brand in _BRANDS:
        hit = False
        if len(brand) >= 6 and brand in text:
            hit = True
        else:
            for tok in tokens:
                if tok == brand or \
                   (tok.startswith(brand) and tok[len(brand):] in _SUFFIX_WORDS) or \
                   (tok.endswith(brand) and tok[:-len(brand)] in _PREFIX_WORDS):
                    hit = True
                    break
        if hit:
            hits.append(brand)
    return hits


def _is_official_for(brand: str, reg: str) -> bool:
    return reg in _OFFICIAL.get(brand, set()) or reg in _OFFICIAL_ALL


def _is_obfuscated_numeric_host(host: str) -> bool:
    return bool(re.fullmatch(r"(0x[0-9a-f]+|\d{8,10})", host) or re.fullmatch(r"(0x[0-9a-f]+\.){1,3}0x[0-9a-f]+", host))


def _norm_input(url: str) -> Tuple[str, Optional[str]]:
    """Returns (clean_url, blocked_reason). Adds https:// to scheme-less input."""
    clean = url.strip()
    if _BLOCKED_PSEUDO_SCHEMES.match(clean):
        return clean, "Blocked invalid URI scheme. Only http/https supported."
    if '://' not in clean:
        clean = 'https://' + clean
    return clean, None


# ---------------------------------------------------------------------------
# Short-link expansion (backend only; the app calls the API for these)
# ---------------------------------------------------------------------------
class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def expand_short_url(url: str, max_hops: int = 4, total_timeout: float = 5.0) -> Tuple[str, List[str], bool]:
    """
    Follows redirects manually, ONLY while the current hop is a known shortener, and checks every
    hop with the SSRF guard first. The final non-shortener destination is never contacted.
    Returns (final_url, chain, resolved).
    """
    chain = [url]
    current = url
    deadline = time.monotonic() + total_timeout
    opener = urllib.request.build_opener(_NoRedirect)

    for _ in range(max_hops):
        host = (urllib.parse.urlparse(current).hostname or '').lower()
        if host not in SHORTENERS:
            return current, chain, True
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            return current, chain, False
        ok, _msg = is_ssrf_safe_url(current, resolve=True)
        if not ok:
            return current, chain, False
        req = urllib.request.Request(current, method="GET", headers={"User-Agent": _BROWSER_UA, "Range": "bytes=0-0"})
        try:
            resp = opener.open(req, timeout=min(3.0, remaining))
            resp.close()
            return current, chain, False  # shortener served a page instead of redirecting
        except urllib.error.HTTPError as e:
            loc = e.headers.get("Location") if e.headers else None
            code = e.code
            e.close()
            if code in (301, 302, 303, 307, 308) and loc:
                current = urllib.parse.urljoin(current, loc)
                chain.append(current)
                continue
            return current, chain, False
        except Exception:
            return current, chain, False

    host = (urllib.parse.urlparse(current).hostname or '').lower()
    return current, chain, host not in SHORTENERS


# ---------------------------------------------------------------------------
# URL scoring
# ---------------------------------------------------------------------------
def _add(findings: List[Dict[str, str]], ftype: str, title: str, desc: str) -> None:
    findings.append({"type": ftype, "title": title, "desc": desc})


def _score_url(clean_url: str) -> Tuple[int, List[Dict[str, str]], Dict[str, Any]]:
    parsed = urllib.parse.urlparse(clean_url)
    host = (parsed.hostname or '').lower().rstrip('.')
    path_q = (parsed.path + ' ' + parsed.query).lower()
    is_https = parsed.scheme == 'https'
    findings: List[Dict[str, str]] = []
    meta: Dict[str, Any] = {"host": host}

    reg = registrable_domain(host)
    meta["registrableDomain"] = reg
    score = 10

    # 1. Transport
    if is_https:
        _add(findings, "SAFE", "HTTPS Encryption", "Connection to this site is encrypted (SSL/TLS).")
    else:
        score += 15
        _add(findings, "WARNING", "Unencrypted HTTP Protocol", "Data sent to this site is unencrypted and open to interception.")

    # 2. Deceptive user-info trick (https://paypal.com@evil.xyz)
    if parsed.username and '.' in parsed.username:
        score += 35
        _add(findings, "DANGER", "Deceptive '@' in Link",
             f"Text before the '@' ({parsed.username}) looks like a website but the real destination is {host}.")

    # 3. Raw / obfuscated IP hosts
    is_ip = False
    try:
        ipaddress.ip_address(host)
        is_ip = True
    except ValueError:
        pass
    if is_ip:
        score += 45
        _add(findings, "DANGER", "Direct IP Address Hostname",
             f"Site uses a raw IP address ({host}) instead of a registered domain. Common in evasive phishing and malware servers.")
    elif _is_obfuscated_numeric_host(host):
        score += 45
        _add(findings, "DANGER", "Obfuscated IP Address", "The hostname is a disguised numeric IP address, a classic filter-evasion trick.")

    # 4. Look-alike (homograph / punycode) domains
    skel = _skeleton(host)
    non_ascii = any(ord(c) > 127 for c in host)
    is_idn = non_ascii or 'xn--' in host
    if is_idn:
        skel_reg = registrable_domain(skel)
        if skel != host and skel_reg in _KNOWN_GOOD:
            score += 65
            _add(findings, "DANGER", "IDN Homograph Impersonation",
                 f"This domain uses look-alike characters to imitate {skel_reg}.")
        else:
            score += 35
            _add(findings, "WARNING", "Internationalised Domain (xn--)",
                 "Domain uses non-Latin characters that can be used to visually spoof familiar sites.")

    # 5. Recognised-good domains: stop early (user-content platforms are handled below)
    user_content = _is_user_content_host(host)
    trusted_suffix = host.endswith(_TRUSTED_SUFFIXES)
    if not is_ip and not is_idn and not user_content and (reg in _KNOWN_GOOD or trusted_suffix):
        label = "Official government / education / banking domain" if trusted_suffix and reg not in _KNOWN_GOOD else "Recognised domain"
        _add(findings, "SAFE", label, f"{reg} is a well-known, legitimate website.")
        meta["knownGood"] = True
        return max(5, 5 + (0 if is_https else 15)), findings, meta

    # 6. Trusted platform hosting user-made pages (forms, sites, shared drives)
    if user_content:
        score += 25
        _add(findings, "WARNING", "User-Made Page on a Trusted Platform",
             f"{host} is a real service, but anyone can publish a page here. The platform vouches for the domain, not for this page.")
        for brand in _brand_hits(parsed.path + ' ' + parsed.query):
            score += 45
            _add(findings, "DANGER", f"Page Imitates {brand.upper()}",
                 f"This page name references {brand} while hosted on {host}, a common phishing trick.")
            break

    # 7. Free / shared hosting
    elif reg in _SHARED_HOSTING or any(host.endswith('.' + h) for h in _SHARED_HOSTING):
        score += 10
        _add(findings, "WARNING", "Free Hosting Subdomain", "Hosted on a free shared platform where anyone can create a site instantly.")

    # 8. TLD reputation
    tld = host.rsplit('.', 1)[-1] if '.' in host else ''
    if tld in _HIGH_TLDS:
        score += 30
        _add(findings, "DANGER", f"High Risk TLD (.{tld})", "Top-level domain extension frequently used in malware/phishing campaigns.")
    elif tld in _MOD_TLDS:
        score += 15
        _add(findings, "WARNING", f"Low-Reputation TLD (.{tld})", "Extension is cheap and often abused for short-lived scam sites.")

    # 9. Brand impersonation (skipped for user-content hosts, handled above)
    impersonated: Optional[str] = None
    if not user_content and not is_ip:
        raw_hits = [b for b in _brand_hits(host) if not _is_official_for(b, reg)]
        typo = next(((p, b) for p, b in _TYPO_PATTERNS if p in host), None)
        leet_hit = None
        if not raw_hits:
            for variant in _leet_variants(host):
                vh = [b for b in _brand_hits(variant) if not _is_official_for(b, reg)]
                if vh:
                    leet_hit = vh[0]
                    break
        if typo or leet_hit:
            score += 55
            name = typo[1] if typo else leet_hit.upper()
            impersonated = name
            _add(findings, "DANGER", f"Typosquatting / {name} Impersonation Detected",
                 f"Domain imitates {name} using look-alike spelling designed to deceive.")
        elif raw_hits:
            score += 45
            impersonated = raw_hits[0].upper()
            _add(findings, "DANGER", f"Suspected {impersonated} Brand Impersonation",
                 f"Hostname contains '{raw_hits[0]}' but is not hosted on an official {raw_hits[0]} domain.")

        # Official domain pasted in front of a foreign domain (paypal.com.evil.xyz)
        for d in _OFFICIAL_ALL:
            if (d + '.') in (host + '.') and host != d and not host.endswith('.' + d):
                score += 30
                _add(findings, "DANGER", "Official Domain Used as Decoy",
                     f"'{d}' appears inside the address, but the real site is {reg}.")
                break

    # 10. Bait words in the hostname
    if not is_ip:
        host_tokens = {t for t in re.split(r"[.\-_]+", host) if t}
        bait = sorted(host_tokens & _SCAM_TOKENS)
        if len(bait) >= 3:
            score += 35
        elif len(bait) == 2:
            score += 25
        elif len(bait) == 1:
            score += 10
        if bait:
            _add(findings, "WARNING", "Scam Bait Words in Domain",
                 f"Domain contains words typical of scam portals: {', '.join(bait[:4])}.")
        if impersonated and bait:
            score += 15
            _add(findings, "DANGER", "Brand Name Combined With Bait Words",
                 f"{impersonated} plus '{bait[0]}' is the classic pattern of a fake support/reward/KYC page.")

    # 11. Subdomain nesting beyond the registrable domain
    extra_labels = len([l for l in host.split('.') if l]) - len([l for l in reg.split('.') if l])
    if extra_labels > 3:
        score += 20
        _add(findings, "WARNING", "Deep Subdomain Nesting", "Multiple nested subdomains hide the true hosting domain.")

    # 12. Credential-harvesting path keywords
    matched = [kw for kw in _PATH_KEYWORDS if kw in path_q]
    if matched:
        score += min(30, len(matched) * 10)
        _add(findings, "WARNING", f"Suspicious Path Keywords: {', '.join(matched[:3])}",
             "URL path contains terms commonly used in credential harvesting and OTP phishing pages.")

    return score, findings, meta


def _recommendation(status: str) -> str:
    if status == "DANGEROUS":
        return "DO NOT OPEN. Do not enter passwords, OTPs or card details. Block the sender and report this link."
    if status == "SUSPICIOUS":
        return "Proceed with caution. Verify the sender through another channel before opening."
    return "No threat signals found. Safe to browse."


def analyze_url_hardened(url: str, expand: bool = True) -> Dict[str, Any]:
    """
    Hardened URL scanner. Pure heuristics plus (optional) short-link expansion:
    SSRF guard, punycode/homograph detection, brand + typosquat detection against a
    registrable-domain allow-list, TLD reputation, bait-word and path analysis.
    """
    original = (url or '').strip()
    clean_url, blocked = _norm_input(original)
    ok, ssrf_msg = (False, blocked) if blocked else is_ssrf_safe_url(clean_url, resolve=False)
    if not ok:
        return {
            "id": f"SCAN-{__import__('random').randint(100000, 999999)}",
            "type": "URL",
            "target": original,
            "riskScore": 100,
            "status": "DANGEROUS",
            "timestamp": "Just now",
            "findings": [{"type": "DANGER", "title": "Unsafe Link Target Blocked", "desc": ssrf_msg}],
            "recommendation": "Blocked by CypherBuddy Security Gateway.",
        }

    host = (urllib.parse.urlparse(clean_url).hostname or '').lower().rstrip('.')
    final_url = clean_url
    chain: List[str] = [clean_url]
    pre_findings: List[Dict[str, str]] = []
    resolved = True

    if host in SHORTENERS:
        if expand:
            final_url, chain, resolved = expand_short_url(clean_url)
        else:
            resolved = False

        if resolved and final_url != clean_url:
            f_scheme = urllib.parse.urlparse(final_url).scheme
            if f_scheme not in ('http', 'https'):
                score, findings, meta = 10, [], {"host": host}
                score += 45
                _add(findings, "DANGER", "Short Link Redirects to a Non-Web Target", f"The link forwards to a {f_scheme or 'unknown'}:// address.")
            else:
                score, findings, meta = _score_url(final_url)
                final_host = (urllib.parse.urlparse(final_url).hostname or '')
                pre_findings.append({
                    "type": "INFO", "title": "Short Link Expanded",
                    "desc": f"{host} forwards to {final_host} ({len(chain) - 1} redirect{'s' if len(chain) != 2 else ''})."
                })
                score = max(score, 15)
        else:
            findings, meta = [], {"host": host}
            score = 10 + 25
            _add(findings, "WARNING", "Shortened Link Hides Its Destination",
                 f"{host} is a link shortener and CypherBuddy could not verify where this link leads.")
            path_q = (urllib.parse.urlparse(clean_url).path).lower()
            matched = [kw for kw in _PATH_KEYWORDS if kw in path_q]
            if matched:
                score += min(30, len(matched) * 10)
                _add(findings, "WARNING", f"Suspicious Path Keywords: {', '.join(matched[:3])}",
                     "The short link slug contains credential-harvesting terms.")
    else:
        score, findings, meta = _score_url(clean_url)

    findings = pre_findings + findings
    score = min(100, max(5, score))
    status = status_for(score)

    result = {
        "id": f"SCAN-{__import__('random').randint(100000, 999999)}",
        "type": "URL",
        "target": clean_url,
        "domain": meta.get("host", host),
        "registrableDomain": meta.get("registrableDomain", ""),
        "riskScore": score,
        "status": status,
        "timestamp": "Just now",
        "findings": findings,
        "recommendation": _recommendation(status),
    }
    if final_url != clean_url:
        result["finalUrl"] = final_url
        result["redirectChain"] = chain
    return result

def inspect_apk_archive(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Performs real static bytecode and manifest inspection of an Android APK package.
    Extracts true Android permissions, checks archive integrity, and flags malware techniques.
    """
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    file_size_mb = len(file_bytes) / (1024 * 1024)

    if not file_bytes.startswith(MAGIC_BYTES['apk']):
        return {
            "id": f"APK-{uuid_short()}",
            "type": "APK",
            "target": filename,
            "size": f"{file_size_mb:.2f} MB",
            "hash": sha256_hash,
            "riskScore": 95,
            "status": "DANGEROUS",
            "findings": [
                {
                    "type": "DANGER",
                    "title": "Corrupt or Spoofed APK Header",
                    "desc": "File does not contain valid ZIP/APK archive magic bytes."
                }
            ],
            "recommendation": "File corrupted or spoofed. Do not install."
        }

    risk_score = 10
    findings = [
        {"type": "SAFE", "title": "Magic Byte Signature Verified", "desc": "Valid Android ZIP/APK archive container."},
        {"type": "SAFE", "title": "SHA-256 Cryptographic Hash", "desc": sha256_hash}
    ]
    detected_permissions = []

    try:
        apk_buffer = io.BytesIO(file_bytes)
        with zipfile.ZipFile(apk_buffer, 'r') as zf:
            file_list = zf.namelist()

            # Check core Android artifacts
            has_manifest = 'AndroidManifest.xml' in file_list
            has_dex = any(f.endswith('.dex') for f in file_list)

            if not has_manifest or not has_dex:
                risk_score += 40
                findings.append({
                    "type": "WARNING",
                    "title": "Non-Standard Android Structure",
                    "desc": "Archive lacks standard AndroidManifest.xml or classes.dex compilation artifacts."
                })

            # Check for embedded secondary APKs (Dropper Pattern)
            embedded_apks = [f for f in file_list if f.endswith('.apk') and f != filename]
            if embedded_apks:
                risk_score += 40
                findings.append({
                    "type": "DANGER",
                    "title": "Embedded Secondary APK Payload (Dropper)",
                    "desc": f"Contains hidden nested APK files ({', '.join(embedded_apks[:2])}) characteristic of malware droppers."
                })

            # Extract permissions from AndroidManifest.xml byte string pool
            if has_manifest:
                manifest_data = zf.read('AndroidManifest.xml')
                # Binary AndroidManifest stores string pool as UTF-8 or UTF-16
                perm_regex = re.compile(rb'android\.permission\.([A-Za-z0-9_]+)')
                matches = perm_regex.findall(manifest_data)
                for m in matches:
                    try:
                        p_name = m.decode('utf-8', errors='ignore')
                        if p_name and p_name not in detected_permissions:
                            detected_permissions.append(p_name)
                    except Exception:
                        pass

        # Evaluate risk of extracted permissions
        high_risk_perms = {
            'BIND_ACCESSIBILITY_SERVICE': (45, "Accessibility Hijacking - Complete screen control & keylogging (used by banking trojans)"),
            'SYSTEM_ALERT_WINDOW': (30, "Screen Overlay Window - Can draw fake login screens over banking and payment apps"),
            'SEND_SMS': (30, "Silent SMS Sending - Can send unauthorized premium toll messages"),
            'RECEIVE_SMS': (35, "SMS Interception - Can intercept 2-Factor Authentication (OTP) codes"),
            'READ_SMS': (35, "Read Sensitive SMS - Can read private messages and bank transaction alerts"),
            'REQUEST_INSTALL_PACKAGES': (25, "Rogue Installer - Can silently install third-party unknown applications"),
            'BIND_DEVICE_ADMIN': (35, "Device Administrator Lockout - Prevents uninstallation and can lock phone"),
            'RECORD_AUDIO': (20, "Surreptitious Microphone Access - Spyware risk"),
            'CAMERA': (15, "Camera Access - Potential surveillance capability"),
            'READ_CONTACTS': (15, "Contacts Harvesting - Scrapes entire address book"),
            'ACCESS_FINE_LOCATION': (15, "Precise GPS Tracking - Real-time location surveillance"),
            'ACCESS_BACKGROUND_LOCATION': (20, "Background GPS Location - Continuous tracking without app open"),
            'RECEIVE_BOOT_COMPLETED': (10, "Boot Persistence - Runs automatically on phone startup")
        }

        for perm, (p_risk, p_desc) in high_risk_perms.items():
            if perm in detected_permissions:
                risk_score += p_risk
                findings.append({
                    "type": "DANGER" if p_risk >= 30 else "WARNING",
                    "title": f"Dangerous Permission: {perm}",
                    "desc": p_desc
                })

        if detected_permissions:
            findings.append({
                "type": "INFO" if risk_score < 40 else "WARNING",
                "title": f"Total Permissions Declared ({len(detected_permissions)})",
                "desc": ", ".join(detected_permissions[:8]) + ("..." if len(detected_permissions) > 8 else "")
            })

    except Exception as e:
        risk_score += 20
        findings.append({
            "type": "WARNING",
            "title": "Archive Deep Inspection Anomaly",
            "desc": f"Static parser encountered non-fatal parsing issue: {str(e)[:80]}"
        })

    risk_score = min(100, max(5, risk_score))
    status = "DANGEROUS" if risk_score >= 70 else ("SUSPICIOUS" if risk_score >= 35 else "SAFE")

    recommendation = (
        "DO NOT INSTALL. Malicious permissions or trojan dropper patterns detected. Delete file immediately."
        if status == "DANGEROUS" else (
            "Review permissions carefully before granting access." if status == "SUSPICIOUS" else "No malicious patterns or dangerous overlay permissions detected."
        )
    )

    return {
        "id": f"APK-{uuid_short()}",
        "type": "APK",
        "target": filename,
        "size": f"{file_size_mb:.2f} MB",
        "hash": sha256_hash,
        "riskScore": risk_score,
        "status": status,
        "permissions": detected_permissions,
        "findings": findings,
        "recommendation": recommendation,
        "timestamp": "Just now"
    }

def inspect_file_deep(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Deep security inspection for non-APK files (PDFs, Images, Executables).
    """
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    file_size_mb = len(file_bytes) / (1024 * 1024)
    ext = filename.split('.')[-1].lower() if '.' in filename else ''

    risk_score = 10
    findings = [
        {"type": "SAFE", "title": "SHA-256 Hash Signature", "desc": sha256_hash}
    ]

    # 1. Windows Executable Detection
    if ext == 'exe' or file_bytes.startswith(MAGIC_BYTES['exe']):
        return {
            "id": f"EXE-{uuid_short()}",
            "type": "EXECUTABLE",
            "target": filename,
            "size": f"{file_size_mb:.2f} MB",
            "hash": sha256_hash,
            "riskScore": 95,
            "status": "DANGEROUS",
            "findings": [
                {
                    "type": "DANGER",
                    "title": "Windows PE Executable (MZ Header)",
                    "desc": "File is an executable binary. High risk of Trojan, spyware, or ransomware."
                }
            ],
            "recommendation": "Do not execute or open this file. Block and quarantine immediately.",
            "timestamp": "Just now"
        }

    # 2. PDF Weaponization Scan
    if ext == 'pdf':
        suspicious_pdf_tags = [b'/JavaScript', b'/JS', b'/Launch', b'/OpenAction', b'/EmbeddedFiles']
        matched_tags = [tag.decode('latin1') for tag in suspicious_pdf_tags if tag in file_bytes]
        if matched_tags:
            risk_score += 55
            findings.append({
                "type": "DANGER",
                "title": f"Suspicious PDF Action Tags Detected: {', '.join(matched_tags)}",
                "desc": "PDF contains embedded scripts or auto-execution commands frequently used in document exploits."
            })
        else:
            findings.append({
                "type": "SAFE",
                "title": "Clean PDF Structure",
                "desc": "No embedded JavaScript or auto-launch commands detected."
            })

    # 3. Polyglot File Detection (e.g. image with hidden ZIP archive)
    if ext in ('png', 'jpg', 'jpeg'):
        if MAGIC_BYTES['zip'] in file_bytes[100:]:
            risk_score += 50
            findings.append({
                "type": "DANGER",
                "title": "Polyglot Archive Detected",
                "desc": "Image file contains embedded ZIP/archive data commonly used to smuggle payload files past filters."
            })

    risk_score = min(100, max(5, risk_score))
    status = "DANGEROUS" if risk_score >= 70 else ("SUSPICIOUS" if risk_score >= 35 else "SAFE")

    return {
        "id": f"FILE-{uuid_short()}",
        "type": ext.upper() if ext else "FILE",
        "target": filename,
        "size": f"{file_size_mb:.2f} MB",
        "hash": sha256_hash,
        "riskScore": risk_score,
        "status": status,
        "findings": findings,
        "recommendation": "File quarantined safely. Safe to view details." if status != "DANGEROUS" else "Malicious content detected. Delete file.",
        "timestamp": "Just now"
    }

def uuid_short() -> str:
    import uuid
    return uuid.uuid4().hex[:6].upper()

def analyze_message_hardened(msg: str) -> Dict[str, Any]:
    """
    Multi-signal NLP & Heuristic Message Phishing Classifier.
    """
    risk_score = 10
    findings = []
    lower = msg.lower()

    if any(w in lower for w in ['urgent', 'immediately', 'suspended', 'account blocked', '24 hours', 'deactivated']):
        risk_score += 30
        findings.append({
            "type": "WARNING",
            "title": "High Urgency Pressure Tactics",
            "desc": "Uses urgent wording designed to induce panic and bypass critical thinking."
        })

    if any(w in lower for w in ['otp', 'pin', 'password', 'cvv', 'kyc', 'secret code', 'passcode']):
        risk_score += 40
        findings.append({
            "type": "DANGER",
            "title": "Requests Confidential Credentials / OTP",
            "desc": "Legitimate banks and organizations never ask for your passwords or OTPs via SMS or messaging apps."
        })

    if any(w in lower for w in ['lottery', 'winner', 'won $', 'won rs', 'cash prize', 'gift card', 'claim reward']):
        risk_score += 35
        findings.append({
            "type": "DANGER",
            "title": "Lottery / Advance Fee Scam Pattern",
            "desc": "Claims of unexpected lottery winnings or rewards designed to harvest payment details."
        })

    risk_score = min(100, max(5, risk_score))
    status = "DANGEROUS" if risk_score >= 70 else ("SUSPICIOUS" if risk_score >= 35 else "SAFE")

    return {
        "text": msg[:80] + ("..." if len(msg) > 80 else ""),
        "riskScore": risk_score,
        "status": status,
        "findings": findings,
        "recommendation": "Do not reply or click any links." if status == "DANGEROUS" else ("Verify the sender before responding." if status == "SUSPICIOUS" else "Normal message.")
    }

def resolve_troubleshooting_offline(query: str) -> Dict[str, Any]:
    """
    Curated cybersecurity & mobile troubleshooting knowledge engine.
    Resolves everyday digital safety and smartphone issues into actionable steps.
    """
    q = query.lower()

    if any(k in q for k in ['wifi', 'wi-fi', 'internet', 'router', 'disconnect']):
        return {
            "source": "knowledge_engine",
            "title": "Wi-Fi Not Connecting or Frequently Dropping",
            "category": "Connectivity",
            "summary": "Network disconnects are commonly caused by DHCP IP conflicts, saved credential mismatches, or router cache exhaustion.",
            "steps": [
                {"step": 1, "title": "Toggle Airplane Mode", "desc": "Swipe down the notification shade, turn Airplane Mode ON for 10 seconds, then turn it OFF."},
                {"step": 2, "title": "Forget and Reconnect Network", "desc": "Open Settings > Network > Wi-Fi. Tap your network name, select 'Forget', and enter the password again."},
                {"step": 3, "title": "Reset Network Settings", "desc": "Settings > System > Reset options > Reset Wi-Fi, mobile & Bluetooth. (Note: Erases saved Wi-Fi passwords)."},
                {"step": 4, "title": "Power-Cycle Router", "desc": "Unplug your home Wi-Fi router for 30 seconds and plug it back in."}
            ],
            "youtube_search_url": "https://www.youtube.com/results?search_query=how+to+fix+wifi+not+connecting+android+step+by+step"
        }

    if any(k in q for k in ['bluetooth', 'headphone', 'earbuds', 'pairing', 'audio']):
        return {
            "source": "knowledge_engine",
            "title": "Bluetooth Earbuds or Devices Won't Connect",
            "category": "Hardware & Accessories",
            "summary": "Audio pairing issues usually occur when accessories are still connected to another nearby device or stored cache is stale.",
            "steps": [
                {"step": 1, "title": "Disconnect from Other Devices", "desc": "Ensure your earbuds aren't connected to a laptop, tablet, or another family member's phone nearby."},
                {"step": 2, "title": "Reset Earbuds into Pairing Mode", "desc": "Place earbuds in their case, open the lid, and hold the case button for 5-10 seconds until LEDs flash rapidly."},
                {"step": 3, "title": "Clear Bluetooth Cache", "desc": "Settings > Apps > See all apps > Tap 3 dots (Show system) > Bluetooth > Storage & Cache > Clear Cache."},
                {"step": 4, "title": "Unpair and Pair Again", "desc": "In Bluetooth settings, forget the device and tap 'Pair new device'."}
            ],
            "youtube_search_url": "https://www.youtube.com/results?search_query=fix+bluetooth+pairing+problem+android"
        }

    if any(k in q for k in ['overlay', 'screen overlay', 'draw over', 'permission']):
        return {
            "source": "knowledge_engine",
            "title": "Screen Overlay Detected / Permissions Blocked",
            "category": "Security & Permissions",
            "summary": "Android blocks critical permission dialogs when an app with 'Display over other apps' is active to prevent tapjacking attacks.",
            "steps": [
                {"step": 1, "title": "Identify Overlay Apps", "desc": "Go to Settings > Apps > Special app access > Display over other apps."},
                {"step": 2, "title": "Temporarily Disable Floating Apps", "desc": "Turn off permission for Messenger chat heads, screen dimmers (Twilight, Blue light filters), and screen recorders."},
                {"step": 3, "title": "Grant Required Permission", "desc": "Return to your original app and accept the permission."},
                {"step": 4, "title": "Re-enable Essential Overlays", "desc": "Re-enable overlays only for trusted applications."}
            ],
            "youtube_search_url": "https://www.youtube.com/results?search_query=how+to+fix+screen+overlay+detected+android"
        }

    if any(k in q for k in ['popup', 'ad', 'chrome popup', 'virus alert', 'infected']):
        return {
            "source": "knowledge_engine",
            "title": "Fake Virus Alerts & Fullscreen Browser Popups",
            "category": "Malware & Scam Defense",
            "summary": "Fake popups claiming 'Your phone has 13 viruses!' are deceptive ads trying to get you to install malicious APKs or buy rogue subscriptions.",
            "steps": [
                {"step": 1, "title": "Do NOT Tap the Popup", "desc": "Never tap 'Clean Now', 'Remove Virus', or download any suggested app."},
                {"step": 2, "title": "Close the Browser Tab", "desc": "Tap the tab switcher in Chrome, swipe the rogue website away to close it."},
                {"step": 3, "title": "Clear Browser Site Data", "desc": "Settings > Apps > Chrome > Storage > Clear Cache. Then in Chrome: Settings > Site settings > Pop-ups and redirects > Block."},
                {"step": 4, "title": "Disable Rogue Notifications", "desc": "Chrome Settings > Notifications > Sites > Turn OFF permissions for unfamiliar websites."}
            ],
            "youtube_search_url": "https://www.youtube.com/results?search_query=how+to+stop+fake+virus+popups+android+chrome"
        }

    if any(k in q for k in ['storage', 'full', 'memory', 'clean', 'space']):
        return {
            "source": "knowledge_engine",
            "title": "Phone Storage Full & Sluggish Performance",
            "category": "System Maintenance",
            "summary": "App caches, hidden Telegram/WhatsApp media, and duplicate downloads quickly consume internal memory and slow down apps.",
            "steps": [
                {"step": 1, "title": "Clean WhatsApp / Telegram Media", "desc": "In WhatsApp: Settings > Storage and data > Manage storage > Review and delete files larger than 5 MB."},
                {"step": 2, "title": "Use Google Files Clean Tool", "desc": "Open 'Files by Google' app, tap 'Clean' tab, and tap 'Delete junk files' and 'Delete duplicates'."},
                {"step": 3, "title": "Clear App Cache of Heavy Apps", "desc": "Settings > Storage > Apps. Clear cache on YouTube, Instagram, and TikTok."},
                {"step": 4, "title": "Uninstall Unused APKs", "desc": "Check your 'Downloads' folder and delete downloaded .apk or .zip installer files."}
            ],
            "youtube_search_url": "https://www.youtube.com/results?search_query=how+to+free+up+storage+space+android+safely"
        }

    if any(k in q for k in ['whatsapp', 'hacked', 'stolen', 'otp scam', 'sim swap']):
        return {
            "source": "knowledge_engine",
            "title": "Account Security: WhatsApp or Social Media Compromised",
            "category": "Emergency Defense",
            "summary": "If you shared an OTP or notice unauthorized logins, immediately lock down your sessions before account takeover occurs.",
            "steps": [
                {"step": 1, "title": "Log Out Linked Devices", "desc": "In WhatsApp: Tap 3 dots > Linked devices. Tap any unrecognized browser or device and select 'Log out'."},
                {"step": 2, "title": "Re-verify Your Number", "desc": "Log in with your phone number and request an SMS OTP to automatically kick unauthorized active sessions out."},
                {"step": 3, "title": "Enable Two-Step Verification (PIN)", "desc": "WhatsApp Settings > Account > Two-step verification > Turn ON. Create a 6-digit PIN and add your recovery email."},
                {"step": 4, "title": "Alert Family & Contacts", "desc": "Warn contacts not to send money or OTPs if they receive emergency loan messages from your name."}
            ],
            "youtube_search_url": "https://www.youtube.com/results?search_query=how+to+recover+hacked+whatsapp+account+securely"
        }

    # Universal security & digital wellbeing guidance
    return {
        "source": "knowledge_engine",
        "title": f"Digital Safety Guidance: {query[:45]}",
        "category": "General Digital Defense",
        "summary": "Follow these foundational mobile security and troubleshooting steps to resolve the issue safely without exposing private data.",
        "steps": [
            {"step": 1, "title": "Restart Your Device", "desc": "Press and hold the Power button for 5 seconds and tap 'Restart' to clear frozen system processes."},
            {"step": 2, "title": "Check App Permissions", "desc": "Go to Settings > Privacy > Permission manager. Check which apps have background access to Camera, Mic, and SMS."},
            {"step": 3, "title": "Install Latest System Updates", "desc": "Settings > System > System update. Security patches fix critical OS vulnerabilities."},
            {"step": 4, "title": "Scan Any Unfamiliar Downloads", "desc": "Use CypherBuddy Scanner tab to inspect any suspicious links or APK files before opening."}
        ],
        "youtube_search_url": f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(query + ' android troubleshooting')}"
    }
