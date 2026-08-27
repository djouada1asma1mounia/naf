import { createTheme, darken, lighten } from '@mui/material/styles';

const getTheme = (mode, secondaryMain = '#1976D2') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#1565C0',
        light: '#5e92F3',
        dark: '#003c8f',
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryMain,
        light: lighten(secondaryMain, 0.2),
        dark: darken(secondaryMain, 0.2),
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#F4F6F9' : '#0A0E1A',
        paper: mode === 'light' ? '#FFFFFF' : '#111827',
      },
      text: {
        primary: mode === 'light' ? '#1A2332' : '#E8EAED',
        secondary: mode === 'light' ? '#5A6578' : '#9AA0AD',
      },
      success: { main: '#2E7D32' },
      warning: { main: '#ED6C02' },
      error: { main: '#D32F2F' },
      info: { main: '#0288D1' },
      divider: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
      h1: { fontWeight: 700, fontSize: '2.25rem' },
      h2: { fontWeight: 700, fontSize: '1.875rem' },
      h3: { fontWeight: 600, fontSize: '1.5rem' },
      h4: { fontWeight: 600, fontSize: '1.25rem' },
      h5: { fontWeight: 600, fontSize: '1.125rem' },
      h6: { fontWeight: 600, fontSize: '1rem' },
      subtitle1: { fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 10 },
    shadows: mode === 'light'
      ? [
          'none',
          '0px 1px 3px rgba(0,0,0,0.08)',
          '0px 2px 6px rgba(0,0,0,0.10)',
          '0px 4px 12px rgba(0,0,0,0.12)',
          '0px 6px 16px rgba(0,0,0,0.14)',
          '0px 8px 24px rgba(0,0,0,0.16)',
          ...Array(19).fill('none'),
        ]
      : [
          'none',
          '0px 1px 3px rgba(0,0,0,0.30)',
          '0px 2px 6px rgba(0,0,0,0.35)',
          '0px 4px 12px rgba(0,0,0,0.40)',
          '0px 6px 16px rgba(0,0,0,0.45)',
          '0px 8px 24px rgba(0,0,0,0.50)',
          ...Array(19).fill('none'),
        ],
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light'
              ? '0px 2px 8px rgba(21,101,192,0.08)'
              : '0px 2px 8px rgba(0,0,0,0.40)',
            border: mode === 'light'
              ? '1px solid rgba(21,101,192,0.08)'
              : '1px solid rgba(255,255,255,0.06)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 20px',
            fontWeight: 600,
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${darken(secondaryMain, 0.22)} 0%, ${secondaryMain} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${darken(secondaryMain, 0.3)} 0%, ${darken(secondaryMain, 0.12)} 100%)`,
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      // Sets default table size to medium app-wide
      MuiTable: {
        defaultProps: {
          size: 'medium',
        },
      },
      // Table Header Configuration (1.10rem)
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: mode === 'light' ? secondaryMain : darken(secondaryMain, 0.25),
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1.10rem !important',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '16px 16px',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(even)': {
              backgroundColor: mode === 'light'
                ? `${secondaryMain}0A`
                : 'rgba(255,255,255,0.025)',
            },
            '&:hover': {
              backgroundColor: mode === 'light'
                ? `${secondaryMain}14`
                : 'rgba(255,255,255,0.05)',
            },
          },
        },
      },
      // Table Body Cells Configuration (1rem)
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '14px 20px',
          },
          body: {
            fontSize: '1rem !important',
            fontWeight: 500,
          },
        },
      },
      // Chip Configuration (1rem font, sizing, & color overrides)
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: '1rem !important',
            height: 'auto',
            padding: '6px 12px',
            borderRadius: '16px',
          },
          label: {
            fontSize: '1rem !important',
            paddingLeft: '8px',
            paddingRight: '8px',
          },
          // Color variant overrides
          colorSuccess: {
            backgroundColor: '#2E7D32',
            color: '#ffffff',
          },
          colorWarning: {
            backgroundColor: '#ED6C02',
            color: '#ffffff',
          },
          colorError: {
            backgroundColor: '#D32F2F',
            color: '#ffffff',
          },
          colorPrimary: {
            backgroundColor: mode === 'light' ? `${secondaryMain}20` : 'rgba(255,255,255,0.1)',
            color: mode === 'light' ? secondaryMain : '#90CAF9',
            border: `1px solid ${secondaryMain}`,
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          caption: {
            fontSize: '0.9rem !important',
          },
          body2: {
            fontSize: '1rem !important',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: mode === 'light'
              ? `linear-gradient(180deg, ${darken(secondaryMain, 0.35)} 0%, ${darken(secondaryMain, 0.2)} 60%, ${secondaryMain} 100%)`
              : 'linear-gradient(180deg, #0D0D2B 0%, #111827 100%)',
          },
        },
      },
    },
  });

export default getTheme;