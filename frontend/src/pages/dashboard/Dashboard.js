import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Button,
  Chip,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import ComputerIcon from "@mui/icons-material/Computer";
import BuildIcon from "@mui/icons-material/Build";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PageHeader from "../../components/common/PageHeader";
import { reportsAPI } from "../../api/reports";

const PIE_COLORS = [
  "#1e40af",
  "#2ea44f",
  "#eab308",
  "#7c3aed",
  "#0ea5e9",
  "#ef4444",
  "#6b7280",
];

const StatTile = ({ title, value, icon, tone = "primary" }) => {
  const theme = useTheme();
  const color = theme.palette[tone]?.main || theme.palette.primary.main;

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(color, 0.25)}`,
        boxShadow: "none",
        height: "100%",
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(color, 0.14),
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight={800} lineHeight={1.05}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await reportsAPI.getStats();
        if (mounted) setStats(data);
      } catch {
        if (mounted) setStats(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => {
    const safe = stats || {};
    const materialsByCategory = Array.isArray(safe.materialsByCategory)
      ? safe.materialsByCategory.filter((x) => Number(x?.value) > 0)
      : [];
    const interventionStatusCounts = Array.isArray(safe.interventionStatusCounts)
      ? safe.interventionStatusCounts.filter((x) => Number(x?.value) > 0)
      : [];
    const materialsByDept = Array.isArray(safe.materialsByDept)
      ? safe.materialsByDept.slice(0, 7)
      : [];

    return {
      materialsByCategory,
      interventionStatusCounts,
      materialsByDept,
    };
  }, [stats]);

  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={280} height={42} sx={{ mb: 1 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={210} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box>
        <PageHeader
          title="Dashboard & Statistiques"
          subtitle="Impossible de charger les données statistiques"
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Dashboard & Statistiques"
        subtitle="Vue synthétique du parc informatique"
      />

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Total matériels" value={stats.totalMaterials || 0} icon={<ComputerIcon fontSize="small" />} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Total interventions" value={stats.totalInterventions || 0} icon={<BuildIcon fontSize="small" />} tone="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Total structures" value={stats.totalDepartments || 0} icon={<BusinessIcon fontSize="small" />} tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Total catégories" value={stats.totalCategories || 0} icon={<CategoryIcon fontSize="small" />} tone="secondary" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, height: 430 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography variant="h6" fontWeight={800} mb={1.5}>
                Matériels par catégorie
              </Typography>
              <ResponsiveContainer width="100%" height="74%">
                <PieChart>
                  <Pie
                    data={chartData.materialsByCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={108}
                    paddingAngle={2}
                    label={(entry) => entry.value}
                  >
                    {chartData.materialsByCategory.map((_, i) => (
                      <Cell key={`cat-cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" flexWrap="wrap" gap={0.75}>
                {chartData.materialsByCategory.map((item, i) => (
                  <Chip
                    key={`cat-chip-${item.name}`}
                    size="small"
                    label={`${item.name}: ${item.value}`}
                    sx={{
                      borderColor: PIE_COLORS[i % PIE_COLORS.length],
                      color: "text.primary",
                    }}
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box textAlign="right" mt={1.25}>
                <Button size="small" variant="contained" color="warning" sx={{ borderRadius: 2, textTransform: "none", px: 2.5 }}>
                  Plus
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, height: 430 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography variant="h6" fontWeight={800} mb={1.5}>
                Interventions par statut
              </Typography>
              <ResponsiveContainer width="100%" height="74%">
                <PieChart>
                  <Pie
                    data={chartData.interventionStatusCounts}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={112}
                    label={(entry) => entry.value}
                  >
                    {chartData.interventionStatusCounts.map((entry) => {
                      const color =
                        entry.name === "En cours"
                          ? theme.palette.warning.main
                          : entry.name === "Terminee" || entry.name === "Terminée"
                            ? theme.palette.success.main
                            : theme.palette.primary.main;
                      return <Cell key={`inv-cell-${entry.name}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" flexDirection="column" gap={0.75}>
                {chartData.interventionStatusCounts.map((item) => (
                  <Box key={`inv-row-${item.name}`} display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{item.name}</Typography>
                    <Chip size="small" label={item.value} />
                  </Box>
                ))}
              </Box>
              <Box textAlign="right" mt={1.25}>
                <Button size="small" variant="contained" color="warning" sx={{ borderRadius: 2, textTransform: "none", px: 2.5 }}>
                  Plus
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, height: 430 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography variant="h6" fontWeight={800} mb={1.5}>
                Stats croisées (par structure)
              </Typography>
              <ResponsiveContainer width="100%" height="74%">
                <BarChart data={chartData.materialsByDept} margin={{ top: 0, right: 6, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                  <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="count" name="Matériels" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <Box display="flex" gap={0.75} flexWrap="wrap">
                <Chip icon={<CheckCircleOutlineIcon />} size="small" label={`Actifs: ${stats.activeMaterials || 0}`} color="success" variant="outlined" />
                <Chip icon={<BuildCircleIcon />} size="small" label={`Réparation: ${stats.maintenanceMaterials || 0}`} color="warning" variant="outlined" />
                <Chip icon={<CancelOutlinedIcon />} size="small" label={`Hors service: ${stats.panneMaterials || 0}`} color="error" variant="outlined" />
              </Box>
              <Box textAlign="right" mt={1.25}>
                <Button size="small" variant="contained" color="warning" sx={{ borderRadius: 2, textTransform: "none", px: 2.5 }}>
                  Plus
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
