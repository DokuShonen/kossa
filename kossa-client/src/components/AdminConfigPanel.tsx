import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Container, Typography, Paper, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, Box, Tabs, Tab, Chip, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ConfirmDialog from './ConfirmDialog';
import api from '../services/api';

interface CategorieRow { id: number; nom: string; description: string; sla: { id: number; tempsMaximumHeures: number; niveau: string } | null; }
interface SLARow { id: number; tempsMaximumHeures: number; niveau: string }
interface TypeRow { id: number; nomType: string }

const AdminConfigPanel = () => {
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'categorie' | 'type' | 'sla'; id: number; message: string }>({ open: false, type: 'categorie', id: 0, message: '' });

  const [categories, setCategories] = useState<CategorieRow[]>([]);
  const [openCategorie, setOpenCategorie] = useState(false);
  const [editCategorieId, setEditCategorieId] = useState<number | null>(null);
  const [slaList, setSlaList] = useState<SLARow[]>([]);
  const [categorieForm, setCategorieForm] = useState({ nom: '', description: '', slaId: '' });

  const [slas, setSlas] = useState<SLARow[]>([]);
  const [openSLA, setOpenSLA] = useState(false);
  const [editSLAId, setEditSLAId] = useState<number | null>(null);
  const [slaForm, setSlaForm] = useState({ tempsMaximumHeures: 24, niveau: 'STANDARD' });

  const [types, setTypes] = useState<TypeRow[]>([]);
  const [openType, setOpenType] = useState(false);
  const [editTypeId, setEditTypeId] = useState<number | null>(null);
  const [typeForm, setTypeForm] = useState({ nomType: '' });

  const extraireContenu = (res: any) => Array.isArray(res.data) ? res.data : (res.data.content || []);

  const loadCategories = () => api.get('/admin/config/categories?size=100').then(res => setCategories(extraireContenu(res))).catch(() => setError("Accès refusé pour le chargement des catégories."));
  const loadSlas = () => api.get('/admin/config/sla?size=100').then(res => {
    const data = extraireContenu(res);
    setSlas(data);
    setSlaList(data);
  }).catch(() => setError("Accès refusé pour le chargement des SLA."));
  const loadTypes = () => api.get('/admin/config/types-reclamation?size=100').then(res => setTypes(extraireContenu(res))).catch(() => setError("Accès refusé pour le chargement des types."));

  useEffect(() => {
    loadCategories();
    loadSlas();
    loadTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, v: number) => setTab(v);

  const slasDisponibles = slaList.filter(s => {
    const assigne = categories.some(c => c.sla && c.sla.id === s.id && c.id !== editCategorieId);
    return !assigne;
  });

  const handleCategorieSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categorieForm.nom.trim()) { setError("Le nom de la catégorie est obligatoire."); return; }
    const payload: any = { nom: categorieForm.nom.trim(), description: categorieForm.description.trim(), slaId: categorieForm.slaId ? Number(categorieForm.slaId) : null };
    const req = editCategorieId
      ? api.put(`/admin/config/categories/${editCategorieId}`, payload)
      : api.post('/admin/config/categories', payload);
    req.then(() => {
      setSuccess(editCategorieId ? "Catégorie mise à jour." : "Catégorie créée avec succès.");
      setOpenCategorie(false); setEditCategorieId(null);
      setCategorieForm({ nom: '', description: '', slaId: '' });
      loadCategories();
    }).catch(() => setError("Erreur lors de l'enregistrement de la catégorie."));
  };

  const handleDeleteCategorie = (id: number) => {
    api.delete(`/admin/config/categories/${id}`).then(() => { setSuccess("Catégorie supprimée."); loadCategories(); }).catch(() => setError("Impossible de supprimer cette catégorie."));
  };

  const handleSLASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slaForm.tempsMaximumHeures || slaForm.tempsMaximumHeures <= 0) { setError("Le temps maximum est obligatoire et doit être supérieur à 0."); return; }
    const payload = { tempsMaximumHeures: Number(slaForm.tempsMaximumHeures), niveau: slaForm.niveau };
    const req = editSLAId
      ? api.put(`/admin/config/sla/${editSLAId}`, payload)
      : api.post('/admin/config/sla', payload);
    req.then(() => {
      setSuccess(editSLAId ? "SLA mis à jour." : "SLA créé avec succès.");
      setOpenSLA(false); setEditSLAId(null);
      setSlaForm({ tempsMaximumHeures: 24, niveau: 'STANDARD' });
      loadSlas();
    }).catch(() => setError("Erreur lors de l'enregistrement du SLA."));
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.nomType.trim()) { setError("Le type de réclamation est obligatoire."); return; }
    const req = editTypeId
      ? api.put(`/admin/config/types-reclamation/${editTypeId}`, { nomType: typeForm.nomType.trim() })
      : api.post('/admin/config/types-reclamation', { nomType: typeForm.nomType.trim() });
    req.then(() => {
      setSuccess(editTypeId ? "Type de réclamation modifié." : "Type de réclamation créé.");
      setOpenType(false); setEditTypeId(null); setTypeForm({ nomType: '' }); loadTypes();
    }).catch((err) => setError(err.response?.data?.message || "Erreur lors de l'enregistrement du type."));
  };

  const handleDeleteSLA = (id: number) => {
    api.delete(`/admin/config/sla/${id}`)
      .then(() => { setSuccess("SLA supprimé."); loadSlas(); })
      .catch((err) => setError(err.response?.data?.message || "Impossible de supprimer ce SLA (peut-être encore utilisé par une catégorie)."));
  };

  const handleDeleteType = (id: number) => {
    api.delete(`/admin/config/types-reclamation/${id}`)
      .then(() => { setSuccess("Type de réclamation supprimé."); loadTypes(); })
      .catch((err) => setError(err.response?.data?.message || "Impossible de supprimer ce type de réclamation."));
  };

  const confirmSuppression = (type: 'categorie' | 'type' | 'sla', id: number, message: string) => {
    setConfirmDialog({ open: true, type, id, message });
  };

  const executerSuppression = () => {
    if (confirmDialog.type === 'categorie') handleDeleteCategorie(confirmDialog.id);
    else if (confirmDialog.type === 'type') handleDeleteType(confirmDialog.id);
    else handleDeleteSLA(confirmDialog.id);
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

  const categorieColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'nom', headerName: 'Catégorie', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    {
      field: 'sla', headerName: 'SLA associé', width: 200,
      renderCell: (params) => params.value
        ? <Chip label={`${params.value.niveau} · ${params.value.tempsMaximumHeures}h`} color="primary" size="small" />
        : <Typography variant="body2" color="text.secondary">Aucun</Typography>
    },
    {
      field: 'actions', headerName: 'Actions', width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" color="primary" onClick={() => {
            setEditCategorieId(params.row.id);
            setCategorieForm({ nom: params.row.nom, description: params.row.description || '', slaId: params.row.sla ? String(params.row.sla.id) : '' });
            setOpenCategorie(true);
          }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => confirmSuppression('categorie', params.row.id, `Supprimer la catégorie "${params.row.nom}" ?`)}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      )
    }
  ];

  const slaColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'niveau', headerName: 'Niveau', width: 160 },
    { field: 'tempsMaximumHeures', headerName: 'Délai max (heures)', width: 180 },
    {
      field: 'actions', headerName: 'Actions', width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" color="primary" onClick={() => {
            setEditSLAId(params.row.id);
            setSlaForm({ tempsMaximumHeures: params.row.tempsMaximumHeures, niveau: params.row.niveau });
            setOpenSLA(true);
          }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => confirmSuppression('sla', params.row.id, `Supprimer le SLA "${params.row.niveau} · ${params.row.tempsMaximumHeures}h" ?`)}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      )
    }
  ];

  const typeColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'nomType', headerName: 'Type de réclamation', width: 300 },
    {
      field: 'actions', headerName: 'Actions', width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" color="primary" onClick={() => {
            setEditTypeId(params.row.id);
            setTypeForm({ nomType: params.row.nomType });
            setOpenType(true);
          }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => confirmSuppression('type', params.row.id, `Supprimer le type de réclamation "${params.row.nomType}" ?`)}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Box className="kossa-banner" sx={{ background: 'linear-gradient(135deg, #0E4557 0%, #155E75 60%, #2C7E99 100%)', borderRadius: 4, p: 3.5, mb: 3, boxShadow: '0 20px 40px rgba(14,69,87,0.35)', border: '1px solid rgba(251,113,133,0.35)' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
          Configuration & Référentiel
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
          Gestion des catégories, des SLA et des types de réclamations
        </Typography>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }} aria-label="Configuration admin">
        <Tab icon={<CategoryIcon />} iconPosition="start" label="Catégories" />
        <Tab icon={<AccessTimeIcon />} iconPosition="start" label="SLA" />
        <Tab label="Types de réclamation" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Catégories de réclamations</Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#FB7185', '&:hover': { bgcolor: '#F43F5E' } }}
              onClick={() => { setEditCategorieId(null); setCategorieForm({ nom: '', description: '', slaId: '' }); setOpenCategorie(true); }}>
              Ajouter une catégorie
            </Button>
          </Stack>
          <Box sx={{ height: 420 }}>
            <DataGrid rows={categories} columns={categorieColumns} disableRowSelectionOnClick pageSizeOptions={[5, 10, 25]} getRowId={(r) => r.id} />
          </Box>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Niveaux de Service (SLA)</Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#FB7185', '&:hover': { bgcolor: '#F43F5E' } }}
              onClick={() => { setEditSLAId(null); setSlaForm({ tempsMaximumHeures: 24, niveau: 'STANDARD' }); setOpenSLA(true); }}>
              Ajouter un SLA
            </Button>
          </Stack>
          <Box sx={{ height: 420 }}>
            <DataGrid rows={slas} columns={slaColumns} disableRowSelectionOnClick pageSizeOptions={[5, 10, 25]} getRowId={(r) => r.id} />
          </Box>
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Types de réclamation</Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#FB7185', '&:hover': { bgcolor: '#F43F5E' } }}
              onClick={() => { setEditTypeId(null); setTypeForm({ nomType: '' }); setOpenType(true); }}>
              Ajouter un type
            </Button>
          </Stack>
          <Box sx={{ height: 420 }}>
            <DataGrid rows={types} columns={typeColumns} disableRowSelectionOnClick pageSizeOptions={[5, 10, 25]} getRowId={(r) => r.id} />
          </Box>
        </Paper>
      )}

      <Dialog open={openCategorie} onClose={() => setOpenCategorie(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editCategorieId ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
        <form onSubmit={handleCategorieSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField label="Nom de la catégorie" required fullWidth value={categorieForm.nom} onChange={e => setCategorieForm({ ...categorieForm, nom: e.target.value })} />
              <TextField label="Description" multiline minRows={3} fullWidth value={categorieForm.description} onChange={e => setCategorieForm({ ...categorieForm, description: e.target.value })} />
              <TextField
                select label="SLA associé (optionnel)" fullWidth value={categorieForm.slaId}
                onChange={e => setCategorieForm({ ...categorieForm, slaId: e.target.value })} slotProps={{ select: { native: true } }}
                helperText={slasDisponibles.length === 0 ? "Tous les SLA sont déjà affectés à une catégorie." : undefined}>
                <option value="">Aucun</option>
                {slasDisponibles.map(s => <option key={s.id} value={s.id}>{s.niveau} · {s.tempsMaximumHeures}h</option>)}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCategorie(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="error">Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openSLA} onClose={() => setOpenSLA(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editSLAId ? "Modifier le SLA" : "Nouveau SLA"}</DialogTitle>
        <form onSubmit={handleSLASubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField label="Niveau" fullWidth value={slaForm.niveau} onChange={e => setSlaForm({ ...slaForm, niveau: e.target.value })} />
              <TextField label="Délai maximum (heures)" type="number" required fullWidth value={slaForm.tempsMaximumHeures} onChange={e => setSlaForm({ ...slaForm, tempsMaximumHeures: Number(e.target.value) })} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSLA(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="error">Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openType} onClose={() => setOpenType(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editTypeId ? "Modifier le type de réclamation" : "Nouveau type de réclamation"}</DialogTitle>
        <form onSubmit={handleTypeSubmit}>
          <DialogContent>
            <TextField label="Nom du type" required fullWidth value={typeForm.nomType} onChange={e => setTypeForm({ nomType: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenType(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="error">Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.type === 'categorie' ? 'Supprimer la catégorie' : confirmDialog.type === 'type' ? 'Supprimer le type' : 'Supprimer le SLA'}
        message={confirmDialog.message}
        onConfirm={executerSuppression}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Container>
  );
};

export default AdminConfigPanel;