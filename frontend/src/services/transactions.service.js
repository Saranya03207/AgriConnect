import apiClient from '@/lib/axios';

export const createTransaction = async (data) => {
  const { data: resp } = await apiClient.post('/transactions', data);
  return resp;
};

export const getMyTransactions = async () => {
  const { data } = await apiClient.get('/transactions');
  return data.data?.items || [];
};

export const updateTransactionStatus = async (transactionId, status) => {
  const { data } = await apiClient.put(`/transactions/${transactionId}/status`, { status });
  return data;
};