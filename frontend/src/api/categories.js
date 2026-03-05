import { mockCategories } from '../mock/data';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let categoriesDB = [...mockCategories];
let nextId = categoriesDB.length + 1;

export const categoriesAPI = {
  getAll: async () => {
    await delay();
    return [...categoriesDB];
  },

  create: async (data) => {
    await delay(500);
    const exists = categoriesDB.find((c) => c.name.toLowerCase() === data.name.toLowerCase());
    if (exists) throw new Error('Cette catégorie existe déjà');
    const newCat = { ...data, id: nextId++, materialsCount: 0 };
    categoriesDB.push(newCat);
    return newCat;
  },

  update: async (id, data) => {
    await delay(400);
    const idx = categoriesDB.findIndex((c) => c.id === Number(id));
    if (idx === -1) throw new Error('Catégorie non trouvée');
    categoriesDB[idx] = { ...categoriesDB[idx], ...data };
    return categoriesDB[idx];
  },

  delete: async (id) => {
    await delay(400);
    categoriesDB = categoriesDB.filter((c) => c.id !== Number(id));
    return { success: true };
  },
};
