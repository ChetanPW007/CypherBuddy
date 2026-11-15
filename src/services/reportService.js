// "Report to Cyber Crime" helper.
//
// India's National Cyber Crime Reporting Portal (cybercrime.gov.in) needs the citizen's own login/OTP, and there is
// no public API for third-party apps to file on someone's behalf - so CypherBuddy prepares everything the complaint
// needs (a ready-to-paste report, a tracking reference) and hands the user over to the official portal / helpline 1930.
import { safeApiCall } from '../config/apiConfig';
import { openWebsite } from './nativeBridge';

export const PORTAL_URL = 'https://cybercrime.gov.in';
export const HELPLINE = '1930';

const TYPE_LABEL = {
  URL: 'suspicious link',
  QR_CODE: 'suspicious QR code link',
  MESSAGE: 'suspicious message',
  SCREENSHOT: 'suspicious screenshot',
  APK: 'suspicious Android app (APK)',
};

/** Plain-text complaint body the user can paste into the portal's "incident details" box. */
export function buildReportText(result, { referenceId } = {}) {
  const kind = TYPE_LABEL[result.type] || 'suspicious item';
  const reasons = (result.findings || [])
    .filter((f) => f.type === 'DANGER' || f.type === 'WARNING')
    .slice(0, 6)
    .map((f) => `  - ${f.title}`);
  const lines = [
    `I am reporting a ${kind} that I received${result.url ? ' (shared in a chat)' : ''}. It was flagged by the CypherBuddy security app.`,
    '',
    `${result.type === 'APK' ? 'File' : 'Link / content'}: ${result.finalUrl || result.target || result.url}`,
  ];
  if (result.finalUrl && result.target && result.finalUrl !== result.target) {
    lines.push(`Original (short) link: ${result.target}`);
  }
  if (result.hash) lines.push(`SHA-256: ${result.hash}`);
  lines.push(
    `Risk assessment: ${result.riskScore}/100 (${result.status})`,
    `Scanned on: ${new Date().toLocaleString()}`,
    'Why it was flagged:',
    ...(reasons.length ? reasons : ['  - (see risk score)']),
    '',
    'I did NOT open this link / install this file after the warning.',
    '[Edit if different: if you already entered details or paid money, say so here and call 1930 immediately.]',
  );
  if (referenceId) lines.push('', `CypherBuddy reference: ${referenceId}`);
  return lines.join('\n');
}

/** Best-effort: logs the report server-side and returns a reference ID. Never blocks the user if offline. */
export async function registerReport(result) {
  try {
    const res = await safeApiCall('/api/report/threat', {
      method: 'POST',
      timeoutMs: 6000,
      body: JSON.stringify({
        url: String(result.finalUrl || result.target || result.url || '').slice(0, 2048),
        risk_score: Math.round(result.riskScore ?? 0),
        status: result.status || 'DANGEROUS',
        reasons: (result.findings || [])
          .filter((f) => f.type === 'DANGER' || f.type === 'WARNING')
          .map((f) => f.title)
          .slice(0, 20),
        source: 'whatsapp-gateway',
      }),
    });
    if (res.ok && res.data && res.data.referenceId) return res.data.referenceId;
  } catch {
    /* offline - report text is still fully usable */
  }
  return null;
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function shareText(text) {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'CypherBuddy threat report', text });
      return true;
    } catch {
      return false;
    }
  }
  return copyText(text);
}

export const openPortal = () => openWebsite(PORTAL_URL);

/** Opens the phone dialer pre-filled with the national cyber-fraud helpline (the user presses call). */
export function callHelpline() {
  window.location.href = `tel:${HELPLINE}`;
}
