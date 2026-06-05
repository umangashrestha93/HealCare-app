import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Avatar, Chip, Stack, Divider,
  Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, TextField, Rating, IconButton, Badge, Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  CalendarMonth, History, VideoCameraFront, Cancel, Message,
  Star, Edit, Phone, LocationOn, Email, Person, ArrowForward,
  HealthAndSafety, CheckCircle, AccessTime, NotificationsNone,
  FiberManualRecord,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { bookingService, reviewService, authService } from '../services/api';
import PractitionerDashboard from './PractitionerDashboard';
import AdminDashboard from './AdminDashboard';
import PractitionerRecommendations from '../components/recommendations/PractitionerRecommendations';

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

/* ─── colour palette (consistent tokens) ─── */
const C = {
  primary:   '#004a99',
  secondary: '#0d8a72',
  amber:     '#f59e0b',
  red:       '#ef4444',
  bg:        '#f0f4f8',
  surface:   '#ffffff',
  border:    '#e2e8f0',
  textMuted: '#64748b',
};

/* ─── tiny helpers ─── */
const fmt = (date) =>
  new Date(date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });

const serviceColor = (type) => (type === 'telehealth' ? C.primary : C.secondary);

const StatCard = ({ icon, value, label, color, delay }) => (
  <MotionBox
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${C.border}`,
        bgcolor: C.surface,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: '100%',
        transition: 'box-shadow .2s',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.07)' },
      }}
    >
      <Box
        sx={{
          width: 52, height: 52, borderRadius: 2.5,
          bgcolor: `${color}15`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800} lineHeight={1}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 0.3 }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  </MotionBox>
);

const SectionHeader = ({ title, subtitle }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.3 }}>{title}</Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{subtitle}</Typography>
    )}
  </Box>
);

/* ─── upcoming appointment row ─── */
const UpcomingRow = ({ app, onCancel, onChat, onJoin }) => {
  const name = `${app.practitionerId?.userId?.firstName ?? ''} ${app.practitionerId?.userId?.lastName ?? ''}`.trim();
  const discipline = app.practitionerId?.discipline ?? '—';
  const sColor = serviceColor(app.serviceType);

  return (
    <MotionPaper
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      elevation={0}
      sx={{
        p: 2.5, borderRadius: 3, border: `1px solid ${C.border}`,
        bgcolor: C.surface,
        transition: 'box-shadow .2s',
        '&:hover': { boxShadow: '0 4px 18px rgba(0,0,0,0.06)' },
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2}>
        {/* Avatar + info */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: C.secondary, border: '2px solid #fff' }} />
            }
          >
            <Avatar
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`}
              sx={{ width: 48, height: 48, fontWeight: 700 }}
            />
          </Badge>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={800} noWrap>{name || '—'}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{discipline}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip
                label={app.serviceType}
                size="small"
                sx={{ bgcolor: `${sColor}15`, color: sColor, fontWeight: 700, textTransform: 'capitalize', height: 20, fontSize: 11 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <AccessTime sx={{ fontSize: 13 }} />
                {fmt(app.appointmentDate)} · {app.startTime}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {/* Actions */}
        <Stack direction="row" spacing={1} flexShrink={0} flexWrap="wrap" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
          <Tooltip title="Chat with practitioner">
            <IconButton
              size="small"
              onClick={onChat}
              sx={{ border: `1px solid ${C.border}`, borderRadius: 2, width: 34, height: 34 }}
            >
              <Message sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          {app.serviceType === 'telehealth' && app.telehealthRoom?.joinUrl && (
            <Button
              size="small"
              variant="contained"
              onClick={onJoin}
              startIcon={<VideoCameraFront sx={{ fontSize: 16 }} />}
              sx={{ borderRadius: 2, fontWeight: 700, px: 2, height: 34, fontSize: 12 }}
            >
              Join
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={onCancel}
            startIcon={<Cancel sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2, height: 34, fontSize: 12 }}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
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
      sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${C.border}`, bgcolor: '#fafbfc' }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          <Avatar
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`}
            sx={{ width: 44, height: 44, opacity: 0.8 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>{name || '—'}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {discipline} · Completed {fmt(app.appointmentDate)}
            </Typography>
          </Box>
        </Stack>

        <Box flexShrink={0}>
          {app.isRated ? (
            <Chip
              icon={<CheckCircle sx={{ fontSize: 14 }} />}
              label="Reviewed"
              color="success"
              size="small"
              sx={{ fontWeight: 700, height: 26 }}
            />
          ) : (
            <Button
              size="small"
              variant="contained"
              onClick={onRate}
              startIcon={<Star sx={{ fontSize: 16 }} />}
              sx={{ borderRadius: 2, fontWeight: 700, px: 2, height: 30, fontSize: 12, bgcolor: C.amber, '&:hover': { bgcolor: '#d97706' } }}
            >
              Rate Now
            </Button>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
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
  const [profileForm, setProfileForm]         = useState({ firstName: '', lastName: '', phone: '', location: '' });
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess]   = useState(false);

  /* ── routing guards ── */
  useEffect(() => {
    if (user && urlRole && user.role !== urlRole) navigate(`/dashboard/${user.role}`, { replace: true });
    if (user && !urlRole) navigate(`/dashboard/${user.role}`, { replace: true });
  }, [user, urlRole, navigate]);

  useEffect(() => {
    if (user?.role === 'client') fetchBookings();
  }, [user]);

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
    setProfileForm({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '', location: user?.location ?? '' });
    setProfileSuccess(false);
    setProfileOpen(true);
  };
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSubmittingProfile(true);
      const res = await authService.updateProfile(profileForm);
      if (res.success) { updateUser(res.user); setProfileSuccess(true); setTimeout(() => setProfileOpen(false), 800); }
    } catch (err) { alert(err || 'Profile update failed'); }
    finally { setSubmittingProfile(false); }
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

      {/* ── HERO BANNER ── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, #002d5f 0%, #004a99 55%, #006b5e 100%)`,
          pt: { xs: 5, md: 6 }, pb: { xs: 8, md: 10 },
          position: 'relative', overflow: 'hidden',
          '&::after': {
            content: '""', position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 60%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={4}>
            {/* Left: greeting */}
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Avatar
                sx={{
                  width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  fontSize: 24, fontWeight: 800, color: '#fff',
                }}
              >
                {initials}
              </Avatar>
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, fontSize: 11 }}>
                  Client Dashboard
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: '#fff', lineHeight: 1.1, mt: 0.2 }}>
                  Hey, {user.firstName} 👋
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<FiberManualRecord sx={{ fontSize: '10px !important', color: '#4ade80 !important' }} />}
                    label="Verified member"
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, height: 22, fontSize: 11 }}
                  />
                  {user.location && (
                    <Chip
                      icon={<LocationOn sx={{ fontSize: '13px !important', color: 'rgba(255,255,255,0.7) !important' }} />}
                      label={user.location}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', height: 22, fontSize: 11 }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>

            {/* Right: action buttons */}
            <Stack direction="row" spacing={1.5}>
              <Tooltip title="Edit profile">
                <Button
                  variant="outlined"
                  startIcon={<Edit sx={{ fontSize: 16 }} />}
                  onClick={handleOpenProfile}
                  sx={{
                    color: '#fff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 700,
                    borderRadius: 2.5, px: 2.5,
                    '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  Edit Profile
                </Button>
              </Tooltip>
              <Button
                variant="contained"
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                onClick={() => navigate('/marketplace')}
                sx={{
                  bgcolor: '#fff', color: C.primary, fontWeight: 800,
                  borderRadius: 2.5, px: 2.5,
                  '&:hover': { bgcolor: '#f0f4ff' },
                }}
              >
                Book a session
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ── STAT CARDS (overlap banner) ── */}
      <Container maxWidth="lg" sx={{ mt: { xs: -4, md: -5 }, position: 'relative', zIndex: 2 }}>
        <Grid container spacing={2.5}>
          {[
            { icon: <CalendarMonth />, value: upcoming.length,  label: 'Upcoming Sessions',  color: C.primary,   delay: 0 },
            { icon: <History />,       value: past.length,      label: 'Completed Sessions', color: C.secondary, delay: 0.06 },
            { icon: <HealthAndSafety />,value: '24 / 7',        label: 'Care Access',        color: C.amber,     delay: 0.12 },
          ].map((s) => (
            <Grid item xs={12} sm={4} key={s.label}>
              <StatCard {...s} />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── MAIN CONTENT ── */}
      <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
        <Grid container spacing={3}>

          {/* ════ LEFT: appointments ════ */}
          <Grid item xs={12} lg={8}>

            {/* Practitioner recommendations */}
            <Box sx={{ mb: 3 }}>
              <PractitionerRecommendations />
            </Box>

            {/* Upcoming */}
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: `1px solid ${C.border}`, mb: 3 }}>
              <SectionHeader
                title="Upcoming Appointments"
                subtitle="Your confirmed sessions — join, chat or cancel anytime."
              />
              <Stack spacing={2}>
                {loading ? (
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <CircularProgress size={36} thickness={4} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Loading sessions…</Typography>
                  </Box>
                ) : upcoming.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {upcoming.map(app => (
                      <UpcomingRow
                        key={app._id}
                        app={app}
                        onCancel={() => setCancelId(app._id)}
                        onChat={() => navigate('/chat', { state: { recipient: app.practitionerId?.userId } })}
                        onJoin={() => navigate(app.telehealthRoom.joinUrl)}
                      />
                    ))}
                  </AnimatePresence>
                ) : (
                  <Box
                    sx={{
                      py: 6, textAlign: 'center', borderRadius: 3,
                      border: `2px dashed ${C.border}`, bgcolor: '#fafbfc',
                    }}
                  >
                    <CalendarMonth sx={{ fontSize: 40, color: C.border, mb: 1 }} />
                    <Typography fontWeight={700} color="text.secondary">No upcoming appointments</Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                      Book your first session with a verified practitioner.
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate('/marketplace')}
                      sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      Browse Practitioners
                    </Button>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Past */}
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: `1px solid ${C.border}` }}>
              <SectionHeader
                title="Past Appointments"
                subtitle="Review your history and share feedback with practitioners."
              />
              <Stack spacing={2}>
                {past.length > 0 ? (
                  past.map(app => (
                    <PastRow key={app._id} app={app} onRate={() => handleOpenRating(app)} />
                  ))
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <History sx={{ fontSize: 36, color: C.border, mb: 1 }} />
                    <Typography variant="body2" color="text.disabled">No past sessions yet.</Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* ════ RIGHT: sidebar ════ */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>

              {/* Profile card */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${C.border}`, bgcolor: C.surface }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={800}>My Profile</Typography>
                  <Tooltip title="Edit profile">
                    <IconButton size="small" onClick={handleOpenProfile} sx={{ border: `1px solid ${C.border}`, borderRadius: 1.5 }}>
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Stack spacing={2}>
                  {[
                    { icon: <Person sx={{ fontSize: 16 }} />, label: 'Name',     value: `${user.firstName} ${user.lastName}` },
                    { icon: <Email sx={{ fontSize: 16 }} />,  label: 'Email',    value: user.email },
                    { icon: <Phone sx={{ fontSize: 16 }} />,  label: 'Phone',    value: user.phone || 'Not provided' },
                    { icon: <LocationOn sx={{ fontSize: 16 }} />, label: 'Location', value: user.location || 'Not provided' },
                  ].map(({ icon, label, value }) => (
                    <Stack key={label} direction="row" spacing={1.5} alignItems="flex-start">
                      <Box sx={{ color: C.textMuted, mt: 0.2, flexShrink: 0 }}>{icon}</Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10 }}>
                          {label}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ color: value === 'Not provided' ? 'text.disabled' : 'text.primary' }}>
                          {value}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>

                <Divider sx={{ my: 2.5 }} />
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Edit sx={{ fontSize: 15 }} />}
                  onClick={handleOpenProfile}
                  sx={{ borderRadius: 2, fontWeight: 700, height: 38 }}
                >
                  Edit Details
                </Button>
              </Paper>

              {/* Quick actions card */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${C.border}`, bgcolor: C.surface }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2.5 }}>Quick Actions</Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: 'Book a Session',      icon: <CalendarMonth sx={{ fontSize: 18 }} />, action: () => navigate('/marketplace'), primary: true },
                    { label: 'Open Chat Hub',        icon: <Message sx={{ fontSize: 18 }} />,       action: () => navigate('/chat') },
                    { label: 'Notification Centre',  icon: <NotificationsNone sx={{ fontSize: 18 }} />, action: () => {} },
                  ].map(({ label, icon, action, primary }) => (
                    <Button
                      key={label}
                      fullWidth
                      variant={primary ? 'contained' : 'outlined'}
                      startIcon={icon}
                      onClick={action}
                      sx={{
                        justifyContent: 'flex-start', borderRadius: 2, fontWeight: 700,
                        height: 42, px: 2, textAlign: 'left',
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </Stack>
              </Paper>

              {/* Health wellness card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3, borderRadius: 3, overflow: 'hidden',
                  background: `linear-gradient(135deg, #002d5f 0%, #004a99 100%)`,
                  color: '#fff',
                }}
              >
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>Your Wellness Summary</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2.5 }}>
                  Keep track of your care progress.
                </Typography>
                <Stack spacing={2}>
                  {[
                    { label: 'Sessions completed', val: past.length,    max: Math.max(past.length, 5), color: '#4ade80' },
                    { label: 'Sessions upcoming',  val: upcoming.length, max: Math.max(upcoming.length, 5), color: '#60a5fa' },
                  ].map(({ label, val, max, color }) => (
                    <Box key={label}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{label}</Typography>
                        <Typography variant="caption" sx={{ color, fontWeight: 800 }}>{val}</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={max > 0 ? (val / max) * 100 : 0}
                        sx={{
                          height: 6, borderRadius: 3,
                          bgcolor: 'rgba(255,255,255,0.15)',
                          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.15)' }} />
                <Stack spacing={1}>
                  {['Care Plans', 'Prescriptions', 'Health Records'].map(item => (
                    <Stack key={item} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>{item}</Typography>
                      <Chip label="Coming soon" size="small" sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }} />
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
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>Cancel Appointment?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.7 }}>
            Are you sure you want to cancel this session? This action cannot be undone and may be subject to a cancellation policy.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setCancelId(null)} sx={{ borderRadius: 2, fontWeight: 700 }}>Keep It</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            Yes, Cancel
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
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>Rate your experience</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Avatar
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedBooking?.practitionerId?.userId?.firstName}`}
              sx={{ width: 56, height: 56, mx: 'auto', mb: 1.5 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              How was your session with{' '}
              <strong>{selectedBooking?.practitionerId?.userId?.firstName}</strong>?
            </Typography>
            <Rating
              value={ratingValue}
              onChange={(_, v) => setRatingValue(v)}
              size="large"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Share your experience (optional)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={handleCloseRating} disabled={submittingRating} sx={{ borderRadius: 2, fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitRating}
            disabled={submittingRating}
            startIcon={submittingRating ? <CircularProgress size={15} color="inherit" /> : <Star sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3, bgcolor: C.amber, '&:hover': { bgcolor: '#d97706' } }}
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
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>Edit Profile</DialogTitle>
        <Box component="form" onSubmit={handleUpdateProfile}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
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
              {profileSuccess && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: C.secondary }}>
                  <CheckCircle sx={{ fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={700}>Profile updated successfully!</Typography>
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => setProfileOpen(false)} disabled={submittingProfile} sx={{ borderRadius: 2, fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submittingProfile}
              startIcon={submittingProfile ? <CircularProgress size={15} color="inherit" /> : <CheckCircle sx={{ fontSize: 16 }} />}
              sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

    </Box>
  );
};

export default Dashboard;
