import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Paper,
  Avatar, Chip, Stack, Button, List, ListItem,
  ListItemText, ListItemAvatar, Divider, LinearProgress,
  IconButton, TextField, Switch, FormControlLabel,
  Snackbar, Alert, Badge, CircularProgress, Rating
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment,
  CalendarMonth,
  Message,
  Settings,
  Verified,
  PendingActions,
  TrendingUp,
  Notifications,
  CloudUpload,
  AccessTime,
  CheckCircle,
  Warning,
  Send,
  MoreVert,
  Star,
  Schedule,
  Person
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { practitionerService, bookingService, reviewService } from '../services/api';

const MotionBox = motion.create(Box);

const PractitionerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // ─── STATE MANAGEMENT ───────────────────────────────────────────────

  const [practitionerData, setPractitionerData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [profile, setProfile] = useState({
    discipline: '',
    specializations: '',
    bio: '',
    telehealth: false,
    afterHours: false,
    weekends: false,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, bookRes] = await Promise.all([
        practitionerService.getProfile(),
        bookingService.getBookings()
      ]);

      setPractitionerData(profRes.data);
      setBookings(bookRes.data);

      if (profRes.data) {
        setProfile({
          discipline: profRes.data.discipline || '',
          specializations: profRes.data.specializations?.join(', ') || '',
          bio: profRes.data.bio || '',
          telehealth: profRes.data.telehealth || false,
          afterHours: profRes.data.afterHours || false,
          weekends: profRes.data.weekends || false,
          fee: profRes.data.fee || 80,
          availableSlots: profRes.data.availableSlots || [],
          avatar: profRes.data.avatar || ''
        });

        // Fetch reviews
        const revRes = await reviewService.getPractitionerReviews(profRes.data._id);
        setReviews(revRes.data);
      }
    } catch (err) {
      console.error('Dashboard data fetch failed', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const documents = practitionerData?.complianceDocs || [];
  const complianceProgress = documents.length > 0
    ? (documents.filter((d) => d.status === 'approved').length / 3) * 100
    : 0;

  const summaryCards = [
    { label: 'Total bookings', value: bookings.length, detail: 'Across all time', icon: <CalendarMonth />, color: 'primary.main' },
    { label: 'Client satisfaction', value: practitionerData?.averageRating?.toFixed(1) || '0.0', detail: `${practitionerData?.totalReviews || 0} reviews`, icon: <Star />, color: 'secondary.main' },
    { label: 'Verification', value: practitionerData?.verificationStatus?.toUpperCase() || 'PENDING', detail: practitionerData?.isVerified ? 'Fully Verified' : 'Awaiting Review', icon: <Verified />, color: '#f59e0b' },
  ];

  // ─── HANDLERS ───────────────────────────────────────────────────────

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleSaveProfile = async () => {
    try {
      setActionLoading(true);
      await practitionerService.updateProfile({
        ...profile,
        specializations: profile.specializations.split(',').map(s => s.trim())
      });
      showToast('Profile updated successfully!');
      fetchData(); // Refresh data
    } catch (err) {
      showToast('Profile update failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  // ─── SECTIONS ───────────────────────────────────────────────────────

  const overview = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} md={4} key={card.label}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: '#fff', p: 3 }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: `${card.color}22`, color: card.color }}>{card.icon}</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    {card.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {card.detail}
                  </Typography>
                </Box>
              </Stack>
            </MotionBox>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule color="primary" /> Upcoming Sessions
          </Typography>
          <Stack spacing={2} sx={{ mb: 4 }}>
            {bookings.length > 0 ? (
              bookings.slice(0, 3).map((session, i) => (
                <MotionBox key={i} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { borderColor: 'primary.main', bgcolor: '#f8fafc' },
                      transition: '0.2s',
                    }}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar src={`https://api.dicebear.com/7.x/initials/svg?seed=${session.clientId?.firstName}`} sx={{ width: 52, height: 52 }} />
                          <Box>
                            <Typography fontWeight={800}>{session.clientId?.firstName} {session.clientId?.lastName}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime sx={{ fontSize: 14 }} /> {new Date(session.appointmentDate).toLocaleDateString()} • {session.startTime}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ mr: 1, borderRadius: 2 }}
                          onClick={() => navigate('/chat', { state: { recipient: session.clientId } })}
                        >
                          Chat
                        </Button>
                        <Button variant="contained" color="secondary" size="small" sx={{ borderRadius: 2 }}>
                          Join Call
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </MotionBox>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No upcoming sessions found.
              </Typography>
            )}
          </Stack>

          <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star color="secondary" /> Recent Reviews
          </Typography>
          <Stack spacing={2}>
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <Paper key={rev._id} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={2}>
                      <Avatar src={`https://api.dicebear.com/7.x/initials/svg?seed=${rev.clientId?.firstName}`} />
                      <Box>
                        <Typography fontWeight={800}>{rev.clientId?.firstName} {rev.clientId?.lastName}</Typography>
                        <Rating value={rev.rating} readOnly size="small" />
                        <Typography variant="body2" sx={{ mt: 1 }}>{rev.comment}</Typography>
                      </Box>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No reviews yet.
              </Typography>
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp color="primary" /> Performance Insights
          </Typography>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 6, border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  BOOKING UTILIZATION
                </Typography>
                <Stack direction="row" spacing={2} alignItems="flex-end" sx={{ mt: 1 }}>
                  <Typography variant="h4" fontWeight={900}>
                    {practitionerData?.utilizationRate || 0}%
                  </Typography>
                  <Typography variant="caption" color="success.main" fontWeight={800} sx={{ pb: 0.5 }}>
                    Real-time
                  </Typography>
                </Stack>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  TOTAL SESSIONS
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>
                  {bookings.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Button 
            fullWidth 
            variant="contained" 
            size="large" 
            startIcon={<Message />} 
            onClick={() => navigate('/chat')}
            sx={{ py: 2, borderRadius: 4, fontWeight: 800 }}
          >
            Open Chat Hub
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  const compliance = () => (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>Compliance Hub</Typography>
      <Alert severity={complianceProgress < 100 ? "warning" : "success"} sx={{ mb: 4, borderRadius: 3 }}>
        {complianceProgress < 100 ? "Action Required: Please upload missing documents to achieve full verification." : "Compliance Met: Your profile is fully verified and active."}
      </Alert>

      <Stack spacing={2}>
        {['AHPRA', 'Insurance', 'WWCC'].map((type) => {
          const doc = documents.find(d => d.docType === type);
          return (
            <Paper key={type} variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
              <Grid container alignItems="center" spacing={3}>
                <Grid item>
                  <Avatar sx={{
                    bgcolor: doc?.status === 'approved' ? 'success.light' : doc?.status === 'pending' ? 'warning.light' : 'error.light',
                    width: 56, height: 56
                  }}>
                    {doc?.status === 'approved' ? <CheckCircle /> : doc?.status === 'pending' ? <PendingActions /> : <Warning />}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h6" fontWeight={800}>{type} Registration</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Official documentation required for practice verification.</Typography>
                  <Chip label={doc?.status?.toUpperCase() || 'MISSING'} size="small" color={doc?.status === 'approved' ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
                </Grid>
                <Grid item xs={12} sm="auto" sx={{ textAlign: { sm: 'right' } }}>
                  <Button variant="contained" startIcon={<CloudUpload />} onClick={() => handleUpload(type)} size="small">
                    {doc ? 'Update' : 'Upload Now'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );

  const availabilitySection = () => (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>Clinic Availability</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>Manage your active booking flags and time slots. All sessions are 60 minutes.</Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Practice Hours</Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControlLabel
                control={<Switch checked={profile.telehealth} onChange={(e) => setProfile(prev => ({ ...prev, telehealth: e.target.checked }))} />}
                label={<Box><Typography fontWeight={700}>Telehealth</Typography><Typography variant="caption" color="text.secondary">Accept video consultations</Typography></Box>}
              />
              <FormControlLabel
                control={<Switch checked={profile.afterHours} onChange={(e) => setProfile(prev => ({ ...prev, afterHours: e.target.checked }))} />}
                label={<Box><Typography fontWeight={700}>After-Hours</Typography><Typography variant="caption" color="text.secondary">Available after 5 PM AEST</Typography></Box>}
              />
              <FormControlLabel
                control={<Switch checked={profile.weekends} onChange={(e) => setProfile(prev => ({ ...prev, weekends: e.target.checked }))} />}
                label={<Box><Typography fontWeight={700}>Weekends</Typography><Typography variant="caption" color="text.secondary">Available Saturday/Sunday</Typography></Box>}
              />
              <Divider sx={{ my: 1 }} />

              <Box>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom>Consultation Fee (AUD)</Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={profile.fee || 80}
                  onChange={(e) => setProfile({ ...profile, fee: e.target.value })}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1, fontWeight: 700 }}>$</Typography> }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Box>

              <Button variant="contained" fullWidth size="large" onClick={handleSaveProfile} disabled={actionLoading} sx={{ py: 2, fontWeight: 800 }}>
                {actionLoading ? <CircularProgress size={24} /> : 'Save Availability & Fee'}
              </Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Time Slot Management</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select the time slots you are available for bookings.
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 4 }}>
              {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'].map(slot => (
                <Chip
                  key={slot}
                  label={slot}
                  onClick={() => {
                    const currentSlots = profile.availableSlots || [];
                    const newSlots = currentSlots.includes(slot)
                      ? currentSlots.filter(s => s !== slot)
                      : [...currentSlots, slot].sort();
                    setProfile({ ...profile, availableSlots: newSlots });
                  }}
                  color={(profile.availableSlots || []).includes(slot) ? 'primary' : 'default'}
                  variant={(profile.availableSlots || []).includes(slot) ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Stack>

            <Alert severity="info" sx={{ borderRadius: 3 }}>
              Your availability is dynamically calculated based on these slots and your practice flags.
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const settingsSection = () => (
    <Box sx={{ maxWidth: '1000px' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>Account Settings</Typography>
        <Box sx={{
          px: 3, py: 1,
          borderRadius: 2,
          bgcolor: practitionerData?.isVerified ? '#16a34a' : '#dc2626',
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          height: 40
        }}>
          {practitionerData?.isVerified ? 'Verified' : 'Pending Verification'}
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, border: '1px solid', borderColor: 'divider', bgcolor: '#ffffff' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" /> Professional Profile
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>FIRST NAME</Typography>
                <TextField
                  fullWidth defaultValue={user?.firstName}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>LAST NAME</Typography>
                <TextField
                  fullWidth defaultValue={user?.lastName}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>EMAIL ADDRESS</Typography>
                <TextField
                  fullWidth defaultValue={user?.email}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>DISCIPLINE</Typography>
                <TextField
                  fullWidth value={profile.discipline}
                  onChange={(e) => setProfile({ ...profile, discipline: e.target.value })}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>SPECIALIZATIONS</Typography>
                <TextField
                  fullWidth value={profile.specializations}
                  onChange={(e) => setProfile({ ...profile, specializations: e.target.value })}
                  placeholder="e.g. Sports Rehab, Pediatrics"
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>PUBLIC BIO</Typography>
                <TextField
                  fullWidth multiline rows={3}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Button
              variant="contained"
              size="large"
              sx={{ px: 6, py: 1.8, borderRadius: '50px', fontWeight: 900, fontSize: '0.95rem', boxShadow: '0 8px 20px rgba(0,74,153,0.15)' }}
              onClick={handleSaveProfile}
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── MAIN RENDER ─────────────────────────────────────────────────────

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* Navigation Sidebar */}
          <Grid item xs={12} md={2.5} lg={2}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid', borderColor: 'divider', position: { md: 'sticky' }, top: 100 }}>
              <Stack spacing={1}>
                {[
                  { label: 'Overview', icon: <DashboardIcon /> },
                  { label: 'Compliance', icon: <Assignment />, badge: complianceProgress < 100 },
                  { label: 'Availability', icon: <CalendarMonth /> },
                  { label: 'Settings', icon: <Settings /> },
                ].map((nav, i) => (
                  <Button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    variant={activeTab === i ? 'contained' : 'text'}
                    startIcon={nav.badge ? <Badge color="error" variant="dot">{nav.icon}</Badge> : nav.icon}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start', py: 1.5, px: 2, borderRadius: 3,
                      fontWeight: 700,
                      bgcolor: activeTab === i ? 'primary.main' : 'transparent',
                      color: activeTab === i ? '#fff' : 'text.secondary',
                      '&:hover': { bgcolor: activeTab === i ? 'primary.dark' : 'rgba(0,0,0,0.05)' }
                    }}
                  >
                    {nav.label}
                  </Button>
                ))}
                <Button
                  onClick={() => navigate('/chat')}
                  variant="text"
                  startIcon={<Message />}
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start', py: 1.5, px: 2, borderRadius: 3,
                    fontWeight: 700,
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                  }}
                >
                  Messages
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Main Content Area */}
          <Grid item xs={12} md={9.5} lg={10}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 0 && overview()}
                {activeTab === 1 && compliance()}
                {activeTab === 2 && availabilitySection()}
                {activeTab === 3 && settingsSection()}
              </motion.div>
            </AnimatePresence>

          </Grid>
        </Grid>
      </Container>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ borderRadius: 2, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PractitionerDashboard;
