import { materialsAPI } from "./materials";
import { maintenanceAPI } from "./maintenance";
import { authAPI } from "./auth";
import { structuresAPI } from "./structures";

const emptyInterventionsByMonth = [
  { month: "Jan", corrective: 0, preventive: 0 },
  { month: "Fév", corrective: 0, preventive: 0 },
  { month: "Mar", corrective: 0, preventive: 0 },
  { month: "Avr", corrective: 0, preventive: 0 },
  { month: "Mai", corrective: 0, preventive: 0 },
  { month: "Juin", corrective: 0, preventive: 0 },
];

const buildMaterialsStats = (materials = [], departments = []) => {
  const totalMaterials = materials.length;
  const activeMaterials = materials.filter(
    (m) => m.status === "En Service",
  ).length;
  const maintenanceMaterials = materials.filter(
    (m) => m.status === "Reforme",
  ).length;
  const panneMaterials = materials.filter(
    (m) => m.status === "En Panne",
  ).length;

  const byCategoryMap = new Map();
  materials.forEach((m) => {
    const key = m.category || "Non classé";
    byCategoryMap.set(key, (byCategoryMap.get(key) || 0) + 1);
  });

  const materialsByCategory = Array.from(byCategoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const materialsByStatus = [
    { name: "En Service", value: activeMaterials },
    { name: "Reforme", value: maintenanceMaterials },
    { name: "En Panne", value: panneMaterials },
  ];

  const materialsByDept = departments.map((department) => ({
    name: department.code || department.name,
    fullName: department.name,
    count: materials.filter(
      (m) => String(m.departmentId) === String(department.id),
    ).length,
  }));

  return {
    totalMaterials,
    activeMaterials,
    maintenanceMaterials,
    panneMaterials,
    materialsByCategory,
    materialsByStatus,
    materialsByDept,
  };
};

const buildInterventionsByMonth = (interventions = []) => {
  if (!Array.isArray(interventions) || interventions.length === 0) {
    return emptyInterventionsByMonth;
  }

  const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
  const now = new Date();
  const buckets = monthLabels.map((label, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (monthLabels.length - 1 - index),
      1,
    );
    return {
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      month: label,
      corrective: 0,
      preventive: 0,
    };
  });

  interventions.forEach((intervention) => {
    const dateValue = intervention.startDate || intervention.createdAt;
    const date = dateValue ? new Date(dateValue) : null;
    if (!date || Number.isNaN(date.getTime())) return;

    const bucket = buckets.find(
      (b) => b.year === date.getFullYear() && b.monthIndex === date.getMonth(),
    );
    if (!bucket) return;

    if (intervention.type === "Préventive") {
      bucket.preventive += 1;
    } else {
      bucket.corrective += 1;
    }
  });

  return buckets.map(({ month, corrective, preventive }) => ({
    month,
    corrective,
    preventive,
  }));
};

export const reportsAPI = {
  getStats: async () => {
    const [materials, interventions, users, departments] = await Promise.all([
      materialsAPI.getAll(),
      maintenanceAPI.getAll(),
      authAPI.getUsers(),
      structuresAPI.getDepartments(),
    ]);

    const materialStats = buildMaterialsStats(materials, departments);
    const ongoingInterventions = interventions.filter(
      (m) => m.status === "En cours",
    ).length;

    return {
      ...materialStats,
      totalInterventions: interventions.length,
      ongoingInterventions,
      totalUsers: users.length,
      totalDepartments: departments.length,
      interventionsByMonth: buildInterventionsByMonth(interventions),
    };
  },

  getMaterialsReport: async () => {
    const [materials, departments] = await Promise.all([
      materialsAPI.getAll(),
      structuresAPI.getDepartments(),
    ]);

    const materialStats = buildMaterialsStats(materials, departments);

    return {
      byCategory: materialStats.materialsByCategory,
      byStatus: materialStats.materialsByStatus,
      byDepartment: materialStats.materialsByDept,
    };
  },

  getInterventionsReport: async () => {
    const interventions = await maintenanceAPI.getAll();
    return {
      byMonth: buildInterventionsByMonth(interventions),
    };
  },
};
