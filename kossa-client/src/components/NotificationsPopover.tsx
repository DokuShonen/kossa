import React, { useEffect, useState, useCallback } from 'react';
import {
  Badge, IconButton, Popover, List, ListItem, ListItemText, ListItemIcon,
  Typography, Box, Chip, Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions, Paper
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CircleIcon from '@mui/icons-material/Circle';
import api from '../services/api';

interface Notification {
  id: number;
  type: string;
  contenu: string;
  dateEnvoi: string;
  statut: string;
}

const TYPE_COLORS: Record<string, string> = {
  CREATION: '#4caf50',
  CHANGEMENT_STATUT: '#2196f3',
  ESCALADE: '#f44336',
  ESCALADE_AUTO: '#ff9800',
  VALIDATION: '#9c27b0',
};

const TYPE_LABELS: Record<string, string> = {
  CREATION: 'Création',
  CHANGEMENT_STATUT: 'Changement de statut',
  ESCALADE: 'Escalade',
  ESCALADE_AUTO: 'Escalade automatique',
  VALIDATION: 'Validation',
};

const NotificationsPopover = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nonLuesCount, setNonLuesCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const charger = useCallback(() => {
    api.get('/notifications').then(res => {
      setNotifications(res.data);
    }).catch(() => {});
    api.get('/notifications/compter-non-lues').then(res => {
      setNonLuesCount(res.data.count);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, [charger]);

  const marquerLue = (id: number) => {
    api.put(`/notifications/${id}/lire`).then(() => {
      charger();
    }).catch(() => {});
  };

  const handleClickNotif = (n: Notification) => {
    setSelectedNotif(n);
    if (n.statut === 'NON_LUE') {
      marquerLue(n.id);
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={nonLuesCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: 380, maxHeight: 400 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Notifications</Typography>
            <Chip label={`${nonLuesCount} non lue(s)`} size="small" color="primary" />
          </Box>
          <Divider />
          <List dense sx={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 && (
              <ListItem>
                <ListItemText primary="Aucune notification" />
              </ListItem>
            )}
            {[...notifications].sort((a: any, b: any) => new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime()).map((n) => (
              <ListItem
                key={n.id}
                sx={{
                  bgcolor: n.statut === 'NON_LUE' ? 'action.hover' : undefined,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
                onClick={() => handleClickNotif(n)}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <CircleIcon sx={{ fontSize: 12, color: TYPE_COLORS[n.type] || '#ccc' }} />
                </ListItemIcon>
                <ListItemText
                  primary={n.contenu}
                  secondary={new Date(n.dateEnvoi).toLocaleString()}
                  slotProps={{ primary: { variant: 'body2', noWrap: true }, secondary: { variant: 'caption' } }}
                />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button size="small" onClick={() => setAnchorEl(null)}>Fermer</Button>
          </Box>
        </Box>
      </Popover>

      {/* Détail notification */}
      <Dialog open={Boolean(selectedNotif)} onClose={() => setSelectedNotif(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircleIcon sx={{ fontSize: 14, color: TYPE_COLORS[selectedNotif?.type || ''] || '#ccc' }} />
          {TYPE_LABELS[selectedNotif?.type || ''] || selectedNotif?.type || 'Notification'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedNotif?.dateEnvoi ? new Date(selectedNotif.dateEnvoi).toLocaleString('fr-FR') : ''}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {selectedNotif?.contenu}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedNotif(null)} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationsPopover;
