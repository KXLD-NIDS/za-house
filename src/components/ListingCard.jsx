import React, { useState } from 'react';
import { fixFrenchAccents, getDaysAgoText } from '../utils/textFormatter';

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

const getPriceColor = (price) => {
  if (price < 1000) return 'text-green-600';
  if (price < 100000) return 'text-orange-600';
  return 'text-orange-700';
};

export default function ListingCard({ listing, onSelectListing }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const price = parseInt(listing.price.replace(/\s/g, ''));
  const priceColor = getPriceColor(price);

  // Get first image URL and prepend base URL
  const imageUrl = listing.image_urls && listing.image_urls.length > 0 
    ? listing.image_urls[0]
    : null;

  return (
    <div
      className="listing-card cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
      onClick={() => onSelectListing(listing.cod_ann, listing.title)}
    >
      {/* Image */}
      <div className="w-full h-32 bg-light-sidebar relative overflow-hidden">
         {imageUrl && !imageError ? (
           <img
             src={imageUrl}
             alt={listing.title}
             onLoad={() => setImageLoaded(true)}
             onError={() => setImageError(true)}
             className={`w-full h-full object-cover transition-opacity ${
               imageLoaded ? 'opacity-100' : 'opacity-0'
             }`}
           />
         ) : null}
         {!imageUrl || !imageLoaded || imageError ? (
           <div className="w-full h-full flex items-center justify-center bg-light-sidebar">
             <svg
               className="w-8 h-8 text-text-secondary"
               fill="currentColor"
               viewBox="0 0 20 20"
             >
               <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4.5-4.5 3 3 4.5-4.5V15z" />
             </svg>
           </div>
         ) : null}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <span className={`nature-badge ${getNatureBadgeStyles(listing.nature)}`}>
            {fixFrenchAccents(listing.nature)}
          </span>
          {listing.is_professional && (
            <span className="inline-block px-1.5 py-0.5 bg-primary-orange text-white text-xs font-semibold rounded">
              Pro
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
         <h3 className="font-semibold text-text-primary text-sm line-clamp-2 mb-2">
            {fixFrenchAccents(listing.title)}
          </h3>

         {/* Type and Location */}
         <div className="flex gap-1.5 mb-2 flex-wrap">
           <span className="location-tag">{fixFrenchAccents(listing.type)}</span>
           <span className="location-tag">{fixFrenchAccents(listing.location)}</span>
         </div>

        {/* Price */}
        <div className="mb-2">
          <p className={`text-lg font-bold ${priceColor}`}>
            {price.toLocaleString()} <span className="text-xs">DT</span>
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border-light">
          <span className="text-xs text-text-secondary">
            {getDaysAgoText(listing.date_modified)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectListing(listing.cod_ann, listing.title);
            }}
            className="text-xs font-semibold text-primary-orange hover:text-orange-hover transition"
          >
            View →
          </button>
        </div>
      </div>
    </div>
  );
}
