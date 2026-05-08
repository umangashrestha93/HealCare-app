import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Paper, Avatar, Button, Chip,
  Stack, Divider, Alert, IconButton, CircularProgress, Skeleton,
  useTheme, useMediaQuery, LinearProgress
} from '@mui/material';
import {
  CheckCircle, CalendarMonth, ArrowBack, AccessTime,
  Videocam, LocationOn, ChevronLeft, ChevronRight,
  Verified, Payment, Shield
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { clientService, bookingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// --- HELPERS ---
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const formatDateToISO = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const Booking = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const practitionerId = searchParams.get('practitioner');

  const [practitioner, setPractitioner] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [serviceType, setServiceType] = useState('telehealth');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(formatDateToISO(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()));
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
      const res = await bookingService.getAvailableSlots(practitionerId, selectedDate);
      setAvailableSlots(res.available || []);
      setSelectedSlot('');
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
      await bookingService.createBooking({
        practitionerId, appointmentDate: selectedDate, startTime: selectedSlot, serviceType
      });
      setConfirmed(true);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = formatDateToISO(year, month, i);
      const isPast = date < today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isDisabled = isPast || (isWeekend && !practitioner?.weekends);
      days.push({ day: i, dateStr, isDisabled });
    }
    return days;
  }, [viewDate, today, practitioner]);

  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff' }}>
      <CircularProgress thickness={4} size={40} />
    </Box>
  );

  if (confirmed) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#fcfcfc' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px solid #eee' }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" fontWeight={800} gutterBottom>Confirmed!</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Booking with <strong>{practitioner?.userId?.firstName}</strong> is complete. Check your dashboard for details.
          </Typography>
          <Button variant="contained" fullWidth size="large" onClick={() => navigate('/dashboard')} sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}>Go to Dashboard</Button>
        </Paper>
      </Container>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh', pb: 10 }}>
      {/* --- MINIMALIST HEADER --- */}
      <Box sx={{ borderBottom: '1px solid #eee', py: 2 }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={() => navigate(-1)} size="small" sx={{ border: '1px solid #eee' }}><ArrowBack fontSize="small" /></IconButton>
            <Typography variant="h6" fontWeight={800}>Book Session</Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>

          {/* --- LEFT: PRACTITIONER + CALENDAR + TIME --- */}
          <Grid item xs={12} md={8}>
            <Stack spacing={4}>
              {/* Practitioner Header (Integrated) */}
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar
                  src={practitioner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${practitioner?._id}`}
                  sx={{ width: 80, height: 80, border: '1px solid #eee' }}
                />
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h4" fontWeight={800}>{practitioner?.userId?.firstName} {practitioner?.userId?.lastName}</Typography>
                    <Verified color="primary" sx={{ fontSize: 24 }} />
                  </Stack>
                  <Typography variant="h6" color="text.secondary" fontWeight={600}>
                    {practitioner?.discipline} • <span style={{ color: theme.palette.primary.main }}>${practitioner?.fee}/hr</span>
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              {/* 1. Date Selection */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3, gap: 3 }} >
                  <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: 'center' }}>
                    <CalendarMonth color="primary" />
                    <Typography variant="h6" fontWeight={800}>
                      1. Select a Date
                    </Typography>
                  </Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      border: '1px solid #eee',
                      borderRadius: 2,
                      px: 1,
                      py: 0.5,
                      height: 40,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => changeMonth(-1)}
                      sx={{ p: 0.5 }}
                    >
                      <ChevronLeft fontSize="small" />
                    </IconButton>

                    <Typography
                      variant="body2"
                      fontWeight={800}
                      sx={{
                        minWidth: 140,
                        textAlign: 'center',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {viewDate.toLocaleString('default', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={() => changeMonth(1)}
                      sx={{ p: 0.5 }}
                    >
                      <ChevronRight fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Box sx={{ border: '1px solid #eee', borderRadius: 4, p: 3 }}>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 1,
                    textAlign: 'center',
                    alignItems: 'center'
                  }}>
                    {/* Header Row */}
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <Typography key={`header-${i}`} variant="caption" fontWeight={900} color="text.secondary" sx={{ mb: 2 }}>
                        {d}
                      </Typography>
                    ))}

                    {/* Days Grid */}
                    {calendarDays.map((d, i) => (
                      <Box key={`day-${i}`} sx={{ display: 'flex', justifyContent: 'center' }}>
                        {d ? (
                          <Box
                            onClick={() => !d.isDisabled && setSelectedDate(d.dateStr)}
                            sx={{
                              width: '100%',
                              aspectRatio: '1/1',
                              maxWidth: 38,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              cursor: d.isDisabled ? 'default' : 'pointer',
                              bgcolor: selectedDate === d.dateStr ? 'primary.main' : 'transparent',
                              color: selectedDate === d.dateStr ? '#fff' : d.isDisabled ? '#ddd' : '#333',
                              fontWeight: 700,
                              transition: '0.2s',
                              fontSize: '0.9rem',
                              '&:hover': { bgcolor: d.isDisabled ? 'transparent' : (selectedDate === d.dateStr ? 'primary.main' : '#f5f5f5') }
                            }}
                          >
                            {d.day}
                          </Box>
                        ) : <Box sx={{ aspectRatio: '1/1' }} />}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* 2. Time Selection */}
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AccessTime color="primary" /> 2. Pick a Time
                </Typography>
                <Box sx={{ position: 'relative', border: '1px solid #eee', borderRadius: 4, p: 3, minHeight: 120 }}>
                  {slotsLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />}
                  <AnimatePresence mode="wait">
                    {availableSlots.length > 0 ? (
                      <Grid container spacing={1.5} sx={{ opacity: slotsLoading ? 0.5 : 1, transition: '0.2s' }}>
                        {availableSlots.map(slot => (
                          <Grid item xs={6} sm={4} md={3} key={slot}>
                            <Button
                              fullWidth
                              variant={selectedSlot === slot ? 'contained' : 'outlined'}
                              onClick={() => setSelectedSlot(slot)}
                              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, boxShadow: 'none' }}
                            >
                              {slot}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    ) : !slotsLoading && (
                      <Typography color="text.secondary" fontWeight={600}>No availability for this date.</Typography>
                    )}
                  </AnimatePresence>
                </Box>
              </Box>
            </Stack>
          </Grid>

          {/* --- RIGHT: THE SUMMARY (Aligned & Solid) --- */}
          <Grid item xs={12} md={4} sx={{ position: { md: 'sticky' }, top: 24 }}>
            <Paper elevation={0} sx={{ p: 4, border: '1px solid #eee', borderRadius: 4, bgcolor: '#fcfcfc' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 4 }}>Booking Summary</Typography>

              <Stack spacing={3}>
                <Box sx={{ p: 2.5, bgcolor: '#fff', border: '1px solid #eee', borderRadius: 3 }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" gutterBottom>APPOINTMENT</Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <CalendarMonth color="primary" fontSize="small" />
                    <Typography variant="body2" fontWeight={800}>
                      {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Pick a date'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <AccessTime color="primary" fontSize="small" />
                    <Typography variant="body2" fontWeight={800}>{selectedSlot || 'Select a time'}</Typography>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" gutterBottom>CONSULTATION TYPE</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label="Video"
                      onClick={() => practitioner?.telehealth && setServiceType('telehealth')}
                      color={serviceType === 'telehealth' ? 'primary' : 'default'}
                      variant={serviceType === 'telehealth' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 800, borderRadius: 1.5, flex: 1 }}
                    />
                    <Chip
                      label="Clinic"
                      onClick={() => setServiceType('in-person')}
                      color={serviceType === 'in-person' ? 'primary' : 'default'}
                      variant={serviceType === 'in-person' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 800, borderRadius: 1.5, flex: 1 }}
                    />
                  </Stack>
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight={700}>Grand Total</Typography>
                  <Typography variant="h4" fontWeight={900} color="primary">${practitioner?.fee ?? 80}</Typography>
                </Box>

                {error && <Alert severity="error" sx={{ py: 0.5, borderRadius: 2, fontSize: '0.8rem', fontWeight: 700 }}>{error}</Alert>}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={!selectedSlot || bookingLoading}
                  onClick={handleConfirm}
                  sx={{ py: 2, borderRadius: 2, fontWeight: 800, fontSize: '1rem', textTransform: 'none' }}
                >
                  {bookingLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Booking'}
                </Button>

                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <Shield sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Secure encrypted payment</Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default Booking;
