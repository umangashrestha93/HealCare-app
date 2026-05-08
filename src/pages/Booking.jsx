import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Box, Container, Typography, Grid, Paper, Avatar, Button, Chip,
  Stack, Divider, Alert, IconButton, CircularProgress, Skeleton
} from '@mui/material';
import { CheckCircle, CalendarMonth, ArrowBack, AccessTime, Videocam, LocationOn } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { clientService, bookingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const generateAvailableDates = (weekendsAvailable, count = 7) => {
  const dates = [];
  let current = new Date();
  current.setDate(current.getDate() + 1);
  while (dates.length < count) {
    const day = current.getDay();
    const isWeekend = day === 0 || day === 6;
    if (!isWeekend || weekendsAvailable) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current = new Date(current);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
};

const Booking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const practitionerId = searchParams.get('practitioner');

  const [practitioner, setPractitioner] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [serviceType, setServiceType] = useState('telehealth');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'client') navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    if (!practitionerId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await clientService.getPractitionerDetails(practitionerId);
        const p = res.data;
        setPractitioner(p);
        const dates = generateAvailableDates(p.weekends, 7);
        setAvailableDates(dates);
        setSelectedDate(dates[0] || '');
        setServiceType(p.telehealth ? 'telehealth' : 'in-person');
      } catch {
        setError('Failed to load practitioner details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [practitionerId]);

  const fetchSlots = useCallback(async () => {
    if (!practitionerId || !selectedDate) return;
    try {
      setSlotsLoading(true);
      setSelectedSlot('');
      const res = await bookingService.getAvailableSlots(practitionerId, selectedDate);
      setAvailableSlots(res.available || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [practitionerId, selectedDate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    try {
      setError('');
      setBookingLoading(true);
      await bookingService.createBooking({ practitionerId, appointmentDate: selectedDate, startTime: selectedSlot, serviceType });
      setConfirmed(true);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="md"><Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} /></Container>
    </Box>
  );

  if (error && !practitioner) return <Container sx={{ py: 10 }}><Alert severity="error">{error}</Alert></Container>;

  if (confirmed) return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', py: 10 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
            <CheckCircle color="success" sx={{ fontSize: 100, mb: 3 }} />
          </motion.div>
          <Typography variant="h4" fontWeight={800} gutterBottom>Booking Confirmed!</Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            Your session with <strong>{practitioner?.userId?.firstName} {practitioner?.userId?.lastName}</strong>
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            <strong>{formatDate(selectedDate)}</strong> at <strong>{selectedSlot}</strong> • <strong style={{ textTransform: 'capitalize' }}>{serviceType}</strong>
          </Typography>
          <Stack spacing={2}>
            <Button variant="contained" fullWidth size="large" onClick={() => navigate('/dashboard')} sx={{ py: 2, borderRadius: '50px' }}>View in Dashboard</Button>
            <Button variant="text" fullWidth onClick={() => navigate('/marketplace')}>Find Another Specialist</Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
          <Box sx={{ p: 4, bgcolor: 'primary.main', color: '#fff' }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <IconButton onClick={() => navigate(-1)} sx={{ color: '#fff' }} aria-label="Go Back"><ArrowBack /></IconButton>
              <Typography variant="h4" fontWeight={800}>Book Appointment</Typography>
            </Stack>
            <Typography variant="body1" sx={{ opacity: 0.8, ml: 6 }}>2-step booking — pick a date, then a time.</Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                  <Avatar
                    src={practitioner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${practitioner?._id}`}
                    sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                  />
                  <Typography variant="h6" fontWeight={800}>{practitioner?.userId?.firstName} {practitioner?.userId?.lastName}</Typography>
                  <Typography color="primary" variant="caption" fontWeight={700} sx={{ display: 'block', mb: 2 }}>{practitioner?.discipline}</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>SERVICE TYPE</Typography>
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                    {practitioner?.telehealth && (
                      <Chip icon={<Videocam fontSize="small" />} label="Telehealth" size="small"
                        color={serviceType === 'telehealth' ? 'primary' : 'default'}
                        variant={serviceType === 'telehealth' ? 'filled' : 'outlined'}
                        onClick={() => setServiceType('telehealth')} sx={{ fontWeight: 700, cursor: 'pointer' }} />
                    )}
                    <Chip icon={<LocationOn fontSize="small" />} label="In-Person" size="small"
                      color={serviceType === 'in-person' ? 'primary' : 'default'}
                      variant={serviceType === 'in-person' ? 'filled' : 'outlined'}
                      onClick={() => setServiceType('in-person')} sx={{ fontWeight: 700, cursor: 'pointer' }} />
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" color="text.secondary" display="block">Consultation Fee</Typography>
                  <Typography variant="h5" fontWeight={800}>${practitioner?.fee ?? 80}</Typography>
                  <Typography variant="caption" color="text.secondary">per session (AUD)</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={8}>
                <Stack spacing={4}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} gutterBottom>
                      <CalendarMonth fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />1. Select Date
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                      {availableDates.map((d) => (
                        <Chip key={d} label={formatDate(d)} onClick={() => setSelectedDate(d)}
                          color={selectedDate === d ? 'primary' : 'default'}
                          variant={selectedDate === d ? 'filled' : 'outlined'}
                          sx={{ px: 1, fontWeight: 700, minWidth: 90, flexShrink: 0 }} />
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="h6" fontWeight={800} gutterBottom>
                      <AccessTime fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />2. Select Time
                    </Typography>
                    {slotsLoading ? (
                      <Grid container spacing={1}>
                        {[1,2,3,4,5].map(i => <Grid item xs={4} sm={3} key={i}><Skeleton variant="rounded" height={36} sx={{ borderRadius: 2 }} /></Grid>)}
                      </Grid>
                    ) : availableSlots.length > 0 ? (
                      <Grid container spacing={1}>
                        {availableSlots.map((slot) => (
                          <Grid item xs={4} sm={3} key={slot}>
                            <Button fullWidth variant={selectedSlot === slot ? 'contained' : 'outlined'}
                              onClick={() => setSelectedSlot(slot)} size="small" sx={{ fontWeight: 700, borderRadius: 2 }}>{slot}</Button>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Alert severity="info" sx={{ borderRadius: 2 }}>No available slots on this date. Try a different day.</Alert>
                    )}
                  </Box>

                  <Button variant="contained" color="secondary" size="large" fullWidth
                    disabled={!selectedSlot || bookingLoading} onClick={handleConfirm}
                    sx={{ py: 2, borderRadius: '50px', fontSize: '1.1rem', fontWeight: 800 }}>
                    {bookingLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Book'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Booking;
