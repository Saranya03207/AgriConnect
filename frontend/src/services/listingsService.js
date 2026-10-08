import { apiClient } from './apiClient';

/**
 * Service managing Agricultural Marketplace Listings
 * Connects to Amazon API Gateway listings endpoints
 */
export const listingsService = {
  /**
   * Retrieves active listings with optional query filtering.
   * Backend parameters: category, district, state, sellerRole, status, limit
   * Defaults to status=ACTIVE and limit=20
   */
  async getListings(params = {}) {
    const query = new URLSearchParams();

    // Default status to ACTIVE unless specifically specified
    const status = params.status !== undefined && params.status !== '' ? params.status : 'ACTIVE';
    if (status && status !== 'ALL') {
      query.set('status', status);
    }

    const limit = params.limit || 20;
    query.set('limit', String(limit));

    if (params.category) query.set('category', params.category);
    if (params.district) query.set('district', params.district);
    if (params.state) query.set('state', params.state);
    if (params.sellerRole) query.set('sellerRole', params.sellerRole);

    const queryString = query.toString();
    const endpoint = queryString ? `/listings?${queryString}` : '/listings';

    const response = await apiClient.get(endpoint);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response || { listings: [], count: 0 };
  },

  /**
   * Retrieves a single listing by listingId. Public endpoint.
   */
  async getListingById(listingId) {
    if (!listingId) throw new Error('Listing ID is required');
    const response = await apiClient.get(`/listings/${encodeURIComponent(listingId)}`);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },

  /**
   * Creates a new listing.
   * Requires authenticated Cognito JWT (Bearer token attached by apiClient).
   */
  async createListing(listingData) {
    const response = await apiClient.post('/listings', listingData);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },

  /**
   * Updates an existing listing.
   * Requires authenticated Cognito JWT and owner authorization.
   */
  async updateListing(listingId, updates) {
    if (!listingId) throw new Error('Listing ID is required');
    const response = await apiClient.put(`/listings/${encodeURIComponent(listingId)}`, updates);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },

  /**
   * Deletes a listing.
   * Requires authenticated Cognito JWT and owner authorization.
   */
  async deleteListing(listingId) {
    if (!listingId) throw new Error('Listing ID is required');
    const response = await apiClient.delete(`/listings/${encodeURIComponent(listingId)}`);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },
};

export default listingsService;
