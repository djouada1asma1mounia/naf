import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, Typography, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
  Divider, Skeleton, Avatar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import BadgeIcon from '@mui/icons-material/Badge';
import { rolesAPI } from '../../api/roles';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useSnackbar } from 'notistack';

const RoleForm = ({ open, onClose, onSubmit, editItem }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(editItem ? { name: editItem.name, description: editItem.description || '' } : { name: '', description: '' });
    setErrors({});
  }, [editItem, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Champ requis' }); return; }
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
          {editItem ? 'Modifier le Rôle' : 'Nouveau Rôle'}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box component="form" id="role-form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Nom du rôle *"
            value={form.name}
            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors({}); }}
            error={!!errors.name}
            helperText={errors.name}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Annuler</Button>
        <Button type="submit" form="role-form" variant="contained" disabled={loading}>
          {editItem ? 'Modifier' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RolesList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setRoles(await rolesAPI.getAll());
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur chargement rôles', { variant: 'error' });
    }
    setLoading(false);
  }, [enqueueSnackbar]);

  useEffect(() => { loadData(); }, [loadData]);

  const displayed = roles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleFormSubmit = async (data) => {
    try {
      if (editItem) {
        await rolesAPI.update(editItem.id, data);
        enqueueSnackbar('Rôle modifié', { variant: 'success' });
      } else {
        await rolesAPI.create(data);
        enqueueSnackbar('Rôle créé', { variant: 'success' });
      }
      setFormOpen(false);
      loadData();
    } catch (err) { enqueueSnackbar(err.message || 'Erreur', { variant: 'error' }); }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await rolesAPI.delete(deleteDialog.id);
      enqueueSnackbar('Rôle supprimé', { variant: 'success' });
      setDeleteDialog({ open: false, id: null, name: '' });
      loadData();
    } catch (err) { enqueueSnackbar(err.message || 'Erreur', { variant: 'error' }); }
    setDeleteLoading(false);
  };

  return (
    <Box>
      <PageHeader
        title="Gestion des Rôles"
        subtitle={`${roles.length} rôle(s)`}
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Rôles' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
            Nouveau Rôle
          </Button>
        }
      />

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Créé le</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{[1,2,3,4].map((j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                ))
              ) : displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <BadgeIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                    <Typography variant="body2" color="text.secondary">Aucun rôle</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayed.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.75rem' }}>
                          <BadgeIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{r.description || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{r.createdAt}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Modifier">
                          <IconButton size="small" color="primary" onClick={() => { setEditItem(r); setFormOpen(true); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: r.id, name: r.name })}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {roles.length > rowsPerPage && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div" count={roles.length} rowsPerPage={rowsPerPage} page={page}
            onPageChange={(_, np) => setPage(np)}
            onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
          />
        )}
      </Card>

      <RoleForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} editItem={editItem} />
      <ConfirmDialog
        open={deleteDialog.open}
        title="Supprimer le Rôle"
        message={`Supprimer le rôle "${deleteDialog.name}" ? Cette action est irréversible.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default RolesList;
