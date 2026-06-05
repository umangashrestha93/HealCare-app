import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Paper,
  Avatar, Chip, Stack, Button,
  Divider,
  TextField, Switch,
  Snackbar, Alert, Badge, CircularProgress, Rating, FormControlLabel, Checkbox
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const [practitionerData, setPractitionerData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [complianceForms, setComplianceForms] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [selectedComplianceType, setSelectedComplianceType] = useState('AHPRA');

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
  });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

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
                        <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          startIcon={<VideoCall />}
                          disabled={session.serviceType !== 'telehealth' || !session.telehealthRoom?.joinUrl}
                          onClick={() => navigate(session.telehealthRoom.joinUrl)}
                          sx={{ borderRadius: 2 }}
                        >
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

  const compliance = () => {
    const selectedRequirement = REQUIRED_COMPLIANCE_DOCS.find((item) => item.type === selectedComplianceType) || REQUIRED_COMPLIANCE_DOCS[0];
    const selectedDoc = documents.find((item) => item.docType === selectedRequirement.type);
    const selectedForm = complianceForms[selectedRequirement.type] || {};
    const isUploading = Boolean(uploadingDocs[selectedRequirement.type]);
    const hasDraft = Boolean(selectedForm.file || selectedForm.expiryDate);
    const selectedStatusColor = selectedDoc?.status === 'approved' ? 'success' : selectedDoc?.status === 'pending' ? 'warning' : selectedDoc?.status === 'rejected' ? 'error' : 'default';
    const selectedStatusLabel = selectedDoc?.status?.toUpperCase() || 'MISSING';

    return (
      <Box>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: '#fff',
            mb: 3,
            overflow: 'hidden'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} lg>
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
            <Grid item xs={12} lg="auto">
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', minWidth: { lg: 340 } }}>
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
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#fff', height: '100%' }}>
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
                      onClick={() => setSelectedComplianceType(item.type)}
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

          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: hasDraft ? 'primary.main' : 'divider', bgcolor: '#fff', height: '100%', overflow: 'hidden' }}>
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
    <Box>
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
            <Grid item xs={12} md={4} key={item.key}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  height: '100%',
                  borderRadius: 3,
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
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
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

        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
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
                        if (file.size > 2 * 1024 * 1024) {
                          showToast('Image exceeds 2 MB limit.', 'warning');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setProfile((prev) => ({ ...prev, avatar: event.target.result }));
                          showToast('Photo selected — save your profile to persist this change.');
                        };
                        reader.readAsDataURL(file);
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

  // ─── MAIN RENDER ─────────────────────────────────────────────────────

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pt: { xs: 1.5, md: 2 }, pb: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Grid container spacing={3} alignItems="flex-start">
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
          <Grid item xs={12} md={9.5} lg={10} sx={{ minWidth: 0 }}>
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
