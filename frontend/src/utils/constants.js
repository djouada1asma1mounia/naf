export const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
};

export const FULL_ACCESS_MODE =
  (process.env.REACT_APP_FULL_ACCESS_MODE ?? "true").toLowerCase() !== "false";

export const MATERIAL_STATUSES = ["En Service", "En Panne", "Reforme"];

export const INTERVENTION_TYPES = ["Corrective", "Préventive", "Évolutive"];

export const INTERVENTION_STATUSES = [
  "Planifiée",
  "En cours",
  "Terminée",
  "Annulée",
];

export const INTERVENTION_PRIORITIES = ["Basse", "Normale", "Haute", "Urgente"];

export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  USER: "Utilisateur",
};

export const ROLE_COLORS = {
  ADMIN: "error",
  USER: "info",
};

export const STATUS_COLORS = {
  "En Service": "success",
  "En Panne": "error",
  Reforme: "warning",
};

export const INTERVENTION_STATUS_COLORS = {
  Planifiée: "info",
  "En cours": "warning",
  Terminée: "success",
  Annulée: "default",
};

export const PRIORITY_COLORS = {
  Basse: "default",
  Normale: "info",
  Haute: "warning",
  Urgente: "error",
};

export const CHART_COLORS = [
  "#1565C0",
  "#FFC107",
  "#2E7D32",
  "#D32F2F",
  "#7B1FA2",
  "#0288D1",
  "#ED6C02",
];

export const SIDEBAR_WIDTH = 260;
