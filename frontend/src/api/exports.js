import axiosInstance from "./axios";

const configuredExcelTimeout = Number(process.env.REACT_APP_EXCEL_TIMEOUT_MS);
const EXCEL_REQUEST_TIMEOUT_MS =
  Number.isFinite(configuredExcelTimeout) && configuredExcelTimeout > 0
    ? configuredExcelTimeout
    : 600000;

const getErrorMessage = (error, fallback) => {
  if (error?.code === "ECONNABORTED") {
    return "Operation trop longue: delai depasse. Reessayez ou reduisez le volume des donnees.";
  }
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

const extractFilename = (contentDisposition = "") => {
  const raw = String(contentDisposition || "");
  const utf8Match = raw.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const basicMatch = raw.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1] || `naftal-export-${Date.now()}.xlsx`;
};

export const exportsAPI = {
  exportAllDataExcel: async () => {
    try {
      const response = await axiosInstance.get("/exports/excel", {
        responseType: "blob",
        timeout: EXCEL_REQUEST_TIMEOUT_MS,
      });

      return {
        blob: response?.data,
        filename: extractFilename(response?.headers?.["content-disposition"]),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, "Erreur lors de l'export Excel."));
    }
  },

  importAllDataExcel: async ({
    file,
    onMissingForeign = "skip",
    batchSize = 200,
    transactionMode = "partial",
    targetSheets = [],
  }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post(
        "/exports/excel/import",
        formData,
        {
          params: {
            onMissingForeign,
            batchSize,
            transactionMode,
            ...(Array.isArray(targetSheets) && targetSheets.length > 0
              ? { targetSheets: targetSheets.join(",") }
              : {}),
          },
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: EXCEL_REQUEST_TIMEOUT_MS,
        },
      );

      return response?.data || {};
    } catch (error) {
      throw new Error(getErrorMessage(error, "Erreur lors de l'import Excel."));
    }
  },
};

export default exportsAPI;
