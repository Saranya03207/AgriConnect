import { apiClient } from './apiClient';

/**
 * Service managing AgriConnect Procurement Requests (RFQ) and Quotation Responses.
 * Connects to Amazon API Gateway /procurement endpoints.
 * Automatically attaches Cognito Bearer token via apiClient.
 */
export const procurementService = {
  /**
   * Retrieves marketplace RFQs with optional filtering.
   * Query params: status (default 'OPEN'), productCategory, preferredState, preferredDistrict, limit, cursor.
   */
  async getRFQs(params = {}) {
    const query = new URLSearchParams();

    const status = params.status !== undefined && params.status !== '' ? params.status : 'OPEN';
    if (status && status !== 'ALL') {
      query.set('status', status);
    }

    const limit = params.limit || 20;
    query.set('limit', String(limit));

    if (params.productCategory) query.set('productCategory', params.productCategory);
    if (params.preferredState) query.set('preferredState', params.preferredState);
    if (params.preferredDistrict) query.set('preferredDistrict', params.preferredDistrict);
    if (params.cursor) query.set('cursor', params.cursor);

    const queryString = query.toString();
    const endpoint = queryString ? `/procurement/requests?${queryString}` : '/procurement/requests';

    const response = await apiClient.get(endpoint);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response || { items: [], totalCount: 0 };
  },

  /**
   * Retrieves single RFQ details by rfqId.
   * If current user is buyer/owner or admin, includes responses.
   */
  async getRFQById(rfqId) {
    if (!rfqId) throw new Error('RFQ ID is required');
    const response = await apiClient.get(`/procurement/requests/${encodeURIComponent(rfqId)}`);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },

  /**
   * Creates a new RFQ.
   * Authenticated user role must be BUYER, PROCESSOR, or ADMIN.
   */
  async createRFQ(rfqData) {
    const response = await apiClient.post('/procurement/requests', rfqData);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },

  /**
   * Updates an OPEN RFQ.
   * Allowed only for the RFQ owner or ADMIN.
   */
  async updateRFQ(rfqId, updates) {
    if (!rfqId) throw new Error('RFQ ID is required');
    const response = await apiClient.put(`/procurement/requests/${encodeURIComponent(rfqId)}`, updates);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },

  /**
   * Cancels an OPEN RFQ.
   * Allowed only for the RFQ owner or ADMIN.
   */
  async cancelRFQ(rfqId) {
    if (!rfqId) throw new Error('RFQ ID is required');
    const response = await apiClient.post(`/procurement/requests/${encodeURIComponent(rfqId)}/cancel`, {});
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },

  /**
   * Retrieves RFQs created by current authenticated user.
   */
  async getMyRFQs(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.cursor) query.set('cursor', params.cursor);

    const queryString = query.toString();
    const endpoint = queryString ? `/procurement/my-requests?${queryString}` : '/procurement/my-requests';

    const response = await apiClient.get(endpoint);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response || { items: [], totalCount: 0 };
  },

  /**
   * Submits a seller quotation response for an OPEN RFQ.
   */
  async submitQuotation(rfqId, quotationData) {
    if (!rfqId) throw new Error('RFQ ID is required');
    const response = await apiClient.post(`/procurement/requests/${encodeURIComponent(rfqId)}/responses`, quotationData);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },

  /**
   * Retrieves all quotations submitted for an RFQ.
   * Allowed only for the RFQ owner or ADMIN.
   */
  async getRFQResponses(rfqId) {
    if (!rfqId) throw new Error('RFQ ID is required');
    const response = await apiClient.get(`/procurement/requests/${encodeURIComponent(rfqId)}/responses`);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response || { items: [], totalCount: 0 };
  },

  /**
   * Retrieves quotations submitted by current authenticated user.
   */
  async getMyResponses(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.cursor) query.set('cursor', params.cursor);

    const queryString = query.toString();
    const endpoint = queryString ? `/procurement/my-responses?${queryString}` : '/procurement/my-responses';

    const response = await apiClient.get(endpoint);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response || { items: [], totalCount: 0 };
  },

  /**
   * Withdraws a previously submitted quotation.
   * Allowed only for the quotation seller or ADMIN.
   */
  async withdrawResponse(responseId) {
    if (!responseId) throw new Error('Response ID is required');
    const response = await apiClient.post(`/procurement/responses/${encodeURIComponent(responseId)}/withdraw`, {});
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },

  /**
   * Accepts a quotation for an OPEN RFQ.
   * Sets response to ACCEPTED, other responses to REJECTED, RFQ to FULFILLED.
   * Allowed only for the RFQ owner or ADMIN.
   */
  async acceptResponse(responseId) {
    if (!responseId) throw new Error('Response ID is required');
    const response = await apiClient.post(`/procurement/responses/${encodeURIComponent(responseId)}/accept`, {});
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },
};

export default procurementService;
