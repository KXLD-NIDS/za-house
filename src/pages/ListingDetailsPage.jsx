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
      
      <div className="flex-1 p-3 lg:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Images Section */}
            <div className="lg:col-span-2">
              <div className="bg-light-sidebar rounded-lg overflow-hidden shadow-lg border border-border-light">
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
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition hover:scale-110"
                            title="Previous image"
                          >
                            <MdNavigateBefore size={24} />
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition hover:scale-110"
                            title="Next image"
                          >
                            <MdNavigateNext size={24} />
                          </button>
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white text-sm">
                            {currentImageIndex + 1} / {listing.image_urls.length}
                                </div>
                              </>
                            )}
                            </div>

                            {/* Thumbnail Gallery */}
                            {listing.image_urls.length > 1 && (
                            <div className="flex gap-2 p-3 overflow-x-auto bg-dark-bg/30 border-t border-border-light/30">
                              {listing.image_urls.map((url, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                                    currentImageIndex === idx
                                      ? 'border-primary-orange shadow-lg'
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
            <div className="bg-light-sidebar rounded-lg p-4 shadow-lg border border-border-light">
              {/* Badges */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className={`nature-badge ${getNatureBadgeStyles(listing.nature)} text-white text-xs font-semibold px-2.5 py-1 rounded`}>
                  {listing.nature}
                </span>
                {listing.is_professional && (
                  <span className="inline-block px-2.5 py-1 bg-primary-orange text-white text-xs font-semibold rounded">
                    Pro
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-text-primary mb-3 leading-tight">
                {listing.title}
              </h1>

              {/* Price */}
              <div className="mb-4 pb-4 border-b border-border-light/50">
                <p className="text-primary-orange text-5xl font-bold">
                  {price.toLocaleString()} <span className="text-xl">DT</span>
                </p>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border-light/50">
                <div className="bg-dark-bg/50 rounded p-2.5 flex items-start gap-2">
                  <FaHome className="text-primary-orange flex-shrink-0 mt-1" size={16} />
                  <div>
                    <p className="text-text-secondary text-xs uppercase tracking-wide">Type</p>
                    <p className="text-text-primary font-semibold text-sm mt-1">{listing.type}</p>
                  </div>
                </div>
                <div className="bg-dark-bg/50 rounded p-2.5 flex items-start gap-2">
                  <FaMapMarkerAlt className="text-primary-orange flex-shrink-0 mt-1" size={16} />
                  <div>
                    <p className="text-text-secondary text-xs uppercase tracking-wide">Location</p>
                    <p className="text-text-primary font-semibold text-sm mt-1">{listing.location}</p>
                  </div>
                </div>
                {listing.cod_ann && (
                  <div className="col-span-2 bg-dark-bg/50 rounded p-2.5 flex items-start gap-2">
                    <FaCheck className="text-primary-orange flex-shrink-0 mt-1" size={16} />
                    <div>
                      <p className="text-text-secondary text-xs uppercase tracking-wide">Listing ID</p>
                      <p className="text-text-primary font-semibold font-mono text-sm mt-1">
                        {listing.cod_ann}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Numbers */}
              {listing.phone_numbers && listing.phone_numbers.length > 0 && (
                <div className="space-y-2 mb-4 pb-4 border-b border-border-light/50">
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-primary-orange" size={16} />
                    <p className="text-text-secondary text-xs font-semibold uppercase tracking-wide">Contact Numbers</p>
                  </div>
                  <div className="space-y-1.5">
                    {listing.phone_numbers.map((phone, idx) => (
                      <a
                        key={idx}
                        href={`tel:${phone}`}
                        className="flex items-center gap-2 p-2 bg-dark-bg/50 rounded hover:bg-primary-orange/20 hover:border-primary-orange border border-transparent transition"
                      >
                        <FaPhone className="text-primary-orange flex-shrink-0" size={14} />
                        <p className="text-text-primary font-semibold text-sm">{phone}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-1.5 text-xs mb-4">
                {listing.date_modified && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FaCalendar className="text-primary-orange" size={14} />
                      <p className="text-text-secondary uppercase tracking-wide text-xs">Last Modified</p>
                    </div>
                    <p className="text-text-primary text-sm font-medium">{listing.date_modified}</p>
                  </div>
                )}
                {listing.scrape_date && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FaImage className="text-primary-orange" size={14} />
                      <p className="text-text-secondary uppercase tracking-wide text-xs">Scraped On</p>
                    </div>
                    <p className="text-text-primary text-sm font-medium">
                      {new Date(listing.scrape_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Original Link */}
              {listing.link && (
                <a
                  href={`${BASE_URL}${listing.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-gradient-to-r from-primary-orange to-orange-hover text-white text-center font-semibold rounded-lg hover:shadow-lg hover:scale-[1.02] transition text-sm"
                >
                  View on Tunisie Annonce →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
