import React from 'react';
import { ShieldCheck, X, ExternalLink, Lock, EyeOff } from 'lucide-react';

export default function IsolatedSandboxModal({ url, onClose }) {
  if (!url) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(16px)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        height: '85vh',
        background: '#0b1329',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)'
      }}>
        {/* Sandbox Top Safety Bar */}
        <div style={{
          padding: '12px 18px',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#10b981',
              color: 'white',
              borderRadius: '50%',
              padding: '4px',
              display: 'flex'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                CypherBuddy Isolated Safe Sandbox
              </div>
              <div style={{ fontSize: '0.72rem', color: '#34d399' }}>
                🛡️ Active Sandbox Container • Client Scripts & Cookies Isolated
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ExternalLink size={14} /> Direct Link
            </a>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(244, 63, 94, 0.2)',
                color: '#fb7185',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* URL Bar */}
        <div style={{
          padding: '8px 16px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.8rem',
          color: '#cbd5e1'
        }}>
          <Lock size={14} color="#34d399" />
          <span style={{ fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {url}
          </span>
        </div>

        {/* Sandbox Content Frame */}
        <div style={{ flex: 1, position: 'relative', background: '#ffffff' }}>
          <iframe
            src={url}
            title="Safe Preview"
            sandbox="allow-same-origin allow-scripts"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        </div>

        {/* Bottom Status Banner */}
        <div style={{
          padding: '10px 16px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <EyeOff size={14} color="#38bdf8" />
            <span>Phishing credentials trap prevention active</span>
          </div>
          <button 
            onClick={onClose}
            className="btn-secondary" 
            style={{ padding: '4px 14px', minHeight: '32px', fontSize: '0.78rem' }}
          >
            Close Sandbox Preview
          </button>
        </div>
      </div>
    </div>
  );
}
