import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  LinearProgress,
  useTheme,
} from "@mui/material";
import {
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
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import { useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "../../context/AuthContext";
import { reportsAPI } from "../../api/reports";
import { maintenanceAPI } from "../../api/maintenance";
import { materialsAPI } from "../../api/materials";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import {
  InterventionStatusChip,
  PriorityChip,
} from "../../components/common/StatusChip";

const Dashboard = () => {
  const theme = useTheme();
  const { user, isAdmin, canEdit } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentInterventions, setRecentInterventions] = useState([]);
  const [myMaterials, setMyMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, interventions] = await Promise.all([
          reportsAPI.getStats(),
          maintenanceAPI.getAll(),
        ]);
        setStats(statsData);
        setRecentInterventions(interventions.slice(0, 5));

        if (!isAdmin()) {
          const materials = await materialsAPI.getAll({ ownerId: user.id });
          setMyMaterials(materials);
        }
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [user, isAdmin]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`${getGreeting()}, ${user?.firstName} !`}
        subtitle={`Tableau de bord — ${new Date().toLocaleDateString("fr-DZ", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`}
      />

      {/* ADMIN / USER+ Stats */}
      {(isAdmin() || canEdit()) && stats && (
        <>
          <Grid container spacing={2.5} mb={3}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Matériels"
                value={stats.totalMaterials}
                subtitle={`${stats.activeMaterials} en service`}
                icon={<ComputerIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Reforme"
                value={stats.maintenanceMaterials}
                subtitle={`${stats.ongoingInterventions} interventions`}
                icon={<BuildIcon />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Utilisateurs"
                value={stats.totalUsers}
                subtitle="Comptes actifs"
                icon={<PeopleIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Départements"
                value={stats.totalDepartments}
                subtitle="Structures"
                icon={<BusinessIcon />}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={2.5} mb={3}>
            {/* Interventions by Month */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: 320 }}>
                <CardContent sx={{ height: "100%", pb: "16px !important" }}>
                  <Typography variant="h6" fontWeight={700} mb={1.5}>
                    Interventions par Mois
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart
                      data={stats.interventionsByMonth}
                      margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.divider}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{
                          fontSize: 12,
                          fill: theme.palette.text.secondary,
                        }}
                      />
                      <YAxis
                        tick={{
                          fontSize: 12,
                          fill: theme.palette.text.secondary,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="hard"
                        name="HARD"
                        fill={theme.palette.error.main}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="soft"
                        name="SOFT"
                        fill={theme.palette.success.main}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Materials by Status – text-based */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: 320 }}>
                <CardContent sx={{ height: "100%", pb: "16px !important" }}>
                  <Typography variant="h6" fontWeight={700} mb={2.5}>
                    Matériels par Statut
                  </Typography>
                  {(() => {
                    const total = stats.materialsByStatus.reduce(
                      (s, e) => s + e.value,
                      0,
                    );
                    const statusColors = {
                      "En Service": "success",
                      "En Panne": "error",
                      Reforme: "warning",
                    };
                    return (
                      <Box display="flex" flexDirection="column" gap={2.5}>
                        {stats.materialsByStatus.map((entry) => {
                          const pct =
                            total > 0
                              ? Math.round((entry.value / total) * 100)
                              : 0;
                          const color = statusColors[entry.name] || "primary";
                          return (
                            <Box key={entry.name}>
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={0.75}
                              >
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Box
                                    sx={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: "50%",
                                      bgcolor: `${color}.main`,
                                    }}
                                  />
                                  <Typography variant="body2" fontWeight={600}>
                                    {entry.name}
                                  </Typography>
                                </Box>
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  gap={0.75}
                                >
                                  <Typography
                                    variant="h6"
                                    fontWeight={800}
                                    color={`${color}.main`}
                                  >
                                    {entry.value}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    ({pct}%)
                                  </Typography>
                                </Box>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                color={color}
                                sx={{ borderRadius: 4, height: 8 }}
                              />
                            </Box>
                          );
                        })}
                        <Box
                          mt={0.5}
                          pt={1.5}
                          sx={{ borderTop: 1, borderColor: "divider" }}
                        >
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="body2" color="text.secondary">
                              Total
                            </Typography>
                            <Typography variant="h6" fontWeight={800}>
                              {total}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })()}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Materials by Category & Recent Interventions */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={5}>
              <Card sx={{ height: 300 }}>
                <CardContent sx={{ height: "100%", pb: "16px !important" }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1.5}
                  >
                    <Typography variant="h6" fontWeight={700}>
                      Par Catégorie
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart
                      layout="vertical"
                      data={stats.materialsByCategory}
                      margin={{ top: 0, right: 10, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.divider}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{
                          fontSize: 11,
                          fill: theme.palette.text.secondary,
                        }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{
                          fontSize: 11,
                          fill: theme.palette.text.secondary,
                        }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                        }}
                      />
                      <Bar
                        dataKey="value"
                        name="Matériels"
                        fill={theme.palette.primary.main}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Interventions */}
            <Grid item xs={12} md={7}>
              <Card sx={{ height: 300 }}>
                <CardContent
                  sx={{
                    height: "100%",
                    overflow: "auto",
                    pb: "16px !important",
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="h6" fontWeight={700}>
                      Interventions Récentes
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate("/maintenance")}
                    >
                      Voir tout
                    </Button>
                  </Box>
                  <List dense disablePadding>
                    {recentInterventions.map((inv) => (
                      <React.Fragment key={inv.id}>
                        <ListItem disablePadding sx={{ py: 0.75 }}>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: "primary.light",
                                color: "primary.dark",
                              }}
                            >
                              <BuildIcon fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  noWrap
                                >
                                  {inv.materialName}
                                </Typography>
                                <PriorityChip priority={inv.priority} />
                              </Box>
                            }
                            secondary={
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                mt={0.25}
                              >
                                <InterventionStatusChip status={inv.status} />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {inv.staff} · {inv.department}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* USER: My Materials */}
      {user?.role === ROLES.USER && (
        <Box>
          <Grid container spacing={2.5} mb={3}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Mes Matériels"
                value={myMaterials.length}
                subtitle="Matériels qui vous sont assignés"
                icon={<ComputerIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="En Service"
                value={
                  myMaterials.filter((m) => m.status === "En Service").length
                }
                subtitle="En bon état"
                icon={<ComputerIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Reforme"
                value={myMaterials.filter((m) => m.status === "Reforme").length}
                subtitle="Hors service"
                icon={<BuildIcon />}
                color="warning"
              />
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" fontWeight={700}>
                  Mes Matériels Assignés
                </Typography>
                <Button size="small" onClick={() => navigate("/materials")}>
                  Voir tout
                </Button>
              </Box>
              {myMaterials.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  py={3}
                >
                  Aucun matériel assigné
                </Typography>
              ) : (
                <Grid container spacing={1.5}>
                  {myMaterials.map((mat) => (
                    <Grid item xs={12} sm={6} key={mat.id}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {mat.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {mat.code} · {mat.category}
                            </Typography>
                          </Box>
                          <Chip
                            label={mat.status}
                            size="small"
                            color={
                              mat.status === "En Service"
                                ? "success"
                                : mat.status === "En Panne"
                                  ? "error"
                                  : "warning"
                            }
                            sx={{ fontSize: "0.65rem", fontWeight: 700 }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
