import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography, Grid, Paper, Box, Stack, Chip, Alert, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../services/api';

const STATUT_COLORS: Record<string, string> = {
  OUVERT: '#1e88e5', ASSIGNE_SISAV: '#e91e63', ASSIGNE: '#ff9800', EN_COURS: '#ab47bc',
  EN_TRAITEMENT: '#ab47bc', RESOLU: '#4caf50', CLOTURE: '#757575', REGULARISEE: '#00897b',
  ESCALADE_N1: '#f44336', ESCALADE_N2: '#d32f2f', REOUVERT: '#00897b',
};

interface TicketRow {
  id: number; reference: string; type: string; domaine?: string; priorite: string;
  statut: string; dateCreation?: string; description?: string;
  client?: { nom: string; prenom: string; msisdn: string };
  agence?: { nom: string } | null;
  agent?: { nom: string } | null;
  chefSisav?: { nom: string } | null;
  commentaires?: any[];
}

const ChefSAVDashboard = () => {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [agentsSav, setAgentsSav] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTicket, setAssignTicket] = useState<TicketRow | null>(null);
  const [agentEmail, setAgentEmail] = useState('');
  const [avis, setAvis] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TicketRow | null>(null);

  const load = useCallback(() => {
    api.get('/manager/reclamations?size=500').then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.content || []);
      setTickets(data);
    }).catch(() => showMessage('error', "Impossible de charger les réclamations du SISAV."));
  }, []);

  useEffect(() => {
    load();
    api.get('/manager/agents-sav').then(res => {
      setAgentsSav(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, [load]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const ouvrirAssignation = (t: TicketRow) => {
    setAssignTicket(t);
    setAgentEmail('');
    setAvis('');
    const domaine = t.domaine || (t.type === 'Mobile Money' ? 'MOBILE_MONEY' : t.type === 'FTTH' ? 'FTTH' : t.type === 'Internet' ? 'INTERNET' : 'MOBILE_MONEY');
    api.get(`/manager/agents?domaine=${domaine}&niveau=N1`).then(res => {
      const liste = Array.isArray(res.data) ? res.data : (res.data.content || []);
      setAgentsSav(liste);
    }).catch(() => {});
    setAssignOpen(true);
  };

  const confirmerAssignation = () => {
    if (!assignTicket || !agentEmail) {
      showMessage('error', 'Veuillez sélectionner l\'agent support SAV destinataire.');
      return;
    }
    api.put(`/manager/reclamations/${assignTicket.id}/affecter-agent-sav`, { agentEmail, avis })
      .then(() => {
        showMessage('success', `Réclamation ${assignTicket.reference} affectée à l'agent SAV.`);
        setAssignOpen(false);
        load();
      })
      .catch((err) => showMessage('error', err.response?.data?.message || "Échec de l'affectation à l'agent SAV."));
  };

  const voirDetail = (t: TicketRow) => {
    api.get(`/manager/reclamations/${t.id}`).then(res => {
      setDetailTicket(res.data);
      setDetailOpen(true);
    }).catch(() => showMessage('error', "Impossible de charger le détail."));
  };

  const enAttente = tickets.filter(t => t.statut === 'ASSIGNE_SISAV').length;
  const enCours = tickets.filter(t => ['ASSIGNE', 'EN_COURS', 'EN_TRAITEMENT'].includes(t.statut)).length;
  const resolues = tickets.filter(t => ['RESOLU', 'REGULARISEE', 'CLOTURE'].includes(t.statut)).length;

  const cards = [
    { label: 'En attente d\'affectation (SISAV)', value: enAttente, color: '#e91e63' },
    { label: 'En cours chez les agents SAV', value: enCours, color: '#FB7185' },
    { label: 'Résolues / Clôturées', value: resolues, color: '#4caf50' },
    { label: 'Total SISAV', value: tickets.length, color: '#155E75' },
  ];

  return (
    <Box sx={{ mt: 0 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #7b1fa2 0%, #4a0072 100%)', borderRadius: 3, p: 3, mb: 3, boxShadow: '0 4px 20px rgba(123,31,162,0.3)' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
              Tableau de Bord   Chef SISAV
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Réclamations transmises au SISAV par les chefs d'agence de votre direction régionale. Vous les affectez à un agent support SAV avec votre avis.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}
            sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}>
            Actualiser
          </Button>
        </Stack>
      </Box>

      {message && <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map(c => (
          <Grid size={{ xs: 6, md: 3 }} key={c.label}>
            <Paper sx={{ p: 2, textAlign: 'center', borderTop: `4px solid ${c.color}` }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: c.color }}>{c.value}</Typography>
              <Typography variant="body2" color="text.secondary">{c.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2, borderRadius: 3, overflow: 'hidden' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
          <Typography variant="h6" sx={{ flex: 1 }}>Réclamations du SISAV</Typography>
          <TextField size="small" placeholder="Rechercher (référence, client, type...)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} sx={{ minWidth: 280 }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select value={filtreStatut} label="Statut" onChange={e => setFiltreStatut(e.target.value)}>
              <MenuItem value="">Tous</MenuItem>
              {Object.keys(STATUT_COLORS).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
        {tickets.length === 0 && <Typography color="text.secondary">Aucune réclamation transmise au SISAV pour le moment.</Typography>}
        <TableContainer>
          <Table sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#4a0072', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5, borderTopLeftRadius: 8 }}>Référence</TableCell>
                <TableCell sx={{ bgcolor: '#4a0072', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Client</TableCell>
                <TableCell sx={{ bgcolor: '#4a0072', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Agence</TableCell>
                <TableCell sx={{ bgcolor: '#4a0072', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Type</TableCell>
                <TableCell sx={{ bgcolor: '#4a0072', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Priorité</TableCell>
                <TableCell sx={{ bgcolor: '#4a0072', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Statut</TableCell>
                <TableCell sx={{ bgcolor: '#4a0072', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Agent SAV</TableCell>
                <TableCell sx={{ bgcolor: '#4a0072', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5, textAlign: 'center', borderTopRightRadius: 8 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...tickets]
                .filter(t => !filtreStatut || t.statut === filtreStatut)
                .filter(t => !searchTerm || 
                  t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.client?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.agence?.nom?.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a: any, b: any) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
                .map(t => (
                <TableRow key={t.id} hover>
                  <TableCell><strong>{t.reference}</strong></TableCell>
                  <TableCell>{t.client?.nom} {t.client?.prenom}</TableCell>
                  <TableCell>{t.agence?.nom || ' '}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>
                    <Chip label={t.priorite} size="small" color={t.priorite === 'CRITIQUE' ? 'error' : t.priorite === 'MOYENNE' ? 'warning' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip label={t.statut} size="small" sx={{ bgcolor: STATUT_COLORS[t.statut] || '#607d8b', color: '#fff' }} />
                  </TableCell>
                  <TableCell>{t.agent?.nom || ' '}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Voir détail"><IconButton size="small" onClick={() => voirDetail(t)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                      {t.statut === 'ASSIGNE_SISAV' && (
                        <Tooltip title="Affecter à un agent SAV"><IconButton size="small" color="secondary" onClick={() => ouvrirAssignation(t)}><AssignmentIndIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* DIALOG : AFFECTATION À UN CHARGÉ DE RÉCLAMATION SAV */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Affecter {assignTicket?.reference} à un chargé de réclamation SAV</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              La réclamation passera au statut <strong>ASSIGNE</strong>. L'agent SAV pourra la traiter (avis, commentaires, statuts).
            </Alert>
            <FormControl fullWidth required>
              <InputLabel>Agent support SAV</InputLabel>
              <Select value={agentEmail} label="Agent support SAV" onChange={e => setAgentEmail(e.target.value)}>
                {agentsSav.length === 0 && <MenuItem value="">  Aucun agent SAV disponible  </MenuItem>}
                {agentsSav.map((a: any) => (
                  <MenuItem key={a.email} value={a.email}>
                    {a.nom} ({a.equipe || 'équipe non définie'}   {a.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Avis / Commentaires du chef SISAV"
              multiline rows={3}
              fullWidth
              value={avis}
              onChange={e => setAvis(e.target.value)}
              placeholder="Votre avis, consignes de traitement, remarques à transmettre à l'agent SAV..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Annuler</Button>
          <Button variant="contained" color="secondary" onClick={confirmerAssignation} disabled={!agentEmail}>Affecter à l'agent SAV</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG : DÉTAIL */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détail de {detailTicket?.reference}</DialogTitle>
        <DialogContent dividers>
          {detailTicket && (
            <Stack spacing={1.5}>
              <Typography><strong>Client :</strong> {detailTicket.client?.nom} {detailTicket.client?.prenom}   {detailTicket.client?.msisdn}</Typography>
              <Typography><strong>Agence :</strong> {detailTicket.agence?.nom || ' '} · <strong>Type :</strong> {detailTicket.type}</Typography>
              <Typography><strong>Priorité :</strong> {detailTicket.priorite} · <strong>Statut :</strong> {detailTicket.statut}</Typography>
              <Typography><strong>Description :</strong> {detailTicket.description}</Typography>
              {detailTicket.commentaires && detailTicket.commentaires.length > 0 && (
                <Box>
                  <Typography variant="subtitle2">Historique</Typography>
                  {[...detailTicket.commentaires].sort((a: any, b: any) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime()).map((c: any) => (
                    <Typography key={c.id} variant="body2" sx={{ borderLeft: '3px solid #7b1fa2', pl: 1, my: 0.5 }}>
                      <strong>{c.auteur}</strong>   {new Date(c.dateAction).toLocaleString('fr-FR')} : {c.contenu}
                    </Typography>
                  ))}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChefSAVDashboard;
