import React from 'react';
import ListingCard from './ListingCard';

export default function ListingsGrid({ listings, onSelectListing }) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">🏚️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          No properties found
        </h3>
        <p className="text-gray-600 text-sm">
          Try adjusting your filters to see more results
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
      {listings.map((listing) => (
        <ListingCard
          key={listing.cod_ann}
          listing={listing}
          onSelectListing={onSelectListing}
        />
      ))}
    </div>
  );
}
