import React, { useEffect, useState, useMemo, useRef, memo } from 'react';
import { FiMapPin, FiDollarSign } from 'react-icons/fi';

function HeatmapVisualization({ listings, priceRange }) {
  const [view, setView] = useState('location'); // 'location' or 'price'
  const [positionMap, setPositionMap] = useState({});
  const itemHeightRef = useRef(0);

  const chartData = useMemo(() => {
    if (!listings || listings.length === 0) {
      return null;
    }

    if (view === 'location') {
      // Count by location
      const locationCounts = {};
      listings.forEach(listing => {
        const loc = listing.location;
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      });

      return Object.entries(locationCounts)
        .map(([location, count]) => ({ label: location, value: count }))
        .sort((a, b) => b.value - a.value);
    } else {
      // Count by price range
      const priceStep = (priceRange[1] - priceRange[0]) / 6;
      const priceCounts = {};

      for (let i = 0; i < 6; i++) {
        const min = priceRange[0] + i * priceStep;
        const max = priceRange[0] + (i + 1) * priceStep;
        const label = `${Math.round(min / 1000)}K - ${Math.round(max / 1000)}K`;
        priceCounts[label] = 0;
      }

      listings.forEach(listing => {
        const price = parseInt(listing.price.replace(/\s/g, ''));
        const priceStep = (priceRange[1] - priceRange[0]) / 6;
        
        for (let i = 0; i < 6; i++) {
          const min = priceRange[0] + i * priceStep;
          const max = priceRange[0] + (i + 1) * priceStep;
          const label = `${Math.round(min / 1000)}K - ${Math.round(max / 1000)}K`;
          
          if (price >= min && price <= max) {
            priceCounts[label]++;
            break;
          }
        }
      });

      return Object.entries(priceCounts).map(([label, count]) => ({ label, value: count }));
    }
  }, [listings, view, priceRange]);

  // Track position changes for animation
  useEffect(() => {
    if (!chartData) return;
    
    setPositionMap(prev => {
      const newMap = {};
      chartData.forEach((item, idx) => {
        const oldIdx = prev[item.label] ?? idx;
        newMap[item.label] = { currentIdx: idx, oldIdx, offset: (oldIdx - idx) * (itemHeightRef.current || 48) };
      });
      return newMap;
    });
  }, [chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-text-secondary text-sm">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map(d => d.value));
  const displayData = chartData.slice(0, 20); // Show top 20

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-2 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-sm font-bold text-primary-orange">
            {view === 'location' ? 'By Location' : 'By Price'}
          </h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setView('location')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              view === 'location'
                ? 'bg-primary-orange text-white'
                : 'bg-light-sidebar text-text-secondary hover:bg-primary-orange hover:text-white'
            }`}
          >
            <FiMapPin size={14} />
            Location
          </button>
          <button
            onClick={() => setView('price')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              view === 'price'
                ? 'bg-primary-orange text-white'
                : 'bg-light-sidebar text-text-secondary hover:bg-primary-orange hover:text-white'
            }`}
          >
            <FiDollarSign size={14} />
            Price
          </button>
        </div>
      </div>

      <div className="space-y-0 flex-1 min-h-0 overflow-y-auto">
        {displayData.map((item, idx) => {
          const percentage = (item.value / maxValue) * 100;
          const pos = positionMap[item.label] || { offset: 0 };
          
          return (
            <div 
              key={item.label}
              ref={idx === 0 ? el => el && (itemHeightRef.current = el.offsetHeight + 8) : null}
              className="flex items-center gap-2 py-1"
              style={{
                transform: `translateY(${pos.offset}px)`,
                transition: 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                willChange: 'transform'
              }}
            >
              <div className="w-20 truncate text-xs font-medium text-text-secondary" title={item.label}>
                {item.label}
              </div>
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <div
                  className="h-2 rounded-full bg-primary-orange"
                  style={{ 
                    width: `${Math.max(percentage * 2.5, 20)}px`,
                    transition: 'width 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                />
                <span 
                  className="text-xs font-bold text-text-primary whitespace-nowrap flex-shrink-0"
                  style={{
                    transition: 'all 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-border-light text-xs text-text-secondary flex-shrink-0">
        {displayData.length}/{chartData.length} • Total: {chartData.reduce((sum, d) => sum + d.value, 0)}
      </div>
    </div>
  );
}

export default memo(HeatmapVisualization);
