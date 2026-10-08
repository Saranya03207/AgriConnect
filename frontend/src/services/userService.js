import { apiClient } from './apiClient';

export const userService = {
  /**
   * Calls GET /users/me to fetch authenticated user profile from DynamoDB via Lambda
   */
  async getMe() {
    const response = await apiClient.get('/users/me');
    // If wrapped in { success: true, data: { ... } }, unwrap data
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },

  /**
   * Calls PUT /users/me to update user profile
   */
  async updateMe(updates) {
    const response = await apiClient.put('/users/me', updates);
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },
};

export default userService;
