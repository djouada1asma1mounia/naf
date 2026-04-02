import axiosInstance from './axios';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

const normalizeService = (item = {}) => ({
  id: item?.id,
  name: item?.name || '',
  code: item?.code || '',
  departmentId: item?.department?.id || null,
  departmentName: item?.department?.name || '',
  departmentCode: item?.department?.code || '',
});

const toIntOrUndefined = (value) => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const buildPayload = (data = {}) => ({
  name: String(data?.name || '').trim(),
  code: String(data?.code || '').trim().toUpperCase(),
  departmentId: toIntOrUndefined(data?.departmentId),
});

export const servicesAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/services');
      const rawItems = response?.data?.data || [];
      return rawItems.map(normalizeService);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement des services.'));
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/services/${id}`);
      return normalizeService(response?.data?.data || response?.data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Service introuvable.'));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosInstance.post('/services', buildPayload(data));
      return normalizeService(response?.data?.data || response?.data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la création du service.'));
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosInstance.patch(`/services/${id}`, buildPayload(data));
      return normalizeService(response?.data?.data || response?.data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la modification du service.'));
    }
  },

  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/services/${id}`);
      return response?.data || { success: true };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la suppression du service.'));
    }
  },
};
