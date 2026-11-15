import React, { useEffect, useMemo, useRef, useState } from 'react';
import GlassCard from './GlassCard';
import { ShieldAlert, Copy, Check, ExternalLink, Phone, Share2, X, Loader2 } from 'lucide-react';
import {
  buildReportText,
  registerReport,
  copyText,
  shareText,
  openPortal,
  callHelpline,
  PORTAL_URL,
  HELPLINE,
} from '../services/reportService';

/**
 * "Report to Cyber Crime" bottom sheet.
 * Logs the report (reference ID), prepares a ready-to-paste complaint, then hands the user to the
 * National Cyber Crime Reporting Portal (cybercrime.gov.in) or the 1930 helpline.
 */
export default function ReportThreatSheet({ result, onClose }) {
  const [referenceId, setReferenceId] = useState(null);
  const [registering, setRegistering] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const started = useRef(false);

  // Register exactly once per opened sheet (guards React StrictMode's double effect).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let alive = true;
    registerReport(result).then((id) => {
      if (!alive) return;
      setReferenceId(id);
      setRegistering(false);
    });
    return () => {
      alive = false;
      started.current = false;
    };
  }, [result]);

  const reportText = useMemo(() => buildReportText(result, { referenceId }), [result, referenceId]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const handleCopy = async () => {
    const ok = await copyText(reportText);
    setCopied(ok);
    flash(ok ? 'Report copied - paste it into the complaint form' : 'Could not copy. Select the text and copy it manually.');
    if (ok) setTimeout(() => setCopied(false), 2500);
  };

  const handlePortal = async () => {
    // Copy first so the text is on the clipboard when the portal opens.
    const ok = await copyText(reportText);
    if (ok) flash('Report copied. Paste it into the portal.');
    await openPortal();
  };

  const handleShare = async () => {
    await shareText(reportText);
  };

  const buttonBase = {
    width: '100%',
    padding: '13px',
    fontSize: '0.88rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report to Cyber Crime"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(3, 10, 26, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <GlassCard
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '20px 18px 22px',
          borderRadius: '22px 22px 0 0',
          border: '1px solid rgba(56, 189, 248, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <ShieldAlert size={26} color="#38bdf8" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Report to Cyber Crime</div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              {registering ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Loader2 size={12} className="spin" /> Preparing your report...
                </span>
              ) : referenceId ? (
                <>Reference ID: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{referenceId}</strong></>
              ) : (
                'Offline - report text is ready to use'
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 10px', lineHeight: 1.5 }}>
          Complaints are filed by you on the official national portal (it needs your own login and OTP). We have
          written the complaint for you - copy it and paste it into the incident details.
        </p>

        <pre
          style={{
            fontSize: '0.72rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: '10px',
            padding: '10px 12px',
            margin: '0 0 14px',
            maxHeight: '180px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            color: '#e2e8f0',
          }}
        >
          {reportText}
        </pre>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handlePortal} className="btn-primary" style={{ ...buttonBase, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
            <ExternalLink size={17} /> Copy &amp; open cybercrime.gov.in
          </button>
          <button onClick={callHelpline} className="btn-secondary" style={{ ...buttonBase, borderColor: 'rgba(244, 63, 94, 0.5)', color: '#fb7185' }}>
            <Phone size={17} /> Call {HELPLINE} (lost money? call now)
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleCopy} className="btn-secondary" style={{ ...buttonBase, flex: 1 }}>
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy report'}
            </button>
            <button onClick={handleShare} className="btn-secondary" style={{ ...buttonBase, flex: 1 }}>
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '12px', textAlign: 'center' }}>
          Official portal: {PORTAL_URL.replace('https://', '')} &middot; Helpline: {HELPLINE}
        </div>

        {toast && (
          <div
            role="status"
            style={{
              position: 'sticky',
              bottom: 0,
              marginTop: '12px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#6ee7b7',
              fontSize: '0.78rem',
              textAlign: 'center',
            }}
          >
            {toast}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
