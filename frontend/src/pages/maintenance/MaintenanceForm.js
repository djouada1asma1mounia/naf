import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  TextField, Button, MenuItem, Box, Typography, Divider, Chip,
} from '@mui/material';
import { materialsAPI } from '../../api/materials';
import { subsidiariesAPI } from '../../api/subsidiaries';
import { useAuth } from '../../context/AuthContext';

const initialForm = {
  materialId: '',
  interventionType: 'HARD',
  status: 'A_FAIRE',
  destinataire: '',
  interventionnaireNom: '',
  interventionnairePrenom: '',
  interventionnaireFonction: '',
  observation: '',
  itemQuantity: 1,
  itemDesignation: '',
  itemMarque: '',
  itemNumeroSerie: '',
  itemNumeroInventaire: '',
};

const STATUS_OPTIONS = [
  { value: 'A_FAIRE', label: 'Planifiée' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminée' },
];

const toStatusCode = (value) => {
  if (!value) return 'A_FAIRE';
  const normalized = String(value).trim().toUpperCase();
  if (['A_FAIRE', 'EN_COURS', 'TERMINE'].includes(normalized)) return normalized;
  if (normalized === 'PLANIFIEE' || normalized === 'PLANIFIÉE') return 'A_FAIRE';
  if (normalized === 'EN COURS') return 'EN_COURS';
  if (normalized === 'TERMINEE' || normalized === 'TERMINÉE') return 'TERMINE';
  return 'A_FAIRE';
};

const MaintenanceForm = ({ open, onClose, onSubmit, mode = 'create', initialData = null }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    if (!open) return;

    const loadMaterials = async () => {
      try {
        const [standardMaterials, subsidiaries] = await Promise.all([
          materialsAPI.getAll(),
          subsidiariesAPI.getAll(),
        ]);

        const gdResults = await Promise.allSettled(
          (subsidiaries || []).map((subsidiary) => materialsAPI.getBySubsidiary(subsidiary.code)),
        );

        const gdMaterials = gdResults
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => result.value || []);

        const merged = [...(standardMaterials || []), ...gdMaterials];
        const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
        setMaterials(unique);
      } catch {
        setMaterials([]);
      }
    };

    loadMaterials();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialData) {
      const firstItem = Array.isArray(initialData.items) ? (initialData.items[0] || {}) : {};
      setForm({
        ...initialForm,
        interventionType: initialData.interventionType || initialData.type || 'HARD',
        status: toStatusCode(initialData.statusCode || initialData.status),
        destinataire: initialData.destinataire || initialData.department || '',
        interventionnaireNom: initialData.interventionnaireNom || '',
        interventionnairePrenom: initialData.interventionnairePrenom || '',
        interventionnaireFonction: initialData.interventionnaireFonction || '',
        observation: initialData.observation || '',
        itemQuantity: Number(firstItem.quantity) > 0 ? Number(firstItem.quantity) : 1,
        itemDesignation: firstItem.designation || initialData.materialName || '',
        itemMarque: firstItem.marque || '',
        itemNumeroSerie: firstItem.numeroSerie || initialData.materialCode || '',
        itemNumeroInventaire: firstItem.numeroInventaire || '',
      });
    } else {
      setForm({
        ...initialForm,
        interventionnaireNom: user?.lastName || '',
        interventionnairePrenom: user?.firstName || '',
        interventionnaireFonction: user?.role || '',
      });
    }

    setErrors({});
  }, [open, user, mode, initialData]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: '' }));
  };

  const selectedMaterial = useMemo(
    () => materials.find((m) => String(m.id) === String(form.materialId)) || null,
    [materials, form.materialId],
  );

  const getMaterialSearchText = (mat = {}) => [
    mat.name,
    mat.serialNumber,
    mat.inventoryNumber,
    mat.code,
    mat.brand,
    mat.model,
    mat.subsidiaryCode,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .join(' ');

  const getMaterialLabel = (mat = {}) => {
    const designation = mat.name || 'Matériel';
    const serial = mat.serialNumber || mat.code || 'N/A';
    return `${designation} - SN: ${serial}`;
  };

  const handleMaterialSelect = (_, mat) => {
    if (mat) {
      setForm((f) => ({
        ...f,
        materialId: mat.id,
        destinataire: f.destinataire || mat.department || '',
        itemDesignation: mat.name || '',
        itemMarque: mat.brand || '',
        itemNumeroSerie: mat.serialNumber || '',
        itemNumeroInventaire: mat.inventoryNumber || '',
      }));
      if (errors.materialId) setErrors((err) => ({ ...err, materialId: '' }));
    } else {
      setForm((f) => ({
        ...f,
        materialId: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (mode === 'create' && !form.materialId) newErrors.materialId = 'Champ requis';
    if (!form.destinataire.trim()) newErrors.destinataire = 'Champ requis';
    if (!form.interventionnaireNom.trim()) newErrors.interventionnaireNom = 'Champ requis';
    if (!form.interventionnairePrenom.trim()) newErrors.interventionnairePrenom = 'Champ requis';
    if (!form.interventionnaireFonction.trim()) newErrors.interventionnaireFonction = 'Champ requis';
    if (!form.itemDesignation.trim()) newErrors.itemDesignation = 'Champ requis';
    if (!Number(form.itemQuantity) || Number(form.itemQuantity) < 1) newErrors.itemQuantity = 'Minimum 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      interventionType: form.interventionType,
      status: form.status,
      observation: form.observation?.trim() || undefined,
      destinataire: form.destinataire.trim(),
      interventionnaireNom: form.interventionnaireNom.trim(),
      interventionnairePrenom: form.interventionnairePrenom.trim(),
      interventionnaireFonction: form.interventionnaireFonction.trim(),
      items: [
        {
          designation: form.itemDesignation.trim(),
          quantity: Number(form.itemQuantity),
          marque: form.itemMarque?.trim() || undefined,
          numeroSerie: form.itemNumeroSerie?.trim() || undefined,
          numeroInventaire: form.itemNumeroInventaire?.trim() || undefined,
        },
      ],
    };

    setLoading(true);
    try {
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>
          {mode === 'edit' ? 'Modifier Intervention' : 'Nouvelle Intervention'}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Box component="form" id="maintenance-form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={materials}
                value={selectedMaterial}
                onChange={handleMaterialSelect}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                getOptionLabel={getMaterialLabel}
                filterOptions={(options, state) => {
                  const query = String(state.inputValue || '').trim().toLowerCase();
                  if (!query) return options;
                  return options.filter((option) => getMaterialSearchText(option).includes(query));
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ py: 1.2 }}>
                    <Box sx={{ width: '100%' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {option.name || 'Matériel'}
                        </Typography>
                        {option.subsidiaryCode ? <Chip size="small" label={`GD ${option.subsidiaryCode}`} color="info" /> : null}
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Série: {option.serialNumber || option.code || 'N/A'} | Inventaire: {option.inventoryNumber || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Matériel *"
                    placeholder="Chercher par désignation, série ou inventaire"
                    error={!!errors.materialId}
                    helperText={errors.materialId || 'Recherchez rapidement: désignation, numéro de série, numéro inventaire'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Type d'intervention" value={form.interventionType} onChange={handleChange('interventionType')}>
                <MenuItem value="HARD">HARD</MenuItem>
                <MenuItem value="SOFT">SOFT</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Statut" value={form.status} onChange={handleChange('status')}>
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Nom Interventionnaire *"
                value={form.interventionnaireNom}
                onChange={handleChange('interventionnaireNom')}
                error={!!errors.interventionnaireNom}
                helperText={errors.interventionnaireNom}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Prénom Interventionnaire *"
                value={form.interventionnairePrenom}
                onChange={handleChange('interventionnairePrenom')}
                error={!!errors.interventionnairePrenom}
                helperText={errors.interventionnairePrenom}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Fonction Interventionnaire *"
                value={form.interventionnaireFonction}
                onChange={handleChange('interventionnaireFonction')}
                error={!!errors.interventionnaireFonction}
                helperText={errors.interventionnaireFonction}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Destinataire *"
                value={form.destinataire}
                onChange={handleChange('destinataire')}
                error={!!errors.destinataire}
                helperText={errors.destinataire}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Quantité *"
                type="number"
                inputProps={{ min: 1 }}
                value={form.itemQuantity}
                onChange={handleChange('itemQuantity')}
                error={!!errors.itemQuantity}
                helperText={errors.itemQuantity}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Marque"
                value={form.itemMarque}
                onChange={handleChange('itemMarque')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Désignation *"
                value={form.itemDesignation}
                onChange={handleChange('itemDesignation')}
                error={!!errors.itemDesignation}
                helperText={errors.itemDesignation}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro de série"
                value={form.itemNumeroSerie}
                onChange={handleChange('itemNumeroSerie')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro d'inventaire"
                value={form.itemNumeroInventaire}
                onChange={handleChange('itemNumeroInventaire')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observation"
                value={form.observation}
                onChange={handleChange('observation')}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Annuler</Button>
        <Button type="submit" form="maintenance-form" variant="contained" disabled={loading}>
          {mode === 'edit' ? 'Modifier' : 'Creer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaintenanceForm;
