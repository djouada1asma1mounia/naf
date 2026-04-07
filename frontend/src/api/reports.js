import axiosInstance from "./axios";
import { materialsAPI } from "./materials";
import { maintenanceAPI } from "./maintenance";
import { authAPI } from "./auth";
import { structuresAPI } from "./structures";
import { rolesAPI } from "./roles";
import { categoriesAPI } from "./categories";
import { subsidiariesAPI } from "./subsidiaries";

const emptyInterventionsByMonth = [
  { month: "Jan", hard: 0, soft: 0 },
  { month: "Fév", hard: 0, soft: 0 },
  { month: "Mar", hard: 0, soft: 0 },
  { month: "Avr", hard: 0, soft: 0 },
  { month: "Mai", hard: 0, soft: 0 },
  { month: "Juin", hard: 0, soft: 0 },
];

const parseCount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeInterventionStatusLabel = (status) => {
  if (status === "A_FAIRE") return "A faire";
  if (status === "EN_COURS") return "En cours";
  if (status === "TERMINE") return "Terminee";
  return status || "Non renseigne";
};

const normalizeNamedCounts = (rows = [], mapper) =>
  (Array.isArray(rows) ? rows : []).map((row) => ({
    name: mapper ? mapper(row?.name) : row?.name || "Non renseigne",
    value: parseCount(row?.value),
  }));

const countByStatus = (materials = []) => {
  const grouped = {
    "En Service": 0,
    "En Panne": 0,
    Reforme: 0,
  };

  materials.forEach((item) => {
    const status = item?.status;
    if (!grouped[status]) {
      grouped[status] = 0;
    }
    grouped[status] += 1;
  });

  return [
    { name: "En Service", value: grouped["En Service"] || 0 },
    { name: "En Panne", value: grouped["En Panne"] || 0 },
    { name: "Reforme", value: grouped.Reforme || 0 },
  ];
};

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
      hard: 0,
      soft: 0,
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

    if (intervention.type === "SOFT") {
      bucket.soft += 1;
    } else {
      bucket.hard += 1;
    }
  });

  return buckets.map(({ month, hard, soft }) => ({
    month,
    hard,
    soft,
  }));
};

export const reportsAPI = {
  getStats: async () => {
    try {
      const [overviewResponse, roles, categories, reasons, allMaterials] =
        await Promise.all([
          axiosInstance.get("/statistique/overview", {
            params: { months: 6, top: 10 },
          }),
          rolesAPI.getAll(),
          categoriesAPI.getAll(),
          subsidiariesAPI.getAll(),
          materialsAPI.getAll(),
        ]);

      const overview = overviewResponse?.data?.data || {};
      const materials = overview.materials || {};
      const interventions = overview.interventions || {};
      const decharges = overview.decharges || {};
      const users = overview.users || {};

      const materialsByStatus = normalizeNamedCounts(materials.byStatus);
      const interventionStatusCounts = normalizeNamedCounts(
        interventions.byStatus,
        normalizeInterventionStatusLabel,
      );

      const interventionsByMonth = (interventions.byMonth || []).map((entry) => ({
        month: String(entry?.month || "").slice(5) || "-",
        hard: parseCount(entry?.hard),
        soft: parseCount(entry?.soft),
      }));

      const gdMaterials = allMaterials.filter((item) => Boolean(item?.subsidiaryCode));
      const classicMaterials = allMaterials.filter((item) => !item?.subsidiaryCode);
      const gdMaterialsByStatus = countByStatus(gdMaterials);

      const ongoingInterventions = parseCount(
        (interventions.byStatus || []).find((s) => s.name === "EN_COURS")?.value,
      );

      return {
        totalMaterials: parseCount(materials.totalMaterials),
        activeMaterials: parseCount(
          (materials.byStatus || []).find((s) => s.name === "En Service")?.value,
        ),
        maintenanceMaterials: parseCount(
          (materials.byStatus || []).find((s) => s.name === "Reforme")?.value,
        ),
        panneMaterials: parseCount(
          (materials.byStatus || []).find((s) => s.name === "En Panne")?.value,
        ),
        materialsByCategory: normalizeNamedCounts(materials.byCategory),
        materialsByStatus,
        materialsByDept: normalizeNamedCounts(materials.byDepartment).map((row) => ({
          ...row,
          count: row.value,
          fullName: row.name,
        })),
        interventionsByMonth,

        totalInterventions: parseCount(interventions.totalInterventions),
        ongoingInterventions,
        interventionStatusCounts,
        interventionTypeCounts: normalizeNamedCounts(interventions.byType),

        totalUsers: parseCount(users.totalUsers),
        totalDepartments: parseCount(users?.structure?.totalDepartments),
        totalServices: parseCount(users?.structure?.totalServices),
        roleCounts: normalizeNamedCounts(users.byRole),

        totalDecharges: parseCount(decharges.totalDecharges),

        totalRoles: Array.isArray(roles) ? roles.length : 0,
        totalCategories: Array.isArray(categories) ? categories.length : 0,
        totalReasons: Array.isArray(reasons) ? reasons.length : 0,

        totalGdMaterials: gdMaterials.length,
        totalClassicMaterials: classicMaterials.length,
        gdMaterialsByStatus,
      };
    } catch {
      const [materials, interventions, users, departments] = await Promise.all([
        materialsAPI.getAll(),
        maintenanceAPI.getAll(),
        authAPI.getUsers(),
        structuresAPI.getDepartments(),
      ]);

      const materialStats = buildMaterialsStats(materials, departments);
      const now = Date.now();
      const ongoingInterventions = interventions.filter((m) => {
        const date = new Date(m.createdAt || m.startDate);
        return !Number.isNaN(date.getTime()) && now - date.getTime() < 86400000 * 7;
      }).length;

      return {
        ...materialStats,
        totalInterventions: interventions.length,
        ongoingInterventions,
        totalUsers: users.length,
        totalDepartments: departments.length,
        totalServices: 0,
        totalRoles: 0,
        totalCategories: 0,
        totalReasons: 0,
        totalDecharges: 0,
        totalGdMaterials: materials.filter((item) => item?.subsidiaryCode).length,
        totalClassicMaterials: materials.filter((item) => !item?.subsidiaryCode).length,
        gdMaterialsByStatus: countByStatus(materials.filter((item) => item?.subsidiaryCode)),
        interventionStatusCounts: [],
        interventionTypeCounts: [],
        roleCounts: [],
        interventionsByMonth: buildInterventionsByMonth(interventions),
      };
    }
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
