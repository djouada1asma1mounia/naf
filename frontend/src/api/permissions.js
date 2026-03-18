import axiosInstance from './axios';

export const permissionsAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/permissions');
      return response?.data?.data || [];
    } catch {
      return [];
    }
  },
};
