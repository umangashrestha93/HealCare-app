import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Paper, Avatar, Button, Chip,
  Stack, Divider, Alert, IconButton, CircularProgress,
  useTheme, LinearProgress, TextField, Collapse
} from '@mui/material';
import {
  CalendarMonth, ArrowBack, AccessTime,
  Videocam, ChevronLeft, ChevronRight,
  Verified, Shield, CreditCard, AccountBalanceWallet,
  MedicalServices, LocalOffer
} from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import { clientService, bookingService, medicareService, paymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MOCK_PRACTITIONERS } from '../utils/mockData';

// --- HELPERS ---
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const formatDateToISO = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const formatCurrency = (value) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(value || 0));

const fallbackPaymentMethods = [
  { id: 'card', label: 'Visa / Mastercard', description: 'Secure card checkout for Visa, Mastercard, and debit cards.' },
  { id: 'paypal', label: 'PayPal', description: 'Pay using a PayPal wallet or supported PayPal funding source.' }
];

const Booking = () => {
  const theme = useTheme();
  const navigate = useNavigate();
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
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentMethods, setPaymentMethods] = useState(fallbackPaymentMethods);
  const [medicareOffer, setMedicareOffer] = useState(null);
  const [applyMedicareOffer, setApplyMedicareOffer] = useState(false);
  const [medicareLoading, setMedicareLoading] = useState(false);
  const [medicareError, setMedicareError] = useState('');
  const [medicareForm, setMedicareForm] = useState({
    holderName: '',
    cardNumber: '',
    referenceNumber: '',
    expiryMonth: '',
    expiryYear: ''
  });

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  useEffect(() => {
    if (user && user.role !== 'client') navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'client') return;

    (async () => {
      const [offerResult, paymentResult] = await Promise.allSettled([
        medicareService.getOffer(),
        paymentService.getMethods()
      ]);

      if (offerResult.status === 'fulfilled') {
        const offer = offerResult.value?.offer;
        setMedicareOffer(offer || null);
        setApplyMedicareOffer(Boolean(offer?.eligible));
      }

      if (paymentResult.status === 'fulfilled' && Array.isArray(paymentResult.value?.data)) {
        setPaymentMethods(paymentResult.value.data);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!practitionerId) return;
    (async () => {
      try {
        setLoading(true);
        let p;
        const demoPractitioner = MOCK_PRACTITIONERS.find((item) => item.id === practitionerId);
        if (demoPractitioner) {
          p = {
            ...demoPractitioner,
            _id: demoPractitioner.id,
            avatar: demoPractitioner.image,
            userId: {
              firstName: demoPractitioner.name.split(' ')[0],
              lastName: demoPractitioner.name.split(' ').slice(1).join(' '),
              location: demoPractitioner.location,
            },
          };
        } else {
          const res = await clientService.getPractitionerDetails(practitionerId);
          p = res.data;
        }
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
      if (practitionerId.startsWith('demo-')) {
        setAvailableSlots(['09:00 AM', '10:30 AM', '01:00 PM', '06:00 PM']);
        setSelectedSlot('');
        return;
      }
      const res = await bookingService.getAvailableSlots(practitionerId, selectedDate);
      setAvailableSlots(res.available || []);
      setSelectedSlot('');
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [practitionerId, selectedDate]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    if (practitionerId.startsWith('demo-')) {
      setError('Demo profile selected: in production this would hand off to Splose with the selected date, time, practitioner and funding context.');
      return;
    }
    try {
      setError('');
      setBookingLoading(true);
      const bookingRes = await bookingService.createBooking({
        practitionerId,
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        serviceType,
        applyMedicareOffer
      });
      const checkoutRes = await paymentService.createCheckout({
        bookingId: bookingRes.data._id,
        method: paymentMethod
      });

      if (!checkoutRes.data?.checkoutUrl) {
        throw new Error('Payment checkout could not be started.');
      }

      window.location.assign(checkoutRes.data.checkoutUrl);
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Payment checkout failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleMedicareChange = (field, value) => {
    setMedicareForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMedicareSubmit = async () => {
    try {
      setMedicareError('');
      setMedicareLoading(true);
      const res = await medicareService.verifyCard(medicareForm);
      setMedicareOffer(res.offer);
      setApplyMedicareOffer(Boolean(res.offer?.eligible));
    } catch (err) {
      setApplyMedicareOffer(false);
      setMedicareError(typeof err === 'string' ? err : 'Unable to verify Medicare card.');
    } finally {
      setMedicareLoading(false);
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

  const pricing = useMemo(() => {
    const subtotal = Number(practitioner?.fee ?? 80);
    const discountPercent = applyMedicareOffer && medicareOffer?.eligible ? Number(medicareOffer.percent || 0) : 0;
    const discountAmount = Math.round(subtotal * discountPercent) / 100;
    const total = Math.max(subtotal - discountAmount, 0);

    return {
      subtotal,
      discountPercent,
      discountAmount,
      total
    };
  }, [applyMedicareOffer, medicareOffer, practitioner]);

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff' }}>
      <CircularProgress thickness={4} size={40} />
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
                  {serviceType === 'telehealth' && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <Videocam sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        In-app video room created after payment
                      </Typography>
                    </Stack>
                  )}
                </Box>

                <Box sx={{ p: 2.5, bgcolor: '#fff', border: '1px solid #eee', borderRadius: 3 }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                    <MedicalServices color="primary" fontSize="small" />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" fontWeight={900} color="text.secondary" display="block">
                        MEDICARE OFFER
                      </Typography>
                      <Typography variant="body2" fontWeight={900}>
                        {medicareOffer?.eligible ? `${medicareOffer.percent}% discount available` : 'Add Medicare card to unlock offer'}
                      </Typography>
                    </Box>
                    {medicareOffer?.eligible && (
                      <Chip
                        size="small"
                        color={applyMedicareOffer ? 'success' : 'default'}
                        label={applyMedicareOffer ? 'Applied' : 'Apply'}
                        onClick={() => setApplyMedicareOffer((prev) => !prev)}
                        sx={{ fontWeight: 900 }}
                      />
                    )}
                  </Stack>

                  <Collapse in={!medicareOffer?.eligible}>
                    <Stack spacing={1.5}>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Name on Medicare card"
                            value={medicareForm.holderName}
                            onChange={(event) => handleMedicareChange('holderName', event.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Medicare card number"
                            value={medicareForm.cardNumber}
                            onChange={(event) => handleMedicareChange('cardNumber', event.target.value.replace(/\D/g, '').slice(0, 10))}
                            inputProps={{ inputMode: 'numeric' }}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="IRN"
                            value={medicareForm.referenceNumber}
                            onChange={(event) => handleMedicareChange('referenceNumber', event.target.value.replace(/\D/g, '').slice(0, 2))}
                            inputProps={{ inputMode: 'numeric' }}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="MM"
                            value={medicareForm.expiryMonth}
                            onChange={(event) => handleMedicareChange('expiryMonth', event.target.value.replace(/\D/g, '').slice(0, 2))}
                            inputProps={{ inputMode: 'numeric' }}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="YYYY"
                            value={medicareForm.expiryYear}
                            onChange={(event) => handleMedicareChange('expiryYear', event.target.value.replace(/\D/g, '').slice(0, 4))}
                            inputProps={{ inputMode: 'numeric' }}
                          />
                        </Grid>
                      </Grid>

                      {medicareError && <Alert severity="error" sx={{ py: 0.25, borderRadius: 2 }}>{medicareError}</Alert>}

                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={medicareLoading ? <CircularProgress size={16} /> : <LocalOffer />}
                        onClick={handleMedicareSubmit}
                        disabled={medicareLoading}
                        sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none' }}
                      >
                        Verify and apply offer
                      </Button>
                    </Stack>
                  </Collapse>
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" gutterBottom>PAYMENT METHOD</Typography>
                  <Stack spacing={1}>
                    {paymentMethods.map((method) => {
                      const selected = paymentMethod === method.id;
                      const Icon = method.id === 'paypal' ? AccountBalanceWallet : CreditCard;
                      return (
                        <Button
                          key={method.id}
                          variant={selected ? 'contained' : 'outlined'}
                          onClick={() => setPaymentMethod(method.id)}
                          fullWidth
                          sx={{
                            p: 1.4,
                            borderRadius: 2,
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            textTransform: 'none',
                            boxShadow: 'none'
                          }}
                        >
                          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, width: '100%' }}>
                            <Icon fontSize="small" />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" fontWeight={900} noWrap>
                                {method.label}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  color: selected ? 'rgba(255,255,255,0.78)' : 'text.secondary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {method.description}
                              </Typography>
                            </Box>
                          </Stack>
                        </Button>
                      );
                    })}
                  </Stack>
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" color="text.secondary">Session fee</Typography>
                    <Typography variant="body2" fontWeight={800}>{formatCurrency(pricing.subtotal)}</Typography>
                  </Stack>
                  {pricing.discountAmount > 0 && (
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2" color="success.main" fontWeight={800}>
                        Medicare offer ({pricing.discountPercent}%)
                      </Typography>
                      <Typography variant="body2" color="success.main" fontWeight={900}>
                        -{formatCurrency(pricing.discountAmount)}
                      </Typography>
                    </Stack>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
                    <Typography variant="body1" fontWeight={800}>Grand Total</Typography>
                    <Typography variant="h4" fontWeight={900} color="primary">{formatCurrency(pricing.total)}</Typography>
                  </Box>
                </Stack>

                {error && <Alert severity="error" sx={{ py: 0.5, borderRadius: 2, fontSize: '0.8rem', fontWeight: 700 }}>{error}</Alert>}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={!selectedSlot || bookingLoading}
                  onClick={handleConfirm}
                  sx={{ py: 2, borderRadius: 2, fontWeight: 800, fontSize: '1rem', textTransform: 'none' }}
                >
                  {bookingLoading ? <CircularProgress size={24} color="inherit" /> : `Continue to secure payment (${formatCurrency(pricing.total)})`}
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
