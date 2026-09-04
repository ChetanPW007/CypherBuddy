import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { 
  ShieldAlert, 
  AlertTriangle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { safeApiCall } from '../config/apiConfig';

import { Browser } from '@capacitor/browser';

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

          // SAFE / LOW RISK: OPEN IN EXTERNAL CHROME VIA CAPACITOR BROWSER PLUGIN
          if (data.recommended_action === 'allow' || data.risk_level === 'low') {
            try {
              await Browser.open({ url: targetUrl });
            } catch {
              const opened = window.open(targetUrl, '_system');
              if (!opened) window.location.href = targetUrl;
            }
            onClose();
          }
        } else {
          setError(true);
        }
      } catch {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setAnalyzing(false);
      }
    }

    performLinkAnalysis();

    return () => {
      isMounted = false;
    };
  }, [targetUrl, onClose]);

  if (!targetUrl) return null;

  // IF SAFE LINK AND DISPATCHED TO CHROME, RENDER NOTHING
  if (!analyzing && result && (result.risk_level === 'low' || result.recommended_action === 'allow')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: analyzing ? 'transparent' : 'rgba(3, 10, 26, 0.65)',
      backdropFilter: analyzing ? 'none' : 'blur(8px)',
      WebkitBackdropFilter: analyzing ? 'none' : 'blur(8px)',
      pointerEvents: analyzing ? 'none' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '24px 16px',
      animation: 'fadeIn 0.2s ease'
    }}>
      
      {/* INVISIBLE BACKGROUND SCANNING TOP FLOATING PILL */}
      {analyzing && (
        <div style={{
          pointerEvents: 'auto',
          width: '90%',
          maxWidth: '380px',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(56, 189, 248, 0.6)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 248, 0.3)',
          borderRadius: '30px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideInRight 0.3s ease'
        }}>
          <RefreshCw size={20} color="#38bdf8" className="spin" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8' }}>
              🛡️ CypherBuddy Background Security Check...
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
              {targetUrl}
            </div>
          </div>
        </div>
      )}

      {/* RISKY / DANGEROUS / SUSPICIOUS WARNING BANNER OVER CHAT */}
      {!analyzing && result && (result.risk_level === 'dangerous' || result.risk_level === 'suspicious') && (
        <GlassCard style={{
          width: '100%',
          maxWidth: '440px',
          padding: '24px 20px',
          border: result.risk_level === 'dangerous' ? '1px solid rgba(244, 63, 94, 0.7)' : '1px solid rgba(245, 158, 11, 0.7)',
          boxShadow: result.risk_level === 'dangerous' ? '0 16px 50px rgba(244, 63, 94, 0.4)' : '0 16px 50px rgba(245, 158, 11, 0.4)',
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
                {result.risk_level === 'dangerous' ? '🔴 DANGEROUS LINK INTERCEPTED' : '🟠 SUSPICIOUS LINK INTERCEPTED'}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Threat Risk Score: <strong>{result.risk_score}/100</strong>
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: '#f8fafc',
            background: 'rgba(0,0,0,0.35)',
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
                  const opened = window.open(targetUrl, '_system');
                  if (!opened) window.location.href = targetUrl;
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
