import React, { useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem,
  Divider, Badge, Tooltip, Chip, Switch, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { SIDEBAR_WIDTH } from '../../utils/constants';

const Navbar = ({ onMenuClick, notifCount = 0, notifications = [] }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  const handleUserMenu = (e) => setAnchorEl(e.currentTarget);
  const handleUserClose = () => setAnchorEl(null);
  const handleNotifMenu = (e) => setNotifAnchor(e.currentTarget);
  const handleNotifClose = () => setNotifAnchor(null);

  const handleLogout = () => {
    handleUserClose();
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleUserClose();
    navigate('/profile');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        zIndex: theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, md: 3 } }}>
        {/* Mobile menu button */}
        <IconButton
          color="inherit"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* App name on mobile */}
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ display: { xs: 'block', md: 'none' }, flexGrow: 1, color: 'primary.main' }}
        >
          N.A.F.T.A.L
        </Typography>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

        {/* Theme Toggle */}
        <Tooltip title={mode === 'light' ? 'Mode Sombre' : 'Mode Clair'}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <LightModeIcon
              sx={{
                fontSize: 18,
                color: mode === 'light' ? 'primary.main' : 'text.secondary',
                mr: 0.5,
              }}
            />
            <Switch
              size="small"
              checked={mode === 'dark'}
              onChange={toggleTheme}
              color="primary"
            />
            <DarkModeIcon
              sx={{
                fontSize: 18,
                color: mode === 'dark' ? 'primary.main' : 'text.secondary',
                ml: 0.5,
              }}
            />
          </Box>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton color="inherit" onClick={handleNotifMenu} sx={{ mr: 0.5 }}>
            <Badge badgeContent={notifCount} color="error" max={9}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={handleNotifClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
        >
          <Box px={2} py={1.5} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={700}>
              Notifications
            </Typography>
            {notifCount > 0 && (
              <Chip label={`${notifCount} nouvelles`} size="small" color="error" />
            )}
          </Box>
          <Divider />
          {notifications.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                Aucune notification
              </Typography>
            </MenuItem>
          ) : (
            notifications.map((n) => (
              <MenuItem key={n.id} onClick={handleNotifClose} sx={{ whiteSpace: 'normal', py: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {n.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {n.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>

        {/* User Menu */}
        <Box
          onClick={handleUserMenu}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            ml: 1,
            px: 1.2,
            py: 0.7,
            borderRadius: 2.5,
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.15)}`,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.14),
              boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.2)}`,
            },
            transition: 'all 0.2s ease',
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              background: 'linear-gradient(135deg, #1565C0, #1976D2)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
              {user?.firstName} {user?.lastName}
            </Typography>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              width: 280,
              mt: 1,
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
              boxShadow: `0 18px 40px ${alpha('#000000', theme.palette.mode === 'dark' ? 0.5 : 0.18)}`,
            },
          }}
        >
          <Box
            px={2}
            py={1.6}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.28 : 0.14)}, ${alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.18 : 0.08)})`,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Avatar
              sx={{
                width: 44,
                height: 44,
                background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
                fontSize: '1rem',
                fontWeight: 800,
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" fontWeight={800} noWrap>
                {user?.firstName} {user?.lastName}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 1 }}>
            <MenuItem
              onClick={handleProfile}
              sx={{
                borderRadius: 2,
                py: 1,
                px: 1.1,
                gap: 1.2,
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.14),
                  color: 'primary.main',
                  flexShrink: 0,
                }}
              >
                <PersonIcon fontSize="small" />
              </Box>
            Mon Profil
            </MenuItem>

            <MenuItem
              onClick={handleLogout}
              sx={{
                mt: 0.5,
                borderRadius: 2,
                py: 1,
                px: 1.1,
                gap: 1.2,
                color: 'error.main',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                },
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: alpha(theme.palette.error.main, 0.14),
                  color: 'error.main',
                  flexShrink: 0,
                }}
              >
                <LogoutIcon fontSize="small" />
              </Box>
            Déconnexion
            </MenuItem>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
