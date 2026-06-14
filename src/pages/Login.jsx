import { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Divider,
  Link,
  IconButton,
  Alert,
  Avatar,
  Chip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowBack,
  Person,
  MedicalServices,
  Lock,
  VerifiedUser,
  AccessTime,
  ShieldOutlined,
  Visibility,
  VisibilityOff,
  Star,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { validation } from '../utils/validation';

// ─── Motion primitives ────────────────────────────────────────────────────────
const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

// ─── Data ─────────────────────────────────────────────────────────────────────
const roleOptions = [
  {
    id: 'client',
    title: 'Client',
    subtitle: 'Find and book flexible allied health support.',
    icon: <Person fontSize="small" />,
    color: 'primary.main',
    rawColor: '#004A99',
  },
  {
    id: 'practitioner',
    title: 'Practitioner',
    subtitle: 'Manage onboarding, availability, and referrals.',
    icon: <MedicalServices fontSize="small" />,
    color: 'secondary.main',
    rawColor: '#00897B',
  },
];

const featureBullets = [
  { icon: <AccessTime fontSize="small" />, text: 'After-hours and weekend access' },
  { icon: <ShieldOutlined fontSize="small" />, text: 'Role-based dashboards & verified profiles' },
  { icon: <MedicalServices fontSize="small" />, text: 'Practitioner onboarding & approval workflow' },
];

// ─── Aqua accent ──────────────────────────────────────────────────────────────
const AQUA = '#2ECAC8';
const DARK_BG = '#0B1D2B';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated role selection card */
const RoleCard = ({ option, selected, onSelect }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    style={{ width: '100%' }}
  >
    <Box
      component="button"
      type="button"
      onClick={() => onSelect(option.id)}
      aria-pressed={selected}
      aria-label={`Select ${option.title} account type`}
      sx={{
        all: 'unset',
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        p: 2.5,
        borderRadius: 3,
        border: '1.5px solid',
        borderColor: selected ? option.rawColor : 'divider',
        bgcolor: selected ? `${option.rawColor}0D` : 'background.paper',
        cursor: 'pointer',
        transition: 'border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          borderColor: option.rawColor,
          boxShadow: `0 0 0 3px ${option.rawColor}22`,
        },
        '&:focus-visible': {
          outline: `2.5px solid ${option.rawColor}`,
          outlineOffset: 2,
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          sx={{
            bgcolor: selected ? option.rawColor : `${option.rawColor}22`,
            color: selected ? '#fff' : option.rawColor,
            width: 44,
            height: 44,
            transition: 'background-color 160ms ease, color 160ms ease',
          }}
        >
          {option.icon}
        </Avatar>
        <Box>
          <Typography fontWeight={700} variant="body1" color="text.primary">
            {option.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {option.subtitle}
          </Typography>
        </Box>
      </Stack>
    </Box>
  </motion.div>
);

/** Left branding panel */
const BrandPanel = () => (
  <Box
    sx={{
      p: { xs: 4, md: 6 },
      bgcolor: DARK_BG,
      color: '#fff',
      display: { xs: 'none', md: 'flex' },
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: { md: 640 },
    }}
  >
    {/* Top: logo + headline + bullets */}
    <Stack spacing={5}>
      {/* Logo */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: AQUA,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MedicalServices sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ color: '#fff', letterSpacing: '-0.5px' }}
          >
            Beyond5
          </Typography>
        </Stack>

        {/* Badge */}
        <Chip
          icon={<VerifiedUser sx={{ fontSize: 14, color: AQUA + ' !important' }} />}
          label="Verified allied health access"
          size="small"
          sx={{
            bgcolor: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(255,255,255,0.14)',
            mb: 3,
            fontSize: '0.72rem',
            '& .MuiChip-icon': { color: AQUA },
          }}
        />

        <Typography
          variant="h3"
          fontWeight={900}
          sx={{
            color: '#fff',
            letterSpacing: '-1px',
            lineHeight: 1.15,
            mb: 2,
          }}
        >
          Welcome back to{' '}
          <Box component="span" sx={{ color: AQUA }}>
            Beyond5
          </Box>
        </Typography>

        <Typography
          variant="body1"
          sx={{ color: 'rgba(255,255,255,0.65)', maxWidth: 360, lineHeight: 1.7 }}
        >
          Continue to bookings, onboarding, compliance reviews, and after-hours care access.
        </Typography>
      </Box>

      {/* Feature bullets */}
      <Stack spacing={2.5}>
        {featureBullets.map((item) => (
          <Stack key={item.text} direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: `${AQUA}22`,
                border: `1px solid ${AQUA}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: AQUA,
              }}
            >
              {item.icon}
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.80)' }}>
              {item.text}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>

    {/* Bottom: testimonial / stat */}
    <Box
      sx={{
        mt: 6,
        p: 2.5,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {/* Stars */}
      <Stack direction="row" spacing={0.25} sx={{ mb: 1 }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} sx={{ fontSize: 16, color: '#FFD700' }} />
        ))}
      </Stack>
      <Typography
        variant="body2"
        sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, mb: 0.5 }}
      >
        "The most seamless allied health platform we've used."
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
        Trusted by 500+ practitioners across Australia
      </Typography>
    </Box>
  </Box>
);

// ─── Main component ────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role: urlRole } = useParams();
  const { login, logout } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Derive role from URL param
  const role = urlRole;

  const handleRoleSelect = (selectedRole) => {
    navigate(`/login/${selectedRole}`, { state: location.state });
  };

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

      const from = location.state?.from;
      const returnPath = from?.pathname
        ? `${from.pathname || ''}${from.search || ''}${from.hash || ''}`
        : `/dashboard/${loggedInUser.role}`;

      navigate(returnPath, {
        replace: true,
        state: {
          intent: location.state?.intent,
          practitionerId: location.state?.practitionerId,
        },
      });
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: '#F7FBFB',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="md">
        {/* Mobile-only logo */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            gap: 1,
            mb: 3,
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: AQUA,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MedicalServices sx={{ fontSize: 18, color: '#fff' }} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
            Beyond5
          </Typography>
        </Box>

        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            overflow: 'hidden',
            borderRadius: 6,
            maxWidth: 960,
            mx: 'auto',
            boxShadow: '0 8px 48px rgba(11,29,43,0.10), 0 1px 4px rgba(11,29,43,0.06)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1.1fr' },
              minHeight: { md: 640 },
            }}
          >
            {/* ── Left panel ── */}
            <BrandPanel />

            {/* ── Right panel ── */}
            <CardContent
              sx={{
                p: { xs: 3.5, sm: 5, md: 6 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: '#fff',
              }}
            >
              <AnimatePresence mode="wait">
                {!role ? (
                  /* ── Role selection view ── */
                  <MotionBox
                    key="role-select"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Stack spacing={4}>
                      <Box>
                        <Typography
                          variant="h4"
                          fontWeight={900}
                          sx={{ letterSpacing: '-0.75px', color: 'text.primary', mb: 0.75 }}
                        >
                          Sign in
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Choose your account type to continue.
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="overline"
                          color="text.disabled"
                          sx={{ letterSpacing: 1.2, fontSize: '0.68rem', mb: 2, display: 'block' }}
                        >
                          Choose your account type
                        </Typography>
                        <Stack spacing={2}>
                          {roleOptions.map((option) => (
                            <RoleCard
                              key={option.id}
                              option={option}
                              selected={role === option.id}
                              onSelect={handleRoleSelect}
                            />
                          ))}
                        </Stack>
                      </Box>

                      <Divider sx={{ '&::before, &::after': { borderColor: 'divider' } }}>
                        <Typography variant="caption" color="text.disabled" sx={{ px: 1, fontWeight: 600 }}>
                          OR
                        </Typography>
                      </Divider>

                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          New to Beyond5?{' '}
                          <Link
                            component={RouterLink}
                            to="/register"
                            color="primary"
                            sx={{ fontWeight: 700, textDecorationColor: 'transparent', '&:hover': { textDecorationColor: 'inherit' } }}
                          >
                            Create an account
                          </Link>
                        </Typography>
                      </Box>
                    </Stack>
                  </MotionBox>
                ) : (
                  /* ── Form view ── */
                  <MotionBox
                    key={`form-${role}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Stack spacing={3.5}>
                      {/* Back + breadcrumb */}
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
                          <IconButton
                            onClick={() => navigate('/login')}
                            size="small"
                            aria-label="Back to role selection"
                            sx={{
                              ml: -0.75,
                              color: 'text.secondary',
                              '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                            }}
                          >
                            <ArrowBack fontSize="small" />
                          </IconButton>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Sign in
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            /
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.primary"
                            sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                          >
                            {role}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="h4"
                          fontWeight={900}
                          sx={{ letterSpacing: '-0.75px', color: 'text.primary', mb: 0.75 }}
                        >
                          {role === 'client' ? 'Client Login' : 'Practitioner Login'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Access your dashboard with your registered email and password.
                        </Typography>
                      </Box>

                      {/* Role switcher chips */}
                      <Stack direction="row" spacing={1}>
                        {roleOptions.map((option) => (
                          <Chip
                            key={option.id}
                            label={option.title}
                            size="small"
                            color={role === option.id ? 'primary' : 'default'}
                            variant={role === option.id ? 'filled' : 'outlined'}
                            onClick={() => handleRoleSelect(option.id)}
                            aria-pressed={role === option.id}
                            sx={{
                              fontWeight: 600,
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.85 },
                            }}
                          />
                        ))}
                      </Stack>

                      {/* Error alert */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Alert
                              severity="error"
                              onClose={() => setError('')}
                              sx={{
                                borderLeft: '4px solid',
                                borderColor: 'error.main',
                                borderRadius: 2,
                                '& .MuiAlert-message': { width: '100%' },
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25 }}>
                                Login Failed
                              </Typography>
                              <Typography variant="body2">{error}</Typography>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Form */}
                      <Box component="form" onSubmit={handleLogin} noValidate>
                        <Stack spacing={2.5}>
                          {/* Email */}
                          <TextField
                            label="Email Address"
                            type="email"
                            fullWidth
                            required
                            autoComplete="email"
                            value={email}
                            onChange={handleEmailChange}
                            error={!!errors.email}
                            helperText={errors.email}
                            disabled={submitting}
                            placeholder="your.email@example.com"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Person
                                    fontSize="small"
                                    sx={{ color: errors.email ? 'error.main' : 'action.active' }}
                                  />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                          />

                          {/* Password */}
                          <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={handlePasswordChange}
                            error={!!errors.password}
                            helperText={errors.password}
                            disabled={submitting}
                            placeholder="••••••••"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Lock
                                    fontSize="small"
                                    sx={{ color: errors.password ? 'error.main' : 'action.active' }}
                                  />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    onClick={() => setShowPassword((v) => !v)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    edge="end"
                                    size="small"
                                    tabIndex={0}
                                    sx={{ color: 'action.active' }}
                                  >
                                    {showPassword ? (
                                      <VisibilityOff fontSize="small" />
                                    ) : (
                                      <Visibility fontSize="small" />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                          />

                          {/* Remember me + forgot password */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={rememberMe}
                                  onChange={(e) => setRememberMe(e.target.checked)}
                                  disabled={submitting}
                                  aria-label="Remember me"
                                />
                              }
                              label={
                                <Typography variant="body2" color="text.secondary">
                                  Remember me
                                </Typography>
                              }
                              sx={{ ml: -0.5 }}
                            />
                            <Link
                              component={RouterLink}
                              to="#"
                              variant="body2"
                              color="primary"
                              sx={{
                                fontWeight: 700,
                                textDecorationColor: 'transparent',
                                '&:hover': { textDecorationColor: 'inherit' },
                              }}
                            >
                              Forgot password?
                            </Link>
                          </Box>

                          {/* Submit button */}
                          <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={submitting || !!errors.email || !!errors.password}
                            aria-label={submitting ? 'Signing in…' : 'Sign in'}
                            sx={{
                              mt: 0.5,
                              py: 1.6,
                              fontWeight: 800,
                              borderRadius: 2.5,
                              fontSize: '1rem',
                              letterSpacing: '0.01em',
                              boxShadow: 'none',
                              '&:hover': { boxShadow: '0 4px 16px rgba(0,74,153,0.28)' },
                              '&:active': { transform: 'scale(0.985)' },
                              transition: 'box-shadow 160ms ease, transform 100ms ease',
                            }}
                          >
                            {submitting ? (
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <CircularProgress size={18} color="inherit" thickness={3} />
                                <span>Signing in…</span>
                              </Stack>
                            ) : (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Lock sx={{ fontSize: 18 }} />
                                <span>Sign In</span>
                              </Stack>
                            )}
                          </Button>
                        </Stack>
                      </Box>

                      {/* Divider + register link */}
                      <Divider sx={{ '&::before, &::after': { borderColor: 'divider' } }}>
                        <Typography variant="caption" color="text.disabled" sx={{ px: 1, fontWeight: 600 }}>
                          OR
                        </Typography>
                      </Divider>

                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Don't have an account?{' '}
                          <Link
                            component={RouterLink}
                            to={role === 'practitioner' ? '/register/practitioner' : '/register/client'}
                            color="primary"
                            sx={{
                              fontWeight: 700,
                              textDecorationColor: 'transparent',
                              '&:hover': { textDecorationColor: 'inherit' },
                            }}
                          >
                            Create one
                          </Link>
                        </Typography>
                      </Box>
                    </Stack>
                  </MotionBox>
                )}
              </AnimatePresence>
            </CardContent>
          </Box>
        </MotionCard>
      </Container>
    </Box>
  );
};

export default Login;
