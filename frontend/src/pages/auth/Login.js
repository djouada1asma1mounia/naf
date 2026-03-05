import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, Divider, useTheme, CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const Login = () => {
  const theme = useTheme();
  const { login } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Veuillez renseigner tous les champs.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const demoUsers = [
    { label: 'Administrateur', username: 'admin', password: 'admin123', color: 'error' },
    { label: 'Utilisateur+', username: 'userplus1', password: 'user123', color: 'warning' },
    { label: 'Utilisateur', username: 'user1', password: 'user123', color: 'info' },
  ];

  const fillDemo = (u) => setForm({ username: u.username, password: u.password });

  return (
    <Box
      minHeight="100vh"
      display="flex"
      sx={{
        background:
          mode === 'light'
            ? 'linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #1976D2 70%, #42A5F5 100%)'
            : 'linear-gradient(135deg, #0A0E1A 0%, #0D1B2A 50%, #1A2332 100%)',
      }}
    >
      {/* Left Panel */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          color: '#fff',
        }}
      >
        <Box
          sx={{
            width: 90,
            height: 90,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #FFC107, #FF8F00)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#0D47A1',
            mb: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          N
        </Box>
        <Typography variant="h3" fontWeight={900} textAlign="center" mb={1}>
          N.A.F.T.A.L
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          sx={{ opacity: 0.85, fontWeight: 500, mb: 4 }}
        >
          Gestion des Actifs Informatiques
        </Typography>
        <Divider sx={{ width: 60, borderColor: 'rgba(255,193,7,0.6)', borderWidth: 2, mb: 4 }} />
        <Typography variant="body1" textAlign="center" sx={{ opacity: 0.7, maxWidth: 320 }}>
          Système de gestion centralisé pour le suivi, la maintenance et l'administration
          du parc informatique de l'entreprise.
        </Typography>
      </Box>

      {/* Right Panel - Login Form */}
      <Box
        sx={{
          width: { xs: '100%', md: 460 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 2, md: 4 },
          bgcolor: theme.palette.background.default,
        }}
      >
        {/* Theme Toggle */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <IconButton onClick={toggleTheme} sx={{ color: mode === 'light' ? '#666' : '#aaa' }}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Box>

        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Mobile Logo */}
            <Box
              textAlign="center"
              mb={3}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <Typography variant="h4" fontWeight={900} color="primary">
                N.A.F.T.A.L
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestion des Actifs IT
              </Typography>
            </Box>

            <Typography variant="h5" fontWeight={700} mb={0.5}>
              Connexion
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Accédez à votre espace de gestion
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Nom d'utilisateur"
                value={form.username}
                onChange={handleChange('username')}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircleIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                autoComplete="username"
                autoFocus
              />

              <TextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange('password')}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.4, fontSize: '1rem', fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Comptes de démonstration
              </Typography>
            </Divider>

            <Box display="flex" flexDirection="column" gap={1}>
              {demoUsers.map((u) => (
                <Button
                  key={u.username}
                  variant="outlined"
                  size="small"
                  color={u.color}
                  onClick={() => fillDemo(u)}
                  sx={{ justifyContent: 'flex-start', px: 2 }}
                >
                  <Box component="span" fontWeight={700} mr={1}>
                    {u.label}:
                  </Box>
                  {u.username} / {u.password}
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.secondary" mt={3} textAlign="center">
          © 2026 N.A.F.T.A.L — Système de Gestion des Actifs Informatiques
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
