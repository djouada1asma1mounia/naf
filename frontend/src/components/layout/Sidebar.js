import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { SIDEBAR_WIDTH, FULL_ACCESS_MODE } from '../../utils/constants';

import DashboardIcon from '@mui/icons-material/Dashboard';
import ComputerIcon from '@mui/icons-material/Computer';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import RuleIcon from '@mui/icons-material/Rule';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';

const navItems = [
  {
    label: 'Tableau de Bord',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: [ROLES.ADMIN, ROLES.USER],
  },
  {
    label: 'Matériels',
    icon: <ComputerIcon />,
    path: '/materials',
    roles: [ROLES.ADMIN, ROLES.USER],
  },
  {
    label: 'Matériels GD',
    icon: <LocalGasStationIcon />,
    path: '/gd-materials',
    roles: [ROLES.ADMIN, ROLES.USER],
  },
  {
    label: 'Interventions',
    icon: <BuildIcon />,
    path: '/maintenance',
    roles: [ROLES.ADMIN, ROLES.USER],
  },
  {
    label: 'Décharges',
    icon: <DescriptionIcon />,
    path: '/decharges',
    roles: [ROLES.ADMIN, ROLES.USER],
  },
  {
    label: 'Structures',
    icon: <BusinessIcon />,
    path: '/structures',
    roles: [ROLES.ADMIN, ROLES.USER],
  },
  {
    label: 'Catégories',
    icon: <CategoryIcon />,
    path: '/categories',
    roles: [ROLES.ADMIN],
  },
  {
    label: 'Raisons',
    icon: <RuleIcon />,
    path: '/reasons',
    roles: [ROLES.ADMIN, ROLES.USER],
  },
  {
    label: 'Utilisateurs',
    icon: <PeopleIcon />,
    path: '/users',
    roles: [ROLES.ADMIN],
  },
  {
    label: 'Rôles',
    icon: <BadgeIcon />,
    path: '/roles',
    roles: [ROLES.ADMIN],
  },
  {
    label: 'Rapports',
    icon: <AssessmentIcon />,
    path: '/reports',
    roles: [ROLES.ADMIN, ROLES.USER],
  },
  {
    label: 'Paramètres',
    icon: <SettingsIcon />,
    path: '/profile',
    roles: [ROLES.ADMIN, ROLES.USER],
  },
];

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const theme = useTheme();
  const accent = theme.palette.secondary.main;
  const navigate = useNavigate();
  const location = useLocation();

  // Colors based on mode
  const bg = isDark ? '#1a1a2e' : '#fff';
  const paperBg = isDark ? '#1a1a2e' : '#fff';
  const paperShadow = isDark ? '2px 0 12px rgba(0,0,0,0.4)' : '2px 0 12px rgba(0,0,0,0.08)';
  const userNameColor = isDark ? '#fff' : '#1a1a2e';
  const inactiveIconColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const inactiveTextColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
  const activeColor = accent;
  const activeBg = alpha(accent, isDark ? 0.2 : 0.12);
  const hoverBg = alpha(accent, isDark ? 0.2 : 0.12);
  const footerColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)';
  const borderColorLight = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const visibleItems = FULL_ACCESS_MODE ? navItems : navItems.filter((item) => item.roles.includes(user?.role));

  const handleNavClick = (path) => {
    navigate(path);
    if (variant === 'temporary') onClose?.();
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: bg,
        color: userNameColor,
        overflowX: 'hidden',
      }}
    >
      {/* Logo Header */}
      <Box
        sx={{
          px: 2,
          py: 2,
          display: 'flex',
          justifyContent: 'center',
          borderBottom: `1px solid ${borderColorLight}`,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 210,
            px: 0.5,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none',
          }}
        >
          <Box
            component="img"
            src="/naftal-logo.png"
            alt="Naftal"
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block',
              maxHeight: 84,
              objectFit: 'contain',
            }}
          />
        </Box>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1.5, pt: 1.5, pb: 1 }}>
        {visibleItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                  backgroundColor: isActive ? activeBg : 'transparent',
                  borderLeft: isActive ? `3px solid ${activeColor}` : '3px solid transparent',
                  '&:hover': {
                    backgroundColor: hoverBg,
                  },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? activeColor : inactiveIconColor,
                    minWidth: 36,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? activeColor : inactiveTextColor,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: `1px solid ${borderColorLight}`,
        }}
      >
        <Typography variant="caption" sx={{ color: footerColor, fontSize: '0.65rem' }}>
          © 2026 N.A.F.T.A.L v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={variant === 'permanent' ? true : open}
      onClose={onClose}
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          backgroundColor: paperBg,
          boxShadow: paperShadow,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
