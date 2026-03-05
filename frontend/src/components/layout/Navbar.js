import React, { useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem,
  Divider, Badge, Tooltip, Chip, Switch, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { ROLE_LABELS, ROLE_COLORS, SIDEBAR_WIDTH } from '../../utils/constants';

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
            px: 1,
            py: 0.5,
            borderRadius: 2,
            '&:hover': { backgroundColor: 'action.hover' },
            transition: 'background 0.15s',
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
            <Typography variant="caption" color="text.secondary" lineHeight={1}>
              {ROLE_LABELS[user?.role]}
            </Typography>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { width: 200 } }}
        >
          <Box px={2} py={1.5}>
            <Typography variant="body2" fontWeight={700}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Chip
              label={ROLE_LABELS[user?.role]}
              size="small"
              color={ROLE_COLORS[user?.role]}
              sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
            />
          </Box>
          <Divider />
          <MenuItem onClick={handleProfile}>
            <PersonIcon fontSize="small" sx={{ mr: 1.5 }} />
            Mon Profil
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Déconnexion
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
