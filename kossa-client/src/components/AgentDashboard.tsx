import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Grid, Paper, Box, Stack, CircularProgress, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/stats/agent')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <Container sx={{ mt: 4, textAlign: 'center' }}><CircularProgress /><Typography sx={{ mt: 2 }}>Chargement de vos statistiques...</Typography></Container>;

  const statutData = {
    labels: Object.keys(stats.parStatut || {}),
    datasets: [{
      label: 'Mes tickets par Statut',
      data: Object.values(stats.parStatut || {}),
      backgroundColor: ['#1e88e5', '#4caf50', '#ffb300', '#f44336']
    }]
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box className="kossa-banner" sx={{ background: 'linear-gradient(135deg, #0E4557 0%, #155E75 60%, #2C7E99 100%)', borderRadius: 4, p: 3.5, mb: 3, boxShadow: '0 20px 40px rgba(14,69,87,0.35)', border: '1px solid rgba(251,113,133,0.35)' }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}
            sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}>
            Mes Tickets
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
            Mes Statistiques
          </Typography>
        </Stack>
      </Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Répartition de mes tickets</Typography>
            <Box sx={{ height: 250 }}><Doughnut data={statutData} /></Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4">Total traités: {stats.total}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AgentDashboard;
