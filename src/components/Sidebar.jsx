import React from 'react';

export default function Sidebar() {
  const menuItems = [
    { icon: '📋', label: 'Overview', active: true },
    { icon: '🎮', label: 'Playground' },
    { icon: '📊', label: 'Activity Logs' },
    { icon: '📈', label: 'Usage' },
    { icon: '🔑', label: 'API Keys' },
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-light-sidebar border-r border-border-light h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search"
            className="w-full px-4 py-2 bg-light-card border border-border-light rounded-lg text-text-primary placeholder-text-secondary text-sm"
          />
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                item.active
                  ? 'bg-light-hover text-primary-orange'
                  : 'text-text-secondary hover:text-text-primary hover:bg-light-hover'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border-light bg-light-card">
        <button className="w-full px-4 py-3 text-left text-sm rounded-lg hover:bg-light-hover transition">
          <span className="text-primary-orange mr-2">🆕</span>
          <span className="text-text-secondary">What's New</span>
        </button>
        <div className="mt-4 text-sm text-text-secondary">user@example.com</div>
      </div>
    </aside>
  );
}
