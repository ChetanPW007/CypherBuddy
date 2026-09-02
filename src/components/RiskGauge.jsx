import React from 'react';

export default function RiskGauge({ score = 0, status = 'SAFE', size = 180 }) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = 'var(--safe-primary)';
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let textColor = 'var(--safe-primary)';

  if (status === 'DANGEROUS' || score >= 75) {
    strokeColor = 'var(--dangerous-primary)';
    glowColor = 'rgba(244, 63, 94, 0.4)';
    textColor = 'var(--dangerous-primary)';
  } else if (status === 'SUSPICIOUS' || score >= 35) {
    strokeColor = 'var(--suspicious-primary)';
    glowColor = 'rgba(245, 158, 11, 0.4)';
    textColor = 'var(--suspicious-primary)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0' }}>
      <div style={{ position: 'relative', width: size, height: size, filter: `drop-shadow(0 0 16px ${glowColor})` }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track Background */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--glass-border)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Meter Bar */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
          />
        </svg>

        {/* Center Content */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '2.4rem', fontWeight: 800, color: textColor, fontFamily: 'Outfit, sans-serif' }}>
            {score}
          </span>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            Risk / 100
          </span>
        </div>
      </div>
    </div>
  );
}
