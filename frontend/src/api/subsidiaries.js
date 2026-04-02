import axiosInstance from './axios';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

const normalizeSubsidiary = (item = {}) => ({
  code: item?.code || '',
  name: item?.name || '',
});

const buildPayload = (data = {}) => ({
  code: String(data?.code || '').trim().toUpperCase(),
  name: String(data?.name || '').trim(),
});

export const subsidiariesAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/subsidiaries');
      const rawItems = response?.data?.data || [];
      return rawItems.map(normalizeSubsidiary);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement des raisons.'));
    }
  },

  getByCode: async (code) => {
    try {
      const response = await axiosInstance.get(`/subsidiaries/${code}`);
      return normalizeSubsidiary(response?.data?.data || response?.data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Raison introuvable.'));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosInstance.post('/subsidiaries', buildPayload(data));
      return normalizeSubsidiary(response?.data?.data || response?.data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la création de la raison.'));
    }
  },

  update: async (code, data) => {
    try {
      const response = await axiosInstance.patch(`/subsidiaries/${code}`, buildPayload(data));
      return normalizeSubsidiary(response?.data?.data || response?.data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la modification de la raison.'));
    }
  },

  delete: async (code) => {
    try {
      const response = await axiosInstance.delete(`/subsidiaries/${code}`);
      return response?.data || { success: true };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la suppression de la raison.'));
    }
  },
};
