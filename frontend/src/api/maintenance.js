import axiosInstance from './axios';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

const formatDate = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const normalizeIntervention = (item = {}) => {
  const items = Array.isArray(item.items) ? item.items : [];
  const firstItem = items[0] || {};
  const staffName = `${item?.interventionnaireNom || ''} ${item?.interventionnairePrenom || ''}`.trim();

  return {
    id: item?.id,
    code: item?.reference || '',
    reference: item?.reference || '',
    type: item?.interventionType || '',
    status: 'Planifiée',
    priority: 'Normale',
    materialName:
      firstItem?.designation || (items.length > 1 ? `${items.length} element(s)` : 'Element non specifie'),
    materialCode: firstItem?.numeroSerie || firstItem?.numeroInventaire || '',
    staff: staffName || 'Non renseigne',
    department: item?.destinataire || 'Non renseigne',
    startDate: formatDate(item?.createdAt),
    createdAt: item?.createdAt || null,
    observation: item?.observation || '',
    items,
    destinataire: item?.destinataire || '',
    interventionnaireNom: item?.interventionnaireNom || '',
    interventionnairePrenom: item?.interventionnairePrenom || '',
    interventionnaireFonction: item?.interventionnaireFonction || '',
  };
};

const applyFilters = (interventions = [], filters = {}) => {
  let result = [...interventions];

  if (filters.type) {
    result = result.filter((m) => m.type === filters.type);
  }

  if (filters.search) {
    const query = String(filters.search).trim().toLowerCase();
    result = result.filter((m) => {
      const haystack = [m.code, m.materialName, m.materialCode, m.staff, m.department]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      return haystack.includes(query);
    });
  }

  return result;
};

export const maintenanceAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await axiosInstance.get('/interventions');
      const rawItems = response?.data?.data || [];
      const normalized = rawItems.map(normalizeIntervention);
      return applyFilters(normalized, filters);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement des interventions.'));
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/interventions/${id}`);
      const rawItem = response?.data?.data || response?.data;
      return normalizeIntervention(rawItem);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Intervention non trouvee.'));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosInstance.post('/interventions', data);
      const rawItem = response?.data?.data || response?.data;
      return normalizeIntervention(rawItem);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la creation de l intervention.'));
    }
  },

  update: async () => {
    throw new Error('La mise a jour d intervention n est pas disponible cote backend.');
  },

  delete: async () => {
    throw new Error('La suppression d intervention n est pas disponible cote backend.');
  },

  getRecentCount: async () => {
    const interventions = await maintenanceAPI.getAll();
    const now = Date.now();
    const count = interventions.filter((m) => {
      const date = new Date(m.createdAt || m.startDate);
      return !Number.isNaN(date.getTime()) && now - date.getTime() < 86400000 * 7;
    }).length;
    return { count };
  },
};
