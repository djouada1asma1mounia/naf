import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField,
  MenuItem, Select, FormControl, InputLabel, Grid, Typography, Skeleton, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { maintenanceAPI } from '../../api/maintenance';
import PageHeader from '../../components/common/PageHeader';
import MaintenanceForm from './MaintenanceForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { InterventionStatusChip } from '../../components/common/StatusChip';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const MaintenanceList = () => {
  const { canEdit } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({ search: '', type: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await maintenanceAPI.getAll(filters);
      setInterventions(data);
    } catch {
      enqueueSnackbar('Erreur lors du chargement', { variant: 'error' });
    }
    setLoading(false);
  }, [filters, enqueueSnackbar]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFilterChange = (field) => (e) => {
    setFilters((f) => ({ ...f, [field]: e.target.value }));
    setPage(0);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editItem) {
        await maintenanceAPI.update(editItem.id, data);
        enqueueSnackbar('Intervention modifiee', { variant: 'success' });
      } else {
        await maintenanceAPI.create(data);
        enqueueSnackbar('Intervention creee', { variant: 'success' });
      }
      setFormOpen(false);
      setEditItem(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur', { variant: 'error' });
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await maintenanceAPI.delete(deleteDialog.id);
      enqueueSnackbar('Intervention supprimee', { variant: 'success' });
      setDeleteDialog({ open: false, id: null, label: '' });
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur lors de la suppression', { variant: 'error' });
    }
    setDeleteLoading(false);
  };

  const displayed = interventions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <PageHeader
        title="Interventions & Maintenance"
        subtitle={`${interventions.length} intervention(s)`}
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Interventions' }]}
        action={
          canEdit() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditItem(null);
                setFormOpen(true);
              }}
            >
              Nouvelle Intervention
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Recherche"
                value={filters.search}
                onChange={handleFilterChange('search')}
                placeholder="Référence, matériel, intervenant..."
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={filters.type} onChange={handleFilterChange('type')} label="Type">
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="HARD">HARD</MenuItem>
                  <MenuItem value="SOFT">SOFT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Référence</TableCell>
                <TableCell>Matériel</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Interventionnaire</TableCell>
                <TableCell>Destinataire</TableCell>
                <TableCell>Date création</TableCell>
                {canEdit() && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit() ? 8 : 7} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1} color="text.secondary">
                      <BuildIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      <Typography variant="body2">Aucune intervention trouvée</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayed.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Typography variant="caption" fontWeight={700} color="primary.main">
                        {inv.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{inv.materialName}</Typography>
                        <Typography variant="caption" color="text.secondary">{inv.materialCode}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{inv.type}</Typography></TableCell>
                    <TableCell><InterventionStatusChip status={inv.status} /></TableCell>
                    <TableCell><Typography variant="body2">{inv.staff}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{inv.department}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{inv.startDate}</Typography>
                    </TableCell>
                    {canEdit() && (
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={0.5}>
                          <Tooltip title="Modifier">
                            <IconButton size="small" color="primary" onClick={() => handleEdit(inv)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, id: inv.id, label: inv.reference || inv.code })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={interventions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, np) => setPage(np)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Card>

      <MaintenanceForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditItem(null);
        }}
        onSubmit={handleFormSubmit}
        mode={editItem ? 'edit' : 'create'}
        initialData={editItem}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Supprimer l intervention"
        message={`Etes-vous sur de vouloir supprimer l intervention "${deleteDialog.label}" ? Cette action est irreversible.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteDialog({ open: false, id: null, label: '' })}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default MaintenanceList;
