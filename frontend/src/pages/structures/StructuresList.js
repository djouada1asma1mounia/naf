import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import ComputerIcon from "@mui/icons-material/Computer";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { structuresAPI } from "../../api/structures";
import { materialsAPI } from "../../api/materials";
import { servicesAPI } from "../../api/services";
import PageHeader from "../../components/common/PageHeader";
import { RoleChip } from "../../components/common/StatusChip";
import { useAuth } from "../../context/AuthContext";
import { useSnackbar } from "notistack";

const emptyForm = { name: "", code: "", managerId: "" };
const emptyServiceForm = { name: "", code: "", departmentId: "" };

const StructuresList = () => {
  const { isAdmin } = useAuth();
  const isAdminUser = isAdmin();
  const { enqueueSnackbar } = useSnackbar();
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add, object = edit
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Service dialogs state
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceEditTarget, setServiceEditTarget] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceDeleteTarget, setServiceDeleteTarget] = useState(null);
  const [serviceDeleting, setServiceDeleting] = useState(false);

  const refreshData = useCallback(
    async ({ showGlobalError = true } = {}) => {
      const [deptsResult, staffResult, matsResult, servicesResult] =
        await Promise.allSettled([
          structuresAPI.getDepartments(),
          structuresAPI.getStaff(),
          materialsAPI.getAll(),
          servicesAPI.getAll(),
        ]);

      if (deptsResult.status === "fulfilled") {
        setDepartments(deptsResult.value || []);
      } else {
        setDepartments([]);
        if (showGlobalError) {
          enqueueSnackbar("Erreur lors du chargement des départements", {
            variant: "error",
          });
        }
      }

      if (staffResult.status === "fulfilled") {
        setStaff(staffResult.value || []);
      } else {
        setStaff([]);
      }

      if (matsResult.status === "fulfilled") {
        setMaterials(matsResult.value || []);
      } else {
        setMaterials([]);
      }

      if (servicesResult.status === "fulfilled") {
        setServices(servicesResult.value || []);
      } else {
        setServices([]);
        if (showGlobalError) {
          enqueueSnackbar("Erreur lors du chargement des services", {
            variant: "error",
          });
        }
      }
    },
    [enqueueSnackbar],
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshData({ showGlobalError: true });
      setLoading(false);
    };
    loadData();
  }, [refreshData]);

  const getDeptStaff = (deptId) =>
    staff.filter((s) => String(s.departmentId) === String(deptId));
  const getDeptMaterials = (deptId) =>
    materials.filter((m) => String(m.departmentId) === String(deptId));
  const getDeptServices = (deptId) =>
    services.filter((s) => String(s.departmentId) === String(deptId));
  const getServiceMaterials = (serviceId) =>
    materials.filter((m) => String(m.serviceId) === String(serviceId));
  const getUserMaterials = (userId) =>
    materials.filter((m) => String(m.ownerId) === String(userId));

  // ── Dialog helpers ──────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (dept, e) => {
    e.stopPropagation();
    setEditTarget(dept);
    setForm({
      name: dept.name || "",
      code: dept.code || "",
      managerId: dept.manager?.id || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleFormChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      enqueueSnackbar("Le nom et le code sont obligatoires", {
        variant: "warning",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        managerId: form.managerId || null,
      };

      if (editTarget) {
        await structuresAPI.updateDepartment(editTarget.id, payload);
        enqueueSnackbar("Département modifié avec succès", {
          variant: "success",
        });
      } else {
        await structuresAPI.createDepartment(payload);
        enqueueSnackbar("Département ajouté avec succès", {
          variant: "success",
        });
      }
      await refreshData({ showGlobalError: false });
      setDialogOpen(false);
    } catch (error) {
      enqueueSnackbar(error.message || "Erreur lors de la sauvegarde", {
        variant: "error",
      });
    }
    setSaving(false);
  };

  // ── Delete helpers ───────────────────────────────────────────────
  const openDelete = (dept, e) => {
    e.stopPropagation();
    setDeleteTarget(dept);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const deptStaff = getDeptStaff(deleteTarget.id);
    const deptServices = getDeptServices(deleteTarget.id);
    const deptMats = getDeptMaterials(deleteTarget.id);

    if (
      deptStaff.length > 0 ||
      deptServices.length > 0 ||
      deptMats.length > 0
    ) {
      const blockers = [];
      if (deptStaff.length > 0) blockers.push(`${deptStaff.length} agent(s)`);
      if (deptServices.length > 0)
        blockers.push(`${deptServices.length} service(s)`);
      if (deptMats.length > 0) blockers.push(`${deptMats.length} matériel(s)`);

      enqueueSnackbar(
        `Suppression impossible. Le département contient encore: ${blockers.join(", ")}.`,
        { variant: "warning" },
      );
      return;
    }

    setDeleting(true);
    try {
      await structuresAPI.deleteDepartment(deleteTarget.id);
      await refreshData({ showGlobalError: false });
      enqueueSnackbar("Département supprimé", { variant: "success" });
      setDeleteTarget(null);
    } catch (error) {
      enqueueSnackbar(error.message || "Erreur lors de la suppression", {
        variant: "error",
      });
    }
    setDeleting(false);
  };

  const openAddService = (dept, e) => {
    e.stopPropagation();
    setServiceEditTarget(null);
    setServiceForm({ ...emptyServiceForm, departmentId: dept.id });
    setServiceDialogOpen(true);
  };

  const openEditService = (service, e) => {
    e.stopPropagation();
    setServiceEditTarget(service);
    setServiceForm({
      name: service.name || "",
      code: service.code || "",
      departmentId: service.departmentId || "",
    });
    setServiceDialogOpen(true);
  };

  const closeServiceDialog = () => {
    if (serviceSaving) return;
    setServiceDialogOpen(false);
  };

  const handleServiceFormChange = (field) => (e) => {
    setServiceForm((current) => ({ ...current, [field]: e.target.value }));
  };

  const handleSaveService = async () => {
    if (
      !serviceForm.name.trim() ||
      !serviceForm.code.trim() ||
      !serviceForm.departmentId
    ) {
      enqueueSnackbar("Nom, code et département du service sont obligatoires", {
        variant: "warning",
      });
      return;
    }

    setServiceSaving(true);
    try {
      const payload = {
        name: serviceForm.name.trim(),
        code: serviceForm.code.trim().toUpperCase(),
        departmentId: serviceForm.departmentId,
      };

      if (serviceEditTarget) {
        await servicesAPI.update(serviceEditTarget.id, payload);
        enqueueSnackbar("Service modifié avec succès", { variant: "success" });
      } else {
        await servicesAPI.create(payload);
        enqueueSnackbar("Service ajouté avec succès", { variant: "success" });
      }

      await refreshData({ showGlobalError: false });
      setServiceDialogOpen(false);
    } catch (error) {
      enqueueSnackbar(
        error.message || "Erreur lors de la sauvegarde du service",
        { variant: "error" },
      );
    }
    setServiceSaving(false);
  };

  const openDeleteService = (service, e) => {
    e.stopPropagation();
    setServiceDeleteTarget(service);
  };

  const handleDeleteService = async () => {
    if (!serviceDeleteTarget) return;

    const linkedMaterials = getServiceMaterials(serviceDeleteTarget.id);
    if (linkedMaterials.length > 0) {
      enqueueSnackbar(
        `Suppression impossible. Ce service est lié à ${linkedMaterials.length} matériel(s).`,
        { variant: "warning" },
      );
      return;
    }

    setServiceDeleting(true);
    try {
      await servicesAPI.delete(serviceDeleteTarget.id);
      await refreshData({ showGlobalError: false });
      enqueueSnackbar("Service supprimé", { variant: "success" });
      setServiceDeleteTarget(null);
    } catch (error) {
      enqueueSnackbar(
        error.message || "Erreur lors de la suppression du service",
        { variant: "error" },
      );
    }
    setServiceDeleting(false);
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={2.5}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} key={i}>
              <Skeleton variant="rounded" height={80} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Structures"
        subtitle={`${departments.length} département(s) · ${staff.length} agent(s) · ${services.length} service(s)`}
        breadcrumbs={[
          { label: "Accueil", path: "/dashboard" },
          { label: "Structures" },
        ]}
        action={
          isAdminUser && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAdd}
            >
              Ajouter département
            </Button>
          )
        }
      />

      {/* Stats Row */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                }}
              >
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  {departments.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Départements
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "success.main",
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                }}
              >
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  {staff.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Agents
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "warning.main",
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                }}
              >
                <DesignServicesIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  {services.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Services
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "info.main",
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                }}
              >
                <ComputerIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  {materials.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Matériels
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Departments Accordion */}
      <Typography variant="h6" fontWeight={700} mb={2}>
        Départements & Personnel
      </Typography>
      {departments.map((dept) => {
        const deptStaff = getDeptStaff(dept.id);
        const deptMats = getDeptMaterials(dept.id);
        const deptServices = getDeptServices(dept.id);
        return (
          <Accordion
            key={dept.id}
            sx={{
              mb: 1.5,
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              overflow: "hidden",
              boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 2.5,
                py: 1,
                "& .MuiAccordionSummary-content": {
                  my: 0.5,
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 44,
                    height: 44,
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    boxShadow: "0 6px 14px rgba(25,118,210,0.24)",
                  }}
                >
                  {dept.code}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {dept.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Chef: {dept.manager?.fullName || "—"}
                  </Typography>
                </Box>
                <Box display="flex" gap={1} mr={2} flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label={`${deptStaff.length} agents`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`${deptServices.length} services`}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`${deptMats.length} matériels`}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                {isAdminUser && (
                  <Box
                    display="flex"
                    gap={0.5}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="Modifier">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => openEdit(dept, e)}
                        sx={{ border: 1, borderColor: "divider" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => openDelete(dept, e)}
                        sx={{ border: 1, borderColor: "divider" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 1.5, pb: 2.25, px: 2.5, bgcolor: "background.default" }}>
              <Divider sx={{ mb: 2.2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2.5, bgcolor: "background.paper", height: "100%" }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      mb={1}
                      color="text.secondary"
                    >
                      Personnel ({deptStaff.length})
                    </Typography>
                    <List dense disablePadding>
                      {deptStaff.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">
                          Aucun agent
                        </Typography>
                      ) : (
                        deptStaff.map((person) => (
                          <ListItem
                            key={person.id}
                            disablePadding
                            sx={{ py: 0.65 }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  fontSize: "0.75rem",
                                  bgcolor: "secondary.main",
                                  color: "secondary.contrastText",
                                }}
                              >
                                {`${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}` ||
                                  "U"}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {person.firstName} {person.lastName}
                                  </Typography>
                                  <RoleChip role={person.role} />
                                </Box>
                              }
                              secondary={
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {person.email} ·{" "}
                                  {getUserMaterials(person.id).length} matériel(s)
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2.5, bgcolor: "background.paper", height: "100%" }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        color="text.secondary"
                      >
                        Services ({deptServices.length})
                      </Typography>
                      {isAdminUser && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={(e) => openAddService(dept, e)}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          Ajouter
                        </Button>
                      )}
                    </Box>
                    <List dense disablePadding>
                      {deptServices.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">
                          Aucun service
                        </Typography>
                      ) : (
                        deptServices.map((service) => (
                          <ListItem
                            key={service.id}
                            disablePadding
                            sx={{ py: 0.65 }}
                          >
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight={600}>
                                  {service.name}
                                </Typography>
                              }
                              secondary={
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Code: {service.code}
                                </Typography>
                              }
                            />
                            {isAdminUser && (
                              <Box display="flex" gap={0.5}>
                                <Tooltip title="Modifier service">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={(e) => openEditService(service, e)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Supprimer service">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => openDeleteService(service, e)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </ListItem>
                        ))
                      )}
                    </List>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2.5, bgcolor: "background.paper", height: "100%" }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      mb={1}
                      color="text.secondary"
                    >
                      Matériels du département ({deptMats.length})
                    </Typography>
                    <Grid container spacing={1.25}>
                      {deptMats.length === 0 ? (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            Aucun matériel
                          </Typography>
                        </Grid>
                      ) : (
                        deptMats.map((mat) => (
                          <Grid item xs={12} sm={6} key={mat.id}>
                            <Box
                              sx={{
                                p: 1.25,
                                borderRadius: 2,
                                border: 1,
                                borderColor: "divider",
                                backgroundColor: "background.default",
                              }}
                            >
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="flex-start"
                              >
                                <Box>
                                  <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    fontSize="0.82rem"
                                  >
                                    {mat.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {mat.code} · {mat.owner}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={mat.status}
                                  size="small"
                                  color={
                                    mat.status === "En Service"
                                      ? "success"
                                      : mat.status === "Reforme"
                                        ? "warning"
                                        : "error"
                                  }
                                  sx={{ fontSize: "0.62rem", height: 20, fontWeight: 700 }}
                                />
                              </Box>
                            </Box>
                          </Grid>
                        ))
                      )}
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* ── Add / Edit Dialog ─────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editTarget ? "Modifier le département" : "Ajouter un département"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nom du département"
              value={form.name}
              onChange={handleFormChange("name")}
              fullWidth
              required
              disabled={saving}
            />
            <TextField
              label="Code"
              value={form.code}
              onChange={handleFormChange("code")}
              fullWidth
              required
              disabled={saving}
              inputProps={{ style: { textTransform: "uppercase" } }}
            />
            <TextField
              label="Chef de département"
              value={form.managerId}
              onChange={handleFormChange("managerId")}
              select
              fullWidth
              disabled={saving}
            >
              <MenuItem value="">Aucun</MenuItem>
              {staff.map((person) => (
                <MenuItem key={person.id} value={person.id}>
                  {person.firstName} {person.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : editTarget ? "Modifier" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ────────────────────────── */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment supprimer le département{" "}
            <strong>{deleteTarget?.name}</strong> ? Cette action est
            irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Annuler
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Service Add / Edit Dialog ─────────────────────────── */}
      <Dialog
        open={serviceDialogOpen}
        onClose={closeServiceDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {serviceEditTarget ? "Modifier le service" : "Ajouter un service"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nom du service"
              value={serviceForm.name}
              onChange={handleServiceFormChange("name")}
              fullWidth
              required
              disabled={serviceSaving}
            />
            <TextField
              label="Code"
              value={serviceForm.code}
              onChange={handleServiceFormChange("code")}
              fullWidth
              required
              disabled={serviceSaving}
              inputProps={{ style: { textTransform: "uppercase" } }}
            />
            <TextField
              label="Département"
              value={serviceForm.departmentId}
              onChange={handleServiceFormChange("departmentId")}
              select
              fullWidth
              required
              disabled={serviceSaving}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeServiceDialog} disabled={serviceSaving}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveService}
            disabled={serviceSaving}
          >
            {serviceSaving
              ? "Enregistrement..."
              : serviceEditTarget
                ? "Modifier"
                : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Service Delete Confirmation Dialog ────────────────── */}
      <Dialog
        open={Boolean(serviceDeleteTarget)}
        onClose={() => !serviceDeleting && setServiceDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment supprimer le service{" "}
            <strong>{serviceDeleteTarget?.name}</strong> ? Cette action est
            irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setServiceDeleteTarget(null)}
            disabled={serviceDeleting}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteService}
            disabled={serviceDeleting}
          >
            {serviceDeleting ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StructuresList;
