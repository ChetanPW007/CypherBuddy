import React from 'react';
import GlassCard from '../components/GlassCard';
import { ShieldCheck, Bot, FileText, ArrowRight, Lock, Zap, Heart, Users, Star } from 'lucide-react';

export default function LandingScreen({ onGetStarted, onLearnMore }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '90px' }}>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '30px 10px 10px 10px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(5, 150, 105, 0.12)',
          border: '1px solid rgba(5, 150, 105, 0.3)',
          color: 'var(--brand-emerald)',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '16px'
        }}>
          <Star size={15} /> Free • Safe • Easy to Use
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '14px' }} className="gradient-text-brand">
          Is This Link Safe?<br />Let CypherBuddy Check!
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
          Before you tap on any link, file, or message — let us check it for you in seconds. 
          Protects you and your family from online scams, fake apps, and dangerous websites.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '340px', margin: '0 auto' }}>
          <button
            onClick={onGetStarted}
            className="btn-primary"
            style={{ width: '100%', padding: '18px 24px', fontSize: '1.1rem', borderRadius: '16px' }}
          >
            🛡️ Start Protecting Yourself <ArrowRight size={20} />
          </button>

          <button
            onClick={onLearnMore}
            className="btn-secondary"
            style={{ width: '100%', padding: '14px 20px', fontSize: '0.95rem' }}
          >
            See How It Works
          </button>
        </div>
      </div>

      {/* Simple Scenario Cards — What can it do? */}
      <div style={{ padding: '0 4px' }}>
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>✅ WHAT CAN CYPHERBUDDY DO FOR YOU?</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {/* Scenario 1 */}
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔗</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
              Got a suspicious link?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Received a strange link on WhatsApp, SMS, or email? Paste it here and we'll tell you in seconds if it's <strong style={{ color: 'var(--safe-primary)' }}>safe</strong> or <strong style={{ color: 'var(--dangerous-primary)' }}>dangerous</strong>.
            </p>
          </GlassCard>

          {/* Scenario 2 */}
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📱</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
              Downloading a free app?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Before installing any app file (.APK), we'll scan it for hidden viruses, malware, and dangerous permissions that could steal your data.
            </p>
          </GlassCard>

          {/* Scenario 3 */}
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💬</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
              Received a weird message?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              "Your account will be blocked!" — Paste any suspicious SMS or message and we'll detect if it's a scam trying to trick you.
            </p>
          </GlassCard>
        </div>
      </div>

      {/* How It Works — 3 Steps */}
      <GlassCard style={{ background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.07), rgba(2, 132, 199, 0.07))' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-cyan)', letterSpacing: '0.08em' }}>HOW IT WORKS</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>3 Simple Steps</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { step: '1', emoji: '📋', title: 'Copy the link or message', desc: 'Get the suspicious link, message, or file you want to check.' },
            { step: '2', emoji: '🔍', title: 'Paste it in CypherBuddy', desc: 'Open the app, paste what you got, and tap the big "Check" button.' },
            { step: '3', emoji: '✅', title: 'Get a clear verdict', desc: 'We show a simple result: Safe, Suspicious, or Dangerous — with an easy explanation.' }
          ].map((s) => (
            <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                minWidth: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--brand-emerald)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem'
              }}>{s.step}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.emoji} {s.title}</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Who Is It For */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { emoji: '👴', label: 'Parents &\nGrandparents' },
          { emoji: '🧒', label: 'Students &\nTeens' },
          { emoji: '👩‍💼', label: 'Working\nProfessionals' },
        ].map((p) => (
          <GlassCard key={p.label} style={{ padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{p.emoji}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{p.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Privacy Promise */}
      <GlassCard style={{ background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(2, 132, 199, 0.08))', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '2.2rem' }}>🔒</div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>Your Privacy Is Protected</div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              We <strong>never read your personal chats</strong>. Only the specific link or text you submit is checked. Nothing else is stored or shared.
            </div>
          </div>
        </div>
      </GlassCard>

    </div>
  );
}
