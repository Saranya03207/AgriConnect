import apiClient from '@/lib/axios';


const BASE = '/notifications';

export const notificationsService = {
  getAll: (cursor) =>
  apiClient.get(BASE, { params: { cursor } }),

  markRead: (id) =>
  apiClient.put(`${BASE}/${id}/read`),

  markAllRead: () =>
  apiClient.put(`${BASE}/read-all`),

  delete: (id) =>
  apiClient.delete(`${BASE}/${id}`)
};