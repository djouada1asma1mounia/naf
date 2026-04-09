import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DechargeForm from './DechargeForm';
import { dechargesAPI } from '../../api/decharges';

const DECHARGE_PERMISSIONS = {
  create: ['create-decharge', 'create decharge'],
  readAll: ['read-decharges', 'read decharges'],
  readOne: ['read-decharge', 'read decharge'],
  deleteOne: ['delete-decharge', 'delete decharge'],
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR');
};

const DechargesList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermissionAny } = useAuth();

  const [decharges, setDecharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', maintenanceType: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, reference: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canCreate = hasPermissionAny(DECHARGE_PERMISSIONS.create);
  const canReadAll = hasPermissionAny(DECHARGE_PERMISSIONS.readAll);
  const canReadOne = hasPermissionAny(DECHARGE_PERMISSIONS.readOne);
  const canDeleteOne = hasPermissionAny(DECHARGE_PERMISSIONS.deleteOne);

  const loadData = useCallback(async () => {
    if (!canReadAll) {
      setLoading(false);
      setDecharges([]);
      enqueueSnackbar('Vous n\'avez pas la permission de lire les décharges.', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const data = await dechargesAPI.getAll(filters);
      setDecharges(data);
    } catch (error) {
      enqueueSnackbar(error.message || 'Erreur lors du chargement des décharges.', { variant: 'error' });
    }
    setLoading(false);
  }, [canReadAll, enqueueSnackbar, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
    setPage(0);
  };

  const handleCreate = async (payload, printAfterCreate = false) => {
    try {
      const created = await dechargesAPI.create(payload);
      enqueueSnackbar('Décharge créée avec succès', { variant: 'success' });

      if (printAfterCreate && created?.id) {
        await dechargesAPI.printPdf(created.id);
      }

      setFormOpen(false);
      loadData();
    } catch (error) {
      enqueueSnackbar(error.message || 'Erreur lors de la création de la décharge.', { variant: 'error' });
    }
  };

  const handlePrint = async (decharge) => {
    try {
      await dechargesAPI.printPdf(decharge.id);
    } catch (error) {
      enqueueSnackbar(error.message || 'Erreur lors de l\'impression.', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!canDeleteOne) {
      enqueueSnackbar('Vous n\'avez pas la permission de supprimer des décharges.', { variant: 'warning' });
      return;
    }

    setDeleteLoading(true);
    try {
      await dechargesAPI.delete(deleteDialog.id);
      enqueueSnackbar('Décharge supprimée avec succès', { variant: 'success' });
      setDeleteDialog({ open: false, id: null, reference: '' });
      loadData();
    } catch (error) {
      enqueueSnackbar(error.message || 'Erreur lors de la suppression de la décharge.', { variant: 'error' });
    }
    setDeleteLoading(false);
  };

  const displayed = decharges.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <PageHeader
        title="Décharges"
        subtitle={`${decharges.length} document(s)`}
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Décharges' }]}
        action={
          canCreate ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
              Nouvelle Décharge
            </Button>
          ) : null
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Recherche"
                placeholder="Référence, destinataire, réceptionnaire..."
                value={filters.search}
                onChange={handleFilterChange('search')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={filters.maintenanceType} onChange={handleFilterChange('maintenanceType')} label="Type">
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="HARD">HARD</MenuItem>
                  <MenuItem value="SOFT">SOFT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Référence</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Destinataire</TableCell>
                <TableCell>Réceptionnaire</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {[1, 2, 3, 4, 5, 6].map((col) => (
                      <TableCell key={`skeleton-col-${col}`}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1} color="text.secondary">
                      <DescriptionIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      <Typography variant="body2">Aucune décharge trouvée</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayed.map((decharge) => {
                  const receptionnaire = `${decharge.receptionnaireNom || ''} ${decharge.receptionnairePrenom || ''}`.trim();
                  return (
                    <TableRow key={decharge.id}>
                      <TableCell>
                        <Typography variant="caption" fontWeight={700} color="primary.main">
                          {decharge.reference}
                        </Typography>
                      </TableCell>
                      <TableCell>{decharge.maintenanceType}</TableCell>
                      <TableCell>{decharge.destinataire || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{receptionnaire || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{decharge.receptionnaireFonction || '—'}</Typography>
                      </TableCell>
                      <TableCell>{formatDate(decharge.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={0.5}>
                          <Tooltip title={canReadOne ? 'Imprimer PDF' : 'Permission insuffisante'}>
                            <span>
                              <IconButton size="small" color="primary" disabled={!canReadOne} onClick={() => handlePrint(decharge)}>
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={canDeleteOne ? 'Supprimer' : 'Permission insuffisante'}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={!canDeleteOne}
                                onClick={() => setDeleteDialog({ open: true, id: decharge.id, reference: decharge.reference })}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={decharges.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Card>

      <DechargeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Supprimer la Décharge"
        message={`Êtes-vous sûr de vouloir supprimer la décharge "${deleteDialog.reference}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteDialog({ open: false, id: null, reference: '' })}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default DechargesList;
