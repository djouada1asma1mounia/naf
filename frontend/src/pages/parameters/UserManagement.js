import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField,
  InputAdornment, IconButton, Tooltip, Grid, Typography, Skeleton,
  Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, MenuItem, Alert,
  Checkbox, ListItemText, Select, InputLabel, FormControl, OutlinedInput,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { authAPI } from '../../api/auth';
import { rolesAPI } from '../../api/roles';
import { permissionsAPI } from '../../api/permissions';
import { structuresAPI } from '../../api/structures';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const USER_PERMISSIONS = {
  create: ['create-user', 'create user'],
  read: ['read-users', 'read users', 'read-user', 'read user'],
  update: ['update-user', 'update user'],
  remove: ['delete-user', 'delete user'],
};

const extractPermissionIds = (user) => {
  if (Array.isArray(user?.permissionIds)) return user.permissionIds.map(Number).filter((id) => !Number.isNaN(id));
  if (Array.isArray(user?.permissions)) {
    return user.permissions
      .map((permission) => (typeof permission === 'number' ? permission : Number(permission?.id)))
      .filter((id) => !Number.isNaN(id));
  }
  return [];
};

const UserForm = ({ open, onClose, onSubmit, editItem, departments, customRoles, permissions }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', departmentId: '', department: '', roleId: '', permissionIds: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(editItem ? {
      ...editItem,
      password: '',
      confirmPassword: '',
      roleId: editItem.roleId || editItem.role?.id || '',
      permissionIds: extractPermissionIds(editItem),
    } : {
      firstName: '', lastName: '', email: '',
      password: '', confirmPassword: '', departmentId: '', department: '', roleId: '', permissionIds: [],
    });
    setErrors({});
  }, [editItem, open]);

  const togglePermission = (permissionId) => {
    setForm((prev) => {
      const exists = prev.permissionIds.some((id) => String(id) === String(permissionId));
      if (exists) {
        return {
          ...prev,
          permissionIds: prev.permissionIds.filter((id) => String(id) !== String(permissionId)),
        };
      }
      return {
        ...prev,
        permissionIds: [...prev.permissionIds, permissionId],
      };
    });
  };

  const selectAllPermissions = () => {
    setForm((prev) => {
      const merged = new Map(prev.permissionIds.map((id) => [String(id), id]));
      permissions.forEach((permission) => {
        merged.set(String(permission.id), permission.id);
      });
      return {
        ...prev,
        permissionIds: Array.from(merged.values()),
      };
    });
  };

  const clearAllPermissions = () => {
    setForm((prev) => ({
      ...prev,
      permissionIds: [],
    }));
  };

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: '' }));
  };

  const handleDeptChange = (e) => {
    const selectedId = Number(e.target.value);
    const dept = departments.find((d) => Number(d.id) === selectedId);
    setForm((f) => ({ ...f, departmentId: selectedId, department: dept?.name || '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'Requis';
    if (!form.lastName.trim()) newErrors.lastName = 'Requis';
    if (!form.email.trim()) newErrors.email = 'Requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email invalide';
    if (!form.roleId) newErrors.roleId = 'Requis';
    if (!form.departmentId) newErrors.departmentId = 'Requis';
    if (!editItem) {
      if (!form.password) newErrors.password = 'Requis';
      if (!form.confirmPassword) newErrors.confirmPassword = 'Requis';
      else if (form.password && form.confirmPassword !== form.password) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>
          {editItem ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box component="form" id="user-form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label="Prénom *" value={form.firstName} onChange={handleChange('firstName')} error={!!errors.firstName} helperText={errors.firstName} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Nom *" value={form.lastName} onChange={handleChange('lastName')} error={!!errors.lastName} helperText={errors.lastName} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email *" value={form.email} onChange={handleChange('email')} type="email" error={!!errors.email} helperText={errors.email} disabled={!!editItem} />
            </Grid>
            {!editItem && (
              <>
                <Grid item xs={12}>
                  <TextField fullWidth label="Mot de passe *" value={form.password} onChange={handleChange('password')} type="password" error={!!errors.password} helperText={errors.password} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Confirmer le mot de passe *" value={form.confirmPassword} onChange={handleChange('confirmPassword')} type="password" error={!!errors.confirmPassword} helperText={errors.confirmPassword} />
                </Grid>
              </>
            )}
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Département *"
                value={form.departmentId || ''}
                onChange={handleDeptChange}
                error={!!errors.departmentId}
                helperText={errors.departmentId}
              >
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={!!errors.roleId}>
                <InputLabel>Rôle *</InputLabel>
                <Select
                  value={form.roleId || ''}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    roleId: Number(e.target.value),
                  }))}
                  input={<OutlinedInput label="Rôle *" />}
                >
                  {customRoles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      <ListItemText primary={r.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={1.2}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Permissions ({form.permissionIds.length})
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button size="small" onClick={selectAllPermissions} disabled={permissions.length === 0}>
                      Tout sélectionner
                    </Button>
                    <Button size="small" color="inherit" onClick={clearAllPermissions} disabled={form.permissionIds.length === 0}>
                      Vider
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ maxHeight: 220, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1.5, p: 1 }}>
                  {permissions
                    .slice()
                    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
                    .map((permission) => (
                      <Box
                        key={permission.id}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          px: 0.6,
                          py: 0.3,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <Checkbox
                            size="small"
                            checked={form.permissionIds.some((value) => String(value) === String(permission.id))}
                            onChange={() => togglePermission(permission.id)}
                          />
                          <Typography variant="body2">{permission.name}</Typography>
                        </Box>
                        {permission.virtual && (
                          <Chip size="small" label="Virtuelle" color="warning" variant="outlined" />
                        )}
                      </Box>
                    ))}
                </Box>
              </Box>
            </Grid>
            {permissions.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Permissions backend indisponibles: la liste des permissions ne peut pas être chargée pour le moment.
                </Alert>
              </Grid>
            )}

          </Grid>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Annuler</Button>
        <Button type="submit" form="user-form" variant="contained" disabled={loading}>
          {editItem ? 'Modifier' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UserManagement = () => {
  const { user: currentUser, updateUser, hasPermissionAny } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionsFallback, setPermissionsFallback] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, user: null });

  const canCreate = hasPermissionAny(USER_PERMISSIONS.create);
  const canRead = hasPermissionAny(USER_PERMISSIONS.read);
  const canUpdate = hasPermissionAny(USER_PERMISSIONS.update);
  const canDelete = hasPermissionAny(USER_PERMISSIONS.remove);

  const loadData = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      setUsers([]);
      setDepartments([]);
      setCustomRoles([]);
      setPermissions([]);
      enqueueSnackbar('Vous n\'avez pas la permission de lire les utilisateurs.', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const [usrsResult, deptsResult, rolesResult, permissionsResult] = await Promise.allSettled([
        authAPI.getUsers(),
        structuresAPI.getDepartments(),
        rolesAPI.getAll(),
        permissionsAPI.getAll(),
      ]);

      if (usrsResult.status === 'rejected') {
        throw new Error('Erreur chargement utilisateurs');
      }

      setUsers(Array.isArray(usrsResult.value) ? usrsResult.value : []);

      if (deptsResult.status === 'fulfilled' && Array.isArray(deptsResult.value)) {
        setDepartments(deptsResult.value);
      } else {
        setDepartments([]);
        if (canCreate || canUpdate) {
          enqueueSnackbar('Liste des départements indisponible. Les actions de création/modification peuvent être limitées.', { variant: 'info' });
        }
      }

      if (rolesResult.status === 'fulfilled' && Array.isArray(rolesResult.value)) {
        setCustomRoles(rolesResult.value);
      } else {
        setCustomRoles([]);
        if (canCreate || canUpdate) {
          enqueueSnackbar('Liste des rôles indisponible. Les actions de création/modification peuvent être limitées.', { variant: 'info' });
        }
      }

      if (permissionsResult.status === 'fulfilled' && Array.isArray(permissionsResult.value) && permissionsResult.value.length > 0) {
        setPermissions(permissionsResult.value);
        setPermissionsFallback(false);
      } else {
        setPermissions([]);
        setPermissionsFallback(true);
      }
    } catch {
      enqueueSnackbar('Erreur chargement utilisateurs', { variant: 'error' });
    }
    setLoading(false);
  }, [enqueueSnackbar, canRead, canCreate, canUpdate]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = users.filter((u) =>
    `${u.firstName || ''} ${u.lastName || ''} ${u.username || ''} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleFormSubmit = async (data) => {
    try {
      if (!data.roleId || Number(data.roleId) <= 0) {
        enqueueSnackbar('Veuillez sélectionner un rôle backend valide.', { variant: 'error' });
        return;
      }

      const permissionSelections = (data.permissionIds || []).map((id) => {
        const permission = permissions.find((item) => String(item.id) === String(id));
        return permission ? { id: permission.id, name: permission.name } : null;
      }).filter(Boolean);

      const payload = {
        ...data,
        permissionSelections,
      };

      if (editItem) {
        if (!canUpdate) {
          throw new Error('Vous n\'avez pas la permission de modifier les utilisateurs.');
        }
        const updatedUser = await authAPI.updateUser(editItem.id, payload);
        if (String(editItem.id) === String(currentUser?.id)) {
          updateUser(updatedUser);
        }
        enqueueSnackbar('Utilisateur modifié', { variant: 'success' });
      } else {
        if (!canCreate) {
          throw new Error('Vous n\'avez pas la permission de créer des utilisateurs.');
        }
        const createResult = await authAPI.createUser(payload);
        enqueueSnackbar('Utilisateur créé', { variant: 'success' });
        if (createResult?.permissionsApplyWarning) {
          enqueueSnackbar('Compte créé, mais certaines permissions (ex: create-role) n\'ont pas pu être appliquées automatiquement. Modifiez le compte pour les réappliquer.', { variant: 'warning' });
        }
      }
      setFormOpen(false);
      loadData();
    } catch (err) { enqueueSnackbar(err.message || 'Erreur', { variant: 'error' }); }
  };

  const handleDeleteConfirm = async () => {
    if (!canDelete) {
      enqueueSnackbar('Vous n\'avez pas la permission de supprimer des utilisateurs.', { variant: 'warning' });
      return;
    }

    setDeleteLoading(true);
    try {
      await authAPI.deleteUser(deleteDialog.id);
      enqueueSnackbar('Utilisateur supprimé', { variant: 'success' });
      setDeleteDialog({ open: false, id: null, name: '' });
      loadData();
    } catch (err) { enqueueSnackbar(err.message || 'Erreur', { variant: 'error' }); }
    setDeleteLoading(false);
  };

  return (
    <Box>
      <PageHeader
        title="Gestion des Utilisateurs"
        subtitle={`${users.length} utilisateur(s)`}
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Utilisateurs' }]}
        action={
          canCreate ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
              Nouvel Utilisateur
            </Button>
          ) : null
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          {permissionsFallback && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Les permissions backend sont indisponibles actuellement. Vérifiez l'endpoint /permissions.
            </Alert>
          )}
          <TextField
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: 320 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Département</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{[1,2,3,4].map((j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                ))
              ) : displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <PeopleIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                    <Typography variant="body2" color="text.secondary">Aucun utilisateur</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayed.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                          {`${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}` || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{u.department || '—'}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {u.roleId ? (
                          <Chip
                            label={customRoles.find((r) => Number(r.id) === Number(u.roleId))?.name || u.role || '—'}
                            size="small"
                            variant="outlined"
                            color="secondary"
                            sx={{ fontSize: '0.65rem', fontWeight: 600 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Afficher détails">
                          <Button
                            size="small"
                            variant="contained"
                            color="info"
                            disableElevation
                            startIcon={<InfoOutlinedIcon fontSize="small" />}
                            onClick={() => setDetailsDialog({ open: true, user: u })}
                            sx={{
                              textTransform: 'none',
                              minWidth: 0,
                              px: 1.1,
                              py: 0.25,
                              borderRadius: 6,
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              lineHeight: 1.1,
                            }}
                          >
                            Détails
                          </Button>
                        </Tooltip>
                        {canUpdate && (
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => { setEditItem(u); setFormOpen(true); }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && u.id !== currentUser?.id && (
                          <Tooltip title="Supprimer (+ ses matériels)">
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: u.id, name: `${u.firstName} ${u.lastName}` })}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div" count={filtered.length} rowsPerPage={rowsPerPage} page={page}
          onPageChange={(_, np) => setPage(np)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Card>

      <UserForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        editItem={editItem}
        departments={departments}
        customRoles={customRoles}
        permissions={permissions}
      />
      <ConfirmDialog
        open={deleteDialog.open}
        title="Supprimer l'Utilisateur"
        message={`Supprimer "${deleteDialog.name}" et TOUS ses matériels ? Cette action est irréversible.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        loading={deleteLoading}
      />

      <Dialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>Détails de l'utilisateur</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {detailsDialog.user && (
            <Box sx={{ pt: 0.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  mb: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.default',
                }}
              >
                <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 700 }}>
                  {`${detailsDialog.user.firstName?.[0] || ''}${detailsDialog.user.lastName?.[0] || ''}` || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {`${detailsDialog.user.firstName || ''} ${detailsDialog.user.lastName || ''}`.trim() || '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{detailsDialog.user.email || '—'}</Typography>
                </Box>
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Département</Typography>
                    <Typography variant="body2" fontWeight={600}>{detailsDialog.user.department || '—'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Rôle</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {customRoles.find((r) => Number(r.id) === Number(detailsDialog.user.roleId))?.name || detailsDialog.user.role || '—'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Date de création</Typography>
                    <Typography variant="body2" fontWeight={600}>{detailsDialog.user.createdAt || '—'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Permissions
                    </Typography>
                    <Box display="flex" gap={0.75} flexWrap="wrap">
                      {Array.from(new Set([
                        ...extractPermissionIds(detailsDialog.user)
                          .map((permissionId) => permissions.find((item) => item.id === permissionId)?.name)
                          .filter(Boolean),
                        ...((detailsDialog.user?.permissions || [])
                          .map((permission) => (typeof permission === 'string' ? permission : permission?.name))
                          .filter(Boolean)),
                      ])).map((permissionLabel) => (
                        <Chip
                          key={permissionLabel}
                          label={permissionLabel}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                        />
                      ))}
                      {Array.from(new Set([
                        ...extractPermissionIds(detailsDialog.user)
                          .map((permissionId) => permissions.find((item) => item.id === permissionId)?.name)
                          .filter(Boolean),
                        ...((detailsDialog.user?.permissions || [])
                          .map((permission) => (typeof permission === 'string' ? permission : permission?.name))
                          .filter(Boolean)),
                      ])).length === 0 && (
                        <Typography variant="body2" color="text.secondary">Aucune permission</Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetailsDialog({ open: false, user: null })} variant="outlined">Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
