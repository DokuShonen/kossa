import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Container, Typography, Paper, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Stack, Box, Chip, IconButton, Tooltip, InputAdornment
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';

interface EquipeRow {
  id: number;
  nom: string;
  niveau: string;
  domaine: string;
  description?: string;
}

interface UserRow {
  id: number;
  nom: string;
  email: string;
  role: string;
  equipeSupport?: { id: number; nom: string } | null;
}

const DOMAIN_COLORS: Record<string, string> = {
  'MOBILE_MONEY': '#FB7185',
  'FTTH': '#155E75',
  'INTERNET': '#00A651',
  'TECHNIQUE': '#8B5CF6',
  'FACTURATION': '#E11D48',
};

const EquipesPanel = () => {
  const [equipes, setEquipes] = useState<EquipeRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const [openMembers, setOpenMembers] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState<EquipeRow | null>(null);
  const [members, setMembers] = useState<UserRow[]>([]);

  const [openAddMember, setOpenAddMember] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    api.get('/admin/users/equipes')
      .then(res => setEquipes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Erreur lors du chargement des équipes."));
    api.get('/admin/users?size=200')
      .then(res => setUsers(res.data.content || res.data))
      .catch(() => {});
  };

  const getMembersForEquipe = (equipeId: number): UserRow[] => {
    return users.filter(u => u.equipeSupport?.id === equipeId);
  };

  const openMembersDialog = (equipe: EquipeRow) => {
    setSelectedEquipe(equipe);
    setMembers(getMembersForEquipe(equipe.id));
    setOpenMembers(true);
  };

  const handleAddMember = () => {
    if (!addMemberUserId || !selectedEquipe) return;
    api.put(`/admin/users/${addMemberUserId}/equipe`, { equipeSupportId: selectedEquipe.id })
      .then(() => {
        setSuccess("Agent ajouté à l'équipe avec succès.");
        setOpenAddMember(false);
        setAddMemberUserId('');
        loadData();
        if (selectedEquipe) {
          setMembers(getMembersForEquipe(selectedEquipe.id));
        }
      })
      .catch((err) => setError("Erreur : " + (err.response?.data?.message || "Impossible d'ajouter l'agent.")));
  };

  const handleRemoveMember = (userId: number) => {
    api.put(`/admin/users/${userId}/equipe`, { equipeSupportId: null })
      .then(() => {
        setSuccess("Agent retiré de l'équipe.");
        loadData();
        if (selectedEquipe) {
          setMembers(getMembersForEquipe(selectedEquipe.id));
        }
      })
      .catch((err) => setError("Erreur : " + (err.response?.data?.message || "Impossible de retirer l'agent.")));
  };

  const getAvailableAgents = (): UserRow[] => {
    return users.filter(u =>
      u.role === 'ROLE_CHARGE_RECLAMATION' && u.equipeSupport?.id !== selectedEquipe?.id
    );
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    {
      field: 'domaine',
      headerName: 'Domaine',
      width: 140,
      renderCell: (params) => {
        const color = DOMAIN_COLORS[params.value] || '#6B7280';
        return (
          <Chip label={params.value} size="small" sx={{ bgcolor: color, color: '#fff', fontWeight: 600 }} />
        );
      }
    },
    { field: 'nom', headerName: 'Nom', width: 200, flex: 1 },
    { field: 'niveau', headerName: 'Niveau', width: 80 },
    {
      field: 'membres',
      headerName: 'Membres',
      width: 100,
      renderCell: (params) => {
        const count = getMembersForEquipe(params.row.id).length;
        return <Chip label={`${count} agent${count > 1 ? 's' : ''}`} size="small" variant="outlined" />;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0}>
          <Tooltip title="Voir les membres">
            <IconButton size="small" color="primary" onClick={() => openMembersDialog(params.row)}>
              <GroupsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ajouter un agent">
            <IconButton size="small" color="success" onClick={() => {
              setSelectedEquipe(params.row);
              setOpenAddMember(true);
            }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  const filteredEquipes = equipes.filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      e.nom.toLowerCase().includes(term) ||
      e.domaine.toLowerCase().includes(term) ||
      (e.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <Container sx={{ mt: 4 }}>
      <Box className="kossa-banner" sx={{ background: 'linear-gradient(135deg, #0E4557 0%, #155E75 60%, #2C7E99 100%)', borderRadius: 4, p: 3.5, mb: 3, boxShadow: '0 20px 40px rgba(14,69,87,0.35)', border: '1px solid rgba(251,113,133,0.35)' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>
              Équipes de Support
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Gestion des équipes et de leurs membres
            </Typography>
          </Box>
        </Stack>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      <TextField
        fullWidth
        size="small"
        placeholder="Rechercher par nom, domaine ou description..."
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setPaginationModel({ ...paginationModel, page: 0 }); }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 2 }}
      />

      <Paper sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={filteredEquipes}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25]}
          getRowId={(row) => row.id}
          sx={{ border: 0 }}
        />
      </Paper>

      {/* DIALOG : MEMBRES DE L'ÉQUIPE */}
      <Dialog open={openMembers} onClose={() => setOpenMembers(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <GroupsIcon />
            <span>Membres de l'équipe : {selectedEquipe?.nom}</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Domaine : <strong>{selectedEquipe?.domaine}</strong>   Niveau : <strong>{selectedEquipe?.niveau}</strong>
          </Typography>
          {members.length === 0 ? (
            <Alert severity="info">Aucun agent dans cette équipe.</Alert>
          ) : (
            <Paper sx={{ height: 300, width: '100%' }}>
              <DataGrid
                rows={members}
                columns={[
                  { field: 'id', headerName: 'ID', width: 50 },
                  { field: 'nom', headerName: 'Nom', width: 200, flex: 1 },
                  { field: 'email', headerName: 'Email', width: 200, flex: 1 },
                  {
                    field: 'actions',
                    headerName: 'Retirer',
                    width: 80,
                    sortable: false,
                    renderCell: (params) => (
                      <Tooltip title="Retirer de l'équipe">
                        <IconButton size="small" color="error" onClick={() => handleRemoveMember(params.row.id)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                ]}
                getRowId={(row) => row.id}
                sx={{ border: 0 }}
              />
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMembers(false)}>Fermer</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAddMember(true)}>
            Ajouter un agent
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG : AJOUTER UN CHARGÉ DE RÉCLAMATION À L'ÉQUIPE */}
      <Dialog open={openAddMember} onClose={() => setOpenAddMember(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Ajouter un agent à l'équipe : {selectedEquipe?.nom}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sélectionnez un agent à ajouter à cette équipe.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Agent</InputLabel>
            <Select
              value={addMemberUserId}
              label="Agent"
              onChange={(e) => setAddMemberUserId(e.target.value)}
            >
              <MenuItem value="">  Sélectionner un agent  </MenuItem>
              {getAvailableAgents().map((agent) => (
                <MenuItem key={agent.id} value={String(agent.id)}>
                  {agent.nom} ({agent.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenAddMember(false); setAddMemberUserId(''); }}>Annuler</Button>
          <Button variant="contained" color="primary" onClick={handleAddMember} disabled={!addMemberUserId}>
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EquipesPanel;
