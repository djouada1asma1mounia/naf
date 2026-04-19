import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import { useSnackbar } from "notistack";
import { useAuth } from "../../context/AuthContext";
import { exportsAPI } from "../../api/exports";
import PageHeader from "../../components/common/PageHeader";

const DATA_TRANSFER_PERMISSIONS = {
  export: ["export-all-data", "export all data"],
  import: ["export-all-data", "export all data"],
};

const DataTransfer = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermissionAny } = useAuth();

  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [importOptions, setImportOptions] = useState({
    onMissingForeign: "skip",
    transactionMode: "partial",
    batchSize: 200,
    targetScope: "materiels",
  });

  const canExportAllData = hasPermissionAny(DATA_TRANSFER_PERMISSIONS.export);
  const canImportAllData = hasPermissionAny(DATA_TRANSFER_PERMISSIONS.import);

  const handleExportExcel = async () => {
    if (!canExportAllData) {
      enqueueSnackbar(
        "Permission insuffisante pour exporter toutes les donnees.",
        { variant: "warning" },
      );
      return;
    }

    setExportLoading(true);
    try {
      const { blob, filename } = await exportsAPI.exportAllDataExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        filename || `naftal-export-${Date.now()}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar("Export Excel termine avec succes.", {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(err.message || "Erreur lors de l'export Excel.", {
        variant: "error",
      });
    }
    setExportLoading(false);
  };

  const handleImportExcel = async () => {
    if (!canImportAllData) {
      enqueueSnackbar(
        "Permission insuffisante pour importer les donnees Excel.",
        { variant: "warning" },
      );
      return;
    }

    if (!importFile) {
      enqueueSnackbar("Selectionnez un fichier Excel avant l'import.", {
        variant: "warning",
      });
      return;
    }

    setImportLoading(true);
    try {
      const summary = await exportsAPI.importAllDataExcel({
        file: importFile,
        onMissingForeign: importOptions.onMissingForeign,
        transactionMode: importOptions.transactionMode,
        batchSize: Number(importOptions.batchSize) || 200,
        targetSheets: importOptions.targetScope === "all" ? [] : ["materiels"],
      });
      setImportSummary(summary || null);

      const created = Number(summary?.created || 0);
      const updated = Number(summary?.updated || 0);
      const failed = Number(summary?.failed || 0);
      const rolledBack = Boolean(summary?.rolledBack);

      if (rolledBack) {
        const firstError = Array.isArray(summary?.invalidRows)
          ? summary.invalidRows[0]
          : null;
        const firstErrorText = firstError
          ? ` Premier blocage: [${firstError.sheet}] ligne ${firstError.row} - ${(firstError.errors || []).join(", ")}`
          : "";
        enqueueSnackbar(
          `Import annule (rollback). Cree: ${created}, Modifie: ${updated}, Echecs: ${failed}.${firstErrorText}`,
          { variant: "error" },
        );
      } else if (failed > 0) {
        const firstError = Array.isArray(summary?.invalidRows)
          ? summary.invalidRows[0]
          : null;
        const firstErrorText = firstError
          ? ` Premier blocage: [${firstError.sheet}] ligne ${firstError.row} - ${(firstError.errors || []).join(", ")}`
          : "";
        enqueueSnackbar(
          `Import partiel. Cree: ${created}, Modifie: ${updated}, Echecs: ${failed}.${firstErrorText}`,
          { variant: "warning" },
        );
      } else {
        enqueueSnackbar(
          `Import Excel termine. Cree: ${created}, Modifie: ${updated}.`,
          { variant: "success" },
        );
      }
    } catch (err) {
      enqueueSnackbar(err.message || "Erreur lors de l'import Excel.", {
        variant: "error",
      });
    }
    setImportLoading(false);
  };

  return (
    <Box>
      <PageHeader
        title="Import Export"
        subtitle="Transfert global des donnees via Excel"
        breadcrumbs={[
          { label: "Accueil", path: "/dashboard" },
          { label: "Import Export" },
        ]}
      />

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Alert severity="info">
            Cette page permet d'exporter ou d'importer toutes les donnees via un
            fichier Excel.
          </Alert>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Export Excel
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Telecharge un fichier Excel contenant toutes les tables
                exportables du systeme.
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip
                  size="small"
                  label={canExportAllData ? "Autorise" : "Non autorise"}
                  color={canExportAllData ? "success" : "default"}
                />
                <Typography variant="caption" color="text.secondary">
                  Permission requise: export-all-data
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportExcel}
                disabled={!canExportAllData || exportLoading}
              >
                {exportLoading
                  ? "Export en cours..."
                  : "Exporter tout en Excel"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Import Excel
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Importe les donnees depuis un fichier Excel genere selon le
                format d'export.
              </Typography>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip
                  size="small"
                  label={canImportAllData ? "Autorise" : "Non autorise"}
                  color={canImportAllData ? "success" : "default"}
                />
                <Typography variant="caption" color="text.secondary">
                  Permission requise: export-all-data
                </Typography>
              </Box>

              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Missing foreign"
                    value={importOptions.onMissingForeign}
                    onChange={(e) =>
                      setImportOptions((prev) => ({
                        ...prev,
                        onMissingForeign: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="skip">skip</MenuItem>
                    <MenuItem value="error">error</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Transaction mode"
                    value={importOptions.transactionMode}
                    onChange={(e) =>
                      setImportOptions((prev) => ({
                        ...prev,
                        transactionMode: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="partial">partial</MenuItem>
                    <MenuItem value="full">full</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Portee import"
                    value={importOptions.targetScope}
                    onChange={(e) =>
                      setImportOptions((prev) => ({
                        ...prev,
                        targetScope: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="materiels">materiels seulement</MenuItem>
                    <MenuItem value="all">toutes les feuilles</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Batch size"
                    inputProps={{ min: 1, max: 1000 }}
                    value={importOptions.batchSize}
                    onChange={(e) =>
                      setImportOptions((prev) => ({
                        ...prev,
                        batchSize: e.target.value,
                      }))
                    }
                  />
                </Grid>
              </Grid>

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 1 }}
              >
                Conseil: utilisez "materiels seulement" pour ajouter/modifier
                des materiels sans etre bloque par des erreurs FK sur d'autres
                feuilles.
              </Typography>

              <Box display="flex" flexWrap="wrap" gap={1} mb={1.5}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  disabled={!canImportAllData || importLoading}
                >
                  Choisir fichier Excel
                  <input
                    hidden
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setImportFile(file);
                    }}
                  />
                </Button>

                <Button
                  variant="contained"
                  onClick={handleImportExcel}
                  disabled={!canImportAllData || importLoading || !importFile}
                >
                  {importLoading ? "Import en cours..." : "Importer maintenant"}
                </Button>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                {importFile
                  ? `Fichier selectionne: ${importFile.name}`
                  : "Aucun fichier selectionne"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {importSummary && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Resultat de l'import
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={2}>
                    <Chip
                      label={`Created: ${importSummary.created || 0}`}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Chip
                      label={`Updated: ${importSummary.updated || 0}`}
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Chip
                      label={`Failed: ${importSummary.failed || 0}`}
                      color="error"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Chip
                      label={`Processed: ${importSummary.validRowsProcessed || 0}`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Chip
                      label={`Rollback: ${importSummary.rolledBack ? "oui" : "non"}`}
                    />
                  </Grid>
                </Grid>

                {Array.isArray(importSummary.details) &&
                  importSummary.details.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Details
                      </Typography>
                      <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                        {importSummary.details.slice(0, 8).map((item, idx) => (
                          <Box component="li" key={`detail-${idx}`}>
                            <Typography variant="body2">{item}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                {Array.isArray(importSummary.invalidRows) &&
                  importSummary.invalidRows.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Lignes invalides (top 8)
                      </Typography>
                      <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                        {importSummary.invalidRows
                          .slice(0, 8)
                          .map((row, idx) => (
                            <Box component="li" key={`invalid-${idx}`}>
                              <Typography variant="body2">
                                [{row.sheet}] ligne {row.row}:{" "}
                                {(row.errors || []).join(", ")}
                              </Typography>
                            </Box>
                          ))}
                      </Box>
                    </Box>
                  )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DataTransfer;
