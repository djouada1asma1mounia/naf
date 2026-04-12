import axiosInstance from "./axios";
import { rolesAPI } from "./roles";
import { categoriesAPI } from "./categories";
import { subsidiariesAPI } from "./subsidiaries";
import { structuresAPI } from "./structures";
import { servicesAPI } from "./services";

const parseCount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeMaterialStatusName = (status) => {
  const normalized = String(status || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  if (normalized === "EN SERVICE" || normalized === "EN_SERVICE") {
    return "EN_SERVICE";
  }
  if (normalized === "EN PANNE" || normalized === "EN_PANNE") {
    return "EN_PANNE";
  }
  if (normalized === "REFORME") {
    return "REFORME";
  }
  return normalized;
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

export const reportsAPI = {
  getStats: async () => {
    const [overviewResult, rolesResult, categoriesResult, reasonsResult, departmentsResult, servicesResult] = await Promise.allSettled([
      axiosInstance.get("/statistique/overview", {
        params: { months: 6, top: 10 },
      }),
      rolesAPI.getAll(),
      categoriesAPI.getAll(),
      subsidiariesAPI.getAll(),
      structuresAPI.getDepartments(),
      servicesAPI.getAll(),
    ]);

    const overview = overviewResult.status === "fulfilled"
      ? overviewResult.value?.data?.data || {}
      : {};
    const roles = rolesResult.status === "fulfilled" ? rolesResult.value : [];
    const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
    const reasons = reasonsResult.status === "fulfilled" ? reasonsResult.value : [];
    const departments = departmentsResult.status === "fulfilled" ? departmentsResult.value : [];
    const services = servicesResult.status === "fulfilled" ? servicesResult.value : [];

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

    const materialByStatusMap = (Array.isArray(materials.byStatus) ? materials.byStatus : []).reduce(
      (acc, item) => {
        const key = normalizeMaterialStatusName(item?.name);
        acc[key] = parseCount(item?.value);
        return acc;
      },
      {},
    );

    const ongoingInterventions = parseCount(
      (interventions.byStatus || []).find((s) => s.name === "EN_COURS")?.value,
    );

    const totalMaterials = parseCount(materials.totalMaterials);
    const standardMaterialsCount = parseCount(materials?.quality?.withoutSubsidiary);
    const gdMaterialsCount = Math.max(totalMaterials - standardMaterialsCount, 0);

    const servicesByDepartmentId = (Array.isArray(services) ? services : []).reduce(
      (acc, service) => {
        const key = service?.departmentId == null ? "unknown" : String(service.departmentId);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {},
    );

    const departmentServiceBreakdown = (Array.isArray(departments) ? departments : []).map((department) => {
      const key = String(department?.id);
      return {
        id: department?.id,
        name: department?.name || department?.code || "Sans departement",
        code: department?.code || "-",
        servicesCount: parseCount(servicesByDepartmentId[key]),
      };
    });

    const interventionsInfo = {
      byStatus: interventionStatusCounts,
      byType: normalizeNamedCounts(interventions.byType),
      byMonth: interventionsByMonth,
      topDestinataires: normalizeNamedCounts(interventions.byDestinataire),
      topInterventionnaires: normalizeNamedCounts(interventions.byInterventionnaire),
      items: {
        totalItems: parseCount(interventions?.items?.totalItems),
        totalItemsQuantity: parseCount(interventions?.items?.totalItemsQuantity),
        averageItemsPerIntervention: parseCount(interventions?.items?.averageItemsPerIntervention),
      },
    };

    return {
      totalMaterials,
      activeMaterials: parseCount(materialByStatusMap.EN_SERVICE),
      maintenanceMaterials: parseCount(materialByStatusMap.REFORME),
      panneMaterials: parseCount(materialByStatusMap.EN_PANNE),
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
      interventionsInfo,

      totalUsers: parseCount(users.totalUsers),
      totalDepartments: parseCount(users?.structure?.totalDepartments),
      totalServices: parseCount(users?.structure?.totalServices),
      departmentsServiceBreakdown: departmentServiceBreakdown,
      roleCounts: normalizeNamedCounts(users.byRole),

      totalDecharges: parseCount(decharges.totalDecharges),

      totalRoles: Array.isArray(roles) ? roles.length : 0,
      totalCategories: Array.isArray(categories) ? categories.length : 0,
      totalReasons: Array.isArray(reasons) ? reasons.length : 0,
      totalGdMaterials: gdMaterialsCount,
      totalClassicMaterials: standardMaterialsCount,
      gdMaterialsByStatus: [],
    };
  },

  getMaterialsReport: async () => {
    const response = await axiosInstance.get("/statistique/materials", {
      params: { top: 10 },
    });
    const data = response?.data?.data || {};

    return {
      byCategory: normalizeNamedCounts(data.byCategory),
      byStatus: normalizeNamedCounts(data.byStatus),
      byDepartment: normalizeNamedCounts(data.byDepartment).map((row) => ({
        ...row,
        count: row.value,
        fullName: row.name,
      })),
    };
  },

  getInterventionsReport: async () => {
    const response = await axiosInstance.get("/statistique/interventions", {
      params: { months: 6, top: 10 },
    });
    const data = response?.data?.data || {};

    return {
      byMonth: (data.byMonth || []).map((entry) => ({
        month: String(entry?.month || "").slice(5) || "-",
        hard: parseCount(entry?.hard),
        soft: parseCount(entry?.soft),
      })),
    };
  },
};
