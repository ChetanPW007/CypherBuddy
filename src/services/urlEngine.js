// CypherBuddy on-device URL engine.
//
// A line-for-line port of backend/security_engine.py (analyze_url_hardened) driven by the SAME data file
// (shared/url_intel.json), so the app and the server reach the same verdict. It runs in a few milliseconds,
// which is what lets the link gateway open safe links instantly and block scams without waiting for the network.
//
// Pure JavaScript with no imports so it can also be exercised from Node (scripts/check-url-engine.mjs).

// ---------- RFC 3492 punycode decoding (for xn-- labels) ----------
function punycodeDecode(input) {
  const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
  let n = 128, i = 0, bias = 72;
  const output = [];
  let basic = input.lastIndexOf('-');
  if (basic < 0) basic = 0;
  for (let j = 0; j < basic; j++) output.push(input.charCodeAt(j));
  const adapt = (delta, numPoints, first) => {
    let k = 0;
    delta = first ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    for (; delta > ((base - tMin) * tMax) >> 1; k += base) delta = Math.floor(delta / (base - tMin));
    return Math.floor(k + ((base - tMin + 1) * delta) / (delta + skew));
  };
  for (let idx = basic > 0 ? basic + 1 : 0; idx < input.length;) {
    const oldi = i;
    for (let w = 1, k = base; ; k += base) {
      if (idx >= input.length) throw new Error('bad punycode');
      const c = input.charCodeAt(idx++);
      const digit = c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : base;
      if (digit >= base) throw new Error('bad punycode');
      i += digit * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < t) break;
      w *= base - t;
    }
    const out = output.length + 1;
    bias = adapt(i - oldi, out, oldi === 0);
    n += Math.floor(i / out);
    i %= out;
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
}

function decodeIdna(host) {
  if (!host.includes('xn--')) return host;
  try {
    return host.split('.').map((l) => (l.startsWith('xn--') ? punycodeDecode(l.slice(4)) : l)).join('.');
  } catch {
    return host;
  }
}

// ---------- IP helpers ----------
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function parseIPv4(host) {
  const m = IPV4_RE.exec(host);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  return parts.every((p) => p <= 255) ? parts : null;
}

function ipv4Internal([a, b]) {
  return (
    a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224
  );
}

function ipv6Internal(host) {
  const h = host.toLowerCase();
  if (h === '::1' || h === '::') return true;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(h);
  if (mapped) {
    const v4 = parseIPv4(mapped[1]);
    return v4 ? ipv4Internal(v4) : false;
  }
  const [h0, h1] = h.split(':');
  const first = parseInt(h0 || '0', 16);
  const second = parseInt(h1 || '0', 16);
  if (first === 0x2001 && second === 0x0db8) return true; // documentation range (Python treats it as private too)
  return (first >= 0xfc00 && first <= 0xfdff) || (first >= 0xfe80 && first <= 0xfebf) || (first >= 0xff00);
}

// ---------- URL parsing (manual, so Unicode hosts are preserved; new URL() would punycode them) ----------
function parseUrl(raw) {
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(?:\?([^#]*))?/.exec(raw);
  if (!m) return { scheme: '', host: '', username: '', path: '', query: '' };
  const scheme = m[1].toLowerCase();
  const netloc = m[2];
  const at = netloc.lastIndexOf('@');
  const userinfo = at >= 0 ? netloc.slice(0, at) : '';
  let hostport = at >= 0 ? netloc.slice(at + 1) : netloc;
  let host;
  if (hostport.startsWith('[')) {
    const end = hostport.indexOf(']');
    host = end > 0 ? hostport.slice(1, end) : hostport;
  } else {
    const colon = hostport.lastIndexOf(':');
    host = colon >= 0 ? hostport.slice(0, colon) : hostport;
  }
  return {
    scheme,
    host: host.toLowerCase(),
    username: userinfo.split(':')[0],
    path: m[3] || '',
    query: m[4] || '',
  };
}

const PSEUDO_SCHEME_RE = /^(javascript|data|vbscript|file|intent|blob|mailto|tel|sms|market):/i;

export function createUrlEngine(INTEL) {
  const DANGEROUS = INTEL.thresholds.dangerous;
  const SUSPICIOUS = INTEL.thresholds.suspicious;
  const MULTI = new Set(INTEL.multiPartSuffixes);
  const SHARED = new Set(INTEL.sharedHosting);
  const USER_CONTENT = INTEL.userContentHosts;
  const SHORTENERS = new Set(INTEL.shorteners);
  const BRANDS = INTEL.brands;
  const SUFFIX_WORDS = new Set(INTEL.brandSuffixWords);
  const PREFIX_WORDS = new Set(INTEL.brandPrefixWords);
  const OFFICIAL = Object.fromEntries(Object.entries(INTEL.officialDomains).map(([b, d]) => [b, new Set(d)]));
  const OFFICIAL_ALL = new Set(Object.values(INTEL.officialDomains).flat());
  const KNOWN_GOOD = new Set([...INTEL.knownGood, ...OFFICIAL_ALL]);
  const TRUSTED_SUFFIXES = INTEL.trustedSuffixes;
  const HIGH_TLDS = new Set(INTEL.highRiskTlds);
  const MOD_TLDS = new Set(INTEL.moderateRiskTlds);
  const SCAM_TOKENS = new Set(INTEL.scamTokens);
  const PATH_KEYWORDS = INTEL.pathKeywords;
  const TYPO_PATTERNS = INTEL.typosquatPatterns;
  const CONFUSABLES = INTEL.confusables;

  const statusFor = (score) => (score >= DANGEROUS ? 'DANGEROUS' : score >= SUSPICIOUS ? 'SUSPICIOUS' : 'SAFE');

  function registrableDomain(host) {
    const labels = host.split('.').filter(Boolean);
    if (labels.length <= 2) return labels.join('.');
    const last2 = labels.slice(-2).join('.');
    if (MULTI.has(last2) || SHARED.has(last2)) return labels.slice(-3).join('.');
    return last2;
  }

  const isUserContentHost = (host) => USER_CONTENT.some((h) => host === h || host.endsWith('.' + h));

  function skeleton(host) {
    let s = decodeIdna(host).normalize('NFKC').toLowerCase();
    s = s.normalize('NFKD').replace(/\p{M}/gu, '');
    return Array.from(s).map((c) => CONFUSABLES[c] ?? c).join('');
  }

  function leetVariants(host) {
    if (!/[0-9@$]|rn|vv/.test(host)) return [];
    const base = host.replaceAll('@', 'a').replaceAll('$', 's');
    const out = [];
    for (const one of ['l', 'i']) {
      let v = base.replaceAll('0', 'o').replaceAll('1', one).replaceAll('3', 'e').replaceAll('4', 'a').replaceAll('5', 's').replaceAll('7', 't');
      v = v.replaceAll('rn', 'm').replaceAll('vv', 'w');
      if (v !== host && !out.includes(v)) out.push(v);
    }
    return out;
  }

  function brandHits(text) {
    text = text.toLowerCase();
    const tokens = text.split(/[.\-_/]+/).filter(Boolean);
    const hits = [];
    for (const brand of BRANDS) {
      let hit = false;
      if (brand.length >= 6 && text.includes(brand)) {
        hit = true;
      } else {
        for (const tok of tokens) {
          if (
            tok === brand ||
            (tok.startsWith(brand) && SUFFIX_WORDS.has(tok.slice(brand.length))) ||
            (tok.endsWith(brand) && PREFIX_WORDS.has(tok.slice(0, tok.length - brand.length)))
          ) {
            hit = true;
            break;
          }
        }
      }
      if (hit) hits.push(brand);
    }
    return hits;
  }

  const isOfficialFor = (brand, reg) => (OFFICIAL[brand] && OFFICIAL[brand].has(reg)) || OFFICIAL_ALL.has(reg);

  const isObfuscatedNumericHost = (host) =>
    /^(0x[0-9a-f]+|\d{8,10})$/.test(host) || /^(0x[0-9a-f]+\.){1,3}0x[0-9a-f]+$/.test(host);

  const add = (findings, type, title, desc) => findings.push({ type, title, desc });

  function ssrfSafe(clean) {
    const p = parseUrl(clean);
    if (p.scheme !== 'http' && p.scheme !== 'https') return [false, 'Blocked invalid URI scheme. Only http/https supported.'];
    if (!p.host) return [false, 'Invalid or missing hostname in URL.'];
    if (['localhost', 'localhost.localdomain', 'ip6-localhost'].includes(p.host)) {
      return [false, 'Access to localhost or internal network interfaces is blocked.'];
    }
    const v4 = parseIPv4(p.host);
    if (v4 && ipv4Internal(v4)) return [false, `Link points to a private/internal network address (${p.host}).`];
    if (p.host.includes(':') && ipv6Internal(p.host)) return [false, `Link points to a private/internal network address (${p.host}).`];
    return [true, 'URL passed SSRF safety check.'];
  }

  function scoreUrl(clean) {
    const p = parseUrl(clean);
    const host = p.host.replace(/\.+$/, '');
    const pathQ = (p.path + ' ' + p.query).toLowerCase();
    const isHttps = p.scheme === 'https';
    const findings = [];
    const reg = registrableDomain(host);
    const meta = { host, registrableDomain: reg };
    let score = 10;

    // 1. Transport
    if (isHttps) add(findings, 'SAFE', 'HTTPS Encryption', 'Connection to this site is encrypted (SSL/TLS).');
    else {
      score += 15;
      add(findings, 'WARNING', 'Unencrypted HTTP Protocol', 'Data sent to this site is unencrypted and open to interception.');
    }

    // 2. Deceptive user-info trick
    if (p.username && p.username.includes('.')) {
      score += 35;
      add(findings, 'DANGER', "Deceptive '@' in Link", `Text before the '@' (${p.username}) looks like a website but the real destination is ${host}.`);
    }

    // 3. Raw / obfuscated IP hosts
    const isIp = !!parseIPv4(host) || host.includes(':');
    if (isIp) {
      score += 45;
      add(findings, 'DANGER', 'Direct IP Address Hostname', `Site uses a raw IP address (${host}) instead of a registered domain. Common in evasive phishing and malware servers.`);
    } else if (isObfuscatedNumericHost(host)) {
      score += 45;
      add(findings, 'DANGER', 'Obfuscated IP Address', 'The hostname is a disguised numeric IP address, a classic filter-evasion trick.');
    }

    // 4. Look-alike (homograph / punycode) domains
    const skel = skeleton(host);
    const nonAscii = /[^\x00-\x7f]/.test(host);
    const isIdn = nonAscii || host.includes('xn--');
    if (isIdn) {
      const skelReg = registrableDomain(skel);
      if (skel !== host && KNOWN_GOOD.has(skelReg)) {
        score += 65;
        add(findings, 'DANGER', 'IDN Homograph Impersonation', `This domain uses look-alike characters to imitate ${skelReg}.`);
      } else {
        score += 35;
        add(findings, 'WARNING', 'Internationalised Domain (xn--)', 'Domain uses non-Latin characters that can be used to visually spoof familiar sites.');
      }
    }

    // 5. Recognised-good domains: stop early
    const userContent = isUserContentHost(host);
    const trustedSuffix = TRUSTED_SUFFIXES.some((s) => host.endsWith(s));
    if (!isIp && !isIdn && !userContent && (KNOWN_GOOD.has(reg) || trustedSuffix)) {
      const label = trustedSuffix && !KNOWN_GOOD.has(reg) ? 'Official government / education / banking domain' : 'Recognised domain';
      add(findings, 'SAFE', label, `${reg} is a well-known, legitimate website.`);
      meta.knownGood = true;
      return [Math.max(5, 5 + (isHttps ? 0 : 15)), findings, meta];
    }

    // 6. Trusted platform hosting user-made pages
    if (userContent) {
      score += 25;
      add(findings, 'WARNING', 'User-Made Page on a Trusted Platform', `${host} is a real service, but anyone can publish a page here. The platform vouches for the domain, not for this page.`);
      const hits = brandHits(p.path + ' ' + p.query);
      if (hits.length) {
        score += 45;
        add(findings, 'DANGER', `Page Imitates ${hits[0].toUpperCase()}`, `This page name references ${hits[0]} while hosted on ${host}, a common phishing trick.`);
      }
    } else if (SHARED.has(reg) || [...SHARED].some((h) => host.endsWith('.' + h))) {
      // 7. Free / shared hosting
      score += 10;
      add(findings, 'WARNING', 'Free Hosting Subdomain', 'Hosted on a free shared platform where anyone can create a site instantly.');
    }

    // 8. TLD reputation
    const tld = host.includes('.') ? host.slice(host.lastIndexOf('.') + 1) : '';
    if (HIGH_TLDS.has(tld)) {
      score += 30;
      add(findings, 'DANGER', `High Risk TLD (.${tld})`, 'Top-level domain extension frequently used in malware/phishing campaigns.');
    } else if (MOD_TLDS.has(tld)) {
      score += 15;
      add(findings, 'WARNING', `Low-Reputation TLD (.${tld})`, 'Extension is cheap and often abused for short-lived scam sites.');
    }

    // 9. Brand impersonation
    let impersonated = null;
    if (!userContent && !isIp) {
      const rawHits = brandHits(host).filter((b) => !isOfficialFor(b, reg));
      const typo = TYPO_PATTERNS.find(([pat]) => host.includes(pat));
      let leetHit = null;
      if (!rawHits.length) {
        for (const variant of leetVariants(host)) {
          const vh = brandHits(variant).filter((b) => !isOfficialFor(b, reg));
          if (vh.length) { leetHit = vh[0]; break; }
        }
      }
      if (typo || leetHit) {
        score += 55;
        const name = typo ? typo[1] : leetHit.toUpperCase();
        impersonated = name;
        add(findings, 'DANGER', `Typosquatting / ${name} Impersonation Detected`, `Domain imitates ${name} using look-alike spelling designed to deceive.`);
      } else if (rawHits.length) {
        score += 45;
        impersonated = rawHits[0].toUpperCase();
        add(findings, 'DANGER', `Suspected ${impersonated} Brand Impersonation`, `Hostname contains '${rawHits[0]}' but is not hosted on an official ${rawHits[0]} domain.`);
      }

      for (const d of OFFICIAL_ALL) {
        if ((host + '.').includes(d + '.') && host !== d && !host.endsWith('.' + d)) {
          score += 30;
          add(findings, 'DANGER', 'Official Domain Used as Decoy', `'${d}' appears inside the address, but the real site is ${reg}.`);
          break;
        }
      }
    }

    // 10. Bait words in the hostname
    if (!isIp) {
      const hostTokens = new Set(host.split(/[.\-_]+/).filter(Boolean));
      const bait = [...hostTokens].filter((t) => SCAM_TOKENS.has(t)).sort();
      if (bait.length >= 3) score += 35;
      else if (bait.length === 2) score += 25;
      else if (bait.length === 1) score += 10;
      if (bait.length) add(findings, 'WARNING', 'Scam Bait Words in Domain', `Domain contains words typical of scam portals: ${bait.slice(0, 4).join(', ')}.`);
      if (impersonated && bait.length) {
        score += 15;
        add(findings, 'DANGER', 'Brand Name Combined With Bait Words', `${impersonated} plus '${bait[0]}' is the classic pattern of a fake support/reward/KYC page.`);
      }
    }

    // 11. Subdomain nesting
    const extra = host.split('.').filter(Boolean).length - reg.split('.').filter(Boolean).length;
    if (extra > 3) {
      score += 20;
      add(findings, 'WARNING', 'Deep Subdomain Nesting', 'Multiple nested subdomains hide the true hosting domain.');
    }

    // 12. Credential-harvesting path keywords
    const matched = PATH_KEYWORDS.filter((kw) => pathQ.includes(kw));
    if (matched.length) {
      score += Math.min(30, matched.length * 10);
      add(findings, 'WARNING', `Suspicious Path Keywords: ${matched.slice(0, 3).join(', ')}`, 'URL path contains terms commonly used in credential harvesting and OTP phishing pages.');
    }

    return [score, findings, meta];
  }

  const RECOMMENDATION = {
    DANGEROUS: 'DO NOT OPEN. Do not enter passwords, OTPs or card details. Block the sender and report this link.',
    SUSPICIOUS: 'Proceed with caution. Verify the sender through another channel before opening.',
    SAFE: 'No threat signals found. Safe to browse.',
  };
  const TITLE = {
    DANGEROUS: 'High Risk Phishing / Malicious Site Detected',
    SUSPICIOUS: 'Proceed with Caution',
    SAFE: 'This link appears safe',
  };

  /**
   * Scores a URL entirely on-device.
   * `needsExpansion` is true for link shorteners: their destination can only be learned from the backend.
   */
  function analyzeUrlLocal(url) {
    const original = (url || '').trim();
    let clean = original;
    let blocked = null;
    if (PSEUDO_SCHEME_RE.test(clean)) blocked = 'Blocked invalid URI scheme. Only http/https supported.';
    else if (!clean.includes('://')) clean = 'https://' + clean;

    const [ok, ssrfMsg] = blocked ? [false, blocked] : ssrfSafe(clean);
    const id = 'SCAN-' + Math.floor(100000 + Math.random() * 900000);
    if (!ok) {
      return {
        id, type: 'URL', target: original, riskScore: 100, status: 'DANGEROUS', title: TITLE.DANGEROUS,
        timestamp: 'Just now',
        findings: [{ type: 'DANGER', title: 'Unsafe Link Target Blocked', desc: ssrfMsg }],
        recommendation: 'Blocked by CypherBuddy Security Gateway.',
        needsExpansion: false, source: 'on-device',
      };
    }

    const host = parseUrl(clean).host.replace(/\.+$/, '');
    let score;
    let findings;
    let meta;
    let needsExpansion = false;

    if (SHORTENERS.has(host)) {
      needsExpansion = true;
      findings = [];
      meta = { host };
      score = 10 + 25;
      add(findings, 'WARNING', 'Shortened Link Hides Its Destination', `${host} is a link shortener and CypherBuddy could not verify where this link leads.`);
      const pathLower = parseUrl(clean).path.toLowerCase();
      const matched = PATH_KEYWORDS.filter((kw) => pathLower.includes(kw));
      if (matched.length) {
        score += Math.min(30, matched.length * 10);
        add(findings, 'WARNING', `Suspicious Path Keywords: ${matched.slice(0, 3).join(', ')}`, 'The short link slug contains credential-harvesting terms.');
      }
    } else {
      [score, findings, meta] = scoreUrl(clean);
    }

    score = Math.min(100, Math.max(5, score));
    const status = statusFor(score);
    return {
      id, type: 'URL', target: clean, domain: meta.host || host, registrableDomain: meta.registrableDomain || '',
      riskScore: score, status, title: TITLE[status], timestamp: 'Just now', findings,
      recommendation: RECOMMENDATION[status], needsExpansion, source: 'on-device',
    };
  }

  return { analyzeUrlLocal, statusFor, registrableDomain, brandHits, skeleton };
}
