import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin } from 'react-icons/fi';

function TunisiaMap({ listings, filters }) {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  // Filter listings based on current filters
  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      if (filters?.location?.length > 0 && !filters.location.includes(listing.location)) {
        return false;
      }

      if (filters?.priceRange) {
        const price = parseInt(listing.price.replace(/\s/g, ''));
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
          return false;
        }
      }

      return true;
    });
  }, [listings, filters]);

  const locationCounts = useMemo(() => {
    const counts = {};
    filteredListings.forEach(listing => {
      const loc = listing.location;
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return counts;
  }, [filteredListings]);

  const regionMapping = {
    'Tunis': ['Republique', 'La Marsa', 'Rades', 'Carthage'],
    'Ariana': ['Ariana'],
    'Ben Arous': ['Le Bardo', 'Ben Arous'],
    'Manouba': ['Manouba'],
    'Sfax': ['Sfax'],
    'Sousse': ['Sousse', 'Hammamet'],
    'Kairouan': ['Kairouan'],
    'Kasserine': ['Kasserine'],
    'Sidi Bouzid': ['Sidi Bouzid'],
    'Gafsa': ['Gafsa'],
    'Tozeur': ['Tozeur'],
    'Kebili': ['Kebili'],
    'Tataouine': ['Tataouine'],
    'Medenine': ['Medenine'],
    'Djerba': ['Djerba', 'Houmt Souk'],
    'Gabes': ['Gabes'],
    'Monastir': ['Monastir', 'Skanes'],
    'Nabeul': ['Nabeul', 'Korba'],
    'Mahdia': ['Mahdia'],
    'Siliana': ['Siliana'],
    'Jendouba': ['Jendouba'],
    'Kef': ['Kef'],
    'Bizerte': ['Bizerte'],
  };

  const regionCounts = useMemo(() => {
    const counts = {};
    Object.entries(regionMapping).forEach(([region, locations]) => {
      counts[region] = 0;
      locations.forEach(loc => {
        if (locationCounts[loc]) {
          counts[region] += locationCounts[loc];
        }
      });
    });
    return counts;
  }, [locationCounts]);

  const maxCount = Math.max(...Object.values(regionCounts), 1);

  const getColor = (count) => {
    if (count === 0) return '#E5E7EB';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.33) return '#FED7AA';
    if (intensity < 0.66) return '#FB923C';
    return '#EA580C';
  };

  // Region marker positions (lat/lng for Tunisia)
  const regionMarkers = [
    { name: 'Bizerte', lat: 37.27, lng: 9.87 },
    { name: 'Jendouba', lat: 36.5, lng: 8.78 },
    { name: 'Kef', lat: 36.17, lng: 8.71 },
    { name: 'Siliana', lat: 36.33, lng: 9.37 },
    { name: 'Manouba', lat: 36.87, lng: 10.0 },
    { name: 'Ariana', lat: 36.88, lng: 10.2 },
    { name: 'Tunis', lat: 36.8, lng: 10.2 },
    { name: 'Ben Arous', lat: 36.65, lng: 10.3 },
    { name: 'Nabeul', lat: 36.45, lng: 10.73 },
    { name: 'Monastir', lat: 35.77, lng: 10.81 },
    { name: 'Sousse', lat: 35.83, lng: 10.63 },
    { name: 'Mahdia', lat: 35.5, lng: 11.06 },
    { name: 'Kairouan', lat: 35.68, lng: 10.1 },
    { name: 'Kasserine', lat: 35.17, lng: 9.44 },
    { name: 'Sidi Bouzid', lat: 35.04, lng: 9.5 },
    { name: 'Sfax', lat: 34.75, lng: 10.76 },
    { name: 'Gafsa', lat: 34.43, lng: 8.78 },
    { name: 'Tozeur', lat: 33.92, lng: 8.13 },
    { name: 'Kebili', lat: 33.73, lng: 8.97 },
    { name: 'Gabes', lat: 33.88, lng: 10.1 },
    { name: 'Medenine', lat: 33.36, lng: 10.51 },
    { name: 'Tataouine', lat: 32.93, lng: 10.45 },
    { name: 'Djerba', lat: 33.5, lng: 11.3 },
  ];

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView([35.0, 9.5], 7);

    // Minimal baselayer without roads
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
      maxZoom: 19,
    }).addTo(map.current);

    // Add labels separately for better control
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
      maxZoom: 19,
      pane: 'overlayPane',
    }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.off();
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    regionMarkers.forEach(region => {
      const count = regionCounts[region.name] || 0;

      const markerHtml = `
        <svg width="36" height="44" viewBox="0 0 36 44" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.2)); cursor: pointer; transition: transform 0.2s ease;">
          <path d="M18 0C9.7 0 3 6.7 3 15c0 9 15 29 15 29s15-20 15-29c0-8.3-6.7-15-15-15z" fill="${getColor(count)}" stroke="white" stroke-width="2"/>
          <circle cx="18" cy="14" r="5" fill="white" opacity="0.9"/>
        </svg>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-marker-icon',
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([region.lat, region.lng], { icon: customIcon })
        .bindPopup(`<div class="text-center"><strong>${region.name}</strong><br/><span style="font-size: 14px; font-weight: bold;">${count}</span> listings</div>`)
        .addTo(map.current);

      marker.on('mouseover', () => {
        setHoveredRegion(region.name);
        const element = marker.getElement();
        if (element) {
          const svg = element.querySelector('svg');
          if (svg) svg.style.transform = 'scale(1.25)';
        }
      });
      marker.on('mouseout', () => {
        setHoveredRegion(null);
        const element = marker.getElement();
        if (element) {
          const svg = element.querySelector('svg');
          if (svg) svg.style.transform = 'scale(1)';
        }
      });

      markersRef.current.push(marker);
    });
  }, [regionCounts, regionMarkers, maxCount]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-1 flex-shrink-0">
        <h3 className="text-sm font-bold text-primary-orange">Tunisia Map</h3>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Map */}
        <div className="flex-1 rounded overflow-hidden bg-gray-100 w-full" ref={mapContainer} />

        {/* Legend and Top Regions */}
        <div className="lg:w-40 space-y-2 flex flex-col min-h-0 flex-shrink-0">
          {/* Legend */}
          <div className="bg-light-sidebar rounded-lg p-2 flex-shrink-0">
            <h4 className="font-semibold text-text-primary mb-1 text-xs">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-300 flex-shrink-0"></div>
                <span className="text-text-secondary">No listings</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#FED7AA' }}></div>
                <span className="text-text-secondary">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#FB923C' }}></div>
                <span className="text-text-secondary">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#EA580C' }}></div>
                <span className="text-text-secondary">High</span>
              </div>
            </div>
          </div>

          {/* Top Regions */}
          <div className="bg-light-sidebar rounded-lg p-2 flex-1 min-h-0 flex flex-col overflow-hidden">
            <h4 className="font-semibold text-text-primary mb-1 text-xs flex-shrink-0">Top Regions</h4>
            <div className="space-y-0.5 overflow-y-auto flex-1 min-h-0">
              {Object.entries(regionCounts)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([region, count], idx) => (
                  <div
                    key={region}
                    className={`p-0.5 px-2 rounded text-xs cursor-pointer transition-all ${
                      hoveredRegion === region
                        ? 'bg-primary-orange text-white'
                        : 'bg-light-card text-text-primary hover:bg-light-card'
                    }`}
                    onMouseEnter={() => setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium truncate text-xs">{idx + 1}. {region}</span>
                      <span className="font-bold flex-shrink-0 text-xs">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-1 pt-1 border-t border-border-light flex justify-between text-xs text-text-secondary flex-shrink-0">
        <div>Regions: {Object.values(regionCounts).filter(c => c > 0).length}</div>
        <div>Listings: {filteredListings.length}{listings.length !== filteredListings.length && ` / ${listings.length}`}</div>
      </div>
    </div>
  );
}

export default memo(TunisiaMap);
