import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../context/AuthContext';
import { maintenanceAPI } from '../../api/maintenance';

const emptyItem = {
  designation: '',
  quantity: 1,
  marque: '',
  numeroSerie: '',
  numeroInventaire: '',
};

const initialForm = {
  sourceMode: 'free',
  linkedInterventionIds: [],
  maintenanceType: 'HARD',
  observation: '',
  destinataire: '',
  receptionnaireNom: '',
  receptionnairePrenom: '',
  receptionnaireFonction: '',
  items: [{ ...emptyItem }],
};

const toText = (value) => String(value || '').trim();

const mergeInterventionItems = (interventions = []) => {
  const map = new Map();

  interventions.forEach((intervention) => {
    (intervention.items || []).forEach((item) => {
      const key = [
        toText(item.designation).toLowerCase(),
        toText(item.numeroSerie).toLowerCase(),
        toText(item.numeroInventaire).toLowerCase(),
      ].join('|');

      if (!map.has(key)) {
        map.set(key, {
          designation: toText(item.designation),
          quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
          marque: toText(item.marque),
          numeroSerie: toText(item.numeroSerie),
          numeroInventaire: toText(item.numeroInventaire),
        });
      } else {
        const existing = map.get(key);
        existing.quantity += Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      }
    });
  });

  const merged = Array.from(map.values());
  return merged.length > 0 ? merged : [{ ...emptyItem }];
};

const DechargeForm = ({ open, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [interventions, setInterventions] = useState([]);

  useEffect(() => {
    if (!open) return;

    const loadInterventions = async () => {
      try {
        const data = await maintenanceAPI.getAll();
        setInterventions(data);
      } catch {
        setInterventions([]);
      }
    };

    loadInterventions();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setForm({
      ...initialForm,
      receptionnaireNom: user?.lastName || '',
      receptionnairePrenom: user?.firstName || '',
      receptionnaireFonction: user?.role || '',
    });
    setErrors({});
  }, [open, user]);

  const selectedInterventions = useMemo(
    () => interventions.filter((inv) => form.linkedInterventionIds.includes(inv.id)),
    [interventions, form.linkedInterventionIds],
  );

  const applyInterventionData = (selected = []) => {
    const first = selected[0];
    const refs = selected.map((inv) => inv.reference).filter(Boolean).join(', ');

    setForm((prev) => ({
      ...prev,
      maintenanceType: first?.type || prev.maintenanceType,
      destinataire: first?.destinataire || prev.destinataire,
      receptionnaireNom: first?.interventionnaireNom || prev.receptionnaireNom,
      receptionnairePrenom: first?.interventionnairePrenom || prev.receptionnairePrenom,
      receptionnaireFonction: first?.interventionnaireFonction || prev.receptionnaireFonction,
      observation: refs ? `Décharge liée aux interventions: ${refs}` : prev.observation,
      items: mergeInterventionItems(selected),
    }));
  };

  const handleSourceModeChange = (_, value) => {
    if (!value) return;

    if (value === 'free') {
      setForm((prev) => ({
        ...prev,
        sourceMode: 'free',
        linkedInterventionIds: [],
        items: prev.items.length > 0 ? prev.items : [{ ...emptyItem }],
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      sourceMode: 'interventions',
      linkedInterventionIds: [],
      items: [{ ...emptyItem }],
    }));
  };

  const handleInterventionsChange = (_, selected) => {
    const ids = selected.map((item) => item.id);
    setForm((prev) => ({ ...prev, linkedInterventionIds: ids }));
    applyInterventionData(selected);

    if (errors.linkedInterventionIds) {
      setErrors((prev) => ({ ...prev, linkedInterventionIds: '' }));
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = {
        ...nextItems[index],
        [field]: value,
      };
      return { ...prev, items: nextItems };
    });

    const errorKey = `item_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: '' }));
    }
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));
  };

  const removeItem = (index) => {
    setForm((prev) => {
      if (prev.items.length <= 1) return prev;
      const nextItems = prev.items.filter((_, idx) => idx !== index);
      return { ...prev, items: nextItems };
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (form.sourceMode === 'interventions' && form.linkedInterventionIds.length === 0) {
      nextErrors.linkedInterventionIds = 'Sélectionnez au moins une intervention';
    }

    if (!toText(form.destinataire)) nextErrors.destinataire = 'Champ requis';
    if (!toText(form.receptionnaireNom)) nextErrors.receptionnaireNom = 'Champ requis';
    if (!toText(form.receptionnairePrenom)) nextErrors.receptionnairePrenom = 'Champ requis';
    if (!toText(form.receptionnaireFonction)) nextErrors.receptionnaireFonction = 'Champ requis';

    if (!Array.isArray(form.items) || form.items.length === 0) {
      nextErrors.items = 'Ajoutez au moins un article';
    } else {
      form.items.forEach((item, idx) => {
        if (!toText(item.designation)) nextErrors[`item_${idx}_designation`] = 'Champ requis';
        if (!Number(item.quantity) || Number(item.quantity) < 1) nextErrors[`item_${idx}_quantity`] = 'Min 1';
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => ({
    maintenanceType: form.maintenanceType,
    observation: toText(form.observation) || undefined,
    destinataire: toText(form.destinataire),
    receptionnaireNom: toText(form.receptionnaireNom),
    receptionnairePrenom: toText(form.receptionnairePrenom),
    receptionnaireFonction: toText(form.receptionnaireFonction),
    items: form.items.map((item) => ({
      designation: toText(item.designation),
      quantity: Number(item.quantity),
      marque: toText(item.marque) || undefined,
      numeroSerie: toText(item.numeroSerie) || undefined,
      numeroInventaire: toText(item.numeroInventaire) || undefined,
    })),
  });

  const handleSubmit = async (e, printAfterCreate = false) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    await onSubmit(buildPayload(), printAfterCreate);
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>Nouvelle Décharge</Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Box component="form" id="decharge-form" onSubmit={(e) => handleSubmit(e, false)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ToggleButtonGroup
                exclusive
                value={form.sourceMode}
                onChange={handleSourceModeChange}
                size="small"
                color="primary"
              >
                <ToggleButton value="free">Décharge libre</ToggleButton>
                <ToggleButton value="interventions">Liée aux interventions</ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {form.sourceMode === 'interventions' && (
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={interventions}
                  value={selectedInterventions}
                  onChange={handleInterventionsChange}
                  disableCloseOnSelect
                  getOptionLabel={(option) => `${option.reference} - ${option.materialName}`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Interventions liées"
                      placeholder="Sélectionnez une ou plusieurs interventions"
                      error={!!errors.linkedInterventionIds}
                      helperText={errors.linkedInterventionIds || 'Les données se remplissent automatiquement après sélection'}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Type" value={form.maintenanceType} onChange={handleChange('maintenanceType')}>
                <MenuItem value="HARD">HARD</MenuItem>
                <MenuItem value="SOFT">SOFT</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Destinataire *"
                value={form.destinataire}
                onChange={handleChange('destinataire')}
                error={!!errors.destinataire}
                helperText={errors.destinataire}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Nom Réceptionnaire *"
                value={form.receptionnaireNom}
                onChange={handleChange('receptionnaireNom')}
                error={!!errors.receptionnaireNom}
                helperText={errors.receptionnaireNom}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Prénom Réceptionnaire *"
                value={form.receptionnairePrenom}
                onChange={handleChange('receptionnairePrenom')}
                error={!!errors.receptionnairePrenom}
                helperText={errors.receptionnairePrenom}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Fonction Réceptionnaire *"
                value={form.receptionnaireFonction}
                onChange={handleChange('receptionnaireFonction')}
                error={!!errors.receptionnaireFonction}
                helperText={errors.receptionnaireFonction}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Observation"
                value={form.observation}
                onChange={handleChange('observation')}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight={700}>Articles de la décharge</Typography>
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addItem}>Ajouter article</Button>
              </Box>
              {errors.items ? (
                <Typography variant="caption" color="error.main">{errors.items}</Typography>
              ) : null}
            </Grid>

            {form.items.map((item, idx) => (
              <Grid item xs={12} key={`item-${idx}`}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 1.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight={600}>Article {idx + 1}</Typography>
                    <IconButton size="small" color="error" onClick={() => removeItem(idx)} disabled={form.items.length === 1}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Désignation *"
                        value={item.designation}
                        onChange={(e) => handleItemChange(idx, 'designation', e.target.value)}
                        error={!!errors[`item_${idx}_designation`]}
                        helperText={errors[`item_${idx}_designation`]}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantité *"
                        inputProps={{ min: 1 }}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        error={!!errors[`item_${idx}_quantity`]}
                        helperText={errors[`item_${idx}_quantity`]}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Marque"
                        value={item.marque}
                        onChange={(e) => handleItemChange(idx, 'marque', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="N Série"
                        value={item.numeroSerie}
                        onChange={(e) => handleItemChange(idx, 'numeroSerie', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="N Inventaire"
                        value={item.numeroInventaire}
                        onChange={(e) => handleItemChange(idx, 'numeroInventaire', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>Annuler</Button>
        <Button variant="outlined" disabled={loading} onClick={(e) => handleSubmit(e, true)}>Créer et imprimer</Button>
        <Button variant="contained" type="submit" form="decharge-form" disabled={loading}>Créer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DechargeForm;
