import {
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  X,
  ArrowRight
} from 'lucide-react';

export default function SecurityGatewayBanner({ 
  notification, 
  onDismiss, 
  onViewReport, 
  onContinueAction,
  userSettings = {} 
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!notification) return;

    // Auto-dismiss for SAFE notifications if auto-dismiss enabled
    if (notification.status === 'SAFE' && userSettings.autoContinueLowRisk !== false) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onDismiss();
          if (onContinueAction) onContinueAction(notification);
        }, 350);
      }, 2400);

      return () => clearTimeout(timer);
    }
  }, [notification, userSettings, onDismiss, onContinueAction]);

  if (!notification) return null;

  const { status, riskScore, target, type } = notification;
  const isDangerous = status === 'DANGEROUS' || riskScore >= 70;
  const isSuspicious = status === 'SUSPICIOUS' || (riskScore >= 30 && riskScore < 70);
  const isSafe = status === 'SAFE' && riskScore < 30;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(), 300);
  };

  const handleOpenReport = () => {
    onViewReport(notification);
  };

  const handleProceed = () => {
    if (onContinueAction) onContinueAction(notification);
    handleClose();
  };

  return (
    <div 
      className={`gateway-banner-floating ${isDangerous && userSettings.securityAnimations !== false ? 'red-security-pulse' : ''}`}
      style={{
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateX(120%)' : 'translateX(0)',
        transition: 'all 0.3s ease'
      }}
      role="alert"
      aria-live="polite"
    >
      <div 
        className="glass-panel"
        style={{
          padding: isSafe ? '12px 16px' : '16px 18px',
          background: isDangerous 
            ? 'var(--dangerous-bg)' 
            : isSuspicious 
            ? 'var(--suspicious-bg)' 
            : 'var(--glass-card)',
          borderColor: isDangerous 
            ? 'var(--dangerous-border)' 
            : isSuspicious 
            ? 'var(--suspicious-border)' 
            : 'var(--safe-border)',
          boxShadow: isDangerous 
            ? '0 10px 35px rgba(239, 68, 68, 0.25)' 
            : isSuspicious 
            ? '0 8px 30px rgba(245, 158, 11, 0.2)' 
            : 'var(--glass-shadow-glow)'
        }}
      >
        {/* Banner Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isSafe ? 0 : '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '6px',
              borderRadius: '50%',
              background: isDangerous 
                ? 'rgba(239, 68, 68, 0.2)' 
                : isSuspicious 
                ? 'rgba(245, 158, 11, 0.2)' 
                : 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isDangerous ? (
                <ShieldAlert size={20} color="var(--dangerous-primary)" />
              ) : isSuspicious ? (
                <AlertTriangle size={20} color="var(--suspicious-primary)" />
              ) : (
                <ShieldCheck size={20} color="var(--safe-primary)" />
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>CypherBuddy Gateway</span>
                <span className={`badge-status ${isDangerous ? 'badge-dangerous' : isSuspicious ? 'badge-suspicious' : 'badge-safe'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  {isDangerous ? '🔴 DANGEROUS' : isSuspicious ? '🟠 SUSPICIOUS' : '🟢 SAFE'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isSafe ? `✓ Checked ${type || 'Content'} — Low Risk (${riskScore}/100)` : target}
              </div>
            </div>
          </div>

          <button 
            onClick={handleClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '4px' }}
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>

        {/* Suspicious & Dangerous Expanded Actions */}
        {!isSafe && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '10px', fontWeight: 500 }}>
              {isDangerous 
                ? '🔴 Malicious indicators or brand spoofing detected! Access blocked.' 
                : '🟠 Unusual indicators detected. Review recommended before opening.'}
            </p>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleOpenReport}
                className="btn-secondary"
                style={{ padding: '6px 12px', minHeight: '34px', fontSize: '0.78rem' }}
              >
                View Full Report
              </button>

              {isSuspicious && (
                <button 
                  onClick={handleProceed}
                  className="btn-primary"
                  style={{ padding: '6px 14px', minHeight: '34px', fontSize: '0.78rem', width: 'auto' }}
                >
                  Continue <ArrowRight size={13} />
                </button>
              )}

              {isDangerous && (
                <button 
                  onClick={handleClose}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', minHeight: '34px', fontSize: '0.78rem', background: 'var(--dangerous-bg)', color: 'var(--dangerous-primary)' }}
                >
                  Block Action
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
