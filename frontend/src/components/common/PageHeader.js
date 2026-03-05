import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Divider } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({ title, subtitle, breadcrumbs = [], action }) => {
  const navigate = useNavigate();

  return (
    <Box mb={3}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 0.5 }}
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return isLast ? (
              <Typography key={idx} variant="caption" color="text.primary" fontWeight={600}>
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={idx}
                component="button"
                variant="caption"
                underline="hover"
                color="text.secondary"
                onClick={() => crumb.path && navigate(crumb.path)}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      <Box display="flex" alignItems={{ sm: 'center' }} justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export default PageHeader;
