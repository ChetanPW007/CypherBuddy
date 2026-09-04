import React from 'react';
import GlassCard from './GlassCard';
import { 
  Smartphone,
  Monitor, 
  Lock, 
  FileText,
  X, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

export default function ArchitectureGatewayDocModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <GlassCard style={{
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.15)' }}>
              <Layers size={24} color="var(--brand-cyan)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                CypherBuddy Architecture & OS Integration
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Transparent OS limits, Android APIs, Privacy Guards & Gateway Mechanics
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Core Gateway Philosophy */}
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          background: 'var(--safe-bg)',
          border: '1px solid var(--safe-border)',
          marginBottom: '18px'
        }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--safe-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> Non-Intrusive Zero Trust Philosophy
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0 }}>
            "Check silently. Warn intelligently. Protect automatically. Help when needed."
            <br />
            CypherBuddy acts as a background safety gateway. Safe content continues automatically with a small non-blocking toast, while dangerous content is halted before execution.
          </p>
        </div>

        {/* Platform API Interception Table */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>
          Platform Integration & Official Android APIs
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          
          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={16} /> 1. Android Intent System & Share Sheet (ACTION_VIEW)
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              Handles incoming URL links and file opens registered via Android Manifest Intent Filters (<code>android.intent.action.VIEW</code>, <code>android.intent.action.SEND</code>). Lets users route suspicious links through CypherBuddy's zero-latency gateway.
            </p>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> 2. Android FileProvider & Package Installer Inspection
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              Scans downloaded <code>.APK</code> files, <code>.PDF</code>s, and executables using <code>FileProvider</code> content URIs prior to triggering Android's <code>PackageInstaller</code>. Inspects magic-byte signatures without executing code.
            </p>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Monitor size={16} /> 3. Desktop Companion & Web Extension Gateway
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              On Windows/macOS, interfaces with standard WebExtensions (Manifest V3 <code>declarativeNetRequest</code> & <code>webRequest</code> APIs) and local URL handlers to check web requests asynchronously without freezing browser tabs.
            </p>
          </div>

        </div>

        {/* Technical Limitations & Privacy Safeguards */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', color: 'var(--dangerous-primary)' }}>
          Strict OS Sandboxing & Privacy Boundaries
        </h3>

        <div style={{
          padding: '14px',
          borderRadius: '12px',
          background: 'var(--dangerous-bg)',
          border: '1px solid var(--dangerous-border)',
          fontSize: '0.8rem',
          color: 'var(--text-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--dangerous-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={16} /> What CypherBuddy NEVER Does (No Spyware):
          </div>
          <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Does NOT secretly read WhatsApp messages or private email chats.</li>
            <li>Does NOT bypass Android OS app sandboxing or abuse Accessibility APIs for surveillance.</li>
            <li>Does NOT intercept third-party app memory without explicit user consent or OS Share Sheet interaction.</li>
            <li>Does NOT send unencrypted file payloads to remote servers. All analysis uses local heuristic magic bytes and hash lookups.</li>
          </ul>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>
            Got it, Close Documentation
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
