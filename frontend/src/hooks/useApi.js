import { useState, useCallback } from 'react';
import apiClient from '@/lib/axios';














export function useApi() {
  const [state, setState] = useState({
    data: null,
    isLoading: false,
    error: null
  });

  const execute = useCallback(async (config) => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const response = await apiClient(config);
      setState({ data: response.data.data, isLoading: false, error: null });
      return response.data.data;
    } catch (err) {
      const apiError = err?.response?.data ?? {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN',
        statusCode: 500
      };
      setState({ data: null, isLoading: false, error: apiError });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}