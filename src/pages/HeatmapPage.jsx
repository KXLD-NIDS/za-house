import React, { useState, useEffect } from 'react';
import { FiMapPin, FiDollarSign, FiX } from 'react-icons/fi';
import { apiClient } from '../api/client';
import Header from '../components/Header';
import HeatmapVisualization from '../components/HeatmapVisualization';
import TunisiaMap from '../components/TunisiaTunsiaMap';
import ErrorBanner from '../components/ErrorBanner';

export default function HeatmapPage({ onNavigate }) {
  const [allListings, setAllListings] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [filters, setFilters] = useState({
    nature: [],
    location: [],
    priceRange: [0, 1500000],
  });
  const [filterOptions, setFilterOptions] = useState({
    natures: [],
    locations: [],
    priceRange: { min: 0, max: 1500000 }
  });

  // Fetch all data once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch filter options
        const filterResponse = await apiClient.getFilters();
        if (filterResponse.success) {
          setFilterOptions(filterResponse.data);
          setFilters(prev => ({
            ...prev,
            priceRange: [filterResponse.data.priceRange.min, filterResponse.data.priceRange.max]
          }));
        }
        
        // Fetch all listings
        const listingsResponse = await apiClient.getListings({});
        if (listingsResponse.success) {
          setAllListings(listingsResponse.data);
          setListings(listingsResponse.data);
        } else {
          setError(listingsResponse.error || 'Failed to load listings');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Apply filters to allListings in real-time
  useEffect(() => {
    if (allListings.length === 0) return;
    
    const filtered = allListings.filter(listing => {
      // Filter by location
      if (filters.location.length > 0 && !filters.location.includes(listing.location)) {
        return false;
      }
      
      // Filter by price range
      const price = parseInt(listing.price.replace(/\s/g, ''));
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }
      
      return true;
    });
    
    setListings(filtered);
  }, [filters, allListings]);

  const handlePriceRangeChange = (newRange) => {
    setFilters(prev => ({
      ...prev,
      priceRange: newRange
    }));
  };

  const handleLocationChange = (selectedLocations) => {
    setFilters(prev => ({
      ...prev,
      location: selectedLocations
    }));
  };



  const filteredLocations = filterOptions.locations.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-light-bg flex flex-col">
      <Header currentPage="heatmap" onNavigate={onNavigate} />
      {error && <ErrorBanner message={error} />}

      <main className="flex-1 w-full overflow-hidden flex flex-col px-6 py-1 pb-6">
        {/* Title */}
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-primary-orange mb-1">
            Rental Concentration Heatmap
          </h1>
          <p className="text-text-secondary text-sm">
            Visualize listings across regions and price ranges
          </p>
        </div>

        {/* Sidebar + Main Content */}
        <div className="flex-1 overflow-hidden flex flex-row gap-6 min-h-0">
          {/* Sidebar - Filters */}
          <div className="w-64 bg-light-card border border-border-light rounded-lg p-4 flex-shrink-0 overflow-y-auto">
            <h2 className="text-lg font-bold text-primary-orange mb-4">Filters</h2>
            
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
                      handlePriceRangeChange([val, filters.priceRange[1]]);
                    }
                  }}
                  className="w-1/2 px-3 py-1.5 bg-light-sidebar border border-border-light rounded text-text-primary text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange[1]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || filterOptions.priceRange.max;
                    if (val >= filters.priceRange[0]) {
                      handlePriceRangeChange([filters.priceRange[0], val]);
                    }
                  }}
                  className="w-1/2 px-3 py-1.5 bg-light-sidebar border border-border-light rounded text-text-primary text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all"
                />
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
                      onClick={() => {
                        if (!filters.location.includes(location)) {
                          handleLocationChange([...filters.location, location]);
                        }
                        setLocationSearch('');
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-light-card border-b border-border-light last:border-b-0 text-text-primary"
                    >
                      + {location}
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
                      <span className="truncate max-w-20">{location}</span>
                      <button
                        onClick={() =>
                          handleLocationChange(filters.location.filter(l => l !== location))
                        }
                        className="hover:opacity-80 transition-opacity flex-shrink-0"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Map + Heatmap Grid */}
            <div className="flex gap-3 flex-1 min-h-0">
              {/* Tunisia Map - 2/3 width */}
              <div className="w-2/3 bg-light-card border border-border-light rounded-lg p-2 min-h-0">
                {loading ? (
                  <div className="text-center py-8 h-full flex items-center justify-center">
                    <div>
                      <div className="inline-block animate-spin">
                        <svg className="w-8 h-8 text-primary-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <p className="text-text-secondary mt-2 text-sm">Loading map...</p>
                    </div>
                  </div>
                ) : (
                  <TunisiaMap listings={listings} filters={filters} />
                )}
              </div>

              {/* Heatmap Graph - 1/3 width */}
              <div className="w-1/3 bg-light-card border border-border-light rounded-lg p-2 min-h-0 overflow-auto">
                {loading ? (
                  <div className="text-center py-8 h-full flex items-center justify-center">
                    <div>
                      <div className="inline-block animate-spin">
                        <svg className="w-8 h-8 text-primary-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <p className="text-text-secondary mt-2 text-sm">Loading heatmap...</p>
                    </div>
                  </div>
                ) : (
                  <HeatmapVisualization 
                    listings={listings} 
                    priceRange={filters.priceRange}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
