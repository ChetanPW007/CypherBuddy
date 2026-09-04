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

          // LOW RISK / SAFE: AUTO-OPEN IN CHROME WITHOUT ENTERING APP
          if (data.recommended_action === 'allow' || data.risk_level === 'low') {
            setTimeout(() => {
              if (isMounted) {
                try {
                  window.open(targetUrl, '_system') || (window.location.href = targetUrl);
                } catch (e) {
                  window.location.href = targetUrl;
                }
                onClose();
              }
            }, 1000);
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(3, 10, 26, 0.45)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: 'inset 0 0 120px rgba(56, 189, 248, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '24px 16px',
      animation: 'fadeIn 0.2s ease'
    }}>
      
      {/* SCANNING / ANALYSIS FLOATING TOP BANNER */}
      {analyzing && (
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          boxShadow: '0 12px 40px rgba(56, 189, 248, 0.3)',
          borderRadius: '20px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          animation: 'slideInRight 0.3s ease'
        }}>
          <RefreshCw size={26} color="#38bdf8" className="spin" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38bdf8' }}>
              🛡️ CypherBuddy Shield Scanning...
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
              {targetUrl}
            </div>
          </div>
        </div>
      )}

      {/* SAFE / LOW RISK FLOATING SUCCESS BANNER */}
      {!analyzing && result && (result.risk_level === 'low' || result.recommended_action === 'allow') && (
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(6, 78, 59, 0.95)',
          border: '1px solid rgba(52, 211, 153, 0.6)',
          boxShadow: '0 12px 40px rgba(16, 185, 129, 0.35)',
          borderRadius: '20px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'slideInRight 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={28} color="#34d399" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34d399' }}>
                ✓ Verified Safe Link
              </div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
                Opening automatically in Chrome...
              </div>
            </div>
          </div>
          <ExternalLink size={18} color="#34d399" />
        </div>
      )}

      {/* RISKY / DANGEROUS / SUSPICIOUS TOP BANNER & EXPANDED CARD */}
      {!analyzing && result && (result.risk_level === 'dangerous' || result.risk_level === 'suspicious') && (
        <GlassCard style={{
          width: '100%',
          maxWidth: '440px',
          padding: '24px 20px',
          border: result.risk_level === 'dangerous' ? '1px solid rgba(244, 63, 94, 0.6)' : '1px solid rgba(245, 158, 11, 0.6)',
          boxShadow: result.risk_level === 'dangerous' ? '0 16px 50px rgba(244, 63, 94, 0.35)' : '0 16px 50px rgba(245, 158, 11, 0.35)',
          animation: 'slideInRight 0.3s ease',
          marginTop: '10px'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {result.risk_level === 'dangerous' ? (
              <ShieldAlert size={34} color="#f43f5e" />
            ) : (
              <AlertTriangle size={34} color="#f59e0b" />
            )}
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: result.risk_level === 'dangerous' ? '#f43f5e' : '#f59e0b',
                margin: 0
              }}>
                {result.risk_level === 'dangerous' ? '🔴 DANGEROUS LINK BLOCKED' : '🟠 SUSPICIOUS LINK DETECTED'}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Threat Risk Score: <strong>{result.risk_score}/100</strong>
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: '#f8fafc',
            background: 'rgba(0,0,0,0.3)',
            padding: '10px 12px',
            borderRadius: '10px',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            marginBottom: '14px'
          }}>
            {targetUrl}
          </div>

          {/* Reasons List */}
          {result.reasons && result.reasons.length > 0 && (
            <div style={{
              padding: '12px',
              borderRadius: '12px',
              background: result.risk_level === 'dangerous' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: result.risk_level === 'dangerous' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '18px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: result.risk_level === 'dangerous' ? '#f43f5e' : '#f59e0b', marginBottom: '4px' }}>
                Detected Security Warnings:
              </div>
              {result.reasons.map((r, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: '#f1f5f9', marginTop: '3px' }}>
                  • {r}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={onClose}
              className="btn-primary"
              style={{
                background: result.risk_level === 'dangerous' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'var(--suspicious-primary)',
                padding: '14px',
                fontSize: '0.92rem'
              }}
            >
              CANCEL & BLOCK (SAFE CHOICE)
            </button>

            {onViewReport && (
              <button 
                onClick={() => onViewReport(result.analysis_details || result)}
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', fontSize: '0.85rem', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
              >
                <FileText size={16} /> Open Full CypherBuddy Security Audit Report
              </button>
            )}
          </div>

        </GlassCard>
      )}

      {/* OFFLINE / ERROR STATE */}
      {!analyzing && (error || !result) && (
        <GlassCard style={{ width: '100%', maxWidth: '440px', padding: '24px 20px', marginTop: '10px' }}>
          <div style={{ textAlign: 'center' }}>
            <AlertTriangle size={36} color="#f59e0b" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', margin: '0 0 6px 0' }}>
              Analysis Unavailable
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
              CypherBuddy could not verify link security.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
                Cancel (Safe)
              </button>
              <button 
                onClick={() => {
                  window.open(targetUrl, '_system') || (window.location.href = targetUrl);
                  onClose();
                }}
                className="btn-primary" 
                style={{ flex: 1, padding: '12px', background: '#f59e0b' }}
              >
                Open Anyway
              </button>
            </div>
          </div>
        </GlassCard>
      )}

    </div>
  );
}
