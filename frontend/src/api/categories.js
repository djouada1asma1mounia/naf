import axiosInstance from './axios';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

export const categoriesAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/categories');
      return response?.data?.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement des catégories.'));
    }
  },

  create: async (data) => {
    try {
      const payload = { name: data?.name };
      const response = await axiosInstance.post('/categories', payload);
      return response?.data?.data || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la création de la catégorie.'));
    }
  },

  update: async (id, data) => {
    try {
      const payload = { name: data?.name };
      const response = await axiosInstance.patch(`/categories/${id}`, payload);
      return response?.data?.data || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la modification de la catégorie.'));
    }
  },

  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la suppression de la catégorie.'));
    }
  },
};
