import { mockMaintenances } from '../mock/data';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let maintenancesDB = [...mockMaintenances];
let nextId = maintenancesDB.length + 1;

const generateCode = () => `INT-${String(nextId).padStart(3, '0')}`;

export const maintenanceAPI = {
  getAll: async (filters = {}) => {
    await delay();
    let result = [...maintenancesDB];
    if (filters.staffId) result = result.filter((m) => m.staffId === Number(filters.staffId));
    if (filters.departmentId) result = result.filter((m) => m.departmentId === Number(filters.departmentId));
    if (filters.status) result = result.filter((m) => m.status === filters.status);
    if (filters.materialId) result = result.filter((m) => m.materialId === Number(filters.materialId));
    return result;
  },

  getById: async (id) => {
    await delay(200);
    const m = maintenancesDB.find((m) => m.id === Number(id));
    if (!m) throw new Error('Intervention non trouvée');
    return m;
  },

  create: async (data) => {
    await delay(500);
    const code = generateCode();
    const newM = { ...data, id: nextId++, code, createdAt: new Date().toISOString().split('T')[0] };
    maintenancesDB.push(newM);
    return newM;
  },

  update: async (id, data) => {
    await delay(400);
    const idx = maintenancesDB.findIndex((m) => m.id === Number(id));
    if (idx === -1) throw new Error('Intervention non trouvée');
    maintenancesDB[idx] = { ...maintenancesDB[idx], ...data };
    return maintenancesDB[idx];
  },

  delete: async (id) => {
    await delay(400);
    maintenancesDB = maintenancesDB.filter((m) => m.id !== Number(id));
    return { success: true };
  },

  getRecentCount: async () => {
    await delay(200);
    const now = Date.now();
    const recent = maintenancesDB.filter(
      (m) => now - new Date(m.createdAt).getTime() < 86400000 * 7
    ).length;
    return { count: recent };
  },
};
