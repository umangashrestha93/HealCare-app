import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Avatar, Chip, Stack, Divider,
  Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, TextField, Rating, IconButton, Badge, Tooltip,
  LinearProgress, FormControl, InputLabel, Select, MenuItem, Skeleton,
} from '@mui/material';
import {
  CalendarMonth, History, VideoCameraFront, Cancel, Message,
  Star, Edit, Phone, LocationOn, Email, Person, ArrowForward,
  HealthAndSafety, CheckCircle, AccessTime, NotificationsNone,
  FiberManualRecord, WarningAmber,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { bookingService, reviewService, authService } from '../services/api';
import PractitionerDashboard from './PractitionerDashboard';
import AdminDashboard from './AdminDashboard';
import PractitionerRecommendations from '../components/recommendations/PractitionerRecommendations';

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

/* ─── colour palette ─── */
const C = {
  primary:   '#41C6C6',
  secondary: '#41C6C6',
  amber:     '#41C6C6',
  red:       '#ef4444',
  bg:        '#f0f4f8',
  surface:   '#ffffff',
  border:    '#e2e8f0',
  textMuted: '#64748b',
  heroBg:    'linear-gradient(135deg, #0B1D2B 0%, #13283B 40%, #1a3550 100%)',
};

/* ─── tiny helpers ─── */
const fmt = (date) =>
  new Date(date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ─── Skeleton appointment row ─── */
const AppointmentSkeleton = () => (
  <Paper
    elevation={0}
    sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${C.border}`, bgcolor: C.surface }}
  >
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="55%" height={22} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="35%" height={18} sx={{ mb: 0.5 }} />
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rounded" width={64} height={20} sx={{ borderRadius: 10 }} />
            <Skeleton variant="rounded" width={80} height={20} sx={{ borderRadius: 10 }} />
          </Stack>
        </Box>
      </Stack>
      <Stack direction="row" spacing={1} flexShrink={0}>
        <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" width={90} height={34} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" width={110} height={34} sx={{ borderRadius: 2 }} />
      </Stack>
    </Stack>
  </Paper>
);

/* ─── StatCard ─── */
const StatCard = ({ icon, value, label, color, delay }) => (
  <MotionBox
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: `1px solid ${C.border}`,
        bgcolor: C.surface,
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        height: '100%',
        transition: 'box-shadow 0.25s, transform 0.2s',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(11,29,43,0.10)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          width: 56, height: 56, borderRadius: 3,
          bgcolor: `${color}18`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={900} lineHeight={1} sx={{ letterSpacing: -1 }}>
          {value}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{ letterSpacing: 0.3, mt: 0.3, display: 'block' }}
        >
          {label}
        </Typography>
      </Box>
    </Paper>
  </MotionBox>
);

/* ─── SectionHeader ─── */
const SectionHeader = ({ title, subtitle, count }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
    <Box>
      <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, maxWidth: 480 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {count !== undefined && (
      <Chip
        label={`${count} ${count === 1 ? 'session' : 'sessions'}`}
        size="small"
        sx={{
          bgcolor: `${C.secondary}18`,
          color: C.secondary,
          fontWeight: 700,
          height: 26,
          fontSize: 12,
          flexShrink: 0,
          mt: 0.4,
        }}
      />
    )}
  </Stack>
);

/* ─── upcoming appointment row ─── */
const UpcomingRow = ({ app, onCancel, onChat, onJoin, onReschedule }) => {
  const name = `${app.practitionerId?.userId?.firstName ?? ''} ${app.practitionerId?.userId?.lastName ?? ''}`.trim();
  const discipline = app.practitionerId?.discipline ?? '—';
  const isConfirmed = app.status === 'confirmed';
  const isPending   = app.status === 'pending_approval';

  const statusInfo = {
    pending_approval: { label: 'Awaiting Acceptance', bg: 'rgba(245,158,11,0.12)', color: '#d97706', dot: '#f59e0b' },
    confirmed:        { label: 'Confirmed',            bg: 'rgba(34,197,94,0.12)',  color: '#16a34a', dot: '#22c55e' },
  }[app.status] || { label: app.status, bg: 'rgba(0,0,0,0.05)', color: C.textMuted, dot: C.textMuted };

  const accentColor = isConfirmed ? C.secondary : isPending ? '#f59e0b' : C.border;

  return (
    <MotionPaper
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${C.border}`,
        bgcolor: C.surface,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(11,29,43,0.08)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      {/* Left accent strip */}
      <Box sx={{ display: 'flex' }}>
        <Box
          sx={{
            width: 4,
            bgcolor: accentColor,
            flexShrink: 0,
            borderRadius: '12px 0 0 12px',
            transition: 'background-color 0.2s',
          }}
        />
        <Box sx={{ flex: 1, p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            spacing={2}
          >
            {/* Avatar + info */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 12, height: 12, borderRadius: '50%',
                      bgcolor: statusInfo.dot,
                      border: '2px solid #fff',
                    }}
                  />
                }
              >
                <Avatar
                  src={app.practitionerId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`}
                  sx={{ width: 48, height: 48, fontWeight: 700 }}
                />
              </Badge>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={800} noWrap sx={{ fontSize: '0.95rem' }}>
                  {name || '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 0.75 }}>
                  {discipline}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.75 }}>
                  <Chip
                    label={app.serviceType}
                    size="small"
                    sx={{
                      bgcolor: app.serviceType === 'telehealth' ? `${C.primary}12` : `${C.secondary}15`,
                      color: app.serviceType === 'telehealth' ? C.primary : '#0e9a9a',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      height: 22,
                      fontSize: 11,
                    }}
                  />
                  <Chip
                    label={statusInfo.label}
                    size="small"
                    sx={{
                      bgcolor: statusInfo.bg,
                      color: statusInfo.color,
                      fontWeight: 700,
                      height: 22,
                      fontSize: 11,
                    }}
                  />
                  <Stack direction="row" alignItems="center" spacing={0.4}>
                    <AccessTime sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {fmt(app.appointmentDate)} · {app.startTime}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>

            {/* Actions */}
            <Stack
              direction="row"
              spacing={1}
              flexShrink={0}
              flexWrap="wrap"
              justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
            >
              <Tooltip title="Chat with practitioner">
                <IconButton
                  size="small"
                  onClick={onChat}
                  sx={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 2,
                    width: 36,
                    height: 36,
                    transition: 'all 0.18s',
                    '&:hover': {
                      bgcolor: `${C.secondary}12`,
                      borderColor: C.secondary,
                      color: C.secondary,
                    },
                  }}
                >
                  <Message sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>

              {app.serviceType === 'telehealth' && app.telehealthRoom?.joinUrl && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={onJoin}
                  startIcon={<VideoCameraFront sx={{ fontSize: 15 }} />}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    px: 2,
                    height: 36,
                    fontSize: 12,
                    bgcolor: C.secondary,
                    '&:hover': { bgcolor: '#38b2b2', boxShadow: `0 4px 14px ${C.secondary}55` },
                  }}
                >
                  Join
                </Button>
              )}

              <Button
                size="small"
                variant="outlined"
                onClick={onReschedule}
                startIcon={<CalendarMonth sx={{ fontSize: 15 }} />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  px: 2,
                  height: 36,
                  fontSize: 12,
                  borderColor: C.border,
                  color: 'text.secondary',
                  '&:hover': { borderColor: C.primary, color: C.primary, bgcolor: `${C.primary}06` },
                }}
              >
                Reschedule
              </Button>

              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={onCancel}
                startIcon={<Cancel sx={{ fontSize: 15 }} />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  px: 2,
                  height: 36,
                  fontSize: 12,
                  '&:hover': { bgcolor: 'rgba(239,68,68,0.06)' },
                }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </MotionPaper>
  );
};

/* ─── past appointment row ─── */
const PastRow = ({ app, onRate }) => {
  const name = `${app.practitionerId?.userId?.firstName ?? ''} ${app.practitionerId?.userId?.lastName ?? ''}`.trim();
  const discipline = app.practitionerId?.discipline ?? '—';

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${C.border}`,
        bgcolor: '#FAFBFC',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ width: 4, bgcolor: '#e2e8f0', flexShrink: 0, borderRadius: '12px 0 0 12px' }} />
        <Box sx={{ flex: 1, p: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <Avatar
                src={app.practitionerId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`}
                sx={{ width: 44, height: 44, opacity: 0.75, filter: 'grayscale(20%)' }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight={700} noWrap sx={{ fontSize: '0.9rem' }}>
                    {name || '—'}
                  </Typography>
                  <Chip
                    icon={<CheckCircle sx={{ fontSize: '12px !important' }} />}
                    label="Completed"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(34,197,94,0.1)',
                      color: '#16a34a',
                      fontWeight: 700,
                      height: 20,
                      fontSize: 10,
                    }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                  {discipline} · {fmt(app.appointmentDate)}
                </Typography>
              </Box>
            </Stack>

            <Box flexShrink={0}>
              {app.isRated ? (
                <Chip
                  icon={<Star sx={{ fontSize: '14px !important', color: '#f59e0b !important' }} />}
                  label="Reviewed"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(245,158,11,0.1)',
                    color: '#d97706',
                    fontWeight: 700,
                    height: 28,
                    fontSize: 12,
                  }}
                />
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onRate}
                  startIcon={<Star sx={{ fontSize: 15 }} />}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    px: 2,
                    height: 32,
                    fontSize: 12,
                    borderColor: '#f59e0b',
                    color: '#d97706',
                    '&:hover': { bgcolor: 'rgba(245,158,11,0.08)', borderColor: '#d97706' },
                  }}
                >
                  Rate Session
                </Button>
              )}
            </Box>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
};

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { role: urlRole } = useParams();
  const { user, updateUser } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [cancelId, setCancelId]         = useState(null);

  const [ratingOpen, setRatingOpen]         = useState(false);
  const [ratingValue, setRatingValue]       = useState(5);
  const [ratingComment, setRatingComment]   = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [submittingRating, setSubmittingRating] = useState(false);

  const [profileOpen, setProfileOpen]         = useState(false);
  const [profileForm, setProfileForm]         = useState({ firstName: '', lastName: '', phone: '', location: '', sex: '', age: '' });
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess]   = useState(false);

  // Reschedule States
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  /* ── routing guards ── */
  useEffect(() => {
    if (user && urlRole && user.role !== urlRole) navigate(`/dashboard/${user.role}`, { replace: true });
    if (user && !urlRole) navigate(`/dashboard/${user.role}`, { replace: true });
  }, [user, urlRole, navigate]);

  useEffect(() => {
    if (!user) return;
    authService.getMe().then((res) => {
      if (res?.user) updateUser(res.user);
    }).catch(() => {/* silent */});
    if (user?.role === 'client') fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getBookings();
      setAppointments(res.data ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  /* ── handlers ── */
  const handleCancel = async () => {
    try {
      await bookingService.cancelBooking(cancelId);
      setAppointments(prev => prev.filter(a => a._id !== cancelId));
      setCancelId(null);
    } catch (err) { console.error('Cancellation failed', err); }
  };

  const handleOpenRating = (booking) => { setSelectedBooking(booking); setRatingOpen(true); };
  const handleCloseRating = () => { setRatingOpen(false); setSelectedBooking(null); setRatingValue(5); setRatingComment(''); };
  const handleSubmitRating = async () => {
    if (!selectedBooking) return;
    try {
      setSubmittingRating(true);
      await reviewService.createReview({ bookingId: selectedBooking._id, rating: ratingValue, comment: ratingComment });
      setAppointments(prev => prev.map(a => a._id === selectedBooking._id ? { ...a, isRated: true } : a));
      handleCloseRating();
    } catch (err) { alert(err || 'Rating failed — you may have already reviewed this session.'); handleCloseRating(); }
    finally { setSubmittingRating(false); }
  };

  const handleOpenProfile = () => {
    setProfileForm({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '', location: user?.location ?? '', sex: user?.sex ?? '', age: user?.age ?? '' });
    setProfileSuccess(false);
    setProfileOpen(true);
  };

  /* ── open profile dialog when navigated via Settings menu ── */
  useEffect(() => {
    if (routerLocation.state?.openProfile && user?.role === 'client') {
      handleOpenProfile();
    }
  }, [routerLocation.state, user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSubmittingProfile(true);
      const res = await authService.updateProfile(profileForm);
      if (res.success) { updateUser(res.user); setProfileSuccess(true); setTimeout(() => setProfileOpen(false), 800); }
    } catch (err) { alert(err || 'Profile update failed'); }
    finally { setSubmittingProfile(false); }
  };

  // Reschedule Handlers
  useEffect(() => {
    if (rescheduleBooking && rescheduleDate) {
      loadSlots(rescheduleBooking.practitionerId?._id || rescheduleBooking.practitionerId, rescheduleDate);
    }
  }, [rescheduleDate, rescheduleBooking]);

  const loadSlots = async (practitionerId, date) => {
    try {
      setLoadingSlots(true);
      const res = await bookingService.getAvailableSlots(practitionerId, date);
      const slots = res.available || [];
      const currentSlot = rescheduleBooking?.startTime;
      setAvailableSlots(currentSlot && !slots.includes(currentSlot) ? [currentSlot, ...slots] : slots);
    } catch (err) {
      console.error('Failed to load slots', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenReschedule = (booking) => {
    setRescheduleBooking(booking);
    setRescheduleDate(booking.appointmentDate ? new Date(booking.appointmentDate).toISOString().split('T')[0] : '');
    setRescheduleTime(booking.startTime || '');
    setRescheduleOpen(true);
  };

  const handleCloseReschedule = () => {
    setRescheduleOpen(false);
    setRescheduleBooking(null);
    setRescheduleDate('');
    setRescheduleTime('');
    setAvailableSlots([]);
  };

  const handleReschedule = async () => {
    if (!rescheduleBooking || !rescheduleDate || !rescheduleTime) return;
    try {
      setRescheduling(true);
      const res = await bookingService.rescheduleBooking(rescheduleBooking._id, {
        date: rescheduleDate,
        time: rescheduleTime
      });
      if (res.success) {
        setAppointments(prev => prev.map(a => a._id === rescheduleBooking._id ? res.data : a));
        handleCloseReschedule();
      }
    } catch (err) {
      alert(err || 'Failed to reschedule booking.');
    } finally {
      setRescheduling(false);
    }
  };

  /* ── role routing ── */
  if (!user) return null;
  if (user.role === 'practitioner') return <PractitionerDashboard />;
  if (user.role === 'admin')        return <AdminDashboard />;

  const upcoming = appointments.filter(a => new Date(a.appointmentDate) >= new Date().setHours(0,0,0,0));
  const past     = appointments.filter(a => new Date(a.appointmentDate) <  new Date().setHours(0,0,0,0));

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh' }}>

      {/* ══ HERO BANNER ══ */}
      <Box
        sx={{
          background: C.heroBg,
          pt: { xs: 4, md: 5 },
          pb: { xs: 6, md: 7 },
          position: 'relative',
          overflow: 'hidden',
          /* subtle radial overlay for depth */
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(ellipse at 70% 50%, rgba(65,198,198,0.12) 0%, transparent 65%)',
            pointerEvents: 'none',
          },
          /* decorative dot grid top-right */
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: { xs: 160, md: 260 },
            height: { xs: 140, md: 220 },
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
            spacing={3}
          >
            {/* Left: avatar + greeting */}
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Avatar
                sx={{
                  width: { xs: 60, md: 68 },
                  height: { xs: 60, md: 68 },
                  bgcolor: 'rgba(255,255,255,0.15)',
                  border: '2.5px solid rgba(255,255,255,0.35)',
                  boxShadow: '0 0 0 4px rgba(255,255,255,0.08)',
                  fontSize: { xs: 22, md: 26 },
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {initials}
              </Avatar>

              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 2, fontSize: 10.5, display: 'block' }}
                >
                  {getGreeting()},
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={900}
                  sx={{
                    color: '#fff',
                    lineHeight: 1.1,
                    fontSize: { xs: '1.6rem', md: '2rem' },
                    letterSpacing: -0.5,
                  }}
                >
                  {user.firstName} {user.lastName}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 0.75 }}>
                  <Chip
                    icon={<FiberManualRecord sx={{ fontSize: '9px !important', color: '#4ade80 !important' }} />}
                    label="Verified Member"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontWeight: 700,
                      height: 24,
                      fontSize: 11,
                      backdropFilter: 'blur(4px)',
                    }}
                  />
                  {user.location && (
                    <Chip
                      icon={<LocationOn sx={{ fontSize: '13px !important', color: 'rgba(255,255,255,0.65) !important' }} />}
                      label={user.location}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.09)',
                        color: 'rgba(255,255,255,0.8)',
                        height: 24,
                        fontSize: 11,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>

            {/* Right: action buttons */}
            <Stack direction={{ xs: 'row' }} spacing={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Message sx={{ fontSize: 16 }} />}
                onClick={() => navigate('/chat')}
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 2.5,
                  height: 42,
                  backdropFilter: 'blur(4px)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.7)',
                    bgcolor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                Open Chat
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                onClick={() => navigate('/marketplace')}
                sx={{
                  bgcolor: '#fff',
                  color: C.primary,
                  fontWeight: 800,
                  borderRadius: 2.5,
                  px: 2.75,
                  height: 42,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                  '&:hover': { bgcolor: '#e8f4f4', boxShadow: '0 6px 20px rgba(0,0,0,0.22)' },
                }}
              >
                Book a Session
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ══ STAT CARDS (overlap banner with negative margin) ══ */}
      <Container maxWidth="lg" sx={{ mt: { xs: -3.5, md: -4.5 }, position: 'relative', zIndex: 2 }}>
        <Grid container spacing={2.5}>
          {[
            { icon: <CalendarMonth sx={{ fontSize: 26 }} />, value: upcoming.length, label: 'Upcoming Sessions',  color: C.secondary, delay: 0 },
            { icon: <History sx={{ fontSize: 26 }} />,       value: past.length,     label: 'Completed Sessions', color: '#41C6C6',   delay: 0.07 },
            { icon: <HealthAndSafety sx={{ fontSize: 26 }} />, value: '24 / 7',      label: 'Care Access',        color: '#41C6C6',   delay: 0.14 },
          ].map((s) => (
            <Grid item xs={12} sm={4} key={s.label}>
              <StatCard {...s} />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ══ MAIN CONTENT ══ */}
      <Container maxWidth="lg" sx={{ pt: 4.5, pb: 10 }}>
        <Grid container spacing={3.5}>

          {/* ════ LEFT: appointments ════ */}
          <Grid item xs={12} lg={8}>

            {/* Practitioner recommendations */}
            <Box sx={{ mb: 3.5 }}>
              <PractitionerRecommendations />
            </Box>

            {/* ── Upcoming Appointments ── */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                border: `1px solid ${C.border}`,
                mb: 3,
                bgcolor: C.surface,
              }}
            >
              <SectionHeader
                title="Upcoming Appointments"
                subtitle="Your upcoming requests and confirmed sessions — reschedule or cancel when needed."
                count={loading ? undefined : upcoming.length}
              />

              <Stack spacing={2}>
                {loading ? (
                  /* Skeleton loading state */
                  [0, 1, 2].map((i) => <AppointmentSkeleton key={i} />)
                ) : upcoming.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {upcoming.map((app) => (
                      <UpcomingRow
                        key={app._id}
                        app={app}
                        onCancel={() => setCancelId(app._id)}
                        onChat={() => navigate('/chat', { state: { recipient: app.practitionerId?.userId } })}
                        onJoin={() => navigate(app.telehealthRoom.joinUrl)}
                        onReschedule={() => handleOpenReschedule(app)}
                      />
                    ))}
                  </AnimatePresence>
                ) : (
                  <MotionBox
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    sx={{
                      py: 7,
                      textAlign: 'center',
                      borderRadius: 3,
                      border: `2px dashed ${C.border}`,
                      bgcolor: '#FAFBFC',
                    }}
                  >
                    <Box
                      sx={{
                        width: 64, height: 64, borderRadius: '50%',
                        bgcolor: `${C.secondary}12`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2,
                      }}
                    >
                      <CalendarMonth sx={{ fontSize: 30, color: C.secondary }} />
                    </Box>
                    <Typography fontWeight={800} color="text.secondary" sx={{ mb: 0.75 }}>
                      No upcoming appointments
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mb: 2.5, maxWidth: 300, mx: 'auto' }}>
                      Book your first session with a verified practitioner and take control of your health.
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
                      onClick={() => navigate('/marketplace')}
                      sx={{
                        borderRadius: 2.5,
                        fontWeight: 700,
                        px: 3,
                        bgcolor: C.secondary,
                        '&:hover': { bgcolor: '#38b2b2' },
                      }}
                    >
                      Browse Practitioners
                    </Button>
                  </MotionBox>
                )}
              </Stack>
            </Paper>

            {/* ── Past Appointments ── */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                border: `1px solid ${C.border}`,
                bgcolor: C.surface,
              }}
            >
              <SectionHeader
                title="Session History"
                subtitle="Review your completed sessions and share feedback."
                count={past.length}
              />

              <Stack spacing={2}>
                {past.length > 0 ? (
                  past.map((app) => (
                    <PastRow key={app._id} app={app} onRate={() => handleOpenRating(app)} />
                  ))
                ) : (
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <History sx={{ fontSize: 38, color: C.border, mb: 1 }} />
                    <Typography variant="body2" color="text.disabled" fontWeight={600}>
                      No past sessions yet.
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Your completed appointments will appear here.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* ════ RIGHT: sidebar ════ */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>

              {/* ── Profile card ── */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: `1px solid ${C.border}`,
                  bgcolor: C.surface,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: -0.3 }}>
                      My Profile
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your personal information
                    </Typography>
                  </Box>
                  <Tooltip title="Edit profile">
                    <IconButton
                      size="small"
                      onClick={handleOpenProfile}
                      sx={{
                        border: `1px solid ${C.border}`,
                        borderRadius: 2,
                        width: 34,
                        height: 34,
                        transition: 'all 0.18s',
                        '&:hover': {
                          bgcolor: `${C.secondary}12`,
                          borderColor: C.secondary,
                          color: C.secondary,
                        },
                      }}
                    >
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Stack spacing={0} divider={<Divider flexItem sx={{ borderColor: '#f1f5f9' }} />}>
                  {[
                    { icon: <Person sx={{ fontSize: 15 }} />, label: 'Full Name',  value: `${user.firstName} ${user.lastName}` },
                    { icon: <Person sx={{ fontSize: 15 }} />, label: 'Sex',        value: user.sex ? user.sex.charAt(0).toUpperCase() + user.sex.slice(1) : 'Not specified' },
                    { icon: <Person sx={{ fontSize: 15 }} />, label: 'Age',        value: user.age ? `${user.age} yrs` : 'Not specified' },
                    { icon: <Email sx={{ fontSize: 15 }} />,  label: 'Email',      value: user.email },
                    { icon: <Phone sx={{ fontSize: 15 }} />,  label: 'Phone',      value: user.phone || 'Not provided' },
                    { icon: <LocationOn sx={{ fontSize: 15 }} />, label: 'Location', value: user.location || 'Not provided' },
                  ].map(({ icon, label, value }) => {
                    const isEmpty = value === 'Not provided' || value === 'Not specified';
                    return (
                      <Stack
                        key={label}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ py: 1.25, px: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 30, height: 30, borderRadius: 1.5,
                            bgcolor: '#f8fafc',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.textMuted, flexShrink: 0,
                          }}
                        >
                          {icon}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            fontWeight={700}
                            sx={{ fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', display: 'block' }}
                          >
                            {label}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ color: isEmpty ? 'text.disabled' : 'text.primary', fontSize: '0.825rem' }}
                          >
                            {value}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>

              {/* ── Quick Actions card ── */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: `1px solid ${C.border}`,
                  bgcolor: C.surface,
                }}
              >
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2.5, letterSpacing: -0.3 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={1.25}>
                  {[
                    {
                      label: 'Book a Session',
                      sub: 'Find verified practitioners',
                      icon: <CalendarMonth sx={{ fontSize: 20 }} />,
                      action: () => navigate('/marketplace'),
                      primary: true,
                    },
                    {
                      label: 'Open Chat Hub',
                      sub: 'Message your practitioners',
                      icon: <Message sx={{ fontSize: 20 }} />,
                      action: () => navigate('/chat'),
                      primary: false,
                    },
                    {
                      label: 'Notifications',
                      sub: 'Alerts and reminders',
                      icon: <NotificationsNone sx={{ fontSize: 20 }} />,
                      action: () => {},
                      primary: false,
                    },
                  ].map(({ label, sub, icon, action, primary }) => (
                    <Button
                      key={label}
                      fullWidth
                      onClick={action}
                      sx={{
                        justifyContent: 'flex-start',
                        borderRadius: 2.5,
                        p: '10px 14px',
                        textAlign: 'left',
                        gap: 1.5,
                        bgcolor: primary ? `${C.secondary}12` : 'transparent',
                        border: `1px solid ${primary ? `${C.secondary}30` : C.border}`,
                        transition: 'all 0.18s',
                        '&:hover': {
                          bgcolor: primary ? `${C.secondary}22` : '#f8fafc',
                          borderColor: primary ? C.secondary : '#cbd5e1',
                          transform: 'translateX(2px)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 36, height: 36, borderRadius: 2,
                          bgcolor: primary ? `${C.secondary}20` : '#f1f5f9',
                          color: primary ? C.secondary : C.textMuted,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ color: primary ? '#0e9a9a' : 'text.primary', lineHeight: 1.2 }}
                        >
                          {label}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10.5 }}>
                          {sub}
                        </Typography>
                      </Box>
                    </Button>
                  ))}
                </Stack>
              </Paper>

              {/* ── Wellness Summary card ── */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: `linear-gradient(145deg, #0B1D2B 0%, #13283B 55%, #1e3d58 100%)`,
                  color: '#fff',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'rgba(65,198,198,0.12)',
                    pointerEvents: 'none',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                  <Box sx={{ color: C.secondary }}>
                    <HealthAndSafety sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Wellness Summary
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2.5 }}>
                  Track your care journey progress
                </Typography>

                <Stack spacing={2.25}>
                  {[
                    { label: 'Sessions completed', val: past.length,    max: Math.max(past.length, 5),     barColor: '#41C6C6' },
                    { label: 'Sessions upcoming',  val: upcoming.length, max: Math.max(upcoming.length, 5), barColor: '#818cf8' },
                  ].map(({ label, val, max, barColor }) => (
                    <Box key={label}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                          {label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: barColor, fontWeight: 800 }}>
                          {val}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={max > 0 ? (val / max) * 100 : 0}
                        sx={{
                          height: 7, borderRadius: 4,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 4 },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Stack spacing={1.25}>
                  {['Care Plans', 'Prescriptions', 'Health Records'].map((item) => (
                    <Stack key={item} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                        {item}
                      </Typography>
                      <Chip
                        label="Coming soon"
                        size="small"
                        sx={{ height: 20, fontSize: 10, bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Paper>

            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* ══════════════════════════════════
          CANCEL DIALOG
      ══════════════════════════════════ */}
      <Dialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 0,
            maxWidth: 420,
            overflow: 'hidden',
          },
        }}
      >
        {/* Red warning header */}
        <Box
          sx={{
            bgcolor: 'rgba(239,68,68,0.06)',
            borderBottom: '1px solid rgba(239,68,68,0.12)',
            px: 3,
            py: 2.5,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 52, height: 52, borderRadius: '50%',
              bgcolor: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 1.5,
            }}
          >
            <WarningAmber sx={{ fontSize: 26, color: C.red }} />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.3 }}>
            Cancel this appointment?
          </Typography>
        </Box>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.8, textAlign: 'center' }}>
            Are you sure you want to cancel this session? This action <strong>cannot be undone</strong> and may be subject to the practitioner's cancellation policy.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5, flexDirection: 'column' }}>
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={handleCancel}
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
              height: 44,
              bgcolor: C.red,
              '&:hover': { bgcolor: '#dc2626', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' },
            }}
          >
            Yes, Cancel Appointment
          </Button>
          <Button
            fullWidth
            onClick={() => setCancelId(null)}
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
              height: 40,
              color: 'text.secondary',
              '&:hover': { bgcolor: '#f8fafc' },
            }}
          >
            Keep My Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════
          RATING DIALOG
      ══════════════════════════════════ */}
      <Dialog
        open={ratingOpen}
        onClose={handleCloseRating}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, #0B1D2B 0%, #13283B 100%)`,
            px: 3, py: 3,
            textAlign: 'center',
          }}
        >
          <Avatar
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedBooking?.practitionerId?.userId?.firstName}`}
            sx={{
              width: 60, height: 60,
              mx: 'auto', mb: 1.5,
              border: '2.5px solid rgba(255,255,255,0.25)',
            }}
          />
          <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#fff', letterSpacing: -0.3 }}>
            Rate your session
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
            with{' '}
            <Box component="span" sx={{ color: C.secondary, fontWeight: 700 }}>
              {selectedBooking?.practitionerId?.userId?.firstName}{' '}
              {selectedBooking?.practitionerId?.userId?.lastName}
            </Box>
          </Typography>
        </Box>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 2.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              How would you rate your experience?
            </Typography>
            <Rating
              value={ratingValue}
              onChange={(_, v) => setRatingValue(v)}
              size="large"
              sx={{
                '& .MuiRating-iconFilled': { color: '#f59e0b' },
                '& .MuiRating-iconHover': { color: '#d97706' },
              }}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Share your experience (optional)"
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                fontSize: '0.875rem',
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={handleCloseRating}
            disabled={submittingRating}
            sx={{ borderRadius: 2, fontWeight: 700, color: 'text.secondary', flex: 1 }}
          >
            Skip
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitRating}
            disabled={submittingRating}
            startIcon={
              submittingRating
                ? <CircularProgress size={15} color="inherit" />
                : <Star sx={{ fontSize: 16 }} />
            }
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 3,
              flex: 2,
              bgcolor: '#f59e0b',
              '&:hover': { bgcolor: '#d97706', boxShadow: '0 4px 14px rgba(245,158,11,0.4)' },
            }}
          >
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════
          EDIT PROFILE DIALOG
      ══════════════════════════════════ */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
      >
        <Box
          sx={{
            px: 3, pt: 3, pb: 2,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.3 }}>
            Edit Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Update your personal information
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleUpdateProfile}>
          <DialogContent sx={{ px: 3, py: 2.5 }}>
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="First Name"
                    fullWidth
                    required
                    size="small"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Last Name"
                    fullWidth
                    required
                    size="small"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
              <TextField
                label="Phone Number"
                fullWidth
                size="small"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                InputProps={{ startAdornment: <Phone sx={{ fontSize: 16, mr: 1, color: 'text.disabled' }} /> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                label="Location"
                fullWidth
                size="small"
                value={profileForm.location}
                onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                placeholder="e.g. Melbourne, VIC"
                InputProps={{ startAdornment: <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.disabled' }} /> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <FormControl fullWidth size="small" required>
                <InputLabel>Sex</InputLabel>
                <Select
                  name="sex"
                  value={profileForm.sex}
                  label="Sex"
                  onChange={(e) => setProfileForm({ ...profileForm, sex: e.target.value })}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Age"
                fullWidth
                size="small"
                type="number"
                value={profileForm.age}
                onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                placeholder="e.g. 28"
                inputProps={{ min: 0, max: 120 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              {profileSuccess && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#16a34a' }}>
                  <CheckCircle sx={{ fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={700}>Profile updated successfully!</Typography>
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
            <Button
              onClick={() => setProfileOpen(false)}
              disabled={submittingProfile}
              sx={{ borderRadius: 2, fontWeight: 700, color: 'text.secondary', flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submittingProfile}
              startIcon={
                submittingProfile
                  ? <CircularProgress size={15} color="inherit" />
                  : <CheckCircle sx={{ fontSize: 16 }} />
              }
              sx={{
                borderRadius: 2, fontWeight: 700, px: 3, flex: 2,
                bgcolor: C.primary,
                '&:hover': { bgcolor: '#0e1e2d' },
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ══════════════════════════════════
          RESCHEDULE DIALOG
      ══════════════════════════════════ */}
      <Dialog
        open={rescheduleOpen}
        onClose={handleCloseReschedule}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: `1px solid ${C.border}` }}>
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.3 }}>
            Reschedule Appointment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Select a new date and time for your session with{' '}
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {rescheduleBooking?.practitionerId?.userId?.firstName}{' '}
              {rescheduleBooking?.practitionerId?.userId?.lastName}
            </Box>
          </Typography>
        </Box>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2.5}>
            <TextField
              type="date"
              label="Select Date"
              fullWidth
              required
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{ display: 'block', mb: 1.25, letterSpacing: 0.6, textTransform: 'uppercase' }}
              >
                Available Time Slots
              </Typography>

              {loadingSlots ? (
                <Grid container spacing={1}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Grid item xs={4} key={i}>
                      <Skeleton variant="rounded" height={34} sx={{ borderRadius: 2 }} />
                    </Grid>
                  ))}
                </Grid>
              ) : availableSlots.length > 0 ? (
                <Grid container spacing={1}>
                  {availableSlots.map((slot) => {
                    const isSelected = rescheduleTime === slot;
                    return (
                      <Grid item xs={4} key={slot}>
                        <Button
                          fullWidth
                          variant={isSelected ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setRescheduleTime(slot)}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            py: 0.85,
                            transition: 'all 0.15s',
                            ...(isSelected
                              ? { bgcolor: C.secondary, borderColor: C.secondary, '&:hover': { bgcolor: '#38b2b2' } }
                              : { color: C.primary, borderColor: C.border, '&:hover': { borderColor: C.secondary, color: C.secondary, bgcolor: `${C.secondary}08` } }
                            ),
                          }}
                        >
                          {slot}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{ p: 2.5, textAlign: 'center', bgcolor: '#fafbfc', borderRadius: 2.5 }}
                >
                  <Typography variant="body2" color="text.disabled" fontWeight={600}>
                    {rescheduleDate ? 'No available slots on this date' : 'Please select a date first'}
                  </Typography>
                </Paper>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={handleCloseReschedule}
            disabled={rescheduling}
            sx={{ borderRadius: 2, fontWeight: 700, color: 'text.secondary', flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReschedule}
            disabled={rescheduling || !rescheduleTime || !rescheduleDate}
            startIcon={
              rescheduling
                ? <CircularProgress size={15} color="inherit" />
                : <CalendarMonth sx={{ fontSize: 16 }} />
            }
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 3,
              flex: 2,
              bgcolor: C.primary,
              '&:hover': { bgcolor: '#0e1e2d' },
              '&.Mui-disabled': { bgcolor: '#e2e8f0' },
            }}
          >
            Confirm Reschedule
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Dashboard;
