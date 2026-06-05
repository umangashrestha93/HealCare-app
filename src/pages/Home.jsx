import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
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
  FavoriteBorder,
  Groups,
  HealthAndSafety,
  LocationOn,
  Map,
  MedicalServices,
  PersonSearch,
  Psychology,
  SelfImprovement,
  VerifiedUser,
  Vaccines,
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
  'View real-time practitioner availability and book sessions online',
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
                {!user && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/register/practitioner')}
                    sx={{ px: 4, py: 1.6, fontWeight: 900, color: '#fff', borderColor: 'rgba(255,255,255,0.68)' }}
                  >
                    Apply as practitioner
                  </Button>
                )}
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

      {/* Healthcare Wellness Section */}
      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Stack spacing={2} sx={{ mb: 6, maxWidth: 720 }}>
            <Typography variant="overline" color="secondary.main" fontWeight={900}>Your health matters</Typography>
            <Typography variant="h3" fontWeight={900}>Evidence-based care for every stage of life.</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
              Access to quality allied health support improves mental wellbeing, physical recovery and long-term quality of life. Beyond5 connects you with verified practitioners across a wide range of disciplines.
            </Typography>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 6 }}>
            {[
              { icon: <Psychology sx={{ fontSize: 32 }} />, stat: '1 in 5', label: 'Australians experience a mental health condition each year', color: '#004a99' },
              { icon: <HealthAndSafety sx={{ fontSize: 32 }} />, stat: '87%', label: 'of people report improved outcomes with consistent allied health support', color: '#0d8a72' },
              { icon: <FavoriteBorder sx={{ fontSize: 32 }} />, stat: '24/7', label: 'Access to after-hours and telehealth care when you need it most', color: '#ea580c' },
              { icon: <Vaccines sx={{ fontSize: 32 }} />, stat: '200+', label: 'Verified practitioners across Australia ready to support you', color: '#7c3aed' },
            ].map((item) => (
              <Paper key={item.label} elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Box sx={{ color: item.color, mb: 1.5, display: 'flex', justifyContent: 'center' }}>{item.icon}</Box>
                <Typography variant="h4" fontWeight={900} sx={{ color: item.color, mb: 0.5 }}>{item.stat}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{item.label}</Typography>
              </Paper>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 6 }}>
            {[
              {
                icon: <SelfImprovement />,
                title: 'Mental Health & Wellbeing',
                tips: ['Regular sessions with a psychologist can reduce anxiety by up to 60%', 'Mindfulness-based therapy helps manage stress and burnout', 'Early intervention leads to faster and more lasting recovery'],
                color: '#004a99',
              },
              {
                icon: <MedicalServices />,
                title: 'Physical Recovery & Rehab',
                tips: ['Allied health support accelerates post-surgery recovery', 'Occupational therapy improves daily independence and quality of life', 'Physiotherapy reduces chronic pain without reliance on medication'],
                color: '#0d8a72',
              },
              {
                icon: <Groups />,
                title: 'NDIS & Aged Care Support',
                tips: ['NDIS-registered practitioners help participants reach their goals', 'Aged care allied health services support safe independent living', 'My Aged Care funding can cover a wide range of therapy disciplines'],
                color: '#ea580c',
              },
            ].map((card) => (
              <Paper key={card.title} elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${card.color}1a`, color: card.color }}>{card.icon}</Avatar>
                  <Typography variant="h6" fontWeight={900}>{card.title}</Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  {card.tips.map((tip) => (
                    <Stack key={tip} direction="row" spacing={1.5} alignItems="flex-start">
                      <CheckCircle sx={{ color: card.color, fontSize: 18, mt: 0.3, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{tip}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Box>

          {!user && (
            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, bgcolor: '#0d3837', color: '#fff', textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>Ready to find the right practitioner?</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.78)', mb: 3, maxWidth: 560, mx: 'auto' }}>
                Create a free account to browse verified allied health professionals, check availability and book sessions online.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button variant="contained" color="secondary" size="large" onClick={() => navigate('/register')} sx={{ fontWeight: 900, px: 4 }}>
                  Create free account
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/marketplace')} sx={{ fontWeight: 900, px: 4, color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>
                  Browse practitioners
                </Button>
              </Stack>
            </Paper>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
