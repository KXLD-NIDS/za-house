import React from 'react';
import { FiGrid, FiBarChart2 } from 'react-icons/fi';

export default function Header({ currentPage = 'listings', onNavigate, listingTitle }) {
  return (
    <header className="bg-light-card border-b border-border-light sticky top-0 z-50 w-full">
      <div className="max-w-full  p-4 lg:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentPage === 'listing-details' ? (
            <>
              <button
                onClick={() => onNavigate('listings')}
                className="text-primary-orange hover:text-orange-hover transition text-2xl"
              >
                ←
              </button>
              <div>
                <h1 className="text-xl font-semibold text-text-primary">
                  Property Details
                </h1>
                {listingTitle && (
                  <p className="text-sm text-text-secondary">{listingTitle}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-primary-orange rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-semibold text-text-primary">
                {currentPage === 'heatmap' ? 'Analytics' : 'Listings'}
              </h1>
            </>
          )}
        </div>
        
        {onNavigate && (
          <nav className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('listings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'listings'
                  ? 'bg-primary-orange text-white'
                  : 'text-text-primary hover:bg-light-sidebar'
              }`}
            >
              <FiGrid size={18} />
              Listings
            </button>
            <button
              onClick={() => onNavigate('heatmap')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'heatmap'
                  ? 'bg-primary-orange text-white'
                  : 'text-text-primary hover:bg-light-sidebar'
              }`}
            >
              <FiBarChart2 size={18} />
              Heatmap
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
