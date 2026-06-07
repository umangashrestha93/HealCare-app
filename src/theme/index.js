import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0B1D2B', // Deep Navy
      light: '#13283B',
      dark: '#071522',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#41C6C6', // Aqua
      light: '#BDE7E6',
      dark: '#259B9B',
      contrastText: '#0B1D2B',
    },
    background: {
      default: '#F7FBFB',
      paper: '#ffffff',
    },
    text: {
      primary: '#0B1D2B',
      secondary: '#23323C',
    },
    divider: '#E9EEF2',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", sans-serif',
    h1: {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 800,
      color: '#0B1D2B',
    },
    h2: {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 700,
      color: '#0B1D2B',
    },
    h3: {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 700,
      color: '#0B1D2B',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(65, 198, 198, 0.18)',
          },
        },
        containedPrimary: {
          background: '#0B1D2B',
          '&:hover': {
            background: '#13283B',
          },
        },
        containedSecondary: {
          background: '#41C6C6',
          color: '#0B1D2B',
          '&:hover': {
            background: '#35B7B7',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px 0 rgba(11, 29, 43, 0.05), 0 1px 2px 0 rgba(11, 29, 43, 0.06)',
          border: '1px solid #E9EEF2',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
          },
        },
      },
    },
  },
});

export default theme;
