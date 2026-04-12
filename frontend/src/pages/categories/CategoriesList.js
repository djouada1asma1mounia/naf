import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Typography, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
  Divider, Skeleton, Avatar, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import { categoriesAPI } from '../../api/categories';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_PERMISSIONS = {
  create: ['create-category', 'create category'],
  read: ['read-categories', 'read categories', 'read-category', 'read category'],
  update: ['update-category', 'update category'],
  remove: ['delete-category', 'delete category'],
};

const CategoryForm = ({ open, onClose, onSubmit, editItem }) => {
  const [form, setForm] = useState({ name: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(editItem ? { name: editItem.name } : { name: '' });
    setErrors({});
  }, [editItem, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Champ requis' }); return; }
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>
          {editItem ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box component="form" id="cat-form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Nom de la catégorie *"
            value={form.name}
            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors({}); }}
            error={!!errors.name}
            helperText={errors.name}
            sx={{ mb: 1 }}
          />
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Annuler</Button>
        <Button type="submit" form="cat-form" variant="contained" disabled={loading}>
          {editItem ? 'Modifier' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CategoriesList = () => {
  const { hasPermissionAny } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canCreate = hasPermissionAny(CATEGORY_PERMISSIONS.create);
  const canRead = hasPermissionAny(CATEGORY_PERMISSIONS.read);
  const canUpdate = hasPermissionAny(CATEGORY_PERMISSIONS.update);
  const canDelete = hasPermissionAny(CATEGORY_PERMISSIONS.remove);
  const canMutate = canUpdate || canDelete;

  const loadData = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      setCategories([]);
      enqueueSnackbar('Vous n\'avez pas la permission de lire les catégories.', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try { setCategories(await categoriesAPI.getAll()); } catch {}
    setLoading(false);
  }, [canRead, enqueueSnackbar]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFormSubmit = async (data) => {
    try {
      if (editItem) {
        if (!canUpdate) throw new Error('Vous n\'avez pas la permission de modifier les catégories.');
        await categoriesAPI.update(editItem.id, data);
        enqueueSnackbar('Catégorie modifiée', { variant: 'success' });
      } else {
        if (!canCreate) throw new Error('Vous n\'avez pas la permission de créer des catégories.');
        await categoriesAPI.create(data);
        enqueueSnackbar('Catégorie créée', { variant: 'success' });
      }
      setFormOpen(false);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      enqueueSnackbar('Vous n\'avez pas la permission de supprimer des catégories.', { variant: 'warning' });
      return;
    }

    setDeleteLoading(true);
    try {
      await categoriesAPI.delete(deleteDialog.id);
      enqueueSnackbar('Catégorie supprimée', { variant: 'success' });
      setDeleteDialog({ open: false, id: null, name: '' });
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur', { variant: 'error' });
    }
    setDeleteLoading(false);
  };

  const COLORS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];

  return (
    <Box>
      <PageHeader
        title="Catégories de Matériels"
        subtitle={`${categories.length} catégorie(s)`}
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Catégories' }]}
        action={
          canCreate ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
              Nouvelle Catégorie
            </Button>
          ) : null
        }
      />

      <Grid container spacing={2.5}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))
        ) : categories.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <CategoryIcon sx={{ fontSize: 50, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Aucune catégorie</Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          categories.map((cat, idx) => (
            <Grid item xs={12} sm={6} md={4} key={cat.id}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  transition: 'transform 0.15s',
                  '&:hover': { transform: 'translateY(-2px)' },
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ bgcolor: `${COLORS[idx % COLORS.length]}.main`, borderRadius: 2 }}>
                        <CategoryIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{cat.name}</Typography>
                        <Chip
                          label={`ID #${cat.id}`}
                          size="small"
                          color={COLORS[idx % COLORS.length]}
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Box>
                    </Box>
                    {canMutate && (
                      <Box display="flex" gap={0.5}>
                        {canUpdate && (
                          <Tooltip title="Modifier">
                            <IconButton size="small" color="primary" onClick={() => { setEditItem(cat); setFormOpen(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Supprimer">
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: cat.id, name: cat.name })}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <CategoryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        editItem={editItem}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Supprimer la Catégorie"
        message={`Supprimer "${deleteDialog.name}" ? Les matériels associés ne seront pas supprimés.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default CategoriesList;
