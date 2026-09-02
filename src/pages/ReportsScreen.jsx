import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Download, 
  Search, 
  Filter, 
  ChevronRight,
  Printer
} from 'lucide-react';
import { exportReportToPDF } from '../services/pdfService';

export default function ReportsScreen({ history = [], onSelectReport }) {
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'DANGEROUS' | 'SAFE' | 'APK' | 'URL'
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = history.filter(item => {
    const matchesSearch = !searchTerm || (item.target || item.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filterTab === 'ALL') return matchesSearch;
    if (filterTab === 'DANGEROUS') return matchesSearch && item.status === 'DANGEROUS';
    if (filterTab === 'SAFE') return matchesSearch && item.status === 'SAFE';
    if (filterTab === 'APK') return matchesSearch && (item.type === 'APK' || item.type === 'FILE');
    if (filterTab === 'URL') return matchesSearch && item.type === 'URL';
    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={24} color="#38bdf8" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }} className="gradient-text-brand">
            Incident Reports & History
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
          Saved security audits, risk evaluations, and solved digital problems.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <GlassCard style={{ padding: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search past scans or targets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['ALL', 'DANGEROUS', 'SAFE', 'APK', 'URL'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                style={{
                  background: filterTab === tab ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: filterTab === tab ? '#38bdf8' : '#94a3b8',
                  border: filterTab === tab ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Reports List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredItems.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '30px 20px' }}>
            <FileText size={36} color="#64748b" style={{ margin: '0 auto 10px auto' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>
              No matching security reports found
            </div>
          </GlassCard>
        ) : (
          filteredItems.map((item, idx) => {
            let badgeClass = 'badge-safe';
            let IconTag = ShieldCheck;
            if (item.status === 'DANGEROUS') {
              badgeClass = 'badge-dangerous';
              IconTag = ShieldAlert;
            } else if (item.status === 'SUSPICIOUS') {
              badgeClass = 'badge-suspicious';
              IconTag = AlertTriangle;
            }

            return (
              <GlassCard key={item.id || idx} style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={badgeClass}>
                      <IconTag size={14} /> {item.status} ({item.riskScore})
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                      {item.id}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {item.timestamp}
                  </span>
                </div>

                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                  {item.target || item.title}
                </div>
                
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '12px' }}>
                  {item.title || item.recommendation}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => onSelectReport(item)}
                    className="btn-secondary" 
                    style={{ flex: 1, padding: '6px 12px', minHeight: '34px', fontSize: '0.78rem' }}
                  >
                    View Audit Details <ChevronRight size={14} />
                  </button>

                  <button 
                    onClick={() => exportReportToPDF(item)}
                    className="btn-secondary" 
                    style={{ padding: '6px 12px', minHeight: '34px', fontSize: '0.78rem' }}
                  >
                    <Download size={14} /> PDF
                  </button>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

    </div>
  );
}
