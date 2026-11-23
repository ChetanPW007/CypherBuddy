import React from 'react';
import GlassCard from '../components/GlassCard';
import { 
  Search, 
  Link, 
  Package, 
  MessageSquare, 
  Camera, 
  Bot, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  History,
  Shield,
  Smartphone,
  BookOpen,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import BackgroundGatewaySimulator from '../components/BackgroundGatewaySimulator';

export default function HomeScreen({ 
  setActiveTab, 
  setScannerType, 
  history = [], 
  onSelectScanItem,
  onSelectTroubleshoot,
  onTriggerGatewayNotification 
}) {
  const isSetupCompleted = localStorage.getItem('cypherbuddy_setup_completed') === 'true';
  const notifPerm = typeof Notification !== 'undefined' ? Notification.permission === 'granted' : true;
  const cameraPerm = localStorage.getItem('cypherbuddy_perm_camera') !== 'denied';

  let protectionStatus = 'OFF';
  let statusColor = 'var(--dangerous-primary)';
  let statusBg = 'var(--dangerous-bg)';
  let statusBorder = 'var(--dangerous-border)';
  let statusEmoji = '❌';
  let statusMessage = 'Setup not completed yet';

  if (isSetupCompleted && notifPerm && cameraPerm) {
    protectionStatus = 'ACTIVE';
    statusColor = 'var(--safe-primary)';
    statusBg = 'var(--safe-bg)';
    statusBorder = 'var(--safe-border)';
    statusEmoji = '✅';
    statusMessage = 'You are fully protected!';
  } else if (isSetupCompleted) {
    protectionStatus = 'PARTIAL';
    statusColor = 'var(--suspicious-primary)';
    statusBg = 'var(--suspicious-bg)';
    statusBorder = 'var(--suspicious-border)';
    statusEmoji = '⚠️';
    statusMessage = 'Some features need your permission';
  }

  const handleQuickScan = (type) => {
    setScannerType(type);
    setActiveTab('scan');
  };

  const troubleshootTopics = [
    { label: '📶 Wi-Fi not connecting?', query: 'Wi-Fi disconnects or won\'t connect' },
    { label: '🎧 Bluetooth not pairing?', query: 'Bluetooth earphones won\'t pair' },
    { label: '📦 App not installing?', query: 'App not installed error' },
    { label: '💾 Phone storage full?', query: 'Phone storage full clean cache' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>

      {/* PROTECTION STATUS CARD */}
      <GlassCard style={{ border: `1px solid ${statusBorder}`, background: statusBg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2rem' }}>{statusEmoji}</span>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>Your Protection</div>
              <div style={{ fontSize: '0.82rem', color: statusColor, fontWeight: 700 }}>{statusMessage}</div>
            </div>
          </div>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '20px',
            color: statusColor,
            border: `1px solid ${statusBorder}`,
            background: 'var(--glass-card)'
          }}>
            {protectionStatus}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0 14px 0', fontSize: '0.84rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--safe-primary)' }}>
            <CheckCircle2 size={15} /> Account & device are secure
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: notifPerm ? 'var(--safe-primary)' : 'var(--suspicious-primary)' }}>
            {notifPerm ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            Alerts: {notifPerm ? 'On — will warn you when threats are found' : 'Off — tap Settings to turn on'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: cameraPerm ? 'var(--safe-primary)' : 'var(--suspicious-primary)' }}>
            {cameraPerm ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            QR scanning: {cameraPerm ? 'Camera ready' : 'Use photo upload instead'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--safe-primary)' }}>
            <CheckCircle2 size={15} /> Link guard: Checks every link before you open it
          </div>
        </div>

        <button
          onClick={() => setActiveTab('permissions')}
          className="btn-secondary"
          style={{ width: '100%', fontSize: '0.84rem', padding: '11px' }}
        >
          <Smartphone size={15} /> ⚙️ Manage Settings
        </button>
      </GlassCard>

      {/* QUICK SCAN HERO */}
      <GlassCard className="scan-pulse-active" style={{ background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(2, 132, 199, 0.12))' }}>
        <div style={{ marginBottom: '12px' }}>
          <span className="glass-pill" style={{ color: 'var(--brand-cyan)', borderColor: 'rgba(2, 132, 199, 0.3)' }}>
            <Shield size={13} /> Active — Watching every link you open
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '10px', marginBottom: '4px' }}>
            Check Something Now
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
            Got a suspicious link, message, or file? Tap to check it instantly.
          </p>
        </div>

        {/* Big Primary Scan Button */}
        <button
          onClick={() => handleQuickScan('url')}
          className="btn-primary"
          style={{ fontSize: '1.05rem', padding: '16px 24px', marginTop: '10px', width: '100%' }}
        >
          <Search size={22} />
          <span>🔍 Check a Link or Website</span>
        </button>

        {/* Quick Scan Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginTop: '12px'
        }}>
          <button
            onClick={() => handleQuickScan('apk')}
            className="btn-secondary"
            style={{ padding: '12px', fontSize: '0.88rem', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}
          >
            <Package size={22} color="var(--brand-emerald)" />
            <span>📦 Check an App File</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>APK / download</span>
          </button>

          <button
            onClick={() => handleQuickScan('message')}
            className="btn-secondary"
            style={{ padding: '12px', fontSize: '0.88rem', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}
          >
            <MessageSquare size={22} color="#fbbf24" />
            <span>💬 Check a Message</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>SMS / WhatsApp</span>
          </button>

          <button
            onClick={() => handleQuickScan('qr')}
            className="btn-secondary"
            style={{ padding: '12px', fontSize: '0.88rem', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}
          >
            <Camera size={22} color="var(--dangerous-primary)" />
            <span>📸 Scan a QR Code</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>or screenshot</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="btn-secondary"
            style={{ padding: '12px', fontSize: '0.88rem', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}
          >
            <History size={22} color="var(--brand-cyan)" />
            <span>📋 View Past Checks</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>{history.length} records</span>
          </button>
        </div>
      </GlassCard>

      {/* Need Help Card */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={22} color="var(--brand-cyan)" /> Having a phone problem?
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', margin: '4px 0 0 0' }}>
              Tap a topic below and get simple step-by-step help.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('assistant')}
            className="btn-secondary"
            style={{ padding: '8px 14px', minHeight: '36px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            Ask AI <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {troubleshootTopics.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSelectTroubleshoot(chip.query)}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '12px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <span>{chip.label}</span>
              <ChevronRight size={15} color="var(--text-subtle)" />
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Background Security Demo (unchanged) */}
      <BackgroundGatewaySimulator onTriggerGatewayNotification={onTriggerGatewayNotification} />

      {/* Case Study — College */}
      <GlassCard style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="glass-pill" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.1)' }}>
            <BookOpen size={13} /> For Students / College
          </span>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Python Security</span>
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '4px 0', color: '#f8fafc' }}>
          Case Study: How Hackers Break Websites
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.5 }}>
          Simple explanations of the top security mistakes in Python web apps, plus viva Q&A answers and diagrams.
        </p>
        <button
          onClick={() => setActiveTab('case-study')}
          className="btn-primary"
          style={{ width: '100%', fontSize: '0.88rem', padding: '11px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <BookOpen size={16} /> Open Case Study Presentation
        </button>
      </GlassCard>

      {/* Recent Checks */}
      {history.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <History size={18} color="var(--brand-emerald)" /> Recent Checks
            </h3>
            <button
              onClick={() => setActiveTab('reports')}
              style={{ background: 'none', border: 'none', color: 'var(--brand-cyan)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
            >
              See All ({history.length})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.slice(0, 3).map((item, idx) => {
              let badgeClass = 'badge-safe';
              let IconTag = ShieldCheck;
              let statusLabel = '✅ Safe';
              if (item.status === 'DANGEROUS') {
                badgeClass = 'badge-dangerous';
                IconTag = ShieldAlert;
                statusLabel = '🚨 Dangerous';
              } else if (item.status === 'SUSPICIOUS') {
                badgeClass = 'badge-suspicious';
                IconTag = AlertTriangle;
                statusLabel = '⚠️ Suspicious';
              }

              return (
                <GlassCard
                  key={item.id || idx}
                  onClick={() => onSelectScanItem(item)}
                  style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                    <div className={badgeClass} style={{ padding: '8px', borderRadius: '12px', flexShrink: 0 }}>
                      <IconTag size={18} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.target || item.title || 'Security Check'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {item.timestamp || 'Recent'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span className={badgeClass} style={{ fontSize: '0.74rem' }}>{statusLabel}</span>
                    <ChevronRight size={14} color="var(--text-subtle)" />
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
