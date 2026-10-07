import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography, Grid, Paper, Box, Stack, Chip, IconButton, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, List, ListItem, ListItemText, TextField,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import VerifiedIcon from '@mui/icons-material/Verified';
import api from '../services/api';

interface AgentAct {
  id: number; nom: string; email: string; matricule?: string; equipe?: string;
  nbReclamations: number; resolues: number;
}
interface ManagerAct {
  id: number; nom: string; email: string; departement?: string; nbEscalades: number;
}
interface EquipeAct {
  id: number; nom: string; niveau: string; domaine: string; resolues: number; enCours: number; total: number;
}
interface RecDetail {
  id: number; reference: string; objet: string; type: string; statut: string; priorite: string;
  dateCreation?: string; dateEcheance?: string; client?: string | null; agent?: string | null; agence?: string | null;
}
type DialogKind = 'agent' | 'equipe' | null;

const STATUT_COLORS: Record<string, string> = {
  OUVERT: '#1565c0', ASSIGNE: '#7b1fa2', EN_COURS: '#ef6c00', RESOLU: '#2e7d32',
  CLOTURE: '#9e9e9e', REJETE: '#c62828', DEMANDE: '#f57c00',
  REOUVERT: '#155E75', REGULARISEE: '#43a047', EN_ATTENTE_SUPERVISEUR: '#6a1b9a', VALIDATION_SUPERVISEUR: '#6a1b9a',
};

const SupervisorDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailRows, setDetailRows] = useState<RecDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [demandes, setDemandes] = useState<RecDetail[]>([]);
  const [actionMotif, setActionMotif] = useState('');
  const [actionRec, setActionRec] = useState<RecDetail | null>(null);
  const [actionMode, setActionMode] = useState<'valider' | 'rejeter' | 'escalader' | null>(null);
  const [selectedDomaine, setSelectedDomaine] = useState('');
  const [domaines, setDomaines] = useState<string[]>([]);

  const loadDemandes = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedDomaine) params.append('domaine', selectedDomaine);
    const qs = params.toString();
    api.get(`/superviseur/demandes-validation${qs ? '?' + qs : ''}`)
      .then(res => setDemandes(res.data.demandes || []))
      .catch(() => {});
  }, [selectedDomaine]);

  const load = useCallback(() => {
    setError(null);
    const params = new URLSearchParams();
    if (selectedDomaine) params.append('domaine', selectedDomaine);
    const qs = params.toString();
    api.get(`/superviseur/activite${qs ? '?' + qs : ''}`)
      .then(res => {
        setData(res.data);
        if (res.data.domaines && domaines.length === 0) {
          setDomaines(res.data.domaines);
          if (!selectedDomaine && res.data.domaine) setSelectedDomaine(res.data.domaine);
        }
      })
      .catch(() => setError("Impossible de charger l'activité de supervision."));
    loadDemandes();
  }, [loadDemandes, selectedDomaine, domaines.length]);

  useEffect(() => { load(); }, [load]);

  const handleDomaineChange = (value: string) => {
    setSelectedDomaine(value);
  };

  const openDetail = (kind: Exclude<DialogKind, null>, id: number, title: string) => {
    setDetailTitle(title);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailRows([]);
    const url = kind === 'agent' ? `/superviseur/agent/${id}/reclamations` : `/superviseur/equipe/${id}/reclamations`;
    api.get(url)
      .then(res => setDetailRows(res.data.reclamations || []))
      .catch(() => setDetailRows([]))
      .finally(() => setDetailLoading(false));
  };

  const ouvrirAction = (rec: RecDetail, mode: 'valider' | 'rejeter' | 'escalader') => {
    setActionRec(rec);
    setActionMode(mode);
    setActionMotif('');
  };

  const executerAction = () => {
    if (!actionRec) return;
    const id = actionRec.id;
    let p: Promise<any>;
    if (actionMode === 'valider') {
      p = api.put(`/superviseur/reclamations/${id}/valider-derogation`, { motif: actionMotif || 'Dérogation validée par le Superviseur' });
    } else if (actionMode === 'rejeter') {
      p = api.put(`/superviseur/reclamations/${id}/rejeter-derogation`, { motif: actionMotif || 'Dérogation rejetée par le Superviseur' });
    } else {
      p = api.post(`/superviseur/reclamations/${id}/escalade-immediate`, { motif: actionMotif || 'Escalade immédiate N2' });
    }
    p.then(() => {
      setActionRec(null);
      setActionMode(null);
      load();
    }).catch(() => setError("Action impossible sur cette réclamation."));
  };

  if (error) return <Box sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Box>;
  if (!data) return <Box sx={{ mt: 4, textAlign: 'center' }}>Chargement de l'activité de supervision...</Box>;

  const stats = data.stats || {};
  const total = stats.total || 0;
  const resolues = (data.equipes || []).reduce((a: number, e: EquipeAct) => a + e.resolues, 0);
  const taux = total ? Math.round((resolues / total) * 100) : 0;

  const cards = [
    { label: 'Réclamations', value: total, color: '#155E75' },
    { label: 'Résolues / Clôturées', value: resolues, color: '#4caf50' },
    { label: 'Taux de résolution', value: `${taux}%`, color: '#FB7185' },
    { label: 'Équipes (N1/N2)', value: (data.equipes || []).length, color: '#7b1fa2' },
    { label: 'Agents', value: (data.agents || []).length, color: '#1565c0' },
    { label: 'Managers', value: (data.managers || []).length, color: '#c62828' },
  ];

  return (
    <Box sx={{ mt: 0 }}>
      <Box className="kossa-banner" sx={{ background: 'linear-gradient(135deg, #0E4557 0%, #155E75 60%, #2C7E99 100%)', borderRadius: 4, p: 3.5, mb: 3, boxShadow: '0 20px 40px rgba(14,69,87,0.35)', border: '1px solid rgba(251,113,133,0.35)' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
              Supervision
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Domaine : <strong>{data.domaine}</strong> {data.agence ? ` | Agence : ${data.agence}` : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Domaine</InputLabel>
              <Select
                value={selectedDomaine}
                label="Domaine"
                onChange={e => handleDomaineChange(e.target.value)}
                sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' } }}
              >
                {domaines.map(d => (
                  <MenuItem key={d} value={d}>{d.replace('_', ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={load} sx={{ color: '#FFFFFF' }} title="Actualiser"><RefreshIcon /></IconButton>
          </Stack>
        </Stack>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 12 }}>
          <Grid container spacing={2}>
            {cards.map(c => (
              <Grid size={{ xs: 6, md: 2 }} key={c.label}>
                <Paper sx={{ p: 2, textAlign: 'center', borderTop: `4px solid ${c.color}` }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: c.color }}>{c.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
              <SupervisorAccountIcon color="primary" /><Typography variant="h6">Agents collecteurs</Typography>
            </Stack>
            {(data.agents || []).length === 0 && <Typography color="text.secondary">Aucun agent sur ce domaine.</Typography>}
            {(data.agents || []).map((a: AgentAct) => (
              <Stack key={a.id} direction="row" onClick={() => openDetail('agent', a.id, `Réclamations de ${a.nom}`)}
                sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #eee', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <Box>
                  <Typography variant="body1"><strong>{a.nom}</strong></Typography>
                  <Typography variant="caption" color="text.secondary">{a.email} · {a.equipe || ' '}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label={`${a.nbReclamations} rec.`} color="primary" size="small" />
                  <Chip label={`${a.resolues} résolues`} color="success" size="small" />
                </Stack>
              </Stack>
            ))}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
              <GroupWorkIcon color="primary" /><Typography variant="h6">Managers</Typography>
            </Stack>
            {(data.managers || []).length === 0 && <Typography color="text.secondary">Aucun manager.</Typography>}
            {(data.managers || []).map((m: ManagerAct) => (
              <Stack key={m.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Box>
                  <Typography variant="body1"><strong>{m.nom}</strong></Typography>
                  <Typography variant="caption" color="text.secondary">{m.email} · {m.departement || ' '}</Typography>
                </Box>
                <Chip label={`${m.nbEscalades} escalades`} color="warning" size="small" />
              </Stack>
            ))}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
              <GroupWorkIcon color="primary" /><Typography variant="h6">Équipes de résolution (N1/N2)</Typography>
            </Stack>
            {(data.equipes || []).length === 0 && <Typography color="text.secondary">Aucune équipe sur ce domaine.</Typography>}
            {(data.equipes || []).map((e: EquipeAct) => (
              <Stack key={e.id} direction="row" onClick={() => openDetail('equipe', e.id, `Réclamations de ${e.nom}`)}
                sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: 1, borderColor: '#eee', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <Box>
                  <Typography variant="body1"><strong>{e.nom}</strong></Typography>
                  <Typography variant="caption" color="text.secondary">{e.total} réclamations affectées</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label="N1/N2" size="small" color={e.niveau === 'N1' ? 'primary' : 'secondary'} />
                  <Chip label={`${e.resolues} résolues`} color="success" size="small" />
                  <Chip label={`${e.enCours} en cours`} color="default" size="small" />
                </Stack>
              </Stack>
            ))}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, border: '2px solid #6a1b9a' }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
              <VerifiedIcon color="secondary" /><Typography variant="h6">Demandes de validation (dérogations / remboursements)</Typography>
              <Chip label={`${demandes.length} en attente`} size="small" color="secondary" />
            </Stack>
            {demandes.length === 0 && <Typography color="text.secondary">Aucune demande de validation en attente.</Typography>}
            {[...demandes].sort((a: any, b: any) => new Date(b.dateCreation || b.dateDemande || 0).getTime() - new Date(a.dateCreation || a.dateDemande || 0).getTime()).map(d => (
              <Stack key={d.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Box>
                  <Typography variant="body1"><strong>{d.reference}</strong>   {d.objet}</Typography>
                  <Typography variant="caption" color="text.secondary">{d.type} · {d.client || 'Client N/A'} · {d.agent || 'Sans agent'} · {d.agence || 'Sans agence'}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label={d.statut} size="small" sx={{ color: '#fff', bgcolor: STATUT_COLORS[d.statut] || '#607d8b' }} />
                  <Button size="small" variant="contained" color="success" onClick={() => ouvrirAction(d, 'valider')}>Valider</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => ouvrirAction(d, 'rejeter')}>Rejeter</Button>
                  <Button size="small" variant="outlined" color="warning" onClick={() => ouvrirAction(d, 'escalader')}>Escalade N2</Button>
                </Stack>
              </Stack>
            ))}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Statistiques consolidées du domaine</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">Par statut</Typography>
                {Object.entries(stats.parStatut || {}).map(([k, v]) => (
                  <Stack key={k} direction="row" sx={{ justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2">{k}</Typography><Chip label={String(v)} size="small" />
                  </Stack>
                ))}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">Par priorité</Typography>
                {Object.entries(stats.parPriorite || {}).map(([k, v]) => (
                  <Stack key={k} direction="row" sx={{ justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2">{k}</Typography><Chip label={String(v)} size="small" />
                  </Stack>
                ))}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">Par agent</Typography>
                {Object.entries(stats.parAgent || {}).map(([k, v]) => (
                  <Stack key={k} direction="row" sx={{ justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2">{k}</Typography><Chip label={String(v)} size="small" />
                  </Stack>
                ))}
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{detailTitle}</DialogTitle>
        <Divider />
        <DialogContent dividers>
          {detailLoading && <Typography color="text.secondary">Chargement...</Typography>}
          {!detailLoading && detailRows.length === 0 && (
            <Typography color="text.secondary">Aucune réclamation à afficher.</Typography>
          )}
          {!detailLoading && detailRows.length > 0 && (
            <List dense>
              {[...detailRows].sort((a: any, b: any) => new Date(b.dateCreation || b.dateEcheance || 0).getTime() - new Date(a.dateCreation || a.dateEcheance || 0).getTime()).map(r => (
                <ListItem key={r.id} divider sx={{ alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} sx={{ mb: 0.5, alignItems: 'center' }}>
                        <strong>{r.reference}</strong>
                        <Chip label={r.statut} size="small" sx={{ color: '#fff', bgcolor: STATUT_COLORS[r.statut] || '#607d8b' }} />
                        <Chip label={r.priorite} size="small" color={r.priorite === 'CRITIQUE' ? 'error' : r.priorite === 'MOYENNE' ? 'warning' : 'default'} />
                      </Stack>
                    }
                    secondary={
                      <>
                        <Typography variant="body2">{r.objet}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {r.type} · {r.client || 'Client N/A'}
                          {r.dateEcheance ? ` · Échéance: ${new Date(r.dateEcheance).toLocaleDateString('fr-FR')}` : ''}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(actionRec)} onClose={() => setActionRec(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionMode === 'valider' ? 'Valider la dérogation' : actionMode === 'rejeter' ? 'Rejeter la dérogation' : 'Escalade immédiate N2'}   {actionRec?.reference}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity={actionMode === 'rejeter' ? 'error' : actionMode === 'escalader' ? 'warning' : 'success'}>
              {actionMode === 'valider' && 'Le geste commercial / dérogation sera accordé et la réclamation passera au statut RÉSOLU.'}
              {actionMode === 'rejeter' && 'La demande sera rejetée et la réclamation repassera EN_COURS.'}
              {actionMode === 'escalader' && 'Une escalade immédiate N2 sera créée pour le département expert.'}
            </Alert>
            <TextField label="Motif / Commentaire" multiline rows={3} fullWidth value={actionMotif}
              onChange={e => setActionMotif(e.target.value)} placeholder="Motif de la décision..." />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionRec(null)}>Annuler</Button>
          <Button variant="contained" color={actionMode === 'rejeter' ? 'error' : actionMode === 'escalader' ? 'warning' : 'success'}
            onClick={executerAction}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupervisorDashboard;
