import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField,
  InputAdornment, IconButton, Tooltip, MenuItem, Select, FormControl,
  InputLabel, Grid, Typography, Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import BuildIcon from '@mui/icons-material/Build';
import { maintenanceAPI } from '../../api/maintenance';
import { structuresAPI } from '../../api/structures';
import PageHeader from '../../components/common/PageHeader';
import { InterventionStatusChip, PriorityChip } from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MaintenanceForm from './MaintenanceForm';
import { INTERVENTION_STATUSES, INTERVENTION_TYPES } from '../../utils/constants';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const MaintenanceList = () => {
  const { isAdmin, canEdit } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [interventions, setInterventions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, code: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, depts] = await Promise.all([
        maintenanceAPI.getAll(filters),
        structuresAPI.getDepartments(),
      ]);
      setInterventions(data);
      setDepartments(depts);
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
        enqueueSnackbar('Intervention modifiée', { variant: 'success' });
      } else {
        await maintenanceAPI.create(data);
        enqueueSnackbar('Intervention créée', { variant: 'success' });
      }
      setFormOpen(false);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur', { variant: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await maintenanceAPI.delete(deleteDialog.id);
      enqueueSnackbar('Intervention supprimée', { variant: 'success' });
      setDeleteDialog({ open: false, id: null, code: '' });
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur', { variant: 'error' });
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
              Nouvelle Intervention
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select value={filters.status} onChange={handleFilterChange('status')} label="Statut">
                  <MenuItem value="">Tous</MenuItem>
                  {INTERVENTION_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={filters.type} onChange={handleFilterChange('type')} label="Type">
                  <MenuItem value="">Tous</MenuItem>
                  {INTERVENTION_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                <TableCell>Code</TableCell>
                <TableCell>Matériel</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priorité</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Responsable</TableCell>
                <TableCell>Département</TableCell>
                <TableCell>Date Début</TableCell>
                {canEdit() && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1,2,3,4,5,6,7,8].map((j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
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
                    <TableCell><PriorityChip priority={inv.priority} /></TableCell>
                    <TableCell><InterventionStatusChip status={inv.status} /></TableCell>
                    <TableCell><Typography variant="body2">{inv.staff}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{inv.department}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{inv.startDate}</Typography>
                    </TableCell>
                    {canEdit() && (
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="Modifier">
                            <IconButton size="small" color="primary" onClick={() => { setEditItem(inv); setFormOpen(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isAdmin() && (
                            <Tooltip title="Supprimer">
                              <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: inv.id, code: inv.code })}>
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
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        editItem={editItem}
        departments={departments}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Supprimer l'Intervention"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteDialog.code}" ?`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialog({ open: false, id: null, code: '' })}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default MaintenanceList;
