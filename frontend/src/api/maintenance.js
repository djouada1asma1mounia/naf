import axiosInstance from "./axios";

export const INTERVENTION_FILTER_OPTIONS = {
  types: [
    { value: "HARD", label: "HARD" },
    { value: "SOFT", label: "SOFT" },
  ],
  statuses: [
    { value: "A_FAIRE", label: "Planifiée" },
    { value: "EN_COURS", label: "En cours" },
    { value: "TERMINE", label: "Terminée" },
  ],
};

const STATUS_LABEL_BY_API = {
  A_FAIRE: "Planifiée",
  EN_COURS: "En cours",
  TERMINE: "Terminée",
};

const STATUS_API_BY_LABEL = {
  Planifiée: "A_FAIRE",
  "En cours": "EN_COURS",
  Terminée: "TERMINE",
};

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const normalizeIntervention = (item = {}) => {
  const items = Array.isArray(item.items) ? item.items : [];
  const firstItem = items[0] || {};
  const staffName =
    `${item?.interventionnaireNom || ""} ${item?.interventionnairePrenom || ""}`.trim();
  const apiStatus = String(item?.status || "")
    .trim()
    .toUpperCase();
  const statusLabel = STATUS_LABEL_BY_API[apiStatus] || "Planifiée";

  return {
    id: item?.id,
    code: item?.reference || "",
    reference: item?.reference || "",
    type: item?.interventionType || "",
    category: firstItem?.category || "-",
    designation:
      firstItem?.designation ||
      (items.length > 1
        ? `${items.length} element(s)`
        : "Element non specifie"),
    status: statusLabel,
    statusCode: apiStatus || "A_FAIRE",
    priority: "Normale",
    materialName:
      firstItem?.designation ||
      (items.length > 1
        ? `${items.length} element(s)`
        : "Element non specifie"),
    materialCode: firstItem?.numeroSerie || firstItem?.numeroInventaire || "",
    staff: staffName || "Non renseigne",
    department: item?.destinataire || "Non renseigne",
    structure: item?.destinataire || "Non renseigne",
    startDate: formatDate(item?.createdAt),
    date: formatDate(item?.createdAt),
    createdAt: item?.createdAt || null,
    observation: item?.observation || "",
    items,
    destinataire: item?.destinataire || "",
    interventionnaireNom: item?.interventionnaireNom || "",
    interventionnairePrenom: item?.interventionnairePrenom || "",
    interventionnaireFonction: item?.interventionnaireFonction || "",
  };
};

const toApiStatus = (value) => {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;

  const upper = trimmed.toUpperCase();
  if (STATUS_LABEL_BY_API[upper]) return upper;

  return STATUS_API_BY_LABEL[trimmed] || undefined;
};

const buildPayload = (data = {}) => {
  const status = toApiStatus(data?.status);
  const items = Array.isArray(data?.items)
    ? data.items
        .map((item) => ({
          designation: String(item?.designation || "").trim(),
          quantity: Number(item?.quantity),
          marque: item?.marque ? String(item.marque).trim() : undefined,
          numeroSerie: item?.numeroSerie
            ? String(item.numeroSerie).trim()
            : undefined,
          numeroInventaire: item?.numeroInventaire
            ? String(item.numeroInventaire).trim()
            : undefined,
        }))
        .filter(
          (item) =>
            item.designation &&
            Number.isFinite(item.quantity) &&
            item.quantity > 0,
        )
    : undefined;

  const payload = {
    interventionType: data?.interventionType || data?.type,
    status,
    observation: data?.observation
      ? String(data.observation).trim()
      : undefined,
    destinataire: data?.destinataire
      ? String(data.destinataire).trim()
      : undefined,
    interventionnaireNom: data?.interventionnaireNom
      ? String(data.interventionnaireNom).trim()
      : undefined,
    interventionnairePrenom: data?.interventionnairePrenom
      ? String(data.interventionnairePrenom).trim()
      : undefined,
    interventionnaireFonction: data?.interventionnaireFonction
      ? String(data.interventionnaireFonction).trim()
      : undefined,
    items,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

const applyFilters = (interventions = [], filters = {}) => {
  let result = [...interventions];

  if (filters.search) {
    const query = String(filters.search).trim().toLowerCase();
    result = result.filter((m) => {
      const haystack = [
        m.code,
        m.category,
        m.designation,
        m.materialName,
        m.materialCode,
        m.staff,
        m.structure,
        m.department,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }

  return result;
};

const buildBackendFilterParams = (filters = {}) => {
  const params = {};

  if (filters.type) params.type = String(filters.type).trim();

  const status = toApiStatus(filters.status);
  if (status) params.status = status;

  if (filters.structure) {
    const structure = String(filters.structure).trim();
    if (structure) params.structure = structure;
  }

  if (filters.date) {
    params.date = String(filters.date).trim();
  } else {
    if (filters.dateFrom) params.dateFrom = String(filters.dateFrom).trim();
    if (filters.dateTo) params.dateTo = String(filters.dateTo).trim();
  }

  return params;
};

export const maintenanceAPI = {
  getAll: async (filters = {}) => {
    try {
      const params = buildBackendFilterParams(filters);
      const response = await axiosInstance.get("/interventions", { params });
      const rawItems = response?.data?.data || [];
      const normalized = rawItems.map(normalizeIntervention);
      return applyFilters(normalized, filters);
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Erreur lors du chargement des interventions."),
      );
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/interventions/${id}`);
      const rawItem = response?.data?.data || response?.data;
      return normalizeIntervention(rawItem);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Intervention non trouvee."));
    }
  },

  exportPdf: async (filters = {}) => {
    try {
      const params = buildBackendFilterParams(filters);
      const response = await axiosInstance.get("/interventions/export/pdf", {
        params,
        responseType: "blob",
      });

      const contentDisposition =
        response?.headers?.["content-disposition"] || "";
      const fileNameMatch = /filename="?([^"]+)"?/.exec(contentDisposition);
      const fileName = fileNameMatch?.[1] || `interventions-${Date.now()}.pdf`;

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Erreur lors de l export PDF des interventions.",
        ),
      );
    }
  },

  create: async (data) => {
    try {
      const payload = buildPayload(data);
      const response = await axiosInstance.post("/interventions", payload);
      const rawItem = response?.data?.data || response?.data;
      return normalizeIntervention(rawItem);
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Erreur lors de la creation de l intervention."),
      );
    }
  },

  update: async (id, data) => {
    try {
      const payload = buildPayload(data);
      const response = await axiosInstance.patch(
        `/interventions/${id}`,
        payload,
      );
      const rawItem = response?.data?.data || response?.data;
      return normalizeIntervention(rawItem);
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Erreur lors de la mise a jour de l intervention.",
        ),
      );
    }
  },

  delete: async (id) => {
    try {
      await axiosInstance.delete(`/interventions/${id}`);
      return true;
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Erreur lors de la suppression de l intervention.",
        ),
      );
    }
  },

  getRecentCount: async () => {
    const interventions = await maintenanceAPI.getAll();
    const now = Date.now();
    const count = interventions.filter((m) => {
      const date = new Date(m.createdAt || m.startDate);
      return (
        !Number.isNaN(date.getTime()) && now - date.getTime() < 86400000 * 7
      );
    }).length;
    return { count };
  },
};
