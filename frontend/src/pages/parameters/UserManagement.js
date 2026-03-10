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
import { authAPI, ROLES as ROLE_LIST } from '../../api/auth';
import { rolesAPI } from '../../api/roles';
import { materialsAPI } from '../../api/materials';
import { structuresAPI } from '../../api/structures';
import PageHeader from '../../components/common/PageHeader';
import { RoleChip } from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { ROLE_LABELS } from '../../utils/constants';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const UserForm = ({ open, onClose, onSubmit, editItem, departments, customRoles }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', role: 'USER', departmentId: '', department: '', assignedRoles: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(editItem ? { ...editItem, password: '', confirmPassword: '', assignedRoles: editItem.assignedRoles || [] } : {
      firstName: '', lastName: '', email: '',
      password: '', confirmPassword: '', role: 'USER', departmentId: '', department: '', assignedRoles: [],
    });
    setErrors({});
  }, [editItem, open]);

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: '' }));
  };

  const handleDeptChange = (e) => {
    const dept = departments.find((d) => d.id === e.target.value);
    setForm((f) => ({ ...f, departmentId: e.target.value, department: dept?.name || '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'Requis';
    if (!form.lastName.trim()) newErrors.lastName = 'Requis';
    if (!form.email.trim()) newErrors.email = 'Requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email invalide';
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
    const { confirmPassword: _cp, ...submitData } = form;
    await onSubmit(submitData);
    setLoading(false);
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
              <TextField fullWidth select label="Rôle" value={form.role} onChange={handleChange('role')}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Département" value={form.departmentId || ''} onChange={handleDeptChange}>
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            </Grid>
            {form.role === 'USER' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Rôles assignés</InputLabel>
                  <Select
                    multiple
                    value={form.assignedRoles}
                    onChange={(e) => setForm((f) => ({ ...f, assignedRoles: e.target.value }))}
                    input={<OutlinedInput label="Rôles assignés" />}
                    renderValue={(selected) =>
                      selected.map((id) => customRoles.find((r) => r.id === id)?.name).filter(Boolean).join(', ')
                    }
                  >
                    {customRoles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        <Checkbox checked={form.assignedRoles.includes(r.id)} />
                        <ListItemText primary={r.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
  const { user: currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usrs, depts, roles] = await Promise.all([authAPI.getUsers(), structuresAPI.getDepartments(), rolesAPI.getAll()]);
      setUsers(usrs);
      setDepartments(depts);
      setCustomRoles(roles);
    } catch { enqueueSnackbar('Erreur chargement', { variant: 'error' }); }
    setLoading(false);
  }, [enqueueSnackbar]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.username} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleFormSubmit = async (data) => {
    try {
      if (editItem) {
        await authAPI.updateUser(editItem.id, data);
        enqueueSnackbar('Utilisateur modifié', { variant: 'success' });
      } else {
        await authAPI.createUser(data);
        enqueueSnackbar('Utilisateur créé', { variant: 'success' });
      }
      setFormOpen(false);
      loadData();
    } catch (err) { enqueueSnackbar(err.message || 'Erreur', { variant: 'error' }); }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await materialsAPI.deleteByOwner(deleteDialog.id);
      await authAPI.deleteUser(deleteDialog.id);
      enqueueSnackbar('Utilisateur et ses matériels supprimés', { variant: 'success' });
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
            Nouvel Utilisateur
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
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
                <TableCell>Username</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Rôles assignés</TableCell>
                <TableCell>Département</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Créé le</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{[1,2,3,4,5,6,7,8].map((j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                ))
              ) : displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
                          {u.firstName[0]}{u.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{u.username}</Typography></TableCell>
                    <TableCell><RoleChip role={u.role} /></TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {(u.assignedRoles || []).map((roleId) => {
                          const cr = customRoles.find((r) => r.id === roleId);
                          return cr ? (
                            <Chip key={roleId} label={cr.name} size="small" variant="outlined" color="secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }} />
                          ) : null;
                        })}
                        {(!u.assignedRoles || u.assignedRoles.length === 0) && (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{u.department}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        label={u.active ? 'Actif' : 'Inactif'}
                        size="small"
                        color={u.active ? 'success' : 'default'}
                        sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{u.createdAt}</Typography></TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Modifier">
                          <IconButton size="small" color="primary" onClick={() => { setEditItem(u); setFormOpen(true); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {u.id !== currentUser?.id && (
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

      <UserForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} editItem={editItem} departments={departments} customRoles={customRoles} />
      <ConfirmDialog
        open={deleteDialog.open}
        title="Supprimer l'Utilisateur"
        message={`Supprimer "${deleteDialog.name}" et TOUS ses matériels ? Cette action est irréversible.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default UserManagement;
