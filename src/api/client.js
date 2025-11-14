const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  async getListings(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.nature && filters.nature.length > 0) {
      filters.nature.forEach(n => params.append('nature', n));
    }
    
    if (filters.location && filters.location.length > 0) {
      filters.location.forEach(l => params.append('location', l));
    }
    
    if (filters.priceRange) {
      if (filters.priceRange[0] > 0) {
        params.append('minPrice', filters.priceRange[0]);
      }
      if (filters.priceRange[1] < 1500000) {
        params.append('maxPrice', filters.priceRange[1]);
      }
    }

    const response = await fetch(`${API_URL}/listings?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch listings');
    return response.json();
  },

  async getListing(codAnn) {
    const response = await fetch(`${API_URL}/listings/${codAnn}`);
    if (!response.ok) throw new Error('Failed to fetch listing');
    return response.json();
  },

  async getListingById(codAnn) {
    const response = await fetch(`${API_URL}/listings/${codAnn}`);
    if (!response.ok) throw new Error('Failed to fetch listing');
    return response.json();
  },

  async getFilters() {
    const response = await fetch(`${API_URL}/filters`);
    if (!response.ok) throw new Error('Failed to fetch filters');
    return response.json();
  },

  async getStats() {
    const response = await fetch(`${API_URL}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async getHealth() {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error('Failed to reach server');
    return response.json();
  }
};
