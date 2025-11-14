import React, { useState } from 'react';

export default function ErrorBanner({ message }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-red-900/20 border-b border-red-800/50 px-4 py-3 lg:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-xs font-medium text-red-300">{message}</p>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-red-500 hover:text-red-400"
        >
          ×
        </button>
      </div>
    </div>
  );
}
