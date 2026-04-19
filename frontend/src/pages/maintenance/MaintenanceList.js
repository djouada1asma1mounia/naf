import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Skeleton,
  IconButton,
  Tooltip,
} from "@mui/material";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AddIcon from "@mui/icons-material/Add";
import BuildIcon from "@mui/icons-material/Build";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  INTERVENTION_FILTER_OPTIONS,
  maintenanceAPI,
} from "../../api/maintenance";
import { structuresAPI } from "../../api/structures";
import PageHeader from "../../components/common/PageHeader";
import MaintenanceForm from "./MaintenanceForm";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { InterventionStatusChip } from "../../components/common/StatusChip";
import { useSnackbar } from "notistack";
import { useAuth } from "../../context/AuthContext";

const INTERVENTION_PERMISSIONS = {
  read: ["read-interventions", "read intervention", "read interventions"],
  create: ["create-intervention", "create intervention"],
  update: ["update-intervention", "update intervention"],
  remove: ["delete-intervention", "delete intervention"],
};

const initialFilters = {
  search: "",
  type: "",
  status: "",
  structure: "",
  date: "",
  dateFrom: "",
  dateTo: "",
};

const toPickerValue = (value) => (value ? dayjs(value) : null);

const toApiDate = (value) => {
  if (!value || !value.isValid()) return "";
  return value.format("YYYY-MM-DD");
};

const MaintenanceList = () => {
  const { hasPermissionAny } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(initialFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [structureOptions, setStructureOptions] = useState([]);
  const [structuresLoading, setStructuresLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    label: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const canRead = hasPermissionAny(INTERVENTION_PERMISSIONS.read);
  const canCreate = hasPermissionAny(INTERVENTION_PERMISSIONS.create);
  const canUpdate = hasPermissionAny(INTERVENTION_PERMISSIONS.update);
  const canDelete = hasPermissionAny(INTERVENTION_PERMISSIONS.remove);
  const canMutate = canUpdate || canDelete;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(0);
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters]);

  const loadData = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      setInterventions([]);
      enqueueSnackbar(
        "Vous n'avez pas la permission de lire les interventions.",
        { variant: "warning" },
      );
      return;
    }

    setLoading(true);
    try {
      const data = await maintenanceAPI.getAll(debouncedFilters);
      setInterventions(data);
    } catch {
      enqueueSnackbar("Erreur lors du chargement", { variant: "error" });
    }
    setLoading(false);
  }, [debouncedFilters, enqueueSnackbar, canRead]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadStructures = async () => {
      setStructuresLoading(true);
      try {
        const departments = await structuresAPI.getDepartments();
        const normalized = Array.from(
          new Set(
            (departments || [])
              .map((department) => String(department?.name || "").trim())
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

        setStructureOptions(normalized);
      } catch {
        setStructureOptions([]);
        enqueueSnackbar("Erreur lors du chargement des structures.", {
          variant: "warning",
        });
      } finally {
        setStructuresLoading(false);
      }
    };

    loadStructures();
  }, [enqueueSnackbar]);

  const handleFilterChange = (field) => (e) => {
    const value = e.target.value;
    setFilters((f) => {
      const next = { ...f, [field]: value };

      if (field === "date" && value) {
        next.dateFrom = "";
        next.dateTo = "";
      }

      if ((field === "dateFrom" || field === "dateTo") && value) {
        next.date = "";
      }

      return next;
    });
  };

  const handleDateFilterChange = (field) => (value) => {
    const formattedValue = toApiDate(value);

    setFilters((f) => {
      const next = { ...f, [field]: formattedValue };

      if (field === "date" && formattedValue) {
        next.dateFrom = "";
        next.dateTo = "";
      }

      if ((field === "dateFrom" || field === "dateTo") && formattedValue) {
        next.date = "";
      }

      return next;
    });
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editItem) {
        if (!canUpdate) {
          throw new Error(
            "Vous n'avez pas la permission de modifier des interventions.",
          );
        }
        await maintenanceAPI.update(editItem.id, data);
        enqueueSnackbar("Intervention modifiee", { variant: "success" });
      } else {
        if (!canCreate) {
          throw new Error(
            "Vous n'avez pas la permission de créer des interventions.",
          );
        }
        await maintenanceAPI.create(data);
        enqueueSnackbar("Intervention creee", { variant: "success" });
      }
      setFormOpen(false);
      setEditItem(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || "Erreur", { variant: "error" });
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!canDelete) {
      enqueueSnackbar(
        "Vous n'avez pas la permission de supprimer des interventions.",
        { variant: "warning" },
      );
      return;
    }

    setDeleteLoading(true);
    try {
      await maintenanceAPI.delete(deleteDialog.id);
      enqueueSnackbar("Intervention supprimee", { variant: "success" });
      setDeleteDialog({ open: false, id: null, label: "" });
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || "Erreur lors de la suppression", {
        variant: "error",
      });
    }
    setDeleteLoading(false);
  };

  const displayed = interventions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleExportPdf = async () => {
    if (!canRead) {
      enqueueSnackbar(
        "Vous n'avez pas la permission de lire les interventions.",
        { variant: "warning" },
      );
      return;
    }

    setExportLoading(true);
    try {
      await maintenanceAPI.exportPdf(debouncedFilters);
      enqueueSnackbar("Export PDF généré avec succès.", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message || "Erreur lors de l export PDF.", {
        variant: "error",
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <PageHeader
          title="Interventions & Maintenance"
          subtitle={`${interventions.length} intervention(s)`}
          breadcrumbs={[
            { label: "Accueil", path: "/dashboard" },
            { label: "Interventions" },
          ]}
          action={
            (canRead || canCreate) && (
              <Box display="flex" gap={1}>
                {canRead && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={handleExportPdf}
                    disabled={exportLoading}
                  >
                    Export PDF
                  </Button>
                )}
                {canCreate && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditItem(null);
                      setFormOpen(true);
                    }}
                  >
                    Nouvelle Intervention
                  </Button>
                )}
              </Box>
            )
          }
        />

        {/* Filters */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Recherche"
                  value={filters.search}
                  onChange={handleFilterChange("search")}
                  placeholder="Référence, matériel, intervenant..."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={handleFilterChange("type")}
                    label="Type"
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {INTERVENTION_FILTER_OPTIONS.types.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={handleFilterChange("status")}
                    label="Statut"
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {INTERVENTION_FILTER_OPTIONS.statuses.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Structure</InputLabel>
                  <Select
                    value={filters.structure}
                    onChange={handleFilterChange("structure")}
                    label="Structure"
                    disabled={structuresLoading}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {structureOptions.map((structureName) => (
                      <MenuItem key={structureName} value={structureName}>
                        {structureName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  sx={{ width: "100%" }}
                  label="Date exacte"
                  value={toPickerValue(filters.date)}
                  onChange={handleDateFilterChange("date")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      sx: { width: "100%" },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  sx={{ width: "100%" }}
                  label="Date début"
                  value={toPickerValue(filters.dateFrom)}
                  onChange={handleDateFilterChange("dateFrom")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      sx: { width: "100%" },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  sx={{ width: "100%" }}
                  label="Date fin"
                  value={toPickerValue(filters.dateTo)}
                  onChange={handleDateFilterChange("dateTo")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      sx: { width: "100%" },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Structure</TableCell>
                  <TableCell>Date</TableCell>
                  {canMutate && <TableCell align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <TableCell key={j}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : displayed.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canMutate ? 7 : 6}
                      align="center"
                      sx={{ py: 4 }}
                    >
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={1}
                        color="text.secondary"
                      >
                        <BuildIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                        <Typography variant="body2">
                          Aucune intervention trouvée
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayed.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {inv.category || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {inv.designation || inv.materialName || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{inv.type}</Typography>
                      </TableCell>
                      <TableCell>
                        <InterventionStatusChip status={inv.status} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {inv.structure || inv.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {inv.date || inv.startDate}
                        </Typography>
                      </TableCell>
                      {canMutate && (
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={0.5}>
                            {canUpdate && (
                              <Tooltip title="Modifier">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEdit(inv)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Supprimer">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    setDeleteDialog({
                                      open: true,
                                      id: inv.id,
                                      label: inv.reference || inv.code,
                                    })
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={interventions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, np) => setPage(np)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} sur ${count}`
            }
          />
        </Card>

        <MaintenanceForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditItem(null);
          }}
          onSubmit={handleFormSubmit}
          mode={editItem ? "edit" : "create"}
          initialData={editItem}
        />

        <ConfirmDialog
          open={deleteDialog.open}
          title="Supprimer l intervention"
          message={`Etes-vous sur de vouloir supprimer l intervention "${deleteDialog.label}" ? Cette action est irreversible.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteDialog({ open: false, id: null, label: "" })}
          loading={deleteLoading}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default MaintenanceList;
