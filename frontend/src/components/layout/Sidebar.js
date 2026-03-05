import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Collapse, Tooltip, Avatar, Chip,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { SIDEBAR_WIDTH, ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';

import DashboardIcon from '@mui/icons-material/Dashboard';
import ComputerIcon from '@mui/icons-material/Computer';
import BuildIcon from '@mui/icons-material/Build';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const navItems = [
  {
    label: 'Tableau de Bord',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: [ROLES.ADMIN, ROLES.USER_PLUS, ROLES.USER],
  },
  {
    label: 'Matériels',
    icon: <ComputerIcon />,
    path: '/materials',
    roles: [ROLES.ADMIN, ROLES.USER_PLUS, ROLES.USER],
  },
  {
    label: 'Interventions',
    icon: <BuildIcon />,
    path: '/maintenance',
    roles: [ROLES.ADMIN, ROLES.USER_PLUS, ROLES.USER],
  },
  {
    label: 'Structures',
    icon: <BusinessIcon />,
    path: '/structures',
    roles: [ROLES.ADMIN, ROLES.USER_PLUS],
  },
  {
    label: 'Catégories',
    icon: <CategoryIcon />,
    path: '/categories',
    roles: [ROLES.ADMIN],
  },
  {
    label: 'Utilisateurs',
    icon: <PeopleIcon />,
    path: '/users',
    roles: [ROLES.ADMIN],
  },
  {
    label: 'Rapports',
    icon: <AssessmentIcon />,
    path: '/reports',
    roles: [ROLES.ADMIN, ROLES.USER_PLUS],
  },
  {
    label: 'Paramètres',
    icon: <SettingsIcon />,
    path: '/profile',
    roles: [ROLES.ADMIN, ROLES.USER_PLUS, ROLES.USER],
  },
];

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

  // Colors based on mode
  const bg = isDark ? '#1a1a2e' : '#fff';
  const paperBg = isDark ? '#1a1a2e' : '#fff';
  const paperShadow = isDark ? '2px 0 12px rgba(0,0,0,0.4)' : '2px 0 12px rgba(0,0,0,0.08)';
  const titleColor = isDark ? '#42A5F5' : '#1565C0';
  const subtitleColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const userNameColor = isDark ? '#fff' : '#1a1a2e';
  const inactiveIconColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const inactiveTextColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
  const activeColor = '#1565C0';
  const activeBg = isDark ? 'rgba(66,165,245,0.15)' : 'rgba(21,101,192,0.1)';
  const hoverBg = isDark ? 'rgba(66,165,245,0.08)' : 'rgba(21,101,192,0.07)';
  const footerColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)';
  const borderColorLight = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const visibleItems = navItems.filter((item) => item.roles.includes(user?.role));

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
          px: 2.5,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #1565C0, #1976D2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '1.1rem',
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(21,101,192,0.4)',
          }}
        >
          N
        </Box>
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{ color: titleColor, lineHeight: 1.1, fontSize: '1rem' }}
          >
            N.A.F.T.A.L
          </Typography>
          <Typography variant="caption" sx={{ color: subtitleColor, fontSize: '0.68rem' }}>
            Gestion des Actifs IT
          </Typography>
        </Box>
      </Box>

      {/* User Info */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${borderColorLight}`,
        }}
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,
            background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </Avatar>
        <Box overflow="hidden">
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ color: userNameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {user?.firstName} {user?.lastName}
          </Typography>
          <Chip
            label={ROLE_LABELS[user?.role]}
            size="small"
            color={ROLE_COLORS[user?.role]}
            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
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
