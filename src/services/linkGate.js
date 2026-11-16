// Link gateway: decides, as fast as possible, whether a tapped link is safe.
//
//   1. On-device engine (a few ms) gives the verdict for almost every link, with no network round-trip.
//   2. Link shorteners (bit.ly, ...) can only be judged by their destination, so those - and only those -
//      go to the backend, which expands the redirect chain safely. If the server is slow/offline we fall back
//      to the on-device verdict ("destination hidden" = warn), never to "safe".
//   3. Results are cached so re-tapping the same link is instant.
import { urlEngine } from './urlHeuristics';
import { API_BASE_URL, safeApiCall } from '../config/apiConfig';

const URL_RE = /https?:\/\/[^\s<>"']+/i;
const TRAILING_PUNCT = /[.,;:!?)\]}'"]+$/;
const OWN_HOSTS = ['cypherbuddy-opal.vercel.app', 'cypherbuddy.vercel.app'];

/** Pulls the first http(s) URL out of arbitrary text (a shared WhatsApp message, an intent URI, ...). */
export function extractUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const m = URL_RE.exec(raw);
  if (!m) return null;
  const url = m[0].replace(TRAILING_PUNCT, '');
  return url.length > 8 ? url : null;
}

export function isOwnHost(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return OWN_HOSTS.includes(host);
  } catch {
    return false;
  }
}

// ---- tiny TTL cache ----
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map();

function cacheGet(url) {
  const hit = cache.get(url);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(url);
    return null;
  }
  return hit.result;
}

function cacheSet(url, result) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(url, { at: Date.now(), result });
}

// ---- backend warm-up (Render free tier sleeps; waking it early keeps short-link checks fast) ----
let lastWarm = 0;
export function warmBackend() {
  const now = Date.now();
  if (now - lastWarm < 4 * 60 * 1000) return;
  lastWarm = now;
  fetch(`${API_BASE_URL}/health`, { method: 'GET', cache: 'no-store' }).catch(() => {});
}

/** Adds the gateway's decision fields on top of an engine result. */
function withVerdict(analysis, url) {
  const status = analysis.status;
  const level = status === 'DANGEROUS' ? 'dangerous' : status === 'SUSPICIOUS' ? 'suspicious' : 'low';
  const action = level === 'dangerous' ? 'block' : level === 'suspicious' ? 'warn' : 'allow';
  return {
    ...analysis,
    url,
    risk_score: analysis.riskScore,
    risk_level: level,
    recommended_action: action,
    reasons: (analysis.findings || [])
      .filter((f) => f.type === 'DANGER' || f.type === 'WARNING')
      .map((f) => `${f.title}: ${f.desc}`),
    scannedAt: new Date().toISOString(),
    timestamp: new Date().toLocaleString(),
  };
}

/**
 * Scans a link and returns a result usable by both the gateway overlay and the full report screen
 * (it carries riskScore/status/findings/title/recommendation plus risk_level/recommended_action/reasons).
 */
export async function scanLink(url) {
  const cached = cacheGet(url);
  if (cached) return cached;

  const local = urlEngine.analyzeUrlLocal(url);
  let analysis = local;

  if (local.needsExpansion) {
    const res = await safeApiCall('/api/security/analyze-url', {
      method: 'POST',
      body: JSON.stringify({ url }),
      timeoutMs: 9000,
    });
    if (res.ok && res.data && res.data.analysis_details) {
      analysis = { ...res.data.analysis_details, source: 'backend' };
    }
  }

  const result = withVerdict(analysis, url);
  // Only cache definitive answers (not "server was asleep" fallbacks for short links).
  if (!local.needsExpansion || analysis.source === 'backend') cacheSet(url, result);
  return result;
}
