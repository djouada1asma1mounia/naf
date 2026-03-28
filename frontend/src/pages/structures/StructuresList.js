import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Divider,
  List, ListItem, ListItemAvatar, ListItemText, Chip, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Skeleton, Accordion, AccordionSummary, AccordionDetails, MenuItem,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { structuresAPI } from '../../api/structures';
import { materialsAPI } from '../../api/materials';
import PageHeader from '../../components/common/PageHeader';
import { RoleChip } from '../../components/common/StatusChip';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const emptyForm = { name: '', code: '', managerId: '' };

const StructuresList = () => {
  const { isAdmin } = useAuth();
  const isAdminUser = isAdmin();
  const { enqueueSnackbar } = useSnackbar();
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add, object = edit
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refreshData = useCallback(async ({ showGlobalError = true } = {}) => {
    const [deptsResult, staffResult, matsResult] = await Promise.allSettled([
      structuresAPI.getDepartments(),
      structuresAPI.getStaff(),
      materialsAPI.getAll(),
    ]);

    if (deptsResult.status === 'fulfilled') {
      setDepartments(deptsResult.value || []);
    } else {
      setDepartments([]);
      if (showGlobalError) {
        enqueueSnackbar('Erreur lors du chargement des départements', { variant: 'error' });
      }
    }

    if (staffResult.status === 'fulfilled') {
      setStaff(staffResult.value || []);
    } else {
      setStaff([]);
    }

    if (matsResult.status === 'fulfilled') {
      setMaterials(matsResult.value || []);
    } else {
      setMaterials([]);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshData({ showGlobalError: true });
      setLoading(false);
    };
    loadData();
  }, [refreshData]);

  const getDeptStaff = (deptId) => staff.filter((s) => String(s.departmentId) === String(deptId));
  const getDeptMaterials = (deptId) => materials.filter((m) => String(m.departmentId) === String(deptId));
  const getUserMaterials = (userId) => materials.filter((m) => String(m.ownerId) === String(userId));

  // ── Dialog helpers ──────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (dept, e) => {
    e.stopPropagation();
    setEditTarget(dept);
    setForm({ name: dept.name || '', code: dept.code || '', managerId: dept.manager?.id || '' });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleFormChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      enqueueSnackbar('Le nom et le code sont obligatoires', { variant: 'warning' });
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
        enqueueSnackbar('Département modifié avec succès', { variant: 'success' });
      } else {
        await structuresAPI.createDepartment(payload);
        enqueueSnackbar('Département ajouté avec succès', { variant: 'success' });
      }
      await refreshData({ showGlobalError: false });
      setDialogOpen(false);
    } catch (error) {
      enqueueSnackbar(error.message || 'Erreur lors de la sauvegarde', { variant: 'error' });
    }
    setSaving(false);
  };

  // ── Delete helpers ───────────────────────────────────────────────
  const openDelete = (dept, e) => {
    e.stopPropagation();
    setDeleteTarget(dept);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await structuresAPI.deleteDepartment(deleteTarget.id);
      await refreshData({ showGlobalError: false });
      enqueueSnackbar('Département supprimé', { variant: 'success' });
      setDeleteTarget(null);
    } catch (error) {
      enqueueSnackbar(error.message || 'Erreur lors de la suppression', { variant: 'error' });
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={2.5}>
          {[1, 2, 3].map((i) => <Grid item xs={12} key={i}><Skeleton variant="rounded" height={80} /></Grid>)}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Structures"
        subtitle={`${departments.length} département(s) · ${staff.length} agent(s)`}
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Structures' }]}
        action={
          isAdminUser && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
              Ajouter département
            </Button>
          )
        }
      />

      {/* Stats Row */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, borderRadius: 2 }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>{departments.length}</Typography>
                <Typography variant="caption" color="text.secondary">Départements</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48, borderRadius: 2 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>{staff.length}</Typography>
                <Typography variant="caption" color="text.secondary">Agents</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48, borderRadius: 2 }}>
                <ComputerIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>{materials.length}</Typography>
                <Typography variant="caption" color="text.secondary">Matériels</Typography>
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
        return (
          <Accordion key={dept.id} sx={{ mb: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700 }}>
                  {dept.code}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight={700}>{dept.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Chef: {dept.manager?.fullName || '—'}
                  </Typography>
                </Box>
                <Box display="flex" gap={1} mr={2}>
                  <Chip label={`${deptStaff.length} agents`} size="small" color="primary" variant="outlined" />
                  <Chip label={`${deptMats.length} matériels`} size="small" color="info" variant="outlined" />
                </Box>
                {isAdminUser && (
                  <Box display="flex" gap={0.5} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Modifier">
                      <IconButton size="small" color="primary" onClick={(e) => openEdit(dept, e)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton size="small" color="error" onClick={(e) => openDelete(dept, e)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1} color="text.secondary">
                    Personnel ({deptStaff.length})
                  </Typography>
                  <List dense disablePadding>
                    {deptStaff.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">Aucun agent</Typography>
                    ) : (
                      deptStaff.map((person) => (
                        <ListItem key={person.id} disablePadding sx={{ py: 0.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
                              {`${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}` || 'U'}
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
                              <Typography variant="caption" color="text.secondary">
                                {person.email} · {getUserMaterials(person.id).length} matériel(s)
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1} color="text.secondary">
                    Matériels du département ({deptMats.length})
                  </Typography>
                  <Grid container spacing={1}>
                    {deptMats.length === 0 ? (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Aucun matériel</Typography>
                      </Grid>
                    ) : (
                      deptMats.map((mat) => (
                        <Grid item xs={12} sm={6} key={mat.id}>
                          <Box
                            sx={{
                              p: 1.25,
                              borderRadius: 2,
                              border: 1,
                              borderColor: 'divider',
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="body2" fontWeight={600} fontSize="0.8rem">
                                  {mat.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {mat.code} · {mat.owner}
                                </Typography>
                              </Box>
                              <Chip
                                label={mat.status}
                                size="small"
                                color={mat.status === 'Actif' ? 'success' : mat.status === 'En Maintenance' ? 'warning' : 'error'}
                                sx={{ fontSize: '0.6rem', height: 18 }}
                              />
                            </Box>
                          </Box>
                        </Grid>
                      ))
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* ── Add / Edit Dialog ─────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Modifier le département' : 'Ajouter un département'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nom du département"
              value={form.name}
              onChange={handleFormChange('name')}
              fullWidth
              required
              disabled={saving}
            />
            <TextField
              label="Code"
              value={form.code}
              onChange={handleFormChange('code')}
              fullWidth
              required
              disabled={saving}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Chef de département"
              value={form.managerId}
              onChange={handleFormChange('managerId')}
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
          <Button onClick={closeDialog} disabled={saving}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : editTarget ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ────────────────────────── */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment supprimer le département{' '}
            <strong>{deleteTarget?.name}</strong> ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StructuresList;
