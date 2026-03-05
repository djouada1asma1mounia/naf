import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const ConfirmDialog = ({
  open,
  title = 'Confirmer la suppression',
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onClose,
  severity = 'error',
  loading = false,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ pb: 1 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <WarningAmberIcon color={severity} />
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </Box>
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} variant="outlined" disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color={severity}
        disabled={loading}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
