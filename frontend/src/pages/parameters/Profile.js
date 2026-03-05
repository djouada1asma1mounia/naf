import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  Avatar, Divider, Alert, Chip, Tab, Tabs, InputAdornment, IconButton,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/auth';
import PageHeader from '../../components/common/PageHeader';
import { RoleChip } from '../../components/common/StatusChip';
import { useSnackbar } from 'notistack';

const TabPanel = ({ children, value, index }) => value === index && <Box pt={3}>{children}</Box>;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    department: user?.department || '',
  });

  const [pwForm, setPwForm] = useState({ old: '', new1: '', new2: '' });
  const [showPw, setShowPw] = useState({ old: false, new1: false, new2: false });
  const [pwError, setPwError] = useState('');

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const updated = await authAPI.updateUser(user.id, profileForm);
      updateUser(updated);
      enqueueSnackbar('Profil mis à jour', { variant: 'success' });
      setEditMode(false);
    } catch (err) {
      enqueueSnackbar(err.message || 'Erreur', { variant: 'error' });
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new1 !== pwForm.new2) {
      setPwError('Les mots de passe ne correspondent pas');
      return;
    }
    if (pwForm.new1.length < 6) {
      setPwError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setPwError('');
    setLoading(true);
    try {
      await authAPI.changePassword(user.id, pwForm.old, pwForm.new1);
      enqueueSnackbar('Mot de passe modifié', { variant: 'success' });
      setPwForm({ old: '', new1: '', new2: '' });
    } catch (err) {
      setPwError(err.message || 'Erreur');
    }
    setLoading(false);
  };

  return (
    <Box>
      <PageHeader
        title="Mon Profil"
        breadcrumbs={[{ label: 'Accueil', path: '/dashboard' }, { label: 'Profil' }]}
      />

      <Grid container spacing={3} alignItems="flex-start">
        {/* Profile Card */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', pt: 4, pb: 3 }}>
              <Avatar
                sx={{
                  width: 90,
                  height: 90,
                  background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: '0 auto',
                  mb: 2,
                }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Typography variant="h5" fontWeight={700}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {user?.email}
              </Typography>
              <RoleChip role={user?.role} />
              <Divider sx={{ my: 2 }} />
              <Box textAlign="left">
                {[
                  { label: "Nom d'utilisateur", value: user?.username },
                  { label: 'Département', value: user?.department },
                  { label: 'Membre depuis', value: user?.createdAt },
                ].map(({ label, value }) => (
                  <Box key={label} mb={1.5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">
                      {label}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12} sm={8}>
          <Card>
            <CardContent>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab icon={<PersonIcon />} iconPosition="start" label="Informations" />
                <Tab icon={<LockIcon />} iconPosition="start" label="Sécurité" />
              </Tabs>

              {/* Profile Info */}
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
                      label="Prénom"
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
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Département"
                      value={profileForm.department}
                      disabled
                      helperText="Contactez un administrateur pour modifier le département"
                    />
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Security */}
              <TabPanel value={tab} index={1}>
                <Typography variant="subtitle2" color="text.secondary" mb={3}>
                  Pour votre sécurité, utilisez un mot de passe fort d'au moins 8 caractères.
                </Typography>
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
