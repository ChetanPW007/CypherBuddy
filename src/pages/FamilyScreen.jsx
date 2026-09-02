import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  Users, 
  ShieldAlert, 
  Smartphone, 
  Plus, 
  CheckCircle, 
  Lock, 
  Bell, 
  ShieldCheck, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

export default function FamilyScreen({ alerts = [], onClearAlert }) {
  const [devices, setDevices] = useState([
    { id: 'DEV-1', name: 'Grandma\'s Galaxy A34', relation: 'Grandmother', protected: true, status: '1 High Risk Event' },
    { id: 'DEV-2', name: 'Leo\'s Android Tablet', relation: 'Child (11 yrs)', protected: true, status: 'All Safe' },
    { id: 'DEV-3', name: 'Dad\'s Pixel 7', relation: 'Father', protected: true, status: 'All Safe' }
  ]);

  const [newDeviceName, setNewDeviceName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddDevice = () => {
    if (!newDeviceName) return;
    setDevices([
      ...devices,
      { id: `DEV-${devices.length + 1}`, name: newDeviceName, relation: 'Family Member', protected: true, status: 'All Safe' }
    ]);
    setNewDeviceName('');
    setShowAddModal(false);
  };

  const toggleDeviceProtection = (id) => {
    setDevices(devices.map(d => d.id === id ? { ...d, protected: !d.protected } : d));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={26} color="#fb7185" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }} className="gradient-text-brand">
            Family Safety Shield
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
          Connect and shield your parents or children from dangerous scam links & malicious APKs.
        </p>
      </div>

      {/* Privacy Guarantee Card */}
      <GlassCard style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.15))' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Lock size={22} color="#34d399" style={{ marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
              Privacy & Consent Safeguard
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.4 }}>
              CypherBuddy Family Shield requires explicit consent and only transmits high-risk threat indicators (e.g. blocked malicious URLs or trojan APKs). <strong>Private personal messages are never stored or read.</strong>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* High-Risk Security Alerts Feed */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="#fb7185" /> Active Family Threat Alerts ({alerts.length})
        </h3>

        {alerts.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '20px' }}>
            <ShieldCheck size={32} color="#34d399" style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#34d399' }}>
              All Family Devices Secured • No High-Risk Alerts Pending
            </div>
          </GlassCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((al, idx) => (
              <GlassCard key={idx} className="scan-pulse-active" style={{ border: '1.5px solid rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ background: '#f43f5e', color: 'white', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                        🚨 HIGH-RISK THREAT BLOCKED
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#fb7185', fontWeight: 600, marginTop: '2px' }}>
                        Device: {al.deviceName || 'Grandma\'s Phone'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '4px', fontFamily: 'monospace' }}>
                        Target: {al.target || al.title}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => onClearAlert(idx)}
                    style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '8px', padding: '4px 8px', color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Connected Devices List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={18} color="#38bdf8" /> Connected Devices ({devices.length})
          </h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-secondary"
            style={{ padding: '6px 12px', minHeight: '32px', fontSize: '0.78rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}
          >
            <Plus size={14} /> Add Device
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {devices.map(dev => (
            <GlassCard key={dev.id} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '10px', borderRadius: '12px' }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc' }}>
                    {dev.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {dev.relation} • Status: <span style={{ color: dev.protected ? '#34d399' : '#f59e0b' }}>{dev.protected ? 'Shield Active' : 'Paused'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleDeviceProtection(dev.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: dev.protected ? '#34d399' : '#64748b' }}
              >
                {dev.protected ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <GlassCard style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>Connect Family Device</h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '14px' }}>
              Enter device nickname (e.g. Mom's Phone). A pair link invite will be generated.
            </p>
            <input
              type="text"
              placeholder="Device name (e.g. Mom's Galaxy Phone)"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                color: '#fff',
                marginBottom: '14px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleAddDevice} className="btn-primary" style={{ flex: 1 }}>Add Device</button>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
