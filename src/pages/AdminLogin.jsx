import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, TextField, Button, 
  Card, CardContent, Alert, Stack, Avatar
} from '@mui/material';
import { motion } from 'framer-motion';
import { AdminPanelSettings, Lock, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const MotionCard = motion(Card);

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    if (user && user.role === 'admin') navigate('/admin/dashboard');
    else if (user) navigate('/dashboard'); // Go to whatever dashboard they have
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await login({ email, password });
      
      if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Access Denied: Insufficient Privileges');
      }
    } catch (err) {
      setError(err || 'Invalid Administrator Credentials');
    }
  };

  return (
    <Box sx={{ 
      bgcolor: '#0f172a', // Darker slate for admin portal
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      py: 8 
    }}>
      <Container maxWidth="sm">
        <MotionCard 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          sx={{ borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', bgcolor: '#1e293b', color: '#fff' }}
        >
          <CardContent sx={{ p: { xs: 4, md: 6 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <AdminPanelSettings fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight={900} gutterBottom>
                Admin Portal
              </Typography>
              <Typography sx={{ color: 'slate.400', opacity: 0.7 }}>
                Authorized Personnel Only
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid #ef4444' }}>{error}</Alert>}

            <form onSubmit={handleLogin}>
              <Stack spacing={3}>
                <TextField
                  label="Admin Email"
                  type="email"
                  fullWidth
                  required
                  variant="filled"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{ disableUnderline: true, sx: { borderRadius: 2, bgcolor: '#334155', color: '#fff' } }}
                  InputLabelProps={{ sx: { color: '#94a3b8' } }}
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  required
                  variant="filled"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{ disableUnderline: true, sx: { borderRadius: 2, bgcolor: '#334155', color: '#fff' } }}
                  InputLabelProps={{ sx: { color: '#94a3b8' } }}
                />
                
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="secondary"
                  fullWidth 
                  size="large"
                  startIcon={<Lock />}
                  sx={{ py: 2, borderRadius: '12px', fontWeight: 800, textTransform: 'none', fontSize: '1.1rem' }}
                >
                  Secure Login
                </Button>

                <Button 
                  startIcon={<ArrowBack />}
                  onClick={() => navigate('/')}
                  sx={{ color: '#94a3b8', textTransform: 'none' }}
                >
                  Back to Website
                </Button>
              </Stack>
            </form>
          </CardContent>
        </MotionCard>
        
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 4, color: '#475569' }}>
          &copy; 2026 Beyond5 Healthcare Marketplace. Secure Administrator Environment.
        </Typography>
      </Container>
    </Box>
  );
};

export default AdminLogin;
