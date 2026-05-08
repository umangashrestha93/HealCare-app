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
  CheckCircle,
  MedicalServices,
  PersonSearch,
  ShieldOutlined,
  Tune,
  VerifiedUser,
  VideoCameraFront,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const MotionBox = motion.create(Box);

const disciplines = [
  'Physiotherapy',
  'Psychology',
  'Occupational Therapy',
  'Speech Pathology',
  'Exercise Physiology',
];

const journeyCards = [
  {
    title: 'Clients and families',
    subtitle: 'Search, compare, book, and manage flexible appointments.',
    icon: <PersonSearch />,
    actions: ['After-hours availability', 'Telehealth and local care', 'Verified practitioner profiles'],
  },
  {
    title: 'Practitioners',
    subtitle: 'Create your profile, submit compliance, and join the marketplace.',
    icon: <MedicalServices />,
    actions: ['Guided onboarding', 'Compliance status tracking', 'Flexible service listing'],
  },
  {
    title: 'Beyond5 admin',
    subtitle: 'Review practitioner applications and monitor marketplace balance.',
    icon: <Tune />,
    actions: ['Verification queue', 'Demand insights', 'Utilisation metrics'],
  },
];

const trustSignals = [
  { label: 'AHPRA and document checks', icon: <VerifiedUser /> },
  { label: 'Transparent practitioner credentials', icon: <ShieldOutlined /> },
  { label: 'After-hours and weekend access', icon: <AccessTime /> },
  { label: 'Telehealth-ready care options', icon: <VideoCameraFront /> },
];

const metrics = [
  { value: '3', label: 'Role-based journeys' },
  { value: '24/7', label: 'Access model' },
  { value: '4', label: 'Compliance document types' },
  { value: 'MVP', label: 'Search, book, verify' },
];

const practitionerPreview = [
  {
    name: 'Dr. Sarah Jenkins',
    discipline: 'Physiotherapy',
    mode: 'Telehealth',
    availability: 'Today, 6:30 PM',
    verified: true,
  },
  {
    name: 'Marcus Chen',
    discipline: 'Occupational Therapy',
    mode: 'In-person',
    availability: 'Saturday, 10:00 AM',
    verified: true,
  },
  {
    name: 'Amelia Rose',
    discipline: 'Speech Pathology',
    mode: 'Telehealth',
    availability: 'Tomorrow, 7:15 PM',
    verified: true,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [discipline, setDiscipline] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = () => {
    navigate('/marketplace', {
      state: {
        discipline,
        location,
      },
    });
  };

  return (
    <Box sx={{ bgcolor: '#f3faf7' }}>
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 620, md: 560 },
          display: 'flex',
          alignItems: 'center',
          color: '#fff',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(90deg, rgba(10, 47, 45, 0.93) 0%, rgba(10, 47, 45, 0.76) 45%, rgba(10, 47, 45, 0.18) 100%), url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=82&w=2200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 5, md: 6 } }}>
          <MotionBox initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <Stack spacing={3} sx={{ maxWidth: 760 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip
                  icon={<VerifiedUser />}
                  label="Verified allied health access"
                  sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff' }}
                />
                <Chip
                  icon={<AccessTime />}
                  label="Beyond the 9 to 5"
                  sx={{ bgcolor: 'rgba(34,197,94,0.18)', color: '#fff' }}
                />
              </Stack>

              <Typography
                variant="h1"
                sx={{
                  color: '#fff',
                  fontSize: { xs: '3rem', md: '5.2rem' },
                  lineHeight: 0.98,
                  fontWeight: 900,
                  maxWidth: 760,
                }}
              >
                Beyond5
              </Typography>

              <Typography
                variant="h5"
                sx={{ color: 'rgba(255,255,255,0.84)', fontWeight: 500, maxWidth: 670, lineHeight: 1.5 }}
              >
                A mobile-first marketplace connecting clients with verified allied health practitioners after hours,
                on weekends, and via telehealth.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate(user ? '/marketplace' : '/register')}
                  sx={{ px: 4, py: 1.6, fontWeight: 900 }}
                >
                  Find flexible care
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register?role=practitioner')}
                  sx={{
                    px: 4,
                    py: 1.6,
                    fontWeight: 900,
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.64)',
                    '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  Join as practitioner
                </Button>
              </Stack>
            </Stack>
          </MotionBox>

          {user?.role !== 'practitioner' && (
            <Paper
              elevation={0}
              sx={{
                mt: { xs: 5, md: 7 },
                p: 1,
                maxWidth: 980,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.22)',
                bgcolor: 'rgba(255,255,255,0.96)',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr auto' },
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <Select
                  fullWidth
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  displayEmpty
                  renderValue={(selected) => selected || 'Any discipline'}
                  inputProps={{ 'aria-label': 'Discipline' }}
                >
                  <MenuItem value="">Any discipline</MenuItem>
                  {disciplines.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>

                <TextField
                  fullWidth
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleSearch}
                  sx={{ height: 56, px: 4, fontWeight: 900 }}
                >
                  Search
                </Button>
              </Box>
            </Paper>
          )}
        </Container>
      </Box>

      <Box sx={{ py: { xs: 5, md: 7 }, bgcolor: '#ffffff', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {metrics.map((metric) => (
              <Box key={metric.label} sx={{ py: 2 }}>
                <Typography variant="h3" fontWeight={900} color="primary.main">
                  {metric.value}
                </Typography>
                <Typography color="text.secondary" fontWeight={700}>
                  {metric.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Stack spacing={2} sx={{ mb: 5, maxWidth: 720 }}>
            <Typography variant="overline" color="secondary.main" fontWeight={900}>
              Core MVP journeys
            </Typography>
            <Typography variant="h3" fontWeight={900}>
              Built around the people who use it every day.
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.05rem' }}>
              Beyond5 focuses on the essential flows from the brief: search, select, book, onboard, approve, and manage.
            </Typography>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {journeyCards.map((card) => (
              <Paper key={card.title} elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mb: 2 }}>{card.icon}</Avatar>
                <Typography variant="h5" fontWeight={900} gutterBottom>
                  {card.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  {card.subtitle}
                </Typography>
                <Stack spacing={1.3}>
                  {card.actions.map((action) => (
                    <Stack key={action} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <CheckCircle color="secondary" fontSize="small" />
                      <Typography variant="body2" fontWeight={700}>{action}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' }, gap: 5, alignItems: 'center' }}>
            <Box>
              <Typography variant="overline" color="secondary.main" fontWeight={900}>
                Search and booking
              </Typography>
              <Typography variant="h3" fontWeight={900} sx={{ mt: 1, mb: 2 }}>
                Compare verified practitioners at a glance.
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 4, fontSize: '1.05rem' }}>
                The marketplace experience is designed for quick scanning: discipline, delivery mode, availability,
                credentials, and verification status are visible before booking.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" onClick={() => navigate('/marketplace')} sx={{ fontWeight: 900 }}>
                  Open marketplace
                </Button>
                <Button variant="outlined" onClick={() => navigate('/register?role=practitioner')} sx={{ fontWeight: 900 }}>
                  Practitioner onboarding
                </Button>
              </Stack>
            </Box>

            <Stack spacing={2}>
              {practitionerPreview.map((item) => (
                <Paper key={item.name} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                      {item.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography fontWeight={900}>{item.name}</Typography>
                        {item.verified && <Chip size="small" icon={<VerifiedUser />} label="Verified" color="secondary" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {item.discipline} • {item.mode}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">Next slot</Typography>
                      <Typography variant="body2" fontWeight={900}>{item.availability}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#0f3f3c', color: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.95fr 1.05fr' }, gap: 5, alignItems: 'center' }}>
            <Box>
              <Typography variant="overline" sx={{ color: '#86efac', fontWeight: 900 }}>
                Trust and compliance
              </Typography>
              <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', mt: 1, mb: 2 }}>
                Confidence matters in healthcare.
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.76)', fontSize: '1.05rem' }}>
                Practitioner profiles, compliance documentation, and admin verification are part of the product flow,
                not an afterthought.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {trustSignals.map((signal) => (
                <Paper key={signal.label} elevation={0} sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.16)', mb: 2 }}>
                    {signal.icon}
                  </Avatar>
                  <Typography fontWeight={900}>{signal.label}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#f3faf7' }}>
        <Container maxWidth="lg">
          <Paper elevation={0} sx={{ p: { xs: 4, md: 5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 3, alignItems: 'center' }}>
              <Box>
                <Typography variant="h3" fontWeight={900} gutterBottom>
                  Ready to move beyond business-hours care?
                </Typography>
                <Typography color="text.secondary">
                  Start with the client search journey or apply as a practitioner and complete onboarding.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" color="secondary" onClick={() => navigate('/register')} sx={{ fontWeight: 900 }}>
                  Create client account
                </Button>
                <Button variant="outlined" onClick={() => navigate('/register?role=practitioner')} sx={{ fontWeight: 900 }}>
                  Join network
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
