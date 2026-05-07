import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Paper,
  Stack,
  Divider,
  Link,
  IconButton,
  Alert,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  ArrowBack,
  Person,
  MedicalServices,
  Lock,
  VerifiedUser,
  AccessTime,
  ShieldOutlined,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const MotionCard = motion(Card);

const roleOptions = [
  {
    id: 'client',
    title: 'Client',
    subtitle: 'Find and book flexible allied health support.',
    icon: <Person />,
    color: 'primary.main',
  },
  {
    id: 'practitioner',
    title: 'Practitioner',
    subtitle: 'Manage onboarding, availability, and referrals.',
    icon: <MedicalServices />,
    color: 'secondary.main',
  },
];

const RoleOption = ({ option, selected, onSelect }) => (
  <Paper
    component="button"
    type="button"
    onClick={() => onSelect(option.id)}
    sx={{
      width: '100%',
      p: 2.5,
      textAlign: 'left',
      cursor: 'pointer',
      border: '1px solid',
      borderColor: selected ? option.color : 'divider',
      bgcolor: selected ? 'rgba(0, 74, 153, 0.04)' : 'background.paper',
      transition: '160ms ease',
      '&:hover': {
        borderColor: option.color,
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar sx={{ bgcolor: option.color }}>{option.icon}</Avatar>
      <Box>
        <Typography fontWeight={800}>{option.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {option.subtitle}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const Login = ({ role: initialRole }) => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [role, setRole] = useState(initialRole || null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const loggedInUser = await login({ email, password });

      if (role && loggedInUser.role !== role && loggedInUser.role !== 'admin') {
        setError(`This account is registered as ${loggedInUser.role}. Select the matching role to continue.`);
        setSubmitting(false);
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Failed to login. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f3faf7', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <MotionCard
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ overflow: 'hidden', borderRadius: 2 }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
              minHeight: { md: 640 },
            }}
          >
            <Box
              sx={{
                p: { xs: 4, md: 6 },
                bgcolor: '#0f3f3c',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Stack spacing={4}>
                <Box>
                  <Chip
                    icon={<VerifiedUser />}
                    label="Verified allied health access"
                    sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', mb: 3 }}
                  />
                  <Typography variant="h3" fontWeight={900} gutterBottom sx={{ color: '#fff' }}>
                    Welcome back to Beyond5
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.78)', maxWidth: 420 }}>
                    Continue to bookings, onboarding, compliance reviews, and after-hours care access.
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {[
                    { icon: <AccessTime />, text: 'After-hours and weekend access' },
                    { icon: <ShieldOutlined />, text: 'Role-based dashboards and verified profiles' },
                    { icon: <MedicalServices />, text: 'Practitioner onboarding and approval workflow' },
                  ].map((item) => (
                    <Stack key={item.text} direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.14)' }}>
                        {item.icon}
                      </Avatar>
                      <Typography variant="body2">{item.text}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>

              <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 6 }}>
                <Typography variant="h4" fontWeight={900}>24/7</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.72)' }}>Flexible access model for real life.</Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: { xs: 3, md: 6 } }}>
              {!role ? (
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h4" fontWeight={900} gutterBottom>
                      Sign in
                    </Typography>
                    <Typography color="text.secondary">
                      Choose your account type to continue.
                    </Typography>
                  </Box>

                  <Stack spacing={2}>
                    {roleOptions.map((option) => (
                      <RoleOption
                        key={option.id}
                        option={option}
                        selected={role === option.id}
                        onSelect={setRole}
                      />
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <>
                  <Box sx={{ mb: 4 }}>
                    <IconButton onClick={() => setRole(null)} sx={{ mb: 2, ml: -1 }} aria-label="Change role">
                      <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" fontWeight={900} gutterBottom>
                      {role === 'client' ? 'Client Login' : 'Practitioner Login'}
                    </Typography>
                    <Typography color="text.secondary">
                      Access your dashboard with your registered email and password.
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                    {roleOptions.map((option) => (
                      <Chip
                        key={option.id}
                        label={option.title}
                        color={role === option.id ? 'primary' : 'default'}
                        variant={role === option.id ? 'filled' : 'outlined'}
                        onClick={() => setRole(option.id)}
                      />
                    ))}
                  </Stack>

                  {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                  <Box component="form" onSubmit={handleLogin}>
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

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Secure JWT session
                      </Typography>
                      <Link component={RouterLink} to="#" variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                        Forgot password?
                      </Link>
                    </Box>

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Lock />}
                      disabled={submitting}
                      sx={{ mt: 4, py: 1.6, fontWeight: 900 }}
                    >
                      {submitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </Box>

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
                        sx={{ fontWeight: 800 }}
                      >
                        Create Account
                      </Link>
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Box>
        </MotionCard>
      </Container>
    </Box>
  );
};

export default Login;
