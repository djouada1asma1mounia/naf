import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField,
  InputAdornment, IconButton, Tooltip, MenuItem, Select, FormControl,
  InputLabel, Grid, Typography, Skeleton, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ComputerIcon from '@mui/icons-material/Computer';
import { useAuth } from '../../context/AuthContext';
import { materialsAPI } from '../../api/materials';
import { categoriesAPI } from '../../api/categories';
import { structuresAPI } from '../../api/structures';
import { servicesAPI } from '../../api/services';
import { authAPI } from '../../api/auth';
import PageHeader from '../../components/common/PageHeader';
import { StatusChip } from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MaterialForm from './MaterialForm';
import { MATERIAL_STATUSES } from '../../utils/constants';
import { useSnackbar } from 'notistack';

const MATERIAL_PERMISSIONS = {
  createOwn: ['create-materiel', 'create materiel', 'cree material', 'cree materiel'],
  createAll: ['create-materiels', 'create materiels', 'create materials', 'cree materials', 'cree materiels'],
  readOwn: ['read-materiel', 'read materiel', 'read material', 'read-my-materiels', 'read my materiels', 'read my materials', 'read-my-materials'],
  readAll: ['read-materiels', 'read materiels', 'read materials'],
  updateOwn: ['update-materiel', 'update materiel', 'update material'],
  updateAll: ['update-materiels', 'update materiels', 'update materials'],
  deleteOwn: ['delete-materiel', 'delete materiel', 'delete material'],
  deleteAll: ['delete-materiels', 'delete materiels', 'delete materials'],
};

const MaterialsList = () => {
  const { user, hasPermissionAny } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [filters, setFilters] = useState({ search: '', status: '', categoryId: '', serviceId: '', departmentId: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canReadOwn = hasPermissionAny(MATERIAL_PERMISSIONS.readOwn);
  const canReadAll = hasPermissionAny(MATERIAL_PERMISSIONS.readAll);
  const canCreateOwn = hasPermissionAny(MATERIAL_PERMISSIONS.createOwn);
  const canCreateAll = hasPermissionAny(MATERIAL_PERMISSIONS.createAll);
  const canUpdateOwn = hasPermissionAny(MATERIAL_PERMISSIONS.updateOwn);
  const canUpdateAll = hasPermissionAny(MATERIAL_PERMISSIONS.updateAll);
  const canDeleteOwn = hasPermissionAny(MATERIAL_PERMISSIONS.deleteOwn);
  const canDeleteAll = hasPermissionAny(MATERIAL_PERMISSIONS.deleteAll);

  const canReadAny = canReadOwn || canReadAll;
  const canCreateAny = canCreateOwn || canCreateAll;
  const canUpdateAny = canUpdateOwn || canUpdateAll;
  const canDeleteAny = canDeleteOwn || canDeleteAll;
  const canMutateAny = canUpdateAny || canDeleteAny;

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '—');

  const canUpdateMaterial = () => canUpdateAny;
  const canDeleteMaterial = () => canDeleteAny;

  const loadData = useCallback(async () => {
    setLoading(true);
    if (!canReadAny) {
      setMaterials([]);
      setCategories([]);
      setServices([]);
      setDepartments([]);
      setOwners([]);
      enqueueSnackbar('Vous n\'avez pas la permission de lire les matériels.', { variant: 'warning' });
      setLoading(false);
      return;
    }

    const apiFilters = { ...filters };
    if (!canReadAll) apiFilters.ownerId = user?.id;

    const loaders = [
      materialsAPI.getAll(apiFilters),
      categoriesAPI.getAll(),
      servicesAPI.getAll(),
      structuresAPI.getDepartments(),
      canCreateAny || canUpdateAny ? authAPI.getUsers() : Promise.resolve([]),
    ];

    const [matsResult, catsResult, servicesResult, deptsResult, ownersResult] = await Promise.allSettled(loaders);

    if (matsResult.status === 'fulfilled') {
      setMaterials(matsResult.value || []);
    } else {
      setMaterials([]);
      enqueueSnackbar('Impossible de charger les matériels.', { variant: 'warning' });
    }

    if (catsResult.status === 'fulfilled') {
      setCategories(catsResult.value || []);
    } else {
      setCategories([]);
      enqueueSnackbar('Impossible de charger les catégories.', { variant: 'warning' });
    }

    if (servicesResult.status === 'fulfilled') {
      setServices(servicesResult.value || []);
    } else {
      setServices([]);
      enqueueSnackbar('Impossible de charger les services.', { variant: 'warning' });
    }

    if (deptsResult.status === 'fulfilled') {
      setDepartments(deptsResult.value || []);
    } else {
      setDepartments([]);
      enqueueSnackbar('Impossible de charger les départements.', { variant: 'warning' });
    }

    if (ownersResult.status === 'fulfilled') {
      setOwners((ownersResult.value || []).map((owner) => ({
        id: owner.id,
        label: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email || owner.id,
        departmentId: owner.departmentId,
      })));
    } else {
      setOwners([]);
      if (canCreateAny || canUpdateAny) {
        enqueueSnackbar('Impossible de charger la liste des propriétaires.', { variant: 'warning' });
      }
    }

    setLoading(false);
  }, [
    filters,
    user,
    canReadAny,
    canReadAll,
    canCreateAny,
    canUpdateAny,
    enqueueSnackbar,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (field) => (e) => {
    setFilters((f) => ({ ...f, [field]: e.target.value }));
    setPage(0);
  };

  const handleEdit = (mat) => {
    setEditItem(mat);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editItem && !canUpdateMaterial(editItem)) {
        throw new Error('Vous n\'avez pas la permission de modifier les matériels.');
      }

      const payload = { ...data };

      if (editItem) {
        payload.ownerId = data?.ownerId || editItem.ownerId || user?.id;
      } else {
        if (!canCreateAny) {
          throw new Error('Vous n\'avez pas la permission de créer des matériels.');
        }
        payload.ownerId = data?.ownerId || user?.id;
      }

      if (!payload.ownerId) {
        throw new Error('Utilisateur introuvable. Reconnectez-vous puis réessayez.');
      }

      if (editItem) {
        await materialsAPI.update(editItem.id, payload);
        enqueueSnackbar('Matériel modifié avec succès', { variant: 'success' });
      } else {
        await materialsAPI.create(payload);
        enqueueSnackbar('Matériel créé avec succès', { variant: 'success' });
      }
      setFormOpen(false);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur lors de la sauvegarde', { variant: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const target = materials.find((item) => String(item.id) === String(deleteDialog.id));
      if (!target || !canDeleteMaterial(target)) {
        throw new Error('Vous n\'avez pas la permission de supprimer ce matériel.');
      }
      await materialsAPI.delete(deleteDialog.id);
      enqueueSnackbar('Matériel supprimé', { variant: 'success' });
      setDeleteDialog({ open: false, id: null, name: '' });
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur lors de la suppression', { variant: 'error' });
    }
    setDeleteLoading(false);
  };

  const displayedMaterials = materials.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <PageHeader
        title="Matériels"
        subtitle={`${materials.length} matériel(s) trouvé(s)`}
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Matériels' }]}
        action={
          canCreateAny && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              Nouveau Matériel
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={5}>
              <TextField
                fullWidth
                placeholder="Rechercher par utilisateur, N° série ou N° inventaire..."
                value={filters.search}
                onChange={handleFilterChange('search')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select value={filters.status} onChange={handleFilterChange('status')} label="Statut">
                  <MenuItem value="">Tous</MenuItem>
                  {MATERIAL_STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Catégorie</InputLabel>
                <Select value={filters.categoryId} onChange={handleFilterChange('categoryId')} label="Catégorie">
                  <MenuItem value="">Toutes</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Service</InputLabel>
                <Select value={filters.serviceId} onChange={handleFilterChange('serviceId')} label="Service">
                  <MenuItem value="">Tous</MenuItem>
                  {services.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {canReadAll && (
              <Grid item xs={6} sm={3} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Département</InputLabel>
                  <Select value={filters.departmentId} onChange={handleFilterChange('departmentId')} label="Département">
                    <MenuItem value="">Tous</MenuItem>
                    {departments.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Désignation</TableCell>
                <TableCell>N° INV</TableCell>
                <TableCell>N° Série</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date</TableCell>
                {canMutateAny && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayedMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canMutateAny ? 9 : 8} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1} color="text.secondary">
                      <ComputerIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      <Typography variant="body2">Aucun matériel trouvé</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayedMaterials.map((mat) => (
                  <TableRow key={mat.id}>
                    <TableCell>
                      <Typography variant="body2">{mat.owner || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{mat.brand || mat.name || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{mat.model || '—'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{mat.inventoryNumber || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={mat.serialNumber || '—'} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{mat.category || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{mat.serviceName || '—'}</Typography>
                    </TableCell>
                    <TableCell><StatusChip status={mat.status} /></TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{formatDate(mat.purchaseDate)}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDate(mat.warrantyExpiry)}</Typography>
                      </Box>
                    </TableCell>
                    {canMutateAny && (
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          {canUpdateMaterial(mat) && (
                            <Tooltip title="Modifier">
                              <IconButton size="small" color="primary" onClick={() => handleEdit(mat)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDeleteMaterial(mat) && (
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteDialog({ open: true, id: mat.id, name: mat.name })}
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={materials.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, np) => setPage(np)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Card>

      {/* Material Form Modal */}
      <MaterialForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        editItem={editItem}
        categories={categories}
        services={services}
        owners={owners}
        canSelectOwner={editItem ? canUpdateAny : canCreateAny}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Supprimer le Matériel"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteDialog.name}" ? Cette action est irréversible.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default MaterialsList;
