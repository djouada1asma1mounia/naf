import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  useTheme,
  Stack,
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
import DomainIcon from "@mui/icons-material/Domain";
import LayersIcon from "@mui/icons-material/Layers";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BadgeIcon from "@mui/icons-material/Badge";
import PageHeader from "../../components/common/PageHeader";
import { reportsAPI } from "../../api/reports";

const PIE_COLORS = ["#0f766e", "#f59e0b", "#2563eb", "#dc2626", "#7c3aed", "#10b981", "#6b7280"];

const StatTile = ({ title, value, subtitle, icon, tone = "primary" }) => {
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
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

const StripStatTile = ({ title, value, icon, accent }) => (
  <Card
    sx={{
      borderRadius: 3,
      border: `1px solid ${alpha(accent, 0.24)}`,
      borderTop: `4px solid ${accent}`,
      boxShadow: `0 8px 18px ${alpha(accent, 0.12)}`,
      height: "100%",
      minHeight: 108,
    }}
  >
    <CardContent sx={{ py: 1.1, px: 1.75 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.65}>
        <Typography variant="body1" color="text.secondary" fontWeight={700}>
          {title}
        </Typography>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(accent, 0.14),
            color: accent,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography
        variant="h5"
        fontWeight={900}
        lineHeight={1.05}
        sx={{
          color: accent,
          textAlign: "center",
          width: "100%",
          fontSize: { xs: "1.75rem", md: "2rem" },
        }}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const StatCard = ({ title, children, height = 420, titleSx, contentSx }) => (
  <Card
    sx={{
      borderRadius: 4,
      height,
      border: `1px solid ${alpha("#1e293b", 0.08)}`,
      background: `linear-gradient(180deg, ${alpha("#ffffff", 0.95)} 0%, ${alpha("#f8fafc", 0.92)} 100%)`,
      boxShadow: `0 10px 24px ${alpha("#0f172a", 0.06)}`,
    }}
  >
    <CardContent sx={{ height: "100%", ...contentSx }}>
      <Typography variant="h6" fontWeight={800} mb={1.5} sx={titleSx}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const normalizeStatusLabel = (name) => {
  const value = String(name || "").toLowerCase();
  if (value.includes("service")) return "En Service";
  if (value.includes("panne")) return "En Panne";
  if (value.includes("reforme")) return "Réformé";
  return name || "Non renseigné";
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
    const materialsByStatus = Array.isArray(safe.materialsByStatus)
      ? safe.materialsByStatus.map((item) => ({
          ...item,
          name: normalizeStatusLabel(item?.name),
        }))
      : [];
    const interventionStatusCounts = Array.isArray(safe.interventionStatusCounts)
      ? safe.interventionStatusCounts.filter((x) => Number(x?.value) > 0)
      : [];
    const materialsByDept = Array.isArray(safe.materialsByDept)
      ? safe.materialsByDept.slice(0, 7)
      : [];
    const departmentsServiceBreakdown = Array.isArray(safe.departmentsServiceBreakdown)
      ? safe.departmentsServiceBreakdown.slice(0, 8)
      : [];
    const interventionTypes = Array.isArray(safe.interventionsInfo?.byType)
      ? safe.interventionsInfo.byType.filter((x) => Number(x?.value) > 0)
      : [];

    const materialsScope = [
      { name: "GD", value: Number(safe.totalGdMaterials) || 0 },
      { name: "Standard", value: Number(safe.totalClassicMaterials) || 0 },
    ].filter((x) => x.value > 0);

    return {
      materialsByCategory,
      materialsByStatus,
      interventionStatusCounts,
      materialsByDept,
      departmentsServiceBreakdown,
      materialsScope,
      interventionTypes,
    };
  }, [stats]);

  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
  };

  const equalChartAreaHeight = 220;
    const interventionStatusMeta = [
      { key: "A faire", color: theme.palette.info.main },
      { key: "En cours", color: theme.palette.warning.main },
      { key: "Terminée", color: theme.palette.success.main },
    ];

    const interventionStatusSummary = interventionStatusMeta.map((meta) => {
      const match = chartData.interventionStatusCounts.find(
        (item) => String(item?.name || "") === meta.key || (meta.key === "Terminée" && String(item?.name || "") === "Terminee"),
      );
      return {
        name: meta.key,
        value: Number(match?.value || 0),
        color: meta.color,
      };
    });

    const interventionStatusDonutData = interventionStatusSummary.filter((item) => item.value > 0);

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
        subtitle="Vue analytique complète des données réelles"
      />

      <Box
        sx={{
          mb: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          width: "100%",
        }}
      >
        <Box>
          <StripStatTile
            title="Total Matériels"
            value={stats.totalMaterials || 0}
            icon={<ComputerIcon fontSize="small" />}
            accent="#1664c0"
          />
        </Box>
        <Box>
          <StripStatTile
            title="En Service"
            value={stats.activeMaterials || 0}
            icon={<CheckCircleOutlineIcon fontSize="small" />}
            accent="#1f9d55"
          />
        </Box>
        <Box>
          <StripStatTile
            title="En Panne"
            value={stats.panneMaterials || 0}
            icon={<CancelOutlinedIcon fontSize="small" />}
            accent="#dd6b20"
          />
        </Box>
        <Box>
          <StripStatTile
            title="Réformé"
            value={stats.maintenanceMaterials || 0}
            icon={<BuildCircleIcon fontSize="small" />}
            accent="#c2410c"
          />
        </Box>
      </Box>

      <Box
        sx={{
          mb: 2,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          width: "100%",
        }}
      >
        <Box>
          <StatCard
            title="Répartition GD vs Standard"
            height={350}
            titleSx={{ textAlign: "center", mb: 0.5 }}
            contentSx={{ display: "flex", flexDirection: "column", justifyContent: "space-around" }}
          >
            <Box sx={{ position: "relative", height: "64%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.materialsScope}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={100}
                    paddingAngle={4}
                    cornerRadius={6}
                    label={false}
                  >
                    {chartData.materialsScope.map((_, i) => (
                      <Cell key={`scope-cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  pointerEvents: "none",
                }}
              >
                <Box textAlign="center" sx={{ mt: -1 }}>
                  <Typography variant="body2" color="text.secondary">Total</Typography>
                  <Typography variant="h5" fontWeight={900}>{stats.totalMaterials || 0}</Typography>
                </Box>
              </Box>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
              <Chip size="small" label={`GD: ${stats.totalGdMaterials || 0}`} color="secondary" variant="outlined" />
              <Chip size="small" label={`Standard: ${stats.totalClassicMaterials || 0}`} color="info" variant="outlined" />
            </Stack>
          </StatCard>
        </Box>

        <Box>
          <StatCard
            title="Matériels par état"
            height={350}
            titleSx={{ textAlign: "center", mb: 0.5 }}
            contentSx={{ display: "flex", flexDirection: "column", justifyContent: "space-around" }}
          >
            <ResponsiveContainer width="100%" height="64%">
              <BarChart data={chartData.materialsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Matériels" fill={theme.palette.primary.main} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
              <Chip icon={<CheckCircleOutlineIcon />} size="small" label={`En Service: ${stats.activeMaterials || 0}`} color="success" variant="outlined" />
              <Chip icon={<CancelOutlinedIcon />} size="small" label={`En Panne: ${stats.panneMaterials || 0}`} color="error" variant="outlined" />
              <Chip icon={<BuildCircleIcon />} size="small" label={`Réformé: ${stats.maintenanceMaterials || 0}`} color="warning" variant="outlined" />
            </Stack>
          </StatCard>
        </Box>
      </Box>

      <Grid container spacing={2} mb={2} mt={0.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Matériels GD" value={stats.totalGdMaterials || 0} subtitle="Avec filiale" icon={<DomainIcon fontSize="small" />} tone="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Matériels Standard" value={stats.totalClassicMaterials || 0} subtitle="Sans filiale" icon={<LayersIcon fontSize="small" />} tone="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Total interventions" value={stats.totalInterventions || 0} subtitle={`En cours: ${stats.ongoingInterventions || 0}`} icon={<BuildIcon fontSize="small" />} tone="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Départements" value={stats.totalDepartments || 0} subtitle="Structures actives" icon={<BusinessIcon fontSize="small" />} tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Services" value={stats.totalServices || 0} subtitle="Tous départements" icon={<SettingsSuggestIcon fontSize="small" />} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Catégories" value={stats.totalCategories || 0} subtitle="Classification matériel" icon={<CategoryIcon fontSize="small" />} tone="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Raisons" value={stats.totalReasons || 0} subtitle="Référentiel des motifs" icon={<AssignmentTurnedInIcon fontSize="small" />} tone="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Rôles" value={stats.totalRoles || 0} subtitle="Rôles utilisateurs" icon={<BadgeIcon fontSize="small" />} tone="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile title="Décharges" value={stats.totalDecharges || 0} subtitle="Sorties maintenance" icon={<AssignmentTurnedInIcon fontSize="small" />} tone="info" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <StatCard
            title="Matériels par catégorie"
            height={360}
            contentSx={{ display: "flex", flexDirection: "column", justifyContent: "space-around" }}
          >
              <Box sx={{ height: `${equalChartAreaHeight}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.materialsByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={78}
                      paddingAngle={2}
                      cornerRadius={4}
                      label={false}
                    >
                      {chartData.materialsByCategory.map((_, i) => (
                        <Cell key={`cat-cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
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
          </StatCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <StatCard
            title="Interventions par statut"
            height={360}
            contentSx={{ display: "flex", flexDirection: "column", justifyContent: "space-around" }}
          >
              <Box sx={{ height: `${equalChartAreaHeight}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.interventionStatusCounts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={78}
                      paddingAngle={2}
                      cornerRadius={4}
                      label={false}
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
              </Box>
              <Box display="flex" flexDirection="column" gap={0.5}>
                {chartData.interventionStatusCounts.map((item) => (
                  <Box key={`inv-row-${item.name}`} display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{item.name}</Typography>
                    <Chip size="small" label={item.value} />
                  </Box>
                ))}
              </Box>
          </StatCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <StatCard
            title="Services par département"
            height={360}
            contentSx={{ display: "flex", flexDirection: "column", justifyContent: "space-around" }}
          >
              <Box sx={{ height: `${equalChartAreaHeight}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.departmentsServiceBreakdown} margin={{ top: 4, right: 10, left: 2, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                    <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="servicesCount" name="Services" fill={theme.palette.success.main} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            <Typography variant="caption" color="text.secondary">
              Nombre de services enregistrés dans chaque département.
            </Typography>
          </StatCard>
        </Grid>

        <Grid item xs={12}>
          <StatCard title="Synthèse des interventions" height={430}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
              <Chip label={`Total interventions: ${stats.totalInterventions || 0}`} color="primary" variant="outlined" />
              <Chip label={`A faire: ${Number((chartData.interventionStatusCounts.find((i) => i.name === "A faire") || {}).value || 0)}`} variant="outlined" />
              <Chip label={`En cours: ${Number((chartData.interventionStatusCounts.find((i) => i.name === "En cours") || {}).value || 0)}`} color="warning" variant="outlined" />
              <Chip label={`Terminée: ${Number((chartData.interventionStatusCounts.find((i) => i.name === "Terminee" || i.name === "Terminée") || {}).value || 0)}`} color="success" variant="outlined" />
              <Chip label={`HARD: ${Number((chartData.interventionTypes.find((i) => i.name === "HARD") || {}).value || 0)}`} color="error" variant="outlined" />
              <Chip label={`SOFT: ${Number((chartData.interventionTypes.find((i) => i.name === "SOFT") || {}).value || 0)}`} color="info" variant="outlined" />
            </Stack>

            <Box
              sx={{
                height: 250,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 300px) 1fr" },
                gap: 2,
                alignItems: "center",
              }}
            >
              <Box sx={{ position: "relative", height: 210, width: "100%", display: "grid", placeItems: "center" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={interventionStatusDonutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={78}
                      paddingAngle={3}
                      cornerRadius={6}
                      label={false}
                    >
                      {interventionStatusDonutData.map((entry) => (
                        <Cell key={`istatus-donut-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>
                  <Typography variant="body2" color="text.secondary">Interventions</Typography>
                  <Typography variant="h5" fontWeight={900}>{stats.totalInterventions || 0}</Typography>
                </Box>
              </Box>

              <Stack spacing={1}>
                {interventionStatusSummary.map((item) => (
                  <Box
                    key={`intervention-status-row-${item.name}`}
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: item.color,
                        }}
                      />
                      <Typography variant="body1">{item.name}</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={800}>{item.value}</Typography>
                  </Box>
                ))}

                <Box sx={{ pt: 1 }}>
                  <Typography variant="body2" color="text.secondary" mb={0.75}>Types d'intervention</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {chartData.interventionTypes.map((item) => (
                      <Chip key={`itype-chip-${item.name}`} size="small" label={`${item.name}: ${item.value}`} variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </StatCard>
        </Grid>
      </Grid>

    </Box>
  );
};

export default Dashboard;
