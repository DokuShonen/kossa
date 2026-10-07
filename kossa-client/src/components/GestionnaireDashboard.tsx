import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography, Grid, Paper, Box, Stack, Chip, Alert, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement);

const STATUT_COLORS: Record<string, string> = {
  OUVERT: '#1e88e5', ASSIGNE_SISAV: '#e91e63', ASSIGNE: '#ff9800', EN_COURS: '#ab47bc',
  EN_TRAITEMENT: '#ab47bc', RESOLU: '#4caf50', CLOTURE: '#757575', REGULARISEE: '#00897b',
  ESCALADE_N1: '#f44336', ESCALADE_N2: '#d32f2f', REOUVERT: '#00897b',
};

interface TicketRow {
  id: number; reference: string; type: string; domaine?: string; priorite: string;
  statut: string; dateCreation?: string; description?: string;
  client?: { nom: string; prenom: string; msisdn: string };
  agence?: { id: number; nom: string } | null;
  agent?: { nom: string } | null;
  chefSisav?: { nom: string } | null;
}

const GestionnaireDashboard = () => {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [parAgence, setParAgence] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreAgence, setFiltreAgence] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TicketRow | null>(null);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTicket, setTransferTicket] = useState<TicketRow | null>(null);
  const [transferAgenceId, setTransferAgenceId] = useState('');
  const [transferMsg, setTransferMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.get('/stats/global'),
      api.get('/manager/reclamations?size=500'),
      api.get('/manager/stats-par-agence'),
    ]).then(([statsRes, ticketsRes, agenceRes]) => {
      setStats(statsRes.data);
      const data = Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data.content || []);
      setTickets(data);
      setParAgence(Array.isArray(agenceRes.data) ? agenceRes.data : []);
    }).catch(() => setError("Impossible de charger les données consolidées."));
  }, []);

  useEffect(() => { load(); }, [load]);

  const ouvrirTransfert = (t: TicketRow) => {
    setTransferTicket(t);
    setTransferAgenceId('');
    setTransferMsg(null);
    setTransferOpen(true);
  };

  const confirmerTransfert = () => {
    if (!transferTicket || !transferAgenceId) return;
    api.put(`/manager/reclamations/${transferTicket.id}/transferer-agence`, { agenceId: transferAgenceId })
      .then(() => {
        setTransferMsg("Dossier transféré avec succès.");
        setTransferOpen(false);
        load();
      })
      .catch(err => setTransferMsg(err.response?.data?.message || err.message || "Échec du transfert."));
  };

  const filtres = tickets.filter(t => {
    if (filtreStatut && t.statut !== filtreStatut) return false;
    if (filtreAgence && (t.agence?.nom || 'Sans agence') !== filtreAgence) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!t.reference?.toLowerCase().includes(term) &&
          !t.client?.nom?.toLowerCase().includes(term) &&
          !t.client?.msisdn?.toLowerCase().includes(term)) return false;
    }
    return true;
  }).sort((a: any, b: any) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());

  const agences = Array.from(new Set(tickets.map(t => t.agence?.nom || 'Sans agence')));

  const agencesListe = Array.from(new Map(
    tickets.filter(t => t.agence).map(t => [t.agence!.id, t.agence!])
  ).values());

  const statutData = {
    labels: Object.keys(stats?.parStatut || {}),
    datasets: [{ label: 'Réclamations', data: Object.values(stats?.parStatut || {}), backgroundColor: ['#1e88e5', '#4caf50', '#ffb300', '#f44336', '#ab47bc', '#757575', '#e91e63'] }]
  };

  const agenceData = {
    labels: parAgence.map(p => p.agence),
    datasets: [{ label: 'Réclamations par agence', data: parAgence.map(p => p.total), backgroundColor: '#155E75' }]
  };

  if (error && !stats) return <Box sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Box>;

  const total = stats?.total || 0;
  const enCours = tickets.filter(t => ['OUVERT', 'ASSIGNE_SISAV', 'ASSIGNE', 'EN_COURS', 'EN_TRAITEMENT'].includes(t.statut)).length;
  const resolues = tickets.filter(t => ['RESOLU', 'REGULARISEE', 'CLOTURE'].includes(t.statut)).length;

  const cards = [
    { label: 'Réclamations (toutes agences)', value: total, color: '#155E75' },
    { label: 'En cours de traitement', value: enCours, color: '#FB7185' },
    { label: 'Résolues / Clôturées', value: resolues, color: '#4caf50' },
    { label: 'Agences', value: parAgence.length, color: '#7b1fa2' },
  ];

  return (
    <Box sx={{ mt: 0 }}>
      <Box className="kossa-banner" sx={{ background: 'linear-gradient(135deg, #0E4557 0%, #155E75 60%, #2C7E99 100%)', borderRadius: 4, p: 3.5, mb: 3, boxShadow: '0 20px 40px rgba(14,69,87,0.35)', border: '1px solid rgba(251,113,133,0.35)' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
              Gestionnaire de Réclamations
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Vue consolidée des réclamations de toutes les agences et compilation des statistiques.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}
            sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}>
            Actualiser
          </Button>
        </Stack>
      </Box>

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

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Répartition par statut (toutes agences)</Typography>
            <Box sx={{ height: 260 }}><Doughnut data={statutData} options={{ maintainAspectRatio: false }} /></Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Réclamations par agence</Typography>
            <Box sx={{ height: 260 }}><Bar data={agenceData} options={{ maintainAspectRatio: false }} /></Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, borderRadius: 3, overflow: 'hidden' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select value={filtreStatut} label="Statut" onChange={e => setFiltreStatut(e.target.value)}>
              <MenuItem value="">Tous</MenuItem>
              {Object.keys(STATUT_COLORS).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Agence</InputLabel>
            <Select value={filtreAgence} label="Agence" onChange={e => setFiltreAgence(e.target.value)}>
              <MenuItem value="">Toutes</MenuItem>
              {agences.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" placeholder="Rechercher (réf, client, msisdn)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} sx={{ minWidth: 260 }} />
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            {filtres.length} réclamation(s)
          </Typography>
        </Stack>

        <TableContainer>
          <Table sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5, borderTopLeftRadius: 8 }}>Référence</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Client</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Agence</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Type</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Priorité</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Statut</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Chargé</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>SISAV</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5, textAlign: 'center', borderTopRightRadius: 8 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtres.map(t => (
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
                  <TableCell>{t.chefSisav?.nom || ' '}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Voir détail"><IconButton size="small" onClick={() => { setDetailTicket(t); setDetailOpen(true); }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Transférer"><IconButton size="small" color="warning" onClick={() => ouvrirTransfert(t)}><SwapHorizIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détail de {detailTicket?.reference}</DialogTitle>
        <DialogContent dividers>
          {detailTicket && (
            <Stack spacing={1.5}>
              <Typography><strong>Client :</strong> {detailTicket.client?.nom} {detailTicket.client?.prenom}   {detailTicket.client?.msisdn}</Typography>
              <Typography><strong>Agence :</strong> {detailTicket.agence?.nom || ' '} · <strong>Type :</strong> {detailTicket.type}</Typography>
              <Typography><strong>Priorité :</strong> {detailTicket.priorite} · <strong>Statut :</strong> {detailTicket.statut}</Typography>
              <Typography><strong>Description :</strong> {detailTicket.description}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfert inter-agences</DialogTitle>
        <DialogContent dividers>
          {transferMsg && <Alert severity="error" sx={{ mb: 2 }}>{transferMsg}</Alert>}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Transférer la réclamation <strong>{transferTicket?.reference}</strong>
            {transferTicket?.agence?.nom ? ` (agence actuelle : ${transferTicket.agence.nom})` : ''} vers une autre agence. Le dossier disparaîtra de la vue de l'agence d'origine.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Agence de destination</InputLabel>
            <Select value={transferAgenceId} label="Agence de destination" onChange={e => setTransferAgenceId(e.target.value)}>
              <MenuItem value="" disabled>Choisir une agence…</MenuItem>
              {agencesListe.map(a => (
                <MenuItem key={a.id} value={String(a.id)}>{a.nom}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)}>Annuler</Button>
          <Button onClick={confirmerTransfert} variant="contained" color="warning" disabled={!transferAgenceId}>Confirmer le transfert</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionnaireDashboard;
