import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Container, Typography, Paper, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, Box, Chip, IconButton, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from './ConfirmDialog';
import api from '../services/api';

interface RoleRow { id: number; code: string; libelle: string; profil: string; niveau: string; description: string }

const RolesPanel = () => {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editRoleId, setEditRoleId] = useState<number | null>(null);
  const [roleForm, setRoleForm] = useState({ code: '', libelle: '', profil: 'CHARGE_RECLAMATION', niveau: '', description: '' });

  const [confirmRole, setConfirmRole] = useState<{ open: boolean; id: number; message: string }>({ open: false, id: 0, message: '' });

  const extraireContenu = (res: any) => Array.isArray(res.data) ? res.data : (res.data.content || []);

  const loadRoles = () => api.get('/admin/config/roles?size=100')
    .then(res => setRoles(extraireContenu(res)))
    .catch(() => setError("Accès refusé pour le chargement des rôles."));

  useEffect(() => {
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.code.trim() || !roleForm.libelle.trim()) { setError("Le code et le libellé du rôle sont obligatoires."); return; }
    const payload = {
      code: roleForm.code.trim().toUpperCase(),
      libelle: roleForm.libelle.trim(),
      profil: roleForm.profil,
      niveau: roleForm.niveau,
      description: roleForm.description.trim()
    };
    const req = editRoleId
      ? api.put(`/admin/config/roles/${editRoleId}`, payload)
      : api.post('/admin/config/roles', payload);
    req.then(() => {
      setSuccess(editRoleId ? "Rôle mis à jour." : "Rôle créé avec succès.");
      setOpenDialog(false); setEditRoleId(null);
      setRoleForm({ code: '', libelle: '', profil: 'CHARGE_RECLAMATION', niveau: '', description: '' });
      loadRoles();
    }).catch((err) => setError(err.response?.data?.message || "Erreur lors de l'enregistrement du rôle."));
  };

  const handleDelete = (id: number) => {
    api.delete(`/admin/config/roles/${id}`)
      .then(() => { setSuccess("Rôle supprimé."); loadRoles(); })
      .catch((err) => setError(err.response?.data?.message || "Impossible de supprimer ce rôle."));
  };

  const colonnes: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'code', headerName: 'Code', width: 200 },
    { field: 'libelle', headerName: 'Libellé', width: 220 },
    {
      field: 'profil', headerName: 'Profil', width: 110,
      renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'ADMIN' ? 'error' : params.value === 'CHEF_AGENCE' ? 'warning' : 'primary'} />
    },
    { field: 'niveau', headerName: 'Niveau', width: 110 },
    { field: 'description', headerName: 'Description', width: 300 },
    {
      field: 'actions', headerName: 'Actions', width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" color="primary" onClick={() => {
            setEditRoleId(params.row.id);
            setRoleForm({ code: params.row.code, libelle: params.row.libelle, profil: params.row.profil || '', niveau: params.row.niveau || '', description: params.row.description || '' });
            setOpenDialog(true);
          }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => setConfirmRole({ open: true, id: params.row.id, message: `Supprimer le rôle "${params.row.libelle}" ?` })}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Box className="kossa-banner" sx={{ background: 'linear-gradient(135deg, #0E4557 0%, #155E75 60%, #2C7E99 100%)', borderRadius: 4, p: 3.5, mb: 3, boxShadow: '0 20px 40px rgba(14,69,87,0.35)', border: '1px solid rgba(251,113,133,0.35)' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
          Rôles du référentiel
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
          Gestion des rôles métier (Chargé de réclamation N1/N2, Chef d'agence, Gestionnaire...)
        </Typography>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Liste des rôles</Typography>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#FB7185', '&:hover': { bgcolor: '#F43F5E' } }}
            onClick={() => { setEditRoleId(null); setRoleForm({ code: '', libelle: '', profil: 'CHARGE_RECLAMATION', niveau: '', description: '' }); setOpenDialog(true); }}>
            Ajouter un rôle
          </Button>
        </Stack>
        <Box sx={{ height: 420 }}>
          <DataGrid rows={roles} columns={colonnes} disableRowSelectionOnClick pageSizeOptions={[5, 10, 25]} getRowId={(r) => r.id} />
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editRoleId ? "Modifier le rôle" : "Nouveau rôle"}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField label="Code (ex: ROLE_CHEF_AGENCE)" fullWidth value={roleForm.code} onChange={e => setRoleForm({ ...roleForm, code: e.target.value })} />
              <TextField label="Libellé" required fullWidth value={roleForm.libelle} onChange={e => setRoleForm({ ...roleForm, libelle: e.target.value })} />
              <TextField select label="Profil" fullWidth value={roleForm.profil} onChange={e => setRoleForm({ ...roleForm, profil: e.target.value })}>
                <MenuItem value="CHARGE_RECLAMATION">CHARGE_RECLAMATION</MenuItem>
                <MenuItem value="CHEF_AGENCE">CHEF_AGENCE</MenuItem>
                <MenuItem value="SUPERVISEUR">SUPERVISEUR</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </TextField>
              <TextField label="Niveau" placeholder="Ex: AGENCE, N1, N2, SAV, CENTRAL" fullWidth value={roleForm.niveau} onChange={e => setRoleForm({ ...roleForm, niveau: e.target.value })} />
              <TextField label="Description" multiline minRows={2} fullWidth value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="error">Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmRole.open}
        title="Supprimer le rôle"
        message={confirmRole.message}
        onConfirm={() => { handleDelete(confirmRole.id); setConfirmRole({ open: false, id: 0, message: '' }); }}
        onCancel={() => setConfirmRole(prev => ({ ...prev, open: false }))}
      />
    </Container>
  );
};

export default RolesPanel;
