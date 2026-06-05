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
  Grid,
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
import { MOCK_PRACTITIONERS, DISCIPLINES, FUNDING_PATHWAYS } from '../utils/mockData';
import { enquiryService } from '../services/api';
import PractitionerMap from '../components/map/PractitionerMap';

const MotionCard = motion.create(Card);

const deliveryOptions = ['All', 'Telehealth', 'Clinic', 'Mobile / travels to me'];

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
  sploseStatus: p.sploseStatus || p.availableSlots?.length ? 'Accepting bookings' : 'Contact for availability',
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

  const handleAvailabilityToggle = (attr) => {
    const nextAvailability = filters.availability.includes(attr)
      ? filters.availability.filter((item) => item !== attr)
      : [...filters.availability, attr];
    dispatch(setFilters({ availability: nextAvailability, page: 1 }));
  };

  const clearAll = () => {
    setPostcode('');
    setSelectedFunding([]);
    dispatch(resetFilters());
    dispatch(fetchPractitioners());
  };

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
      await enquiryService.create({
        practitionerId: selectedEnquiry._id,
        practitionerName,
        practitionerDiscipline: selectedEnquiry.discipline,
        name: enquiryForm.name,
        email: enquiryForm.email,
        phone: enquiryForm.phone,
        message: enquiryForm.message,
        fundingOptions: getFunding(selectedEnquiry),
        preferredPostcode: filters.postcode || postcode,
      });

      setEnquirySent(`Your enquiry for ${practitionerName} has been submitted. Beyond5 can now follow it up from the enquiry records.`);
      setSelectedEnquiry(null);
    } catch (err) {
      setEnquiryError(typeof err === 'string' ? err : err?.message || 'Unable to submit enquiry. Please try again.');
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
        <Typography variant="subtitle2" fontWeight={900} color="primary" gutterBottom>AVAILABILITY</Typography>
        <FormGroup>
          {['After-Hours', 'Weekends'].map((option) => (
            <FormControlLabel
              key={option}
              control={<Checkbox size="small" checked={filters.availability.includes(option)} onChange={() => handleAvailabilityToggle(option)} />}
              label={<Typography variant="body2" fontWeight={700}>{option}</Typography>}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={900} color="primary" gutterBottom>SERVICE TYPE</Typography>
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
    <Box sx={{ bgcolor: '#f7fbfb', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Typography variant="overline" color="secondary.main" fontWeight={900}>Beyond5 client search</Typography>
          <Typography variant="h3" fontWeight={900}>Find allied health and therapy practitioners.</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 860 }}>
            Search by postcode to see nearby practitioners and those willing to travel to your area. Use the interactive map to explore by location.
          </Typography>
        </Stack>

        {enquirySent && (
          <Alert severity="success" onClose={() => setEnquirySent('')} sx={{ mb: 3, borderRadius: 2 }}>
            {enquirySent}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} lg={3} sx={{ display: { xs: 'none', lg: 'block' } }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 100 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 3 }}>Refine search</Typography>
              {renderFilterSidebarContent()}
            </Paper>
          </Grid>

          <Grid item xs={12} lg={9}>
            <Paper elevation={0} sx={{ p: 1.5, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr auto auto' }, gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  placeholder="Search first name, last name, full name or discipline"
                  value={filters.searchTerm}
                  onChange={handleSearchChange}
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
                <Button variant="contained" startIcon={<LocationOn />} onClick={handlePostcodeSearch} sx={{ height: 56, fontWeight: 900 }}>
                  Map search
                </Button>
                <Button variant="outlined" startIcon={<FilterList />} onClick={() => setMobileFilterOpen(true)} sx={{ display: { lg: 'none' }, height: 56, fontWeight: 900 }}>
                  Filters
                </Button>
              </Box>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff', position: { md: 'sticky' }, top: 100 }}>
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
              </Grid>

              <Grid item xs={12} md={7}>
                <AnimatePresence mode="popLayout">
                  {loading && practitioners.length === 0 ? (
                    <Stack spacing={2} key="loading-skeletons">
                      {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={230} sx={{ borderRadius: 2 }} />)}
                    </Stack>
                  ) : filteredResults.length > 0 ? (
                    <Stack spacing={2} key="results-list">
                      {filteredResults.map((p) => (
                        <MotionCard key={p._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                              <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={p.verificationStatus === 'approved' && <Verified color="secondary" sx={{ bgcolor: '#fff', borderRadius: '50%', fontSize: 22 }} />}>
                                <Avatar src={getAvatar(p)} sx={{ width: 92, height: 92, border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                              </Badge>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant="h6" fontWeight={900}>{getFullName(p)}</Typography>
                                  <Chip label={p.gender} size="small" />
                                </Stack>
                                <Typography variant="body2" color="primary" fontWeight={900}>{p.discipline}</Typography>
                                <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="caption" color="text.secondary"><LocationOn sx={{ fontSize: 14, verticalAlign: 'text-bottom' }} /> {getLocation(p)} {getPostcode(p)}</Typography>
                                  <Typography variant="caption" color="text.secondary"><Star sx={{ fontSize: 14, color: '#f59e0b', verticalAlign: 'text-bottom' }} /> {p.averageRating || 'New'} ({p.totalReviews || 0})</Typography>
                                  <Typography variant="caption" color="text.secondary"><CalendarMonth sx={{ fontSize: 14, verticalAlign: 'text-bottom' }} /> {p.afterHours ? 'After hours' : 'Standard hours'}{p.weekends ? ' + weekends' : ''}</Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>{p.bio || 'Allied health practitioner on Beyond5.'}</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                                  <Chip label={p.distanceLabel} color={p.localMatch || p.travelsToPostcode ? 'secondary' : 'default'} size="small" sx={{ fontWeight: 800 }} />
                                  <Chip label={p.travelArea} size="small" />
                                  {getFunding(p).map((fund) => <Chip key={fund} label={fund} size="small" variant="outlined" />)}
                                </Stack>
                                <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={900}>AVAILABILITY</Typography>
                                  <Typography variant="body2" fontWeight={800}>{p.availableSlots?.length ? `${p.availableSlots.length} slots available` : 'Contact for availability'}</Typography>
                                </Paper>
                              </Box>

                              <Stack spacing={1} sx={{ width: { xs: '100%', sm: 150 } }}>
                                <Button variant="contained" color="secondary" onClick={() => navigate(`/booking?practitioner=${p._id}`)} sx={{ fontWeight: 900 }}>
                                  Book
                                </Button>
                                <Button variant="outlined" onClick={() => openEnquiry(p)} sx={{ fontWeight: 900 }}>
                                  Enquire
                                </Button>
                              </Stack>
                            </Stack>
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
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>

      <Drawer anchor="bottom" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} PaperProps={{ sx: { borderRadius: '20px 20px 0 0', p: 4 } }}>
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
