import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  FileText, 
  Camera, 
  FolderCheck, 
  Bell, 
  Share2, 
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(1);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const handleFinishOnboarding = () => {
    if (!agreeTerms || !agreePrivacy) {
      alert('Please check both boxes to acknowledge the Privacy Policy and Terms of Service.');
      return;
    }
    onComplete({
      termsAccepted: true,
      privacyAccepted: true,
      policyVersion: 'v2.4',
      acceptedAt: new Date().toISOString()
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px 10px' }}>
      
      {/* Progress Dots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[1, 2, 3, 4].map(s => (
          <div 
            key={s} 
            style={{
              width: s === step ? '28px' : '10px',
              height: '10px',
              borderRadius: '5px',
              background: s === step ? 'var(--brand-cyan)' : 'var(--glass-border)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      <GlassCard style={{ width: '100%', maxWidth: '440px', padding: '28px 24px' }}>
        
        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.3)'
            }}>
              <ShieldCheck size={36} color="#ffffff" />
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>
              Welcome to CypherBuddy
            </h2>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
              CypherBuddy can work quietly in the background and alert you only when something needs your attention.
            </p>

            <button onClick={() => setStep(2)} className="btn-primary">
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: How Gateway Works (Requirement 27) */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px', textAlign: 'center' }}>
              Background Security Layer
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px' }}>
              Security that works in the background, not security that gets in your way.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'var(--safe-bg)', border: '1px solid var(--safe-border)' }}>
                <CheckCircle2 size={24} color="var(--safe-primary)" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--safe-primary)' }}>✓ Safe Content</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>Continues automatically with a brief toast notification.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'var(--suspicious-bg)', border: '1px solid var(--suspicious-border)' }}>
                <AlertTriangle size={24} color="var(--suspicious-primary)" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--suspicious-primary)' }}>⚠️ Suspicious Content</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>Notifies you with options: View Report or Continue.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'var(--dangerous-bg)', border: '1px solid var(--dangerous-border)' }}>
                <ShieldAlert size={24} color="var(--dangerous-primary)" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--dangerous-primary)' }}>🔴 Dangerous Content</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>Blocks automatically before execution with a clear warning.</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
              <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2 }}>Next Step</button>
            </div>
          </div>
        )}

        {/* STEP 3: Terms & Privacy */}
        {step === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Lock size={28} color="var(--brand-emerald)" style={{ margin: '0 auto 6px auto' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Privacy & Policy Policy</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Please review and acknowledge policy requirements.</p>
            </div>

            <div style={{ 
              background: 'var(--input-bg)', 
              border: '1px solid var(--input-border)', 
              borderRadius: '12px', 
              padding: '12px', 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)',
              maxHeight: '130px',
              overflowY: 'auto',
              marginBottom: '16px'
            }}>
              <strong>Privacy Policy Summary (v2.4):</strong><br />
              • CypherBuddy processes scan inputs (URLs, file metadata, text patterns) solely for security threat assessment.<br />
              • Private chat messages are never stored, logged, or sent to third parties.<br />
              • Family alert sharing requires explicit consent.<br />
              • Zero plaintext password storage.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={agreeTerms} 
                  onChange={(e) => setAgreeTerms(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-cyan)' }}
                />
                <span>I agree to the <strong>Terms of Service</strong></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={agreePrivacy} 
                  onChange={(e) => setAgreePrivacy(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-cyan)' }}
                />
                <span>I acknowledge the <strong>Privacy Policy</strong></span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
              <button onClick={() => setStep(4)} className="btn-primary" style={{ flex: 2 }} disabled={!agreeTerms || !agreePrivacy}>
                Set Up Protection
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Protection & Permission Setup */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
              Security Gateway Setup
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px' }}>
              Enable Android protection features. You can customize these anytime in Settings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--input-bg)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FolderCheck size={18} color="var(--brand-cyan)" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>File Security Inspector</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Scan downloaded APKs & files</div>
                  </div>
                </div>
                <span className="badge-safe">Ready</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--input-bg)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Share2 size={18} color="var(--brand-emerald)" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Link Protection Gateway</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Check links via Share Intent</div>
                  </div>
                </div>
                <span className="badge-safe">Ready</span>
              </div>
            </div>

            <button onClick={handleFinishOnboarding} className="btn-primary">
              Open CypherBuddy <ArrowRight size={18} />
            </button>
          </div>
        )}

      </GlassCard>
    </div>
  );
}
