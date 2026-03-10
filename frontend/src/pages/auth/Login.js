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
  'Suivi en temps réel du parc informatique',
  'Gestion des interventions et maintenances',
  'Rapports et analyses avancés',
  'Gestion des utilisateurs et des rôles',
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
          px: 8,
          py: 6,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ position: 'absolute', bottom: -120, right: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <Box display="flex" alignItems="center" gap={2} mb={6}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #FFC107, #FF8F00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.5rem',
              color: '#0D47A1',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            N
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={900} letterSpacing={1}>
              N.A.F.T.A.L
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 0.5 }}>
              Gestion des Actifs IT
            </Typography>
          </Box>
        </Box>

        <Typography variant="h3" fontWeight={800} lineHeight={1.2} mb={2} sx={{ maxWidth: 440 }}>
          Pilotez votre parc{' '}
          <Box component="span" sx={{ color: '#FFC107' }}>informatique</Box>
          {' '}en toute sérénité
        </Typography>

        <Typography variant="body1" sx={{ opacity: 0.72, mb: 5, maxWidth: 380 }}>
          Une plateforme centralisée pour le suivi, la maintenance et
          l'administration de vos ressources informatiques.
        </Typography>

        <Divider sx={{ width: 48, borderColor: 'rgba(255,193,7,0.7)', borderWidth: 2, mb: 4 }} />

        <Box display="flex" flexDirection="column" gap={1.5}>
          {FEATURES.map((f) => (
            <Box key={f} display="flex" alignItems="center" gap={1.5}>
              <CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#FFC107', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{f}</Typography>
            </Box>
          ))}
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
