import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Paper,
  Avatar, Chip, Stack, Button,
  Divider,
  TextField, Switch,
  Snackbar, Alert, Badge, CircularProgress, Rating, FormControlLabel, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  IconButton,
  Slider
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
  CloudUpload,
  AccessTime,
  CheckCircle,
  InsertDriveFile,
  Shield,
  Star,
  Schedule,
  Person,
  VideoCall,
  UploadFile,
  DeleteOutlined,
  Cancel,
  AddPhotoAlternate,
  AccountBalanceWallet,
  Payments,
  ReceiptLong,
  AccountBalance,
  LocalTaxi,
  AddCircleOutlined,
  AttachMoney,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { practitionerService, bookingService, reviewService } from '../services/api';
import { FUNDING_PATHWAYS } from '../utils/mockData';

const MotionBox = motion.create(Box);

const AVAILABLE_SLOTS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM'
];

const REQUIRED_COMPLIANCE_DOCS = [
  {
    type: 'AHPRA',
    title: 'AHPRA Registration',
    description: 'Upload your current AHPRA registration certificate or confirmation document.'
  },
  {
    type: 'Insurance',
    title: 'Professional Indemnity Insurance',
    description: 'Upload a certificate of currency for your current professional insurance.'
  },
  {
    type: 'WWCC',
    title: 'WWCC Registration',
    description: 'Upload your Working With Children Check registration or clearance document.'
  }
];

const getComplianceStorageKey = (userId) => `beyond5_compliance_drafts_${userId}`;

const readComplianceDrafts = (userId) => {
  if (!userId) return {};
  try {
    const saved = window.localStorage.getItem(getComplianceStorageKey(userId));
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const writeComplianceDrafts = (userId, drafts) => {
  if (!userId) return;
  try {
    const serializable = Object.fromEntries(
      Object.entries(drafts).map(([type, value]) => [
        type,
        { expiryDate: value?.expiryDate || '' }
      ])
    );
    window.localStorage.setItem(getComplianceStorageKey(userId), JSON.stringify(serializable));
  } catch {
    // Local draft persistence is best-effort.
  }
};

const PractitionerDashboard = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // myGigster State
  const [myGigsterData, setMyGigsterData] = useState(null);
  const [myGigsterMetrics, setMyGigsterMetrics] = useState(null);
  const [myGigsterLoading, setMyGigsterLoading] = useState(false);
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);
  const [setupForm, setSetupForm] = useState({
    bankName: '',
    bsb: '',
    accountNumber: '',
    accountHolder: '',
    taxReservePercentage: 20
  });
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Other',
    mileageKm: ''
  });
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  useEffect(() => {
    if (routerLocation.state?.activeTab !== undefined) {
      setActiveTab(routerLocation.state.activeTab);
    }
  }, [routerLocation.state]);

  const [practitionerData, setPractitionerData] = useState(null);
  console.log({user, practitionerData});
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [complianceForms, setComplianceForms] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [selectedComplianceType, setSelectedComplianceType] = useState('AHPRA');
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const complianceDetailsRef = useRef(null);

  const [profile, setProfile] = useState({
    discipline: '',
    gender: '',
    specializations: '',
    bio: '',
    location: '',
    postcode: '',
    travelArea: '',
    travelsToPostcodes: '',
    mobile: false,
    fundingOptions: [],
    sploseStatus: '',
    telehealth: false,
    afterHours: false,
    weekends: false,
    fee: 80,
    availableSlots: [],
    avatar: '',
    sex: '',
    age: '',
    photos: []
  });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const fetchMyGigsterData = async () => {
    try {
      setMyGigsterLoading(true);
      const res = await practitionerService.getMyGigsterInfo();
      if (res.success && res.data) {
        setMyGigsterData(res.data.myGigster);
        setMyGigsterMetrics(res.data.metrics);
        if (res.data.myGigster && res.data.myGigster.isSetup) {
          setSetupForm({
            bankName: res.data.myGigster.bankDetails?.bankName || '',
            bsb: res.data.myGigster.bankDetails?.bsb || '',
            accountNumber: res.data.myGigster.bankDetails?.accountNumber || '',
            accountHolder: res.data.myGigster.bankDetails?.accountHolder || '',
            taxReservePercentage: res.data.myGigster.taxReservePercentage || 20
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch myGigster data:', err);
    } finally {
      setMyGigsterLoading(false);
    }
  };

  const handleSetupMyGigster = async (e) => {
    e.preventDefault();
    if (!setupForm.bankName || !setupForm.bsb || !setupForm.accountNumber || !setupForm.accountHolder) {
      showToast('Please fill out all bank account fields', 'warning');
      return;
    }
    try {
      setActionLoading(true);
      const res = await practitionerService.setupMyGigster(setupForm);
      if (res.success) {
        showToast('myGigster account linked successfully!', 'success');
        setSetupWizardOpen(false);
        await fetchMyGigsterData();
      }
    } catch (err) {
      console.error('Failed to link myGigster:', err);
      showToast(err.response?.data?.message || 'Setup failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayout = async () => {
    try {
      setPayoutSubmitting(true);
      const res = await practitionerService.payoutMyGigster();
      if (res.success) {
        showToast('Instant cashout transfer completed!', 'success');
        setPayoutDialogOpen(false);
        await fetchMyGigsterData();
      }
    } catch (err) {
      console.error('Payout failed:', err);
      showToast(err.response?.data?.message || 'Payout failed', 'error');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) {
      showToast('Description and amount are required', 'warning');
      return;
    }
    try {
      setExpenseSubmitting(true);
      const res = await practitionerService.addMyGigsterExpense({
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        mileageKm: expenseForm.category === 'Mileage' ? Number(expenseForm.mileageKm) : 0
      });
      if (res.success) {
        showToast('Expense logged successfully!', 'success');
        setExpenseForm({ description: '', amount: '', category: 'Other', mileageKm: '' });
        await fetchMyGigsterData();
      }
    } catch (err) {
      console.error('Failed to add expense:', err);
      showToast('Failed to log expense', 'error');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const res = await practitionerService.deleteMyGigsterExpense(id);
      if (res.success) {
        showToast('Expense deleted successfully', 'success');
        await fetchMyGigsterData();
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
      showToast('Failed to delete expense', 'error');
    }
  };

  const handleUpdateSettings = async (field, value) => {
    try {
      const updatedForm = { ...setupForm, [field]: value };
      setSetupForm(updatedForm);
      const res = await practitionerService.updateMyGigsterSettings(updatedForm);
      if (res.success) {
        if (field !== 'taxReservePercentage') {
          showToast('Settings saved successfully', 'success');
        }
        await fetchMyGigsterData();
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      showToast('Failed to save settings', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 4 && user) {
      fetchMyGigsterData();
    }
  }, [activeTab, user]);

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
          gender: profRes.data.gender || '',
          specializations: profRes.data.specializations?.join(', ') || '',
          bio: profRes.data.bio || '',
          location: profRes.data.location || user?.location || '',
          postcode: profRes.data.postcode || '',
          travelArea: profRes.data.travelArea || '',
          travelsToPostcodes: profRes.data.travelsToPostcodes?.join(', ') || '',
          mobile: profRes.data.mobile || false,
          fundingOptions: profRes.data.fundingOptions || [],
          sploseStatus: profRes.data.sploseStatus || 'Splose calendar pending integration',
          telehealth: profRes.data.telehealth || false,
          afterHours: profRes.data.afterHours || false,
          weekends: profRes.data.weekends || false,
          fee: profRes.data.fee || 80,
          availableSlots: profRes.data.availableSlots || [],
          avatar: profRes.data.avatar || '',
          sex: profRes.data.userId?.sex || user?.sex || '',
          age: profRes.data.userId?.age ?? user?.age ?? '',
          photos: profRes.data.photos || []
        });

        // Fetch reviews
        const revRes = await reviewService.getPractitionerReviews(profRes.data._id);
        setReviews(revRes.data);

        // Sync practitioner avatar into auth context so AppBar shows the photo
        if (profRes.data.avatar && profRes.data.avatar !== user?.avatar) {
          updateUser({ ...user, avatar: profRes.data.avatar });
        }
      }
      
      // Load myGigster details on background
      fetchMyGigsterData();
    } catch (err) {
      console.error('Dashboard data fetch failed', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchData();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      setComplianceForms(readComplianceDrafts(user._id || user.id));
    }, 0);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    writeComplianceDrafts(user._id || user.id, complianceForms);
  }, [complianceForms, user]);

  const documents = practitionerData?.complianceDocs || [];
  const approvedDocuments = REQUIRED_COMPLIANCE_DOCS.filter(({ type }) => documents.find((doc) => doc.docType === type && doc.status === 'approved')).length;
  const pendingDocuments = REQUIRED_COMPLIANCE_DOCS.filter(({ type }) => documents.find((doc) => doc.docType === type && doc.status === 'pending')).length;
  const missingDocuments = REQUIRED_COMPLIANCE_DOCS.length - REQUIRED_COMPLIANCE_DOCS.filter(({ type }) => documents.find((doc) => doc.docType === type)).length;
  const complianceProgress = (
    approvedDocuments
    / REQUIRED_COMPLIANCE_DOCS.length
  ) * 100;

  const summaryCards = [
    { label: 'Total bookings', value: bookings.length, detail: 'Across all time', icon: <CalendarMonth />, color: 'primary.main' },
    { label: 'Client satisfaction', value: practitionerData?.averageRating?.toFixed(1) || '0.0', detail: `${practitionerData?.totalReviews || 0} reviews`, icon: <Star />, color: 'secondary.main' },
    { label: 'Verification', value: practitionerData?.verificationStatus?.toUpperCase() || 'PENDING', detail: practitionerData?.isVerified ? 'Fully Verified' : 'Awaiting Review', icon: <Verified />, color: '#f59e0b' },
  ];

  const updateBookingInState = (updatedBooking) => {
    setBookings((prev) => prev.map((booking) => (
      booking._id === updatedBooking._id ? updatedBooking : booking
    )));
  };

  const removeBookingFromState = (bookingId) => {
    setBookings((prev) => prev.filter((booking) => booking._id !== bookingId));
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      setActionLoading(true);
      const res = await bookingService.acceptBooking(bookingId);
      if (res.data) updateBookingInState(res.data);
      showToast('Booking accepted. The client can now join or manage the confirmed appointment.');
    } catch (err) {
      showToast(err || 'Failed to accept booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      setActionLoading(true);
      await bookingService.rejectBooking(bookingId);
      removeBookingFromState(bookingId);
      showToast('Booking declined and removed from upcoming sessions.');
    } catch (err) {
      showToast(err || 'Failed to decline booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    try {
      setActionLoading(true);
      await bookingService.cancelBooking(cancelBookingId);
      removeBookingFromState(cancelBookingId);
      setCancelBookingId(null);
      showToast('Booking cancelled.');
    } catch (err) {
      showToast(err || 'Failed to cancel booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const loadRescheduleSlots = async (practitionerId, date, currentSlot) => {
    try {
      setLoadingSlots(true);
      const res = await bookingService.getAvailableSlots(practitionerId, date);
      const slots = res.available || [];
      setAvailableSlots(currentSlot && !slots.includes(currentSlot) ? [currentSlot, ...slots] : slots);
    } catch (err) {
      showToast(err || 'Failed to load available slots', 'error');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (!rescheduleBooking || !rescheduleDate) return;
    loadRescheduleSlots(rescheduleBooking.practitionerId?._id || rescheduleBooking.practitionerId, rescheduleDate, rescheduleBooking.startTime);
  }, [rescheduleBooking, rescheduleDate]);

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

  const handleRescheduleBooking = async () => {
    if (!rescheduleBooking || !rescheduleDate || !rescheduleTime) return;
    try {
      setRescheduling(true);
      const res = await bookingService.rescheduleBooking(rescheduleBooking._id, {
        date: rescheduleDate,
        time: rescheduleTime
      });
      if (res.data) updateBookingInState(res.data);
      handleCloseReschedule();
      showToast('Booking rescheduled and confirmed.');
    } catch (err) {
      showToast(err || 'Failed to reschedule booking', 'error');
    } finally {
      setRescheduling(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setActionLoading(true);
      await practitionerService.updateProfile({
        ...profile,
        specializations: profile.specializations.split(',').map(s => s.trim()).filter(Boolean),
        travelsToPostcodes: profile.travelsToPostcodes.split(',').map(s => s.trim()).filter(Boolean)
      });
      showToast('Profile updated successfully!');
      fetchData();
    } catch (err) {
      console.error('Profile update failed', err);
      showToast('Profile update failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSlotToggle = (slot) => {
    setProfile((prev) => {
      const currentSlots = prev.availableSlots || [];
      const nextSlots = currentSlots.includes(slot)
        ? currentSlots.filter((item) => item !== slot)
        : [...currentSlots, slot];

      return {
        ...prev,
        availableSlots: AVAILABLE_SLOTS.filter((item) => nextSlots.includes(item))
      };
    });
  };

  const handleFundingToggle = (funding) => {
    setProfile((prev) => ({
      ...prev,
      fundingOptions: prev.fundingOptions.includes(funding)
        ? prev.fundingOptions.filter((item) => item !== funding)
        : [...prev.fundingOptions, funding],
    }));
  };

  const handleSaveAvailability = async () => {
    try {
      setActionLoading(true);
      const payload = {
        ...profile,
        fee: Number(profile.fee) || 80,
        availableSlots: AVAILABLE_SLOTS.filter((slot) => (profile.availableSlots || []).includes(slot)),
        specializations: profile.specializations.split(',').map((item) => item.trim()).filter(Boolean),
        travelsToPostcodes: profile.travelsToPostcodes.split(',').map((item) => item.trim()).filter(Boolean)
      };

      await practitionerService.updateProfile(payload);
      showToast('Availability saved successfully!');
      await fetchData();
    } catch (err) {
      console.error('Availability save failed', err);
      showToast('Availability save failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const updateComplianceForm = (type, patch) => {
    setComplianceForms((prev) => ({
      ...prev,
      [type]: {
        ...(prev[type] || {}),
        ...patch
      }
    }));
  };

  const handleUpload = async (type) => {
    const formState = complianceForms[type] || {};
    if (!formState.file) {
      showToast(`Please choose a ${type} document before uploading.`, 'warning');
      return;
    }

    try {
      setUploadingDocs((prev) => ({ ...prev, [type]: true }));
      const formData = new FormData();
      formData.append('docType', type);
      formData.append('document', formState.file);
      if (formState.expiryDate) formData.append('expiryDate', formState.expiryDate);

      const res = await practitionerService.uploadDocuments(formData);
      setPractitionerData((prev) => ({
        ...prev,
        complianceDocs: res.data || prev?.complianceDocs || []
      }));
      updateComplianceForm(type, { file: null, expiryDate: '' });
      showToast(`${type} document submitted for review.`);
      await fetchData();
    } catch (err) {
      console.error(`${type} upload failed`, err);
      showToast(err || `${type} upload failed`, 'error');
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [type]: false }));
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  const overview = () => (
    <Box sx={{ maxWidth: '1000px' }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={4} key={card.label}>
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
        <Grid item xs={12} md={8}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule color="primary" /> Upcoming Sessions
          </Typography>
          <Stack spacing={2} sx={{ mb: 4 }}>
            {bookings.length > 0 ? (
              bookings.map((session, i) => (
                <MotionBox key={i} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { borderColor: 'primary.main', bgcolor: '#f8fafc' },
                      transition: '0.2s',
                    }}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar src={`https://api.dicebear.com/7.x/initials/svg?seed=${session.clientId?.firstName}`} sx={{ width: 52, height: 52 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={800}>{session.clientId?.firstName} {session.clientId?.lastName}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime sx={{ fontSize: 14 }} /> {new Date(session.appointmentDate).toLocaleDateString()} • {session.startTime}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={session.status === 'pending_approval' ? 'Needs acceptance' : session.status}
                                size="small"
                                color={session.status === 'pending_approval' ? 'warning' : session.status === 'confirmed' ? 'success' : 'default'}
                                sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                              />
                              <Chip
                                label={session.serviceType}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                              />
                            </Stack>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} sx={{ flexWrap: 'wrap', gap: 1 }}>
                          {session.status === 'pending_approval' ? (
                            <>
                              <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                startIcon={<CheckCircle />}
                                disabled={actionLoading}
                                onClick={() => handleAcceptBooking(session._id)}
                                sx={{ borderRadius: 2, fontWeight: 800 }}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Cancel />}
                                disabled={actionLoading}
                                onClick={() => handleRejectBooking(session._id)}
                                sx={{ borderRadius: 2, fontWeight: 800 }}
                              >
                                Decline
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ borderRadius: 2, fontWeight: 800 }}
                                onClick={() => navigate('/chat', { state: { recipient: session.clientId } })}
                              >
                                Chat
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CalendarMonth />}
                                onClick={() => handleOpenReschedule(session)}
                                sx={{ borderRadius: 2, fontWeight: 800 }}
                              >
                                Reschedule
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteOutlined />}
                                onClick={() => setCancelBookingId(session._id)}
                                sx={{ borderRadius: 2, fontWeight: 800 }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                startIcon={<VideoCall />}
                                disabled={session.serviceType !== 'telehealth' || !session.telehealthRoom?.joinUrl}
                                onClick={() => navigate(session.telehealthRoom.joinUrl)}
                                sx={{ borderRadius: 2, fontWeight: 800 }}
                              >
                                Join Call
                              </Button>
                            </>
                          )}
                        </Stack>
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

        <Grid item xs={12} md={4}>
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

  const compliance = () => {
    const selectedRequirement = REQUIRED_COMPLIANCE_DOCS.find((item) => item.type === selectedComplianceType) || REQUIRED_COMPLIANCE_DOCS[0];
    const selectedDoc = documents.find((item) => item.docType === selectedRequirement.type);
    const selectedForm = complianceForms[selectedRequirement.type] || {};
    const isUploading = Boolean(uploadingDocs[selectedRequirement.type]);
    const hasDraft = Boolean(selectedForm.file || selectedForm.expiryDate);
    const selectedStatusColor = selectedDoc?.status === 'approved' ? 'success' : selectedDoc?.status === 'pending' ? 'warning' : selectedDoc?.status === 'rejected' ? 'error' : 'default';
    const selectedStatusLabel = selectedDoc?.status?.toUpperCase() || 'MISSING';

    return (
      <Box sx={{ maxWidth: '1000px' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 6,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: '#fff',
            mb: 3,
            overflow: 'hidden'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                  <Shield />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>Compliance Hub</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
                    Upload and maintain your required verification documents. Select a document from the left, then upload or update it on the right.
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md="auto">
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', minWidth: { md: 340 } }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={900}>VERIFICATION PROGRESS</Typography>
                      <Typography variant="h4" fontWeight={900}>{Math.round(complianceProgress)}%</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={800}>
                      {approvedDocuments}/{REQUIRED_COMPLIANCE_DOCS.length} approved
                    </Typography>
                  </Stack>
                  <Box sx={{ height: 10, borderRadius: 999, bgcolor: '#e2e8f0', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${Math.round(complianceProgress)}%`, bgcolor: complianceProgress === 100 ? 'success.main' : 'primary.main' }} />
                  </Box>
                  <Stack direction="row" spacing={1}>
                    {[
                      { label: 'Approved', value: approvedDocuments, color: 'success.main' },
                      { label: 'Pending', value: pendingDocuments, color: 'warning.main' },
                      { label: 'Missing', value: missingDocuments, color: 'text.secondary' }
                    ].map((item) => (
                      <Box key={item.label} sx={{ flex: 1, p: 1, borderRadius: 2, bgcolor: '#fff', textAlign: 'center', minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={900} sx={{ color: item.color }}>{item.value}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={800} noWrap>{item.label}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        <Alert severity={complianceProgress < 100 ? 'warning' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>
          {complianceProgress < 100 ? 'Action required: upload all required documents and wait for admin approval.' : 'Compliance met: your documents have been approved.'}
        </Alert>

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} sm={4} md={3.5} lg={3}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 6, border: '1px solid', borderColor: 'divider', bgcolor: '#fff', height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={900} sx={{ mb: 1.5 }}>REQUIRED DOCUMENTS</Typography>
              <Stack spacing={1}>
                {REQUIRED_COMPLIANCE_DOCS.map((item) => {
                  const doc = documents.find((documentItem) => documentItem.docType === item.type);
                  const statusColor = doc?.status === 'approved' ? 'success' : doc?.status === 'pending' ? 'warning' : doc?.status === 'rejected' ? 'error' : 'default';
                  const isSelected = selectedRequirement.type === item.type;
                  const hasItemDraft = Boolean(complianceForms[item.type]?.file || complianceForms[item.type]?.expiryDate);

                  return (
                    <Button
                      key={item.type}
                      onClick={() => {
                        setSelectedComplianceType(item.type);
                        if (window.innerWidth < 600) {
                          setTimeout(() => {
                            complianceDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }
                      }}
                      variant={isSelected ? 'contained' : 'outlined'}
                      fullWidth
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        bgcolor: isSelected ? 'primary.main' : '#fff',
                        color: isSelected ? '#fff' : 'text.primary',
                        borderColor: hasItemDraft ? 'primary.main' : 'divider',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
                        <Avatar sx={{ width: 38, height: 38, bgcolor: isSelected ? 'rgba(255,255,255,0.18)' : '#f1f5f9', color: isSelected ? '#fff' : 'text.secondary' }}>
                          {doc?.status === 'approved' ? <CheckCircle fontSize="small" /> : doc?.status === 'pending' ? <PendingActions fontSize="small" /> : <InsertDriveFile fontSize="small" />}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={900} noWrap>{item.title}</Typography>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                            <Chip label={doc?.status?.toUpperCase() || 'MISSING'} size="small" color={statusColor} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                            {hasItemDraft && <Chip label="DRAFT" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />}
                          </Stack>
                        </Box>
                      </Stack>
                    </Button>
                  );
                })}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={8} md={8.5} lg={9} ref={complianceDetailsRef}>
            <Paper elevation={0} sx={{ borderRadius: 6, border: '1px solid', borderColor: hasDraft ? 'primary.main' : 'divider', bgcolor: '#fff', height: '100%', overflow: 'hidden' }}>
              <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: '1px solid', borderColor: 'divider', bgcolor: hasDraft ? 'rgba(0, 74, 153, 0.04)' : '#fff' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" fontWeight={900}>{selectedRequirement.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 640 }}>
                      {selectedRequirement.description}
                    </Typography>
                  </Box>
                  <Chip label={selectedStatusLabel} color={selectedStatusColor} sx={{ fontWeight: 900, alignSelf: { xs: 'flex-start', sm: 'center' } }} />
                </Stack>
              </Box>

              <Grid container spacing={0}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', borderRight: { md: '1px solid' }, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={900} sx={{ mb: 1.5 }}>CURRENT FILE</Typography>
                    {selectedDoc?.url ? (
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc' }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <InsertDriveFile />
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography fontWeight={900} noWrap>{selectedDoc.originalName || `${selectedRequirement.type} document`}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedDoc.uploadedAt ? `Uploaded ${new Date(selectedDoc.uploadedAt).toLocaleDateString()}` : 'Uploaded'}
                            </Typography>
                            {selectedDoc.expiryDate && (
                              <Typography variant="body2" color="text.secondary">
                                Expires {new Date(selectedDoc.expiryDate).toLocaleDateString()}
                              </Typography>
                            )}
                            <Button size="small" href={selectedDoc.url} target="_blank" rel="noreferrer" sx={{ mt: 1 }}>
                              View document
                            </Button>
                          </Box>
                        </Stack>
                      </Paper>
                    ) : (
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, bgcolor: '#f8fafc', textAlign: 'center' }}>
                        <InsertDriveFile color="disabled" />
                        <Typography fontWeight={900} sx={{ mt: 1 }}>No document uploaded</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Upload this document to send it for admin review.
                        </Typography>
                      </Paper>
                    )}

                    {hasDraft && (
                      <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
                        Draft changes are saved on this device until you submit.
                      </Alert>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', bgcolor: '#f8fafc' }}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={900} sx={{ mb: 1.5 }}>UPLOAD DETAILS</Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ display: 'block', mb: 0.75 }}>
                          EXPIRY DATE
                        </Typography>
                        <TextField
                          type="date"
                          size="small"
                          fullWidth
                          value={selectedForm.expiryDate || (selectedDoc?.expiryDate ? new Date(selectedDoc.expiryDate).toISOString().slice(0, 10) : '')}
                          onChange={(event) => updateComplianceForm(selectedRequirement.type, { expiryDate: event.target.value })}
                          sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' },
                            '& input': { minWidth: 0 }
                          }}
                        />
                      </Box>

                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        sx={{
                          borderRadius: 2,
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          overflow: 'hidden',
                          minHeight: 48,
                          bgcolor: '#fff'
                        }}
                      >
                        <Typography variant="body2" noWrap sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedForm.file?.name || 'Choose PDF or image'}
                        </Typography>
                        <input
                          hidden
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={(event) => updateComplianceForm(selectedRequirement.type, { file: event.target.files?.[0] || null })}
                        />
                      </Button>

                      <Button
                        variant="contained"
                        startIcon={isUploading ? null : <CloudUpload />}
                        onClick={() => handleUpload(selectedRequirement.type)}
                        disabled={isUploading}
                        fullWidth
                        sx={{ borderRadius: 2, fontWeight: 900, minHeight: 48 }}
                      >
                        {isUploading ? <CircularProgress size={22} color="inherit" /> : selectedDoc ? 'Submit Updated Document' : 'Submit Document'}
                      </Button>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const availabilitySection = () => (
    <Box sx={{ maxWidth: '1000px' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>
            Clinic Availability
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 680 }}>
            Manage how clients can book you. Your selected slots are saved to your practitioner profile and used by the booking flow.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveAvailability}
          disabled={actionLoading}
          sx={{ borderRadius: 3, fontWeight: 900, px: 3, minHeight: 48 }}
        >
          {actionLoading ? <CircularProgress size={22} color="inherit" /> : 'Save Availability'}
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          {
            key: 'telehealth',
            title: 'Telehealth',
            detail: 'Accept secure video consultations',
            activeLabel: 'Online sessions enabled'
          },
          {
            key: 'afterHours',
            title: 'After-hours',
            detail: 'Show availability after 5 PM AEST',
            activeLabel: 'Evening sessions enabled'
          },
          {
            key: 'weekends',
            title: 'Weekends',
            detail: 'Show Saturday and Sunday availability',
            activeLabel: 'Weekend sessions enabled'
          },
          {
            key: 'mobile',
            title: 'Mobile visits',
            detail: 'Show that you can travel to clients',
            activeLabel: 'Travel-to-client enabled'
          }
        ].map((item) => {
          const checked = Boolean(profile[item.key]);
          return (
            <Grid item xs={12} sm={6} md={3} key={item.key}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  height: '100%',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: checked ? 'primary.main' : 'divider',
                  bgcolor: checked ? 'rgba(0, 74, 153, 0.04)' : '#fff',
                  transition: '0.2s',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={900}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {item.detail}
                    </Typography>
                  </Box>
                  <Switch
                    checked={checked}
                    onChange={(e) => setProfile((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                  />
                </Stack>
                <Chip
                  size="small"
                  color={checked ? 'primary' : 'default'}
                  variant={checked ? 'filled' : 'outlined'}
                  label={checked ? item.activeLabel : 'Disabled'}
                  sx={{ mt: 2, maxWidth: '100%' }}
                />
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={5} md={4}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 6, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight={900}>Session Settings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
              Pricing is shown to clients before they book.
            </Typography>

            <Typography variant="subtitle2" fontWeight={800} gutterBottom>Consultation Fee (AUD)</Typography>
            <TextField
              fullWidth
              type="number"
              value={profile.fee || 80}
              onChange={(e) => setProfile({ ...profile, fee: e.target.value })}
              InputProps={{ startAdornment: <Typography sx={{ mr: 1, fontWeight: 700 }}>$</Typography> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
            />

            <Divider sx={{ my: 3 }} />

            <Stack spacing={1.25}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Selected slots</Typography>
                <Typography fontWeight={900}>{(profile.availableSlots || []).length}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Service types</Typography>
                <Typography fontWeight={900}>{profile.telehealth ? 'Telehealth' : 'In person'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Extended hours</Typography>
                <Typography fontWeight={900}>{profile.afterHours || profile.weekends ? 'Enabled' : 'Off'}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={7} md={8}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 6, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={900}>Time Slot Management</Typography>
                <Typography variant="body2" color="text.secondary">
                  Select the start times clients can book. Sessions are 60 minutes.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => setProfile((prev) => ({ ...prev, availableSlots: AVAILABLE_SLOTS }))}>
                  Select all
                </Button>
                <Button size="small" variant="text" onClick={() => setProfile((prev) => ({ ...prev, availableSlots: [] }))}>
                  Clear
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  sm: 'repeat(3, minmax(0, 1fr))',
                  md: 'repeat(4, minmax(0, 1fr))',
                },
                gap: 1,
                mb: 3,
              }}
            >
              {AVAILABLE_SLOTS.map((slot) => {
                const selected = (profile.availableSlots || []).includes(slot);
                return (
                  <Button
                    key={slot}
                    variant={selected ? 'contained' : 'outlined'}
                    color={selected ? 'primary' : 'inherit'}
                    onClick={() => handleSlotToggle(slot)}
                    startIcon={<AccessTime />}
                    sx={{
                      minHeight: 44,
                      borderRadius: 2,
                      fontWeight: 800,
                      justifyContent: 'center',
                      px: 1,
                      '& .MuiButton-startIcon': { mr: 0.75 },
                    }}
                  >
                    {slot}
                  </Button>
                );
              })}
            </Box>

            <Alert severity={(profile.availableSlots || []).length > 0 ? 'success' : 'warning'} sx={{ borderRadius: 2 }}>
              {(profile.availableSlots || []).length > 0
                ? `${(profile.availableSlots || []).length} booking slots selected. Save to persist these changes.`
                : 'No time slots selected. Clients will not see bookable times until you add slots.'}
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

            {/* Profile Photo Upload */}
            <Paper variant="outlined" sx={{ p: 3, mb: 4, display: 'flex', alignItems: 'center', gap: 3, borderRadius: 3, bgcolor: '#f8fafc' }}>
              <Avatar
                src={profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || 'P'}`}
                sx={{ width: 96, height: 96, border: '3px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight={900} gutterBottom>
                  Profile Photo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This photo appears on your marketplace listing. Use a professional portrait. Accepted formats: JPG, PNG. Max 2 MB.
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    size="small"
                    component="label"
                    startIcon={<UploadFile />}
                    sx={{ fontWeight: 800, borderRadius: 2 }}
                  >
                    {profile.avatar ? 'Change Photo' : 'Upload Photo'}
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          showToast('Image exceeds 5 MB limit.', 'warning');
                          return;
                        }
                        const img = new Image();
                        const objectUrl = URL.createObjectURL(file);
                        img.onload = () => {
                          const MAX = 240;
                          const scale = Math.min(MAX / img.width, MAX / img.height, 1);
                          const w = Math.round(img.width * scale);
                          const h = Math.round(img.height * scale);
                          const canvas = document.createElement('canvas');
                          canvas.width = w;
                          canvas.height = h;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(img, 0, 0, w, h);
                          const compressed = canvas.toDataURL('image/jpeg', 0.82);
                          setProfile((prev) => ({ ...prev, avatar: compressed }));
                          URL.revokeObjectURL(objectUrl);
                          showToast('Photo selected — save your profile to apply this change.');
                        };
                        img.src = objectUrl;
                      }}
                    />
                  </Button>
                  {profile.avatar && (
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      startIcon={<DeleteOutlined />}
                      sx={{ fontWeight: 700 }}
                      onClick={() => {
                        setProfile((prev) => ({ ...prev, avatar: '' }));
                        showToast('Photo removed — save your profile to persist this change.');
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
              </Box>
            </Paper>

            {/* Portfolio Photos & Gallery Upload */}
            <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: '#f8fafc' }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={900}>
                    Portfolio Gallery ({(profile.photos || []).length} / 6)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload up to 6 photos of your workspace, therapy rooms, tools, or materials. Max 2 MB per image.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  startIcon={<AddPhotoAlternate />}
                  disabled={profile.photos?.length >= 6}
                  sx={{ fontWeight: 800, borderRadius: 2 }}
                >
                  Upload Photo
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if ((profile.photos || []).length >= 6) {
                        showToast('You can upload up to 6 portfolio photos.', 'warning');
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        showToast('Image exceeds 2 MB limit.', 'warning');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setProfile((prev) => ({
                          ...prev,
                          photos: [...(prev.photos || []), event.target.result]
                        }));
                        showToast('Portfolio photo added — save profile to persist.');
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </Button>
              </Box>

              {(!profile.photos || profile.photos.length === 0) ? (
                <Box sx={{ py: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: '#fff' }}>
                  <Typography variant="body2" color="text.disabled" fontWeight={700}>
                    No portfolio photos uploaded yet. Click "Upload Photo" to begin.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {profile.photos.map((photo, index) => (
                     <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
                       <Box sx={{ position: 'relative', height: 110, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                         <Box
                           component="img"
                           src={photo}
                           alt={`Portfolio photo ${index + 1}`}
                           sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                         />
                         <IconButton
                           size="small"
                           onClick={() => {
                             setProfile((prev) => ({
                               ...prev,
                               photos: prev.photos.filter((_, i) => i !== index)
                             }));
                             showToast('Photo removed — save profile to persist.', 'info');
                           }}
                           sx={{
                             position: 'absolute',
                             top: 4,
                             right: 4,
                             bgcolor: 'rgba(255,255,255,0.9)',
                             boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                             color: 'error.main',
                             '&:hover': { bgcolor: 'error.main', color: '#fff' }
                           }}
                         >
                           <DeleteOutlined sx={{ fontSize: 16 }} />
                         </IconButton>
                       </Box>
                     </Grid>
                  ))}
                </Grid>
              )}
            </Paper>

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
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>GENDER SHOWN ON PROFILE</Typography>
                <TextField
                  fullWidth value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  placeholder="Female, Male, Non-binary, Prefer not to say"
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>AGE</Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  placeholder="e.g. 32"
                  variant="outlined"
                  inputProps={{ min: 0, max: 120 }}
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
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>LOCATION</Typography>
                <TextField
                  fullWidth value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Suburb, state"
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>POSTCODE</Typography>
                <TextField
                  fullWidth value={profile.postcode}
                  onChange={(e) => setProfile({ ...profile, postcode: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  inputProps={{ inputMode: 'numeric' }}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>TRAVEL AREA</Typography>
                <TextField
                  fullWidth value={profile.travelArea}
                  onChange={(e) => setProfile({ ...profile, travelArea: e.target.value })}
                  placeholder="Travels within 20 km"
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>POSTCODES YOU WILL TRAVEL TO</Typography>
                <TextField
                  fullWidth value={profile.travelsToPostcodes}
                  onChange={(e) => setProfile({ ...profile, travelsToPostcodes: e.target.value })}
                  placeholder="3056, 3070, 3072"
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
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f8fafc' }}>
                  <Typography variant="caption" fontWeight={900} color="text.secondary">FUNDING PATHWAYS ACCEPTED</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
                    {FUNDING_PATHWAYS.map((funding) => (
                      <FormControlLabel
                        key={funding}
                        control={<Checkbox checked={profile.fundingOptions.includes(funding)} onChange={() => handleFundingToggle(funding)} />}
                        label={<Typography variant="body2">{funding}</Typography>}
                      />
                    ))}
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>SPLOSE AVAILABILITY NOTES</Typography>
                <TextField
                  fullWidth value={profile.sploseStatus}
                  onChange={(e) => setProfile({ ...profile, sploseStatus: e.target.value })}
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

  const myGigsterSection = () => {
    const isSetup = myGigsterData?.isSetup;
    const balance = myGigsterMetrics?.availableBalance ?? 0;
    const taxRate = myGigsterData?.taxReservePercentage ?? 20;
    const gross = myGigsterMetrics?.grossEarnings ?? 0;
    const payouts = myGigsterMetrics?.totalPayouts ?? 0;
    const deductions = myGigsterMetrics?.totalDeductions ?? 0;
    const taxSaved = myGigsterMetrics?.estimatedTaxSaved ?? 0;

    const formattedBalance = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(balance);
    const formattedGross = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(gross);
    const formattedPayouts = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(payouts);
    const formattedDeductions = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(deductions);
    const formattedTaxSaved = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(taxSaved);

    if (myGigsterLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      );
    }

    return (
      <>
        {!isSetup ? (
          <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 2 }}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 6,
                border: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #0B1D2B 0%, #172554 100%)',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(65,198,198,0.2) 0%, rgba(65,198,198,0) 70%)',
                }}
              />
              
              <AccountBalanceWallet sx={{ fontSize: 72, color: 'secondary.main', mb: 3 }} />
              
              <Typography variant="h4" fontWeight={900} gutterBottom sx={{ letterSpacing: -0.8 }}>
                Link your myGigster Wallet
              </Typography>
              
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: '600px', mx: 'auto', mb: 4, lineHeight: 1.7 }}>
                Beyond5 partners with myGigster to offer embedded financial services tailored for independent healthcare practitioners. Automate your tax withholding, track business travel deductions, and cash out your session earnings instantly.
              </Typography>

              <Grid container spacing={3} sx={{ mb: 5, textAlign: 'left' }}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 3, height: '100%', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Payments sx={{ color: 'secondary.main', mb: 1 }} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#fff' }}>Instant Payouts</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5, display: 'block' }}>
                      Cash out your earnings directly to your bank account immediately after session approval.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 3, height: '100%', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <ReceiptLong sx={{ color: 'secondary.main', mb: 1 }} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#fff' }}>Tax Reserve Control</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5, display: 'block' }}>
                      Auto-withhold a customized percentage of your fee income in a secure tax reserve account.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 3, height: '100%', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <LocalTaxi sx={{ color: 'secondary.main', mb: 1 }} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#fff' }}>Expense Tracking</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5, display: 'block' }}>
                      Log travel mileage and general equipment/software expenses to maximize your tax deductions.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => setSetupWizardOpen(true)}
                sx={{
                  px: 5,
                  py: 2,
                  borderRadius: '50px',
                  fontWeight: 900,
                  boxShadow: '0 8px 25px rgba(65,198,198,0.35)',
                }}
              >
                Get Started with myGigster
              </Button>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ maxWidth: '1100px', mx: 'auto' }}>
            {/* myGigster Header Banner */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 4,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #0B1D2B 0%, #1e293b 50%, #0d9488 100%)',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                  <AccountBalanceWallet sx={{ color: 'secondary.main' }} />
                  <Typography variant="caption" fontWeight={900} sx={{ letterSpacing: 1.5, textTransform: 'uppercase', color: 'secondary.main' }}>
                    myGigster Embedded Partner
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -0.8 }}>
                  Financial Control Panel
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                  Account Linked: <Typography component="span" variant="body2" fontFamily="monospace" color="secondary.main">{myGigsterData?.accountId}</Typography>
                </Typography>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -40,
                  right: -40,
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(13,148,136,0.3) 0%, rgba(13,148,136,0) 70%)',
                }}
              />
            </Paper>

            {/* Metrics Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Available for Cashout */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                    Available to Cashout
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ mt: 1, mb: 2 }}>
                    {formattedBalance}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    disabled={balance <= 0 || actionLoading}
                    onClick={() => setPayoutDialogOpen(true)}
                    startIcon={<Payments />}
                    sx={{ borderRadius: 2.5, fontWeight: 800, color: 'white' }}
                  >
                    Instant Cashout
                  </Button>
                </Paper>
              </Grid>

              {/* Tax Reserve Account */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                    Total Tax Reserve
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ mt: 1, mb: 0.5 }}>
                    {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(gross * (taxRate / 100))}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Auto-withholding at <strong>{taxRate}%</strong>
                  </Typography>
                  <Chip label="Auto-withholding active" size="small" color="success" variant="outlined" sx={{ fontWeight: 800 }} />
                </Paper>
              </Grid>

              {/* Business Deductions */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                    Tracked Deductions
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ mt: 1, mb: 0.5 }}>
                    {formattedDeductions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Total business expenses logged
                  </Typography>
                  <Chip label="Deduction Log Active" size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                </Paper>
              </Grid>

              {/* Estimated Tax Saved */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', bgcolor: 'rgba(65,198,198,0.04)' }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                    Estimated Tax Saved
                  </Typography>
                  <Typography variant="h4" fontWeight={900} color="teal" sx={{ mt: 1, mb: 0.5 }}>
                    {formattedTaxSaved}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Based on current tax reserve rate
                  </Typography>
                  <Chip label="Estimated Savings" size="small" color="primary" sx={{ fontWeight: 800 }} />
                </Paper>
              </Grid>
            </Grid>

            {/* Action and Log Columns */}
            <Grid container spacing={4}>
              {/* Expense Logger and Payout History */}
              <Grid item xs={12} md={7}>
                {/* Expense Logging Form */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalTaxi color="primary" /> Track New Expense / Mileage
                  </Typography>
                  <form onSubmit={handleAddExpense}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Expense Description"
                          placeholder="e.g. Speech Pathology Blocks"
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                          required
                          variant="outlined"
                          size="small"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Amount ($)"
                          type="number"
                          placeholder="45.00"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          required
                          variant="outlined"
                          size="small"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={expenseForm.category}
                            label="Category"
                            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value, mileageKm: e.target.value === 'Mileage' ? expenseForm.mileageKm : '' })}
                            sx={{ borderRadius: 2.5 }}
                          >
                            <MenuItem value="Mileage">Mileage</MenuItem>
                            <MenuItem value="Equipment">Equipment</MenuItem>
                            <MenuItem value="Software">Software</MenuItem>
                            <MenuItem value="Travel">Travel</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      {expenseForm.category === 'Mileage' && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Mileage Travelled (km)"
                            type="number"
                            placeholder="25"
                            value={expenseForm.mileageKm}
                            onChange={(e) => {
                              const km = e.target.value;
                              const calculatedAmount = (Number(km) * 0.85).toFixed(2);
                              setExpenseForm({ ...expenseForm, mileageKm: km, amount: calculatedAmount });
                            }}
                            required
                            variant="outlined"
                            size="small"
                            helperText="Calculated deduction based on ATO standard rate (85¢/km)"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={expenseSubmitting}
                          startIcon={<AddCircleOutlined />}
                          sx={{ borderRadius: 2.5, fontWeight: 800, px: 3 }}
                        >
                          {expenseSubmitting ? 'Logging...' : 'Log Expense'}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>

                  {/* Logged Expenses List */}
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2 }}>
                    Logged Deductions ({myGigsterData?.expenses?.length || 0})
                  </Typography>
                  {myGigsterData?.expenses && myGigsterData.expenses.length > 0 ? (
                    <Stack spacing={1.5} sx={{ maxHeight: 250, overflowY: 'auto' }}>
                      {myGigsterData.expenses.map((exp) => (
                        <Paper
                          key={exp._id}
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                            <Avatar sx={{ bgcolor: exp.category === 'Mileage' ? 'rgba(65,198,198,0.1)' : 'rgba(11,29,43,0.06)', color: exp.category === 'Mileage' ? 'secondary.main' : 'primary.main' }}>
                              {exp.category === 'Mileage' ? <LocalTaxi /> : <ReceiptLong />}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={800}>{exp.description}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {exp.category} {exp.category === 'Mileage' && `(${exp.mileageKm} km)`} • {new Date(exp.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="body2" fontWeight={900} color="error.main">
                              -{new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(exp.amount)}
                            </Typography>
                            <IconButton size="small" onClick={() => handleDeleteExpense(exp._id)} color="error">
                              <DeleteOutlined fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                      No logged expenses. Log mileage or equipment above to track your deductions.
                    </Typography>
                  )}
                </Paper>

                {/* Payout & Earnings Transaction History */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptLong color="primary" /> Transaction History
                  </Typography>
                  {myGigsterData?.payoutHistory && myGigsterData.payoutHistory.length > 0 ? (
                    <Stack spacing={1.5} sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {myGigsterData.payoutHistory.map((tx) => (
                        <Paper
                          key={tx._id}
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                            <Avatar sx={{ bgcolor: 'rgba(22,163,74,0.1)', color: '#41C6C6' }}>
                              <AccountBalance />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={800}>Instant Payout (myGigster Settlement)</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Ref: {tx.reference} • {new Date(tx.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Stack>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" fontWeight={900} color="success.main">
                              {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(tx.amount)}
                            </Typography>
                            <Chip
                              label={tx.status}
                              size="small"
                              color="success"
                              sx={{ height: 18, fontSize: 10, fontWeight: 800, mt: 0.5 }}
                            />
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                      No payout history found. Cash out your available earnings to see transactions here.
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Right Panel: Settings and Payout Details */}
              <Grid item xs={12} md={5}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance color="primary" /> Linked Payout Account
                  </Typography>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Account Holder</Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>{myGigsterData?.bankDetails?.accountHolder || 'Not Set'}</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={5}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>BSB</Typography>
                        <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>{myGigsterData?.bankDetails?.bsb || 'Not Set'}</Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Account Number</Typography>
                        <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                          {myGigsterData?.bankDetails?.accountNumber
                            ? `******${myGigsterData.bankDetails.accountNumber.slice(-4)}`
                            : 'Not Set'}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Box>
                      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Financial Institution</Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>{myGigsterData?.bankDetails?.bankName || 'Not Set'}</Typography>
                    </Box>
                    <Divider />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSetupWizardOpen(true)}
                      sx={{ borderRadius: 2.5, fontWeight: 800 }}
                    >
                      Update Bank Account
                    </Button>
                  </Stack>
                </Paper>

                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptLong color="primary" /> Automated Tax Reserves
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                    Adjust how much of your session earnings is automatically reserved in your secure myGigster tax account. This helps prevent large tax liability bills at the end of the financial year.
                  </Typography>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={taxRate}
                      onChange={(e, val) => handleUpdateSettings('taxReservePercentage', val)}
                      valueLabelDisplay="auto"
                      step={5}
                      marks={[
                        { value: 0, label: '0%' },
                        { value: 15, label: '15%' },
                        { value: 20, label: '20%' },
                        { value: 30, label: '30%' },
                        { value: 40, label: '40%' }
                      ]}
                      min={0}
                      max={40}
                      sx={{ color: 'secondary.main', mb: 3 }}
                    />
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', borderStyle: 'dashed' }}>
                      <Typography variant="body2" fontWeight={800} align="center">
                        Current Rate: {taxRate}% auto-reserve
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
                        For a $150 session, ${((150 * taxRate) / 100).toFixed(2)} will be set aside.
                      </Typography>
                    </Paper>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Dialogs rendered at the root of myGigsterSection return, so they are always mounted */}
        <Dialog open={setupWizardOpen} onClose={() => setSetupWizardOpen(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 5 } }}>
          <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
            Link myGigster Payout Account
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your banking details. Funds cashed out instantly will be settled directly to this account via myGigster's Real-Time Payouts network.
            </Typography>
            <form id="mygigster-setup-form" onSubmit={handleSetupMyGigster}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  required
                  value={setupForm.accountHolder}
                  onChange={(e) => setSetupForm({ ...setupForm, accountHolder: e.target.value })}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
                <TextField
                  fullWidth
                  label="Financial Institution Name"
                  placeholder="e.g. Commonwealth Bank"
                  required
                  value={setupForm.bankName}
                  onChange={(e) => setSetupForm({ ...setupForm, bankName: e.target.value })}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      label="BSB Number"
                      placeholder="062-900"
                      required
                      value={setupForm.bsb}
                      onChange={(e) => setSetupForm({ ...setupForm, bsb: e.target.value })}
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid item xs={7}>
                    <TextField
                      fullWidth
                      label="Account Number"
                      placeholder="12345678"
                      required
                      value={setupForm.accountNumber}
                      onChange={(e) => setSetupForm({ ...setupForm, accountNumber: e.target.value })}
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Default Tax Withholding Reserve Percentage
                  </Typography>
                  <Slider
                    value={setupForm.taxReservePercentage}
                    onChange={(e, val) => setSetupForm({ ...setupForm, taxReservePercentage: val })}
                    valueLabelDisplay="auto"
                    step={5}
                    min={0}
                    max={40}
                    sx={{ color: 'secondary.main', px: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Recommended: 20% to cover income tax obligation.
                  </Typography>
                </Box>
              </Stack>
            </form>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setSetupWizardOpen(false)} sx={{ fontWeight: 800 }}>Cancel</Button>
            <Button
              type="submit"
              form="mygigster-setup-form"
              variant="contained"
              color="secondary"
              disabled={actionLoading}
              sx={{ borderRadius: 3, fontWeight: 900, px: 3 }}
            >
              {actionLoading ? 'Linking...' : 'Link Account'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={payoutDialogOpen} onClose={() => setPayoutDialogOpen(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 5 } }}>
          <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
            Confirm Instant Cashout
          </DialogTitle>
          <DialogContent sx={{ minWidth: 320 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You are cashing out your total available earnings through the myGigster Real-Time Settlement network.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f8fafc', mb: 3 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Gross Earnings:</Typography>
                  <Typography variant="body2" fontWeight={800}>{formattedBalance}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">myGigster Payout Fee (1.5%):</Typography>
                  <Typography variant="body2" fontWeight={800} color="error.main">
                    -{new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(balance * 0.015)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body1" fontWeight={800}>Net Cashout Transfer:</Typography>
                  <Typography variant="body1" fontWeight={900} color="success.main">
                    {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(balance * 0.985)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
            <Typography variant="caption" color="text.secondary">
              Transfer destination: BSB <strong>{myGigsterData?.bankDetails?.bsb}</strong> / Account <strong>******{myGigsterData?.bankDetails?.accountNumber?.slice(-4)}</strong>. Settles in 60 seconds.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setPayoutDialogOpen(false)} sx={{ fontWeight: 800 }}>Cancel</Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handlePayout}
              disabled={payoutSubmitting}
              sx={{ borderRadius: 3, fontWeight: 900, px: 3 }}
            >
              {payoutSubmitting ? 'Transferring...' : 'Confirm Transfer'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  };

  // ─── MAIN RENDER ─────────────────────────────────────────────────────

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pt: { xs: 1.5, md: 2 }, pb: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Grid container spacing={3} alignItems="flex-start">
          {/* Navigation Sidebar */}
          <Grid item xs={12} sm={3} md={2.5} lg={2}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid', borderColor: 'divider', position: { sm: 'sticky' }, top: 100 }}>
              <Stack
                direction={{ xs: 'row', sm: 'column' }}
                spacing={1}
                sx={{
                  overflowX: { xs: 'auto', sm: 'visible' },
                  whiteSpace: 'nowrap',
                  pb: { xs: 1, sm: 0 },
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                }}
              >
                {/* Practitioner photo + name header in sidebar */}
              <Stack alignItems="center" sx={{ pb: 2, pt: 1, display: { xs: 'none', sm: 'flex' } }}>
                <Box sx={{ position: 'relative', mb: 1 }}>
                  <Avatar
                    src={practitionerData?.avatar || user?.avatar || undefined}
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: 'primary.main',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      border: (practitionerData?.avatar || user?.avatar)
                        ? '2.5px solid'
                        : '2.5px solid',
                      borderColor: (practitionerData?.avatar || user?.avatar)
                        ? 'secondary.main'
                        : 'divider',
                      boxShadow: (practitionerData?.avatar || user?.avatar)
                        ? '0 0 0 4px rgba(65,198,198,0.15)'
                        : 'none',
                    }}
                  >
                    {!(practitionerData?.avatar || user?.avatar) &&
                      `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()}
                  </Avatar>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: practitionerData?.isVerified ? '#16a34a' : '#f59e0b',
                      border: '2px solid #fff',
                    }}
                  />
                </Box>
                <Typography variant="body2" fontWeight={800} noWrap sx={{ maxWidth: 140, textAlign: 'center' }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Chip
                  label={practitionerData?.isVerified ? 'Verified' : 'Pending'}
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 18,
                    fontSize: 10,
                    fontWeight: 700,
                    bgcolor: practitionerData?.isVerified ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)',
                    color: practitionerData?.isVerified ? '#16a34a' : '#d97706',
                  }}
                />
              </Stack>

              {[
                  { label: 'Overview', icon: <DashboardIcon /> },
                  { label: 'Compliance', icon: <Assignment />, badge: complianceProgress < 100 },
                  { label: 'Availability', icon: <CalendarMonth /> },
                  { label: 'Settings', icon: <Settings /> },
                  { label: 'myGigster Finance', icon: <AccountBalanceWallet /> },
                ].map((nav, i) => (
                  <Button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    variant={activeTab === i ? 'contained' : 'text'}
                    startIcon={nav.badge ? <Badge color="error" variant="dot">{nav.icon}</Badge> : nav.icon}
                    sx={{
                      justifyContent: { xs: 'center', sm: 'flex-start' },
                      py: { xs: 1, sm: 1.5 },
                      px: { xs: 1.5, sm: 2 },
                      borderRadius: 3,
                      fontWeight: 700,
                      minWidth: { xs: 'auto', sm: '100%' },
                      flexShrink: 0,
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
                  sx={{
                    justifyContent: { xs: 'center', sm: 'flex-start' },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 1.5, sm: 2 },
                    borderRadius: 3,
                    fontWeight: 700,
                    minWidth: { xs: 'auto', sm: '100%' },
                    flexShrink: 0,
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
          <Grid item xs={12} sm={9} md={9.5} lg={10} sx={{ minWidth: 0 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ margin: 0 }}
              >
                {activeTab === 0 && overview()}
                {activeTab === 1 && compliance()}
                {activeTab === 2 && availabilitySection()}
                {activeTab === 3 && settingsSection()}
                {activeTab === 4 && myGigsterSection()}
              </motion.div>
            </AnimatePresence>

          </Grid>
        </Grid>
      </Container>

      <Dialog
        open={Boolean(cancelBookingId)}
        onClose={() => setCancelBookingId(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 420 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Cancel booking?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
            This will cancel the appointment for both you and the client. The slot will become available again unless another booking holds it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setCancelBookingId(null)} disabled={actionLoading} sx={{ fontWeight: 800 }}>
            Keep booking
          </Button>
          <Button variant="contained" color="error" onClick={handleCancelBooking} disabled={actionLoading} sx={{ fontWeight: 800 }}>
            Cancel booking
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={rescheduleOpen}
        onClose={handleCloseReschedule}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Reschedule booking</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              Choose a new date and time for {rescheduleBooking?.clientId?.firstName} {rescheduleBooking?.clientId?.lastName}. Practitioner reschedules are confirmed immediately.
            </Typography>
            <TextField
              type="date"
              label="New date"
              fullWidth
              value={rescheduleDate}
              onChange={(event) => setRescheduleDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ display: 'block', mb: 1 }}>
                AVAILABLE SLOTS
              </Typography>
              {loadingSlots ? (
                <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              ) : availableSlots.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
                  {availableSlots.map((slot) => {
                    const selected = rescheduleTime === slot;
                    return (
                      <Button
                        key={slot}
                        variant={selected ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setRescheduleTime(slot)}
                        sx={{ borderRadius: 2, fontWeight: 800, minWidth: 0 }}
                      >
                        {slot}
                      </Button>
                    );
                  })}
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {rescheduleDate ? 'No available slots on this date.' : 'Select a date to see slots.'}
                  </Typography>
                </Paper>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={handleCloseReschedule} disabled={rescheduling} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRescheduleBooking}
            disabled={rescheduling || !rescheduleDate || !rescheduleTime}
            sx={{ fontWeight: 800 }}
          >
            {rescheduling ? 'Rescheduling...' : 'Confirm reschedule'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ borderRadius: 2, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PractitionerDashboard;
