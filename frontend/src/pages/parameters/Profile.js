import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  Alert, Tab, Tabs, InputAdornment, IconButton, Switch,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import PaletteIcon from '@mui/icons-material/Palette';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { authAPI } from '../../api/auth';
import PageHeader from '../../components/common/PageHeader';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

const TabPanel = ({ children, value, index }) => value === index && <Box pt={3}>{children}</Box>;

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const {
    mode,
    toggleTheme,
    secondaryColor,
    setSecondaryColor,
    resetSecondaryColor,
    defaultSecondaryColor,
  } = useThemeMode();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customColor, setCustomColor] = useState(secondaryColor);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
  }, [user]);

  useEffect(() => {
    setCustomColor(secondaryColor);
  }, [secondaryColor]);

  const [pwForm, setPwForm] = useState({ old: '', new1: '', new2: '' });
  const [showPw, setShowPw] = useState({ old: false, new1: false, new2: false });
  const [pwError, setPwError] = useState('');

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const updated = await authAPI.updateUser(user.id, profileForm);
      updateUser(updated);
      enqueueSnackbar('Profil mis a jour', { variant: 'success' });
      setEditMode(false);
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur', { variant: 'error' });
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.old || !pwForm.new1 || !pwForm.new2) {
      setPwError('Tous les champs du mot de passe sont obligatoires');
      return;
    }
    if (pwForm.new1 !== pwForm.new2) {
      setPwError('Les mots de passe ne correspondent pas');
      return;
    }
    if (pwForm.new1.length < 6) {
      setPwError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }
    setPwError('');
    setLoading(true);
    try {
      const response = await authAPI.changePassword({
        currentPassword: pwForm.old,
        newPassword: pwForm.new1,
        confirmNewPassword: pwForm.new2,
      });

      enqueueSnackbar(response?.message || 'Mot de passe modifie. Veuillez vous reconnecter.', { variant: 'success' });
      setPwForm({ old: '', new1: '', new2: '' });
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setPwError(err.message || 'Erreur');
    }
    setLoading(false);
  };

  return (
    <Box>
      <PageHeader
        title="Parametres"
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Profil' }]}
      />

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
            <Tab icon={<PersonIcon />} iconPosition="start" label="Informations" />
            <Tab icon={<LockIcon />} iconPosition="start" label="Securite" />
            <Tab icon={<PaletteIcon />} iconPosition="start" label="Couleur" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              {!editMode ? (
                <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setEditMode(true)}>
                  Modifier
                </Button>
              ) : (
                <Box display="flex" gap={1}>
                  <Button variant="outlined" onClick={() => setEditMode(false)} disabled={loading}>Annuler</Button>
                  <Button startIcon={<SaveIcon />} variant="contained" onClick={handleProfileSave} disabled={loading}>
                    Sauvegarder
                  </Button>
                </Box>
              )}
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prenom"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            {pwError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPwError('')}>{pwError}</Alert>}
            <Box component="form" onSubmit={handlePasswordChange}>
              <Grid container spacing={2}>
                {[
                  { field: 'old', label: 'Mot de passe actuel' },
                  { field: 'new1', label: 'Nouveau mot de passe' },
                  { field: 'new2', label: 'Confirmer le nouveau mot de passe' },
                ].map(({ field, label }) => (
                  <Grid item xs={12} key={field}>
                    <TextField
                      fullWidth
                      label={label}
                      type={showPw[field] ? 'text' : 'password'}
                      value={pwForm[field]}
                      onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPw((s) => ({ ...s, [field]: !s[field] }))}>
                              {showPw[field] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" disabled={loading}>
                    Changer le mot de passe
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Le mode et la couleur sont appliques a toute l'application.
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LightModeIcon fontSize="small" color={mode === 'light' ? 'primary' : 'disabled'} />
                    <Switch checked={mode === 'dark'} onChange={toggleTheme} color="primary" />
                    <DarkModeIcon fontSize="small" color={mode === 'dark' ? 'primary' : 'disabled'} />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Couleur"
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-input': {
                      p: 0.6,
                      height: 42,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Code HEX"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#1976D2"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" gap={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setSecondaryColor(customColor);
                      enqueueSnackbar('Couleur appliquee a l\'application', { variant: 'success' });
                    }}
                  >
                    Appliquer
                  </Button>
                  <Button fullWidth variant="outlined" onClick={resetSecondaryColor}>
                    Defaut
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${secondaryColor}22, transparent)`,
                  }}
                >
                  <Typography variant="body2" fontWeight={700} sx={{ color: secondaryColor }}>
                    Couleur active: {secondaryColor}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Couleur par defaut: {defaultSecondaryColor}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;
