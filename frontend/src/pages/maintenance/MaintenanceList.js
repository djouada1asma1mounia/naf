import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField,
  MenuItem, Select, FormControl, InputLabel, Grid, Typography, Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';
import { maintenanceAPI } from '../../api/maintenance';
import PageHeader from '../../components/common/PageHeader';
import MaintenanceForm from './MaintenanceForm';
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
      await maintenanceAPI.create(data);
      enqueueSnackbar('Intervention créée', { variant: 'success' });
      setFormOpen(false);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur', { variant: 'error' });
    }
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
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
                <TableCell>Interventionnaire</TableCell>
                <TableCell>Destinataire</TableCell>
                <TableCell>Date création</TableCell>
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
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                    <TableCell><Typography variant="body2">{inv.staff}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{inv.department}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{inv.startDate}</Typography>
                    </TableCell>
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
      />
    </Box>
  );
};

export default MaintenanceList;
