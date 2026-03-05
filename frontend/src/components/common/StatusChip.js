import React from 'react';
import { Chip } from '@mui/material';
import {
  STATUS_COLORS,
  INTERVENTION_STATUS_COLORS,
  PRIORITY_COLORS,
  ROLE_COLORS,
  ROLE_LABELS,
} from '../../utils/constants';

export const StatusChip = ({ status }) => (
  <Chip
    label={status}
    size="small"
    color={STATUS_COLORS[status] || 'default'}
    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
  />
);

export const InterventionStatusChip = ({ status }) => (
  <Chip
    label={status}
    size="small"
    color={INTERVENTION_STATUS_COLORS[status] || 'default'}
    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
  />
);

export const PriorityChip = ({ priority }) => (
  <Chip
    label={priority}
    size="small"
    color={PRIORITY_COLORS[priority] || 'default'}
    variant="outlined"
    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
  />
);

export const RoleChip = ({ role }) => (
  <Chip
    label={ROLE_LABELS[role] || role}
    size="small"
    color={ROLE_COLORS[role] || 'default'}
    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
  />
);
