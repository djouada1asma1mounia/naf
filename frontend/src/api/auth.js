import { ROLES } from '../utils/constants';
import axiosInstance from './axios';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

export { ROLES };

const splitFullName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

const normalizeUserSummary = (summary, detail) => {
  const fullName = detail?.fullName || summary?.fullName || '';
  const { firstName, lastName } = splitFullName(fullName);
  const role = detail?.role || summary?.role || null;
  const department = detail?.department || summary?.department || null;

  return {
    id: detail?.id || summary?.id,
    firstName,
    lastName,
    email: detail?.email || '',
    username: detail?.email ? String(detail.email).split('@')[0] : '',
    role: role?.name || role?.code || null,
    roleId: role?.id || null,
    department: department?.name || '',
    departmentId: department?.id || null,
    permissions: detail?.permissions || [],
    permissionIds: (detail?.permissions || []).map((permission) => permission?.id).filter((id) => id != null),
    active: true,
    createdAt: detail?.createdAt ? new Date(detail.createdAt).toISOString().split('T')[0] : '-',
  };
};

const mapCreateRegisterPayload = (payload = {}) => ({
  email: payload.email,
  nom: payload.lastName || payload.nom,
  prenom: payload.firstName || payload.prenom,
  roleId: Number(payload.roleId),
  departmentId: Number(payload.departmentId),
  password: payload.password,
  password_confirmed: payload.confirmPassword || payload.password_confirmed,
});

const mapUpdatePayload = (payload = {}) => {
  const mapped = {
    nom: payload.lastName || payload.nom,
    prenom: payload.firstName || payload.prenom,
    email: payload.email,
  };

  if (payload.departmentId !== undefined && payload.departmentId !== '') {
    mapped.departmentId = Number(payload.departmentId);
  }

  if (payload.roleId !== undefined && payload.roleId !== '') {
    mapped.roleId = Number(payload.roleId);
  }

  if (Array.isArray(payload.permissionIds)) {
    mapped.permissionIds = payload.permissionIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
  }

  if (payload.password) {
    mapped.password = payload.password;
  }

  return mapped;
};

export const authAPI = {
  /** POST /auth/login → { accessToken, data, message } */
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const payload = response.data || {};
      return {
        accessToken: payload.accessToken,
        data: payload.data,
        message: payload.message,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Identifiants incorrects.'));
    }
  },

  /** POST /auth/register */
  register: async (payload) => {
    try {
      const response = await axiosInstance.post('/auth/register', mapCreateRegisterPayload(payload));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de l’inscription.'));
    }
  },

  /** GET /users */
  getUsers: async () => {
    try {
      const response = await axiosInstance.get('/users');
      const summaries = response?.data?.data || [];

      const users = await Promise.all(
        summaries.map(async (summary) => {
          try {
            const detailResponse = await axiosInstance.get(`/users/${summary.id}`);
            const detail = detailResponse?.data?.data;
            return normalizeUserSummary(summary, detail);
          } catch {
            return normalizeUserSummary(summary, null);
          }
        })
      );

      return users;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement des utilisateurs.'));
    }
  },

  /** GET /users/:id */
  getUserById: async (id) => {
    try {
      const [summaryResponse, detailResponse] = await Promise.all([
        axiosInstance.get('/users'),
        axiosInstance.get(`/users/${id}`),
      ]);

      const summary = (summaryResponse?.data?.data || []).find((item) => String(item.id) === String(id));
      return normalizeUserSummary(summary, detailResponse?.data?.data || null);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Utilisateur non trouvé'));
    }
  },

  /** POST /auth/register */
  createUser: async (data) => {
    try {
      const response = await axiosInstance.post('/auth/register', mapCreateRegisterPayload(data));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la création de l’utilisateur.'));
    }
  },

  /** PATCH /users/:id */
  updateUser: async (id, data) => {
    try {
      const response = await axiosInstance.patch(`/users/${id}`, mapUpdatePayload(data));
      return response?.data?.data || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la mise à jour de l’utilisateur.'));
    }
  },

  /** DELETE /users/:id */
  deleteUser: async (id) => {
    try {
      const response = await axiosInstance.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la suppression de l’utilisateur.'));
    }
  },

  /** PATCH /users/:id/password */
  changePassword: async (id, oldPassword, newPassword) => {
    try {
      const response = await axiosInstance.patch(`/users/${id}/password`, {
        oldPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du changement de mot de passe.'));
    }
  },
};

