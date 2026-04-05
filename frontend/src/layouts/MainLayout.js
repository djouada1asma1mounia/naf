import React, { useState, useEffect } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { SIDEBAR_WIDTH } from '../utils/constants';
import { maintenanceAPI } from '../api/maintenance';
import { useSnackbar } from 'notistack';

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await maintenanceAPI.getAll();
        const notifs = data.slice(0, 5).map((m) => ({
          id: m.id,
          title: `Intervention ${m.code || m.reference}`,
          message: `${m.materialName} - ${m.type || 'N/A'}`,
        }));
        setNotifications(notifs);
      } catch {}
    };
    fetchNotifications();

    const interval = setInterval(async () => {
      try {
        const { count } = await maintenanceAPI.getRecentCount();
        if (count > 0) {
          enqueueSnackbar(`${count} intervention(s) récente(s)`, { variant: 'info' });
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [enqueueSnackbar]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Sidebar
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      ) : (
        <Sidebar variant="permanent" />
      )}

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Navbar
          onMenuClick={() => setMobileOpen(true)}
          notifCount={notifications.length}
          notifications={notifications}
        />
        <Toolbar sx={{ minHeight: 64 }} />

        {/* Page content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
