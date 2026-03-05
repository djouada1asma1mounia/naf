import { mockStats } from '../mock/data';

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

export const reportsAPI = {
  getStats: async () => {
    await delay();
    return { ...mockStats };
  },

  getMaterialsReport: async () => {
    await delay();
    return {
      byCategory: mockStats.materialsByCategory,
      byStatus: mockStats.materialsByStatus,
      byDepartment: mockStats.materialsByDept,
    };
  },

  getInterventionsReport: async () => {
    await delay();
    return {
      byMonth: mockStats.interventionsByMonth,
    };
  },
};
