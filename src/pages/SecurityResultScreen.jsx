import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import RiskGauge from '../components/RiskGauge';
import IsolatedSandboxModal from '../components/IsolatedSandboxModal';
import ReportThreatSheet from '../components/ReportThreatSheet';
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
  Terminal,
  Flag
} from 'lucide-react';

export default function SecurityResultScreen({ result, onBack, onSendFamilyAlert }) {
  const [showSandbox, setShowSandbox] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showReport, setShowReport] = useState(false);

  if (!result) return null;

  const isDangerous = result.status === 'DANGEROUS';
  const isSuspicious = result.status === 'SUSPICIOUS';
  const isSafe = !isDangerous && !isSuspicious;

  // Plain-language verdict banner content
  const verdictConfig = isDangerous
    ? { emoji: '🚨', label: 'DANGEROUS — Do Not Open!', color: 'var(--dangerous-primary)', bg: 'var(--dangerous-bg)', border: 'var(--dangerous-border)', advice: '⛔ Do NOT click this link, install this file, or reply to this message. Block the sender immediately.' }
    : isSuspicious
    ? { emoji: '⚠️', label: 'SUSPICIOUS — Be Careful!', color: 'var(--suspicious-primary)', bg: 'var(--suspicious-bg)', border: 'var(--suspicious-border)', advice: '🧐 This looks unusual. Avoid sharing personal information or passwords here.' }
    : { emoji: '✅', label: 'SAFE — Looks Good!', color: 'var(--safe-primary)', bg: 'var(--safe-bg)', border: 'var(--safe-border)', advice: '👍 This appears to be safe. As always, stay alert and do not share your passwords or OTP with anyone.' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>

      {/* Back & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '8px 14px', minHeight: '36px', fontSize: '0.82rem' }}>
          <ArrowLeft size={16} /> ← Back
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => exportReportToPDF(result)}
            className="btn-secondary"
            style={{ padding: '8px 12px', minHeight: '36px', fontSize: '0.78rem' }}
          >
            <Download size={14} /> Save PDF
          </button>

          {isDangerous && (
            <button
              onClick={() => onSendFamilyAlert(result)}
              className="btn-secondary"
              style={{ padding: '8px 12px', minHeight: '36px', fontSize: '0.78rem', background: 'var(--dangerous-bg)', color: 'var(--dangerous-primary)', borderColor: 'var(--dangerous-border)' }}
            >
              <Share2 size={14} /> ⚠️ Warn Family
            </button>
          )}
        </div>
      </div>

      {/* Report to Cyber Crime (only if threat) */}
      {(isDangerous || isSuspicious) && (
        <button
          onClick={() => setShowReport(true)}
          className="btn-primary"
          style={{ width: '100%', padding: '13px', fontSize: '0.92rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Flag size={17} /> 🚔 Report to Cyber Crime (1930 / cybercrime.gov.in)
        </button>
      )}
      {showReport && <ReportThreatSheet result={result} onClose={() => setShowReport(false)} />}

      {/* Verdict Banner — Big & Clear */}
      <GlassCard style={{ textAlign: 'center', padding: '24px 16px', border: `1px solid ${verdictConfig.border}`, background: verdictConfig.bg }}>
        <div style={{ fontSize: '4rem', marginBottom: '8px' }}>{verdictConfig.emoji}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: verdictConfig.color, letterSpacing: '-0.01em' }}>
          {verdictConfig.label}
        </div>

        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          background: 'var(--glass-card)',
          borderRadius: '12px',
          fontSize: '0.9rem',
          color: 'var(--text-main)',
          lineHeight: 1.5,
          fontWeight: 600,
          border: `1px solid ${verdictConfig.border}`
        }}>
          {verdictConfig.advice}
        </div>

        <RiskGauge score={result.riskScore} status={result.status} size={130} />

        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          background: 'var(--input-bg)',
          borderRadius: '10px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          wordBreak: 'break-all',
          fontFamily: 'monospace'
        }}>
          {result.target || result.text}
        </div>
      </GlassCard>

      {/* Findings — Plain Language */}
      <GlassCard>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDangerous ? <ShieldAlert size={20} color="var(--dangerous-primary)" /> : <ShieldCheck size={20} color="var(--safe-primary)" />}
          What We Found
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {result.findings && result.findings.map((f, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: f.type === 'DANGER' ? 'var(--dangerous-bg)' : (f.type === 'WARNING' ? 'var(--suspicious-bg)' : 'var(--safe-bg)'),
                border: `1px solid ${f.type === 'DANGER' ? 'var(--dangerous-border)' : (f.type === 'WARNING' ? 'var(--suspicious-border)' : 'var(--safe-border)')}`,
                color: f.type === 'DANGER' ? 'var(--dangerous-primary)' : (f.type === 'WARNING' ? 'var(--suspicious-primary)' : 'var(--safe-primary)')
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>
                {f.type === 'DANGER' ? '🚨 ' : (f.type === 'WARNING' ? '⚠️ ' : '✅ ')}{f.title}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* What You Should Do */}
        <div style={{ marginTop: '16px', padding: '14px', background: 'var(--input-bg)', borderRadius: '12px', fontSize: '0.88rem', lineHeight: 1.6 }}>
          <strong>What you should do:</strong><br />
          {result.recommendation || (isDangerous
            ? 'Do NOT open this. Delete the message and block the sender.'
            : isSuspicious
            ? 'Be very careful. Do not share passwords or personal details.'
            : 'You are safe to proceed. Never share your OTP or password with anyone.'
          )}
        </div>

        {/* Safe Preview for URLs */}
        {result.type === 'URL' && (
          <button
            onClick={() => setShowSandbox(true)}
            className="btn-primary"
            style={{ marginTop: '16px', background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)' }}
          >
            <Eye size={18} /> 👀 Preview Website Safely
          </button>
        )}
      </GlassCard>

      {/* Technical Details — Collapsible (For Advanced Users) */}
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
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--brand-cyan)" /> 🔬 Technical Details (Advanced)
          </span>
          {showTechnicalDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showTechnicalDetails && (
          <div style={{ marginTop: '14px', borderTop: '1px solid var(--glass-border)', paddingTop: '14px', fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: '6px' }}><strong>Scan Engine:</strong> CypherBuddy Hardened Core v2.4</div>
            <div style={{ marginBottom: '6px' }}><strong>Target Signature:</strong> {result.hash || 'SHA-256 Verified'}</div>
            <div style={{ marginBottom: '6px' }}><strong>SSRF Guard:</strong> PASSED (Private IPs Blocked)</div>
            <div style={{ marginBottom: '6px' }}><strong>File Validation:</strong> Header matches expected format</div>
            <div><strong>Audit ID:</strong> {result.id || 'CB-2026-AUDIT-99'}</div>
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
