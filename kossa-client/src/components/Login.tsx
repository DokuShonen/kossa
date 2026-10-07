import React, { useState } from 'react';
import { TextField, Button, Typography, Alert, Box } from '@mui/material';
import PasswordInput from './PasswordInput';
import api from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    api.post('/auth/login', { email, password })
      .then(res => {
        const user = res.data;
        localStorage.setItem('token', user.token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('username', user.nom);
        onLoginSuccess(user);
      })
      .catch(() => {
        setError("Identifiants de connexion invalides. Veuillez réessayer.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      background: '#0A3542',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Fond décoratif : grille + halos */}
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(251,113,133,0.12) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(44,126,153,0.25) 0%, transparent 45%)',
      }} />
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />
      <Box sx={{
        position: 'absolute', top: '10%', left: '-5%', width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,113,133,0.18) 0%, transparent 70%)', filter: 'blur(20px)',
      }} />

      {/* Panneau gauche : branding */}
      <Box sx={{
        flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
        justifyContent: 'center', px: 8, color: '#fff', zIndex: 1,
      }}>
        <Box component="img" src={process.env.PUBLIC_URL + "/logo.svg"} alt="Kossa"
          sx={{ width: 72, height: 72, mb: 4, borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
        <Typography sx={{
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em',
        }}>
          Écoutez vos<br />clients.
        </Typography>
        <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.65)', fontSize: '1.1rem', maxWidth: 420 }}>
          Kossa centralise, priorise et suit chaque réclamation jusqu'à sa résolution.
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, mt: 6 }}>
          {[['KOSSA', 'Format ticket'], ['SLA', 'Suivi temps réel'], ['360°', 'Vue agences']].map(([t, l]) => (
            <Box key={t}>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#FB7185' }}>{t}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Panneau droit : formulaire */}
      <Box sx={{
        width: { xs: '100%', md: 480 }, display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 4, zIndex: 1,
      }}>
        <Box sx={{
          width: '100%', maxWidth: 400, p: 5, borderRadius: '24px',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', mb: 1 }}>
            Portail collaborateurs
          </Typography>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, mb: 4 }}>
            Connexion
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Adresse Email" type="email" required fullWidth margin="dense"
              value={email} onChange={e => setEmail(e.target.value)}
              sx={{
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3, color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: '#FB7185' },
                  '&.Mui-focused fieldset': { borderColor: '#FB7185' },
                },
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <PasswordInput
              label="Mot de passe" required fullWidth margin="dense"
              value={password} onChange={e => setPassword(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3, color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: '#FB7185' },
                  '&.Mui-focused fieldset': { borderColor: '#FB7185' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.6)' },
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Button
              type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{
                mt: 4, py: 1.8, fontSize: '1rem', fontWeight: 700, borderRadius: 999,
                background: 'linear-gradient(90deg, #FB7185, #F43F5E)',
                boxShadow: '0 12px 30px rgba(251,113,133,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 18px 40px rgba(251,113,133,0.45)' },
                '&:disabled': { background: 'rgba(255,255,255,0.2)' },
              }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
