import React from 'react';

export default function Card({ icon, title, description, children, className = '' }) {
  return (
    <div className={`bg-light-card border border-border-light rounded-lg p-6 ${className}`}>
      {(icon || title) && (
        <div className="mb-4">
          {icon && <span className="text-2xl mr-2">{icon}</span>}
          {title && <h3 className="text-lg font-semibold text-text-primary inline">{title}</h3>}
        </div>
      )}
      {description && <p className="text-text-secondary text-sm mb-4">{description}</p>}
      {children}
    </div>
  );
}
