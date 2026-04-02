import axiosInstance from './axios';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

const toUiStatus = (etat) => {
  const normalized = String(etat || '').toLowerCase();
  if (normalized.includes('maintenance')) return 'En Maintenance';
  if (normalized.includes('panne')) return 'En Panne';
  return 'Actif';
};

const toBackendEtat = (status) => {
  if (status === 'En Maintenance') return 'en Maintenance';
  if (status === 'En Panne') return 'en Panne';
  return 'Active';
};

const normalizeMaterial = (item = {}) => {
  const ownerFirstName = item?.proprietaire?.prenom || '';
  const ownerLastName = item?.proprietaire?.nom || '';
  const ownerLabel = `${ownerFirstName} ${ownerLastName}`.trim() || item?.proprietaire?.email || '';
  const name = `${item?.marque || ''} ${item?.modele || ''}`.trim() || item?.numeroSerie || 'Matériel';
  const service = item?.service || null;
  const department = service?.department || item?.department || null;

  return {
    id: item?.numeroSerie,
    serialNumber: item?.numeroSerie,
    code: item?.numeroSerie,
    name,
    brand: item?.marque || '',
    model: item?.modele || '',
    categoryId: item?.categorie?.id || '',
    category: item?.categorie?.name || '',
    serviceId: service?.id || null,
    serviceName: service?.name || '',
    ownerId: item?.proprietaire?.id || '',
    owner: ownerLabel,
    departmentId: department?.id || '',
    department: department?.name || '',
    status: toUiStatus(item?.etat),
    purchaseDate: item?.dateEntree || '',
    warrantyExpiry: '',
    description: '',
    createdAt: item?.dateEntree || '',
  };
};

const toIntOrUndefined = (value) => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toIntOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildPayload = (data = {}) => ({
  numeroSerie: String(data?.serialNumber || '').trim(),
  categorieId: toIntOrUndefined(data?.categoryId),
  serviceId: Object.prototype.hasOwnProperty.call(data, 'serviceId')
    ? toIntOrNull(data?.serviceId)
    : undefined,
  departmentId: toIntOrUndefined(data?.departmentId),
  proprietaireId: data?.ownerId || undefined,
  dateEntree: data?.purchaseDate || undefined,
  etat: toBackendEtat(data?.status),
  marque: String(data?.brand || data?.name || '').trim() || undefined,
  modele: String(data?.model || '').trim() || undefined,
});

const applyFilters = (materials, filters = {}) => {
  let result = [...materials];

  if (filters.ownerId) {
    result = result.filter((m) => String(m.ownerId) === String(filters.ownerId));
  }
  if (filters.departmentId) {
    result = result.filter((m) => String(m.departmentId) === String(filters.departmentId));
  }
  if (filters.categoryId) {
    result = result.filter((m) => String(m.categoryId) === String(filters.categoryId));
  }
  if (filters.status) {
    result = result.filter((m) => m.status === filters.status);
  }
  if (filters.search) {
    const s = String(filters.search).toLowerCase();
    result = result.filter((m) => {
      const nameMatch = String(m.name || '').toLowerCase().includes(s);
      const serialMatch = String(m.serialNumber || '').toLowerCase().includes(s);
      return nameMatch || serialMatch;
    });
  }

  return result;
};

export const materialsAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await axiosInstance.get('/materiels');
      const rawItems = response?.data?.data || [];
      const normalized = rawItems.map(normalizeMaterial);
      return applyFilters(normalized, filters);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement des matériels.'));
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/materiels/${id}`);
      const rawItem = response?.data?.data || response?.data;
      return normalizeMaterial(rawItem);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Matériel non trouvé.'));
    }
  },

  create: async (data) => {
    try {
      const payload = buildPayload(data);
      const response = await axiosInstance.post('/materiels', payload);
      return normalizeMaterial(response?.data?.data || response?.data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la création du matériel.'));
    }
  },

  update: async (id, data) => {
    try {
      const payload = buildPayload(data);
      delete payload.numeroSerie;
      const response = await axiosInstance.patch(`/materiels/${id}`, payload);
      return normalizeMaterial(response?.data?.data || response?.data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la mise à jour du matériel.'));
    }
  },

  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/materiels/${id}`);
      return response?.data || { success: true };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la suppression du matériel.'));
    }
  },

  deleteByOwner: async (ownerId) => {
    try {
      const ownerMaterials = await materialsAPI.getAll({ ownerId });
      await Promise.all(ownerMaterials.map((m) => materialsAPI.delete(m.serialNumber)));
      return { success: true };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la suppression des matériels de l’utilisateur.'));
    }
  },
};
