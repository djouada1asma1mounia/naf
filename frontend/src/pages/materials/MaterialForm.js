import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { MATERIAL_STATUSES } from "../../utils/constants";

const initialForm = {
  name: "",
  brand: "",
  model: "",
  serialNumber: "",
  inventoryNumber: "",
  category: "",
  categoryId: "",
  status: "En Service",
  owner: "",
  ownerId: "",
  utilisateur: "",
  serviceName: "",
  serviceId: "",
  department: "",
  departmentId: "",
  purchaseDate: "",
  warrantyExpiry: "",
  description: "",
};

const MaterialForm = ({
  open,
  onClose,
  onSubmit,
  editItem,
  categories = [],
  services = [],
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
    if (errors[field]) setErrors((err) => ({ ...err, [field]: "" }));
  };

  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    const cat = categories.find((c) => String(c.id) === String(selectedId));
    setForm((f) => ({
      ...f,
      categoryId: selectedId,
      category: cat?.name || "",
    }));
  };

  const handleServiceChange = (e) => {
    const selectedId = e.target.value;
    const service = services.find((s) => String(s.id) === String(selectedId));
    setForm((f) => ({
      ...f,
      serviceId: selectedId,
      serviceName: service?.name || "",
      departmentId: service?.departmentId || "",
      department: service?.departmentName || "",
    }));
    if (errors.serviceId) setErrors((err) => ({ ...err, serviceId: "" }));
  };

  const handleOwnerChange = (e) => {
    const selectedId = e.target.value;
    const owner = owners.find((o) => String(o.id) === String(selectedId));
    setForm((f) => ({
      ...f,
      ownerId: selectedId,
      owner: selectedId ? owner?.label || "" : f.owner,
      utilisateur: selectedId ? "" : f.utilisateur,
    }));
    if (errors.ownerId) setErrors((err) => ({ ...err, ownerId: "" }));
    if (errors.utilisateur) setErrors((err) => ({ ...err, utilisateur: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.brand || !form.brand.trim()) newErrors.brand = "Champ requis";
    if (!form.model || !form.model.trim()) newErrors.model = "Champ requis";
    if (!form.serialNumber || !form.serialNumber.trim())
      newErrors.serialNumber = "Champ requis";
    if (!form.categoryId) newErrors.categoryId = "Champ requis";
    if (!form.serviceId) newErrors.serviceId = "Champ requis";
    if (!form.status) newErrors.status = "Champ requis";
    if (!form.ownerId && !String(form.utilisateur || "").trim()) {
      newErrors.utilisateur = "Saisissez un nom si aucun compte n'est sélectionné";
    }
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
            {editItem ? "Modifier le Matériel" : "Nouveau Matériel"}
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
        <Box component="form" id="material-form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marque *"
                value={form.brand}
                onChange={handleChange("brand")}
                error={!!errors.brand}
                helperText={errors.brand}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Modèle *"
                value={form.model}
                onChange={handleChange("model")}
                error={!!errors.model}
                helperText={errors.model}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro d'Inventaire"
                value={form.inventoryNumber}
                onChange={handleChange("inventoryNumber")}
                error={!!errors.inventoryNumber}
                helperText={errors.inventoryNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro de Série *"
                value={form.serialNumber}
                onChange={handleChange("serialNumber")}
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
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Statut *"
                value={form.status}
                onChange={handleChange("status")}
                error={!!errors.status}
                helperText={errors.status}
              >
                {MATERIAL_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Service *"
                value={form.serviceId || ""}
                onChange={handleServiceChange}
                error={!!errors.serviceId}
                helperText={errors.serviceId}
              >
                {services.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              {canSelectOwner ? (
                <>
                  <TextField
                    fullWidth
                    select
                    label="Utilisateur"
                    value={form.ownerId || ""}
                    onChange={handleOwnerChange}
                    error={!!errors.ownerId}
                    helperText={
                      errors.ownerId ||
                      "Sélectionnez un compte ou choisissez Aucun pour saisir un nom libre"
                    }
                  >
                    <MenuItem value="">Aucun</MenuItem>
                    {form.ownerId &&
                      !owners.some(
                        (o) => String(o.id) === String(form.ownerId),
                      ) && (
                        <MenuItem value={form.ownerId}>
                          {form.owner || form.ownerId}
                        </MenuItem>
                      )}
                    {owners.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  {form.ownerId === "" && (
                    <TextField
                      fullWidth
                      label="Nom de l'utilisateur *"
                      value={form.utilisateur}
                      onChange={handleChange("utilisateur")}
                      error={!!errors.utilisateur}
                      helperText={errors.utilisateur || "À renseigner uniquement si Aucun est sélectionné"}
                      sx={{ mt: 2 }}
                    />
                  )}
                </>
              ) : (
                <TextField
                  fullWidth
                  label="Utilisateur"
                  value={form.owner}
                  disabled
                  error={!!errors.ownerId}
                  helperText={
                    errors.ownerId || "Attribué via l’utilisateur connecté"
                  }
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={form.purchaseDate}
                onChange={handleChange("purchaseDate")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fin de Garantie"
                type="date"
                value={form.warrantyExpiry}
                onChange={handleChange("warrantyExpiry")}
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
                onChange={handleChange("description")}
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
        <Button
          type="submit"
          form="material-form"
          variant="contained"
          disabled={loading}
        >
          {editItem ? "Modifier" : "Créer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialForm;
