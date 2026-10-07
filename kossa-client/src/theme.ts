import { createTheme } from '@mui/material/styles';

const kossaTheme = createTheme({
  palette: {
    
    primary: {
      main: '#155E75',
      light: '#2C7E99',
      dark: '#0E4557',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FB7185',
      light: '#FDA4AF',
      dark: '#F43F5E',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F3F5F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2B3C',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

export default kossaTheme;
