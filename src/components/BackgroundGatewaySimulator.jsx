import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { 
  Play, 
  Smartphone,
  Sparkles
} from 'lucide-react';
import { analyzeUrl, analyzeFile, analyzeMessage, analyzeImageOrQr, MOCK_EXAMPLES } from '../services/securityService';

export default function BackgroundGatewaySimulator({ onTriggerGatewayNotification }) {
  const [selectedScenario, setSelectedScenario] = useState('safe_link');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [simStep, setSimStep] = useState(0);

  const scenarios = [
    {
      id: 'safe_link',
      title: 'WhatsApp: Tapping Google Support Link',
      type: 'url',
      content: MOCK_EXAMPLES.safeLink,
      expected: 'SAFE',
      desc: 'Demonstrates frictionless automatic continuation for safe content with a lightweight notification.'
    },
    {
      id: 'phishing_link',
      title: 'SMS: Tapping Fake PayPal Link',
      type: 'url',
      content: 'https://paypa1-account-verify.xyz/login',
      expected: 'DANGEROUS',
      desc: 'Demonstrates instant threat block & high-confidence red security feedback before opening.'
    },
    {
      id: 'trojan_apk',
      title: 'Telegram: Receiving Free Netflix APK',
      type: 'apk',
      content: { name: 'Free_Netflix_Premium_v4.2.apk', size: 14800000 },
      expected: 'DANGEROUS',
      desc: 'Stops malicious package installation before execution & inspects magic bytes.'
    },
    {
      id: 'scam_sms',
      title: 'SMS: Urgent Bank OTP Scam Message',
      type: 'message',
      content: MOCK_EXAMPLES.phishingMsg,
      expected: 'SUSPICIOUS',
      desc: 'Flags urgency & credential requests without interrupting normal SMS reading.'
    },
    {
      id: 'malicious_qr',
      title: 'Camera: Scanning Poster QR Code',
      type: 'qr',
      content: MOCK_EXAMPLES.dangerousLink,
      expected: 'DANGEROUS',
      desc: 'Analyzes destination URL before opening browser.'
    }
  ];

  const handleRunSimulation = async () => {
    const sc = scenarios.find(s => s.id === selectedScenario);
    if (!sc) return;

    setIsAnalyzing(true);
    setSimStep(1); // Content Identified

    await new Promise(r => setTimeout(r, 400));
    setSimStep(2); // CypherBuddy Security Analysis

    await new Promise(r => setTimeout(r, 600));
    setSimStep(3); // Risk Assessment

    let result = null;
    if (sc.type === 'url') {
      result = analyzeUrl(sc.content);
    } else if (sc.type === 'apk') {
      result = await analyzeFile(sc.content);
    } else if (sc.type === 'message') {
      result = analyzeMessage(sc.content);
    } else if (sc.type === 'qr') {
      result = analyzeImageOrQr(sc.content, 'Poster QR Code');
    }

    await new Promise(r => setTimeout(r, 300));
    setIsAnalyzing(false);
    setSimStep(4);

    if (result && onTriggerGatewayNotification) {
      onTriggerGatewayNotification(result);
    }
  };

  const currentSc = scenarios.find(s => s.id === selectedScenario);

  return (
    <GlassCard style={{ border: '1px solid var(--brand-cyan)', background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.05), rgba(5, 150, 105, 0.08))' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.15)' }}>
            <Smartphone size={22} color="var(--brand-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
              Background Gateway Simulator
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Test CypherBuddy's silent background protection in real-time
            </p>
          </div>
        </div>

        <span className="glass-pill" style={{ fontSize: '0.72rem', color: 'var(--brand-cyan)' }}>
          <Sparkles size={12} /> Interactive Demo
        </span>
      </div>

      {/* Scenario Selection Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {scenarios.map(sc => (
          <button
            key={sc.id}
            onClick={() => setSelectedScenario(sc.id)}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: selectedScenario === sc.id ? '1px solid var(--brand-cyan)' : '1px solid var(--glass-border)',
              background: selectedScenario === sc.id ? 'rgba(2, 132, 199, 0.12)' : 'var(--glass-bg)',
              color: 'var(--text-main)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s'
            }}
          >
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>{sc.title}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{sc.desc}</div>
            </div>

            <span className={`badge-status ${sc.expected === 'DANGEROUS' ? 'badge-dangerous' : sc.expected === 'SUSPICIOUS' ? 'badge-suspicious' : 'badge-safe'}`} style={{ fontSize: '0.68rem' }}>
              {sc.expected}
            </span>
          </button>
        ))}
      </div>

      {/* Visual Lifecycle Pipeline Diagram */}
      <div style={{
        background: 'var(--input-bg)',
        borderRadius: '14px',
        padding: '14px',
        border: '1px solid var(--glass-border)',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Gateway Pipeline Steps:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center', fontSize: '0.72rem' }}>
          <div style={{ padding: '8px 4px', borderRadius: '8px', background: simStep >= 1 ? 'rgba(2, 132, 199, 0.2)' : 'var(--glass-bg)', color: simStep >= 1 ? 'var(--brand-cyan)' : 'var(--text-subtle)', fontWeight: simStep >= 1 ? 700 : 400 }}>
            1. User Action
          </div>
          <div style={{ padding: '8px 4px', borderRadius: '8px', background: simStep >= 2 ? 'rgba(2, 132, 199, 0.2)' : 'var(--glass-bg)', color: simStep >= 2 ? 'var(--brand-cyan)' : 'var(--text-subtle)', fontWeight: simStep >= 2 ? 700 : 400 }}>
            2. Gateway Analysis
          </div>
          <div style={{ padding: '8px 4px', borderRadius: '8px', background: simStep >= 3 ? 'rgba(2, 132, 199, 0.2)' : 'var(--glass-bg)', color: simStep >= 3 ? 'var(--brand-cyan)' : 'var(--text-subtle)', fontWeight: simStep >= 3 ? 700 : 400 }}>
            3. Risk Engine
          </div>
          <div style={{ padding: '8px 4px', borderRadius: '8px', background: simStep >= 4 ? (currentSc.expected === 'DANGEROUS' ? 'var(--dangerous-bg)' : currentSc.expected === 'SUSPICIOUS' ? 'var(--suspicious-bg)' : 'var(--safe-bg)') : 'var(--glass-bg)', color: simStep >= 4 ? (currentSc.expected === 'DANGEROUS' ? 'var(--dangerous-primary)' : currentSc.expected === 'SUSPICIOUS' ? 'var(--suspicious-primary)' : 'var(--safe-primary)') : 'var(--text-subtle)', fontWeight: simStep >= 4 ? 700 : 400 }}>
            4. Gateway Banner
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <button 
        onClick={handleRunSimulation} 
        disabled={isAnalyzing}
        className="btn-primary"
      >
        <Play size={18} /> {isAnalyzing ? 'Analyzing in Background...' : `Simulate "${currentSc?.title}"`}
      </button>
    </GlassCard>
  );
}
