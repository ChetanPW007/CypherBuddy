import React, { useEffect, useState } from 'react';
import GlassCard from './GlassCard';
import { Link2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { isNative, isDefaultBrowser, requestDefaultBrowser } from '../services/nativeBridge';

/**
 * One-tap setup for the WhatsApp link gateway: asks Android to make CypherBuddy the default link handler, so
 * a tapped link opens CypherBuddy (which checks it, then forwards safe links to Chrome) instead of going straight to a browser.
 */
export default function LinkGuardianCard() {
  const native = isNative();
  const [isDefault, setIsDefault] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!native) return undefined;
    let alive = true;
    isDefaultBrowser().then((v) => alive && setIsDefault(v));
    return () => {
      alive = false;
    };
  }, [native]);

  const enable = async () => {
    setBusy(true);
    setNote('');
    const res = await requestDefaultBrowser();
    setIsDefault(!!res.isDefault);
    if (!res.isDefault) {
      setNote('Not enabled yet. In the Android dialog choose "CypherBuddy" as your Browser app.');
    }
    setBusy(false);
  };

  return (
    <GlassCard style={{ border: '1px solid rgba(56, 189, 248, 0.45)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)' }}>
          {isDefault ? <ShieldCheck size={22} color="#10b981" /> : <Link2 size={22} color="#38bdf8" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>WhatsApp Link Guardian</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Every link you tap is checked first. Safe links open in Chrome; scams are blocked and can be reported.
          </div>
        </div>
      </div>

      {!native ? (
        <div style={{ marginTop: '10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Available in the CypherBuddy Android app.
        </div>
      ) : isDefault ? (
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>
          <CheckCircle2 size={16} /> Active - links are being checked before they open
        </div>
      ) : (
        <>
          <button onClick={enable} disabled={busy} className="btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '0.88rem' }}>
            {busy ? 'Opening Android settings...' : 'Turn on link protection'}
          </button>
          {note && <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#f59e0b' }}>{note}</div>}
        </>
      )}
    </GlassCard>
  );
}
