import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  Link, 
  Package, 
  MessageSquare, 
  Camera, 
  UploadCloud, 
  ShieldCheck, 
  AlertCircle,
  QrCode,
  CheckCircle2
} from 'lucide-react';
import { analyzeUrl, analyzeFile, analyzeMessage, analyzeImageOrQr } from '../services/securityService';
import { safeApiCall } from '../config/apiConfig';

const MOCK_EXAMPLES = {
  dangerousLink: 'paypa1-account-security-update.xyz/login.php',
  safeLink: 'https://google.com',
  dangerousApk: { name: 'Free_Netflix_Premium_v4.2.apk', size: 10485760, type: 'application/vnd.android.package-archive' },
  phishingMsg: 'URGENT: Your SBI account has been BLOCKED. Click here immediately: http://sbi-secure-login.xyz/verify to unblock your account.',
  scamMsg: 'Congratulations! You have won Rs.50,000 prize money! Send OTP 7721 to 56789 to claim your prize now.'
};

export default function ScannerScreen({ 
  initialType = 'url', 
  onScanComplete 
}) {
  const [activeTab, setActiveTab] = useState(initialType);
  const [inputUrl, setInputUrl] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrText, setQrText] = useState('');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanError, setScanError] = useState('');

  // Plain-language scan step messages
  const scanSteps = [
    '🔎 Looking at the structure and format...',
    '🌐 Checking against known threat databases...',
    '🧪 Running deep safety checks...',
    '📊 Calculating risk score and preparing report...'
  ];

  const handleStartScan = async (overrideData = null) => {
    setScanError('');

    if (activeTab === 'url' && !overrideData && !inputUrl.trim()) {
      setScanError('Please paste or type the link you want to check.');
      return;
    }
    if (activeTab === 'apk' && !overrideData && !selectedFile) {
      setScanError('Please select a file from your phone or device.');
      return;
    }
    if (activeTab === 'message' && !overrideData && !inputMessage.trim()) {
      setScanError('Please paste the message text you want to check.');
      return;
    }
    if (activeTab === 'qr' && !overrideData && !qrText.trim()) {
      setScanError('Please upload a QR code image or scan one with your camera.');
      return;
    }

    setIsScanning(true);
    setScanStepIndex(0);

    for (let i = 0; i < scanSteps.length; i++) {
      setScanStepIndex(i);
      await new Promise(r => setTimeout(r, 350));
    }

    let result = null;

    try {
      if (activeTab === 'url') {
        const target = overrideData || inputUrl.trim();
        const apiRes = await safeApiCall('/api/scan/url', {
          method: 'POST',
          body: JSON.stringify({ url: target })
        });
        result = (apiRes.ok && apiRes.data) ? apiRes.data : analyzeUrl(target);
      } else if (activeTab === 'message') {
        const msg = overrideData || inputMessage.trim();
        const apiRes = await safeApiCall('/api/scan/message', {
          method: 'POST',
          body: JSON.stringify({ message: msg })
        });
        result = (apiRes.ok && apiRes.data) ? apiRes.data : analyzeMessage(msg);
      } else if (activeTab === 'apk') {
        const fileToScan = overrideData || selectedFile;
        const formData = new FormData();
        formData.append('file', fileToScan);
        
        const token = localStorage.getItem('cypherbuddy_token');
        const fetchRes = await fetch(`${import.meta.env?.VITE_API_BASE_URL || 'https://cypherbuddy-backend.onrender.com'}/api/scan/file`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData
        });

        result = fetchRes.ok ? await fetchRes.json() : await analyzeFile(fileToScan);
      } else if (activeTab === 'qr') {
        const qrData = overrideData || qrText.trim();
        result = analyzeImageOrQr(qrData, 'Scanned QR Code');
      }
    } catch (e) {
      console.warn('Real-time scan network fallback:', e);
      if (activeTab === 'url') result = analyzeUrl(inputUrl.trim());
      else if (activeTab === 'message') result = analyzeMessage(inputMessage.trim());
      else if (activeTab === 'apk') result = await analyzeFile(selectedFile);
      else result = analyzeImageOrQr(qrText.trim());
    }

    setIsScanning(false);
    if (result && onScanComplete) {
      onScanComplete(result);
    }
  };

  const tabConfig = [
    { id: 'url', label: 'Link / Website', emoji: '🔗', Icon: Link, activeColor: 'var(--brand-cyan)' },
    { id: 'apk', label: 'App File', emoji: '📦', Icon: Package, activeColor: 'var(--brand-emerald)' },
    { id: 'message', label: 'Message', emoji: '💬', Icon: MessageSquare, activeColor: '#fbbf24' },
    { id: 'qr', label: 'QR Code', emoji: '📸', Icon: Camera, activeColor: 'var(--dangerous-primary)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }} className="gradient-text-brand">
          🛡️ Check for Safety
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Choose what you want to check below.
        </p>
      </div>

      {/* Scanner Mode Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        background: 'var(--glass-bg)',
        padding: '6px',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)'
      }}>
        {tabConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? `color-mix(in srgb, ${tab.activeColor} 15%, transparent)` : 'transparent',
              color: activeTab === tab.id ? tab.activeColor : 'var(--text-subtle)',
              border: activeTab === tab.id ? `1px solid color-mix(in srgb, ${tab.activeColor} 40%, transparent)` : '1px solid transparent',
              borderRadius: '12px',
              padding: '10px 4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
              lineHeight: 1.3
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Input Panel */}
      {!isScanning ? (
        <GlassCard>
          {scanError && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'var(--dangerous-bg)',
              border: '1px solid var(--dangerous-border)',
              color: 'var(--dangerous-primary)',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px'
            }}>
              <AlertCircle size={16} />
              <span>{scanError}</span>
            </div>
          )}

          {/* TAB 1: LINK / WEBSITE */}
          {activeTab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                  🔗 Check a Link or Website
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                  Got a suspicious link from WhatsApp, SMS, or email? Paste it below.
                </p>
              </div>

              <input
                type="text"
                placeholder="Paste link here, e.g. paypa1-verify-account.xyz"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                  👉 Or try a demo example:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setInputUrl(MOCK_EXAMPLES.dangerousLink); handleStartScan(MOCK_EXAMPLES.dangerousLink); }}
                    className="glass-pill"
                    style={{ background: 'var(--dangerous-bg)', color: 'var(--dangerous-primary)', borderColor: 'var(--dangerous-border)', cursor: 'pointer' }}
                  >
                    🔴 Fake PayPal Link (Dangerous)
                  </button>
                  <button
                    onClick={() => { setInputUrl(MOCK_EXAMPLES.safeLink); handleStartScan(MOCK_EXAMPLES.safeLink); }}
                    className="glass-pill"
                    style={{ background: 'var(--safe-bg)', color: 'var(--safe-primary)', borderColor: 'var(--safe-border)', cursor: 'pointer' }}
                  >
                    🟢 Google.com (Safe)
                  </button>
                </div>
              </div>

              <button onClick={() => handleStartScan()} className="btn-primary" style={{ marginTop: '4px' }}>
                <ShieldCheck size={20} /> Check This Link Now
              </button>
            </div>
          )}

          {/* TAB 2: APP FILE / APK */}
          {activeTab === 'apk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                  📦 Check a Downloaded App or File
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                  Have an app file (.APK) or document you downloaded? Select it below to check for viruses.
                </p>
              </div>

              <label style={{
                border: '2px dashed var(--safe-border)',
                borderRadius: '16px',
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                background: 'var(--safe-bg)',
                transition: 'all 0.2s'
              }}>
                <UploadCloud size={36} color="var(--brand-emerald)" />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {selectedFile ? `✅ Selected: ${selectedFile.name}` : '👆 Tap here to select file'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Supports .APK, .PDF, .EXE, .ZIP, images (Max 50MB)
                  </div>
                </div>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files[0]) setSelectedFile(e.target.files[0]); }}
                />
              </label>

              <button
                onClick={() => { setSelectedFile(MOCK_EXAMPLES.dangerousApk); handleStartScan(MOCK_EXAMPLES.dangerousApk); }}
                className="glass-pill"
                style={{ background: 'var(--dangerous-bg)', color: 'var(--dangerous-primary)', borderColor: 'var(--dangerous-border)', width: '100%', justifyContent: 'center', cursor: 'pointer' }}
              >
                🔴 Test: Scan a Fake Netflix APK (Trojan Demo)
              </button>

              <button onClick={() => handleStartScan()} className="btn-primary" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                <Package size={20} /> Scan This File Now
              </button>
            </div>
          )}

          {/* TAB 3: MESSAGE / SMS */}
          {activeTab === 'message' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                  💬 Check a Suspicious Message
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                  Paste any WhatsApp message, SMS, or email that seems suspicious.
                </p>
              </div>

              <textarea
                rows={4}
                placeholder={`Example: "Your bank account will be blocked! Click here: http://sbi-alert.xyz"`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                  👉 Or try a sample scam message:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => { setInputMessage(MOCK_EXAMPLES.phishingMsg); handleStartScan(MOCK_EXAMPLES.phishingMsg); }}
                    className="glass-pill"
                    style={{ background: 'var(--suspicious-bg)', color: 'var(--suspicious-primary)', borderColor: 'var(--suspicious-border)', cursor: 'pointer' }}
                  >
                    ⚠️ Bank Scam SMS
                  </button>
                  <button
                    onClick={() => { setInputMessage(MOCK_EXAMPLES.scamMsg); handleStartScan(MOCK_EXAMPLES.scamMsg); }}
                    className="glass-pill"
                    style={{ background: 'var(--dangerous-bg)', color: 'var(--dangerous-primary)', borderColor: 'var(--dangerous-border)', cursor: 'pointer' }}
                  >
                    🚨 Fake Prize Scam
                  </button>
                </div>
              </div>

              <button onClick={() => handleStartScan()} className="btn-primary" style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' }}>
                <MessageSquare size={20} /> Check This Message
              </button>
            </div>
          )}

          {/* TAB 4: QR CODE / SCREENSHOT */}
          {activeTab === 'qr' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                  📸 Scan a QR Code or Screenshot
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                  Upload a photo of the QR code or screenshot to check for hidden dangerous links.
                </p>
              </div>

              <label style={{
                border: '2px dashed var(--dangerous-border)',
                borderRadius: '16px',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                background: 'var(--dangerous-bg)'
              }}>
                <span style={{ fontSize: '3rem' }}>📸</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    👆 Tap to upload QR code or screenshot
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    We'll extract and check any links found inside
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={() => {
                    setQrText('http://paypal-security-alert-2026.xyz/login');
                    handleStartScan('http://paypal-security-alert-2026.xyz/login');
                  }}
                />
              </label>

              <button
                onClick={() => { setQrText(MOCK_EXAMPLES.dangerousLink); handleStartScan(MOCK_EXAMPLES.dangerousLink); }}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)' }}
              >
                <Camera size={20} /> Try a Demo QR Scan
              </button>
            </div>
          )}
        </GlassCard>
      ) : (
        /* Scanning Animation */
        <GlassCard className="scan-pulse-active" style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '12px', animation: 'pulseGlow 1.5s infinite ease-in-out', display: 'inline-block' }}>
            🔍
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
            Checking for Safety...
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Please wait a moment while we scan for threats.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left',
            maxWidth: '360px',
            margin: '0 auto',
            background: 'var(--input-bg)',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid var(--glass-border)'
          }}>
            {scanSteps.map((stepText, idx) => {
              const isCompleted = idx < scanStepIndex;
              const isCurrent = idx === scanStepIndex;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  {isCompleted ? (
                    <CheckCircle2 size={16} color="var(--safe-primary)" />
                  ) : isCurrent ? (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--brand-cyan)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--glass-border)', flexShrink: 0 }} />
                  )}
                  <span style={{ color: isCompleted ? 'var(--safe-primary)' : (isCurrent ? 'var(--brand-cyan)' : 'var(--text-subtle)'), fontWeight: isCurrent ? 600 : 400 }}>
                    {stepText}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

    </div>
  );
}
