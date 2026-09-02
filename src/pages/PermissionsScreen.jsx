import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  FolderCheck, 
  Camera, 
  Bell, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  Info,
  ChevronRight,
  Sliders,
  Shield,
  Zap,
  Lock,
  Layers,
  Sparkles,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import ArchitectureGatewayDocModal from '../components/ArchitectureGatewayDocModal';

export default function PermissionsScreen({ userSettings = {}, onUpdateSettings }) {
  const [permissions, setPermissions] = useState({
    files: true,
    camera: false,
    notifications: true
  });

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const togglePermission = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleModeChange = (mode) => {
    if (onUpdateSettings) {
      onUpdateSettings({ securityMode: mode });
    }
  };

  const handleToggleSetting = (key) => {
    if (onUpdateSettings) {
      onUpdateSettings({ [key]: !userSettings[key] });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }} className="gradient-text-brand">
            Shield & Protection Settings
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Customize background security gateway behavior, notifications & app permissions.
          </p>
        </div>

        <button 
          onClick={() => setIsDocModalOpen(true)}
          className="btn-secondary"
          style={{ padding: '6px 12px', minHeight: '34px', fontSize: '0.76rem', color: 'var(--brand-cyan)' }}
        >
          <Layers size={14} /> OS Architecture
        </button>
      </div>

      {/* Security Protection Mode Selection (Requirement 20) */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <SlidersHorizontal size={20} color="var(--brand-cyan)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Security Protection Mode</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          
          {/* Balanced Mode */}
          <button
            onClick={() => handleModeChange('BALANCED')}
            style={{
              padding: '12px 10px',
              borderRadius: '12px',
              border: userSettings.securityMode === 'BALANCED' ? '1px solid var(--brand-cyan)' : '1px solid var(--glass-border)',
              background: userSettings.securityMode === 'BALANCED' ? 'rgba(2, 132, 199, 0.14)' : 'var(--glass-bg)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '4px'
            }}
          >
            <Shield size={20} color="var(--brand-cyan)" />
            <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>🛡️ Balanced</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recommended balance of speed & defense</div>
          </button>

          {/* Strict Mode */}
          <button
            onClick={() => handleModeChange('STRICT')}
            style={{
              padding: '12px 10px',
              borderRadius: '12px',
              border: userSettings.securityMode === 'STRICT' ? '1px solid var(--dangerous-primary)' : '1px solid var(--glass-border)',
              background: userSettings.securityMode === 'STRICT' ? 'var(--dangerous-bg)' : 'var(--glass-bg)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '4px'
            }}
          >
            <Lock size={20} color="var(--dangerous-primary)" />
            <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>🔒 Strict</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>More warnings & deeper checks</div>
          </button>

          {/* Quick Mode */}
          <button
            onClick={() => handleModeChange('QUICK')}
            style={{
              padding: '12px 10px',
              borderRadius: '12px',
              border: userSettings.securityMode === 'QUICK' ? '1px solid var(--brand-emerald)' : '1px solid var(--glass-border)',
              background: userSettings.securityMode === 'QUICK' ? 'var(--safe-bg)' : 'var(--glass-bg)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '4px'
            }}
          >
            <Zap size={20} color="var(--brand-emerald)" />
            <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>⚡ Quick</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Alerts only on high-risk threats</div>
          </button>

        </div>
      </GlassCard>

      {/* Gateway Preference Toggles */}
      <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={18} color="var(--brand-emerald)" /> Background Notification Preferences
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.86rem' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Show Safe-Result Notifications</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Brief sliding banner for verified low-risk content</div>
            </div>
            <input 
              type="checkbox" 
              checked={userSettings.showSafeNotifications !== false}
              onChange={() => handleToggleSetting('showSafeNotifications')}
              style={{ width: '18px', height: '18px', accentColor: 'var(--brand-cyan)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.86rem' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Automatically Continue Low-Risk Content</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Never block or open app for safe links/files</div>
            </div>
            <input 
              type="checkbox" 
              checked={userSettings.autoContinueLowRisk !== false}
              onChange={() => handleToggleSetting('autoContinueLowRisk')}
              style={{ width: '18px', height: '18px', accentColor: 'var(--brand-cyan)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.86rem' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Show Security Red Pulse Animations</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Brief subtle red pulse border on high-threat detections</div>
            </div>
            <input 
              type="checkbox" 
              checked={userSettings.securityAnimations !== false}
              onChange={() => handleToggleSetting('securityAnimations')}
              style={{ width: '18px', height: '18px', accentColor: 'var(--brand-cyan)' }}
            />
          </label>

        </div>
      </GlassCard>

      {/* Permission Item 1: Files */}
      <GlassCard style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.15)', color: 'var(--brand-cyan)', padding: '10px', borderRadius: '12px' }}>
              <FolderCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>📁 Files & Downloads Storage</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Used only so you can select an APK file or PDF for security malware inspection.
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '6px', color: permissions.files ? 'var(--safe-primary)' : 'var(--suspicious-primary)', fontWeight: 600 }}>
                Status: {permissions.files ? 'Allowed' : 'Not Allowed'}
              </div>
            </div>
          </div>

          <button 
            onClick={() => togglePermission('files')}
            className="btn-secondary"
            style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.78rem' }}
          >
            {permissions.files ? 'Revoke' : 'Allow'}
          </button>
        </div>
      </GlassCard>

      {/* Permission Item 2: Camera */}
      <GlassCard style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ background: 'rgba(5, 150, 105, 0.15)', color: 'var(--brand-emerald)', padding: '10px', borderRadius: '12px' }}>
              <Camera size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>📷 Camera Access</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Used only when you scan a live QR code.
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '6px', color: permissions.camera ? 'var(--safe-primary)' : 'var(--dangerous-primary)', fontWeight: 600 }}>
                Status: {permissions.camera ? 'Allowed' : 'Not Allowed'}
              </div>
            </div>
          </div>

          <button 
            onClick={() => togglePermission('camera')}
            className="btn-secondary"
            style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.78rem' }}
          >
            {permissions.camera ? 'Revoke' : 'Allow'}
          </button>
        </div>

        {!permissions.camera && (
          <div style={{
            marginTop: '14px',
            padding: '10px 12px',
            background: 'var(--input-bg)',
            borderRadius: '10px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Camera access denied. You can still upload a QR code image from your device gallery.</span>
            <button className="btn-secondary" style={{ padding: '4px 8px', minHeight: '28px', fontSize: '0.72rem' }}>
              <Upload size={12} /> Upload Image
            </button>
          </div>
        )}
      </GlassCard>

      {/* Permission Item 3: Notifications */}
      <GlassCard style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--dangerous-primary)', padding: '10px', borderRadius: '12px' }}>
              <Bell size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>🔔 Security Push Notifications</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Used only for high-risk threat alerts and connected Family Shield notifications.
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '6px', color: permissions.notifications ? 'var(--safe-primary)' : 'var(--suspicious-primary)', fontWeight: 600 }}>
                Status: {permissions.notifications ? 'Allowed' : 'Not Allowed'}
              </div>
            </div>
          </div>

          <button 
            onClick={() => togglePermission('notifications')}
            className="btn-secondary"
            style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.78rem' }}
          >
            {permissions.notifications ? 'Revoke' : 'Allow'}
          </button>
        </div>
      </GlassCard>

      {/* Architecture Doc Modal */}
      <ArchitectureGatewayDocModal 
        isOpen={isDocModalOpen} 
        onClose={() => setIsDocModalOpen(false)} 
      />

    </div>
  );
}
