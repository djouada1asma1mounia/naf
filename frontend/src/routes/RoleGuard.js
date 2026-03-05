import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Paper } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

const RoleGuard = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
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
