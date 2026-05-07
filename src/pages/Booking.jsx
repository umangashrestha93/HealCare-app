import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, Container, Typography, Grid, Paper, 
  Avatar, Button, Chip, Stack, Divider, Alert, IconButton
} from '@mui/material';
import { 
  CheckCircle, CalendarMonth, Language, ArrowBack
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PRACTITIONERS, TIME_SLOTS_BY_DATE } from '../utils/mockData';
import { setPractitioner, setBookingDetails, confirmBooking } from '../store/slices/bookingSlice';
import { useAuth } from '../context/AuthContext';

const DATES = Object.keys(TIME_SLOTS_BY_DATE);

const Booking = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const practitionerId = searchParams.get('practitioner');
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedSlot, setSelectedSlot] = useState('');

  const practitioner = MOCK_PRACTITIONERS.find(p => p.id === parseInt(practitionerId)) || MOCK_PRACTITIONERS[0];

  // Role-Based Access
  useEffect(() => {
    if (user && user.role !== 'client') {
      navigate('/dashboard');
    }
    dispatch(setPractitioner(practitioner));
  }, [user, navigate, practitioner, dispatch]);

  const handleConfirm = () => {
    dispatch(setBookingDetails({ date: selectedDate, time: selectedSlot }));
    dispatch(confirmBooking());
    setActiveStep(1);
  };

  if (activeStep === 1) {
    return (
      <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', py: 10 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <CheckCircle color="secondary" sx={{ fontSize: 100, mb: 3 }} />
            </motion.div>
            <Typography variant="h4" fontWeight={800} gutterBottom>Booking Confirmed!</Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Your session with <strong>{practitioner.name}</strong> on <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong> is locked in.
            </Typography>
            <Stack spacing={2}>
              <Button variant="contained" fullWidth size="large" onClick={() => navigate('/dashboard')} sx={{ py: 2, borderRadius: '50px' }}>
                View in Dashboard
              </Button>
              <Button variant="text" fullWidth onClick={() => navigate('/')}>Back to Home</Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
          <Box sx={{ p: 4, bgcolor: 'primary.main', color: '#fff' }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <IconButton onClick={() => navigate(-1)} sx={{ color: '#fff' }} aria-label="Go Back"><ArrowBack /></IconButton>
              <Typography variant="h4" fontWeight={800}>Book Appointment</Typography>
            </Stack>
            <Typography variant="body1" sx={{ opacity: 0.8, ml: 6 }}>
              Quick 2-step booking process.
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                  <Avatar 
                    src={practitioner.image} 
                    sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                  />
                  <Typography variant="h6" fontWeight={800}>{practitioner.name}</Typography>
                  <Typography color="primary" variant="caption" fontWeight={700} sx={{ display: 'block', mb: 2 }}>
                    {practitioner.discipline}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" color="text.secondary" display="block">Consultation Fee</Typography>
                  <Typography variant="h5" fontWeight={800}>${practitioner.fee}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={8}>
                <Stack spacing={4}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} gutterBottom aria-label="Select Date">1. Select Date</Typography>
                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                      {DATES.map((d) => (
                        <Chip 
                          key={d} label={d} 
                          onClick={() => setSelectedDate(d)}
                          color={selectedDate === d ? 'primary' : 'default'}
                          variant={selectedDate === d ? 'filled' : 'outlined'}
                          sx={{ px: 1, fontWeight: 700 }}
                          aria-label={`Select date ${d}`}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="h6" fontWeight={800} gutterBottom aria-label="Select Time">2. Select Time</Typography>
                    <Grid container spacing={1}>
                      {TIME_SLOTS_BY_DATE[selectedDate]?.map((slot) => (
                        <Grid item xs={4} sm={3} key={slot}>
                          <Button 
                            fullWidth variant={selectedSlot === slot ? 'contained' : 'outlined'}
                            onClick={() => setSelectedSlot(slot)}
                            size="small"
                            sx={{ fontWeight: 700 }}
                            aria-label={`Select time slot ${slot}`}
                          >
                            {slot}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Button 
                    variant="contained" color="secondary" size="large" fullWidth
                    disabled={!selectedSlot}
                    onClick={handleConfirm}
                    sx={{ py: 2, borderRadius: '50px', fontSize: '1.1rem', fontWeight: 800 }}
                    aria-label="Confirm Booking"
                  >
                    Confirm & Book
                  </Button>
                  <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                    <Language sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} /> Secure encryption by Stripe
                  </Typography>
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
