import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from './api/client';
import Header from './components/Header';
import FilterSidebar from './components/FilterSidebar';
import ListingsGrid from './components/ListingsGrid';
import ErrorBanner from './components/ErrorBanner';
import HeatmapPage from './pages/HeatmapPage';
import ListingDetailsPage from './pages/ListingDetailsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('listings');
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [selectedListingTitle, setSelectedListingTitle] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [paginationPage, setPaginationPage] = useState(1);
  const [filterOptionsLoaded, setFilterOptionsLoaded] = useState(false);
  const itemsPerPage = 25;

  // Fetch filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await apiClient.getFilters();
        // Use data from response regardless of success flag
        if (response.data) {
          const filterData = response.data;
          setFilterOptions(filterData);
          // Update filters with loaded price range
          setFilters(prev => ({
            ...prev,
            priceRange: [
              filterData.priceRange?.min ?? 0, 
              filterData.priceRange?.max ?? 1500000
            ]
          }));
        } else {
          // No data in response, use defaults
          setFilterOptions({
            natures: [],
            locations: [],
            priceRange: { min: 0, max: 1500000 }
          });
        }
      } catch (err) {
        console.error('Error loading filter options:', err);
        // Use default filter options, don't show error
        setFilterOptions({
          natures: [],
          locations: [],
          priceRange: { min: 0, max: 1500000 }
        });
      } finally {
        setFilterOptionsLoaded(true);
      }
    };
    loadFilterOptions();
  }, []);

  // Fetch listings when filters change (only after filter options are loaded)
  useEffect(() => {
    if (!filterOptionsLoaded) return;

    const loadListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getListings(filters);
        if (response.success) {
          setListings(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to load listings');
        }
      } catch (err) {
        console.error('Error loading listings:', err);
        setError(err.message || 'Failed to load listings. Make sure MongoDB is running on localhost:27017');
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [filters, filterOptionsLoaded]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPaginationPage(1); // Reset to first page when filters change
  }, []);

  const handleSelectListing = useCallback((listingId, title = null) => {
    setSelectedListingId(listingId);
    setSelectedListingTitle(title);
    setCurrentPage('listing-details');
  }, []);

  const handleNavigate = useCallback((page) => {
    if (page === 'listings') {
      setSelectedListingId(null);
      setCurrentPage('listings');
    } else {
      setCurrentPage(page);
    }
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(listings.length / itemsPerPage);
  const startIdx = (paginationPage - 1) * itemsPerPage;
  const paginatedListings = listings.slice(startIdx, startIdx + itemsPerPage);

  if (currentPage === 'heatmap') {
    return <HeatmapPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'listing-details' && selectedListingId) {
    return (
      <ListingDetailsPage
        listingId={selectedListingId}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Header currentPage={currentPage} onNavigate={handleNavigate} listingTitle={selectedListingTitle} />
      {error && <ErrorBanner message={error} />}

      <div className="flex flex-1 overflow-hidden">
        <FilterSidebar
          filters={filters}
          setFilters={handleFilterChange}
          uniqueNatures={filterOptions.natures}
          uniqueLocations={filterOptions.locations}
        />

        <main className="flex-1 p-4 lg:p-6 overflow-x-auto pb-32 lg:pb-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              Property Listings
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {loading ? 'Loading...' : `Found ${listings.length} properties`}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin">
                <svg className="w-8 h-8 text-blue-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-gray-400 mt-4">Loading properties...</p>
            </div>
          ) : (
            <>
              <ListingsGrid listings={paginatedListings} onSelectListing={handleSelectListing} />
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  {/* Previous Pages */}
                  <div className="flex gap-2">
                    {paginationPage > 2 && (
                      <>
                        <button
                          onClick={() => setPaginationPage(1)}
                          className="text-gray-600 hover:text-primary-orange transition font-medium"
                        >
                          {1}
                        </button>
                        {paginationPage > 3 && <span className="text-text-secondary">...</span>}
                      </>
                    )}
                    {paginationPage > 1 && (
                      <button
                        onClick={() => setPaginationPage(paginationPage - 1)}
                        className="text-gray-600 hover:text-primary-orange transition font-medium"
                      >
                        {paginationPage - 1}
                      </button>
                    )}
                  </div>
                  
                  {/* Back Arrow */}
                  <button
                    onClick={() => setPaginationPage(p => Math.max(1, p - 1))}
                    disabled={paginationPage === 1}
                    className="text-primary-orange hover:text-orange-hover disabled:text-gray-500 disabled:cursor-not-allowed transition text-xl"
                  >
                    ←
                  </button>
                  
                  {/* Current Page Display and Input */}
                  <div className="flex items-center gap-2 min-w-max">
                    <span className="text-text-primary text-sm">Page</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={paginationPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value) || 1;
                        setPaginationPage(Math.min(Math.max(1, page), totalPages));
                      }}
                      className="w-12 px-2 py-1 text-center bg-light-sidebar border border-border-light rounded text-primary-orange focus:outline-none focus:border-primary-orange font-semibold"
                    />
                    <span className="text-text-secondary text-sm">of {totalPages}</span>
                  </div>
                  
                  {/* Next Arrow */}
                  <button
                    onClick={() => setPaginationPage(p => Math.min(totalPages, p + 1))}
                    disabled={paginationPage === totalPages}
                    className="text-primary-orange hover:text-orange-hover disabled:text-gray-500 disabled:cursor-not-allowed transition text-xl"
                  >
                    →
                  </button>
                  
                  {/* Next Pages */}
                  <div className="flex gap-2">
                    {paginationPage < totalPages && (
                      <button
                        onClick={() => setPaginationPage(paginationPage + 1)}
                        className="text-gray-600 hover:text-primary-orange transition font-medium"
                      >
                        {paginationPage + 1}
                      </button>
                    )}
                    {paginationPage < totalPages - 1 && (
                      <>
                        {paginationPage < totalPages - 2 && <span className="text-text-secondary">...</span>}
                        <button
                          onClick={() => setPaginationPage(totalPages)}
                          className="text-gray-600 hover:text-primary-orange transition font-medium"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
