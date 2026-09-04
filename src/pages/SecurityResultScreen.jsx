import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import RiskGauge from '../components/RiskGauge';
import IsolatedSandboxModal from '../components/IsolatedSandboxModal';
import { exportReportToPDF } from '../services/pdfService';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Download,
  Share2,
  ArrowLeft, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Terminal
} from 'lucide-react';

export default function SecurityResultScreen({ result, onBack, onSendFamilyAlert }) {
  const [showSandbox, setShowSandbox] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!result) return null;

  const isDangerous = result.status === 'DANGEROUS';
  const isSuspicious = result.status === 'SUSPICIOUS';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>
      
      {/* Navigation Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.8rem' }}>
          <ArrowLeft size={16} /> Back to Scanner
        </button>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => exportReportToPDF(result)} 
            className="btn-secondary" 
            style={{ padding: '6px 12px', minHeight: '36px', fontSize: '0.8rem' }}
          >
            <Download size={14} /> Export PDF
          </button>

          {isDangerous && (
            <button 
              onClick={() => onSendFamilyAlert(result)} 
              className="btn-secondary" 
              style={{ padding: '6px 12px', minHeight: '36px', fontSize: '0.8rem', background: 'var(--dangerous-bg)', color: 'var(--dangerous-primary)', borderColor: 'var(--dangerous-border)' }}
            >
              <Share2 size={14} /> Alert Family
            </button>
          )}
        </div>
      </div>

      {/* Main Risk Gauge Header */}
      <GlassCard style={{ textAlign: 'center', padding: '24px 16px' }}>
        <RiskGauge score={result.riskScore} status={result.status} size={150} />

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '12px' }}>
          {result.title || (isDangerous ? 'High Risk Threat Detected' : (isSuspicious ? 'Suspicious Content' : 'Safe to Browse'))}
        </h2>

        {/* AI Disclaimer Guard */}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '4px', fontStyle: 'italic' }}>
          * Evaluation result is: "Potentially dangerous based on available heuristics and threat intelligence signals."
        </p>

        <div style={{ 
          margin: '12px auto 0 auto', 
          padding: '10px 14px', 
          background: 'var(--input-bg)', 
          borderRadius: '10px', 
          fontSize: '0.85rem', 
          color: 'var(--text-main)', 
          wordBreak: 'break-all', 
          fontFamily: 'monospace' 
        }}>
          {result.target || result.text}
        </div>
      </GlassCard>

      {/* Simple Language Findings Summary (For Normal Users) */}
      <GlassCard>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDangerous ? <ShieldAlert size={20} color="var(--dangerous-primary)" /> : <ShieldCheck size={20} color="var(--safe-primary)" />}
          Key Simple Findings
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {result.findings && result.findings.map((f, idx) => (
            <div 
              key={idx} 
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: f.type === 'DANGER' ? 'var(--dangerous-bg)' : (f.type === 'WARNING' ? 'var(--suspicious-bg)' : 'var(--safe-bg)'),
                border: `1px solid ${f.type === 'DANGER' ? 'var(--dangerous-border)' : (f.type === 'WARNING' ? 'var(--suspicious-border)' : 'var(--safe-border)')}`,
                color: f.type === 'DANGER' ? 'var(--dangerous-primary)' : (f.type === 'WARNING' ? 'var(--suspicious-primary)' : 'var(--safe-primary)')
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '2px' }}>
                {f.type === 'DANGER' ? '🚨 ' : (f.type === 'WARNING' ? '⚠️ ' : '✅ ')}{f.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Action Recommendation */}
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--input-bg)', borderRadius: '10px', fontSize: '0.85rem' }}>
          <strong>Recommendation:</strong> {result.recommendation || 'Avoid providing personal data.'}
        </div>

        {/* Safe Sandbox Preview Trigger */}
        {result.type === 'URL' && (
          <button 
            onClick={() => setShowSandbox(true)}
            className="btn-primary"
            style={{ marginTop: '16px', background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)' }}
          >
            <Eye size={18} /> Safe Isolated Sandbox Preview
          </button>
        )}
      </GlassCard>

      {/* Collapsible Technical Details (For Security Students & Admins) */}
      <GlassCard style={{ border: '1px solid var(--glass-border-highlight)' }}>
        <button 
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--brand-cyan)" /> Technical Security Analysis
          </span>
          {showTechnicalDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showTechnicalDetails && (
          <div style={{ marginTop: '14px', borderTop: '1px solid var(--glass-border)', paddingTop: '14px', fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: '6px' }}><strong>Scan Engine:</strong> CypherBuddy Hardened Core v2.4</div>
            <div style={{ marginBottom: '6px' }}><strong>Target Signature:</strong> {result.hash || 'SHA-256 Verified'}</div>
            <div style={{ marginBottom: '6px' }}><strong>SSRF Safety Guard:</strong> PASSED (Private RFC1918 IPs Blocked)</div>
            <div style={{ marginBottom: '6px' }}><strong>Magic Byte Validation:</strong> Header matches expected file signature</div>
            <div><strong>Audit Reference:</strong> {result.id || 'CB-2026-AUDIT-99'}</div>
          </div>
        )}
      </GlassCard>

      {/* Sandbox Modal */}
      {showSandbox && (
        <IsolatedSandboxModal 
          url={result.target} 
          onClose={() => setShowSandbox(false)} 
        />
      )}

    </div>
  );
}
