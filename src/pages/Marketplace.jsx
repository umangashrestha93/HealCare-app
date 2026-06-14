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
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  ExpandMore,
  SearchOff,
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
import usePostcodeCoords from '../hooks/usePostcodeCoords';
import { haversineKm, NEARBY_RADIUS_KM } from '../utils/postcodeCoords';

// ─── Web3Forms email helper ───────────────────────────────────────────────────
const WEB3FORMS_ACCESS_KEY = '0687ce52-b3cd-4d91-a402-51c94c57f7b0';

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

const getFullName = (p) => p.name || `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`.trim() || 'Beyond5 practitioner';
const getAvatar = (p) => p.avatar || p.image || p.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p._id || p.id}`;
const getPostcode = (p) => p.postcode || p.locationPostcode || p.userId?.postcode || '';
const getLocation = (p) => p.location || p.userId?.location || 'Location available on profile';
const getFunding = (p) => Array.isArray(p.fundingOptions) && p.fundingOptions.length ? p.fundingOptions : [];
const getAge = (p) => p.age || p.userId?.age || null;

const postcodeDistanceKm = (searchCoords, practitionerPostcode, coordsMap) => {
  if (!searchCoords || !practitionerPostcode) return null;
  const practitionerCoords = coordsMap[practitionerPostcode];
  if (!practitionerCoords) return null;
  return haversineKm(searchCoords, practitionerCoords);
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

  const activePostcode = filters.postcode || postcode;
  const postcodesForGeocoding = useMemo(
    () => [activePostcode, ...normalizedResults.map(getPostcode)].filter(Boolean),
    [activePostcode, normalizedResults],
  );
  const { coordsMap } = usePostcodeCoords(postcodesForGeocoding);
  const searchCoords = activePostcode ? coordsMap[activePostcode] : null;

  const filteredResults = useMemo(() => {
    const term = (filters.searchTerm || '').toLowerCase().trim();

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
        return filters.access.every((option) => {
          const practitionerPostcode = getPostcode(p);
          const distanceKm = postcodeDistanceKm(searchCoords, practitionerPostcode, coordsMap);
          if (option === 'Practitioner near me') {
            return Boolean(activePostcode && distanceKm !== null && distanceKm <= NEARBY_RADIUS_KM);
          }
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
        const practitionerPostcode = getPostcode(p);
        const distanceKm = postcodeDistanceKm(searchCoords, practitionerPostcode, coordsMap);
        const travelsToPostcode = Boolean(activePostcode && p.travelsToPostcodes?.includes(activePostcode));
        const localMatch = distanceKm !== null && distanceKm <= NEARBY_RADIUS_KM;
        return {
          ...p,
          localMatch,
          travelsToPostcode,
          distanceLabel: activePostcode
            ? travelsToPostcode
              ? `Travels to ${activePostcode}`
              : localMatch
                ? distanceKm !== null
                  ? `${distanceKm.toFixed(1)} km from ${activePostcode}`
                  : `Near ${activePostcode}`
                : 'Outside immediate postcode area'
            : getLocation(p),
        };
      })
      .sort((a, b) => Number(b.localMatch || b.travelsToPostcode) - Number(a.localMatch || a.travelsToPostcode));
  }, [filters, normalizedResults, postcode, selectedFunding, activePostcode, searchCoords, coordsMap]);

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
      const practitionerDiscipline = selectedEnquiry.discipline || 'Allied Health';
      const fundingList = getFunding(selectedEnquiry).join(', ') || 'Not specified';
      const postcodeLabel = filters.postcode || postcode || 'Not specified';
      const submittedAt = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });

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

      const practitionerEmail = apiResponse?.practitionerEmail || '';

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
        }).catch((err) => console.warn('[Web3Forms] Practitioner email failed:', err));
      }

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
      }).catch((err) => console.warn('[Web3Forms] Client confirmation email failed:', err));

      setEnquirySent(
        `Your enquiry for ${practitionerName} has been submitted — a confirmation has been sent to ${enquiryForm.email} and the practitioner has been notified.`
      );
      setSelectedEnquiry(null);
    } catch (err) {
      setEnquiryError(typeof err === 'string' ? err : err?.message || 'Unable to submit enquiry. Please try again.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

  useEffect(() => {
    if (
      user?.role !== 'client' ||
      location.state?.intent !== 'enquiry' ||
      !location.state?.practitionerId ||
      selectedEnquiry
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
    <Stack spacing={2.5}>
      <Accordion
        elevation={0}
        disableGutters
        defaultExpanded
        sx={{
          bgcolor: 'transparent',
          '&:before': { display: 'none' },
          '& .MuiAccordionSummary-root': { p: 0, minHeight: 0, '&.Mui-expanded': { minHeight: 0 } },
          '& .MuiAccordionSummary-content': { my: 1, '&.Mui-expanded': { my: 1 } },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2" fontWeight={800} color="primary">
            DISCIPLINE
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, pt: 1, pb: 1.5 }}>
          <Select
            fullWidth
            size="small"
            value={filters.discipline}
            onChange={(e) => dispatch(setFilters({ discipline: e.target.value, page: 1 }))}
            sx={{
              borderRadius: 2.5,
              bgcolor: 'background.paper',
            }}
          >
            {DISCIPLINES.map((discipline) => (
              <MenuItem key={discipline} value={discipline}>{discipline}</MenuItem>
            ))}
          </Select>
        </AccordionDetails>
      </Accordion>

      <Divider />

      <Accordion
        elevation={0}
        disableGutters
        defaultExpanded
        sx={{
          bgcolor: 'transparent',
          '&:before': { display: 'none' },
          '& .MuiAccordionSummary-root': { p: 0, minHeight: 0, '&.Mui-expanded': { minHeight: 0 } },
          '& .MuiAccordionSummary-content': { my: 1, '&.Mui-expanded': { my: 1 } },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" fontWeight={800} color="primary">
              FUNDING PATHWAYS
            </Typography>
            {selectedFunding.length > 0 && (
              <Chip label={selectedFunding.length} size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900 }} />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, pt: 1, pb: 1.5 }}>
          <FormGroup>
            {FUNDING_PATHWAYS.map((funding) => (
              <FormControlLabel
                key={funding}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedFunding.includes(funding)}
                    onChange={() => handleFundingToggle(funding)}
                    sx={{ color: 'divider', '&.Mui-checked': { color: 'secondary.main' } }}
                  />
                }
                label={<Typography variant="body2" color="text.secondary" fontWeight={600}>{funding}</Typography>}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      <Divider />

      <Accordion
        elevation={0}
        disableGutters
        defaultExpanded
        sx={{
          bgcolor: 'transparent',
          '&:before': { display: 'none' },
          '& .MuiAccordionSummary-root': { p: 0, minHeight: 0, '&.Mui-expanded': { minHeight: 0 } },
          '& .MuiAccordionSummary-content': { my: 1, '&.Mui-expanded': { my: 1 } },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" fontWeight={800} color="primary">
              LOCATION AND ACCESS
            </Typography>
            {filters.access.length > 0 && (
              <Chip label={filters.access.length} size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900 }} />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, pt: 1, pb: 1.5 }}>
          <FormGroup>
            {ACCESS_OPTIONS.map((option) => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox
                    size="small"
                    checked={filters.access.includes(option)}
                    onChange={() => handleArrayFilterToggle('access', option)}
                    sx={{ color: 'divider', '&.Mui-checked': { color: 'secondary.main' } }}
                  />
                }
                label={<Typography variant="body2" color="text.secondary" fontWeight={600}>{option}</Typography>}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      <Divider />

      <Accordion
        elevation={0}
        disableGutters
        sx={{
          bgcolor: 'transparent',
          '&:before': { display: 'none' },
          '& .MuiAccordionSummary-root': { p: 0, minHeight: 0, '&.Mui-expanded': { minHeight: 0 } },
          '& .MuiAccordionSummary-content': { my: 1, '&.Mui-expanded': { my: 1 } },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" fontWeight={800} color="primary">
              APPOINTMENT PREFERENCE
            </Typography>
            {filters.appointmentPreference.length > 0 && (
              <Chip label={filters.appointmentPreference.length} size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900 }} />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, pt: 1, pb: 1.5 }}>
          <FormGroup>
            {APPOINTMENT_PREFERENCES.map((option) => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox
                    size="small"
                    checked={filters.appointmentPreference.includes(option)}
                    onChange={() => handleArrayFilterToggle('appointmentPreference', option)}
                    sx={{ color: 'divider', '&.Mui-checked': { color: 'secondary.main' } }}
                  />
                }
                label={<Typography variant="body2" color="text.secondary" fontWeight={600}>{option}</Typography>}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      <Divider />

      <Accordion
        elevation={0}
        disableGutters
        sx={{
          bgcolor: 'transparent',
          '&:before': { display: 'none' },
          '& .MuiAccordionSummary-root': { p: 0, minHeight: 0, '&.Mui-expanded': { minHeight: 0 } },
          '& .MuiAccordionSummary-content': { my: 1, '&.Mui-expanded': { my: 1 } },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" fontWeight={800} color="primary">
              CLIENT PREFERENCE
            </Typography>
            {filters.clientPreference.length > 0 && (
              <Chip label={filters.clientPreference.length} size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900 }} />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, pt: 1, pb: 1.5 }}>
          <FormGroup>
            {CLIENT_PREFERENCES.map((option) => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox
                    size="small"
                    checked={filters.clientPreference.includes(option)}
                    onChange={() => handleArrayFilterToggle('clientPreference', option)}
                    sx={{ color: 'divider', '&.Mui-checked': { color: 'secondary.main' } }}
                  />
                }
                label={<Typography variant="body2" color="text.secondary" fontWeight={600}>{option}</Typography>}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>
          QUICK ACCESS
        </Typography>
        <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
          {deliveryOptions.map((mode) => (
            <Chip
              key={mode}
              label={mode}
              onClick={() => dispatch(setFilters({ deliveryMode: mode, page: 1 }))}
              color={filters.deliveryMode === mode ? 'primary' : 'default'}
              variant={filters.deliveryMode === mode ? 'filled' : 'outlined'}
              size="small"
              sx={{
                fontWeight: 700,
                borderRadius: 2.5,
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: filters.deliveryMode === mode ? 'primary.main' : 'rgba(11,29,43,0.04)',
                }
              }}
            />
          ))}
        </Stack>
      </Box>

      <Button
        variant="outlined"
        startIcon={<RestartAlt />}
        onClick={clearAll}
        fullWidth
        sx={{
          fontWeight: 700,
          borderRadius: 2.5,
          py: 1,
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'rgba(11,29,43,0.04)',
          }
        }}
      >
        Reset Filters
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl">
        {/* Top Header Banner */}
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            mb: 4,
            borderRadius: { xs: 0, md: 4 },
            overflow: 'hidden',
            bgcolor: 'primary.main',
            color: '#fff',
            backgroundImage: `radial-gradient(rgba(65, 198, 198, 0.15) 1px, transparent 1px), radial-gradient(rgba(65, 198, 198, 0.15) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Box sx={{ p: { xs: 4, md: 6 }, position: 'relative', zIndex: 2 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'flex-end' }}
            >
              <Stack spacing={1.5} sx={{ maxWidth: 820 }}>
                <Chip
                  label="BEYOND5 CLIENT SEARCH"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(65, 198, 198, 0.14)',
                    color: 'secondary.main',
                    fontWeight: 800,
                    width: 'fit-content',
                    fontSize: '0.75rem',
                    letterSpacing: 1.2,
                    py: 1.5,
                    px: 0.5
                  }}
                />
                <Typography
                  variant="h3"
                  fontWeight={800}
                  sx={{
                    color: '#fff',
                    fontSize: { xs: '2.25rem', md: '3.25rem' },
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15
                  }}
                >
                  Find Your Perfect Allied Health Practitioner
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 780, fontSize: '1.05rem', lineHeight: 1.6 }}>
                  Filter by clinical discipline, localized postcode, NDIS/Medicare funding options, and scheduling preferences to connect instantly.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', shrink: 0 }}>
                <Chip
                  label={`${filteredResults.length} practitioners matched`}
                  color="secondary"
                  sx={{ fontWeight: 800, fontSize: '0.85rem', py: 2, px: 0.5 }}
                />
                <Chip
                  label="Map + List View"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.1)',
                    py: 2
                  }}
                />
              </Stack>
            </Stack>
          </Box>
        </Paper>

        {enquirySent && (
          <Alert severity="success" onClose={() => setEnquirySent('')} sx={{ mb: 4, borderRadius: 3, fontWeight: 600 }}>
            {enquirySent}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' }, gap: 4, alignItems: 'start' }}>
          {/* Desktop Filter Sidebar */}
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: '1px solid #E2E8F0',
                position: 'sticky',
                top: 90,
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={800} color="primary">
                  Refine Search
                </Typography>
                {activeFilters.length > 0 && (
                  <Button size="small" onClick={clearAll} sx={{ fontWeight: 700, minWidth: 0, p: 0 }}>
                    Reset
                  </Button>
                )}
              </Stack>
              {renderFilterSidebarContent()}
            </Paper>
          </Box>

          {/* Search Bar & Results Area */}
          <Box sx={{ minWidth: 0 }}>
            {/* Search inputs bar */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: '1px solid #E2E8F0',
                mb: 3,
                boxShadow: '0 4px 20px rgba(11,29,43,0.02)',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr auto',
                    md: 'minmax(0, 1fr) 180px 150px auto'
                  },
                  gap: 1.5,
                  alignItems: 'stretch'
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Search by name, discipline, specialisation..."
                  value={filters.searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
                    endAdornment: filters.searchTerm && (
                      <IconButton size="small" onClick={() => dispatch(setFilters({ searchTerm: '', page: 1 }))}>
                        <Close fontSize="small" />
                      </IconButton>
                    ),
                    sx: { borderRadius: 3 }
                  }}
                />
                <TextField
                  fullWidth
                  placeholder="Postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePostcodeSearch(); }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LocationOn color="action" /></InputAdornment>,
                    inputMode: 'numeric',
                    sx: { borderRadius: 3 }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handlePostcodeSearch}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 700,
                    px: 3,
                    height: 56,
                  }}
                >
                  Map Search
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setMobileFilterOpen(true)}
                  sx={{
                    display: { lg: 'none' },
                    borderRadius: 3,
                    fontWeight: 700,
                    height: 56,
                  }}
                >
                  Filters
                </Button>
              </Box>

              {/* Active filter chips */}
              {activeFilters.length > 0 && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    ACTIVE FILTERS:
                  </Typography>
                  {activeFilters.slice(0, 6).map((filter) => (
                    <Chip
                      key={filter}
                      label={filter}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: 'rgba(11,29,43,0.04)',
                        color: 'primary.main',
                        borderRadius: 2,
                      }}
                    />
                  ))}
                  {activeFilters.length > 6 && (
                    <Chip
                      label={`+${activeFilters.length - 6} more`}
                      size="small"
                      color="secondary"
                      sx={{ fontWeight: 800, borderRadius: 2 }}
                    />
                  )}
                  <Button
                    size="small"
                    startIcon={<RestartAlt />}
                    onClick={clearAll}
                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                  >
                    Clear All
                  </Button>
                </Stack>
              )}
            </Paper>

            {/* Split layout: Map results & Card list */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1.15fr' },
                gap: 3,
                alignItems: 'start'
              }}
            >
              {/* Map Panel (Sticky) */}
              <Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    border: '1px solid #E2E8F0',
                    position: { md: 'sticky' },
                    top: 90,
                    bgcolor: 'background.paper',
                    boxShadow: '0 4px 20px rgba(11,29,43,0.01)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={800} color="primary">
                      Map View
                    </Typography>
                    <Chip
                      label={`${filteredResults.length} pins`}
                      size="small"
                      color="secondary"
                      sx={{ fontWeight: 800, height: 22 }}
                    />
                  </Stack>
                  <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <PractitionerMap
                      practitioners={filteredResults}
                      searchPostcode={filters.postcode || postcode}
                      height={480}
                      onBook={(p) => navigate(`/booking?practitioner=${p._id}`)}
                      onEnquire={(p) => openEnquiry(p)}
                    />
                  </Box>
                </Paper>
              </Box>

              {/* Card List Panel */}
              <Box sx={{ minWidth: 0 }}>
                <AnimatePresence mode="popLayout">
                  {loading && practitioners.length === 0 ? (
                    <Stack spacing={3} key="loading-skeletons">
                      {[1, 2, 3].map((i) => (
                        <Paper
                          key={i}
                          sx={{
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <Stack direction="row" spacing={3} alignItems="center">
                            <Skeleton variant="circular" width={80} height={80} />
                            <Stack spacing={1} sx={{ flex: 1 }}>
                              <Skeleton variant="text" width="60%" height={32} />
                              <Skeleton variant="text" width="40%" height={20} />
                              <Skeleton variant="text" width="90%" height={20} />
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : filteredResults.length > 0 ? (
                    <Stack spacing={3} key="results-list">
                      {filteredResults.map((p) => (
                        <MotionCard
                          key={p._id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.2 }}
                          sx={{
                            borderRadius: 4,
                            border: '1px solid #E2E8F0',
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(11,29,43,0.01)',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 12px 30px rgba(11,29,43,0.08)',
                              borderColor: 'transparent',
                              '&::before': { opacity: 1 }
                            },
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: 4,
                              bgcolor: 'secondary.main',
                              opacity: 0,
                              transition: 'opacity 0.2s ease',
                            }
                          }}
                        >
                          <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '100px minmax(0, 1fr)' },
                                gap: 3.5,
                                alignItems: 'start',
                              }}
                            >
                              {/* Avatar column */}
                              <Stack alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ position: 'relative' }}>
                                <Badge
                                  overlap="circular"
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                  badgeContent={
                                    p.verificationStatus === 'approved' && (
                                      <Verified
                                        color="secondary"
                                        sx={{
                                          bgcolor: '#fff',
                                          borderRadius: '50%',
                                          fontSize: 22,
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }}
                                      />
                                    )
                                  }
                                >
                                  <Avatar
                                    src={getAvatar(p)}
                                    sx={{
                                      width: 100,
                                      height: 100,
                                      border: '3.5px solid #fff',
                                      boxShadow: '0 8px 24px rgba(11,29,43,0.09)'
                                    }}
                                  />
                                </Badge>
                                <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', sm: 'flex' }, flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
                                  <Chip label={p.gender} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                                  {getAge(p) && <Chip label={`${getAge(p)} yrs`} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }} />}
                                </Stack>
                              </Stack>

                              {/* Details column */}
                              <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                                <Box>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', mb: 0.5, gap: 0.75 }}>
                                    <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, color: 'primary.main' }}>
                                      {getFullName(p)}
                                    </Typography>
                                    <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 0.5, flexWrap: 'wrap' }}>
                                      <Chip label={p.gender} size="small" sx={{ fontWeight: 700, height: 20 }} />
                                      {getAge(p) && <Chip label={`${getAge(p)} yrs`} size="small" sx={{ fontWeight: 700, height: 20 }} />}
                                    </Box>
                                    {p.verificationStatus === 'approved' && (
                                      <Chip
                                        icon={<HealthAndSafety sx={{ fontSize: '14px !important' }} />}
                                        label="Verified"
                                        color="success"
                                        variant="light"
                                        size="small"
                                        sx={{ fontWeight: 800, height: 20, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Stack>
                                  <Typography variant="body2" color="primary.main" fontWeight={700}>
                                    {p.discipline}
                                  </Typography>
                                </Box>

                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                  <Chip size="small" variant="outlined" icon={<LocationOn sx={{ fontSize: '14px !important' }} />} label={`${getLocation(p)} ${getPostcode(p)}`} sx={{ fontWeight: 600, height: 22 }} />
                                  <Chip size="small" variant="outlined" icon={<Star sx={{ color: 'secondary.main', fontSize: '14px !important' }} />} label={`${p.averageRating || 'New'} (${p.totalReviews || 0})`} sx={{ fontWeight: 600, height: 22 }} />
                                  <Chip size="small" variant="outlined" icon={<CalendarMonth sx={{ fontSize: '14px !important' }} />} label={`${p.afterHours ? 'Evenings' : 'Business hours'}${p.weekends ? ' + weekends' : ''}`} sx={{ fontWeight: 600, height: 22 }} />
                                </Stack>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    lineHeight: 1.6,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {p.bio || 'Allied health practitioner on Beyond5.'}
                                </Typography>

                                <Stack direction="row" gap={0.75} sx={{ flexWrap: 'wrap', pt: 0.5 }}>
                                  <Chip
                                    label={p.distanceLabel}
                                    color={p.localMatch || p.travelsToPostcode ? 'secondary' : 'default'}
                                    size="small"
                                    sx={{ fontWeight: 700, height: 22 }}
                                  />
                                  <Chip label={p.travelArea} size="small" sx={{ fontWeight: 600, height: 22 }} />
                                  <Chip label={p.telehealth ? 'Telehealth' : 'In-clinic'} size="small" variant="outlined" sx={{ fontWeight: 600, height: 22 }} />
                                  {getFunding(p).slice(0, 2).map((fund) => (
                                    <Chip key={fund} label={fund} size="small" variant="outlined" sx={{ fontWeight: 600, height: 22 }} />
                                  ))}
                                  {getFunding(p).length > 2 && (
                                    <Chip label={`+${getFunding(p).length - 2} more`} size="small" sx={{ fontWeight: 600, height: 22 }} />
                                  )}
                                </Stack>
                              </Stack>

                              {/* Bottom Action Bar */}
                              <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                justifyContent="space-between"
                                alignItems={{ xs: 'stretch', md: 'center' }}
                                spacing={2}
                                sx={{
                                  gridColumn: '1 / -1',
                                  alignSelf: 'stretch',
                                  p: 2,
                                  borderRadius: 3,
                                  bgcolor: 'grey.50',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  minWidth: 0,
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 38,
                                      height: 38,
                                      borderRadius: 2.5,
                                      bgcolor: 'rgba(65, 198, 198, 0.12)',
                                      color: 'secondary.main',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <CalendarMonth sx={{ fontSize: 20 }} />
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'block', letterSpacing: 0.6, mb: 0.25 }}>
                                      NEXT AVAILABILITY
                                    </Typography>
                                    <Typography variant="body2" fontWeight={800} color="primary.main">
                                      {p.nextAvailable}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Stack
                                  direction={{ xs: 'column', sm: 'row' }}
                                  gap={1}
                                  sx={{ width: { xs: '100%', md: 'auto' } }}
                                >
                                  <Button
                                    variant="outlined"
                                    onClick={() => openEnquiry(p)}
                                    sx={{
                                      fontWeight: 700,
                                      minHeight: 40,
                                      px: 2.5,
                                      borderRadius: 2.5,
                                      fontSize: '0.85rem',
                                      borderColor: 'divider',
                                      color: 'primary.main',
                                      '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'rgba(11,29,43,0.04)',
                                      }
                                    }}
                                  >
                                    Enquire
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    onClick={() => navigate(`/practitioners/${p._id}`)}
                                    sx={{
                                      fontWeight: 700,
                                      minHeight: 40,
                                      px: 2.5,
                                      borderRadius: 2.5,
                                      fontSize: '0.85rem',
                                      borderColor: 'divider',
                                      color: 'primary.main',
                                      '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'rgba(11,29,43,0.04)',
                                      }
                                    }}
                                  >
                                    View Profile
                                  </Button>
                                  <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => navigate(`/booking?practitioner=${p._id}`)}
                                    sx={{
                                      fontWeight: 800,
                                      minHeight: 40,
                                      px: 2.5,
                                      borderRadius: 2.5,
                                      fontSize: '0.85rem',
                                      color: 'primary.contrastText',
                                      boxShadow: 'none',
                                      '&:hover': {
                                        bgcolor: '#35b5b5',
                                        boxShadow: 'none',
                                      }
                                    }}
                                  >
                                    Book Now
                                  </Button>
                                </Stack>
                              </Stack>
                            </Box>
                          </CardContent>
                        </MotionCard>
                      ))}
                    </Stack>
                  ) : (
                    <Paper
                      key="no-results"
                      sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 4,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 4px 20px rgba(11,29,43,0.01)',
                      }}
                    >
                      <SearchOff sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" fontWeight={800} color="primary" gutterBottom>
                        No Practitioners Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto' }}>
                        We couldn't find matches matching your filter selection. Try adjusting your postcode, discipline, or funding pathways.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={clearAll}
                        sx={{ borderRadius: 2.5, fontWeight: 700 }}
                      >
                        Reset All Filters
                      </Button>
                    </Paper>
                  )}
                </AnimatePresence>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Mobile filter drawer */}
      <Drawer
        anchor="bottom"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px 24px 0 0',
            p: 3.5,
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={800} color="primary">
            Filter Practitioners
          </Typography>
          <IconButton size="small" onClick={() => setMobileFilterOpen(false)}>
            <Close />
          </IconButton>
        </Stack>

        <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, pb: 4 }}>
          {renderFilterSidebarContent()}
        </Box>

        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            pt: 2,
            borderTop: '1px solid #E2E8F0',
          }}
        >
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => setMobileFilterOpen(false)}
            sx={{
              borderRadius: 3,
              fontWeight: 800,
              py: 1.5,
            }}
          >
            Show Results ({filteredResults.length})
          </Button>
        </Box>
      </Drawer>

      {/* Enquiry Dialog */}
      <Dialog
        open={Boolean(selectedEnquiry)}
        onClose={closeEnquiry}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 5,
            p: 1.5,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', pb: 1 }}>
          Send Enquiry
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1.5 }}>
            {selectedEnquiry && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.75,
                  borderRadius: 3,
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Avatar src={getAvatar(selectedEnquiry)} sx={{ width: 44, height: 44, border: '2.5px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                    {getFullName(selectedEnquiry)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    {selectedEnquiry.discipline}
                  </Typography>
                </Box>
              </Paper>
            )}

            <Alert severity="info" sx={{ borderRadius: 3, fontSize: '0.825rem' }}>
              Your message will be sent to the practitioner. They will respond directly via email or phone.
            </Alert>

            {enquiryError && <Alert severity="error" sx={{ borderRadius: 3 }}>{enquiryError}</Alert>}

            <TextField
              fullWidth
              label="Your name"
              value={enquiryForm.name}
              onChange={(event) => setEnquiryForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={enquirySubmitting}
              InputProps={{ sx: { borderRadius: 2.5 } }}
            />
            <TextField
              fullWidth
              label="Email"
              value={enquiryForm.email}
              onChange={(event) => setEnquiryForm((prev) => ({ ...prev, email: event.target.value }))}
              disabled={enquirySubmitting}
              InputProps={{ sx: { borderRadius: 2.5 } }}
            />
            <TextField
              fullWidth
              label="Phone"
              value={enquiryForm.phone}
              onChange={(event) => setEnquiryForm((prev) => ({ ...prev, phone: event.target.value }))}
              disabled={enquirySubmitting}
              InputProps={{ sx: { borderRadius: 2.5 } }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Message"
              value={enquiryForm.message}
              onChange={(event) => setEnquiryForm((prev) => ({ ...prev, message: event.target.value }))}
              disabled={enquirySubmitting}
              InputProps={{ sx: { borderRadius: 2.5 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={closeEnquiry}
            disabled={enquirySubmitting}
            sx={{ fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={submitEnquiry}
            disabled={enquirySubmitting || !enquiryForm.name || !enquiryForm.email || !enquiryForm.message}
            sx={{
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3,
              color: 'primary.contrastText',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            {enquirySubmitting ? 'Sending...' : 'Send Enquiry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Marketplace;
