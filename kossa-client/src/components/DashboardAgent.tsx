import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { 
  Container, Typography, Paper, Alert, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, 
  InputLabel, FormHelperText, Stack, Box, Chip, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';

interface ReclamationRow {
  id: number;
  reference: string;
  description: string;
  priorite: string;
  statut: string;
  canal: string;
  type?: string;
  dateCreation: string;
  client?: { nom: string; prenom: string; msisdn: string };
  typeReclamation?: { nomType: string; sla?: { tempsMaximumHeures: number } };
}

const DashboardAgent = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ReclamationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });

  const [openCreate, setOpenCreate] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [detailedTicket, setDetailedTicket] = useState<any>(null);

  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const DOMAIN_TYPE_MAP: Record<string, string> = {
    'MOBILE_MONEY': 'Mobile Money',
    'FTTH': 'FTTH',
    'INTERNET': 'Internet',
    'TECHNIQUE': 'Technique',
    'FACTURATION': 'Facturation',
  };

  const SLA_PAR_TYPE: Record<string, string> = {
    'Mobile Money': '12h',
    'FTTH': '24h',
    'Internet': '24h',
    'Technique': '24h',
    'Facturation': '48h',
    'Autre': '24h',
  };

  const [agentDomaine, setAgentDomaine] = useState('');
  const [agentType, setAgentType] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(res => {
      const d = res.data.equipeSupport?.domaine || '';
      setAgentDomaine(d);
      const t = DOMAIN_TYPE_MAP[d] || d;
      setAgentType(t);
      setNewReclamation(prev => ({ ...prev, typeReclamation: t }));
    }).catch(() => {});
  }, []);

  const newReclamationInitial = {
    msisdn: '+226', nom: '', prenom: '', description: '',
    typeReclamation: 'Technique', priorite: 'MOYENNE', canal: 'Agence'
  };
  const [newReclamation, setNewReclamation] = useState(newReclamationInitial);

  const OP_PREFIXES = ['01','02','03','60','61','62','63','70','71','72','73'];

  const PLAN_ACTIONS_PAR_NATURE: Record<string, string[]> = {
    'Mobile Money': [
      'Contrôle du compte mobile money (solde et transactions)',
      'Reversement du montant débité sur le compte client',
      'Restauration du service après remboursement',
      'Suivi téléphonique client sous 24h'
    ],
    'FTTH': [
      'Diagnostic de la fibre optique et de l\'ONT',
      'Redémarrage / réinitialisation de l\'équipement client',
      'Programmation d\'une intervention terrain fibre',
      'Contrôle du câblage et de la box au domicile client'
    ],
    'Internet': [
      'Diagnostic de la connexion et du débit',
      'Réinitialisation du mot de passe Wi-Fi',
      'Redémarrage de la box internet',
      'Test de couverture et reprogrammation du routeur'
    ],
    'Facturation': [
      'Vérification de la facture et du montant prélevé',
      'Correction de la facturation après contrôle',
      'Émission d\'une facture rectificative',
      'Remboursement / avoir client'
    ],
    'Technique': [
      'Diagnostic technique initial du problème',
      'Réparation / configuration à distance',
      'Escalade vers le niveau 2 si non résolu',
      'Contrôle final et confirmation de résolution'
    ]
  };

  const handleMsisdnChange = (value: string) => {
    let v = value.replace(/[^0-9]/g, '');
    if (v.startsWith('226')) v = v.substring(3);
    v = v.length > 8 ? v.slice(0, 8) : v;
    setNewReclamation({ ...newReclamation, msisdn: '+226' + v });
  };

  const validerFormulaire = () => {
    const errs: Record<string, string> = {};
    const nom = newReclamation.nom.trim();
    const prenom = newReclamation.prenom.trim();
    const description = newReclamation.description.trim();

    const msisdn = newReclamation.msisdn.trim();
    let clean = msisdn;
    if (clean.startsWith('+226')) clean = clean.substring(4);
    else if (clean.startsWith('00226')) clean = clean.substring(5);
    else if (clean.startsWith('226')) clean = clean.substring(3);
    if (!msisdn) errs.msisdn = 'Le numéro MSISDN est obligatoire';
    else if (!/^[0-9]{8}$/.test(clean)) errs.msisdn = "Le MSISDN doit contenir l'indicatif +226 suivi de 8 chiffres";
    else {
      const prefixe = clean.substring(0, 2);
      if (!OP_PREFIXES.includes(prefixe)) errs.msisdn = `Numéro non reconnu comme numéro KOSSA (préfixe ${prefixe} non autorisé)`;
    }

    if (!nom) errs.nom = 'Le nom est obligatoire';
    else if (nom.length < 2 || nom.length > 60) errs.nom = 'Le nom doit contenir entre 2 et 60 caractères';
    else if (!/^[\p{L} ' -]+$/u.test(nom)) errs.nom = 'Le nom contient des caractères non autorisés';

    if (prenom && (prenom.length > 60 || !/^[\p{L} ' -]*$/u.test(prenom))) errs.prenom = 'Le prénom contient des caractères non autorisés';

    if (!description) errs.description = 'La description est obligatoire';
    else if (description.length < 10 || description.length > 2000) errs.description = 'La description doit contenir entre 10 et 2000 caractères';
    else if (!/^[\p{L}0-9 .,;:!?'"()/\-éèêëàâîôûùçÉÈÊËÀÂÎÔÛÙÇ%€]+$/u.test(description)) errs.description = 'La description contient des caractères non autorisés';

    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const [openProcess, setOpenProcess] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ReclamationRow | null>(null);
  const [processData, setProcessData] = useState({
    statut: '', commentaire: '', planAction: '', planActionDetail: ''
  });
  const [statutsSuivants, setStatutsSuivants] = useState<string[]>([]);

  const STATUTS_AGENT: Record<string, string> = {
    'EN_COURS': 'En cours de traitement',
    'EN_TRAITEMENT': 'Prise en traitement',
    'REGULARISEE': 'Régularisation immédiate (N1)',
    'RESOLU': 'Marquer comme Résolu',
    'CLOTURE': 'Clôturer le dossier',
    'REOUVERT': 'Réouvrir le dossier',
    'ASSIGNE_SISAV': 'Transmettre au SISAV',
    'EN_ATTENTE_SUPERVISEUR': 'Soumettre au Superviseur'
  };

  const openProcessForTicket = (ticket: ReclamationRow) => {
    setSelectedTicket(ticket);
    setProcessData({ statut: '', commentaire: '', planAction: '', planActionDetail: '' });
    api.get(`/reclamations/statuts-suivants?statut=${ticket.statut}`)
      .then(res => {
        const statuts = (res.data || []).filter((s: string) => s !== 'ASSIGNE_SISAV');
        setStatutsSuivants(statuts);
      })
      .catch(() => setStatutsSuivants([]));
    setOpenProcess(true);
  };
  const [openEscalade, setOpenEscalade] = useState(false);
  const [escaladeMotif, setEscaladeMotif] = useState('');

  const planActionsDisponibles = selectedTicket
    ? (PLAN_ACTIONS_PAR_NATURE[selectedTicket.type || ''] || PLAN_ACTIONS_PAR_NATURE['Technique'])
    : [];

  const [openEdit, setOpenEdit] = useState(false);
  const [editTicket, setEditTicket] = useState<any>(null);
  const [editData, setEditData] = useState({ description: '', priorite: '', canalNom: '' });

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteTicketId, setDeleteTicketId] = useState<number | null>(null);

  const [openBatchDeleteConfirm, setOpenBatchDeleteConfirm] = useState(false);

  const loadTickets = useCallback(() => {
    api.get('/reclamations')
      .then(res => setRows(res.data))
      .catch(() => setError("Impossible de charger les réclamations."));
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = rows.filter(r =>
        r.reference?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.client?.nom?.toLowerCase().includes(term) ||
        r.client?.prenom?.toLowerCase().includes(term) ||
        r.client?.msisdn?.toLowerCase().includes(term) ||
        r.type?.toLowerCase().includes(term)
      );
    }
    return result.sort((a: any, b: any) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, [rows, searchTerm]);

  const handleOpenDetails = (id: number) => {
    api.get(`/reclamations/${id}`)
      .then(res => { setDetailedTicket(res.data); setOpenDetails(true); })
      .catch(() => setError("Impossible de charger les détails."));
  };

  const handlePrint = () => {
    if (!detailedTicket) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const client = detailedTicket.client || {};
    const commentaires: any[] = detailedTicket.commentaires || [];
    const logoUrl = window.location.origin + '/logo.svg';
    w.document.write(`
      <html>
      <head>
        <title>Ticket ${detailedTicket.reference}</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 20px; }
          .header { text-align: center; border-bottom: 3px solid #155E75; padding-bottom: 15px; margin-bottom: 25px; }
          .header img { height: 50px; margin-bottom: 8px; }
          .header h1 { color: #155E75; margin: 0; font-size: 22px; }
          .header p { color: #555; margin: 5px 0 0; font-size: 13px; }
          .section { margin-bottom: 20px; }
          .section h2 { color: #155E75; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          table td { padding: 6px 10px; border: 1px solid #e0e0e0; font-size: 13px; }
          table td:first-child { font-weight: 600; width: 160px; background: #f5f7fa; }
          .comment { margin-bottom: 10px; padding: 8px 12px; background: #f9f9f9; border-left: 3px solid #FB7185; border-radius: 4px; }
          .comment strong { font-size: 12px; color: #555; }
          .comment p { margin: 3px 0 0; font-size: 13px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #888; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="KOSSA" onerror="this.style.display='none'" />
          <h1>KOSSA</h1>
          <p>Réf. ${detailedTicket.reference}   ${new Date(detailedTicket.dateCreation || detailedTicket.date_creation).toLocaleDateString('fr-FR')}</p>
        </div>
        <div class="section">
          <h2>Informations Client</h2>
          <table>
            <tr><td>Nom</td><td>${client.nom || ' '}</td></tr>
            <tr><td>Prénom</td><td>${client.prenom || ' '}</td></tr>
            <tr><td>Téléphone</td><td>${client.msisdn || ' '}</td></tr>
            <tr><td>Adresse</td><td>${client.adresse || ' '}</td></tr>
          </table>
        </div>
        <div class="section">
          <h2>Détails du ticket</h2>
          <table>
            <tr><td>Catégorie</td><td>${detailedTicket.typeReclamation?.nomType || detailedTicket.type || ' '}</td></tr>
            <tr><td>Priorité</td><td>${detailedTicket.priorite || ' '}</td></tr>
            <tr><td>Statut</td><td>${detailedTicket.statut || ' '}</td></tr>
            <tr><td>Canal</td><td>${detailedTicket.canalNom || detailedTicket.canal || ' '}</td></tr>
            <tr><td>Description</td><td>${detailedTicket.description || ' '}</td></tr>
          </table>
        </div>
        <div class="section">
          <h2>Actions effectuées</h2>
          ${commentaires.length > 0
            ? [...commentaires].sort((a: any, b: any) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime()).map(c =>
              `<div class="comment"><strong>${c.auteur || 'Agent'}   ${new Date(c.dateAction).toLocaleString('fr-FR')}</strong><p>${c.contenu}</p></div>`
            ).join('')
            : '<p style="color:#888;">Aucune action enregistrée.</p>'}
        </div>
        <div class="footer">
          Document généré par KOSSA   ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
        </div>
        <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)};</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validerFormulaire()) return;
    const payload = {
      msisdn: newReclamation.msisdn.trim(),
      nom: newReclamation.nom.trim(),
      prenom: newReclamation.prenom.trim(),
      description: newReclamation.description.trim(),
      type: newReclamation.typeReclamation,
      priorite: newReclamation.priorite,
      canalNom: newReclamation.canal
    };
    api.post('/reclamations', payload)
      .then(() => {
        setSuccess("Dossier de réclamation ouvert avec succès !");
        setOpenCreate(false);
        setNewReclamation({ ...newReclamationInitial });
        setCreateErrors({});
        loadTickets();
      })
      .catch(() => setError("Erreur de création du ticket. Vérifiez les informations saisies."));
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    const planAction = [processData.planAction, processData.planActionDetail?.trim()]
      .filter(Boolean)
      .join('   ');
    api.put(`/reclamations/${selectedTicket.id}/statut`, { ...processData, planAction })
      .then(() => {
        setSuccess(`Le ticket ${selectedTicket.reference} a été mis à jour.`);
        setOpenProcess(false);
        setSelectedTicket(null);
        setProcessData({ statut: '', commentaire: '', planAction: '', planActionDetail: '' });
        loadTickets();
      })
      .catch(err => {
        const msg = err.response?.data?.message || err.response?.data?.error;
        setError(msg ? `Enregistrement refusé : ${msg}` : "Erreur lors du traitement. Vérifiez que le statut est autorisé pour ce dossier.");
      });
  };

  const handleDemanderEscalade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!escaladeMotif.trim() || escaladeMotif.trim().length < 5) {
      setError("Le motif de l'escalade est requis (5 caractères minimum).");
      return;
    }
    api.post(`/reclamations/${selectedTicket.id}/demander-escalade`, { motif: escaladeMotif.trim() })
      .then(() => {
        setSuccess(`Demande d'escalade N2 soumise pour le ticket ${selectedTicket.reference}. En attente de validation du Manager.`);
        setOpenEscalade(false);
        setOpenProcess(false);
        setEscaladeMotif('');
        setSelectedTicket(null);
        loadTickets();
      })
      .catch(err => setError(err.response?.data?.message || "Erreur lors de la demande d'escalade."));
  };

  const handleOpenEdit = (ticket: ReclamationRow) => {
    setEditTicket(ticket);
    setEditData({ description: ticket.description, priorite: ticket.priorite, canalNom: ticket.canal || '' });
    setOpenEdit(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTicket) return;
    api.put(`/reclamations/${editTicket.id}`, editData)
      .then(() => {
        setSuccess(`Ticket ${editTicket.reference} modifié avec succès.`);
        setOpenEdit(false);
        setEditTicket(null);
        loadTickets();
      })
      .catch((err) => setError("Erreur lors de la modification : " + (err.response?.data?.message || err.message)));
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTicketId(id);
    setOpenDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTicketId == null) return;
    api.delete(`/reclamations/${deleteTicketId}`)
      .then(() => {
        setSuccess("Ticket supprimé avec succès.");
        setOpenDeleteConfirm(false);
        setDeleteTicketId(null);
        loadTickets();
      })
      .catch(() => setError("Erreur lors de la suppression."));
  };

  const handleBatchDeleteConfirm = () => {
    const ids = Array.from(rowSelectionModel.ids);
    if (ids.length === 0) return;
    api.delete('/reclamations/batch', { data: ids })
      .then(() => {
        setSuccess(`${ids.length} ticket(s) supprimé(s) avec succès.`);
        setOpenBatchDeleteConfirm(false);
        setRowSelectionModel({ type: 'include', ids: new Set() });
        loadTickets();
      })
      .catch(() => setError("Erreur lors de la suppression multiple."));
  };

  const nbSelected = rowSelectionModel.ids.size;

  const columns: GridColDef[] = [
    { field: 'reference', headerName: 'Référence', width: 120 },
    { field: 'priorite', headerName: 'Priorité', width: 100, renderCell: (params) => (
      <Chip label={params.value} color={params.value === 'CRITIQUE' ? 'error' : params.value === 'MOYENNE' ? 'warning' : 'default'} size="small" />
    )},
    { field: 'statut', headerName: 'Statut', width: 120, renderCell: (params) => (
      <Chip label={params.value} variant="outlined" color="primary" size="small" />
    )},
    { field: 'dateCreation', headerName: 'Créé le', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Détails"><IconButton size="small" color="info" onClick={() => handleOpenDetails(params.row.id)}><PrintIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Traiter"><IconButton size="small" color="primary" onClick={() => openProcessForTicket(params.row as ReclamationRow)}><AddIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Modifier"><IconButton size="small" color="secondary" onClick={() => handleOpenEdit(params.row as ReclamationRow)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => handleDeleteClick(params.row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ mt: 0 }}>
      <Box className="kossa-banner" sx={{ background: 'linear-gradient(135deg, #0E4557 0%, #155E75 60%, #2C7E99 100%)', borderRadius: 4, p: 3.5, mb: 3, boxShadow: '0 20px 40px rgba(14,69,87,0.35)', border: '1px solid rgba(251,113,133,0.35)' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>
              KOSSA
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Espace Agent   Gestion des échéances, escalades et plans d'actions
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<BarChartIcon />} onClick={() => navigate('/statistiques')}
              sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              Mes Stats
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}
              sx={{ bgcolor: '#FB7185', '&:hover': { bgcolor: '#F43F5E' } }}>
              Ouvrir un Dossier
            </Button>
          </Stack>
        </Stack>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ mb: 2, p: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <SearchIcon sx={{ color: 'action.active' }} />
          <TextField
            size="small"
            fullWidth
            placeholder="Rechercher par référence, client, MSISDN, description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            variant="standard"
            sx={{ flex: 1 }}
          />
          {nbSelected > 0 && (
            <Button size="small" onClick={() => setRowSelectionModel({ type: 'include', ids: new Set() })}>
              Tout désélectionner
            </Button>
          )}
          {nbSelected === 0 && filteredRows.length > 0 && (
            <Button size="small" onClick={() => setRowSelectionModel({ type: 'include', ids: new Set(filteredRows.map(r => r.id)) })}>
              Tout sélectionner
            </Button>
          )}
          {nbSelected > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setOpenBatchDeleteConfirm(true)}
            >
              Supprimer ({nbSelected})
            </Button>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ height: 450, width: '100%', p: 2 }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
          getRowId={(row) => row.id}
        />
      </Paper>

      {/* MODAL CREATION */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Enregistrer une Réclamation (Saisie Agent)</DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField label="MSISDN (Numéro Client)" required fullWidth value={newReclamation.msisdn} error={!!createErrors.msisdn} helperText={createErrors.msisdn || "L'indicatif +226 est pré-rempli : saisissez uniquement les 8 chiffres du numéro (ex : +22670010203)"} onChange={e => handleMsisdnChange(e.target.value)} />
              <Stack direction="row" spacing={2}>
                <TextField label="Nom" required fullWidth value={newReclamation.nom} error={!!createErrors.nom} helperText={createErrors.nom} onChange={e => setNewReclamation({...newReclamation, nom: e.target.value})} />
                <TextField label="Prénom" required fullWidth value={newReclamation.prenom} error={!!createErrors.prenom} helperText={createErrors.prenom} onChange={e => setNewReclamation({...newReclamation, prenom: e.target.value})} />
              </Stack>
              <FormControl fullWidth required>
                <InputLabel>Canal d'entrée</InputLabel>
                <Select value={newReclamation.canal} label="Canal d'entrée" onChange={e => setNewReclamation({...newReclamation, canal: e.target.value})}>
                  <MenuItem value="Agence">Agence</MenuItem>
                  <MenuItem value="Call Center">Call Center</MenuItem>
                  <MenuItem value="Réseaux Sociaux">Réseaux Sociaux</MenuItem>
                  <MenuItem value="Web">Web</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Domaine / Type de problème"
                fullWidth
                required
                value={agentType || 'Chargement...'}
                slotProps={{ input: { readOnly: true } }}
                helperText={agentDomaine ? `Automatiquement défini selon votre équipe (${agentDomaine})` : ''}
              />
              <FormControl fullWidth required>
                <InputLabel>Priorité</InputLabel>
                <Select value={newReclamation.priorite} label="Priorité" onChange={e => setNewReclamation({...newReclamation, priorite: e.target.value})}>
                  <MenuItem value="FAIBLE">Faible</MenuItem>
                  <MenuItem value="MOYENNE">Moyenne</MenuItem>
                  <MenuItem value="CRITIQUE">Critique</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Détail de la plainte" multiline rows={3} required fullWidth value={newReclamation.description} error={!!createErrors.description} helperText={createErrors.description} onChange={e => setNewReclamation({...newReclamation, description: e.target.value})} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Annuler</Button>
            <Button type="submit" variant="contained">Créer le ticket</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MODAL TRAITEMENT */}
      <Dialog open={openProcess} onClose={() => setOpenProcess(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Traitement du dossier {selectedTicket?.reference}</DialogTitle>
        <form onSubmit={handleProcessSubmit}>
          <DialogContent>
            {selectedTicket && (
              <Stack spacing={2}>
                <Typography variant="body2"><strong>Description initiale :</strong> {selectedTicket.description}</Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Affectation :</strong> réservée au Manager (selon le groupe de compétence).
                </Typography>
                <FormControl fullWidth required>
                  <InputLabel>Nouveau Statut (Workflow)</InputLabel>
                  <Select value={processData.statut} label="Nouveau Statut (Workflow)" onChange={e => setProcessData({...processData, statut: e.target.value})}>
                    {statutsSuivants.length === 0 && <MenuItem value="" disabled>Aucune transition autorisée depuis « {selectedTicket.statut} »</MenuItem>}
                    {statutsSuivants.map(s => (
                      <MenuItem key={s} value={s}>{STATUTS_AGENT[s] || s}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Enchaînement strict : statut actuel « {selectedTicket.statut} ». Seules les transitions autorisées à cette étape sont proposées.
                  </FormHelperText>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Plan d'actions (selon la nature)</InputLabel>
                  <Select
                    label="Plan d'actions (selon la nature)"
                    value={processData.planAction}
                    onChange={e => setProcessData({...processData, planAction: e.target.value})}
                  >
                    <MenuItem value=""><em>Aucune action prédéfinie</em></MenuItem>
                    {planActionsDisponibles.map(a => (
                      <MenuItem key={a} value={a}>{a}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Actions proposées selon la nature « {selectedTicket?.type || ' '} ».</FormHelperText>
                </FormControl>
                <TextField label="Détail complémentaire du plan d'actions" multiline rows={2} fullWidth placeholder="Précisions éventuelles sur le plan d'actions..." value={processData.planActionDetail || ''} onChange={e => setProcessData({...processData, planActionDetail: e.target.value})} />
                <TextField label="Description du traitement" multiline rows={2} required fullWidth placeholder="Ajouter une trace de traitement..." value={processData.commentaire} onChange={e => setProcessData({...processData, commentaire: e.target.value})} />
                <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                  Impossible de résoudre ce dossier ? Demandez une escalade vers l'équipe Niveau 2 spécialisée   le Manager devra valider.
                </Alert>
                <Button variant="outlined" color="warning" startIcon={<TrendingUpIcon />} onClick={() => setOpenEscalade(true)}>
                  Demander une escalade N2
                </Button>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProcess(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="success">Enregistrer les actions</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MODAL DEMANDE ESCALADE */}
      <Dialog open={openEscalade} onClose={() => setOpenEscalade(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Demande d'escalade N2   {selectedTicket?.reference}</DialogTitle>
        <form onSubmit={handleDemanderEscalade}>
          <DialogContent>
            <Stack spacing={2}>
              <Alert severity="warning">
                Toute réclamation passe d'abord par le niveau 1. L'escalade vers le niveau 2 nécessite la validation du Manager, qui affectera le dossier à l'équipe spécialisée correspondante.
              </Alert>
              <TextField
                label="Motif de l'escalade"
                multiline
                rows={3}
                required
                fullWidth
                placeholder="Décrivez pourquoi ce dossier doit être escaladé au niveau 2..."
                value={escaladeMotif}
                onChange={e => setEscaladeMotif(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEscalade(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="warning" disabled={!escaladeMotif.trim()}>Soumettre la demande</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MODAL EDITION */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Modifier le ticket {editTicket?.reference}</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            {editTicket && (
              <Stack spacing={2}>
                <TextField label="Description" multiline rows={3} required fullWidth value={editData.description}
                  onChange={e => setEditData({...editData, description: e.target.value})} />
                <FormControl fullWidth required>
                  <InputLabel>Priorité</InputLabel>
                  <Select value={editData.priorite} label="Priorité"
                    onChange={e => setEditData({...editData, priorite: e.target.value})}>
                    <MenuItem value="FAIBLE">Faible</MenuItem>
                    <MenuItem value="MOYENNE">Moyenne</MenuItem>
                    <MenuItem value="CRITIQUE">Critique</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>Canal</InputLabel>
                  <Select value={editData.canalNom} label="Canal"
                    onChange={e => setEditData({...editData, canalNom: e.target.value})}>
                    <MenuItem value="Agence">Agence</MenuItem>
                    <MenuItem value="Call Center">Call Center</MenuItem>
                    <MenuItem value="Réseaux Sociaux">Réseaux Sociaux</MenuItem>
                    <MenuItem value="Web">Web</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="secondary">Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CONFIRMATION SUPPRESSION UNIQUE */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRMATION SUPPRESSION MULTIPLE */}
      <Dialog open={openBatchDeleteConfirm} onClose={() => setOpenBatchDeleteConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirmer la suppression multiple</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer les {rowSelectionModel.ids.size} ticket(s) sélectionné(s) ? Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBatchDeleteConfirm(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleBatchDeleteConfirm}>Tout supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DETAILS */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', pb: 1 }}>
          Détails complets du ticket : {detailedTicket?.reference}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {detailedTicket && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>INFORMATIONS CLIENT</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                  <Stack direction="row" spacing={4}>
                    <Box><Typography variant="body2"><strong>Nom :</strong> {detailedTicket.client?.nom}</Typography><Typography variant="body2"><strong>Prénom :</strong> {detailedTicket.client?.prenom}</Typography></Box>
                    <Box><Typography variant="body2"><strong>MSISDN :</strong> {detailedTicket.client?.msisdn}</Typography><Typography variant="body2"><strong>Adresse :</strong> {detailedTicket.client?.adresse || "N/A"}</Typography></Box>
                  </Stack>
                </Paper>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>DÉTAILS DE LA PLAINTE</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2"><strong>Catégorie :</strong> {detailedTicket.typeReclamation?.nomType}</Typography>
                  <Typography variant="body2"><strong>Priorité :</strong> {detailedTicket.priorite}</Typography>
                  <Typography variant="body2"><strong>Statut :</strong> {detailedTicket.statut}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Description :</strong></Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ bgcolor: '#f4f4f4', p: 1, borderRadius: 1 }}>{detailedTicket.description}</Typography>
                </Paper>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>HISTORIQUE DES ACTIONS</Typography>
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 150, overflowY: 'auto' }}>
                  {[...(detailedTicket.commentaires || [])].sort((a: any, b: any) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime()).map((c: any, index: number) => (
                    <Box key={index} sx={{ mb: 1.5, pb: 1, borderBottom: '1px dashed #eee' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{c.auteur} - {new Date(c.dateAction).toLocaleString()}</Typography>
                      <Typography variant="body2" color="textSecondary">{c.contenu}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #ccc', pt: 1 }}>
          <Button onClick={handlePrint} startIcon={<PrintIcon />} color="secondary">Imprimer</Button>
          <Button onClick={() => setOpenDetails(false)} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardAgent;
