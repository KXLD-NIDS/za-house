import React, { useState } from 'react';
import { FiMapPin, FiX, FiDollarSign } from 'react-icons/fi';
import { fixFrenchAccents } from '../utils/textFormatter';

export default function FilterSidebar({
  filters,
  setFilters,
  uniqueNatures,
  uniqueLocations,
}) {
  const [locationSearch, setLocationSearch] = useState('');

  const handleNatureToggle = (nature) => {
    setFilters((prev) => ({
      ...prev,
      nature: prev.nature.includes(nature)
        ? prev.nature.filter((n) => n !== nature)
        : [...prev.nature, nature],
    }));
  };

  const handleLocationAdd = (location) => {
    setFilters((prev) => ({
      ...prev,
      location: prev.location.includes(location)
        ? prev.location
        : [...prev.location, location],
    }));
    setLocationSearch('');
  };

  const handleLocationRemove = (location) => {
    setFilters((prev) => ({
      ...prev,
      location: prev.location.filter((l) => l !== location),
    }));
  };

  const filteredLocations = uniqueLocations.filter((loc) =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handlePriceChange = (e) => {
    const value = parseInt(e.target.value);
    setFilters((prev) => ({
      ...prev,
      priceRange: [prev.priceRange[0], value],
    }));
  };

  const handleMinPriceChange = (e) => {
    const value = parseInt(e.target.value);
    setFilters((prev) => ({
      ...prev,
      priceRange: [value, prev.priceRange[1]],
    }));
  };

  const clearFilters = () => {
    setFilters({
      nature: [],
      location: [],
      priceRange: [0, 1500000],
    });
    setLocationSearch('');
  };

  return (
    <aside className="w-full lg:w-64 bg-light-card border-b lg:border-b-0 lg:border-r border-border-light p-4 lg:p-5 fixed lg:static bottom-0 left-0 right-0 lg:h-[calc(100vh-80px)] h-auto lg:overflow-y-auto flex flex-col lg:max-h-[calc(100vh-80px)]">
      <div className="flex items-center mt-3 justify-between mb-4">
        <h2 className="text-base font-bold text-text-primary">Filters</h2>
        <button
          onClick={clearFilters}
          className="text-xs text-primary-orange hover:text-orange-hover font-semibold transition"
        >
          Clear
        </button>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-2">
          <FiDollarSign size={14} className="text-primary-orange" />
          Price Range (DT)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceRange[0]}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              if (val <= filters.priceRange[1]) {
                handleMinPriceChange(e);
              }
            }}
            className="w-1/2 px-3 py-1.5 bg-light-sidebar border border-border-light rounded text-text-primary text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceRange[1]}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1500000;
              if (val >= filters.priceRange[0]) {
                handlePriceChange(e);
              }
            }}
            className="w-1/2 px-3 py-1.5 bg-light-sidebar border border-border-light rounded text-text-primary text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all"
          />
        </div>
      </div>

      {/* Nature Filter */}
      <div className="mb-5">
        <h3 className="text-xs font-semibold text-text-primary mb-2">
          Nature of Post
        </h3>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {uniqueNatures.map((nature) => (
            <label
              key={nature}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.nature.includes(nature)}
                onChange={() => handleNatureToggle(nature)}
                className="w-3.5 h-3.5 text-primary-orange rounded border-border-light cursor-pointer"
              />
              <span className="text-xs text-text-primary group-hover:text-primary-orange transition">
                 {fixFrenchAccents(nature)}
               </span>
            </label>
          ))}
        </div>
      </div>

      {/* Location Filter */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-2">
          <FiMapPin size={14} className="text-primary-orange" />
          Search Location
        </label>
        
        <input
          type="text"
          placeholder="Type location name..."
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          className="w-full px-3 py-1.5 bg-light-sidebar border border-border-light rounded text-text-primary placeholder-text-secondary text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all"
        />

        {/* Suggestions */}
        {locationSearch && filteredLocations.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto bg-light-sidebar border border-border-light rounded">
            {filteredLocations.map(location => (
              <button
                key={location}
                onClick={() => handleLocationAdd(location)}
                className="w-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-light-card border-b border-border-light last:border-b-0 text-text-primary"
                >
                 + {fixFrenchAccents(location)}
                </button>
            ))}
          </div>
        )}

        {/* Selected Tags */}
        {filters.location.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {filters.location.map(location => (
              <div
                key={location}
                className="flex items-center gap-1 px-2 py-0.5 bg-primary-orange text-white rounded-full text-xs"
              >
                <span className="truncate max-w-20">{fixFrenchAccents(location)}</span>
                <button
                  onClick={() => handleLocationRemove(location)}
                  className="hover:opacity-80 transition-opacity flex-shrink-0"
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
