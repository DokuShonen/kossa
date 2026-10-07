import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import Login from './components/Login';
import DashboardAgent from './components/DashboardAgent';
import AgentDashboard from './components/AgentDashboard';
import AdminUserPanel from './components/AdminUserPanel';
import AdminConfigPanel from './components/AdminConfigPanel';
import RolesPanel from './components/RolesPanel';
import ManagerDashboard from './components/ManagerDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import GestionnaireDashboard from './components/GestionnaireDashboard';
import ChefSAVDashboard from './components/ChefSAVDashboard';
import NotificationsPopover from './components/NotificationsPopover';
import api from './services/api';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Stack, FormControl, InputLabel, Select, MenuItem, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, InputBase, alpha } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import TuneIcon from '@mui/icons-material/Tune';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DescriptionIcon from '@mui/icons-material/Description';
import AgencesPanel from './components/AgencesPanel';
import { useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 260;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

function LoadingScreen() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #155E75 0%, #0E4557 50%, #0A3542 100%)',
      }}
    >
      <Box sx={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
        <Box
          sx={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: '#FB7185',
            borderBottomColor: '#FB7185',
            animation: `${spin} 1s linear infinite`,
          }}
        />
        <Avatar
          src={process.env.PUBLIC_URL + "/logo.svg"}
          alt="Kossa"
          variant="square"
          sx={{ width: 48, height: 48, bgcolor: 'transparent' }}
        />
      </Box>
      <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 300 }}>
        Chargement de votre espace...
      </Typography>
    </Box>
  );
}

function Logo() {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <Box
        sx={{
          height: 36,
          mr: 2,
          px: 1.5,
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'rgba(255,255,255,0.15)',
          borderRadius: 1,
          fontWeight: 700,
          fontSize: '1rem',
          letterSpacing: 2,
          color: '#FFFFFF',
        }}
      >
        KOSSA
      </Box>
    );
  }

  return (
    <Avatar
      src={process.env.PUBLIC_URL + "/logo.svg"}
      alt="Kossa"
      variant="square"
      onError={() => setError(true)}
      sx={{ width: 36, height: 36, mr: 2, bgcolor: 'transparent' }}
    />
  );
}

function AdminSection({ section = 'utilisateurs' }: { section?: string }) {
  return (
    <>
      {section === 'utilisateurs' ? <AdminUserPanel /> : section === 'categories' ? <AdminConfigPanel /> : section === 'roles' ? <RolesPanel /> : <AgencesPanel />}
    </>
  );
}

function App() {
  const [user, setUser] = useState<any>(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const nom = localStorage.getItem('username');
    return (token && role && nom) ? { token, role, nom } : null;
  });
  const [transition, setTransition] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [agences, setAgences] = useState<any[]>([]);
  const [selectedAgenceId, setSelectedAgenceId] = useState<string>(localStorage.getItem('selectedAgenceId') || '');
  const [userAgence, setUserAgence] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const ROLES_GLOBAUX = ['ROLE_ADMIN', 'ROLE_CHEF_AGENCE', 'ROLE_GESTIONNAIRE', 'ROLE_CHEF_SAV', 'ROLE_SUPERVISEUR'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const nom = localStorage.getItem('username');
    if (token && role && nom) {
      setUser({ token, role, nom });
    }
  }, []);

  useEffect(() => {
    if (user && ROLES_GLOBAUX.includes(user.role)) {
      api.get('/auth/me').then(res => {
        const agence = res.data.agence || null;
        setUserAgence(agence);
        if (agence) {
          setSelectedAgenceId(String(agence.id));
          localStorage.setItem('selectedAgenceId', String(agence.id));
        } else {
          api.get('/admin/users/agences').then(r => setAgences(r.data || [])).catch(() => {});
        }
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAgenceChange = (agenceId: string) => {
    setSelectedAgenceId(agenceId);
    if (agenceId) {
      localStorage.setItem('selectedAgenceId', agenceId);
    } else {
      localStorage.removeItem('selectedAgenceId');
    }
    window.location.reload();
  };

  const handleLoginSuccess = (u: any) => {
    setTransition(true);
    setTimeout(() => {
      setUser(u);
      setTransition(false);
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/');
  };

  const handleOpenProfile = () => {
    setProfileOpen(true);
    setProfileData(null);
    api.get('/auth/me').then(res => setProfileData(res.data)).catch(err => {
      console.error('Erreur /auth/me:', err);
    });
  };

  const menuItems = [
    { label: 'Tableau de bord', path: '/', icon: <DashboardIcon /> },
    ...(user?.role === 'ROLE_CHARGE_RECLAMATION' ? [{ label: 'Statistiques', path: '/statistiques', icon: <BarChartIcon /> }] : []),
  ];

  const adminSubItems = [
    { label: 'Utilisateurs', path: '/utilisateurs', icon: <PeopleIcon /> },
    { label: 'Catégories / SLA', path: '/categories-sla', icon: <TuneIcon /> },
    { label: 'Rôles', path: '/roles', icon: <BadgeIcon /> },
    { label: 'Agences', path: '/agences', icon: <LocationCityIcon /> },
  ];

  const managerSubItems = [
    { label: 'KPI & Statistiques', path: '/kpi', icon: <BarChartIcon /> },
    { label: 'Gestion des Tickets', path: '/tickets', icon: <ConfirmationNumberIcon /> },
    { label: "Demandes d'Escalade", path: '/escalades', icon: <TrendingUpIcon /> },
    { label: 'Extraction de Rapports', path: '/rapports', icon: <DescriptionIcon /> },
  ];

  const drawerContent = (
    <Box>
      <Toolbar>
        <Logo />
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {process.env.REACT_APP_TITLE || 'Kossa'}
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5 }}>
        {menuItems.map(item => (
          <ListItemButton
            key={item.path}
            selected={item.path === '/' && (user?.role === 'ROLE_CHEF_AGENCE' || user?.role === 'ROLE_ADMIN') ? false : location.pathname === item.path}
            onClick={() => { if (!(item.path === '/' && (user?.role === 'ROLE_CHEF_AGENCE' || user?.role === 'ROLE_ADMIN'))) { navigate(item.path); setMobileOpen(false); } }}
            sx={{
              borderRadius: 2, mb: 0.5,
              '&.Mui-selected': { bgcolor: alpha('#155E75', 0.1), color: 'primary.main', '&:hover': { bgcolor: alpha('#155E75', 0.16) } },
              '&.Mui-selected .MuiListItemIcon-root': { color: 'primary.main' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { style: { fontWeight: 600 } } }} />
          </ListItemButton>
        ))}
        {user?.role === 'ROLE_ADMIN' && (
          <List disablePadding>
            {adminSubItems.map(sub => (
              <ListItemButton
                key={sub.path}
                selected={location.pathname === sub.path}
                onClick={() => { navigate(sub.path); setMobileOpen(false); }}
                sx={{
                  pl: 7, borderRadius: 2, mb: 0.5,
                  '&.Mui-selected': { bgcolor: alpha('#155E75', 0.1), color: 'primary.main', '&:hover': { bgcolor: alpha('#155E75', 0.16) } },
                  '&.Mui-selected .MuiListItemIcon-root': { color: 'primary.main' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{sub.icon}</ListItemIcon>
                <ListItemText primary={sub.label} slotProps={{ primary: { style: { fontWeight: 500, fontSize: 14 } } }} />
              </ListItemButton>
            ))}
          </List>
        )}
        {user?.role === 'ROLE_CHEF_AGENCE' && (
          <List disablePadding>
            {managerSubItems.map(sub => (
              <ListItemButton
                key={sub.path}
                selected={location.pathname === sub.path}
                onClick={() => { navigate(sub.path); setMobileOpen(false); }}
                sx={{
                  pl: 7, borderRadius: 2, mb: 0.5,
                  '&.Mui-selected': { bgcolor: alpha('#155E75', 0.1), color: 'primary.main', '&:hover': { bgcolor: alpha('#155E75', 0.16) } },
                  '&.Mui-selected .MuiListItemIcon-root': { color: 'primary.main' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{sub.icon}</ListItemIcon>
                <ListItemText primary={sub.label} slotProps={{ primary: { style: { fontWeight: 500, fontSize: 14 } } }} />
              </ListItemButton>
            ))}
          </List>
        )}
      </List>
    </Box>
  );

  if (transition) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" elevation={0} sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` }, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #E5E9F2', color: 'text.primary' }}>
        <Toolbar>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', bgcolor: alpha('#155E75', 0.06), borderRadius: 2, px: 1.5, py: 0.5, maxWidth: 360 }}>
            <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
            <InputBase placeholder="Rechercher…" sx={{ fontSize: 14, width: '100%' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
            {user.nom} ({user.role.replace('ROLE_', '')})
          </Typography>
          {ROLES_GLOBAUX.includes(user.role) && !userAgence && agences.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 180, mr: 1 }}>
              <InputLabel>Agence</InputLabel>
              <Select
                value={selectedAgenceId}
                label="Agence"
                onChange={e => handleAgenceChange(e.target.value)}
              >
                <MenuItem value="">Toutes les agences</MenuItem>
                {agences.map((ag: any) => (
                  <MenuItem key={ag.id} value={String(ag.id)}>{ag.nom}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <IconButton onClick={handleOpenProfile} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 16 }}>
              {user.nom?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
          </IconButton>
          <NotificationsPopover />
          <IconButton onClick={handleLogout} sx={{ ml: 1 }} title="Déconnexion">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: '1px solid #E5E9F2' } }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, mt: 8, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Routes>
          <Route path="/" element={
            user.role === 'ROLE_ADMIN' ? <AdminSection section="utilisateurs" /> :
            user.role === 'ROLE_CHEF_AGENCE' ? <ManagerDashboard section="kpi" /> :
            user.role === 'ROLE_GESTIONNAIRE' ? <GestionnaireDashboard /> :
            user.role === 'ROLE_CHEF_SAV' ? <ChefSAVDashboard /> :
            user.role === 'ROLE_SUPERVISEUR' ? <SupervisorDashboard /> :
            <DashboardAgent />
          } />
          <Route path="/statistiques" element={
            user.role === 'ROLE_CHARGE_RECLAMATION' ? <AgentDashboard /> : <Navigate to="/" />
          } />
          <Route path="/kpi" element={user.role === 'ROLE_CHEF_AGENCE' ? <ManagerDashboard section="kpi" /> : <Navigate to="/" />} />
          <Route path="/tickets" element={user.role === 'ROLE_CHEF_AGENCE' ? <ManagerDashboard section="tickets" /> : <Navigate to="/" />} />
          <Route path="/escalades" element={user.role === 'ROLE_CHEF_AGENCE' ? <ManagerDashboard section="escalades" /> : <Navigate to="/" />} />
          <Route path="/rapports" element={user.role === 'ROLE_CHEF_AGENCE' ? <ManagerDashboard section="rapports" /> : <Navigate to="/" />} />
          <Route path="/utilisateurs" element={user.role === 'ROLE_ADMIN' ? <AdminSection section="utilisateurs" /> : <Navigate to="/" />} />
          <Route path="/categories-sla" element={user.role === 'ROLE_ADMIN' ? <AdminSection section="categories" /> : <Navigate to="/" />} />
          <Route path="/roles" element={user.role === 'ROLE_ADMIN' ? <AdminSection section="roles" /> : <Navigate to="/" />} />
          <Route path="/agences" element={user.role === 'ROLE_ADMIN' ? <AdminSection section="agences" /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>

      {/* DIALOG PROFIL */}
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#155E75', color: '#fff' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PersonIcon />
            <span>Mon Profil</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {profileData ? (() => {
            const roleLabel = profileData.role === 'ROLE_ADMIN' ? 'Administrateur' : profileData.role === 'ROLE_CHEF_AGENCE' ? 'Chef d\'Agence' : profileData.role === 'ROLE_GESTIONNAIRE' ? 'Gestionnaire' : profileData.role === 'ROLE_SUPERVISEUR' ? 'Superviseur' : profileData.role === 'ROLE_CHARGE_RECLAMATION' ? 'Chargé de Réclamation' : profileData.role === 'ROLE_CHEF_SAV' ? 'Chef SAV' : 'Chargé de Réclamation';
            const roleColor = profileData.role === 'ROLE_ADMIN' ? 'error' : profileData.role === 'ROLE_CHEF_AGENCE' || profileData.role === 'ROLE_GESTIONNAIRE' ? 'primary' : profileData.role === 'ROLE_SUPERVISEUR' || profileData.role === 'ROLE_CHEF_SAV' ? 'secondary' : 'success';
            return (
              <Stack spacing={2}>
                <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: '#155E75', fontSize: 24 }}>
                    {profileData.nom?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{profileData.nom}</Typography>
                    <Typography variant="body2" color="text.secondary">{profileData.email}</Typography>
                    <Chip label={roleLabel} color={roleColor} size="small" sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
                <Stack direction="row" spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">ID</Typography>
                    <Typography variant="body1">#{profileData.id}</Typography>
                  </Box>
                  {profileData.matricule && (
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Matricule</Typography>
                      <Typography variant="body1">{profileData.matricule}</Typography>
                    </Box>
                  )}
                </Stack>
                {profileData.agence && (
                  <Box sx={{ bgcolor: '#f0f7ff', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Agence</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{profileData.agence.nom}</Typography>
                    <Typography variant="body2" color="text.secondary">{profileData.agence.ville}   Code : {profileData.agence.code}</Typography>
                    {profileData.agence.region && <Typography variant="body2" color="text.secondary">Région : {profileData.agence.region}</Typography>}
                  </Box>
                )}
                {profileData.equipeSupport && (
                  <Box sx={{ bgcolor: '#f0fff4', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Équipe de Support</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{profileData.equipeSupport.nom}</Typography>
                    <Typography variant="body2" color="text.secondary">Domaine : {profileData.equipeSupport.domaine}   Niveau : {profileData.equipeSupport.niveau}</Typography>
                  </Box>
                )}
                {profileData.equipeSupervisee && (
                  <Box sx={{ bgcolor: '#fff8f0', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Équipe Supervisée</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{profileData.equipeSupervisee.nom}</Typography>
                    <Typography variant="body2" color="text.secondary">Domaine : {profileData.equipeSupervisee.domaine}</Typography>
                  </Box>
                )}
                {profileData.region && (
                  <Box sx={{ bgcolor: '#f5f0ff', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Direction Régionale</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{profileData.region}</Typography>
                  </Box>
                )}
                {profileData.departement && (
                  <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Département</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{profileData.departement}</Typography>
                  </Box>
                )}
              </Stack>
            );
          })() : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Chargement...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
