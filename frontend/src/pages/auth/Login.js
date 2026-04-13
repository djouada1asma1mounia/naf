import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Fade, Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const FEATURES = [
  'Suivi centralise des materiels',
  'Gestion des interventions, decharges et structures',
  'Reporting operationnel et indicateurs d exploitation',
  'Administration securisee des utilisateurs et des roles',
];

const Login = () => {
  const { login } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDark = mode === 'dark';

  const validate = () => {
    const errs = { email: '', password: '' };
    if (!form.email.trim()) errs.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide';
    if (!form.password) errs.password = 'Mot de passe requis';
    else if (form.password.length < 4) errs.password = 'Minimum 4 caractères';
    setFieldErrors(errs);
    return !errs.email && !errs.password;
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((fe) => ({ ...fe, [field]: '' }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      sx={{
        background: isDark
          ? 'linear-gradient(135deg, #0A0E1A 0%, #0D1B2A 60%, #0F2440 100%)'
          : 'linear-gradient(135deg, #0D47A1 0%, #1565C0 45%, #1976D2 75%, #42A5F5 100%)',
      }}
    >
      {/* Left Branding Panel */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: { md: 7, lg: 9 },
          py: 6,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          background: isDark
            ? 'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.08) 0%, transparent 33%), radial-gradient(circle at 88% 92%, rgba(66,165,245,0.2) 0%, transparent 38%), linear-gradient(145deg, #08101F 0%, #0E2B55 48%, #0D47A1 100%)'
            : 'radial-gradient(circle at 16% 10%, rgba(255,255,255,0.14) 0%, transparent 34%), radial-gradient(circle at 90% 92%, rgba(255,255,255,0.12) 0%, transparent 35%), linear-gradient(145deg, #0D47A1 0%, #1565C0 56%, #1E6ED8 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -130,
            left: -120,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -190,
            right: -120,
            width: 470,
            height: 470,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            backdropFilter: 'blur(2px)',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2.25,
              mb: 6,
              px: 2,
              py: 1.25,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            }}
          >
            <Box
              component="img"
              src="/naftal-logo.png"
              alt="Naftal"
              sx={{
                width: 170,
                height: 'auto',
                display: 'block',
                objectFit: 'contain',
              }}
            />
            <Box>
              <Typography
                variant="h5"
                fontWeight={900}
                letterSpacing={1.4}
                sx={{ lineHeight: 1.1 }}
              >
                N.A.F.T.A.L
              </Typography>
              <Typography
                variant="caption"
                sx={{ opacity: 0.84, letterSpacing: 0.6, fontSize: '0.78rem' }}
              >
                Gestion des Actifs IT
              </Typography>
            </Box>
          </Box>

          <Typography variant="h3" fontWeight={850} lineHeight={1.16} mb={2.2} sx={{ maxWidth: 520 }}>
            Pilotez vos actifs IT{' '}
            <Box component="span" sx={{ color: '#FFD24D' }}>informatique</Box>
            {' '}avec confiance
          </Typography>

          <Typography variant="body1" sx={{ opacity: 0.82, mb: 4.5, maxWidth: 520, fontSize: '1.08rem' }}>
            Une plateforme unifiee pour la gestion du cycle de vie des equipements,
            le suivi des operations terrain et la gouvernance des acces.
          </Typography>

          <Divider sx={{ width: 64, borderColor: 'rgba(255,210,77,0.95)', borderWidth: 2, mb: 3.5 }} />

          <Box display="flex" flexDirection="column" gap={1.7}>
            {FEATURES.map((f) => (
              <Box key={f} display="flex" alignItems="center" gap={1.5}>
                <CheckCircleOutlineIcon sx={{ fontSize: 19, color: '#FFD24D', flexShrink: 0 }} />
                <Typography variant="body2" sx={{ opacity: 0.92, fontSize: '1rem', fontWeight: 500 }}>
                  {f}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right Form Panel */}
      <Box
        sx={{
          width: { xs: '100%', md: 480 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 3, sm: 6 },
          py: 6,
          bgcolor: isDark ? '#111827' : '#ffffff',
          position: 'relative',
          boxShadow: '-4px 0 40px rgba(0,0,0,0.18)',
        }}
      >
        <IconButton
          onClick={toggleTheme}
          size="small"
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
            '&:hover': { color: isDark ? '#fff' : '#000' },
          }}
        >
          {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>

        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Box textAlign="center" mb={4} sx={{ display: { xs: 'block', md: 'none' } }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.4rem',
                color: '#fff',
                mb: 1.5,
              }}
            >
              N
            </Box>
            <Typography variant="h5" fontWeight={900} color="primary">N.A.F.T.A.L</Typography>
            <Typography variant="caption" color="text.secondary">Gestion des Actifs Informatiques</Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} mb={0.5} color="text.primary">
            Connexion
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Entrez vos identifiants pour accéder à votre espace.
          </Typography>

          <Fade in={!!error}>
            <Box mb={error ? 3 : 0}>
              {error && (
                <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Fade>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Adresse email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon color={fieldErrors.email ? 'error' : 'action'} />
                  </InputAdornment>
                ),
              }}
              autoComplete="email"
              autoFocus
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange('password')}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              sx={{ mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color={fieldErrors.password ? 'error' : 'action'} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      disabled={loading}
                      size="small"
                    >
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              autoComplete="current-password"
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontWeight: 700,
                fontSize: '0.95rem',
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(21,101,192,0.35)',
                '&:hover': { boxShadow: '0 6px 20px rgba(21,101,192,0.45)' },
              }}
            >
              {loading ? (
                <Box display="flex" alignItems="center" gap={1.5}>
                  <CircularProgress size={18} color="inherit" />
                  Connexion en cours…
                </Box>
              ) : 'Se connecter'}
            </Button>
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ position: 'absolute', bottom: 20, textAlign: 'center' }}
        >
          © 2026 N.A.F.T.A.L — Système de Gestion des Actifs Informatiques
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
