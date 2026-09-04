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
  Smartphone
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

  if (isSetupCompleted && notifPerm && cameraPerm) {
    protectionStatus = 'ACTIVE';
    statusColor = 'var(--safe-primary)';
    statusBg = 'var(--safe-bg)';
    statusBorder = 'var(--safe-border)';
  } else if (isSetupCompleted) {
    protectionStatus = 'LIMITED';
    statusColor = 'var(--suspicious-primary)';
    statusBg = 'var(--suspicious-bg)';
    statusBorder = 'var(--suspicious-border)';
  }

  const handleQuickScan = (type) => {
    setScannerType(type);
    setActiveTab('scan');
  };

  const sampleTroubleshootChips = [
    { label: 'Wi-Fi not connecting?', query: 'Wi-Fi disconnects or won\'t connect' },
    { label: 'Bluetooth pairing failed?', query: 'Bluetooth earphones won\'t pair' },
    { label: 'App install blocked?', query: 'App not installed error' },
    { label: 'Storage full?', query: 'Phone storage full clean cache' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>
      
      {/* DEVICE PROTECTION STATUS CARD (Section 21 Requirement) */}
      <GlassCard style={{ border: `1px solid ${statusBorder}`, background: statusBg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} color={statusColor} />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>🛡️ Device Protection</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Real-time Android Protection Shield</div>
            </div>
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '20px',
            color: statusColor,
            border: `1px solid ${statusBorder}`,
            background: 'var(--glass-card)'
          }}>
            Status: {protectionStatus}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '10px 0 14px 0', fontSize: '0.82rem' }}>
          <div style={{ color: 'var(--safe-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> Account protected & device bound
          </div>
          <div style={{ color: notifPerm ? 'var(--safe-primary)' : 'var(--suspicious-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> Notifications: {notifPerm ? 'Enabled' : 'Disabled (Click Manage)'}
          </div>
          <div style={{ color: cameraPerm ? 'var(--safe-primary)' : 'var(--suspicious-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> QR scanning: {cameraPerm ? 'Camera Available' : 'Upload Alternative Active'}
          </div>
          <div style={{ color: 'var(--safe-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> File scanning: Storage Access Framework (SAF)
          </div>
          <div style={{ color: 'var(--safe-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> Link protection: Configured (HTTP/HTTPS Share Intent)
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('permissions')}
          className="btn-secondary"
          style={{ width: '100%', fontSize: '0.82rem', padding: '10px' }}
        >
          <Smartphone size={15} /> Manage Protection Settings
        </button>
      </GlassCard>

      {/* Hero Welcome & Background Gateway Banner Card */}
      <GlassCard className="scan-pulse-active" style={{ background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(2, 132, 199, 0.12))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <span className="glass-pill" style={{ color: 'var(--brand-cyan)', borderColor: 'rgba(2, 132, 199, 0.3)' }}>
              <Shield size={13} /> Active Background Security Gateway
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '8px', marginBottom: '4px' }}>
              Check Silently. Warn Intelligently.
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
              CypherBuddy works quietly in the background without interrupting safe actions.
            </p>
          </div>
        </div>

        {/* Large Manual Scan Button */}
        <button 
          onClick={() => handleQuickScan('url')}
          className="btn-primary"
          style={{ fontSize: '1.05rem', padding: '15px 24px', marginTop: '10px' }}
        >
          <Search size={22} />
          <span>🔍 Manual Scan / Check URL</span>
        </button>

        {/* Quick Action Shortcut Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginTop: '14px'
        }}>
          <button 
            onClick={() => handleQuickScan('url')}
            className="btn-secondary"
            style={{ padding: '10px 12px', fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <Link size={17} color="var(--brand-cyan)" />
            <span>🔗 Check Link</span>
          </button>

          <button 
            onClick={() => handleQuickScan('apk')}
            className="btn-secondary"
            style={{ padding: '10px 12px', fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <Package size={17} color="var(--brand-emerald)" />
            <span>📦 Check APK / File</span>
          </button>

          <button 
            onClick={() => handleQuickScan('message')}
            className="btn-secondary"
            style={{ padding: '10px 12px', fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <MessageSquare size={17} color="#fbbf24" />
            <span>💬 Check Message</span>
          </button>

          <button 
            onClick={() => handleQuickScan('qr')}
            className="btn-secondary"
            style={{ padding: '10px 12px', fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <Camera size={17} color="var(--dangerous-primary)" />
            <span>📸 QR / Screenshot</span>
          </button>
        </div>
      </GlassCard>

      {/* Interactive Background Security Gateway Simulator */}
      <BackgroundGatewaySimulator onTriggerGatewayNotification={onTriggerGatewayNotification} />

      {/* Digital Problem Section */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={22} color="var(--brand-cyan)" /> Having a digital problem?
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              Visual step-by-step guidance & YouTube tutorials.
            </p>
          </div>

          <button 
            onClick={() => setActiveTab('assistant')}
            className="btn-secondary"
            style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.8rem' }}
          >
            Get Help <ChevronRight size={14} />
          </button>
        </div>

        {/* Quick Problem Selector Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {sampleTroubleshootChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSelectTroubleshoot(chip.query)}
              className="glass-pill"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Recent Activity Feed */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--brand-emerald)" /> Gateway Inspection Log
          </h3>
          <button 
            onClick={() => setActiveTab('reports')}
            style={{ background: 'none', border: 'none', color: 'var(--brand-cyan)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
          >
            View All ({history.length})
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {history.slice(0, 4).map((item, idx) => {
            let badgeClass = 'badge-safe';
            let IconTag = ShieldCheck;
            if (item.status === 'DANGEROUS') {
              badgeClass = 'badge-dangerous';
              IconTag = ShieldAlert;
            } else if (item.status === 'SUSPICIOUS') {
              badgeClass = 'badge-suspicious';
              IconTag = AlertTriangle;
            }

            return (
              <GlassCard 
                key={item.id || idx}
                onClick={() => onSelectScanItem(item)}
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                  <div className={badgeClass} style={{ padding: '8px', borderRadius: '12px' }}>
                    <IconTag size={18} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.target || item.title || 'Security Scan'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {item.type || 'SCAN'} • {item.timestamp || 'Recent'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={badgeClass}>
                    {item.status} ({item.riskScore})
                  </span>
                  <ChevronRight size={16} color="var(--text-subtle)" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

    </div>
  );
}
