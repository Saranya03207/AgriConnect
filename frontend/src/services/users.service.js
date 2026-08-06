import apiClient from '@/lib/axios';


const BASE = '/users';

export const usersService = {
  getMe: () =>
  apiClient.get(`${BASE}/me`),

  updateMe: (updates) =>
  apiClient.put(`${BASE}/me`, updates),

  getAvatarUploadUrl: (contentType, extension) => 
    apiClient.post(`${BASE}/upload-avatar`, { contentType, extension }),

  uploadToS3: (url, file) => {
    return fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  },

  getById: (userId) =>
  apiClient.get(`${BASE}/${userId}`),

  getAll: (cursor) =>
  apiClient.get(BASE, {
    params: { cursor }
  }),

  updateStatus: (userId, status) =>
  apiClient.put(`${BASE}/${userId}/status`, { status })
};