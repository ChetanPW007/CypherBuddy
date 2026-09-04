import React from 'react';
import GlassCard from './GlassCard';
import { Download, Sparkles, X, ShieldCheck } from 'lucide-react';

export default function AutoUpdateModal({ updateInfo, onClose }) {
  if (!updateInfo) return null;

  const handleTriggerUpdate = () => {
    const downloadUrl = updateInfo.apk_download_url || updateInfo.github_release_url;
    if (downloadUrl) {
      window.open(downloadUrl, '_system') || (window.location.href = downloadUrl);
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <GlassCard style={{
        width: '100%',
        maxWidth: '420px',
        padding: '24px 20px',
        border: '1px solid rgba(56, 189, 248, 0.5)',
        boxShadow: '0 20px 60px rgba(56, 189, 248, 0.3)',
        animation: 'slideInRight 0.3s ease'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(16, 185, 129, 0.2))',
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.4)'
            }}>
              <Sparkles size={24} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Update Available
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>
                CypherBuddy v{updateInfo.latest_version}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
          A new production update is ready for CypherBuddy. Update directly without losing your settings or logging in again.
        </p>

        {updateInfo.release_notes && (
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'var(--input-bg)',
            border: '1px solid var(--glass-border)',
            fontSize: '0.8rem',
            color: 'var(--text-main)',
            marginBottom: '20px'
          }}>
            <strong>What's New:</strong>
            <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
              • {updateInfo.release_notes}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
          >
            Later
          </button>
          <button 
            onClick={handleTriggerUpdate}
            className="btn-primary"
            style={{ flex: 1.5, padding: '12px', fontSize: '0.88rem', background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)' }}
          >
            <Download size={16} /> Update Now
          </button>
        </div>

      </GlassCard>
    </div>
  );
}
