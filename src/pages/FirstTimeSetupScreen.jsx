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

  // Finish First-Time Setup Flow
  const handleFinishSetup = async () => {
    setLoading(true);
    localStorage.setItem('cypherbuddy_setup_completed', 'true');
    await bindDeviceToAccount();
    setLoading(false);
    onCompleteSetup();
  };

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
              🛡️ Protect Your Device
            </h2>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
              CypherBuddy helps analyse suspicious links, files, QR codes, and security events. Let's configure your security protection settings.
            </p>

            <button 
              onClick={() => setStepIndex(1)}
              className="btn-primary"
              style={{ fontSize: '1rem', padding: '14px 24px' }}
            >
              <span>Continue Setup</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          /* SETUP CARDS SCREEN */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                Device Protection Setup
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Configure individual protection features below.
              </p>
            </div>

            {/* CARD 1: Link Protection */}
            <div style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'var(--input-bg)',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Link size={20} color="var(--brand-cyan)" />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>1. 🔗 Link Protection</span>
                </div>
                <CheckCircle2 size={18} color="var(--safe-primary)" />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Allows CypherBuddy to check links shared from WhatsApp, Chrome or SMS before opening.
              </p>
              <button 
                onClick={() => setLinkProtectionEnabled(!linkProtectionEnabled)}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.78rem', padding: '8px 12px' }}
              >
                <Globe size={14} />
                {linkProtectionEnabled ? '✓ Supported Link Protection Configured' : 'Enable Link Protection'}
              </button>
            </div>

            {/* CARD 2: File Analysis */}
            <div style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'var(--input-bg)',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FolderCheck size={20} color="var(--brand-emerald)" />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>2. 📁 File Analysis</span>
                </div>
                <CheckCircle2 size={18} color="var(--safe-primary)" />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Uses Android's official Storage Access Framework (SAF) picker. No unrestricted storage access requested.
              </p>
              <button 
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.78rem', padding: '8px 12px' }}
                onClick={() => setFileAccessConfigured(true)}
              >
                <Upload size={14} />
                ✓ Official Document Picker Active
              </button>
            </div>

            {/* CARD 3: QR Scanner Camera Access */}
            <div style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'var(--input-bg)',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Camera size={20} color="#f59e0b" />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>3. 📷 QR Scanner</span>
                </div>
                {cameraState === 'granted' ? (
                  <CheckCircle2 size={18} color="var(--safe-primary)" />
                ) : cameraState === 'denied' ? (
                  <AlertCircle size={18} color="var(--dangerous-primary)" />
                ) : null}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Camera access allows CypherBuddy to scan QR codes and check destinations before opening them.
              </p>

              {cameraState === 'denied' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dangerous-primary)', fontWeight: 600 }}>
                    ⚠️ Camera access is disabled. You can still upload QR screenshot images!
                  </div>
                  <button 
                    onClick={handleRequestCamera}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '8px 12px' }}
                  >
                    <Settings size={14} /> Try Camera Permission Again
                  </button>
                </div>
              ) : cameraState === 'granted' ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--safe-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Camera access granted
                </div>
              ) : (
                <button 
                  onClick={handleRequestCamera}
                  className="btn-secondary"
                  style={{ width: '100%', fontSize: '0.78rem', padding: '8px 12px' }}
                >
                  <Camera size={14} /> Grant Camera Permission
                </button>
              )}
            </div>

            {/* CARD 4: Security Notifications */}
            <div style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'var(--input-bg)',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={20} color="#fb7185" />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>4. 🔔 Security Alerts</span>
                </div>
                {notificationState === 'granted' && <CheckCircle2 size={18} color="var(--safe-primary)" />}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                CypherBuddy uses notifications to alert you when a security scan detects a threat.
              </p>

              {notificationState === 'granted' ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--safe-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Notifications Enabled
                </div>
              ) : (
                <button 
                  onClick={handleRequestNotification}
                  className="btn-secondary"
                  style={{ width: '100%', fontSize: '0.78rem', padding: '8px 12px' }}
                >
                  <Bell size={14} /> Enable Security Notifications
                </button>
              )}
            </div>

            {/* COMPLETE SETUP BUTTON */}
            <button 
              onClick={handleFinishSetup}
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Binding Device & Initializing...' : 'COMPLETE SETUP & OPEN DASHBOARD'}
              <ArrowRight size={18} />
            </button>
          </div>
        )}

      </GlassCard>
    </div>
  );
}
