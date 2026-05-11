import { useState } from 'react';
import { useNavigate, Link as RouterLink, useParams } from 'react-router-dom';
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
import { validation } from '../utils/validation';

const MotionCard = motion.create(Card);

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
    <Stack direction="row" spacing={2}>
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

const Login = () => {
  const navigate = useNavigate();
  const { role: urlRole } = useParams();
  const { login, logout } = useAuth();
  
  // State for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Derive role from URL
  const role = urlRole;

  const handleRoleSelect = (selectedRole) => {
    navigate(`/login/${selectedRole}`);
  };

  //   useEffect(() => {
  //   if (user?.token) {
  //     navigate('/dashboard');
  //   }
  // }, [user, navigate]);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setErrors((prev) => ({ ...prev, email: validation.email(value) }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: validation.password(value) }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const emailError = validation.email(email);
    const passwordError = validation.password(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setError('Please fix the validation errors above.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await login({ email, password });
      if (!res?.success) {
        throw new Error('Invalid email or password');
      }

      const loggedInUser = res.user;
      if (
        role &&
        loggedInUser.role !== role &&
        loggedInUser.role !== 'admin'
      ) {
        logout();
        setError(
          `This account is registered as a ${loggedInUser.role}. Please select the correct role.`
        );
        return;
      }
      navigate(`/dashboard/${loggedInUser.role}`);

    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Login failed');
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
                    <Stack key={item.text} direction="row" spacing={1.5}>
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
                        onSelect={handleRoleSelect}
                      />
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <>
                  <Box sx={{ mb: 4 }}>
                    <IconButton
                      onClick={() => navigate('/login')}
                      sx={{ mb: 2, ml: -1 }}
                      aria-label="Change role"
                      title="Change role"
                    >
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
                        onClick={() => handleRoleSelect(option.id)}
                      />
                    ))}
                  </Stack>

                  {error && (
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderLeft: '4px solid',
                        borderColor: 'error.main',
                        backgroundColor: 'error.lighter',
                      }}
                      onClose={() => setError('')}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                          Login Failed
                        </Typography>
                        <Typography variant="body2">{error}</Typography>
                      </Box>
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleLogin}>
                    <TextField
                      label="Email Address"
                      type="email"
                      fullWidth
                      required
                      margin="normal"
                      value={email}
                      onChange={handleEmailChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      disabled={submitting}
                      placeholder="your.email@example.com"
                    />
                    <TextField
                      label="Password"
                      type="password"
                      fullWidth
                      required
                      margin="normal"
                      value={password}
                      onChange={handlePasswordChange}
                      error={!!errors.password}
                      helperText={errors.password}
                      disabled={submitting}
                      placeholder="••••••••"
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
                      disabled={submitting || !!errors.email || !!errors.password}
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
                        to={role === 'practitioner' ? '/register/practitioner' : '/register/client'}
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
