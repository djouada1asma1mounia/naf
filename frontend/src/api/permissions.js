import axiosInstance from './axios';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

export const permissionsAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/permissions');
      return response?.data?.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement des permissions.'));
    }
  },
};
