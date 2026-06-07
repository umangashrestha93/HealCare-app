import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  CalendarMonth,
  CheckCircle,
  HealthAndSafety,
  Language,
  LocationOn,
  MedicalServices,
  Payments,
  Verified,
  Videocam,
} from '@mui/icons-material';
import { clientService } from '../services/api';
import { MOCK_PRACTITIONERS } from '../utils/mockData';

const getFullName = (p) => p.name || `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`.trim() || 'Beyond5 practitioner';
const getAvatar = (p) => p.avatar || p.image || p.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p._id || p.id}`;
const getLocation = (p) => p.location || p.userId?.location || 'Location available on profile';
const getFunding = (p) => Array.isArray(p.fundingOptions) && p.fundingOptions.length ? p.fundingOptions : [];

const normalizePractitioner = (p) => ({
  ...p,
  _id: p._id || p.id,
  verificationStatus: p.verificationStatus || (p.verified ? 'approved' : 'pending'),
  registrationDetails: p.registrationDetails || 'Registration and accreditation details available on request',
  whoTheySupport: p.whoTheySupport || 'Families, participants and clients seeking flexible allied health support.',
  specialInterests: p.specialInterests || p.specializations || [],
  appointmentTypes: p.appointmentTypes || [
    p.telehealth ? 'Telehealth' : null,
    p.mobile ? 'In-home/mobile' : 'Clinic-based',
  ].filter(Boolean),
  appointmentPreferences: p.appointmentPreferences || [
    p.afterHours ? 'Evenings' : 'Standard business hours',
    p.weekends ? 'Weekends' : null,
  ].filter(Boolean),
  languages: p.languages || ['English'],
  nextAvailable: p.nextAvailable || (p.availableSlots?.length ? p.availableSlots[0] : 'Contact for availability'),
  travelArea: p.travelArea || (p.mobile ? 'Travels locally' : 'Clinic / telehealth'),
});

const DetailGroup = ({ title, icon, children }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#fff' }}>
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
      <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.light', color: 'primary.main' }}>{icon}</Avatar>
      <Typography variant="subtitle1" fontWeight={900}>{title}</Typography>
    </Stack>
    {children}
  </Paper>
);

const PractitionerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [practitioner, setPractitioner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const demoPractitioner = MOCK_PRACTITIONERS.find((item) => item.id === id || item._id === id);
        if (demoPractitioner) {
          setPractitioner(normalizePractitioner(demoPractitioner));
          return;
        }
        const res = await clientService.getPractitionerDetails(id);
        setPractitioner(normalizePractitioner(res.data || res));
      } catch {
        setError('We could not load this practitioner profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const supportFacts = useMemo(() => {
    if (!practitioner) return [];
    return [
      practitioner.telehealth ? 'Telehealth available' : null,
      practitioner.mobile ? 'Mobile/in-home appointments available' : 'Clinic-based appointments available',
      practitioner.afterHours ? 'After-hours support' : null,
      practitioner.weekends ? 'Weekend appointments' : null,
    ].filter(Boolean);
  }, [practitioner]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F7FBFB' }}>
        <CircularProgress thickness={4} />
      </Box>
    );
  }

  if (error || !practitioner) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Profile not found.'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/marketplace')} sx={{ mt: 3 }}>Back to search</Button>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F7FBFB', minHeight: '100vh', pb: 8 }}>
      <Box sx={{ bgcolor: '#0B1D2B', color: '#fff', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/marketplace')} sx={{ color: '#BDE7E6', mb: 3, px: 0 }}>
            Back to search results
          </Button>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Avatar src={getAvatar(practitioner)} sx={{ width: 132, height: 132, border: '4px solid rgba(189,231,230,0.55)' }} />
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
                {practitioner.verificationStatus === 'approved' && <Chip icon={<Verified />} label="Verified Practitioner" color="secondary" sx={{ fontWeight: 900 }} />}
                <Chip label={practitioner.gender || 'No preference specified'} sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
              </Stack>
              <Typography variant="h2" sx={{ color: '#fff', fontWeight: 900, mb: 0.75 }}>{getFullName(practitioner)}</Typography>
              <Typography variant="h6" sx={{ color: '#BDE7E6', fontWeight: 800 }}>{practitioner.discipline}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', mt: 1.5, maxWidth: 760, lineHeight: 1.7 }}>
                {practitioner.bio || 'A Beyond5 practitioner offering warm, practical allied health support around real-life schedules and access needs.'}
              </Typography>
            </Box>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff', color: 'primary.main', width: { xs: '100%', md: 300 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={900}>NEXT AVAILABLE</Typography>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{practitioner.nextAvailable}</Typography>
              <Button fullWidth variant="contained" color="secondary" onClick={() => navigate(`/booking?practitioner=${practitioner._id}`)} sx={{ fontWeight: 900, mb: 1 }}>
                Check availability
              </Button>
              <Button fullWidth variant="outlined" onClick={() => navigate('/marketplace', { state: { intent: 'enquiry', practitionerId: practitioner._id } })} sx={{ fontWeight: 900 }}>
                Send enquiry
              </Button>
            </Paper>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.35fr 0.9fr' }, gap: 3 }}>
          <Stack spacing={3}>
            <DetailGroup title="Who they support" icon={<HealthAndSafety />}>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{practitioner.whoTheySupport}</Typography>
            </DetailGroup>

            <DetailGroup title="Areas of special interest" icon={<MedicalServices />}>
              <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap' }}>
                {practitioner.specialInterests.map((item) => <Chip key={item} label={item} />)}
              </Stack>
            </DetailGroup>

            <DetailGroup title="Appointment types and availability" icon={<CalendarMonth />}>
              <Stack spacing={1.25}>
                {[...practitioner.appointmentTypes, ...practitioner.appointmentPreferences, ...supportFacts].map((item) => (
                  <Stack key={item} direction="row" spacing={1} alignItems="center">
                    <CheckCircle sx={{ color: 'secondary.main', fontSize: 18 }} />
                    <Typography color="text.secondary">{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </DetailGroup>
          </Stack>

          <Stack spacing={3}>
            <DetailGroup title="Location and access" icon={<LocationOn />}>
              <Typography fontWeight={900}>{getLocation(practitioner)} {practitioner.postcode}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>{practitioner.travelArea}</Typography>
              {practitioner.travelsToPostcodes?.length > 0 && (
                <Stack direction="row" gap={0.75} sx={{ flexWrap: 'wrap', mt: 1.5 }}>
                  {practitioner.travelsToPostcodes.map((postcode) => <Chip key={postcode} label={postcode} size="small" variant="outlined" />)}
                </Stack>
              )}
            </DetailGroup>

            <DetailGroup title="Funding accepted" icon={<Payments />}>
              <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap' }}>
                {getFunding(practitioner).map((fund) => <Chip key={fund} label={fund} color="secondary" />)}
              </Stack>
            </DetailGroup>

            <DetailGroup title="Registration and language" icon={<Language />}>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{practitioner.registrationDetails}</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" fontWeight={900}>Languages spoken</Typography>
              <Typography color="text.secondary">{practitioner.languages.join(', ')}</Typography>
            </DetailGroup>

            <Alert icon={<Videocam />} severity="info" sx={{ borderRadius: 2 }}>
              Booking availability is prepared for Splose. If live availability is not connected yet, Beyond5 will collect an enquiry and confirm the next step by email or SMS.
            </Alert>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default PractitionerProfile;
