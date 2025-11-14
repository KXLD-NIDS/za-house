import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import Header from '../components/Header';
import { FaPhone, FaMapMarkerAlt, FaHome, FaCalendar, FaImage, FaCheck } from 'react-icons/fa';
import { MdNavigateNext, MdNavigateBefore } from 'react-icons/md';

const BASE_URL = 'http://www.tunisie-annonce.com/';

const getNatureBadgeStyles = (nature) => {
  const styles = {
    'Location': 'bg-orange-500',
    'Vente': 'bg-emerald-600',
    'Terrain': 'bg-amber-600',
    'Bureaux & Commer': 'bg-purple-600',
    'Location vacance': 'bg-pink-600',
  };
  return styles[nature] || 'bg-gray-600';
};

export default function ListingDetailsPage({ listingId, onNavigate }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const loadListing = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getListingById(listingId);
        if (response.success) {
          setListing(response.data);
        } else {
          setError(response.error || 'Failed to load listing');
        }
      } catch (err) {
        console.error('Error loading listing:', err);
        setError(err.message || 'Failed to load listing details');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [listingId]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? listing.image_urls.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === listing.image_urls.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col">
        <Header currentPage="listing-details" onNavigate={onNavigate} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <svg
                className="w-8 h-8 text-blue-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="text-gray-400">Loading listing details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col">
        <Header currentPage="listing-details" onNavigate={onNavigate} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Error Loading Listing
            </h2>
            <p className="text-gray-400">{error || 'Listing not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const price = parseInt(listing.price.replace(/\s/g, ''));

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Header currentPage="listing-details" onNavigate={onNavigate} listingTitle={listing.title} />
      
      <div className="flex-1 p-2 lg:p-3">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Images Section */}
            <div className="lg:col-span-2">
              <div className="bg-light-sidebar rounded-md overflow-hidden shadow-md border border-border-light">
                {listing.image_urls && listing.image_urls.length > 0 ? (
                  <>
                    <div className="relative w-full aspect-video bg-dark-bg flex items-center justify-center overflow-hidden">
                      <img
                        src={listing.image_urls[currentImageIndex]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Image Navigation */}
                      {listing.image_urls.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition hover:scale-110"
                            title="Previous image"
                          >
                            <MdNavigateBefore size={20} />
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition hover:scale-110"
                            title="Next image"
                          >
                            <MdNavigateNext size={20} />
                          </button>
                          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-2 py-0.5 rounded-full text-white text-xs">
                            {currentImageIndex + 1} / {listing.image_urls.length}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {listing.image_urls.length > 1 && (
                      <div className="flex gap-1.5 p-2 overflow-x-auto bg-dark-bg/30 border-t border-border-light/30">
                        {listing.image_urls.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition ${
                              currentImageIndex === idx
                                ? 'border-primary-orange shadow-md'
                                : 'border-border-light hover:border-primary-orange'
                            }`}
                          >
                            <img
                              src={url}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full aspect-video bg-light-sidebar flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-text-secondary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4.5-4.5 3 3 4.5-4.5V15z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-light-sidebar rounded-md p-3 shadow-md border border-border-light flex flex-col">
              {/* Badges */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                <span className={`nature-badge ${getNatureBadgeStyles(listing.nature)} text-white text-xs font-semibold px-2 py-0.5 rounded`}>
                  {listing.nature}
                </span>
                {listing.is_professional && (
                  <span className="inline-block px-2 py-0.5 bg-primary-orange text-white text-xs font-semibold rounded">
                    Pro
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-lg font-bold text-text-primary mb-2 leading-snug line-clamp-2">
                {listing.title}
              </h1>

              {/* Price */}
              <div className="mb-3 pb-3 border-b border-border-light/50">
                <p className="text-primary-orange text-3xl font-bold">
                  {price.toLocaleString()} <span className="text-sm">DT</span>
                </p>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b border-border-light/50">
                <div className="bg-dark-bg/50 rounded p-2 flex items-start gap-2">
                  <FaHome className="text-primary-orange flex-shrink-0 mt-0.5" size={14} />
                  <div className="min-w-0">
                    <p className="text-text-secondary text-xs uppercase tracking-wide leading-tight">Type</p>
                    <p className="text-text-primary font-semibold text-xs mt-0.5 truncate">{listing.type}</p>
                  </div>
                </div>
                <div className="bg-dark-bg/50 rounded p-2 flex items-start gap-2">
                  <FaMapMarkerAlt className="text-primary-orange flex-shrink-0 mt-0.5" size={14} />
                  <div className="min-w-0">
                    <p className="text-text-secondary text-xs uppercase tracking-wide leading-tight">Location</p>
                    <p className="text-text-primary font-semibold text-xs mt-0.5 truncate">{listing.location}</p>
                  </div>
                </div>
                {listing.cod_ann && (
                  <div className="col-span-2 bg-dark-bg/50 rounded p-2 flex items-start gap-2">
                    <FaCheck className="text-primary-orange flex-shrink-0 mt-0.5" size={14} />
                    <div className="min-w-0">
                      <p className="text-text-secondary text-xs uppercase tracking-wide leading-tight">ID</p>
                      <p className="text-text-primary font-semibold font-mono text-xs mt-0.5 truncate">
                        {listing.cod_ann}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Numbers */}
              {listing.phone_numbers && listing.phone_numbers.length > 0 && (
                <div className="space-y-1.5 mb-3 pb-3 border-b border-border-light/50">
                  <div className="flex items-center gap-1.5">
                    <FaPhone className="text-primary-orange flex-shrink-0" size={13} />
                    <p className="text-text-secondary text-xs font-semibold uppercase tracking-wide">Contact</p>
                  </div>
                  <div className="space-y-1">
                    {listing.phone_numbers.map((phone, idx) => (
                      <a
                        key={idx}
                        href={`tel:${phone}`}
                        className="flex items-center gap-2 p-1.5 bg-dark-bg/50 rounded hover:bg-primary-orange/20 border border-transparent hover:border-primary-orange transition text-xs truncate"
                      >
                        <FaPhone className="text-primary-orange flex-shrink-0" size={12} />
                        <span className="text-text-primary font-semibold truncate">{phone}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-1 text-xs mb-3 pb-3 border-b border-border-light/50">
                {listing.date_modified && (
                  <div className="flex justify-between items-center gap-1">
                    <div className="flex items-center gap-1 text-text-secondary uppercase tracking-wide whitespace-nowrap">
                      <FaCalendar size={12} />
                      <span className="text-xs">Modified</span>
                    </div>
                    <span className="text-text-primary font-medium text-xs">{listing.date_modified}</span>
                  </div>
                )}
                {listing.scrape_date && (
                  <div className="flex justify-between items-center gap-1">
                    <div className="flex items-center gap-1 text-text-secondary uppercase tracking-wide whitespace-nowrap">
                      <FaImage size={12} />
                      <span className="text-xs">Scraped</span>
                    </div>
                    <span className="text-text-primary font-medium text-xs">
                      {new Date(listing.scrape_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Original Link */}
              {listing.link && (
                <a
                  href={`${BASE_URL}${listing.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full py-2 bg-gradient-to-r from-primary-orange to-orange-hover text-white text-center font-semibold rounded hover:shadow-lg hover:scale-[1.02] transition text-xs"
                >
                  View Original →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
