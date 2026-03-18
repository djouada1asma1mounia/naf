import { mockDepartments, mockUsers } from '../mock/data';
import axiosInstance from './axios';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let departmentsDB = [...mockDepartments];
let nextId = departmentsDB.length + 1;

export const structuresAPI = {
  getDepartments: async () => {
    try {
      const response = await axiosInstance.get('/departments');
      return response?.data?.data || [];
    } catch {
      await delay();
      return [...departmentsDB];
    }
  },

  getDepartmentById: async (id) => {
    try {
      const response = await axiosInstance.get(`/departments/${id}`);
      return response?.data?.data || response.data;
    } catch {
      await delay(200);
      const d = departmentsDB.find((d) => d.id === Number(id));
      if (!d) throw new Error('Département non trouvé');
      return d;
    }
  },

  createDepartment: async (data) => {
    try {
      const response = await axiosInstance.post('/departments', data);
      return response?.data?.data || response.data;
    } catch {
      await delay(500);
      const newD = { ...data, id: nextId++, staffCount: 0 };
      departmentsDB.push(newD);
      return newD;
    }
  },

  updateDepartment: async (id, data) => {
    try {
      const response = await axiosInstance.patch(`/departments/${id}`, data);
      return response?.data?.data || response.data;
    } catch {
      await delay(400);
      const idx = departmentsDB.findIndex((d) => d.id === Number(id));
      if (idx === -1) throw new Error('Département non trouvé');
      departmentsDB[idx] = { ...departmentsDB[idx], ...data };
      return departmentsDB[idx];
    }
  },

  deleteDepartment: async (id) => {
    try {
      const response = await axiosInstance.delete(`/departments/${id}`);
      return response.data;
    } catch {
      await delay(400);
      departmentsDB = departmentsDB.filter((d) => d.id !== Number(id));
      return { success: true };
    }
  },

  getStaff: async (departmentId) => {
    await delay(300);
    if (departmentId) {
      return mockUsers
        .filter((u) => u.departmentId === Number(departmentId))
        .map(({ password: _p, ...u }) => u);
    }
    return mockUsers.map(({ password: _p, ...u }) => u);
  },
};
