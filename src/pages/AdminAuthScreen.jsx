import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  ShieldCheck, 
  Lock, 
  Phone, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL, safeApiCall } from '../config/apiConfig';

export default function AdminAuthScreen({ onAdminAuthSuccess }) {
  const [step, setStep] = useState(1); // Step 1: Credentials, Step 2: OTP
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [maskedContact, setMaskedContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Resend OTP Cooldown Timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // STEP 1: Submit Credentials
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!contact.trim() || !password) {
      setError('Please enter both your phone number/email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await safeApiCall('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          phone_or_email: contact.trim(),
          password: password
        })
      });

      if (!response.ok) {
        throw new Error(response.error || 'Invalid phone number, email or password.');
      }

      const data = response.data;
      setMaskedContact(data.targetMasked || contact);
      setSuccessMsg('Credentials verified! 6-digit OTP sent to your registered contact.');
      setStep(2);
      setCooldown(60);
    } catch (err) {
      setError(err.message || 'Invalid phone number or password.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleStep2Verify = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await safeApiCall('/api/auth/admin/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          phone_or_email: contact.trim(),
          otp: otp.trim()
        })
      });

      if (!response.ok) {
        throw new Error(response.error || 'Invalid or expired OTP.');
      }

      const data = response.data;
      if (data.accessToken) {
        localStorage.setItem('cypherbuddy_token', data.accessToken);
      }

      setSuccessMsg('🎉 2-Step OTP Authentication successful! Opening Admin Dashboard...');
      setTimeout(() => {
        if (onAdminAuthSuccess) {
          onAdminAuthSuccess(data);
        }
      }, 600);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await safeApiCall('/api/auth/admin/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          phone_or_email: contact.trim(),
          password: password
        })
      });

      if (!response.ok) {
        throw new Error(response.error || 'Failed to resend OTP.');
      }

      setSuccessMsg('New 6-digit OTP sent to your registered admin contact!');
      setCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px 12px' }}>
      <GlassCard style={{ width: '100%', maxWidth: '440px', padding: '30px 24px', border: '1px solid var(--dangerous-border)' }}>
        
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            background: 'var(--dangerous-bg)',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            border: '1px solid var(--dangerous-border)'
          }}>
            <ShieldAlert size={36} color="var(--dangerous-primary)" />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0' }}>
            CypherBuddy
          </h2>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dangerous-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Official Admin Portal
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            {step === 1 ? 'Step 1: Admin Phone & Password Authentication' : 'Step 2: 2-Step OTP Security Verification'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'var(--dangerous-bg)',
            border: '1px solid var(--dangerous-border)',
            color: 'var(--dangerous-primary)',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && !error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'var(--safe-bg)',
            border: '1px solid var(--safe-border)',
            color: 'var(--safe-primary)',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1 FORM: Phone / Email & Password */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Admin Phone Number or Email
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="+91 9876543210 or admin@cypherbuddy.org"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: '8px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
            >
              {loading ? 'Verifying Admin Credentials...' : 'SIGN IN'} <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2 FORM: 6-Digit OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleStep2Verify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              textAlign: 'center',
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--input-bg)',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>OTP sent to:</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-cyan)', marginTop: '2px' }}>
                {maskedContact}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', textAlign: 'center' }}>
                Enter 6-Digit Verification OTP
              </label>
              <input 
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--brand-cyan)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  letterSpacing: '0.3em',
                  textAlign: 'center',
                  outline: 'none'
                }}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.length !== 6}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)' }}
            >
              {loading ? 'Verifying OTP...' : 'VERIFY OTP'} <KeyRound size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                ← Back to Credentials
              </button>

              <button 
                type="button" 
                onClick={handleResendOtp}
                disabled={cooldown > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: cooldown > 0 ? 'var(--text-subtle)' : 'var(--brand-cyan)',
                  fontSize: '0.78rem',
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={12} className={loading ? 'spin' : ''} />
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

      </GlassCard>
    </div>
  );
}
