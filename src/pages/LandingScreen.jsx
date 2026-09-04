import React from 'react';
import GlassCard from '../components/GlassCard';
import { ShieldCheck, Bot, FileText, ArrowRight, Lock, Zap } from 'lucide-react';

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
          <Zap size={15} /> Built with Zero-Trust Security & Privacy First
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '12px' }} className="gradient-text-brand">
          Check Before You Open.<br />Solve Before You Search.
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
          Your friendly digital companion that shields you and your family from dangerous links, malware APKs, scam messages, and tricky technical problems.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', maxWidth: '400px', margin: '0 auto' }}>
          <button 
            onClick={onGetStarted}
            className="btn-primary" 
            style={{ flex: 1, padding: '16px 24px', fontSize: '1.05rem' }}
          >
            Get Started <ArrowRight size={18} />
          </button>

          <button 
            onClick={onLearnMore}
            className="btn-secondary" 
            style={{ flex: 1, padding: '16px 20px', fontSize: '0.95rem' }}
          >
            Learn More
          </button>
        </div>
      </div>

      {/* 3 Primary Capability Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginTop: '10px'
      }}>
        {/* Card 1: Protect */}
        <GlassCard style={{ padding: '24px' }}>
          <div style={{
            background: 'rgba(5, 150, 105, 0.15)',
            color: 'var(--brand-emerald)',
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
            🛡️ Protect
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Check suspicious web links, files, Android APKs, SMS messages, and QR codes before opening them.
          </p>
        </GlassCard>

        {/* Card 2: Assist */}
        <GlassCard style={{ padding: '24px' }}>
          <div style={{
            background: 'rgba(2, 132, 199, 0.15)',
            color: 'var(--brand-cyan)',
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Bot size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
            🤖 Assist
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Understand error screenshots and solve common digital or phone problems with visual step-by-step guidance.
          </p>
        </GlassCard>

        {/* Card 3: Report */}
        <GlassCard style={{ padding: '24px' }}>
          <div style={{
            background: 'rgba(79, 70, 229, 0.15)',
            color: 'var(--brand-indigo)',
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <FileText size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
            📋 Report
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Save security incident reports, export printable PDF audit summaries, and alert family members to scam threats.
          </p>
        </GlassCard>
      </div>

      {/* Trust & Security Banner */}
      <GlassCard style={{ background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(2, 132, 199, 0.08))', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Lock size={28} color="var(--brand-emerald)" />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>Explicit Consent & Zero Private Data Logging</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              CypherBuddy never reads or logs your personal chat messages. Only security indicators are analyzed locally.
            </div>
          </div>
        </div>
      </GlassCard>

    </div>
  );
}
