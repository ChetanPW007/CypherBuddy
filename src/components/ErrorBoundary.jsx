import React from 'react';

/**
 * Last line of defence: a crash in any screen shows a readable message and a Reload button
 * instead of a blank white WebView.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('CypherBuddy UI crashed:', error, info && info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const message = String((this.state.error && this.state.error.message) || this.state.error);
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0b1329', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>🛡️</div>
          <h2 style={{ margin: '8px 0' }}>CypherBuddy hit a problem</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Your device is not affected. Tap Reload to restart the app.</p>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left', fontSize: '0.72rem', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '10px', color: '#fda4af' }}>{message}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '12px', padding: '12px 22px', borderRadius: '12px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700 }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
