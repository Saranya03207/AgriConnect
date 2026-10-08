import { authService } from '../auth/authService';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, statusCode, code = 'API_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Reusable API Client for AgriConnect
 * Automatically attaches Cognito Bearer token and handles structured errors & 401s
 */
async function request(endpoint, options = {}) {
  if (!API_BASE_URL) {
    throw new ApiError('VITE_API_BASE_URL is not configured', 500, 'CONFIG_ERROR');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach Cognito Token if authenticated
  const token = await authService.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);

    let responseData = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseData = await response.json().catch(() => null);
    } else {
      const text = await response.text();
      responseData = text ? { message: text } : null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized response
        const message = responseData?.error?.message || responseData?.message || 'Unauthorized session. Please log in again.';
        throw new ApiError(message, 401, 'UNAUTHORIZED', responseData);
      }

      const errorMessage =
        responseData?.error?.message ||
        responseData?.message ||
        `Request failed with status ${response.status}`;
      const errorCode = responseData?.error?.code || `HTTP_${response.status}`;

      throw new ApiError(errorMessage, response.status, errorCode, responseData?.error?.details || responseData);
    }

    return responseData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network request failed', 0, 'NETWORK_ERROR');
  }
}

export const apiClient = {
  get(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, data, options = {}) {
    return request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put(endpoint, data, options = {}) {
    return request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  patch(endpoint, data, options = {}) {
    return request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'DELETE' });
  },
};

export default apiClient;
