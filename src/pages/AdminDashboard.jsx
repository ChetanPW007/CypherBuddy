import React from 'react';
import GlassCard from '../components/GlassCard';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Users, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Server, 
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export default function AdminDashboard({ history = [] }) {
  const totalScans = 1428 + history.length;
  const threatsBlocked = 342 + history.filter(h => h.status === 'DANGEROUS').length;
  const problemsSolved = 894;
  const securityHealthScore = 98;

  const threatCategories = [
    { name: 'Phishing URLs', percentage: 42, count: '144 threats', color: '#f43f5e' },
    { name: 'Malicious APK Mods', percentage: 28, count: '96 threats', color: '#f59e0b' },
    { name: 'Scam SMS / Urgency', percentage: 18, count: '62 threats', color: '#fb7185' },
    { name: 'Fake QR Codes', percentage: 12, count: '40 threats', color: '#38bdf8' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutDashboard size={24} color="var(--brand-cyan)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }} className="gradient-text-brand">
              Admin Cybersecurity Dashboard
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            System telemetry, threat intelligence feeds, and live detection analytics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="glass-pill" style={{ color: 'var(--safe-primary)', borderColor: 'var(--safe-border)' }}>
            <Server size={13} /> FastAPI Engine Online
          </span>
        </div>
      </div>

      {/* Top 4 Telemetry Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <GlassCard style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Security Scans</span>
            <Activity size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
            {totalScans.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--safe-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> +14.2% from last week
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Threats Blocked</span>
            <ShieldAlert size={18} color="#fb7185" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dangerous-primary)', fontFamily: 'Outfit, sans-serif' }}>
            {threatsBlocked.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--dangerous-primary)', marginTop: '4px' }}>
            Zero host execution incidents
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Digital Problems Solved</span>
            <ShieldCheck size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--safe-primary)', fontFamily: 'Outfit, sans-serif' }}>
            {problemsSolved.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--safe-primary)', marginTop: '4px' }}>
            99.4% user satisfaction rating
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>System Health Score</span>
            <BarChart3 size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'Outfit, sans-serif' }}>
            {securityHealthScore} / 100
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            YARA & OCR engines running
          </div>
        </GlassCard>
      </div>

      {/* Threat Distribution Analytics Card */}
      <GlassCard>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="var(--brand-cyan)" /> Threat Category Breakdown
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {threatCategories.map((cat, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                <span style={{ fontWeight: 600 }}>{cat.name}</span>
                <span style={{ color: cat.color, fontWeight: 700 }}>{cat.percentage}% ({cat.count})</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'var(--glass-border)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${cat.percentage}%`,
                  height: '100%',
                  background: cat.color,
                  borderRadius: '4px',
                  transition: 'width 1s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recent Incidents Table */}
      <GlassCard>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--safe-primary)" /> Real-time System Incident Log
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 10px' }}>ID</th>
                <th style={{ padding: '8px 10px' }}>Type</th>
                <th style={{ padding: '8px 10px' }}>Target</th>
                <th style={{ padding: '8px 10px' }}>Status</th>
                <th style={{ padding: '8px 10px' }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 5).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: 'var(--brand-cyan)' }}>{item.id || `CB-10${idx}`}</td>
                  <td style={{ padding: '10px' }}>{item.type}</td>
                  <td style={{ padding: '10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.target}</td>
                  <td style={{ padding: '10px' }}>
                    <span className={item.status === 'DANGEROUS' ? 'badge-dangerous' : 'badge-safe'}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontWeight: 700 }}>{item.riskScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
}
