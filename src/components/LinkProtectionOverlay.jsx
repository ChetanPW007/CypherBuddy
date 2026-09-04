import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  ExternalLink, 
  RefreshCw,
  Globe,
  FileText
} from 'lucide-react';
import { safeApiCall } from '../config/apiConfig';

export default function LinkProtectionOverlay({ targetUrl, onClose, onViewReport }) {
  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!targetUrl) return;

    let isMounted = true;

    async function performLinkAnalysis() {
      setAnalyzing(true);
      setError(false);

      try {
        const response = await safeApiCall('/api/security/analyze-url', {
          method: 'POST',
          body: JSON.stringify({ url: targetUrl })
        });

        if (!isMounted) return;

        if (response.ok && response.data) {
          const data = response.data;
          setResult(data);

          // LOW RISK AUTO-OPEN BEHAVIOR (Section 11 & 12)
          if (data.recommended_action === 'allow' || data.risk_level === 'low') {
            setTimeout(() => {
              if (isMounted) {
                window.open(targetUrl, '_system') || (window.location.href = targetUrl);
                onClose();
              }
            }, 1400);
          }
        } else {
          setError(true);
        }
      } catch (e) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setAnalyzing(false);
      }
    }

    performLinkAnalysis();

    return () => {
      isMounted = false;
    };
  }, [targetUrl]);

  if (!targetUrl) return null;

  // SAFE / LOW RISK FLOATING BANNER (Section 12)
  if (!analyzing && result && (result.risk_level === 'low' || result.recommended_action === 'allow')) {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: '90%',
        maxWidth: '380px',
        background: 'var(--glass-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--safe-border)',
        borderRadius: '16px',
        padding: '12px 16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'slideInRight 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} color="var(--safe-primary)" />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--safe-primary)' }}>
              🛡️ CypherBuddy
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>
              ✓ Checked — Low Risk (Opening...)
            </div>
          </div>
        </div>
        <ExternalLink size={16} color="var(--text-subtle)" />
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <GlassCard style={{ width: '100%', maxWidth: '440px', padding: '24px 20px' }}>
        
        {/* CHECKING STATE */}
        {analyzing && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <RefreshCw size={36} color="var(--brand-cyan)" className="spin" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0' }}>
              🛡️ CypherBuddy Security Shield
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Analyzing link security details...
            </p>
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--brand-cyan)',
              marginTop: '10px',
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}>
              {targetUrl}
            </div>
          </div>
        )}

        {/* OFFLINE / ANALYSIS FAILED STATE (Section 25) */}
        {!analyzing && (error || !result) && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'var(--suspicious-bg)',
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              border: '1px solid var(--suspicious-border)'
            }}>
              <AlertTriangle size={32} color="var(--suspicious-primary)" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--suspicious-primary)', margin: '0 0 6px 0' }}>
              Analysis Unavailable
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              CypherBuddy could not complete the security check for this link.
            </p>

            <div style={{
              padding: '10px',
              borderRadius: '10px',
              background: 'var(--input-bg)',
              fontSize: '0.78rem',
              wordBreak: 'break-all',
              marginBottom: '20px',
              fontFamily: 'monospace'
            }}>
              {targetUrl}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={onClose}
                className="btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                Cancel (Safe Choice)
              </button>
              <button 
                onClick={() => {
                  window.open(targetUrl, '_system') || (window.location.href = targetUrl);
                  onClose();
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', background: 'var(--suspicious-primary)' }}
              >
                Open Anyway
              </button>
            </div>
          </div>
        )}

        {/* SUSPICIOUS LINK STATE (Section 13) */}
        {!analyzing && result && result.risk_level === 'suspicious' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={28} color="var(--suspicious-primary)" />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--suspicious-primary)', margin: 0 }}>
                  🟠 SUSPICIOUS LINK
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Risk Score: <strong>{result.risk_score}/100</strong>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Something about this link looks unusual. Please verify before opening.
            </p>

            {/* Reasons List */}
            {result.reasons && result.reasons.length > 0 && (
              <div style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'var(--suspicious-bg)',
                border: '1px solid var(--suspicious-border)',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--suspicious-primary)', marginBottom: '4px' }}>
                  Possible Reasons:
                </div>
                {result.reasons.map((r, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    • {r}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {onViewReport && (
                <button 
                  onClick={() => onViewReport(result.analysis_details || result)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
                >
                  <FileText size={16} /> View Report
                </button>
              )}
              <button 
                onClick={() => {
                  window.open(targetUrl, '_system') || (window.location.href = targetUrl);
                  onClose();
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', fontSize: '0.85rem', background: 'var(--suspicious-primary)' }}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* DANGEROUS LINK STATE (Section 14) */}
        {!analyzing && result && result.risk_level === 'dangerous' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <ShieldAlert size={32} color="var(--dangerous-primary)" />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dangerous-primary)', margin: 0 }}>
                  🔴 DANGEROUS LINK
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Risk Score: <strong>{result.risk_score}/100</strong>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              CypherBuddy detected multiple potential security risks on this site.
            </p>

            {/* Reasons List */}
            {result.reasons && result.reasons.length > 0 && (
              <div style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'var(--dangerous-bg)',
                border: '1px solid var(--dangerous-border)',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--dangerous-primary)', marginBottom: '4px' }}>
                  Threat Reasons:
                </div>
                {result.reasons.map((r, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    • {r}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={onClose}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', padding: '14px' }}
              >
                CANCEL & BLOCK (RECOMMENDED)
              </button>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {onViewReport && (
                  <button 
                    onClick={() => onViewReport(result.analysis_details || result)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '10px', fontSize: '0.78rem' }}
                  >
                    View Full Report
                  </button>
                )}
                <button 
                  onClick={() => {
                    window.open(targetUrl, '_system') || (window.location.href = targetUrl);
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '0.78rem',
                    background: 'transparent',
                    border: '1px solid var(--dangerous-border)',
                    color: 'var(--dangerous-primary)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Open Anyway
                </button>
              </div>
            </div>
          </div>
        )}

      </GlassCard>
    </div>
  );
}
