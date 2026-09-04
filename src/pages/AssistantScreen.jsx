import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  Bot, 
  Send, 
  Video,
  AlertTriangle, 
  CheckCircle, 
  Wifi, 
  Bluetooth, 
  Smartphone, 
  Sparkles, 
  Play, 
  ExternalLink
} from 'lucide-react';
import { troubleshootProblem } from '../services/assistantService';

export default function AssistantScreen({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [currentResult, setCurrentResult] = useState(() => troubleshootProblem(initialQuery || 'wifi disconnected'));
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (textToSearch = null) => {
    const text = textToSearch || query || 'wifi problem';
    setIsSearching(true);
    await new Promise(r => setTimeout(r, 600));
    const result = troubleshootProblem(text);
    setCurrentResult(result);
    setIsSearching(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>
      
      {/* Header Banner */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={26} color="#38bdf8" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }} className="gradient-text-brand">
            CypherBuddy Assistant
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
          Friendly AI guidance for ordinary digital & phone problems. No technical jargon.
        </p>
      </div>

      {/* Input Box / Screenshot Scanner Input */}
      <GlassCard style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Type your problem (e.g., Wi-Fi not connecting, Bluetooth failing)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              style={{
                width: '100%',
                padding: '14px 46px 14px 16px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '14px',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSearch()}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                border: 'none',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <Send size={18} />
            </button>
          </div>

          {/* Preset Helper Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button 
              onClick={() => { setQuery('wifi disconnected'); handleSearch('wifi disconnected'); }} 
              className="glass-pill"
            >
              <Wifi size={13} color="#38bdf8" /> Wi-Fi Problem
            </button>
            <button 
              onClick={() => { setQuery('bluetooth earbuds pairing'); handleSearch('bluetooth earbuds pairing'); }} 
              className="glass-pill"
            >
              <Bluetooth size={13} color="#34d399" /> Bluetooth Failing
            </button>
            <button 
              onClick={() => { setQuery('app not installed'); handleSearch('app not installed'); }} 
              className="glass-pill"
            >
              <Smartphone size={13} color="#fbbf24" /> App Install Error
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Diagnostic & Visual Step Guide */}
      {currentResult && !isSearching && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Diagnostic Summary Card */}
          <GlassCard style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(6, 182, 212, 0.12))' }}>
            <span className="glass-pill" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', marginBottom: '8px' }}>
              <Sparkles size={13} /> {currentResult.category || 'Diagnostics'}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '6px', marginBottom: '4px' }}>
              {currentResult.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
              {currentResult.summary}
            </p>
          </GlassCard>

          {/* Visual Step Cards */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#34d399" /> Visual Step-by-Step Instructions
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentResult.steps.map((st) => (
                <GlassCard key={st.stepNumber} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    
                    {/* Step Number Circle */}
                    <div style={{
                      minWidth: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                    }}>
                      {st.stepNumber}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h5 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                        {st.title}
                      </h5>
                      <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: '4px', margin: '4px 0 10px 0', lineHeight: 1.4 }}>
                        {st.desc}
                      </p>

                      {/* Visual UI Step Mockup Illustration */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                          <Smartphone size={15} /> UI Mockup: {st.visualLabel}
                        </div>
                        <span style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}>
                          Tap Here
                        </span>
                      </div>

                      {/* Warning Callout if presents */}
                      {st.warning && (
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          marginTop: '10px',
                          fontSize: '0.78rem',
                          color: '#fbbf24',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <AlertTriangle size={15} /> {st.warning}
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* YouTube Tutorial Recommendations Section */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={20} color="#f43f5e" /> Recommended YouTube Video Tutorials
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentResult.youtubeVideos.map((vid, idx) => (
                <GlassCard key={idx} style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.7)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fb7185'
                    }}>
                      <Play size={22} fill="#fb7185" />
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {vid.title}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                        {vid.channel} • {vid.views}
                      </div>
                    </div>

                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ padding: '6px 12px', minHeight: '34px', fontSize: '0.75rem', textDecoration: 'none', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' }}
                    >
                      Watch <ExternalLink size={12} />
                    </a>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
