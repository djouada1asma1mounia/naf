import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  TextField, Button, MenuItem, Box, Typography, Divider,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { MATERIAL_STATUSES } from '../../utils/constants';

const initialForm = {
  name: '', brand: '', model: '', serialNumber: '', inventoryNumber: '',
  category: '', categoryId: '', status: 'Actif',
  owner: '', ownerId: '', subsidiaryName: '', subsidiaryCode: '',
  purchaseDate: '', warrantyExpiry: '', description: '',
};

const GdMaterialForm = ({
  open,
  onClose,
  onSubmit,
  editItem,
  categories = [],
  subsidiaries = [],
  owners = [],
  canSelectOwner = false,
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({ ...initialForm, ...editItem });
    } else {
      setForm({
        ...initialForm,
        owner: `${user?.firstName} ${user?.lastName}`,
        ownerId: user?.id,
      });
    }
    setErrors({});
  }, [editItem, open, user]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: '' }));
  };

  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    const cat = categories.find((c) => String(c.id) === String(selectedId));
    setForm((f) => ({ ...f, categoryId: selectedId, category: cat?.name || '' }));
  };

  const handleSubsidiaryChange = (e) => {
    const selectedCode = e.target.value;
    const subsidiary = subsidiaries.find((s) => String(s.code) === String(selectedCode));
    setForm((f) => ({
      ...f,
      subsidiaryCode: selectedCode,
      subsidiaryName: subsidiary?.name || '',
      serviceId: null,
      serviceName: '',
    }));
    if (errors.subsidiaryCode) setErrors((err) => ({ ...err, subsidiaryCode: '' }));
  };

  const handleOwnerChange = (e) => {
    const selectedId = e.target.value;
    const owner = owners.find((o) => String(o.id) === String(selectedId));
    setForm((f) => ({ ...f, ownerId: selectedId, owner: owner?.label || '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.brand || !form.brand.trim()) newErrors.brand = 'Champ requis';
    if (!form.model || !form.model.trim()) newErrors.model = 'Champ requis';
    if (!form.inventoryNumber || !form.inventoryNumber.trim()) newErrors.inventoryNumber = 'Champ requis';
    if (!form.serialNumber || !form.serialNumber.trim()) newErrors.serialNumber = 'Champ requis';
    if (!form.categoryId) newErrors.categoryId = 'Champ requis';
    if (!form.subsidiaryCode) newErrors.subsidiaryCode = 'Champ requis';
    if (!form.status) newErrors.status = 'Champ requis';
    if (!form.ownerId) newErrors.ownerId = 'Propriétaire introuvable';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {editItem ? 'Modifier le GD Material' : 'Nouveau GD Material'}
          </Typography>
          {editItem && editItem.serialNumber && (
            <Typography variant="caption" color="text.secondary">
              N° Série: {editItem.serialNumber}
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Box component="form" id="gd-material-form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marque *"
                value={form.brand}
                onChange={handleChange('brand')}
                error={!!errors.brand}
                helperText={errors.brand}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Modèle *"
                value={form.model}
                onChange={handleChange('model')}
                error={!!errors.model}
                helperText={errors.model}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro d'Inventaire *"
                value={form.inventoryNumber}
                onChange={handleChange('inventoryNumber')}
                error={!!errors.inventoryNumber}
                helperText={errors.inventoryNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro de Série *"
                value={form.serialNumber}
                onChange={handleChange('serialNumber')}
                disabled={!!editItem}
                error={!!errors.serialNumber}
                helperText={errors.serialNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Catégorie *"
                value={form.categoryId}
                onChange={handleCategoryChange}
                error={!!errors.categoryId}
                helperText={errors.categoryId}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Statut *"
                value={form.status}
                onChange={handleChange('status')}
                error={!!errors.status}
                helperText={errors.status}
              >
                {MATERIAL_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Name Raison *"
                value={form.subsidiaryCode || ''}
                onChange={handleSubsidiaryChange}
                error={!!errors.subsidiaryCode}
                helperText={errors.subsidiaryCode}
              >
                {subsidiaries.map((s) => (
                  <MenuItem key={s.code} value={s.code}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code"
                value={form.subsidiaryCode || ''}
                disabled
                helperText="Code lié au name raison"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {canSelectOwner ? (
                <TextField
                  fullWidth
                  select
                  label="Utilisateur *"
                  value={form.ownerId || ''}
                  onChange={handleOwnerChange}
                  error={!!errors.ownerId}
                  helperText={errors.ownerId || 'Choisissez le propriétaire du matériel'}
                >
                  {form.ownerId && !owners.some((o) => String(o.id) === String(form.ownerId)) && (
                    <MenuItem value={form.ownerId}>{form.owner || form.ownerId}</MenuItem>
                  )}
                  {owners.map((o) => (
                    <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  label="Utilisateur"
                  value={form.owner}
                  disabled
                  error={!!errors.ownerId}
                  helperText={errors.ownerId || 'Attribué via l’utilisateur connecté'}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={form.purchaseDate}
                onChange={handleChange('purchaseDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fin de Garantie"
                type="date"
                value={form.warrantyExpiry}
                onChange={handleChange('warrantyExpiry')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={form.description}
                onChange={handleChange('description')}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" form="gd-material-form" variant="contained" disabled={loading}>
          {editItem ? 'Modifier' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GdMaterialForm;
