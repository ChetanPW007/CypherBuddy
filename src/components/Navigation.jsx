import React from 'react';
import { Home, Scan, Bot, FileText, Users, SlidersHorizontal, LayoutDashboard, BookOpen } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home',        label: 'Home',     emoji: '🏠', icon: Home },
    { id: 'scan',        label: 'Check',    emoji: '🔍', icon: Scan },
    { id: 'assistant',   label: 'Help',     emoji: '🤖', icon: Bot },
    { id: 'reports',     label: 'History',  emoji: '📋', icon: FileText },
    { id: 'family',      label: 'Family',   emoji: '👨‍👩‍👧', icon: Users },
    { id: 'permissions', label: 'Settings', emoji: '⚙️', icon: SlidersHorizontal },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
            title={item.label}
            style={{ gap: '2px' }}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
            <span style={{ fontSize: '0.68rem', marginTop: '0' }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
