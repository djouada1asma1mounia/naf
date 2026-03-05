import { mockMaterials } from '../mock/data';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let materialsDB = [...mockMaterials];
let nextId = materialsDB.length + 1;


export const materialsAPI = {
  getAll: async (filters = {}) => {
    await delay();
    let result = [...materialsDB];
    if (filters.ownerId) result = result.filter((m) => m.ownerId === Number(filters.ownerId));
    if (filters.departmentId) result = result.filter((m) => m.departmentId === Number(filters.departmentId));
    if (filters.categoryId) result = result.filter((m) => m.categoryId === Number(filters.categoryId));
    if (filters.status) result = result.filter((m) => m.status === filters.status);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(s) || (m.serialNumber && m.serialNumber.toLowerCase().includes(s)));
    }
    return result;
  },

  getById: async (id) => {
    await delay(200);
    const m = materialsDB.find((m) => m.id === Number(id));
    if (!m) throw new Error('Matériel non trouvé');
    return m;
  },

  create: async (data) => {
    await delay(500);
    if (!data.serialNumber || !data.serialNumber.trim()) throw new Error('Le numéro de série est requis');
    const duplicate = materialsDB.find((m) => m.serialNumber && m.serialNumber.toLowerCase() === data.serialNumber.trim().toLowerCase());
    if (duplicate) throw new Error('Ce numéro de série existe déjà');
    const newMat = { ...data, id: nextId++, createdAt: new Date().toISOString().split('T')[0] };
    materialsDB.push(newMat);
    return newMat;
  },

  update: async (id, data) => {
    await delay(400);
    const idx = materialsDB.findIndex((m) => m.id === Number(id));
    if (idx === -1) throw new Error('Matériel non trouvé');
    if (data.serialNumber && data.serialNumber.trim()) {
      const duplicate = materialsDB.find((m) => m.id !== Number(id) && m.serialNumber && m.serialNumber.toLowerCase() === data.serialNumber.trim().toLowerCase());
      if (duplicate) throw new Error('Ce numéro de série existe déjà');
    }
    materialsDB[idx] = { ...materialsDB[idx], ...data };
    return materialsDB[idx];
  },

  delete: async (id) => {
    await delay(400);
    materialsDB = materialsDB.filter((m) => m.id !== Number(id));
    return { success: true };
  },

  deleteByOwner: async (ownerId) => {
    await delay(400);
    materialsDB = materialsDB.filter((m) => m.ownerId !== Number(ownerId));
    return { success: true };
  },
};
