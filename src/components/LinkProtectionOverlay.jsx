import React, { useState, useEffect, useRef } from 'react';
import GlassCard from './GlassCard';
import ReportThreatSheet from './ReportThreatSheet';
import { ShieldAlert, AlertTriangle, RefreshCw, FileText, Flag, Copy } from 'lucide-react';
import { scanLink, isOwnHost, warmBackend } from '../services/linkGate';
import { openLinkExternally, minimizeApp } from '../services/nativeBridge';
import { copyText } from '../services/reportService';
import { urlEngine } from '../services/urlHeuristics';

// A tiny delay before showing the scanning UI prevents a flash for instant on-device verdicts.
const SCAN_UI_DELAY_MS = 120;

export default function LinkProtectionOverlay({ targetUrl, onClose, onViewReport, onResult }) {
  const [phase, setPhase] = useState('scanning'); // scanning | verdict | openFailed
  const [showScanUI, setShowScanUI] = useState(false);
  const [result, setResult] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parent callbacks live in refs so a re-render of <App/> (new inline function identity) can never restart the scan.
  const onCloseRef = useRef(onClose);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onCloseRef.current = onClose;
    onResultRef.current = onResult;
  });

  useEffect(() => {
    if (!targetUrl) return undefined;
    let cancelled = false;
    setPhase('scanning');
    setResult(null);
    setShowReport(false);
    setShowScanUI(false);
    // Show scanning UI after a tiny delay — fast on-device verdicts close before this fires
    const scanUITimer = setTimeout(() => !cancelled && setShowScanUI(true), SCAN_UI_DELAY_MS);
    warmBackend();

    (async () => {
      // Our own links are handled by the app itself.
      if (isOwnHost(targetUrl)) {
        onCloseRef.current();
        return;
      }

      let scan;
      try {
        scan = await scanLink(targetUrl);
      } catch (e) {
        console.warn('Link scan failed, using on-device verdict:', e);
        const local = urlEngine.analyzeUrlLocal(targetUrl);
        scan = {
          ...local,
          url: targetUrl,
          risk_score: local.riskScore,
          risk_level: local.status === 'DANGEROUS' ? 'dangerous' : local.status === 'SUSPICIOUS' ? 'suspicious' : 'low',
          recommended_action: local.status === 'DANGEROUS' ? 'block' : local.status === 'SUSPICIOUS' ? 'warn' : 'allow',
          reasons: local.findings.filter((f) => f.type !== 'SAFE').map((f) => `${f.title}: ${f.desc}`),
        };
      }
      if (cancelled) return;
      clearTimeout(scanUITimer);

      // Safe -> straight to Chrome. The user never sees CypherBuddy.
      if (scan.recommended_action === 'allow') {
        const opened = await openLinkExternally(scan.finalUrl || targetUrl);
        if (cancelled) return;
        if (opened) {
          onCloseRef.current();
        } else {
          setResult(scan);
          setPhase('openFailed');
        }
        return;
      }

      // Suspicious / dangerous -> show the report, and record it once.
      setResult(scan);
      setPhase('verdict');
      if (onResultRef.current) onResultRef.current(scan);
    })();

    return () => {
      cancelled = true;
      clearTimeout(scanUITimer);
    };
  }, [targetUrl]);

  if (!targetUrl) return null;

  const dismiss = () => {
    onCloseRef.current();
    minimizeApp(); // return to the chat the link came from
  };

  const openAnyway = async () => {
    const opened = await openLinkExternally(result.finalUrl || targetUrl);
    if (opened) onCloseRef.current();
    else setPhase('openFailed');
  };

  const copyLink = async () => {
    const ok = await copyText(targetUrl);
    setCopied(ok);
    setTimeout(() => setCopied(false), 2000);
  };

  const dangerous = result?.risk_level === 'dangerous';
  const accent = dangerous ? '#f43f5e' : '#f59e0b';
  const accentSoft = dangerous ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)';
  const accentLine = dangerous ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)';
  const scanning = phase === 'scanning';

  const isWhatsApp = /^(https?:\/\/)?(www\.)?(wa\.me|chat\.whatsapp\.com|api\.whatsapp\.com|whatsapp\.com)\b/i.test(targetUrl);
  const isVideo = /^(https?:\/\/)?(www\.)?(youtu\.be|youtube\.com|m\.youtube\.com|vimeo\.com)\b/i.test(targetUrl) || /\.(mp4|webm|mkv|mov)(\?.*)?$/i.test(targetUrl);

  const scanTitle = isWhatsApp
    ? '💬 Checking WhatsApp link safety...'
    : isVideo
    ? '🎥 Checking video link safety...'
    : '🛡️ Checking link safety...';

  const scanSubtitle = isWhatsApp
    ? 'Verifying contact / group invite security'
    : isVideo
    ? 'Verifying video stream destination'
    : 'Powered by CypherBuddy AI';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        // Always solid background — prevents white screen on cold start
        background: 'rgba(3, 10, 26, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: scanning ? 'center' : 'flex-start',
        padding: '24px 16px',
        overflowY: 'auto',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      {/* Scanning phase: centered loading card */}
      {scanning && showScanUI && (
        <div
          style={{
            width: '90%',
            maxWidth: '380px',
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(56, 189, 248, 0.15)',
            borderRadius: '20px',
            padding: '28px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            animation: 'fadeIn 0.2s ease',
            textAlign: 'center',
          }}
        >
          {/* Animated shield icon */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '2px solid rgba(56, 189, 248, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RefreshCw size={28} color="#38bdf8" className="spin" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
              {scanTitle}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{scanSubtitle}</div>
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            padding: '8px 12px',
            width: '100%',
            fontSize: '0.72rem',
            color: '#94a3b8',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            lineHeight: 1.4,
          }}>
            {targetUrl}
          </div>
        </div>
      )}

      {/* Suspicious / dangerous verdict */}
      {phase === 'verdict' && result && (
        <GlassCard
          style={{
            width: '100%',
            maxWidth: '440px',
            padding: '22px 18px',
            border: `1px solid ${accent}b3`,
            boxShadow: `0 16px 50px ${accent}66`,
            animation: 'slideInRight 0.3s ease',
            marginTop: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {dangerous ? <ShieldAlert size={34} color={accent} /> : <AlertTriangle size={34} color={accent} />}
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: accent, margin: 0 }}>
                {dangerous ? 'DANGEROUS LINK BLOCKED' : 'SUSPICIOUS LINK'}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Threat risk score: <strong>{result.risk_score}/100</strong>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#f8fafc', background: 'rgba(0,0,0,0.35)', padding: '10px 12px', borderRadius: '10px', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: '6px' }}>
            {targetUrl}
          </div>
          {result.finalUrl && result.finalUrl !== targetUrl && (
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '10px', wordBreak: 'break-all' }}>
              Short link leads to: <span style={{ fontFamily: 'monospace', color: '#f1f5f9' }}>{result.finalUrl}</span>
            </div>
          )}

          {result.reasons && result.reasons.length > 0 && (
            <div style={{ padding: '12px', borderRadius: '12px', background: accentSoft, border: `1px solid ${accentLine}`, margin: '10px 0 16px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: accent, marginBottom: '4px' }}>Why this was flagged:</div>
              {result.reasons.slice(0, 5).map((r, i) => (
                <div key={i} style={{ fontSize: '0.76rem', color: '#f1f5f9', marginTop: '4px', lineHeight: 1.4 }}>
                  &bull; {r}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={dismiss}
              className="btn-primary"
              style={{ background: dangerous ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'var(--suspicious-primary)', padding: '14px', fontSize: '0.92rem' }}
            >
              Don&apos;t open - back to chat
            </button>

            <button
              onClick={() => setShowReport(true)}
              className="btn-secondary"
              style={{ width: '100%', padding: '12px', fontSize: '0.88rem', borderColor: 'rgba(244, 63, 94, 0.5)', color: '#fb7185', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Flag size={16} /> Report this link to Cyber Crime
            </button>

            {onViewReport && (
              <button
                onClick={() => onViewReport(result)}
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', fontSize: '0.85rem', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <FileText size={16} /> View full security report
              </button>
            )}

            {!dangerous && (
              <button
                onClick={openAnyway}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.78rem', textDecoration: 'underline', cursor: 'pointer', padding: '6px' }}
              >
                I understand the risk - open anyway
              </button>
            )}
          </div>
        </GlassCard>
      )}

      {/* Safe link, but no browser could be launched */}
      {phase === 'openFailed' && (
        <GlassCard style={{ width: '100%', maxWidth: '440px', padding: '22px 18px', marginTop: '10px' }}>
          <div style={{ textAlign: 'center' }}>
            <AlertTriangle size={36} color="#f59e0b" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', margin: '0 0 6px 0' }}>Couldn&apos;t open a browser</h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '14px' }}>
              The link looks safe, but no other browser app could be launched. Install Chrome, or copy the link.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={dismiss} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Close</button>
              <button onClick={copyLink} className="btn-primary" style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Copy size={15} /> {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {showReport && result && <ReportThreatSheet result={result} onClose={() => setShowReport(false)} />}
    </div>
  );
}
