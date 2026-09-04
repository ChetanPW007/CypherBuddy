import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  ShieldCheck, 
  Link, 
  FolderCheck, 
  Camera, 
  Bell, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Settings,
  Upload,
  Globe
} from 'lucide-react';
import { bindDeviceToAccount } from '../utils/deviceInfo';

export default function FirstTimeSetupScreen({ onCompleteSetup }) {
  const [stepIndex, setStepIndex] = useState(0); // 0: Welcome Intro, 1: Setup Cards
  
  // Permission setup states
  const [linkProtectionEnabled, setLinkProtectionEnabled] = useState(true);
  const [fileAccessConfigured, setFileAccessConfigured] = useState(true);
  
  const [cameraState, setCameraState] = useState('prompt'); // prompt | granted | denied
  const [notificationState, setNotificationState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'prompt'
  );

  const [loading, setLoading] = useState(false);

  // Request Camera Permission
  const handleRequestCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop stream immediately after permission granted
        stream.getTracks().forEach(track => track.stop());
        setCameraState('granted');
        localStorage.setItem('cypherbuddy_perm_camera', 'granted');
      } else {
        setCameraState('granted');
      }
    } catch (e) {
      setCameraState('denied');
      localStorage.setItem('cypherbuddy_perm_camera', 'denied');
    }
  };

  // Request Notification Permission
  const handleRequestNotification = async () => {
    try {
      if (typeof Notification !== 'undefined' && Notification.requestPermission) {
        const res = await Notification.requestPermission();
        setNotificationState(res);
        localStorage.setItem('cypherbuddy_perm_notification', res);
      } else {
        setNotificationState('granted');
      }
    } catch (e) {
      setNotificationState('denied');
    }
  };

  const handleOpenAndroidSettings = () => {
    setLinkProtectionEnabled(true);
    localStorage.setItem('cypherbuddy_perm_link', 'configured');
    try {
      window.location.href = 'intent:#Intent;action=android.settings.APP_OPEN_BY_DEFAULT_SETTINGS;package=com.cypherbuddy.app;end';
    } catch (e) {
      try {
        window.location.href = 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;package=com.cypherbuddy.app;end';
      } catch (err) {
        console.warn('System settings intent launch:', err);
      }
    }
  };

  // Finish First-Time Setup Flow
  const handleFinishSetup = async () => {
    setLoading(true);
    localStorage.setItem('cypherbuddy_setup_completed', 'true');
    await bindDeviceToAccount();
    setLoading(false);
    onCompleteSetup();
  };

  const isAllConfigured = cameraState !== 'prompt' && notificationState !== 'prompt' && linkProtectionEnabled;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '16px 12px' }}>
      <GlassCard style={{ width: '100%', maxWidth: '440px', padding: '28px 20px', border: '1px solid var(--glass-border-highlight)' }}>
        
        {/* INTRO SCREEN */}
        {stepIndex === 0 ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.15), rgba(2, 132, 199, 0.2))',
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '1px solid var(--safe-border)'
            }}>
              <ShieldCheck size={42} color="var(--safe-primary)" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0' }} className="gradient-text-brand">
              🛡️ Mandatory Device Protection Setup
            </h2>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
              To ensure real-time link protection and threat alerts work on your Android phone, please configure system permissions below.
            </p>

            <button 
              onClick={() => setStepIndex(1)}
              className="btn-primary"
              style={{ fontSize: '1rem', padding: '14px 24px' }}
            >
              <span>Start Permission Setup</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          /* SETUP CARDS SCREEN */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                Device System Permissions
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Configure required Android system settings below to unlock Dashboard.
              </p>
            </div>

            {/* CARD 1: Link Protection & System Settings */}
            <div style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'var(--input-bg)',
              border: linkProtectionEnabled ? '1px solid var(--safe-border)' : '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Link size={20} color="var(--brand-cyan)" />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>1. 🔗 Link Interception & Default App</span>
                </div>
                <CheckCircle2 size={18} color="var(--safe-primary)" />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                If Chrome or another browser is already set to always open links, tap below to open Android Settings and choose CypherBuddy.
              </p>
              <button 
                onClick={handleOpenAndroidSettings}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.78rem', padding: '10px 12px', background: 'rgba(2, 132, 199, 0.15)', color: 'var(--brand-cyan)' }}
              >
                <Settings size={14} />
                Open Android System Settings / Default Apps
              </button>
            </div>

            {/* CARD 2: File Analysis (SAF) */}
            <div style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'var(--input-bg)',
              border: '1px solid var(--safe-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FolderCheck size={20} color="var(--brand-emerald)" />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>2. 📁 File Inspection (SAF)</span>
                </div>
                <CheckCircle2 size={18} color="var(--safe-primary)" />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Uses Android Storage Access Framework (SAF). Zero privacy risk or background file scanning.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--safe-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> SAF Document Picker Active
              </div>
            </div>

            {/* CARD 3: QR Scanner Camera Access */}
            <div style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'var(--input-bg)',
              border: cameraState === 'granted' ? '1px solid var(--safe-border)' : '1px solid var(--suspicious-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Camera size={20} color="#f59e0b" />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>3. 📷 Camera Access (QR Scanning)</span>
                </div>
                {cameraState === 'granted' ? (
                  <CheckCircle2 size={18} color="var(--safe-primary)" />
                ) : (
                  <AlertCircle size={18} color="var(--suspicious-primary)" />
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Required for real-time QR code scanning via device camera.
              </p>

              {cameraState === 'granted' ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--safe-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Camera permission granted
                </div>
              ) : (
                <button 
                  onClick={handleRequestCamera}
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '0.78rem', padding: '10px 12px', background: 'var(--suspicious-primary)' }}
                >
                  <Camera size={14} /> Allow Camera System Permission
                </button>
              )}
            </div>

            {/* CARD 4: Security Notifications */}
            <div style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'var(--input-bg)',
              border: notificationState === 'granted' ? '1px solid var(--safe-border)' : '1px solid var(--suspicious-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={20} color="#fb7185" />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>4. 🔔 Security Notification Alerts</span>
                </div>
                {notificationState === 'granted' && <CheckCircle2 size={18} color="var(--safe-primary)" />}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Required to alert you immediately when a dangerous link or file threat is detected.
              </p>

              {notificationState === 'granted' ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--safe-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Notifications Enabled
                </div>
              ) : (
                <button 
                  onClick={handleRequestNotification}
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '0.78rem', padding: '10px 12px', background: 'var(--suspicious-primary)' }}
                >
                  <Bell size={14} /> Allow Security Notification Permission
                </button>
              )}
            </div>

            {/* COMPLETE SETUP BUTTON */}
            <button 
              onClick={handleFinishSetup}
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: '8px', padding: '14px 20px', fontSize: '0.95rem' }}
            >
              {loading ? 'Binding Device & Initializing...' : 'ALLOW & OPEN SIGNED DASHBOARD'}
              <ArrowRight size={18} />
            </button>
          </div>
        )}

      </GlassCard>
    </div>
  );
}
