import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  TextField, Button, MenuItem, Box, Typography, Divider,
} from '@mui/material';
import { materialsAPI } from '../../api/materials';
import { structuresAPI } from '../../api/structures';
import {
  INTERVENTION_TYPES, INTERVENTION_STATUSES, INTERVENTION_PRIORITIES,
} from '../../utils/constants';

const initialForm = {
  materialId: '', materialCode: '', materialName: '',
  type: 'Corrective', status: 'Planifiée', priority: 'Normale',
  description: '', staffId: '', staff: '', departmentId: '', department: '',
  startDate: '', endDate: '', notes: '',
};

const MaintenanceForm = ({ open, onClose, onSubmit, editItem, departments = [] }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    if (open) {
      materialsAPI.getAll().then(setMaterials).catch(() => {});
      structuresAPI.getStaff().then(setStaff).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (editItem) {
      setForm({ ...initialForm, ...editItem });
    } else {
      setForm({ ...initialForm, startDate: new Date().toISOString().split('T')[0] });
    }
    setErrors({});
  }, [editItem, open]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: '' }));
  };

  const handleMaterialChange = (e) => {
    const mat = materials.find((m) => m.id === e.target.value);
    if (mat) {
      setForm((f) => ({
        ...f,
        materialId: mat.id,
        materialCode: mat.code,
        materialName: mat.name,
        departmentId: mat.departmentId,
        department: mat.department,
      }));
    }
  };

  const handleStaffChange = (e) => {
    const person = staff.find((s) => s.id === e.target.value);
    if (person) {
      setForm((f) => ({
        ...f,
        staffId: person.id,
        staff: `${person.firstName} ${person.lastName}`,
      }));
    }
  };

  const handleDeptChange = (e) => {
    const dept = departments.find((d) => d.id === e.target.value);
    setForm((f) => ({ ...f, departmentId: e.target.value, department: dept?.name || '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.materialId) newErrors.materialId = 'Champ requis';
    if (!form.description.trim()) newErrors.description = 'Champ requis';
    if (!form.startDate) newErrors.startDate = 'Champ requis';
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
        <Typography variant="h6" fontWeight={700}>
          {editItem ? 'Modifier l\'Intervention' : 'Nouvelle Intervention'}
        </Typography>
        {editItem && (
          <Typography variant="caption" color="text.secondary">Code: {editItem.code}</Typography>
        )}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Box component="form" id="maintenance-form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Matériel *"
                value={form.materialId || ''}
                onChange={handleMaterialChange}
                error={!!errors.materialId}
                helperText={errors.materialId}
              >
                {materials.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    [{m.code}] {m.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Responsable"
                value={form.staffId || ''}
                onChange={handleStaffChange}
              >
                {staff.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Type" value={form.type} onChange={handleChange('type')}>
                {INTERVENTION_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Statut" value={form.status} onChange={handleChange('status')}>
                {INTERVENTION_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Priorité" value={form.priority} onChange={handleChange('priority')}>
                {INTERVENTION_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Département"
                value={form.departmentId || ''}
                onChange={handleDeptChange}
              >
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Date Début *"
                type="date"
                value={form.startDate}
                onChange={handleChange('startDate')}
                InputLabelProps={{ shrink: true }}
                error={!!errors.startDate}
                helperText={errors.startDate}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Date Fin"
                type="date"
                value={form.endDate || ''}
                onChange={handleChange('endDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description *"
                value={form.description}
                onChange={handleChange('description')}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                value={form.notes}
                onChange={handleChange('notes')}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Annuler</Button>
        <Button type="submit" form="maintenance-form" variant="contained" disabled={loading}>
          {editItem ? 'Modifier' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaintenanceForm;
