import { Shield, Sun, Moon, LogOut, Lock, User } from 'lucide-react';

export default function Header({ 
  theme, 
  setTheme, 
  user, 
  onLogout, 
  familyAlertCount: _familyAlertCount = 0,
  activeTab: _activeTab,
  setActiveTab
}) {
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="glass-panel" style={{
      padding: '12px 18px',
      margin: '8px 8px 16px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '16px',
      position: 'sticky',
      top: '8px',
      zIndex: 90
    }}>
      {/* Brand Header */}
      <div 
        onClick={() => setActiveTab('home')}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
          padding: '8px',
          borderRadius: '12px',
          display: 'flex',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
        }}>
          <Shield size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }} className="gradient-text-brand">
              CypherBuddy
            </span>
            <span className="glass-pill" style={{ fontSize: '0.68rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>
              v2.4 Hardened
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '-2px' }}>
            Your Smart Digital Safety Companion
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        
        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn-secondary"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{ padding: '6px 12px', minHeight: '36px', borderRadius: '12px', fontSize: '0.78rem' }}
        >
          {theme === 'light' ? (
            <>
              <Sun size={16} color="#d97706" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={16} color="#38bdf8" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* User Auth Profile Status */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="glass-pill" style={{ fontSize: '0.75rem', borderColor: 'var(--brand-cyan)' }}>
              <User size={13} color="var(--brand-cyan)" />
              {user.name.split(' ')[0]} ({user.role})
            </span>
            
            <button
              onClick={onLogout}
              className="btn-secondary"
              title="Logout Securely"
              style={{ padding: '6px 10px', minHeight: '36px', color: '#dc2626' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('auth')}
            className="btn-primary"
            style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem', width: 'auto' }}
          >
            <Lock size={14} /> Sign In
          </button>
        )}
      </div>
    </header>
  );
}
