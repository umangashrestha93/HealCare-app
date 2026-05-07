import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, Container, Typography, TextField, Button, 
  Card, CardContent, Paper, Stack, Divider, 
  Link, IconButton, Alert, Avatar
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  LocalHospital, ArrowBack, Person, 
  MedicalServices, AdminPanelSettings, Lock
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const MotionCard = motion(Card);

const Login = ({ role: initialRole }) => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [role, setRole] = useState(initialRole || null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      login({ 
        firstName: email.split('@')[0], 
        lastName: '', 
        email, 
        role: role || 'client' 
      });
      navigate('/dashboard');
    } else {
      setError('Please fill in all fields');
    }
  };

  const RoleSelection = () => (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={800} textAlign="center" gutterBottom>
        Select Your Role
      </Typography>
      <Paper 
        variant="outlined" 
        sx={{ p: 3, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc', borderColor: 'primary.main' } }}
        onClick={() => setRole('client')}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main' }}><Person /></Avatar>
          <Box>
            <Typography fontWeight={700}>I am a Client</Typography>
            <Typography variant="caption" color="text.secondary">Looking for health services</Typography>
          </Box>
        </Stack>
      </Paper>
      <Paper 
        variant="outlined" 
        sx={{ p: 3, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc', borderColor: 'secondary.main' } }}
        onClick={() => setRole('practitioner')}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'secondary.main' }}><MedicalServices /></Avatar>
          <Box>
            <Typography fontWeight={700}>I am a Practitioner</Typography>
            <Typography variant="caption" color="text.secondary">Providing health services</Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', display: 'flex', alignItems: 'center', py: 8 }}>
      <Container maxWidth="sm">
        <MotionCard 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}
        >
          <CardContent sx={{ p: { xs: 3, md: 6 } }}>
            {!role ? (
              <RoleSelection />
            ) : (
              <>
                <Box sx={{ mb: 4 }}>
                  <IconButton onClick={() => setRole(null)} sx={{ mb: 2, ml: -1 }}>
                    <ArrowBack />
                  </IconButton>
                  <Typography variant="h4" fontWeight={800} gutterBottom>
                    {role.charAt(0).toUpperCase() + role.slice(1)} Login
                  </Typography>
                  <Typography color="text.secondary">
                    Welcome back! Please enter your credentials.
                  </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <form onSubmit={handleLogin}>
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    required
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    required
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Link component={RouterLink} to="#" variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                      Forgot password?
                    </Link>
                  </Box>

                  <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth 
                    size="large"
                    startIcon={<Lock />}
                    sx={{ mt: 4, py: 2, borderRadius: '50px', fontWeight: 800 }}
                  >
                    Sign In
                  </Button>
                </form>

                <Divider sx={{ my: 4 }}>
                  <Typography variant="caption" color="text.disabled">OR</Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link 
                      component={RouterLink} 
                      to={role === 'practitioner' ? '/register?role=practitioner' : '/register'} 
                      color="primary" 
                      sx={{ fontWeight: 700 }}
                    >
                      Create Account
                    </Link>
                  </Typography>
                </Box>
              </>
            )}
          </CardContent>
        </MotionCard>
      </Container>
    </Box>
  );
};

export default Login;
