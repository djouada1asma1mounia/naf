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
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import { useAuth } from '../../context/AuthContext';
import { materialsAPI } from '../../api/materials';
import { categoriesAPI } from '../../api/categories';
import { subsidiariesAPI } from '../../api/subsidiaries';
import { authAPI } from '../../api/auth';
import PageHeader from '../../components/common/PageHeader';
import { StatusChip } from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import GdMaterialForm from './GdMaterialForm';
import { MATERIAL_STATUSES } from '../../utils/constants';
import { useSnackbar } from 'notistack';

const GD_PERMISSIONS = {
  create: ['create-subsidiary', 'create subsidiary', 'create-subsidiaries', 'create subsidiaries'],
  read: ['read-subsidiary', 'read subsidiary', 'read-subsidiaries', 'read subsidiaries'],
  update: ['update-subsidiary', 'update subsidiary', 'update-subsidiaries', 'update subsidiaries'],
  remove: ['delete-subsidiary', 'delete subsidiary', 'delete-subsidiaries', 'delete subsidiaries'],
};

const GdMaterialsList = () => {
  const { user, hasPermissionAny } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [filters, setFilters] = useState({ search: '', status: '', categoryId: '', subsidiaryCode: '', ownerId: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canReadAny = hasPermissionAny(GD_PERMISSIONS.read);
  const canCreateAny = hasPermissionAny(GD_PERMISSIONS.create);
  const canUpdateAny = hasPermissionAny(GD_PERMISSIONS.update);
  const canDeleteAny = hasPermissionAny(GD_PERMISSIONS.remove);
  const canMutateAny = canUpdateAny || canDeleteAny;

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '—');

  const canUpdateMaterial = () => canUpdateAny;
  const canDeleteMaterial = () => canDeleteAny;

  const loadData = useCallback(async () => {
    setLoading(true);
    if (!canReadAny) {
      setMaterials([]);
      setCategories([]);
      setSubsidiaries([]);
      setOwners([]);
      enqueueSnackbar('Vous n\'avez pas la permission de lire les matériels GD (matériels + raisons).', { variant: 'warning' });
      setLoading(false);
      return;
    }

    const apiFilters = {
      status: filters.status,
      categoryId: filters.categoryId,
      ownerId: filters.ownerId || undefined,
    };

    const loaders = [
      categoriesAPI.getAll(),
      subsidiariesAPI.getAll(),
      canReadAny || canCreateAny || canUpdateAny ? authAPI.getUsers() : Promise.resolve([]),
    ];

    const [catsResult, subsResult, ownersResult] = await Promise.allSettled(loaders);

    let materialsResult = [];
    try {
      if (filters.subsidiaryCode) {
        // Direct GD endpoint when a specific subsidiary is selected.
        materialsResult = await materialsAPI.getBySubsidiary(filters.subsidiaryCode, apiFilters);
      } else if (subsResult.status === 'fulfilled' && (subsResult.value || []).length > 0) {
        // Aggregate GD materials by each subsidiary code.
        const subsidiaryMaterials = await Promise.allSettled(
          (subsResult.value || []).map((subsidiary) => materialsAPI.getBySubsidiary(subsidiary.code, apiFilters)),
        );

        const merged = subsidiaryMaterials
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => result.value || []);

        materialsResult = Array.from(new Map(merged.map((item) => [item.id, item])).values());
      } else {
        // Fallback when subsidiary list is unavailable.
        const allMaterials = await materialsAPI.getAll(apiFilters);
        materialsResult = (allMaterials || []).filter((item) => String(item?.subsidiaryCode || '').trim() !== '');
      }

      setMaterials(materialsResult);
    } catch (_error) {
      setMaterials([]);
      enqueueSnackbar('Impossible de charger les matériels GD.', { variant: 'warning' });
    }

    if (catsResult.status === 'fulfilled') {
      setCategories(catsResult.value || []);
    } else {
      setCategories([]);
      enqueueSnackbar('Impossible de charger les catégories.', { variant: 'warning' });
    }

    if (subsResult.status === 'fulfilled') {
      setSubsidiaries(subsResult.value || []);
    } else {
      const derivedSubsidiaries = Array.from(
        new Map(
          (materialsResult || [])
            .filter((item) => item?.subsidiaryCode)
            .map((item) => [item.subsidiaryCode, { code: item.subsidiaryCode, name: item.subsidiaryName || item.subsidiaryCode }]),
        ).values(),
      );
      setSubsidiaries(derivedSubsidiaries);
    }

    if (ownersResult.status === 'fulfilled') {
      setOwners((ownersResult.value || []).map((owner) => ({
        id: owner.id,
        label: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email || owner.id,
        departmentId: owner.departmentId,
      })));
    } else {
      setOwners([]);
      if (canReadAny || canCreateAny || canUpdateAny) {
        enqueueSnackbar('Impossible de charger la liste des propriétaires.', { variant: 'warning' });
      }
    }

    setLoading(false);
  }, [
    filters,
    canReadAny,
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
        throw new Error('Vous ne pouvez modifier que vos propres matériels GD.');
      }

      const payload = {
        ...data,
        serviceId: null,
      };

      if (editItem) {
        payload.ownerId = data?.ownerId || editItem.ownerId || user?.id;
      } else {
        if (!canCreateAny) {
          throw new Error('Vous n\'avez pas la permission de créer des matériels GD.');
        }
        payload.ownerId = data?.ownerId || user?.id;
      }

      if (!payload.ownerId) {
        throw new Error('Utilisateur introuvable. Reconnectez-vous puis réessayez.');
      }

      if (!payload.subsidiaryCode) {
        throw new Error('Le champ name raison est obligatoire.');
      }

      if (editItem) {
        await materialsAPI.update(editItem.id, payload);
        enqueueSnackbar('GD Material modifié avec succès', { variant: 'success' });
      } else {
        await materialsAPI.create(payload);
        enqueueSnackbar('GD Material créé avec succès', { variant: 'success' });
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
        throw new Error('Vous ne pouvez supprimer que vos propres matériels GD.');
      }
      await materialsAPI.delete(deleteDialog.id);
      enqueueSnackbar('GD Material supprimé', { variant: 'success' });
      setDeleteDialog({ open: false, id: null, name: '' });
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur lors de la suppression', { variant: 'error' });
    }
    setDeleteLoading(false);
  };

  const filteredMaterials = materials.filter((mat) => {
    if (!filters.search) return true;
    const s = String(filters.search).toLowerCase();
    const haystack = [
      mat.subsidiaryName,
      mat.subsidiaryCode,
      mat.owner,
      mat.ownerId,
      mat.brand,
      mat.model,
      mat.name,
      mat.serialNumber,
      mat.inventoryNumber,
      mat.category,
    ]
      .map((value) => String(value || '').toLowerCase())
      .join(' ');

    return haystack.includes(s);
  });

  const displayedMaterials = filteredMaterials.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <PageHeader
        title="GD Material"
        subtitle={`${materials.length} matériel(s) GD trouvé(s)`}
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'GD Material' }]}
        action={
          canCreateAny && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              Nouveau GD Material
            </Button>
          )
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={5}>
              <TextField
                fullWidth
                placeholder="Rechercher par raison, code, utilisateur, désignation, N° série, N° inv..."
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
                <InputLabel>RAISON</InputLabel>
                <Select value={filters.subsidiaryCode} onChange={handleFilterChange('subsidiaryCode')} label="RAISON">
                  <MenuItem value="">Tous</MenuItem>
                  {subsidiaries.map((s) => (
                    <MenuItem key={s.code} value={s.code}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {canReadAny && (
              <Grid item xs={6} sm={3} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Utilisateur</InputLabel>
                  <Select value={filters.ownerId} onChange={handleFilterChange('ownerId')} label="Utilisateur">
                    <MenuItem value="">Tous</MenuItem>
                    {owners.map((o) => (
                      <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>RAISON</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Désignation</TableCell>
                <TableCell>N° Série</TableCell>
                <TableCell>N° INV</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Statut</TableCell>
                {canMutateAny && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: canMutateAny ? 10 : 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayedMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canMutateAny ? 10 : 9} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1} color="text.secondary">
                      <LocalGasStationIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      <Typography variant="body2">Aucun matériel GD trouvé</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayedMaterials.map((mat) => (
                  <TableRow key={mat.id}>
                    <TableCell>
                      <Typography variant="body2">{mat.subsidiaryName || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{mat.subsidiaryCode || '—'}</Typography>
                    </TableCell>
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
                      <Chip label={mat.serialNumber || '—'} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{mat.inventoryNumber || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{mat.category || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{formatDate(mat.purchaseDate)}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDate(mat.warrantyExpiry)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><StatusChip status={mat.status} /></TableCell>
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
          count={filteredMaterials.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, np) => setPage(np)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Card>

      <GdMaterialForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        editItem={editItem}
        categories={categories}
        subsidiaries={subsidiaries}
        owners={owners}
        canSelectOwner={canCreateAny || canUpdateAny}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Supprimer le GD Material"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteDialog.name}" ? Cette action est irréversible.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default GdMaterialsList;
