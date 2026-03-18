import axiosInstance from './axios';
import { authAPI } from './auth';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

export const structuresAPI = {
  getDepartments: async () => {
    try {
      const response = await axiosInstance.get('/departments');
      return response?.data?.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement des départements.'));
    }
  },

  getDepartmentById: async (id) => {
    try {
      const response = await axiosInstance.get(`/departments/${id}`);
      return response?.data?.data || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Département non trouvé.'));
    }
  },

  createDepartment: async (data) => {
    try {
      const payload = {
        name: data.name,
        code: data.code,
      };
      if (data.managerId) payload.managerId = data.managerId;

      const response = await axiosInstance.post('/departments', payload);
      return response?.data?.data || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la création du département.'));
    }
  },

  updateDepartment: async (id, data) => {
    try {
      const payload = {
        name: data.name,
        code: data.code,
        managerId: data.managerId || null,
      };
      const response = await axiosInstance.patch(`/departments/${id}`, payload);
      return response?.data?.data || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la modification du département.'));
    }
  },

  deleteDepartment: async (id) => {
    try {
      const response = await axiosInstance.delete(`/departments/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la suppression du département.'));
    }
  },

  getStaff: async (departmentId) => {
    try {
      const users = await authAPI.getUsers();
      if (departmentId === undefined || departmentId === null || departmentId === '') {
        return users;
      }
      return users.filter((user) => String(user.departmentId) === String(departmentId));
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement du personnel.'));
    }
  },
};
