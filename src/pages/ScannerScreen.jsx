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
  FileCode,
  QrCode,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { analyzeUrl, analyzeFile, analyzeMessage, analyzeImageOrQr, MOCK_EXAMPLES } from '../services/securityService';

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

  const scanSteps = [
    'Checking format & protocol headers...',
    'Querying reputation indicators & domain age...',
    'Executing YARA rules & permission heuristics...',
    'Generating comprehensive risk score & report...'
  ];

  const handleStartScan = async (overrideData = null) => {
    setIsScanning(true);
    setScanStepIndex(0);

    for (let i = 0; i < scanSteps.length; i++) {
      setScanStepIndex(i);
      await new Promise(r => setTimeout(r, 450));
    }

    let result = null;

    if (activeTab === 'url') {
      const target = overrideData || inputUrl || MOCK_EXAMPLES.dangerousLink;
      result = analyzeUrl(target);
    } else if (activeTab === 'apk') {
      const fileToTest = overrideData || selectedFile || { name: 'Free_Netflix_Premium_v4.2.apk', size: 14800000 };
      result = await analyzeFile(fileToTest);
    } else if (activeTab === 'message') {
      const msg = overrideData || inputMessage || MOCK_EXAMPLES.phishingMsg;
      result = analyzeMessage(msg);
    } else if (activeTab === 'qr') {
      const qrData = overrideData || qrText || MOCK_EXAMPLES.suspiciousLink;
      result = analyzeImageOrQr(qrData, 'Scanned QR Code');
    }

    setIsScanning(false);
    if (result && onScanComplete) {
      onScanComplete(result);
    }
  };

  const tabConfig = [
    { id: 'url', label: 'Link', Icon: Link, activeColor: 'var(--brand-cyan)' },
    { id: 'apk', label: 'APK / File', Icon: Package, activeColor: 'var(--brand-emerald)' },
    { id: 'message', label: 'Message', Icon: MessageSquare, activeColor: '#fbbf24' },
    { id: 'qr', label: 'QR / OCR', Icon: Camera, activeColor: 'var(--dangerous-primary)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }} className="gradient-text-brand">
          Unified Security Scanner
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Select what you want to check for phishing, viruses or scam indicators.
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
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <tab.Icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Input Cards */}
      {!isScanning ? (
        <GlassCard>
          {/* TAB 1: LINK SCANNER */}
          {activeTab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link size={20} color="var(--brand-cyan)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Check Suspicious Website Link</h3>
              </div>
              
              <input
                type="text"
                placeholder="Paste link here (e.g. paypa1-verify-account.xyz)"
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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Try Sample Examples:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button 
                    onClick={() => { setInputUrl(MOCK_EXAMPLES.dangerousLink); handleStartScan(MOCK_EXAMPLES.dangerousLink); }}
                    className="glass-pill" 
                    style={{ background: 'var(--dangerous-bg)', color: 'var(--dangerous-primary)', borderColor: 'var(--dangerous-border)', cursor: 'pointer' }}
                  >
                    🔴 Phishing Link Demo
                  </button>
                  <button 
                    onClick={() => { setInputUrl(MOCK_EXAMPLES.safeLink); handleStartScan(MOCK_EXAMPLES.safeLink); }}
                    className="glass-pill" 
                    style={{ background: 'var(--safe-bg)', color: 'var(--safe-primary)', borderColor: 'var(--safe-border)', cursor: 'pointer' }}
                  >
                    🟢 Safe Google Link
                  </button>
                </div>
              </div>

              <button onClick={() => handleStartScan()} className="btn-primary" style={{ marginTop: '8px' }}>
                <ShieldCheck size={20} /> Analyze Link Now
              </button>
            </div>
          )}

          {/* TAB 2: APK / FILE SCANNER */}
          {activeTab === 'apk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="var(--brand-emerald)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Check APK / Document / File</h3>
              </div>

              <label style={{
                border: '2px dashed var(--safe-border)',
                borderRadius: '16px',
                padding: '30px 20px',
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
                    {selectedFile ? selectedFile.name : 'Tap to Select File or Drag & Drop'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Supports .APK, .PDF, .EXE, .ZIP, Images (Max 50MB)
                  </div>
                </div>
                <input 
                  type="file" 
                  style={{ display: 'none' }} 
                  onChange={(e) => { if (e.target.files[0]) setSelectedFile(e.target.files[0]); }}
                />
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => { setSelectedFile(MOCK_EXAMPLES.dangerousApk); handleStartScan(MOCK_EXAMPLES.dangerousApk); }}
                  className="glass-pill" 
                  style={{ background: 'var(--dangerous-bg)', color: 'var(--dangerous-primary)', borderColor: 'var(--dangerous-border)', width: '100%', justifyContent: 'center', cursor: 'pointer' }}
                >
                  🔴 Test Sample Trojan APK (Free_Netflix.apk)
                </button>
              </div>

              <button onClick={() => handleStartScan()} className="btn-primary" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                <Package size={20} /> Inspect & Calculate SHA-256
              </button>
            </div>
          )}

          {/* TAB 3: MESSAGE / SMS SCANNER */}
          {activeTab === 'message' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} color="#fbbf24" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Check SMS / WhatsApp / Email Text</h3>
              </div>

              <textarea
                rows={4}
                placeholder="Paste SMS text here (e.g. Your bank account will be blocked...)"
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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Try Sample Scam Messages:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button 
                    onClick={() => { setInputMessage(MOCK_EXAMPLES.phishingMsg); handleStartScan(MOCK_EXAMPLES.phishingMsg); }}
                    className="glass-pill"
                    style={{ background: 'var(--suspicious-bg)', color: 'var(--suspicious-primary)', borderColor: 'var(--suspicious-border)', cursor: 'pointer' }}
                  >
                    ⚠️ Bank Urgency Scam
                  </button>
                  <button 
                    onClick={() => { setInputMessage(MOCK_EXAMPLES.scamMsg); handleStartScan(MOCK_EXAMPLES.scamMsg); }}
                    className="glass-pill"
                    style={{ background: 'var(--dangerous-bg)', color: 'var(--dangerous-primary)', borderColor: 'var(--dangerous-border)', cursor: 'pointer' }}
                  >
                    🚨 Prize / OTP Scam
                  </button>
                </div>
              </div>

              <button onClick={() => handleStartScan()} className="btn-primary" style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' }}>
                <MessageSquare size={20} /> Run NLP Scam Detector
              </button>
            </div>
          )}

          {/* TAB 4: QR CODE / SCREENSHOT OCR */}
          {activeTab === 'qr' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={20} color="var(--dangerous-primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Scan QR Code or Upload Screenshot</h3>
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
                <Camera size={36} color="var(--dangerous-primary)" />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Upload Screenshot or Scan Camera QR
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Extracts embedded links & screenshot error messages automatically
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  style={{ display: 'none' }} 
                  onChange={(e) => { 
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
                <Camera size={20} /> Simulate QR Scan & OCR Extraction
              </button>
            </div>
          )}
        </GlassCard>
      ) : (
        /* Real-Time Multi-Stage Animated Scanner Screen */
        <GlassCard className="scan-pulse-active" style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 20px auto' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(5, 150, 105, 0.3))',
              border: '2px solid var(--brand-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulseGlow 1.5s infinite ease-in-out'
            }}>
              <ShieldCheck size={44} color="var(--brand-cyan)" />
            </div>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
            CypherBuddy Security Engine Active
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Running deep multi-layer security analysis...
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
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
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
                  {isCompleted ? (
                    <CheckCircle2 size={16} color="var(--safe-primary)" />
                  ) : isCurrent ? (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--brand-cyan)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--glass-border)' }} />
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
