import { mockCustomRoles } from '../mock/data';
import axiosInstance from './axios';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let rolesDB = [...mockCustomRoles];
let nextId = rolesDB.length + 1;

export const rolesAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/roles');
      return response?.data?.data || [];
    } catch {
      await delay();
      return [...rolesDB];
    }
  },

  create: async (data) => {
    try {
      const response = await axiosInstance.post('/roles', data);
      return response?.data?.data || response.data;
    } catch {
      await delay(500);
      const exists = rolesDB.find((r) => r.name.toLowerCase() === data.name.toLowerCase());
      if (exists) throw new Error('Ce rôle existe déjà');
      const newRole = { ...data, id: nextId++, createdAt: new Date().toISOString().split('T')[0] };
      rolesDB.push(newRole);
      return newRole;
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosInstance.patch(`/roles/${id}`, data);
      return response?.data?.data || response.data;
    } catch {
      await delay(400);
      const idx = rolesDB.findIndex((r) => r.id === Number(id));
      if (idx === -1) throw new Error('Rôle non trouvé');
      rolesDB[idx] = { ...rolesDB[idx], ...data };
      return rolesDB[idx];
    }
  },

  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/roles/${id}`);
      return response.data;
    } catch {
      await delay(400);
      rolesDB = rolesDB.filter((r) => r.id !== Number(id));
      return { success: true };
    }
  },
};
