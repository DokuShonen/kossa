import React, { useEffect, useState } from 'react';
import {
  Typography, Grid, Paper, Button, Stack, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Box, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Alert, Menu, Divider
} from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ForumIcon from '@mui/icons-material/Forum';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LockIcon from '@mui/icons-material/Lock';
import GetAppIcon from '@mui/icons-material/GetApp';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendToMobileIcon from '@mui/icons-material/SendToMobile';
import api from '../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement);

const STATUT_COLORS: Record<string, string> = {
  NOUVEAU: '#1e88e5', OUVERT: '#1e88e5', ASSIGNE: '#ff9800', EN_COURS: '#ab47bc',
  ESCALADE_N1: '#f44336', ESCALADE_N2: '#d32f2f', ESCALADE: '#f44336',
  RESOLU: '#4caf50', CLOTURE: '#757575', REOUVERT: '#00897b'
};

const ManagerDashboard = ({ section = 'kpi' }: { section?: string }) => {
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsFiltres, setTicketsFiltres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtres
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtrePriorite, setFiltrePriorite] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statutMenuAnchor, setStatutMenuAnchor] = useState<null | HTMLElement>(null);
  const [statutMenuTicket, setStatutMenuTicket] = useState<any>(null);
  const [statutMenuOptions, setStatutMenuOptions] = useState<string[]>([]);

  // Ticket sélectionné
  const [ticketSelectionne, setTicketSelectionne] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Dialog assignation
  const [assignOpen, setAssignOpen] = useState(false);
  const [agentEmail, setAgentEmail] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);

  // Dialog assignation SISAV
  const [assignSisavOpen, setAssignSisavOpen] = useState(false);
  const [assignSisavTicket, setAssignSisavTicket] = useState<any>(null);
  const [chefSisavEmail, setChefSisavEmail] = useState('');
  const [chefsSisav, setChefsSisav] = useState<any[]>([]);

  // Escalades
  const [escalades, setEscalades] = useState<any[]>([]);
  const [filtreEscaladeStatut, setFiltreEscaladeStatut] = useState('DEMANDE');
  const [escaladeDetailOpen, setEscaladeDetailOpen] = useState(false);
  const [escaladeSelectionnee, setEscaladeSelectionnee] = useState<any>(null);
  const [validationEquipeId, setValidationEquipeId] = useState('');
  const [validationAgentEmail, setValidationAgentEmail] = useState('');
  const [agentsN2, setAgentsN2] = useState<any[]>([]);
  const [rejetMotif, setRejetMotif] = useState('');

  // Dialog commentaire
  const [commentOpen, setCommentOpen] = useState(false);
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');

  // Dialog clôture
  const [closeOpen, setCloseOpen] = useState(false);

  // Rapport
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);

  // Message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      api.get('/stats/global'),
      api.get('/manager/reclamations?size=500'),
    ]).then(([statsRes, ticketsRes]) => {
      setStats(statsRes.data);
      const data = Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data.content || []);
      setTickets(data);
      setTicketsFiltres(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/manager/reclamations?size=500').then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.content || []);
        setTickets(data);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = [...tickets];
    if (filtreStatut) result = result.filter(t => t.statut === filtreStatut);
    if (filtrePriorite) result = result.filter(t => t.priorite === filtrePriorite);
    if (filtreType) result = result.filter(t => t.type === filtreType);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.reference?.toLowerCase().includes(term) ||
        t.client?.nom?.toLowerCase().includes(term) ||
        t.client?.prenom?.toLowerCase().includes(term) ||
        t.client?.msisdn?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.agent?.nom?.toLowerCase().includes(term) ||
        t.agent?.email?.toLowerCase().includes(term) ||
        t.agence?.nom?.toLowerCase().includes(term)
      );
    }
    result.sort((a: any, b: any) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
    setTicketsFiltres(result);
  }, [filtreStatut, filtrePriorite, filtreType, searchTerm, tickets]);

  const refreshTickets = () => {
    api.get('/manager/reclamations?size=500').then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.content || []);
      setTickets(data);
      setTicketsFiltres(data);
    });
  };

  const loadEquipes = () => {
    api.get('/manager/equipes').then(res => {
      setEquipes(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
    api.get('/manager/chefs-sisav').then(res => {
      setChefsSisav(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  };

  useEffect(() => { loadEquipes(); }, []);

  const loadEscalades = (statut: string) => {
    api.get(`/manager/escalades/enrichies${statut ? `?statut=${statut}` : ''}`).then(res => {
      setEscalades(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  };

  useEffect(() => { loadEscalades(filtreEscaladeStatut); }, [filtreEscaladeStatut]);

  // --- DÉTAIL ---
  const voirDetail = (ticket: any) => {
    api.get(`/manager/reclamations/${ticket.id}`).then(res => {
      setTicketSelectionne(res.data);
      setDetailOpen(true);
    });
  };

  // --- ASSIGNATION ---
  const ouvrirAssignation = (ticket: any) => {
    setTicketSelectionne(ticket);
    setAgentEmail('');
    const domaine = ticket.domaine || (ticket.type === 'Mobile Money' ? 'MOBILE_MONEY' : ticket.type === 'FTTH' ? 'FTTH' : ticket.type === 'Internet' ? 'INTERNET' : 'MOBILE_MONEY');
    const params = domaine ? `?domaine=${domaine}&niveau=N1` : '?niveau=N1';
    api.get(`/manager/agents${params}`).then(res => {
      setAgents(Array.isArray(res.data) ? res.data : (res.data.content || []));
    }).catch(() => {});
    setAssignOpen(true);
  };

  const confirmerAssignation = () => {
    if (!agentEmail) return;
    api.put(`/manager/reclamations/${ticketSelectionne.id}/assigner`, { agentEmail })
      .then(() => {
        showMessage('success', 'Ticket assigné avec succès');
        setAssignOpen(false);
        refreshTickets();
      })
      .catch(() => showMessage('error', "Échec de l'assignation"));
  };

  // --- TRANSMISSION AU SISAV ---
  const ouvrirAssignationSisav = (ticket: any) => {
    setAssignSisavTicket(ticket);
    setChefSisavEmail('');
    setAssignSisavOpen(true);
  };

  const confirmerAssignationSisav = () => {
    if (!assignSisavTicket || !chefSisavEmail) {
      showMessage('error', 'Veuillez sélectionner le chef SISAV destinataire.');
      return;
    }
    api.put(`/manager/reclamations/${assignSisavTicket.id}/affecter-sisav`, { chefSisavEmail })
      .then(() => {
        showMessage('success', `Réclamation ${assignSisavTicket.reference} transmise au SISAV.`);
        setAssignSisavOpen(false);
        refreshTickets();
      })
      .catch((err) => showMessage('error', err.response?.data?.message || "Échec de la transmission au SISAV."));
  };

  // --- COMMENTAIRE ---
  const ouvrirCommentaire = (ticket: any) => {
    setTicketSelectionne(ticket);
    setNouveauCommentaire('');
    setCommentOpen(true);
  };

  const envoyerCommentaire = () => {
    if (!nouveauCommentaire.trim()) return;
    api.post(`/manager/reclamations/${ticketSelectionne.id}/commentaires`, { contenu: nouveauCommentaire })
      .then(() => {
        showMessage('success', 'Commentaire ajouté');
        setCommentOpen(false);
      })
      .catch(() => showMessage('error', "Échec de l'ajout du commentaire"));
  };

  // --- STATUT ---
  const changerStatut = (ticket: any, nouveauStatut: string) => {
    api.put(`/manager/reclamations/${ticket.id}/statut`, {
      statut: nouveauStatut, commentaire: `Statut changé en ${nouveauStatut} par le Manager`
    }).then(() => {
      showMessage('success', `Statut mis à jour → ${nouveauStatut}`);
      refreshTickets();
    }).catch(() => showMessage('error', 'Échec de la mise à jour'));
  };

  // --- CLÔTURE ---
  const ouvrirCloture = (ticket: any) => {
    setTicketSelectionne(ticket);
    setCloseOpen(true);
  };

  const confirmerCloture = () => {
    api.put(`/manager/reclamations/${ticketSelectionne.id}/fermer`)
      .then(() => {
        showMessage('success', 'Ticket clôturé');
        setCloseOpen(false);
        refreshTickets();
      })
      .catch(() => showMessage('error', 'Échec de la clôture'));
  };

  // --- ESCALADE N2 ---
  const voirDetailEscalade = (esc: any) => {
    setEscaladeSelectionnee(esc);
    setValidationEquipeId('');
    setValidationAgentEmail('');
    setRejetMotif('');
    setAgentsN2([]);
    const domaine = esc.reclamationDomaine || 'MOBILE_MONEY';
    api.get(`/manager/equipes`).then(res => {
      const all = Array.isArray(res.data) ? res.data : [];
      const n2 = all.filter((e: any) => e.niveau === 'N2' && (e.domaine === domaine || e.domaine === 'MOBILE_MONEY'));
      setEquipes(all);
      if (n2.length === 1) setValidationEquipeId(String(n2[0].id));
    }).catch(() => {});
    api.get(`/manager/agents?domaine=${domaine}&niveau=N2`).then(res => {
      setAgentsN2(Array.isArray(res.data) ? res.data : (res.data.content || []));
    }).catch(() => {});
    setEscaladeDetailOpen(true);
  };

  const confirmerValidationEscalade = () => {
    if (!escaladeSelectionnee) return;
    api.put(`/manager/escalades/${escaladeSelectionnee.id}/valider`, {
      equipeSupportId: validationEquipeId ? Number(validationEquipeId) : null,
      agentEmail: validationAgentEmail || null
    }).then(() => {
      showMessage('success', `Escalade ${escaladeSelectionnee.reclamationReference} validée et affectée au niveau 2`);
      setEscaladeDetailOpen(false);
      loadEscalades(filtreEscaladeStatut);
      refreshTickets();
    }).catch((err) => showMessage('error', err.response?.data?.message || "Échec de la validation de l'escalade"));
  };

  const confirmerRejetEscalade = () => {
    if (!escaladeSelectionnee) return;
    api.put(`/manager/escalades/${escaladeSelectionnee.id}/rejeter`, { motif: rejetMotif || null })
      .then(() => {
        showMessage('success', `Demande d'escalade ${escaladeSelectionnee.reclamationReference} rejetée`);
        setEscaladeDetailOpen(false);
        loadEscalades(filtreEscaladeStatut);
        refreshTickets();
      })
      .catch((err) => showMessage('error', err.response?.data?.message || "Échec du rejet de l'escalade"));
  };

  // --- EXPORT & IMPRESSION ---
  const exporterExcel = async () => {
    try {
      let url = '/stats/rapports/excel';
      const params = new URLSearchParams();
      if (dateDebut) params.append('debut', dateDebut);
      if (dateFin) params.append('fin', dateFin);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=windows-1252' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `rapport_reclamations_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showMessage('success', 'Rapport exporté avec succès');
    } catch (err) {
      console.error(err);
      showMessage('error', "Échec de l'exportation Excel");
    }
  };

  const exporterPDF = async () => {
    try {
      let url = '/stats/rapports/pdf';
      const params = new URLSearchParams();
      if (dateDebut) params.append('debut', dateDebut);
      if (dateFin) params.append('fin', dateFin);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `rapport_reclamations_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showMessage('success', 'Rapport PDF téléchargé avec succès');
    } catch (err) {
      console.error(err);
      showMessage('error', "Échec de l'exportation PDF");
    }
  };

  const imprimerRapport = () => {
    const dataToPrint = reportData.length > 0 ? reportData : tickets;
    if (!dataToPrint || dataToPrint.length === 0) {
      showMessage('error', 'Aucune donnée à imprimer');
      return;
    }
    const w = window.open('', '_blank');
    if (!w) return;
    const logoUrl = window.location.origin + '/logo.svg';
    const periodStr = dateDebut && dateFin ? `Du ${dateDebut} au ${dateFin}` : 'Toutes les réclamations';

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport de Réclamations   KOSSA</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; line-height: 1.5; padding: 25px; margin: 0; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #FB7185; padding-bottom: 15px; margin-bottom: 20px; }
          .header-left { display: flex; align-items: center; gap: 15px; }
          .header img { height: 55px; }
          .header h1 { color: #155E75; margin: 0; font-size: 22px; font-weight: 700; }
          .header p { color: #555770; margin: 3px 0 0; font-size: 13px; }
          .meta { background: #EBF5FF; border: 1px solid rgba(0,96,168,0.2); border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; font-size: 13px; color: #0E4557; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          th { background: linear-gradient(135deg, #155E75 0%, #0E4557 100%); color: #ffffff; padding: 10px 12px; text-align: left; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { display: inline-block; padding: 3px 9px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #fff; }
          .badge-OUVERT { background: #1e88e5; }
          .badge-EN_COURS { background: #ab47bc; }
          .badge-RESOLU { background: #4caf50; }
          .badge-CLOTURE { background: #757575; }
          .badge-ESCALADE { background: #f44336; }
          .badge-ASSIGNE { background: #ff9800; }
          .footer { text-align: center; margin-top: 35px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <img src="${logoUrl}" alt="KOSSA" onerror="this.style.display='none'" />
            <div>
              <h1>KOSSA</h1>
              <p>Rapport Officiel d'Extraction des Réclamations</p>
            </div>
          </div>
        </div>
        <div class="meta">
          <div><strong>Période :</strong> ${periodStr}</div>
          <div><strong>Total Réclamations :</strong> ${dataToPrint.length}</div>
          <div><strong>Généré le :</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Description / Objet</th>
              <th>Priorité</th>
              <th>Statut</th>
              <th>Date de création</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint.map((r: any) => `
              <tr>
                <td><strong>${r.reference || ' '}</strong></td>
                <td>${r.description || r.objet || ' '}</td>
                <td>${r.priorite || ' '}</td>
                <td><span class="badge badge-${r.statut}">${r.statut || ' '}</span></td>
                <td>${r.dateCreation ? new Date(r.dateCreation).toLocaleDateString('fr-FR') : ' '}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          Document confidentiel généré automatiquement par KOSSA KOSSA
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    w.document.close();
  };

  if (loading) return (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Chargement...</Typography>
    </Box>
  );

  const statutData = {
    labels: Object.keys(stats?.parStatut || {}),
    datasets: [{ label: 'Tickets', data: Object.values(stats?.parStatut || {}), backgroundColor: ['#1e88e5', '#4caf50', '#ffb300', '#f44336', '#ab47bc', '#757575'] }]
  };

  const agentData = {
    labels: Object.keys(stats?.parAgent || {}),
    datasets: [{ label: 'Tickets traités', data: Object.values(stats?.parAgent || {}), backgroundColor: '#ab47bc' }]
  };

  return (
    <Box sx={{ mt: 0 }}>
      <Box className="kossa-banner" sx={{ background: 'linear-gradient(135deg, #0E4557 0%, #155E75 60%, #2C7E99 100%)', borderRadius: 4, p: 3.5, mb: 3, boxShadow: '0 20px 40px rgba(14,69,87,0.35)', border: '1px solid rgba(251,113,133,0.35)' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
          Tableau de Bord Manager
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
          Supervision, rapports et gestion des équipes
        </Typography>
      </Box>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {/* ===================== TAB 0 : KPI ===================== */}
      {section === 'kpi' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, elevation: 3 }}>
              <Typography variant="h6" gutterBottom>Répartition par Statut</Typography>
              <Box sx={{ height: 280 }}><Doughnut data={statutData} options={{ maintainAspectRatio: false }} /></Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, elevation: 3 }}>
              <Typography variant="h6" gutterBottom>Performance des Agents</Typography>
              <Box sx={{ height: 280 }}><Bar data={agentData} options={{ maintainAspectRatio: false }} /></Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#EBF5FF', border: '1px solid rgba(0,96,168,0.1)' }}>
              <Typography variant="h3" sx={{ color: '#155E75', fontWeight: 700 }}>{stats?.total || 0}</Typography>
              <Typography sx={{ color: '#555770' }}>Total Tickets</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#FFF4E6', border: '1px solid rgba(243,122,33,0.15)' }}>
              <Typography variant="h3" sx={{ color: '#FB7185', fontWeight: 700 }}>{stats?.parStatut?.EN_COURS || 0}</Typography>
              <Typography sx={{ color: '#555770' }}>En Cours</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#E8F5E9', border: '1px solid rgba(76,175,80,0.15)' }}>
              <Typography variant="h3" sx={{ color: '#4CAF50', fontWeight: 700 }}>{stats?.parStatut?.RESOLU || 0}</Typography>
              <Typography sx={{ color: '#555770' }}>Résolus</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ===================== TAB 1 : TICKETS ===================== */}
      {section === 'tickets' && (
        <Paper sx={{ p: 3, borderRadius: 3, overflow: 'hidden' }}>
          <Stack direction="row" spacing={2} sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Gestion des Réclamations</Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              disabled={refreshing}
              onClick={() => {
                setRefreshing(true);
                Promise.all([
                  api.get('/stats/global'),
                  api.get('/manager/reclamations?size=500'),
                ]).then(([statsRes, ticketsRes]) => {
                  setStats(statsRes.data);
                  const data = Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data.content || []);
                  setTickets(data);
                  setTicketsFiltres(data);
                }).catch(() => {}).finally(() => setRefreshing(false));
              }}
            >
              Actualiser
            </Button>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Statut</InputLabel>
              <Select value={filtreStatut} label="Statut" onChange={e => setFiltreStatut(e.target.value)}>
                <MenuItem value="">Tous</MenuItem>
                {Object.keys(STATUT_COLORS).filter(s => s !== 'NOUVEAU' && s !== 'OUVERT').map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Priorité</InputLabel>
              <Select value={filtrePriorite} label="Priorité" onChange={e => setFiltrePriorite(e.target.value)}>
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="FAIBLE">Faible</MenuItem>
                <MenuItem value="MOYENNE">Moyenne</MenuItem>
                <MenuItem value="CRITIQUE">Critique</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Type</InputLabel>
              <Select value={filtreType} label="Type" onChange={e => setFiltreType(e.target.value)}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="Mobile Money">Mobile Money</MenuItem>
                <MenuItem value="FTTH">FTTH</MenuItem>
                <MenuItem value="Internet">Internet</MenuItem>
                <MenuItem value="Technique">Technique</MenuItem>
                <MenuItem value="Facturation">Facturation</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              slotProps={{
                input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }
              }}
              sx={{ minWidth: 260 }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {ticketsFiltres.length} ticket(s) trouvé(s)
          </Typography>

          <TableContainer>
            <Table sx={{ width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5, borderTopLeftRadius: 8 }}>Référence</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Client</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Type</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Domaine</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Priorité</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Statut</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Agent</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Agence</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Créé le</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5, textAlign: 'center', borderTopRightRadius: 8 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ticketsFiltres.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell><strong>{t.reference}</strong></TableCell>
                    <TableCell>{t.client?.nom} {t.client?.prenom}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>{t.domaine || ' '}</TableCell>
                    <TableCell>
                      <Chip label={t.priorite} size="small" color={t.priorite === 'CRITIQUE' ? 'error' : t.priorite === 'MOYENNE' ? 'warning' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.statut} size="small" sx={{ bgcolor: STATUT_COLORS[t.statut] || '#ccc', color: '#fff' }} />
                    </TableCell>
                    <TableCell>{t.agent?.nom || ' '}</TableCell>
                    <TableCell>{t.agence?.nom || ' '}</TableCell>
                    <TableCell>{t.dateCreation ? new Date(t.dateCreation).toLocaleDateString() : ' '}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Voir détail"><IconButton size="small" onClick={() => voirDetail(t)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Assigner un agent"><IconButton size="small" color="primary" onClick={() => ouvrirAssignation(t)}><AssignmentIndIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Ajouter un commentaire"><IconButton size="small" color="info" onClick={() => ouvrirCommentaire(t)}><ForumIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Changer le statut">
                          <IconButton size="small" color="secondary" onClick={(e) => {
                            setStatutMenuAnchor(e.currentTarget);
                            setStatutMenuTicket(t);
                            api.get(`/reclamations/statuts-suivants?statut=${t.statut}`).then(res => {
                              setStatutMenuOptions(res.data || []);
                            }).catch(() => setStatutMenuOptions([]));
                          }}><AutorenewIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Clôturer le ticket"><IconButton size="small" color="error" onClick={() => ouvrirCloture(t)}><LockIcon fontSize="small" /></IconButton></Tooltip>
                        {t.statut !== 'ASSIGNE_SISAV' && (
                          <Tooltip title="Transmettre au SISAV"><IconButton size="small" color="secondary" onClick={() => ouvrirAssignationSisav(t)}><SendToMobileIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Menu anchorEl={statutMenuAnchor} open={Boolean(statutMenuAnchor)} onClose={() => setStatutMenuAnchor(null)}>
            {statutMenuOptions.length === 0 && <MenuItem disabled>Aucune transition autorisée depuis « {statutMenuTicket?.statut} »</MenuItem>}
            {statutMenuOptions.map(s => (
              <MenuItem key={s} disabled={s === statutMenuTicket?.statut} onClick={() => {
                if (statutMenuTicket) changerStatut(statutMenuTicket, s);
                setStatutMenuAnchor(null);
              }}>{s}</MenuItem>
            ))}
          </Menu>
        </Paper>
      )}

      {/* ===================== TAB 2 : ESCALADES ===================== */}
      {section === 'escalades' && (
        <Paper sx={{ p: 3, borderRadius: 3, overflow: 'hidden' }}>
          <Typography variant="h6" gutterBottom>Demandes d'Escalade au Niveau 2</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Les agents ne peuvent pas accéder directement au niveau 2 : chaque demande d'escalade doit être validée par le Manager, qui l'affecte ensuite à l'équipe spécialisée.
          </Alert>
          <FormControl size="small" sx={{ minWidth: 180, mb: 2 }}>
            <InputLabel>Statut</InputLabel>
            <Select value={filtreEscaladeStatut} label="Statut" onChange={e => setFiltreEscaladeStatut(e.target.value)}>
              <MenuItem value="">Toutes</MenuItem>
              <MenuItem value="DEMANDE">En attente (DEMANDE)</MenuItem>
              <MenuItem value="VALIDEE">Validées</MenuItem>
              <MenuItem value="REJETEE">Rejetées</MenuItem>
              <MenuItem value="EN_ATTENTE">En attente (SLA)</MenuItem>
              <MenuItem value="RESOLUE">Résolues</MenuItem>
            </Select>
          </FormControl>
          <TableContainer>
            <Table sx={{ width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5, borderTopLeftRadius: 8 }}>Ticket</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Domaine</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Motif</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Agent</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Demandé le</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Statut</TableCell>
                  <TableCell sx={{ bgcolor: '#004d40', color: '#fff', fontWeight: 700, fontSize: '0.85rem', py: 1.5, textAlign: 'center', borderTopRightRadius: 8 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {escalades.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucune demande d'escalade pour ce statut.</TableCell></TableRow>
                )}
                {[...escalades].sort((a: any, b: any) => new Date(b.dateEscalade).getTime() - new Date(a.dateEscalade).getTime()).map(e => (
                  <TableRow key={e.id} hover>
                    <TableCell><strong>{e.reclamationReference || `#${e.reclamationId}`}</strong></TableCell>
                    <TableCell>{e.reclamationDomaine || ' '}</TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>{e.motif || ' '}</TableCell>
                    <TableCell>{e.agent || ' '}</TableCell>
                    <TableCell>{e.dateEscalade ? new Date(e.dateEscalade).toLocaleString() : ' '}</TableCell>
                    <TableCell>
                      <Chip label={e.statut} size="small" color={e.statut === 'DEMANDE' ? 'warning' : e.statut === 'VALIDEE' ? 'success' : e.statut === 'REJETEE' ? 'error' : 'default'} />
                    </TableCell>
                    <TableCell>
                      {e.statut === 'DEMANDE' ? (
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Valider et affecter au niveau 2"><IconButton size="small" color="success" onClick={() => voirDetailEscalade(e)}><AssignmentIndIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Rejeter la demande"><IconButton size="small" color="error" onClick={() => voirDetailEscalade(e)}><LockIcon fontSize="small" /></IconButton></Tooltip>
                        </Stack>
                      ) : (
                        <Tooltip title="Voir"><IconButton size="small" onClick={() => voirDetailEscalade(e)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ===================== TAB 3 : RAPPORTS ===================== */}
      {section === 'rapports' && (
        <Paper sx={{ p: 3 }} id="printable-area">
          <Typography variant="h6" gutterBottom>Extraction de Rapports</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
            <Button variant="contained" startIcon={<GetAppIcon />} onClick={exporterExcel} color="success">
              Exporter Excel
            </Button>
            <Button variant="outlined" startIcon={<GetAppIcon />} onClick={exporterPDF} color="error">
              Exporter PDF
            </Button>
          </Stack>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Rapport Périodique</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
            <TextField type="date" label="Date Début" size="small" slotProps={{ inputLabel: { shrink: true } }} value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
            <TextField type="date" label="Date Fin" size="small" slotProps={{ inputLabel: { shrink: true } }} value={dateFin} onChange={e => setDateFin(e.target.value)} />
            <Button variant="contained" onClick={() => {
              if (!dateDebut || !dateFin) {
                showMessage('error', 'Veuillez sélectionner la date de début et la date de fin');
                return;
              }
              api.get(`/stats/periode?debut=${dateDebut}&fin=${dateFin}`)
                .then(res => {
                  setReportData(res.data);
                  showMessage('success', `${res.data.length} réclamation(s) trouvée(s) pour la période`);
                })
                .catch(() => showMessage('error', 'Échec de la récupération des données'));
            }}>Générer</Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={imprimerRapport}>
              Imprimer
            </Button>
          </Stack>

          {reportData.length > 0 && (
          <TableContainer sx={{ maxHeight: '65vh', minWidth: 1100 }}>
            <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#004d40' }}>
                    <TableCell sx={{ color: '#fff' }}>Référence</TableCell>
                    <TableCell sx={{ color: '#fff' }}>Description</TableCell>
                    <TableCell sx={{ color: '#fff' }}>Priorité</TableCell>
                    <TableCell sx={{ color: '#fff' }}>Statut</TableCell>
                    <TableCell sx={{ color: '#fff' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...reportData].sort((a: any, b: any) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.reference}</TableCell>
                      <TableCell>{r.description}</TableCell>
                      <TableCell>{r.priorite}</TableCell>
                      <TableCell><Chip label={r.statut} size="small" /></TableCell>
                      <TableCell>{new Date(r.dateCreation).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ===================== DIALOGS ===================== */}

      {/* Détail ticket */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détail du ticket {ticketSelectionne?.reference}</DialogTitle>
        <DialogContent>
          {ticketSelectionne && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 6 }}><Typography><strong>Client :</strong> {ticketSelectionne.client?.nom} {ticketSelectionne.client?.prenom}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography><strong>MSISDN :</strong> {ticketSelectionne.client?.msisdn}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography><strong>Type :</strong> {ticketSelectionne.type}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography><strong>Canal :</strong> {ticketSelectionne.canal}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography><strong>Priorité :</strong> {ticketSelectionne.priorite}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography><strong>Statut :</strong> {ticketSelectionne.statut}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography><strong>Agent :</strong> {ticketSelectionne.agent?.nom || 'Non assigné'}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography><strong>Agence :</strong> {ticketSelectionne.agence?.nom || ' '}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography><strong>Créé le :</strong> {ticketSelectionne.dateCreation ? new Date(ticketSelectionne.dateCreation).toLocaleString() : ' '}</Typography></Grid>
              <Grid size={{ xs: 12 }}><Typography><strong>Description :</strong></Typography><Typography variant="body2">{ticketSelectionne.description}</Typography></Grid>

              {ticketSelectionne.commentaires?.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}><strong>Commentaires :</strong></Typography>
                  {[...ticketSelectionne.commentaires].sort((a: any, b: any) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime()).map((c: any) => (
                    <Paper key={c.id} sx={{ p: 1.5, mb: 1, bgcolor: '#F1F5F9' }}>
                      <Typography variant="body2"><strong>{c.auteur}</strong>   {new Date(c.dateAction).toLocaleString()}</Typography>
                      <Typography variant="body2">{c.contenu}</Typography>
                    </Paper>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Assignation */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)}>
        <DialogTitle>Assigner le ticket {ticketSelectionne?.reference}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1, mb: 2 }} icon={<AssignmentIndIcon fontSize="small" />}>
            Affectation réservée au Manager. Seuls les agents du domaine <strong>{ticketSelectionne?.domaine || 'MOBILE_MONEY'}</strong> (niveau 1) sont proposés (groupe de compétence).
          </Alert>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Agent</InputLabel>
            <Select value={agentEmail} label="Agent" onChange={e => setAgentEmail(e.target.value)}>
              {agents.length === 0 && <MenuItem value="">  Aucun agent disponible pour ce domaine  </MenuItem>}
              {agents.map((a: any) => (
                <MenuItem key={a.email} value={a.email}>
                  <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{a.nom} ({a.email})</span>
                    <Chip label={`${a.nbTickets ?? 0} dossier(s)`} size="small" color={a.nbTickets > 5 ? 'error' : a.nbTickets > 2 ? 'warning' : 'default'} sx={{ ml: 2 }} />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={confirmerAssignation} disabled={!agentEmail}>Assigner</Button>
        </DialogActions>
      </Dialog>

      {/* Assignation SISAV */}
      <Dialog open={assignSisavOpen} onClose={() => setAssignSisavOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transmettre {assignSisavTicket?.reference} au SISAV</DialogTitle>
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
          <Button onClick={() => setAssignSisavOpen(false)}>Annuler</Button>
          <Button variant="contained" color="secondary" onClick={confirmerAssignationSisav} disabled={!chefSisavEmail}>Transmettre au SISAV</Button>
        </DialogActions>
      </Dialog>

      {/* Commentaire */}
      <Dialog open={commentOpen} onClose={() => setCommentOpen(false)}>
        <DialogTitle>Ajouter un commentaire interne</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth multiline rows={4} sx={{ mt: 1 }}
            label="Commentaire"
            value={nouveauCommentaire}
            onChange={e => setNouveauCommentaire(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={envoyerCommentaire} disabled={!nouveauCommentaire.trim()}>Envoyer</Button>
        </DialogActions>
      </Dialog>

      {/* Clôture */}
      <Dialog open={closeOpen} onClose={() => setCloseOpen(false)}>
        <DialogTitle>Clôturer le ticket {ticketSelectionne?.reference} ?</DialogTitle>
        <DialogContent>
          <Typography>Cette action est irréversible. Le ticket sera marqué comme FERMÉ.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseOpen(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={confirmerCloture}>Clôturer</Button>
        </DialogActions>
      </Dialog>

      {/* Escalade N2 - Décision */}
      <Dialog open={escaladeDetailOpen} onClose={() => setEscaladeDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Demande d'escalade N2   {escaladeSelectionnee?.reclamationReference}</DialogTitle>
        <DialogContent>
          {escaladeSelectionnee && (
            <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2"><strong>Domaine :</strong> {escaladeSelectionnee.reclamationDomaine || 'MOBILE_MONEY'}</Typography>
              <Typography variant="body2"><strong>Motif de l'agent :</strong> {escaladeSelectionnee.motif || ' '}</Typography>
              <Typography variant="body2"><strong>Demandeur :</strong> {escaladeSelectionnee.agent || ' '}</Typography>
              {escaladeSelectionnee.statut === 'DEMANDE' && (
                <>
                  <Alert severity="warning">
                    Validez pour affecter le ticket à l'équipe Niveau 2, ou rejetez la demande (le dossier sera conservé au niveau 1).
                  </Alert>
                  <FormControl fullWidth>
                    <InputLabel>Équipe Niveau 2 cible</InputLabel>
                    <Select value={validationEquipeId} label="Équipe Niveau 2 cible" onChange={e => setValidationEquipeId(e.target.value)}>
                      {equipes.filter((e: any) => e.niveau === 'N2').map((e: any) => (
                        <MenuItem key={e.id} value={String(e.id)}>{e.nom} ({e.domaine})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Agent Niveau 2 (optionnel)</InputLabel>
                    <Select value={validationAgentEmail} label="Agent Niveau 2 (optionnel)" onChange={e => setValidationAgentEmail(e.target.value)}>
                      <MenuItem value="">  Affecter automatiquement  </MenuItem>
                      {agentsN2.map((a: any) => (
                        <MenuItem key={a.email} value={a.email}>{a.nom} ({a.email})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" color="success" onClick={confirmerValidationEscalade}>Valider & affecter N2</Button>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Rejeter la demande :</Typography>
                  <TextField
                    fullWidth size="small" label="Motif du rejet (obligatoire)"
                    value={rejetMotif} onChange={e => setRejetMotif(e.target.value)}
                  />
                  <Button variant="contained" color="error" disabled={!rejetMotif.trim()} onClick={() => { if (rejetMotif.trim()) confirmerRejetEscalade(); }}>
                    Confirmer le rejet
                  </Button>
                </>
              )}
              {escaladeSelectionnee.statut !== 'DEMANDE' && (
                <Alert severity="info">Cette demande d'escalade a été {escaladeSelectionnee.statut.toLowerCase()}.</Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEscaladeDetailOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagerDashboard;
