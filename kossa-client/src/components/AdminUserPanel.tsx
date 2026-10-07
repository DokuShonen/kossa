import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Container, Typography, Paper, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Stack, Box, Chip, InputAdornment, IconButton, Tooltip,
  Tab, Tabs, Collapse, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import ConfirmDialog from './ConfirmDialog';
import PasswordInput from './PasswordInput';
import api from '../services/api';

interface UserRow {
  id: number;
  nom: string;
  email: string;
  role: string;
  agence?: { id: number; nom: string; ville: string; code: string; region: string } | null;
  equipeSupport?: { id: number; nom: string; niveau: string; domaine: string; description: string } | null;
  region?: string | null;
  departement?: string | null;
  matricule?: string | null;
  niveau?: string | null;
  equipeSupervisee?: { id: number; nom: string; niveau: string; domaine: string } | null;
}

interface EquipeRow {
  id: number;
  nom: string;
  niveau: string;
  domaine: string;
}

interface AgenceRow {
  id: number;
  nom: string;
  ville: string;
  code: string;
}

const REGIONS = ['Centre', 'Ouest', 'Centre-Ouest', 'Est', 'Nord', 'Centre-Nord', 'Sud-Ouest', 'Centre-Est', 'Sahel', 'Boucle du Mouhoun', 'Cascades', 'Plateau-Central', 'Centre-Sud'];

const AdminUserPanel = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [openCreate, setOpenCreate] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [newUser, setNewUser] = useState({
    nom: '', prenom: '', email: '', password: '', role: 'CHARGE_RECLAMATION', equipeSupportId: '', agenceId: '', region: ''
  });
  const [equipes, setEquipes] = useState<EquipeRow[]>([]);
  const [agences, setAgences] = useState<AgenceRow[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; userId: number; userName: string }>({ open: false, userId: 0, userName: '' });

  const [editDialog, setEditDialog] = useState<{ open: boolean; userId: number; userName: string }>({ open: false, userId: 0, userName: '' });
  const [editUser, setEditUser] = useState({ nom: '', prenom: '', email: '', role: '', region: '', agenceId: '', equipeSupportId: '', newPassword: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [profileDialog, setProfileDialog] = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });

  const [quickEquipeDialog, setQuickEquipeDialog] = useState<{
    open: boolean; userId: number; userName: string; currentEquipeId: string; currentEquipeName: string
  }>({ open: false, userId: 0, userName: '', currentEquipeId: '', currentEquipeName: '' });
  const [quickEquipeId, setQuickEquipeId] = useState('');
  const [viewTab, setViewTab] = useState(0);
  const [expandedAgence, setExpandedAgence] = useState<number | null>(null);

  const loadUsers = () => {
    api.get('/admin/users?size=100')
      .then(res => setUsers(res.data.content || res.data))
      .catch(() => setError("Accès refusé. Vous devez être connecté en tant qu'Administrateur."));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    api.get('/admin/users/equipes')
      .then(res => setEquipes(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
    api.get('/admin/users/agences')
      .then(res => setAgences(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  const validerFormulaire = () => {
    const errs: Record<string, string> = {};
    const nom = newUser.nom.trim();
    const prenom = newUser.prenom.trim();
    const email = newUser.email.trim();

    if (!nom) errs.nom = 'Le nom est obligatoire';
    else if (nom.length < 2 || nom.length > 60) errs.nom = 'Le nom doit contenir entre 2 et 60 caractères';
    else if (!/^[\p{L} ' -]+$/u.test(nom)) errs.nom = 'Le nom contient des caractères non autorisés';

    if (prenom && (prenom.length > 60 || !/^[\p{L} ' -]*$/u.test(prenom))) errs.prenom = 'Le prénom contient des caractères non autorisés';

    if (!email) errs.email = "L'adresse email est obligatoire";
    else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) errs.email = "Format d'adresse email invalide";

    if (!newUser.password) errs.password = 'Le mot de passe est obligatoire';
    else if (newUser.password.length < 8) errs.password = 'Le mot de passe doit contenir au moins 8 caractères';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(newUser.password)) errs.password = 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial';

    if (newUser.role === 'CHARGE_RECLAMATION' && !newUser.equipeSupportId) errs.equipeSupportId = "L'équipe de support est obligatoire pour un agent (domaine + niveau)";
    if ((newUser.role === 'CHARGE_RECLAMATION' || newUser.role === 'CHEF_AGENCE' || newUser.role === 'ADMIN' || newUser.role === 'CHEF_SAV') && !newUser.agenceId) errs.agenceId = "L'agence est obligatoire pour ce rôle";
    if (newUser.role === 'CHEF_SAV' && !newUser.region) errs.region = "La direction régionale est obligatoire pour un chef SAV";

    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validerFormulaire()) return;
    const payload = {
      ...newUser,
      equipeSupportId: newUser.role === 'CHARGE_RECLAMATION' && newUser.equipeSupportId ? Number(newUser.equipeSupportId) : null,
      agenceId: (newUser.role === 'CHARGE_RECLAMATION' || newUser.role === 'CHEF_AGENCE' || newUser.role === 'ADMIN' || newUser.role === 'CHEF_SAV') && newUser.agenceId ? Number(newUser.agenceId) : null,
      region: newUser.role === 'CHEF_SAV' ? newUser.region : null
    };
    api.post('/admin/users', payload)
      .then(() => {
        setSuccess("Nouvel utilisateur créé avec succès.");
        setOpenCreate(false);
        setCreateErrors({});
        setNewUser({ nom: '', prenom: '', email: '', password: '', role: 'CHARGE_RECLAMATION', equipeSupportId: '', agenceId: '', region: '' });
        loadUsers();
      })
      .catch((err) => setError("Erreur lors de la création du compte : " + (err.response?.data?.message || "Vérifiez les informations saisies.")));
  };

  const handleDeleteUser = (id: number) => {
    api.delete(`/admin/users/${id}`)
      .then(() => {
        setSuccess("Utilisateur révoqué du système avec succès.");
        loadUsers();
      })
      .catch(() => setError("Impossible de supprimer cet utilisateur."));
  };

  const handleQuickEquipeSubmit = () => {
    const payload = quickEquipeId ? { equipeSupportId: Number(quickEquipeId) } : { equipeSupportId: null };
    api.put(`/admin/users/${quickEquipeDialog.userId}/equipe`, payload)
      .then(() => {
        setSuccess(`Équipe mise à jour pour ${quickEquipeDialog.userName}.`);
        setQuickEquipeDialog({ open: false, userId: 0, userName: '', currentEquipeId: '', currentEquipeName: '' });
        loadUsers();
      })
      .catch((err) => setError("Erreur : " + (err.response?.data?.message || "Impossible de modifier l'équipe.")));
  };

  const validerEdit = () => {
    const errs: Record<string, string> = {};
    const nom = editUser.nom.trim();
    const prenom = editUser.prenom.trim();
    const email = editUser.email.trim();

    if (!nom) errs.nom = 'Le nom est obligatoire';
    else if (nom.length < 2 || nom.length > 60) errs.nom = 'Le nom doit contenir entre 2 et 60 caractères';
    else if (!/^[\p{L} ' -]+$/u.test(nom)) errs.nom = 'Le nom contient des caractères non autorisés';

    if (prenom && (prenom.length > 60 || !/^[\p{L} ' -]*$/u.test(prenom))) errs.prenom = 'Le prénom contient des caractères non autorisés';

    if (!email) errs.email = "L'adresse email est obligatoire";
    else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) errs.email = "Format d'adresse email invalide";

    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEditSubmit = () => {
    if (!validerEdit()) return;
    const payload: any = {
      nom: editUser.nom.trim(),
      prenom: editUser.prenom.trim(),
      email: editUser.email.trim(),
    };
    if (editUser.equipeSupportId) {
      payload.equipeSupportId = Number(editUser.equipeSupportId);
    }
    if (editUser.agenceId) {
      payload.agenceId = Number(editUser.agenceId);
    }
    if (editUser.region) {
      payload.region = editUser.region;
    }
    if (editUser.newPassword) {
      payload.password = editUser.newPassword;
    }
    api.put(`/admin/users/${editDialog.userId}`, payload)
      .then(() => {
        setSuccess(`Informations mises à jour pour ${editDialog.userName}.`);
        setEditDialog({ open: false, userId: 0, userName: '' });
        setEditErrors({});
        loadUsers();
      })
      .catch((err) => setError("Erreur lors de la modification : " + (err.response?.data?.message || "Vérifiez les informations saisies.")));
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'nom', headerName: 'Nom', width: 150, flex: 1, minWidth: 120 },
    { field: 'email', headerName: 'Email', width: 180, flex: 1, minWidth: 140 },
    {
      field: 'role', 
      headerName: 'Rôle', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'ROLE_ADMIN' ? 'Admin' : params.value === 'ROLE_CHEF_AGENCE' ? 'Chef d\'Agence' : params.value === 'ROLE_GESTIONNAIRE' ? 'Gestionnaire' : params.value === 'ROLE_SUPERVISEUR' ? 'Superviseur' : params.value === 'ROLE_CHARGE_RECLAMATION' ? 'Chargé' : params.value === 'ROLE_CHEF_SAV' ? 'Chef SAV' : 'Chargé de Réclamation'} 
          color={params.value === 'ROLE_ADMIN' ? 'error' : params.value === 'ROLE_CHEF_AGENCE' || params.value === 'ROLE_GESTIONNAIRE' ? 'primary' : params.value === 'ROLE_SUPERVISEUR' || params.value === 'ROLE_CHEF_SAV' ? 'secondary' : 'success'} 
          size="small" 
        />
      )
    },
    {
      field: 'agence',
      headerName: 'Agence',
      width: 160,
      renderCell: (params) => {
        const ag = params.row.agence;
        return ag ? (
          <Chip label={`${ag.nom}`} size="small" variant="outlined" icon={<LocationCityIcon />} />
        ) : (
          <Typography variant="caption" color="text.secondary"> </Typography>
        );
      }
    },
    {
      field: 'equipe',
      headerName: 'Équipe',
      width: 180,
      renderCell: (params) => {
        const eq = params.row.equipeSupport;
        return eq ? (
          <Chip label={`${eq.nom} (${eq.domaine})`} size="small" variant="outlined" color="primary" />
        ) : (
          <Typography variant="caption" color="text.secondary"> </Typography>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0}>
          <Tooltip title="Voir profil">
            <IconButton size="small" onClick={() => setProfileDialog({ open: true, user: params.row })}>
              <PersonIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.agence && (
            <Tooltip title={params.row.equipeSupport ? "Changer l'équipe" : "Affecter à une équipe"}>
              <IconButton size="small" color="primary" onClick={() => {
                const row = params.row;
                setQuickEquipeDialog({
                  open: true,
                  userId: row.id,
                  userName: row.nom,
                  currentEquipeId: row.equipeSupport?.id ? String(row.equipeSupport.id) : '',
                  currentEquipeName: row.equipeSupport?.nom || 'Aucune'
                });
              }}>
                <GroupsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Modifier">
            <IconButton size="small" color="primary" onClick={() => {
              const row = params.row;
              const roleSimple = row.role?.replace('ROLE_', '') || '';
              setEditUser({
                nom: row.nom?.split(' ').slice(0, -1).join(' ') || row.nom || '',
                prenom: row.nom?.split(' ').slice(-1)[0] !== row.nom?.split(' ')[0] ? row.nom?.split(' ').slice(-1)[0] : '',
                email: row.email || '',
                role: roleSimple,
                region: row.region || '',
                agenceId: row.agence?.id ? String(row.agence.id) : '',
                equipeSupportId: row.equipeSupport?.id ? String(row.equipeSupport.id) : '',
                newPassword: '',
              });
              setEditErrors({});
              setEditDialog({ open: true, userId: row.id, userName: row.nom });
            }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Révoquer">
            <IconButton size="small" color="error" onClick={() => setConfirmDialog({ open: true, userId: params.row.id, userName: params.row.nom })}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.nom.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  return (
    <Container sx={{ mt: 4 }}>
      <Box className="kossa-banner" sx={{ background: 'linear-gradient(135deg, #0E4557 0%, #155E75 60%, #2C7E99 100%)', borderRadius: 4, p: 3.5, mb: 3, boxShadow: '0 20px 40px rgba(14,69,87,0.35)', border: '1px solid rgba(251,113,133,0.35)' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>
              Administration
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Gestion sécurisée des accès et des profils utilisateurs
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}
            sx={{ bgcolor: '#FB7185', '&:hover': { bgcolor: '#F43F5E' } }}>
            Créer un Utilisateur
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      <TextField
        fullWidth
        size="small"
        placeholder="Rechercher par nom, email ou rôle..."
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setPaginationModel({ ...paginationModel, page: 0 }); }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 2 }}
      />

      <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)} sx={{ mb: 2 }}>
        <Tab label="Liste globale" value={0} />
        <Tab label={`Vue par agence (${agences.length})`} value={1} />
      </Tabs>

      {viewTab === 0 ? (
        <Paper sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25]}
            getRowId={(row) => row.id}
            sx={{ border: 0 }}
          />
        </Paper>
      ) : (
        <Stack spacing={2}>
          {agences.map((ag) => {
            const agenceUsers = filteredUsers.filter(u => u.agence?.id === ag.id);
            const isExpanded = expandedAgence === ag.id;
            if (agenceUsers.length === 0 && searchTerm) return null;
            return (
              <Paper key={ag.id} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{ p: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: isExpanded ? '#e3f2fd' : '#fafafa', '&:hover': { bgcolor: '#e3f2fd' } }}
                  onClick={() => setExpandedAgence(isExpanded ? null : ag.id)}
                >
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <LocationCityIcon color="primary" />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{ag.nom}</Typography>
                      <Typography variant="caption" color="text.secondary">{ag.ville}   {agenceUsers.length} utilisateur{agenceUsers.length > 1 ? 's' : ''}</Typography>
                    </Box>
                  </Stack>
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Box>
                <Collapse in={isExpanded} timeout="auto">
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    {agenceUsers.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>Aucun utilisateur dans cette agence.</Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {agenceUsers.map((u) => (
                          <Paper key={u.id} variant="outlined" sx={{ p: 2 }}>
                            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{u.nom}</Typography>
                                  <Chip
                                    label={u.role === 'ROLE_ADMIN' ? 'Admin' : u.role === 'ROLE_CHEF_AGENCE' ? 'Chef d\'Agence' : u.role === 'ROLE_GESTIONNAIRE' ? 'Gestionnaire' : u.role === 'ROLE_SUPERVISEUR' ? 'Superviseur' : u.role === 'ROLE_CHARGE_RECLAMATION' ? 'Chargé Réclamation' : u.role === 'ROLE_CHEF_SAV' ? 'Chef SAV' : 'Chargé de Réclamation'}
                                    color={u.role === 'ROLE_ADMIN' ? 'error' : u.role === 'ROLE_CHEF_AGENCE' || u.role === 'ROLE_GESTIONNAIRE' ? 'primary' : u.role === 'ROLE_SUPERVISEUR' || u.role === 'ROLE_CHEF_SAV' ? 'secondary' : 'success'}
                                    size="small"
                                  />
                                </Stack>
                                <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                                {u.matricule && <Typography variant="caption" color="text.secondary">Matricule : {u.matricule}</Typography>}
                                {u.equipeSupport && (
                                  <Box sx={{ mt: 1 }}>
                                    <Chip label={`${u.equipeSupport.nom} (${u.equipeSupport.domaine}   Niveau ${u.equipeSupport.niveau})`} size="small" variant="outlined" color="primary" />
                                  </Box>
                                )}
                                {u.region && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Région : {u.region}</Typography>}
                                {u.departement && !u.region && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Département : {u.departement}</Typography>}
                              </Box>
                              <Stack direction="row" spacing={0}>
                                <Tooltip title="Voir profil">
                                  <IconButton size="small" onClick={() => setProfileDialog({ open: true, user: u })}>
                                    <PersonIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Modifier">
                                  <IconButton size="small" color="primary" onClick={() => {
                                    const roleSimple = u.role?.replace('ROLE_', '') || '';
                                    setEditUser({
                                      nom: u.nom?.split(' ').slice(0, -1).join(' ') || u.nom || '',
                                      prenom: u.nom?.split(' ').slice(-1)[0] !== u.nom?.split(' ')[0] ? u.nom?.split(' ').slice(-1)[0] : '',
                                      email: u.email || '',
                                      role: roleSimple,
                                      region: u.region || '',
                                      agenceId: u.agence?.id ? String(u.agence.id) : '',
                                      equipeSupportId: u.equipeSupport?.id ? String(u.equipeSupport.id) : '',
                                      newPassword: '',
                                    });
                                    setEditErrors({});
                                    setEditDialog({ open: true, userId: u.id, userName: u.nom });
                                  }}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
          {(() => {
            const sansAgence = filteredUsers.filter(u => !u.agence);
            if (sansAgence.length === 0) return null;
            const isExpanded = expandedAgence === -1;
            return (
              <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px dashed #ccc' }}>
                <Box
                  sx={{ p: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: isExpanded ? '#fff3e0' : '#fafafa', '&:hover': { bgcolor: '#fff3e0' } }}
                  onClick={() => setExpandedAgence(isExpanded ? null : -1)}
                >
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <PersonIcon sx={{ color: '#FB7185' }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Sans agence (Utilisateurs globaux)</Typography>
                      <Typography variant="caption" color="text.secondary">{sansAgence.length} utilisateur{sansAgence.length > 1 ? 's' : ''}</Typography>
                    </Box>
                  </Stack>
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Box>
                <Collapse in={isExpanded} timeout="auto">
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                      {sansAgence.map((u) => (
                        <Paper key={u.id} variant="outlined" sx={{ p: 2 }}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{u.nom}</Typography>
                                <Chip
                                  label={u.role === 'ROLE_ADMIN' ? 'Admin' : u.role === 'ROLE_CHEF_AGENCE' ? 'Chef d\'Agence' : u.role === 'ROLE_GESTIONNAIRE' ? 'Gestionnaire' : u.role === 'ROLE_SUPERVISEUR' ? 'Superviseur' : u.role === 'ROLE_CHARGE_RECLAMATION' ? 'Chargé Réclamation' : u.role === 'ROLE_CHEF_SAV' ? 'Chef SAV' : 'Chargé de Réclamation'}
                                  color={u.role === 'ROLE_ADMIN' ? 'error' : u.role === 'ROLE_CHEF_AGENCE' || u.role === 'ROLE_GESTIONNAIRE' ? 'primary' : u.role === 'ROLE_SUPERVISEUR' || u.role === 'ROLE_CHEF_SAV' ? 'secondary' : 'success'}
                                  size="small"
                                />
                              </Stack>
                              <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                              {u.matricule && <Typography variant="caption" color="text.secondary">Matricule : {u.matricule}</Typography>}
                              {u.equipeSupport && (
                                <Box sx={{ mt: 1 }}>
                                  <Chip label={`${u.equipeSupport.nom} (${u.equipeSupport.domaine}   Niveau ${u.equipeSupport.niveau})`} size="small" variant="outlined" color="primary" />
                                </Box>
                              )}
                              {u.equipeSupervisee && (
                                <Box sx={{ mt: 1 }}>
                                  <Chip label={`Équipe supervisée : ${u.equipeSupervisee.nom} (${u.equipeSupervisee.domaine})`} size="small" variant="outlined" color="secondary" />
                                </Box>
                              )}
                              {u.region && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Région : {u.region}</Typography>}
                              {u.departement && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Département : {u.departement}</Typography>}
                            </Box>
                            <Stack direction="row" spacing={0}>
                              <Tooltip title="Voir profil">
                                <IconButton size="small" onClick={() => setProfileDialog({ open: true, user: u })}>
                                  <PersonIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Modifier">
                                <IconButton size="small" color="primary" onClick={() => {
                                  const roleSimple = u.role?.replace('ROLE_', '') || '';
                                  setEditUser({
                                    nom: u.nom?.split(' ').slice(0, -1).join(' ') || u.nom || '',
                                    prenom: u.nom?.split(' ').slice(-1)[0] !== u.nom?.split(' ')[0] ? u.nom?.split(' ').slice(-1)[0] : '',
                                    email: u.email || '',
                                    role: roleSimple,
                                    region: u.region || '',
                                    agenceId: u.agence?.id ? String(u.agence.id) : '',
                                    equipeSupportId: u.equipeSupport?.id ? String(u.equipeSupport.id) : '',
                                    newPassword: '',
                                  });
                                  setEditErrors({});
                                  setEditDialog({ open: true, userId: u.id, userName: u.nom });
                                }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                </Collapse>
              </Paper>
            );
          })()}
        </Stack>
      )}

      {/* DIALOG : AJOUT UTILISATEUR */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Ajouter un collaborateur et définir son habilitation</DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField label="Nom" required fullWidth value={newUser.nom} error={!!createErrors.nom} helperText={createErrors.nom} onChange={e => setNewUser({...newUser, nom: e.target.value})} />
                <TextField label="Prénom" required fullWidth value={newUser.prenom} error={!!createErrors.prenom} helperText={createErrors.prenom} onChange={e => setNewUser({...newUser, prenom: e.target.value})} />
              </Stack>
              <TextField label="Email Institutionnel (Login)" type="email" required fullWidth value={newUser.email} error={!!createErrors.email} helperText={createErrors.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              <PasswordInput label="Mot de passe" required fullWidth value={newUser.password} error={!!createErrors.password} helperText={createErrors.password || "8 caractères min. : majuscule, minuscule, chiffre et caractère spécial"} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <FormControl fullWidth required>
                <InputLabel>Rôle & Privilèges</InputLabel>
                <Select value={newUser.role} label="Rôle & Privilèges" onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <MenuItem value="CHARGE_RECLAMATION">Chargé de Réclamation (saisie au guichet)</MenuItem>
                  <MenuItem value="CHEF_AGENCE">Chef d'Agence (supervision agence)</MenuItem>
                  <MenuItem value="CHEF_SAV">Chef SAV (affectation agents SAV)</MenuItem>
                  <MenuItem value="CHEF_AGENCE">Chef d'Agence (supervision agence)</MenuItem>
                  <MenuItem value="GESTIONNAIRE">Gestionnaire (vue globale)</MenuItem>
                  <MenuItem value="SUPERVISEUR">Superviseur (Vue d'activité)</MenuItem>
                  <MenuItem value="ADMIN">Administrateur (Accès complet)</MenuItem>
                </Select>
              </FormControl>
              {(newUser.role === 'CHARGE_RECLAMATION' || newUser.role === 'CHEF_AGENCE' || newUser.role === 'ADMIN' || newUser.role === 'CHEF_SAV') && (
                <FormControl fullWidth required>
                  <InputLabel>Agence de rattachement</InputLabel>
                  <Select value={newUser.agenceId} label="Agence de rattachement" error={!!createErrors.agenceId} onChange={e => setNewUser({...newUser, agenceId: e.target.value})}>
                    <MenuItem value="">  Sélectionner une agence  </MenuItem>
                    {agences.map((ag: AgenceRow) => (
                      <MenuItem key={ag.id} value={String(ag.id)}>{ag.nom} ({ag.ville})</MenuItem>
                    ))}
                  </Select>
                  {createErrors.agenceId && <Typography variant="caption" color="error">{createErrors.agenceId}</Typography>}
                </FormControl>
              )}
              {newUser.role === 'CHEF_SAV' && (
                <FormControl fullWidth required>
                  <InputLabel>Direction Régionale</InputLabel>
                  <Select value={newUser.region} label="Direction Régionale" error={!!createErrors.region} onChange={e => setNewUser({...newUser, region: e.target.value})}>
                    <MenuItem value="">  Sélectionner une direction régionale  </MenuItem>
                    {REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                  {createErrors.region && <Typography variant="caption" color="error">{createErrors.region}</Typography>}
                </FormControl>
              )}
              {newUser.role === 'CHARGE_RECLAMATION' && (
                <FormControl fullWidth required>
                  <InputLabel>Équipe de support (Domaine / Niveau)</InputLabel>
                  <Select value={newUser.equipeSupportId} label="Équipe de support (Domaine / Niveau)" error={!!createErrors.equipeSupportId} onChange={e => setNewUser({...newUser, equipeSupportId: e.target.value})}>
                    <MenuItem value="">  Sélectionner une équipe  </MenuItem>
                    {equipes.map((eq: EquipeRow) => (
                      <MenuItem key={eq.id} value={String(eq.id)}>{eq.nom} ({eq.domaine}   Niveau {eq.niveau})</MenuItem>
                    ))}
                  </Select>
                  {createErrors.equipeSupportId && <Typography variant="caption" color="error">{createErrors.equipeSupportId}</Typography>}
                </FormControl>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="error">Attribuer Privilèges</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        title="Révoquer l'accès"
        message={`Êtes-vous sûr de vouloir révoquer l'accès de "${confirmDialog.userName}" ?`}
        confirmLabel="Révoquer"
        onConfirm={() => handleDeleteUser(confirmDialog.userId)}
        onCancel={() => setConfirmDialog({ open: false, userId: 0, userName: '' })}
      />

      {/* DIALOG : MODIFIER UTILISATEUR (unifié) */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ ...editDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Modifier l'utilisateur</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Compte : <strong>{editDialog.userName}</strong>
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="Nom" required fullWidth value={editUser.nom} error={!!editErrors.nom} helperText={editErrors.nom}
                onChange={e => setEditUser({ ...editUser, nom: e.target.value })} />
              <TextField label="Prénom" fullWidth value={editUser.prenom} error={!!editErrors.prenom} helperText={editErrors.prenom}
                onChange={e => setEditUser({ ...editUser, prenom: e.target.value })} />
            </Stack>
            <TextField label="Email Institutionnel" type="email" required fullWidth value={editUser.email} error={!!editErrors.email} helperText={editErrors.email}
              onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
            {(editUser.role === 'CHARGE_RECLAMATION' || editUser.role === 'CHEF_AGENCE' || editUser.role === 'ADMIN' || editUser.role === 'CHEF_SAV') && (
              <FormControl fullWidth>
                <InputLabel>Agence de rattachement</InputLabel>
                <Select value={editUser.agenceId} label="Agence de rattachement" onChange={e => setEditUser({ ...editUser, agenceId: e.target.value })}>
                  <MenuItem value="">  Sans agence  </MenuItem>
                  {agences.map((ag: AgenceRow) => (
                    <MenuItem key={ag.id} value={String(ag.id)}>{ag.nom} ({ag.ville})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {editUser.role === 'CHEF_SAV' && (
              <FormControl fullWidth>
                <InputLabel>Direction Régionale</InputLabel>
                <Select value={editUser.region} label="Direction Régionale" onChange={e => setEditUser({ ...editUser, region: e.target.value })}>
                  <MenuItem value="">  Sélectionner  </MenuItem>
                  {REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {editUser.role === 'CHARGE_RECLAMATION' && (
              <FormControl fullWidth>
                <InputLabel>Équipe de support</InputLabel>
                <Select value={editUser.equipeSupportId} label="Équipe de support" onChange={e => setEditUser({ ...editUser, equipeSupportId: e.target.value })}>
                  <MenuItem value="">  Sans équipe  </MenuItem>
                  {equipes.map((eq: EquipeRow) => (
                    <MenuItem key={eq.id} value={String(eq.id)}>{eq.nom} ({eq.domaine}   Niveau {eq.niveau})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField label="Nouveau mot de passe (laisser vide pour conserver)" type="password" fullWidth value={editUser.newPassword}
              helperText="Min. 8 car.   majuscule, minuscule, chiffre, caractère spécial"
              onChange={e => setEditUser({ ...editUser, newPassword: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ ...editDialog, open: false })}>Annuler</Button>
          <Button variant="contained" color="primary" onClick={handleEditSubmit}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG : PROFIL UTILISATEUR */}
      <Dialog open={profileDialog.open} onClose={() => setProfileDialog({ open: false, user: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#155E75', color: '#fff' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PersonIcon />
            <span>Fiche Profil Utilisateur</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {profileDialog.user && (() => {
            const u = profileDialog.user;
            const roleLabel = u.role === 'ROLE_ADMIN' ? 'Administrateur' : u.role === 'ROLE_CHEF_AGENCE' ? 'Chef d\'Agence' : u.role === 'ROLE_GESTIONNAIRE' ? 'Gestionnaire' : u.role === 'ROLE_SUPERVISEUR' ? 'Superviseur' : u.role === 'ROLE_CHARGE_RECLAMATION' ? 'Chargé de Réclamation' : u.role === 'ROLE_CHEF_SAV' ? 'Chef SAV' : 'Chargé de Réclamation SAV';
            const roleColor = u.role === 'ROLE_ADMIN' ? 'error' : u.role === 'ROLE_CHEF_AGENCE' || u.role === 'ROLE_GESTIONNAIRE' ? 'primary' : u.role === 'ROLE_SUPERVISEUR' || u.role === 'ROLE_CHEF_SAV' ? 'secondary' : 'success';
            return (
              <Stack spacing={2}>
                <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 2, p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{u.nom}</Typography>
                  <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                  <Chip label={roleLabel} color={roleColor} size="small" sx={{ mt: 1 }} />
                </Box>
                <Stack direction="row" spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">ID Utilisateur</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>#{u.id}</Typography>
                  </Box>
                  {u.matricule && (
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Matricule</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{u.matricule}</Typography>
                    </Box>
                  )}
                  {u.niveau && (
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Niveau Admin</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{u.niveau}</Typography>
                    </Box>
                  )}
                </Stack>
                {u.agence && (
                  <Box sx={{ bgcolor: '#f0f7ff', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Agence</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{u.agence.nom}</Typography>
                    <Typography variant="body2" color="text.secondary">{u.agence.ville}   Code : {u.agence.code}</Typography>
                    {u.agence.region && <Typography variant="body2" color="text.secondary">Région : {u.agence.region}</Typography>}
                  </Box>
                )}
                {u.equipeSupport && (
                  <Box sx={{ bgcolor: '#f0fff4', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Équipe de Support</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{u.equipeSupport.nom}</Typography>
                    <Typography variant="body2" color="text.secondary">Domaine : {u.equipeSupport.domaine}   Niveau : {u.equipeSupport.niveau}</Typography>
                    {u.equipeSupport.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{u.equipeSupport.description}</Typography>}
                  </Box>
                )}
                {u.equipeSupervisee && (
                  <Box sx={{ bgcolor: '#fff8f0', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Équipe Supervisée</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{u.equipeSupervisee.nom}</Typography>
                    <Typography variant="body2" color="text.secondary">Domaine : {u.equipeSupervisee.domaine}   Niveau : {u.equipeSupervisee.niveau}</Typography>
                  </Box>
                )}
                {u.region && (
                  <Box sx={{ bgcolor: '#f5f0ff', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Direction Régionale</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{u.region}</Typography>
                  </Box>
                )}
                {u.departement && !u.region && (
                  <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Département</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{u.departement}</Typography>
                  </Box>
                )}
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialog({ open: false, user: null })}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG : AFFECTATION RAPIDE D'ÉQUIPE */}
      <Dialog open={quickEquipeDialog.open} onClose={() => setQuickEquipeDialog({ ...quickEquipeDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <GroupsIcon />
            <span>Affecter à une équipe</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Chargé de Réclamation : <strong>{quickEquipeDialog.userName}</strong>   Équipe actuelle : <strong>{quickEquipeDialog.currentEquipeName}</strong>
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Nouvelle équipe de support</InputLabel>
            <Select
              value={quickEquipeId}
              label="Nouvelle équipe de support"
              onChange={(e) => setQuickEquipeId(e.target.value)}
            >
              <MenuItem value="">  Retirer de l'équipe  </MenuItem>
              {equipes.map((eq: EquipeRow) => (
                <MenuItem key={eq.id} value={String(eq.id)}>{eq.nom} ({eq.domaine}   Niveau {eq.niveau})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickEquipeDialog({ ...quickEquipeDialog, open: false })}>Annuler</Button>
          <Button variant="contained" color="primary" onClick={handleQuickEquipeSubmit}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUserPanel;
