import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Paper } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { FULL_ACCESS_MODE } from '../utils/constants';

const RoleGuard = ({ children, allowedRoles = [], allowedPermissions = [], requireAllPermissions = false }) => {
  const { user, hasPermissionAny, hasPermission } = useAuth();

  if (FULL_ACCESS_MODE) return children;

  const roleAllowed = !Array.isArray(allowedRoles) || allowedRoles.length === 0
    ? true
    : allowedRoles.includes(user?.role);

  const permissionAllowed = !Array.isArray(allowedPermissions) || allowedPermissions.length === 0
    ? true
    : (requireAllPermissions
      ? allowedPermissions.every((permissionName) => hasPermission(permissionName))
      : hasPermissionAny(allowedPermissions));

  if (!user || !roleAllowed || !permissionAllowed) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Paper sx={{ p: 5, textAlign: 'center', maxWidth: 400 }}>
          <LockIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Accès Refusé
          </Typography>
          <Typography color="text.secondary">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return children;
};

export default RoleGuard;
