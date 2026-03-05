import React from 'react';
import { Card, CardContent, Box, Typography, Avatar, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend, trendLabel }) => {
  const theme = useTheme();

  const colorMap = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const mainColor = colorMap[color] || colorMap.primary;

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: mainColor,
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              textTransform="uppercase"
              letterSpacing="0.05em"
            >
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={800} color="text.primary" mt={0.5} lineHeight={1.1}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                {trend >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                )}
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color={trend >= 0 ? 'success.main' : 'error.main'}
                >
                  {trend >= 0 ? '+' : ''}{trend}% {trendLabel}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              backgroundColor: `${mainColor}18`,
              color: mainColor,
              borderRadius: 3,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
