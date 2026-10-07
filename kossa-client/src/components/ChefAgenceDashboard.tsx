import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Typography, Grid, Paper, Box, Stack, Chip, Alert, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendToMobileIcon from '@mui/icons-material/SendToMobile';
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
agent?: { nom: string } | null;
  chefSisav?: { nom: string } | null;
  commentaires?: any[];
}

const ChefAgenceDashboard = () => {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [chefsSisav, setChefsSisav] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTicket, setAssignTicket] = useState<TicketRow | null>(null);
  const [chefSisavEmail, setChefSisavEmail] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TicketRow | null>(null);

  const load = useCallback(() => {
    api.get('/manager/reclamations?size=100').then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.content || []);
      setTickets(data);
    }).catch(() => setError("Impossible de charger les réclamations de votre agence."));
  }, []);

  useEffect(() => {
    load();
    api.get('/manager/chefs-sisav').then(res => {
      setChefsSisav(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, [load]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const ouvrirAssignation = (t: TicketRow) => {
    setAssignTicket(t);
    setChefSisavEmail('');
    setAssignOpen(true);
  };

  const confirmerAssignation = () => {
    if (!assignTicket || !chefSisavEmail) {
      showMessage('error', 'Veuillez sélectionner le chef SISAV destinataire.');
      return;
    }
    api.put(`/manager/reclamations/${assignTicket.id}/affecter-sisav`, { chefSisavEmail })
      .then(() => {
        showMessage('success', `Réclamation ${assignTicket.reference} transmise au SISAV.`);
        setAssignOpen(false);
        load();
      })
      .catch((err) => showMessage('error', err.response?.data?.message || "Échec de la transmission au SISAV."));
  };

  const voirDetail = (t: TicketRow) => {
    api.get(`/manager/reclamations/${t.id}`).then(res => {
      setDetailTicket(res.data);
      setDetailOpen(true);
    }).catch(() => showMessage('error', "Impossible de charger le détail."));
  };

  if (error && tickets.length === 0) return <Box sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Box>;

  const total = tickets.length;
  const enCours = tickets.filter(t => ['OUVERT', 'ASSIGNE_SISAV', 'ASSIGNE', 'EN_COURS', 'EN_TRAITEMENT'].includes(t.statut)).length;
  const resolues = tickets.filter(t => ['RESOLU', 'REGULARISEE', 'CLOTURE'].includes(t.statut)).length;

  const cards = [
    { label: 'Réclamations de mon agence', value: total, color: '#155E75' },
    { label: 'En cours de traitement', value: enCours, color: '#FB7185' },
    { label: 'Résolues / Clôturées', value: resolues, color: '#4caf50' },
    { label: 'Transmises au SISAV', value: tickets.filter(t => t.statut === 'ASSIGNE_SISAV').length, color: '#e91e63' },
  ];

  return (
    <Box sx={{ mt: 0 }}>
      <Box className="kossa-banner" sx={{ background: 'linear-gradient(135deg, #0E4557 0%, #155E75 60%, #2C7E99 100%)', borderRadius: 4, p: 3.5, mb: 3, boxShadow: '0 20px 40px rgba(14,69,87,0.35)', border: '1px solid rgba(251,113,133,0.35)' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
              Tableau de Bord   Chef d'Agence
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Vous ne voyez que les réclamations saisies par les chargés de réclamation de votre agence. Vous pouvez les transmettre au SISAV.
            </Typography>
          </Box>
          <IconButtonRefresh load={load} />
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
          <Typography variant="h6" sx={{ flex: 1 }}>Réclamations de l'agence</Typography>
          <TextField size="small" placeholder="Rechercher (référence, client, type...)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} sx={{ minWidth: 280 }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select value={filtreStatut} label="Statut" onChange={e => setFiltreStatut(e.target.value)}>
              <MenuItem value="">Tous</MenuItem>
              {Object.keys(STATUT_COLORS).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
        {tickets.length === 0 && <Typography color="text.secondary">Aucune réclamation saisie dans votre agence.</Typography>}
        <TableContainer>
          <Table sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5, borderTopLeftRadius: 8 }}>Référence</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Client</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Type</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Priorité</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Statut</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Chargé</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>SISAV</TableCell>
                <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5, textAlign: 'center', borderTopRightRadius: 8 }}>Actions</TableCell>
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
                  t.agent?.nom?.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a: any, b: any) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
                .map(t => (
                <TableRow key={t.id} hover>
                  <TableCell><strong>{t.reference}</strong></TableCell>
                  <TableCell>{t.client?.nom} {t.client?.prenom}</TableCell>
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
                      <Tooltip title="Voir détail"><IconButton size="small" onClick={() => voirDetail(t)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                      {t.statut !== 'ASSIGNE_SISAV' && (
                        <Tooltip title="Transmettre au SISAV"><IconButton size="small" color="secondary" onClick={() => ouvrirAssignation(t)}><SendToMobileIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* DIALOG : TRANSMISSION AU SISAV */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transmettre {assignTicket?.reference} au SISAV</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              La réclamation passera au statut <strong>ASSIGNE_SISAV</strong> et sera traitée par le chef SISAV, qui
              l'affectera ensuite à un agent support SAV avec son avis.
            </Alert>
            <FormControl fullWidth required>
              <InputLabel>Chef SISAV destinataire</InputLabel>
              <Select value={chefSisavEmail} label="Chef SISAV destinataire" onChange={e => setChefSisavEmail(e.target.value)}>
                {chefsSisav.length === 0 && <MenuItem value="">  Aucun chef SISAV disponible  </MenuItem>}
                {chefsSisav.map((c: any) => (
                  <MenuItem key={c.email} value={c.email}>{c.nom} ({c.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Annuler</Button>
          <Button variant="contained" color="secondary" onClick={confirmerAssignation} disabled={!chefSisavEmail}>Transmettre au SISAV</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG : DÉTAIL */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détail de {detailTicket?.reference}</DialogTitle>
        <DialogContent dividers>
          {detailTicket && (
            <Stack spacing={1.5}>
              <Typography><strong>Client :</strong> {detailTicket.client?.nom} {detailTicket.client?.prenom}   {detailTicket.client?.msisdn}</Typography>
              <Typography><strong>Type :</strong> {detailTicket.type} · <strong>Domaine :</strong> {detailTicket.domaine || ' '}</Typography>
              <Typography><strong>Priorité :</strong> {detailTicket.priorite} · <strong>Statut :</strong> {detailTicket.statut}</Typography>
              <Typography><strong>Description :</strong> {detailTicket.description}</Typography>
              {detailTicket.commentaires && detailTicket.commentaires.length > 0 && (
                <Box>
                  <Typography variant="subtitle2">Historique</Typography>
                  {[...detailTicket.commentaires].sort((a: any, b: any) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime()).map((c: any) => (
                    <Typography key={c.id} variant="body2" sx={{ borderLeft: '3px solid #155E75', pl: 1, my: 0.5 }}>
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

function IconButtonRefresh({ load }: { load: () => void }) {
  return (
    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}
      sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}>
      Actualiser
    </Button>
  );
}

export default ChefAgenceDashboard;
