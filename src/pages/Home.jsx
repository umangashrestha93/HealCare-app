import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AccessTime,
  ArrowForward,
  CheckCircle,
  Groups,
  Handshake,
  LocationOn,
  Map,
  MedicalServices,
  PersonSearch,
  VerifiedUser,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const MotionBox = motion.create(Box);

const disciplines = [
  'Psychologists',
  'Clinical Psychologists',
  'Neuropsychologists',
  'Counsellors',
  'Psychotherapists',
  'Social Workers, AASW-accredited',
  'Mental Health Social Workers',
  'Art Therapists',
  'Music Therapists',
  'Drama Therapists',
  'Play Therapists',
];

const audienceCards = [
  {
    title: 'Families and participants',
    copy: 'Find verified allied health and therapy practitioners who can support flexible goals, funding pathways and access needs.',
    icon: <Groups />,
  },
  {
    title: 'Referrers and support teams',
    copy: 'Search by postcode, discipline, location, travel area, funding options and availability before helping someone connect.',
    icon: <PersonSearch />,
  },
  {
    title: 'Practitioners',
    copy: 'Apply to join the Beyond5 network, build a clear profile and submit documents for behind-the-scenes approval.',
    icon: <MedicalServices />,
  },
];

const journeySteps = [
  'Search by postcode, discipline or therapy type',
  'Compare profile, gender, location, travel area and funding options',
  'View Splose-powered booking availability when integration is connected',
  'Book or enquire through the practitioner profile',
];

const practitionerSteps = [
  'Register and create a practitioner account',
  'Add profile details, travel area, funding pathways and availability notes',
  'Submit compliance documents for internal review',
  'Approved profiles appear in client search results',
];

const fundingPathways = ['NDIS', 'Medicare', 'My Aged Care', 'Private Health Fund', 'Veterans’ Affairs'];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [discipline, setDiscipline] = useState('');
  const [postcode, setPostcode] = useState('');

  const handleSearch = () => {
    navigate('/marketplace', {
      state: {
        discipline: discipline || 'All',
        postcode,
      },
    });
  };

  return (
    <Box sx={{ bgcolor: '#f7fbfb' }}>
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 660, md: 620 },
          display: 'flex',
          alignItems: 'center',
          color: '#fff',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(90deg, rgba(13, 56, 55, 0.94) 0%, rgba(13, 56, 55, 0.82) 48%, rgba(13, 56, 55, 0.28) 100%), url(https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&q=82&w=2200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 5, md: 7 } }}>
          <MotionBox initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <Stack spacing={3} sx={{ maxWidth: 820 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip icon={<VerifiedUser />} label="Allied health access platform" sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff' }} />
                <Chip icon={<AccessTime />} label="Flexible therapy options" sx={{ bgcolor: 'rgba(255,193,7,0.2)', color: '#fff' }} />
              </Stack>

              <Typography
                variant="h1"
                sx={{
                  color: '#fff',
                  fontSize: { xs: '3.1rem', md: '5.4rem' },
                  lineHeight: 0.98,
                  fontWeight: 900,
                  maxWidth: 780,
                }}
              >
                Beyond5
              </Typography>

              <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.86)', fontWeight: 500, maxWidth: 760, lineHeight: 1.5 }}>
                An allied health access model helping families, participants, referrers and practitioners connect around flexible therapy options.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" color="secondary" size="large" endIcon={<ArrowForward />} onClick={() => navigate('/marketplace')} sx={{ px: 4, py: 1.6, fontWeight: 900 }}>
                  Find a practitioner
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register/practitioner')}
                  sx={{ px: 4, py: 1.6, fontWeight: 900, color: '#fff', borderColor: 'rgba(255,255,255,0.68)' }}
                >
                  Apply as practitioner
                </Button>
              </Stack>
            </Stack>
          </MotionBox>

          {user?.role !== 'practitioner' && (
            <Paper elevation={0} sx={{ mt: { xs: 5, md: 7 }, p: 1, maxWidth: 1040, borderRadius: 2, border: '1px solid rgba(255,255,255,0.22)', bgcolor: 'rgba(255,255,255,0.97)' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr auto' }, gap: 1, alignItems: 'center' }}>
                <Select fullWidth value={discipline} onChange={(e) => setDiscipline(e.target.value)} displayEmpty renderValue={(selected) => selected || 'Any allied health discipline'}>
                  <MenuItem value="">Any allied health discipline</MenuItem>
                  {disciplines.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>
                <TextField fullWidth label="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))} inputProps={{ inputMode: 'numeric' }} />
                <Button variant="contained" color="secondary" size="large" onClick={handleSearch} sx={{ height: 56, px: 4, fontWeight: 900 }}>
                  Search map
                </Button>
              </Box>
            </Paper>
          )}
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Stack spacing={2} sx={{ maxWidth: 780, mb: 5 }}>
            <Typography variant="overline" color="secondary.main" fontWeight={900}>What Beyond5 does</Typography>
            <Typography variant="h3" fontWeight={900}>Access to allied health support without treating it like a generic directory.</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
              Beyond5 helps people find therapy and allied health practitioners who match practical needs: discipline, location, willingness to travel, availability and funding pathways.
            </Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {audienceCards.map((card) => (
              <Paper key={card.title} elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mb: 2 }}>{card.icon}</Avatar>
                <Typography variant="h5" fontWeight={900} gutterBottom>{card.title}</Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{card.copy}</Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.95fr 1.05fr' }, gap: 5, alignItems: 'center' }}>
            <Box>
              <Typography variant="overline" color="secondary.main" fontWeight={900}>Search experience</Typography>
              <Typography variant="h3" fontWeight={900} sx={{ mt: 1, mb: 2 }}>Map-based matching for nearby and travelling practitioners.</Typography>
              <Typography color="text.secondary" sx={{ mb: 4, fontSize: '1.05rem', lineHeight: 1.8 }}>
                A postcode search should show practitioners near the client as well as practitioners willing to travel to that postcode. Funding options are visible before booking.
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 4 }}>
                {fundingPathways.map((pathway) => <Chip key={pathway} label={pathway} />)}
              </Stack>
              <Button variant="contained" startIcon={<Map />} onClick={() => navigate('/marketplace')} sx={{ fontWeight: 900 }}>
                Test practitioner search
              </Button>
            </Box>

            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
              <Stack spacing={2}>
                {[
                  { name: 'Amelia Hart', discipline: 'Clinical Psychologist', location: 'Brunswick VIC 3056', travel: 'Travels within 20 km', funding: ['NDIS', 'Medicare'] },
                  { name: 'Jordan Lee', discipline: 'Mental Health Social Worker', location: 'Telehealth + mobile', travel: 'Travels to 3056', funding: ['NDIS', 'Veterans’ Affairs'] },
                  { name: 'Maya Singh', discipline: 'Art Therapist', location: 'Northcote VIC 3070', travel: 'Clinic and local visits', funding: ['Private Health Fund', 'My Aged Care'] },
                ].map((item) => (
                  <Paper key={item.name} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>{item.name.charAt(0)}</Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={900}>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{item.discipline}</Typography>
                        <Typography variant="caption" color="text.secondary"><LocationOn sx={{ fontSize: 13, verticalAlign: 'text-bottom' }} /> {item.location} · {item.travel}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                      {item.funding.map((fund) => <Chip key={fund} label={fund} size="small" />)}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#0d3837', color: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 5 }}>
            <Box>
              <Typography variant="overline" sx={{ color: '#ffc107', fontWeight: 900 }}>Client journey</Typography>
              <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', mt: 1, mb: 3 }}>Search, compare and connect.</Typography>
              <Stack spacing={1.5}>
                {journeySteps.map((step) => (
                  <Stack key={step} direction="row" spacing={1.25} alignItems="center">
                    <CheckCircle sx={{ color: '#ffc107' }} />
                    <Typography>{step}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: '#ffc107', fontWeight: 900 }}>Practitioner journey</Typography>
              <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', mt: 1, mb: 3 }}>Register, verify and go live.</Typography>
              <Stack spacing={1.5}>
                {practitionerSteps.map((step) => (
                  <Stack key={step} direction="row" spacing={1.25} alignItems="center">
                    <CheckCircle sx={{ color: '#ffc107' }} />
                    <Typography>{step}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Paper elevation={0} sx={{ p: { xs: 4, md: 5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 3, alignItems: 'center' }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Handshake color="primary" />
                  <Typography variant="h4" fontWeight={900}>Bookings through Splose</Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  Practitioner calendar visibility and booking availability are marked as Splose-managed in this MVP. The UI is ready to display live Splose availability once API credentials and field mapping are confirmed.
                </Typography>
              </Box>
              <Button variant="contained" color="secondary" onClick={() => navigate('/register/practitioner')} sx={{ fontWeight: 900 }}>
                Start practitioner application
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
