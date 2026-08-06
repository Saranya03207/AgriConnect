import { useState, useCallback } from 'react';
import { PAGINATION_LIMIT } from '@/constants';
















export function usePagination(initialLimit = PAGINATION_LIMIT) {
  const [state, setState] = useState({
    page: 1,
    limit: initialLimit,
    lastEvaluatedKey: undefined,
    hasMore: false
  });

  const nextPage = useCallback((key) => {
    setState((prev) => ({
      ...prev,
      page: prev.page + 1,
      lastEvaluatedKey: key
    }));
  }, []);

  const prevPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1)
    }));
  }, []);

  const reset = useCallback(() => {
    setState({ page: 1, limit: initialLimit, lastEvaluatedKey: undefined, hasMore: false });
  }, [initialLimit]);

  const setHasMore = useCallback((v) => {
    setState((prev) => ({ ...prev, hasMore: v }));
  }, []);

  const setCursor = useCallback((key) => {
    setState((prev) => ({ ...prev, lastEvaluatedKey: key }));
  }, []);

  return { ...state, nextPage, prevPage, reset, setHasMore, setCursor };
}