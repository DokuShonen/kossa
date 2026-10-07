import React, { useEffect, useState } from 'react';
import {
  Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, IconButton, Tooltip, Chip,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import api from '../services/api';

interface Agence {
  id: number;
  nom: string;
  ville: string;
  code: string;
  region: string;
}

const AgencesPanel = () => {
  const [agences, setAgences] = useState<Agence[]>([]);
  const [open, setOpen] = useState(false);
  const [editAgence, setEditAgence] = useState<Agence | null>(null);
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [code, setCode] = useState('');
  const [region, setRegion] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAgence, setDetailAgence] = useState<Agence | null>(null);
  const [usersAgence, setUsersAgence] = useState<any[]>([]);

  const chargerAgences = () => {
    api.get('/admin/users/agences').then(res => setAgences(res.data || [])).catch(() => {});
  };

  useEffect(() => { chargerAgences(); }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const genererCode = (nomAgence: string) => {
    const prefix = nomAgence.replace(/[^a-zA-ZÀ-ÿ]/g, '').substring(0, 3).toUpperCase();
    const suffix = String(Date.now() % 1000).padStart(3, '0');
    return `${prefix}-${suffix}`;
  };

  const ouvrirCreation = () => {
    setEditAgence(null);
    setNom(''); setVille(''); setCode(''); setRegion('');
    setOpen(true);
  };

  const ouvrirModification = (a: Agence) => {
    setEditAgence(a);
    setNom(a.nom); setVille(a.ville || ''); setCode(a.code || ''); setRegion(a.region || '');
    setOpen(true);
  };

  const handleSauvegarder = () => {
    if (!nom.trim()) return;
    const nomExiste = agences.some(a => a.nom.toLowerCase() === nom.trim().toLowerCase() && (!editAgence || a.id !== editAgence.id));
    if (nomExiste) {
      showMessage('error', `Une agence "${nom.trim()}" existe déjà.`);
      return;
    }
    const data = { nom: nom.trim(), ville: ville.trim(), code: code.trim(), region: region.trim() };
    const req = editAgence
      ? api.put(`/admin/users/agences/${editAgence.id}`, data)
      : api.post('/admin/users/agences', data);
    req.then(() => {
      showMessage('success', editAgence ? `Agence "${nom}" modifiée` : `Agence "${nom}" créée`);
      setOpen(false);
      chargerAgences();
    }).catch(err => {
      showMessage('error', err.response?.data || "Erreur");
    });
  };

  const handleSupprimer = (agence: Agence) => {
    if (!window.confirm(`Supprimer l'agence "${agence.nom}" ?`)) return;
    api.delete(`/admin/users/agences/${agence.id}`)
      .then(() => {
        showMessage('success', `Agence "${agence.nom}" supprimée`);
        chargerAgences();
      })
      .catch(err => {
        showMessage('error', err.response?.data || "Erreur lors de la suppression");
      });
  };

  const voirUtilisateurs = (a: Agence) => {
    setDetailAgence(a);
    api.get(`/admin/users?size=200`, { headers: { 'X-Agence-Id': String(a.id) } })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.content || []);
        setUsersAgence(data.filter((u: any) => u.agence?.id === a.id));
      })
      .catch(() => setUsersAgence([]));
    setDetailOpen(true);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <LocationCityIcon color="primary" />
          <Typography variant="h6">Gestion des Agences</Typography>
          <Chip label={agences.length} size="small" color="primary" />
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={ouvrirCreation}>
          Nouvelle Agence
        </Button>
      </Stack>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#004d40' }}>
              <TableCell sx={{ color: '#fff', width: 50 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff' }}>Nom</TableCell>
              <TableCell sx={{ color: '#fff' }}>Ville</TableCell>
              <TableCell sx={{ color: '#fff' }}>Code</TableCell>
              <TableCell sx={{ color: '#fff' }}>Région</TableCell>
              <TableCell sx={{ color: '#fff', width: 140 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agences.map(a => (
              <TableRow key={a.id} hover>
                <TableCell>{a.id}</TableCell>
                <TableCell><strong>{a.nom}</strong></TableCell>
                <TableCell>{a.ville || ' '}</TableCell>
                <TableCell><Chip label={a.code || ' '} size="small" variant="outlined" /></TableCell>
                <TableCell>{a.region || ' '}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Voir les utilisateurs"><IconButton size="small" color="primary" onClick={() => voirUtilisateurs(a)}><PeopleIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Modifier"><IconButton size="small" color="secondary" onClick={() => ouvrirModification(a)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => handleSupprimer(a)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {agences.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucune agence enregistrée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogue Créer / Modifier */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#155E75', color: '#fff', fontWeight: 'bold' }}>
          {editAgence ? 'Modifier l\'agence' : 'Nouvelle Agence'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <TextField label="Nom de l'agence" required fullWidth value={nom} onChange={e => {
              setNom(e.target.value);
              if (!editAgence) setCode(genererCode(e.target.value));
            }} />
            <FormControl fullWidth>
              <InputLabel>Région</InputLabel>
              <Select value={region} label="Région" onChange={e => setRegion(e.target.value)}>
                <MenuItem value="Centre">Centre</MenuItem>
                <MenuItem value="Ouest">Ouest</MenuItem>
                <MenuItem value="Centre-Ouest">Centre-Ouest</MenuItem>
                <MenuItem value="Est">Est</MenuItem>
                <MenuItem value="Nord">Nord</MenuItem>
                <MenuItem value="Centre-Nord">Centre-Nord</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Ville" fullWidth value={ville} onChange={e => setVille(e.target.value)} />
            <TextField label="Code (auto-généré)" fullWidth value={code} onChange={editAgence ? e => setCode(e.target.value) : undefined} slotProps={{ input: { readOnly: !editAgence } }} helperText={editAgence ? "Modifiable manuellement" : "Généré automatiquement depuis le nom"} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSauvegarder} disabled={!nom.trim()}>
            {editAgence ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue Détail utilisateurs */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#155E75', color: '#fff' }}>
          Utilisateurs de « {detailAgence?.nom} »
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {usersAgence.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>Aucun utilisateur dans cette agence</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Équipe</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersAgence.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.nom} {u.prenom || ''}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Chip label={u.role?.replace('ROLE_', '')} size="small" color={
                          u.role === 'ROLE_ADMIN' ? 'error' :
                          u.role === 'ROLE_CHEF_AGENCE' ? 'primary' :
                          u.role === 'ROLE_CHEF_SAV' ? 'secondary' :
                          u.role === 'ROLE_CHARGE_RECLAMATION' ? 'success' : 'default'
                        } />
                      </TableCell>
                      <TableCell>{u.equipeSupport?.nom || ' '}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AgencesPanel;
