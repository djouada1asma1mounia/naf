import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField,
  InputAdornment, IconButton, Tooltip, Typography, Skeleton, Dialog,
  DialogTitle, DialogContent, DialogActions, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import RuleIcon from '@mui/icons-material/Rule';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { subsidiariesAPI } from '../../api/subsidiaries';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const REASON_PERMISSIONS = {
  create: ['create-subsidiary', 'create subsidiary', 'create-subsidiaries', 'create subsidiaries'],
  read: ['read-subsidiary', 'read subsidiary', 'read-subsidiaries', 'read subsidiaries'],
  update: ['update-subsidiary', 'update subsidiary', 'update-subsidiaries', 'update subsidiaries'],
  remove: ['delete-subsidiary', 'delete subsidiary', 'delete-subsidiaries', 'delete subsidiaries'],
};

const ReasonForm = ({ open, onClose, onSubmit, editItem }) => {
  const [form, setForm] = useState({ name: '', code: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(editItem ? { name: editItem.name || '', code: editItem.code || '' } : { name: '', code: '' });
    setErrors({});
  }, [editItem, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Champ requis';
    if (!form.code.trim()) nextErrors.code = 'Champ requis';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    await onSubmit({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
    });
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>
          {editItem ? 'Modifier la Raison' : 'Nouvelle Raison'}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box component="form" id="reason-form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Raison *"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={!!errors.name}
            helperText={errors.name}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Code *"
            value={form.code}
            onChange={(e) => {
              setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }));
              if (errors.code) setErrors((prev) => ({ ...prev, code: '' }));
            }}
            error={!!errors.code}
            helperText={errors.code}
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Annuler</Button>
        <Button type="submit" form="reason-form" variant="contained" disabled={loading}>
          {editItem ? 'Modifier' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ReasonsList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermissionAny } = useAuth();

  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, code: '', name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canCreate = hasPermissionAny(REASON_PERMISSIONS.create);
  const canRead = hasPermissionAny(REASON_PERMISSIONS.read);
  const canUpdate = hasPermissionAny(REASON_PERMISSIONS.update);
  const canDelete = hasPermissionAny(REASON_PERMISSIONS.remove);
  const canMutate = canUpdate || canDelete;

  const loadData = useCallback(async () => {
    setLoading(true);
    if (!canRead) {
      setReasons([]);
      setLoading(false);
      enqueueSnackbar('Vous n\'avez pas la permission de lire les raisons.', { variant: 'warning' });
      return;
    }

    try {
      const data = await subsidiariesAPI.getAll();
      setReasons(data || []);
    } catch (error) {
      setReasons([]);
      enqueueSnackbar(error.message || 'Erreur lors du chargement des raisons.', { variant: 'error' });
    }
    setLoading(false);
  }, [canRead, enqueueSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReasons = reasons.filter((item) => {
    if (!search) return true;
    const target = `${item.name || ''} ${item.code || ''}`.toLowerCase();
    return target.includes(search.toLowerCase());
  });

  const displayed = filteredReasons.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSubmit = async (payload) => {
    try {
      if (editItem) {
        if (!canUpdate) {
          throw new Error('Vous n\'avez pas la permission de modifier les raisons.');
        }
        await subsidiariesAPI.update(editItem.code, payload);
        enqueueSnackbar('Raison modifiée avec succès', { variant: 'success' });
      } else {
        if (!canCreate) {
          throw new Error('Vous n\'avez pas la permission de créer des raisons.');
        }
        await subsidiariesAPI.create(payload);
        enqueueSnackbar('Raison créée avec succès', { variant: 'success' });
      }
      setFormOpen(false);
      setEditItem(null);
      loadData();
    } catch (error) {
      enqueueSnackbar(
        error.message || (editItem
          ? 'Erreur lors de la modification de la raison.'
          : 'Erreur lors de la création de la raison.'),
        { variant: 'error' },
      );
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      enqueueSnackbar('Vous n\'avez pas la permission de supprimer des raisons.', { variant: 'warning' });
      return;
    }

    setDeleteLoading(true);
    try {
      await subsidiariesAPI.delete(deleteDialog.code);
      enqueueSnackbar('Raison supprimée avec succès', { variant: 'success' });
      setDeleteDialog({ open: false, code: '', name: '' });
      loadData();
    } catch (error) {
      enqueueSnackbar(error.message || 'Erreur lors de la suppression de la raison.', { variant: 'error' });
    }
    setDeleteLoading(false);
  };

  return (
    <Box>
      <PageHeader
        title="Raisons"
        subtitle={`${reasons.length} raison(s)`}
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Raisons' }]}
        action={
          canCreate ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
              Nouvelle Raison
            </Button>
          ) : null
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            placeholder="Rechercher par raison ou code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>RAISON</TableCell>
                <TableCell>CODE</TableCell>
                {canMutate && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: canMutate ? 3 : 2 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canMutate ? 3 : 2} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1} color="text.secondary">
                      <RuleIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      <Typography variant="body2">Aucune raison trouvée</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayed.map((item) => (
                  <TableRow key={item.code}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{item.name || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.code || '—'}</Typography>
                    </TableCell>
                    {canMutate && (
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          {canUpdate && (
                            <Tooltip title="Modifier">
                              <IconButton size="small" color="primary" onClick={() => { setEditItem(item); setFormOpen(true); }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteDialog({ open: true, code: item.code, name: item.name })}
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
          count={filteredReasons.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, np) => setPage(np)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(+e.target.value);
            setPage(0);
          }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Card>

      <ReasonForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        editItem={editItem}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Supprimer la Raison"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteDialog.name}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteDialog({ open: false, code: '', name: '' })}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default ReasonsList;
