import React from 'react';

export default function GlassCard({ children, className = '', hover = true, onClick = null, glow = false, style = {} }) {
  return (
    <div 
      onClick={onClick}
      className={`glass-panel ${hover ? 'glass-panel-hover' : ''} ${glow ? 'scan-pulse-active' : ''} ${className}`}
      style={{
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {children}
    </div>
  );
}
