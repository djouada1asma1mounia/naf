import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton, LinearProgress,
  ToggleButtonGroup, ToggleButton, useTheme,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area, Cell,
} from 'recharts';
import { reportsAPI } from '../../api/reports';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { CHART_COLORS } from '../../utils/constants';
import ComputerIcon from '@mui/icons-material/Computer';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';

const Reports = () => {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    reportsAPI.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
  };

  const axisStyle = { fontSize: 11, fill: theme.palette.text.secondary };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={2.5}>
          {[1,2,3,4].map((i) => <Grid item xs={12} sm={6} lg={3} key={i}><Skeleton variant="rounded" height={120} /></Grid>)}
          {[1,2].map((i) => <Grid item xs={12} md={6} key={i}><Skeleton variant="rounded" height={300} /></Grid>)}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Rapports & Statistiques"
        subtitle="Vue d'ensemble du système de gestion des actifs"
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Rapports' }]}
      />

      {/* KPI Cards */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Matériels" value={stats.totalMaterials} subtitle={`${stats.activeMaterials} actifs`} icon={<ComputerIcon />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Interventions" value={stats.totalInterventions} subtitle={`${stats.ongoingInterventions} en cours`} icon={<BuildIcon />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Utilisateurs" value={stats.totalUsers} subtitle="Comptes actifs" icon={<PeopleIcon />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Départements" value={stats.totalDepartments} icon={<BusinessIcon />} color="info" />
        </Grid>
      </Grid>

      {/* Interventions Chart */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Interventions par Mois (6 mois)
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  value={chartType}
                  exclusive
                  onChange={(_, v) => v && setChartType(v)}
                >
                  <ToggleButton value="bar">Barres</ToggleButton>
                  <ToggleButton value="area">Zone</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <ResponsiveContainer width="100%" height={260}>
                {chartType === 'bar' ? (
                  <BarChart data={stats.interventionsByMonth} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="month" tick={axisStyle} />
                    <YAxis tick={axisStyle} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="corrective" name="Corrective" fill={theme.palette.error.main} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="preventive" name="Préventive" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={stats.interventionsByMonth} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCorrectif" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPreventif" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="month" tick={axisStyle} />
                    <YAxis tick={axisStyle} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Area type="monotone" dataKey="corrective" name="Corrective" stroke={theme.palette.error.main} fill="url(#colorCorrectif)" />
                    <Area type="monotone" dataKey="preventive" name="Préventive" stroke={theme.palette.success.main} fill="url(#colorPreventif)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Status – text-based */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2.5}>
                Matériels par Statut
              </Typography>
              {(() => {
                const total = stats.materialsByStatus.reduce((s, e) => s + e.value, 0);
                const statusColors = { Actif: 'success', 'En Panne': 'error', 'En Maintenance': 'warning' };
                return (
                  <Box display="flex" flexDirection="column" gap={3}>
                    {stats.materialsByStatus.map((entry) => {
                      const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                      const color = statusColors[entry.name] || 'primary';
                      return (
                        <Box key={entry.name}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: `${color}.main` }} />
                              <Typography variant="body2" fontWeight={600}>{entry.name}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.75}>
                              <Typography variant="h6" fontWeight={800} color={`${color}.main`}>{entry.value}</Typography>
                              <Typography variant="caption" color="text.secondary">({pct}%)</Typography>
                            </Box>
                          </Box>
                          <LinearProgress variant="determinate" value={pct} color={color} sx={{ borderRadius: 4, height: 8 }} />
                        </Box>
                      );
                    })}
                    <Box pt={1.5} sx={{ borderTop: 1, borderColor: 'divider' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Total matériels</Typography>
                        <Typography variant="h6" fontWeight={800}>{total}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Materials by Category */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Matériels par Catégorie
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  layout="vertical"
                  data={stats.materialsByCategory}
                  margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />
                  <XAxis type="number" tick={axisStyle} />
                  <YAxis dataKey="name" type="category" tick={axisStyle} width={90} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Matériels" radius={[0, 6, 6, 0]}>
                    {stats.materialsByCategory.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Materials by Department */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Matériels par Département
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.materialsByDept} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" tick={axisStyle} />
                  <YAxis tick={axisStyle} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name, props) => [value, props.payload.fullName]}
                  />
                  <Bar dataKey="count" name="Matériels" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]}>
                    {stats.materialsByDept.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
