import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  CalendarMonth,
  Close,
  FilterList,
  HealthAndSafety,
  Info,
  LocationOn,
  RestartAlt,
  Search,
  Star,
  Verified,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { setFilters, resetFilters, fetchPractitioners } from '../store/slices/practitionerSlice';
import { useAuth } from '../context/AuthContext';
import {
  ACCESS_OPTIONS,
  APPOINTMENT_PREFERENCES,
  CLIENT_PREFERENCES,
  MOCK_PRACTITIONERS,
  DISCIPLINES,
  FUNDING_PATHWAYS,
} from '../utils/mockData';
import { enquiryService } from '../services/api';
import PractitionerMap from '../components/map/PractitionerMap';
import emailjs from '@emailjs/browser';

// ─── EmailJS config ──────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// ─── Web3Forms email helper ───────────────────────────────────────────────────
// Access key is public-safe (client-side only, tied to your Web3Forms account).
const WEB3FORMS_ACCESS_KEY = '0687ce52-b3cd-4d91-a402-51c94c57f7b0';

/**
 * Sends an email via Web3Forms.
 * @param {Object} fields - Form fields to send (subject, from_name, email, message, etc.)
 */
const sendWeb3FormsEmail = async (fields) => {
  const payload = { access_key: WEB3FORMS_ACCESS_KEY, ...fields };
  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Web3Forms delivery failed');
  return data;
};

const MotionCard = motion.create(Card);

const deliveryOptions = ['All', 'Telehealth', 'Clinic', 'Mobile / travels to me'];
const brandPanel = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  bgcolor: '#fff',
  boxShadow: '0 12px 32px rgba(11, 29, 43, 0.05)',
};

const getFullName = (p) => p.name || `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`.trim() || 'Beyond5 practitioner';
const getAvatar = (p) => p.avatar || p.image || p.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p._id || p.id}`;
const getPostcode = (p) => p.postcode || p.locationPostcode || p.userId?.postcode || '';
const getLocation = (p) => p.location || p.userId?.location || 'Location available on profile';
const getFunding = (p) => Array.isArray(p.fundingOptions) && p.fundingOptions.length ? p.fundingOptions : [];
const postcodeDistance = (a, b) => {
  const first = Number.parseInt(a, 10);
  const second = Number.parseInt(b, 10);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  return Math.abs(first - second);
};

const normalizePractitioner = (p) => ({
  ...p,
  _id: p._id || p.id,
  verificationStatus: p.verificationStatus || (p.verified ? 'approved' : 'pending'),
  averageRating: p.averageRating ?? p.rating ?? 0,
  totalReviews: p.totalReviews ?? p.reviews ?? 0,
  fundingOptions: getFunding(p),
  gender: p.gender || 'Not specified',
  travelArea: p.travelArea || (p.mobile ? 'Travels locally' : 'Clinic / telehealth'),
  sploseStatus: p.sploseStatus || (p.availableSlots?.length ? 'Accepting bookings' : 'Contact for availability'),
  appointmentTypes: p.appointmentTypes || [
    p.telehealth ? 'Telehealth' : null,
    p.mobile ? 'In-home/mobile' : 'Clinic-based',
  ].filter(Boolean),
  appointmentPreferences: p.appointmentPreferences || [
    p.afterHours ? 'Evenings' : 'Standard business hours',
    p.weekends ? 'Weekends' : null,
  ].filter(Boolean),
  clientPreferences: p.clientPreferences || [
    p.gender === 'Male' ? 'Male practitioner' : null,
    p.gender === 'Female' ? 'Female practitioner' : null,
    'No preference',
  ].filter(Boolean),
  nextAvailable: p.nextAvailable || (p.availableSlots?.length ? p.availableSlots[0] : 'Contact for availability'),
});

const Marketplace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { practitioners, filters, loading } = useSelector((state) => state.practitioners);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [postcode, setPostcode] = useState(location.state?.postcode || filters.postcode || '');
  const [selectedFunding, setSelectedFunding] = useState(filters.funding || []);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [enquirySent, setEnquirySent] = useState('');
  const [enquiryError, setEnquiryError] = useState('');
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);

  useEffect(() => {
    const incoming = {};
    if (location.state?.discipline) incoming.discipline = location.state.discipline;
    if (location.state?.postcode) incoming.postcode = location.state.postcode;
    if (Object.keys(incoming).length) dispatch(setFilters({ ...incoming, page: 1 }));
  }, [dispatch, location.state]);

  useEffect(() => {
    dispatch(fetchPractitioners());
  }, [
    dispatch,
    filters.discipline,
    filters.deliveryMode,
    filters.availability,
    filters.funding,
    filters.access,
    filters.appointmentPreference,
    filters.clientPreference,
    filters.postcode,
    filters.searchTerm,
    filters.page,
  ]);

  useEffect(() => {
    if (user && user.role !== 'client') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const sourceResults = practitioners.length ? practitioners : MOCK_PRACTITIONERS;
  const normalizedResults = sourceResults.map(normalizePractitioner);

  const filteredResults = useMemo(() => {
    const term = (filters.searchTerm || '').toLowerCase().trim();
    const activePostcode = filters.postcode || postcode;

    return normalizedResults
      .filter((p) => filters.discipline === 'All' || p.discipline === filters.discipline)
      .filter((p) => {
        const searchableText = [
          p.userId?.firstName,
          p.userId?.lastName,
          getFullName(p),
          p.discipline,
          p.bio,
          ...(p.specializations || []),
        ].filter(Boolean).join(' ').toLowerCase();

        return !term || searchableText.includes(term);
      })
      .filter((p) => {
        if (filters.deliveryMode === 'Telehealth') return Boolean(p.telehealth);
        if (filters.deliveryMode === 'Clinic') return !p.mobile;
        if (filters.deliveryMode === 'Mobile / travels to me') return Boolean(p.mobile || p.travelsToPostcodes?.includes(activePostcode));
        return true;
      })
      .filter((p) => !filters.availability.includes('After-Hours') || p.afterHours)
      .filter((p) => !filters.availability.includes('Weekends') || p.weekends)
      .filter((p) => selectedFunding.length === 0 || selectedFunding.some((fund) => getFunding(p).includes(fund)))
      .filter((p) => {
        if (!filters.access.length) return true;
        const activePostcode = filters.postcode || postcode;
        return filters.access.every((option) => {
          if (option === 'Practitioner near me') return Boolean(activePostcode && postcodeDistance(activePostcode, getPostcode(p)) !== null && postcodeDistance(activePostcode, getPostcode(p)) <= 8);
          if (option === 'Practitioner willing to travel to my postcode') return Boolean(activePostcode && p.travelsToPostcodes?.includes(activePostcode));
          if (option === 'Telehealth available') return Boolean(p.telehealth);
          if (option === 'In-home/mobile appointments available') return Boolean(p.mobile);
          if (option === 'Clinic-based appointments available') return p.appointmentTypes?.includes('Clinic-based') || !p.mobile;
          return true;
        });
      })
      .filter((p) => !filters.appointmentPreference.length || filters.appointmentPreference.some((option) => p.appointmentPreferences?.includes(option)))
      .filter((p) => !filters.clientPreference.length || filters.clientPreference.some((option) => p.clientPreferences?.includes(option)))
      .map((p) => {
        const distance = postcodeDistance(activePostcode, getPostcode(p));
        const travelsToPostcode = Boolean(activePostcode && p.travelsToPostcodes?.includes(activePostcode));
        const localMatch = distance !== null && distance <= 8;
        return {
          ...p,
          localMatch,
          travelsToPostcode,
          distanceLabel: activePostcode
            ? travelsToPostcode
              ? `Travels to ${activePostcode}`
              : localMatch
                ? `Near ${activePostcode}`
                : 'Outside immediate postcode area'
            : getLocation(p),
        };
      })
      .sort((a, b) => Number(b.localMatch || b.travelsToPostcode) - Number(a.localMatch || a.travelsToPostcode));
  }, [filters, normalizedResults, postcode, selectedFunding]);


  const handleSearchChange = (e) => {
    const value = e.target.value;
    dispatch(setFilters({ searchTerm: value, page: 1 }));
  };

  const handlePostcodeSearch = () => {
    dispatch(setFilters({ postcode, page: 1 }));
  };

  const handleFundingToggle = (funding) => {
    const nextFunding = selectedFunding.includes(funding)
      ? selectedFunding.filter((item) => item !== funding)
      : [...selectedFunding, funding];
    setSelectedFunding(nextFunding);
    dispatch(setFilters({ funding: nextFunding, page: 1 }));
  };

  const handleArrayFilterToggle = (key, value) => {
    const currentValues = filters[key] || [];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    dispatch(setFilters({ [key]: nextValues, page: 1 }));
  };

  const clearAll = () => {
    setPostcode('');
    setSelectedFunding([]);
    dispatch(resetFilters());
    dispatch(fetchPractitioners());
  };

  const activeFilters = [
    filters.discipline !== 'All' ? filters.discipline : null,
    ...selectedFunding,
    ...filters.access,
    ...filters.appointmentPreference,
    ...filters.clientPreference,
    filters.deliveryMode !== 'All' ? filters.deliveryMode : null,
    filters.postcode ? `Postcode ${filters.postcode}` : null,
  ].filter(Boolean);

  const openEnquiry = (practitioner) => {
    if (!user) {
      navigate('/login/client', {
        state: {
          from: { pathname: '/marketplace' },
          intent: 'enquiry',
          practitionerId: practitioner._id,
        },
      });
      return;
    }

    if (user.role !== 'client') {
      navigate('/dashboard');
      return;
    }

    setSelectedEnquiry(practitioner);
    setEnquiryForm({
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email || '',
      phone: user.phone || '',
      message: `Hi, I would like to enquire about availability, funding options and whether ${getFullName(practitioner)} can support my needs.`,
    });
  };

  const closeEnquiry = () => {
    setSelectedEnquiry(null);
    setEnquiryError('');
  };

const submitEnquiry = async () => {
  if (!selectedEnquiry) return;

  try {
    setEnquirySubmitting(true);
    setEnquiryError('');

    const practitionerName = getFullName(selectedEnquiry);
    const practitionerDiscipline =
      selectedEnquiry.discipline || 'Allied Health';

    const fundingList =
      getFunding(selectedEnquiry).join(', ') || 'Not specified';

    const postcodeLabel =
      filters.postcode || postcode || 'Not specified';

    const submittedAt = new Date().toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
    });

    // Save enquiry and get practitioner email
    const apiResponse = await enquiryService.create({
      practitionerId: selectedEnquiry._id,
      practitionerName,
      practitionerDiscipline,
      name: enquiryForm.name,
      email: enquiryForm.email,
      phone: enquiryForm.phone,
      message: enquiryForm.message,
      fundingOptions: getFunding(selectedEnquiry),
      preferredPostcode: postcodeLabel,
    });

    const practitionerEmail =
      apiResponse?.practitionerEmail || '';

    console.log({
      practitionerEmail,
      apiResponse,
    });

    // Send practitioner notification
    if (practitionerEmail) {
      sendWeb3FormsEmail({
        to: practitionerEmail,
        subject: `New Enquiry from ${enquiryForm.name} – Beyond5`,
        from_name: enquiryForm.name,
        email: enquiryForm.email,
        message: `
You have received a new client enquiry on Beyond5.

CLIENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${enquiryForm.name}
Email: ${enquiryForm.email}
Phone: ${enquiryForm.phone || 'Not provided'}

ENQUIRY DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Practitioner: ${practitionerName} (${practitionerDiscipline})
Funding: ${fundingList}
Postcode: ${postcodeLabel}
Submitted: ${submittedAt}

Message:
${enquiryForm.message}

Please reply directly to ${enquiryForm.email} to respond to this client.
Beyond5 Healthcare Platform
        `,
      }).catch((err) =>
        console.warn(
          '[Web3Forms] Practitioner email failed:',
          err
        )
      );
    }

    // Send client confirmation
    sendWeb3FormsEmail({
      subject: `Your enquiry to ${practitionerName} has been received – Beyond5`,
      from_name: 'Beyond5 Healthcare',
      email: enquiryForm.email,
      message: `
Hi ${enquiryForm.name},

Thank you for your enquiry. We've forwarded your message to ${practitionerName} (${practitionerDiscipline}) and they will be in touch shortly.

YOUR ENQUIRY SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Practitioner: ${practitionerName}
Discipline: ${practitionerDiscipline}
Funding: ${fundingList}
Postcode: ${postcodeLabel}
Submitted: ${submittedAt}

Your message:
${enquiryForm.message}

Beyond5 Healthcare Platform
      `,
    }).catch((err) =>
      console.warn(
        '[Web3Forms] Client confirmation email failed:',
        err
      )
    );

    setEnquirySent(
      `Your enquiry for ${practitionerName} has been submitted — a confirmation has been sent to ${enquiryForm.email} and the practitioner has been notified.`
    );

    setSelectedEnquiry(null);
  } catch (err) {
    setEnquiryError(
      typeof err === 'string'
        ? err
        : err?.message ||
            'Unable to submit enquiry. Please try again.'
    );
  } finally {
    setEnquirySubmitting(false);
  }
};

  useEffect(() => {
    if (
      user?.role !== 'client'
      || location.state?.intent !== 'enquiry'
      || !location.state?.practitionerId
      || selectedEnquiry
    ) {
      return;
    }

    const practitioner = normalizedResults.find((item) => item._id === location.state.practitionerId);
    if (!practitioner) return;

    const timer = setTimeout(() => {
      setSelectedEnquiry(practitioner);
      setEnquiryForm({
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email || '',
        phone: user.phone || '',
        message: `Hi, I would like to enquire about availability, funding options and whether ${getFullName(practitioner)} can support my needs.`,
      });
    }, 0);
    navigate(location.pathname, { replace: true });

    return () => clearTimeout(timer);
  }, [location.pathname, location.state, navigate, normalizedResults, selectedEnquiry, user]);

  const renderFilterSidebarContent = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" fontWeight={900} color="primary" gutterBottom>DISCIPLINE</Typography>
        <Select
          fullWidth
          size="small"
          value={filters.discipline}
          onChange={(e) => dispatch(setFilters({ discipline: e.target.value, page: 1 }))}
        >
          {DISCIPLINES.map((discipline) => (
            <MenuItem key={discipline} value={discipline}>{discipline}</MenuItem>
          ))}
        </Select>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={900} color="primary" gutterBottom>FUNDING PATHWAY</Typography>
        <FormGroup>
          {FUNDING_PATHWAYS.map((funding) => (
            <FormControlLabel
              key={funding}
              control={<Checkbox size="small" checked={selectedFunding.includes(funding)} onChange={() => handleFundingToggle(funding)} />}
              label={<Typography variant="body2" fontWeight={700}>{funding}</Typography>}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={900} color="primary" gutterBottom>LOCATION AND ACCESS</Typography>
        <FormGroup>
          {ACCESS_OPTIONS.map((option) => (
            <FormControlLabel
              key={option}
              control={<Checkbox size="small" checked={filters.access.includes(option)} onChange={() => handleArrayFilterToggle('access', option)} />}
              label={<Typography variant="body2" fontWeight={700}>{option}</Typography>}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={900} color="primary" gutterBottom>APPOINTMENT PREFERENCE</Typography>
        <FormGroup>
          {APPOINTMENT_PREFERENCES.map((option) => (
            <FormControlLabel
              key={option}
              control={<Checkbox size="small" checked={filters.appointmentPreference.includes(option)} onChange={() => handleArrayFilterToggle('appointmentPreference', option)} />}
              label={<Typography variant="body2" fontWeight={700}>{option}</Typography>}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={900} color="primary" gutterBottom>CLIENT PREFERENCE</Typography>
        <FormGroup>
          {CLIENT_PREFERENCES.map((option) => (
            <FormControlLabel
              key={option}
              control={<Checkbox size="small" checked={filters.clientPreference.includes(option)} onChange={() => handleArrayFilterToggle('clientPreference', option)} />}
              label={<Typography variant="body2" fontWeight={700}>{option}</Typography>}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={900} color="primary" gutterBottom>QUICK ACCESS</Typography>
        <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
          {deliveryOptions.map((mode) => (
            <Chip
              key={mode}
              label={mode}
              onClick={() => dispatch(setFilters({ deliveryMode: mode, page: 1 }))}
              color={filters.deliveryMode === mode ? 'primary' : 'default'}
              variant={filters.deliveryMode === mode ? 'filled' : 'outlined'}
              size="small"
              sx={{ fontWeight: 800 }}
            />
          ))}
        </Stack>
      </Box>

      <Button variant="outlined" startIcon={<RestartAlt />} onClick={clearAll} fullWidth sx={{ fontWeight: 800 }}>
        Reset filters
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: '#F7FBFB', minHeight: '100vh', py: { xs: 2.5, md: 4 } }}>
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            ...brandPanel,
            mb: 3,
            overflow: 'hidden',
            bgcolor: '#0B1D2B',
            color: '#fff',
          }}
        >
          <Box sx={{ p: { xs: 2.5, md: 4 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-end' }}>
              <Stack spacing={1.25} sx={{ maxWidth: 820 }}>
                <Typography variant="overline" sx={{ color: '#41C6C6', fontWeight: 900, letterSpacing: 1.2 }}>Beyond5 client search</Typography>
                <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', fontSize: { xs: '2rem', md: '3rem' } }}>
                  Find an Allied Health Practitioner
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.78)', maxWidth: 780, lineHeight: 1.7 }}>
                  Search by therapy type, postcode, funding type and appointment preference to find practitioners who fit your needs.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip label={`${filteredResults.length} matches`} color="secondary" sx={{ fontWeight: 900 }} />
                <Chip label="Map + list view" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 800 }} />
              </Stack>
            </Stack>
          </Box>
        </Paper>

        {enquirySent && (
          <Alert severity="success" onClose={() => setEnquirySent('')} sx={{ mb: 3, borderRadius: 2 }}>
            {enquirySent}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr)' }, gap: 3, alignItems: 'start' }}>
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <Paper elevation={0} sx={{ ...brandPanel, p: 2.5, position: 'sticky', top: 100 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 3 }}>Refine search</Typography>
              {renderFilterSidebarContent()}
            </Paper>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Paper elevation={0} sx={{ ...brandPanel, p: { xs: 1.25, md: 1.5 }, mb: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) 168px', md: 'minmax(280px, 1fr) 168px 150px auto' }, gap: 1, alignItems: 'stretch' }}>
                <TextField
                  fullWidth
                  placeholder="Search name, discipline or special interest"
                  value={filters.searchTerm}
                  onChange={handleSearchChange}
                  size="medium"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                    endAdornment: filters.searchTerm && <IconButton size="small" onClick={() => dispatch(setFilters({ searchTerm: '', page: 1 }))}><Close fontSize="small" /></IconButton>,
                  }}
                />
                <TextField
                  fullWidth
                  label="Postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePostcodeSearch(); }}
                  inputProps={{ inputMode: 'numeric' }}
                />
                <Button variant="contained" startIcon={<LocationOn />} onClick={handlePostcodeSearch} sx={{ minHeight: 56, fontWeight: 900, whiteSpace: 'nowrap' }}>
                  Map search
                </Button>
                <Button variant="outlined" startIcon={<FilterList />} onClick={() => setMobileFilterOpen(true)} sx={{ display: { lg: 'none' }, minHeight: 56, fontWeight: 900 }}>
                  Filters
                </Button>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: activeFilters.length ? 1.5 : 0, flexWrap: 'wrap' }}>
                {activeFilters.slice(0, 8).map((filter) => (
                  <Chip key={filter} label={filter} size="small" sx={{ fontWeight: 800, bgcolor: '#E9EEF2' }} />
                ))}
                {activeFilters.length > 8 && <Chip label={`+${activeFilters.length - 8} more`} size="small" color="secondary" sx={{ fontWeight: 900 }} />}
                {activeFilters.length > 0 && (
                  <Button size="small" startIcon={<RestartAlt />} onClick={clearAll} sx={{ fontWeight: 900 }}>
                    Clear
                  </Button>
                )}
              </Stack>
            </Paper>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(330px, 0.9fr) minmax(0, 1.1fr)' }, gap: 3, alignItems: 'start' }}>
              <Box>
                <Paper elevation={0} sx={{ ...brandPanel, p: { xs: 1.5, md: 2 }, position: { md: 'sticky' }, top: 100 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={900}>Map results</Typography>
                    <Chip label={`${filteredResults.length} matches`} size="small" color="secondary" sx={{ fontWeight: 900 }} />
                  </Stack>
                  <PractitionerMap
                    practitioners={filteredResults}
                    searchPostcode={filters.postcode || postcode}
                    height={460}
                    onBook={(p) => navigate(`/booking?practitioner=${p._id}`)}
                    onEnquire={(p) => openEnquiry(p)}
                  />
                </Paper>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <AnimatePresence mode="popLayout">
                  {loading && practitioners.length === 0 ? (
                    <Stack spacing={2} key="loading-skeletons">
                      {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={240} sx={{ borderRadius: 2 }} />)}
                    </Stack>
                  ) : filteredResults.length > 0 ? (
                    <Stack spacing={2} key="results-list">
                      {filteredResults.map((p) => (
                        <MotionCard
                          key={p._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          sx={{
                            ...brandPanel,
                            overflow: 'hidden',
                            transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
                            '&:hover': {
                              borderColor: '#BDE7E6',
                              boxShadow: '0 18px 42px rgba(11, 29, 43, 0.09)',
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '104px minmax(0, 1fr)', xl: '104px minmax(0, 1fr) 168px' },
                                gap: { xs: 2, md: 2.5 },
                                alignItems: 'start',
                              }}
                            >
                              <Stack alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                                <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={p.verificationStatus === 'approved' && <Verified color="secondary" sx={{ bgcolor: '#fff', borderRadius: '50%', fontSize: 22 }} />}>
                                  <Avatar src={getAvatar(p)} sx={{ width: 96, height: 96, border: '3px solid #BDE7E6', boxShadow: '0 8px 20px rgba(11,29,43,0.12)' }} />
                                </Badge>
                                <Chip label={p.gender} size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontWeight: 800 }} />
                              </Stack>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', mb: 0.5 }}>
                                  <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.2 }}>{getFullName(p)}</Typography>
                                  <Chip label={p.gender} size="small" sx={{ display: { xs: 'inline-flex', sm: 'none' }, fontWeight: 800 }} />
                                  {p.verificationStatus === 'approved' && <Chip icon={<HealthAndSafety />} label="Verified" color="secondary" size="small" sx={{ fontWeight: 900 }} />}
                                </Stack>
                                <Typography variant="body2" color="primary" fontWeight={900}>{p.discipline}</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                  <Chip size="small" variant="outlined" icon={<LocationOn />} label={`${getLocation(p)} ${getPostcode(p)}`} sx={{ maxWidth: '100%', fontWeight: 700 }} />
                                  <Chip size="small" variant="outlined" icon={<Star sx={{ color: '#41C6C6' }} />} label={`${p.averageRating || 'New'} (${p.totalReviews || 0})`} sx={{ fontWeight: 700 }} />
                                  <Chip size="small" variant="outlined" icon={<CalendarMonth />} label={`${p.afterHours ? 'After hours' : 'Standard hours'}${p.weekends ? ' + weekends' : ''}`} sx={{ fontWeight: 700 }} />
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>{p.bio || 'Allied health practitioner on Beyond5.'}</Typography>
                                <Stack direction="row" gap={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                                  <Chip label={p.distanceLabel} color={p.localMatch || p.travelsToPostcode ? 'secondary' : 'default'} size="small" sx={{ fontWeight: 800 }} />
                                  <Chip label={p.travelArea} size="small" />
                                  <Chip label={p.telehealth ? 'Telehealth: Yes' : 'Telehealth: No'} size="small" variant="outlined" />
                                  {getFunding(p).slice(0, 3).map((fund) => <Chip key={fund} label={fund} size="small" variant="outlined" />)}
                                  {getFunding(p).length > 3 && <Chip label={`+${getFunding(p).length - 3} funding`} size="small" />}
                                </Stack>
                              </Box>

                              <Stack
                                spacing={1}
                                sx={{
                                  gridColumn: { xs: '1', sm: '1 / -1', xl: 'auto' },
                                  alignSelf: 'stretch',
                                  p: 1.25,
                                  borderRadius: 2,
                                  bgcolor: '#F7FBFB',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  minWidth: 0,
                                }}
                              >
                                <Box sx={{ mb: 0.25 }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={900}>NEXT AVAILABLE</Typography>
                                  <Typography variant="body2" fontWeight={900}>{p.nextAvailable}</Typography>
                                </Box>
                                <Stack direction={{ xs: 'column', sm: 'row', xl: 'column' }} spacing={1}>
                                  <Button fullWidth variant="contained" onClick={() => navigate(`/practitioners/${p._id}`)} sx={{ fontWeight: 900, minHeight: 42 }}>
                                    View Profile
                                  </Button>
                                  <Button fullWidth variant="contained" color="secondary" onClick={() => navigate(`/booking?practitioner=${p._id}`)} sx={{ fontWeight: 900, minHeight: 42, color: 'white' }}>
                                    Check availability
                                  </Button>
                                  <Button fullWidth variant="outlined" onClick={() => openEnquiry(p)} sx={{ fontWeight: 900, minHeight: 42 }}>
                                    Enquire
                                  </Button>
                                </Stack>
                              </Stack>
                            </Box>
                          </CardContent>
                        </MotionCard>
                      ))}
                    </Stack>
                  ) : (
                    <Paper key="no-results" sx={{ p: 6, textAlign: 'center', borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }}>
                      <Info sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" fontWeight={900}>No practitioners found</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Try another postcode, discipline or funding pathway.</Typography>
                      <Button variant="outlined" onClick={clearAll}>Reset all</Button>
                    </Paper>
                  )}
                </AnimatePresence>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      <Drawer anchor="bottom" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} PaperProps={{ sx: { borderRadius: '20px 20px 0 0', p: { xs: 2.5, sm: 4 }, maxHeight: '88vh' } }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 4 }}>Filter practitioners</Typography>
        {renderFilterSidebarContent()}
        <Button variant="contained" fullWidth sx={{ mt: 4, py: 1.5 }} onClick={() => setMobileFilterOpen(false)}>Show results</Button>
      </Drawer>

      <Dialog open={Boolean(selectedEnquiry)} onClose={closeEnquiry} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>
          Enquire about {selectedEnquiry ? getFullName(selectedEnquiry) : 'practitioner'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              This will create an enquiry record for Beyond5 follow-up. The practitioner will be notified and can respond directly.
            </Alert>
            {enquiryError && <Alert severity="error" sx={{ borderRadius: 2 }}>{enquiryError}</Alert>}
            <TextField
              fullWidth
              label="Your name"
              value={enquiryForm.name}
              onChange={(event) => setEnquiryForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={enquirySubmitting}
            />
            <TextField
              fullWidth
              label="Email"
              value={enquiryForm.email}
              onChange={(event) => setEnquiryForm((prev) => ({ ...prev, email: event.target.value }))}
              disabled={enquirySubmitting}
            />
            <TextField
              fullWidth
              label="Phone"
              value={enquiryForm.phone}
              onChange={(event) => setEnquiryForm((prev) => ({ ...prev, phone: event.target.value }))}
              disabled={enquirySubmitting}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Message"
              value={enquiryForm.message}
              onChange={(event) => setEnquiryForm((prev) => ({ ...prev, message: event.target.value }))}
              disabled={enquirySubmitting}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeEnquiry} disabled={enquirySubmitting}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={submitEnquiry} disabled={enquirySubmitting || !enquiryForm.name || !enquiryForm.email || !enquiryForm.message} sx={{ fontWeight: 900 }}>
            {enquirySubmitting ? 'Sending...' : 'Send enquiry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Marketplace;
