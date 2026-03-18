import axiosInstance from './axios';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

export const rolesAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/roles');
      return response?.data?.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement des rôles.'));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosInstance.post('/roles', data);
      return response?.data?.data || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la création du rôle.'));
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosInstance.patch(`/roles/${id}`, data);
      return response?.data?.data || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la modification du rôle.'));
    }
  },

  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/roles/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la suppression du rôle.'));
    }
  },
};
