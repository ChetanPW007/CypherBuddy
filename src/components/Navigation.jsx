import React from 'react';
import { Home, Scan, Bot, FileText, Users, SlidersHorizontal, LayoutDashboard } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan', icon: Scan },
    { id: 'assistant', label: 'Assistant', icon: Bot },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'permissions', label: 'Shield', icon: SlidersHorizontal },
    { id: 'admin', label: 'Admin', icon: LayoutDashboard }
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
          >
            <Icon size={20} color={isActive ? 'var(--brand-cyan)' : 'var(--text-subtle)'} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
