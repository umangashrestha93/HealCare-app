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
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
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
  Search as SearchIcon,
  VideocamOutlined,
  CalendarMonth,
  Shield,
  OpenInNew,
  EastRounded,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { DISCIPLINES, FUNDING_PATHWAYS } from '../utils/mockData';
import bannerImg from '../assets/banner.jpg';

// ─── Motion wrappers ────────────────────────────────────────────────────────
const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

// ─── Data ───────────────────────────────────────────────────────────────────
const disciplines = DISCIPLINES.filter((item) => item !== 'All');

const audienceCards = [
  {
    title: 'Families and participants',
    copy: 'Find verified allied health and therapy practitioners who can support flexible goals, funding pathways and access needs.',
    icon: <Groups />,
    accentColor: '#41C6C6',
  },
  {
    title: 'Referrers and support teams',
    copy: 'Search by postcode, discipline, location, travel area, funding options and availability before helping someone connect.',
    icon: <PersonSearch />,
    accentColor: '#41C6C6',
  },
  {
    title: 'Practitioners',
    copy: 'Apply to join the Beyond5 network, build a clear profile and submit documents for behind-the-scenes approval.',
    icon: <MedicalServices />,
    accentColor: '#41C6C6',
  },
];

const journeySteps = [
  'Search by postcode, discipline or therapy type',
  'Compare profiles, travel area, telehealth, funding and availability',
  'Check availability through the practitioner profile',
  'Book through Splose or send a low-friction enquiry',
];

const practitionerSteps = [
  'Register and create a practitioner account',
  'Add profile details, travel area, funding pathways and availability notes',
  'Submit compliance documents for internal review',
  'Approved profiles appear in client search results',
];

const fundingPathways = FUNDING_PATHWAYS;

const mockPractitioners = [
  {
    name: 'Amelia Hart',
    discipline: 'Clinical Psychologist',
    location: 'Brunswick VIC 3056',
    travel: 'Travels within 20 km',
    funding: ['NDIS', 'Medicare'],
    nextAvail: 'Sat 9:30 AM',
    avatar: 'AH',
    avatarBg: '#41C6C6',
  },
  {
    name: 'Jordan Lee',
    discipline: 'Mental Health Social Worker',
    location: 'Telehealth + mobile',
    travel: 'Travels to 3056',
    funding: ['NDIS', "Veterans' Affairs"],
    nextAvail: 'Tomorrow 6 PM',
    avatar: 'JL',
    avatarBg: '#6B8EE8',
  },
  {
    name: 'Maya Singh',
    discipline: 'Art Therapist',
    location: 'Northcote VIC 3070',
    travel: 'Clinic and local visits',
    funding: ['Private Health Fund', 'My Aged Care'],
    nextAvail: 'Fri 3:30 PM',
    avatar: 'MS',
    avatarBg: '#E87D6B',
  },
];

const wellnessCards = [
  {
    icon: <SelfImprovement />,
    title: 'Mental Health & Wellbeing',
    tips: [
      'Regular sessions with a psychologist can reduce anxiety by up to 60%',
      'Mindfulness-based therapy helps manage stress and burnout',
      'Early intervention leads to faster and more lasting recovery',
    ],
    color: '#41C6C6',
  },
  {
    icon: <MedicalServices />,
    title: 'Physical Recovery & Rehab',
    tips: [
      'Allied health support accelerates post-surgery recovery',
      'Occupational therapy improves daily independence and quality of life',
      'Physiotherapy reduces chronic pain without reliance on medication',
    ],
    color: '#41C6C6',
  },
  {
    icon: <Groups />,
    title: 'NDIS & Aged Care Support',
    tips: [
      'NDIS-registered practitioners help participants reach their goals',
      'Aged care allied health services support safe independent living',
      'My Aged Care funding can cover a wide range of therapy disciplines',
    ],
    color: '#41C6C6',
  },
];

// ─── Animation variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Reusable animated section wrapper ──────────────────────────────────────
function AnimatedSection({ children, sx = {} }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <MotionBox
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      sx={sx}
    >
      {children}
    </MotionBox>
  );
}

// ─── Numbered step ───────────────────────────────────────────────────────────
function NumberedStep({ number, text, accentColor = '#41C6C6' }) {
  return (
    <MotionBox variants={fadeUp} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: `2px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        <Typography variant="caption" fontWeight={900} sx={{ color: accentColor, fontSize: '0.8rem' }}>
          {number}
        </Typography>
      </Box>
      <Typography sx={{ color: 'rgba(255,255,255,0.88)', lineHeight: 1.7, pt: 0.5 }}>{text}</Typography>
    </MotionBox>
  );
}

// ════════════════════════════════════════════════════════════════════════════
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
    <Box sx={{ bgcolor: '#F7FBFB', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════ */}
      <Box
        component="section"
        aria-label="Hero section"
        sx={{
          position: 'relative',
          minHeight: { xs: '100svh', md: '90vh' },
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* Background image + gradient overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bannerImg})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center 20%',
          }}
        />

        {/* Floating trust badges — desktop only */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            gap: 1.5,
            position: 'absolute',
            bottom: 48,
            right: 48,
            zIndex: 2,
          }}
        >
          {[
            { icon: <VerifiedUser sx={{ fontSize: 16 }} />, text: '500+ practitioners' },
            { icon: <VideocamOutlined sx={{ fontSize: 16 }} />, text: 'Telehealth available' },
            { icon: <CalendarMonth sx={{ fontSize: 16 }} />, text: 'Same-week bookings' },
          ].map((badge) => (
            <Box
              key={badge.text}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 10,
                bgcolor: 'rgba(11,29,43,0.7)',
                border: '1px solid rgba(255,255,255,0.14)',
                backdropFilter: 'blur(12px)',
                color: 'rgba(255,255,255,0.88)',
              }}
            >
              <Box sx={{ color: '#41C6C6' }}>{badge.icon}</Box>
              <Typography variant="caption" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                {badge.text}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Scroll hint */}
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          sx={{
            position: 'absolute',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            zIndex: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em' }}>
            SCROLL
          </Typography>
          <MotionBox
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            sx={{ width: 1.5, height: 28, bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 4 }}
          />
        </MotionBox>
      </Box>

      {/* ═══════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════ */}
      <Box
        component="section"
        aria-label="Key statistics"
        sx={{
          py: 4,
          bgcolor: '#fff',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 0 0 #E2E8F0',
        }}
      >
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: { xs: 3, md: 0 },
              }}
            >
              {[
                { value: '19', label: 'Allied Health Disciplines', suffix: '+' },
                { value: 'NDIS', label: 'Registered Practitioners', suffix: '' },
                { value: 'Same-week', label: 'Bookings Available', suffix: '' },
                { value: 'Telehealth', label: 'Sessions Nationwide', suffix: '' },
              ].map((stat, i) => (
                <MotionBox
                  key={stat.label}
                  variants={fadeUp}
                  custom={i}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    px: { md: 4 },
                    borderRight: { md: i < 3 ? '1px solid #E2E8F0' : 'none' },
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    color="primary.main"
                    sx={{ letterSpacing: '-0.02em', lineHeight: 1 }}
                  >
                    {stat.value}
                    {stat.suffix}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                </MotionBox>
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════
          WHO BEYOND5 IS FOR
      ═══════════════════════════════════════════════ */}
      <Box
        component="section"
        aria-label="Who Beyond5 is for"
        sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}
      >
        <Container maxWidth="lg">
          <AnimatedSection>
            <MotionBox variants={fadeUp} sx={{ maxWidth: 700, mb: 7 }}>
              <Typography
                variant="overline"
                color="secondary.main"
                fontWeight={900}
                sx={{ letterSpacing: '0.12em' }}
              >
                Who Beyond5 is for
              </Typography>
              <Typography
                variant="h3"
                fontWeight={900}
                sx={{ mt: 1, mb: 2, letterSpacing: '-0.025em', lineHeight: 1.15 }}
              >
                Families, participants, carers and referrers can search first, then register when they're ready.
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
                Beyond5 connects families, NDIS participants, carers, support coordinators, working adults and older Australians with practitioners who fit practical life needs.
              </Typography>
            </MotionBox>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
              }}
            >
              {audienceCards.map((card, i) => (
                <MotionPaper
                  key={card.title}
                  variants={fadeUp}
                  custom={i}
                  elevation={0}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  sx={{
                    p: 3.5,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderTop: `3px solid ${card.accentColor}`,
                    cursor: 'default',
                    transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
                    '&:hover': {
                      boxShadow: `0 16px 40px rgba(0,0,0,0.08)`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${card.accentColor}18`,
                      color: card.accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2.5,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.01em' }}>
                    {card.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.75, fontSize: '0.95rem' }}>
                    {card.copy}
                  </Typography>
                </MotionPaper>
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════
          SEARCH EXPERIENCE + PRACTITIONER CARDS
      ═══════════════════════════════════════════════ */}
      <Box
        component="section"
        aria-label="Search experience"
        sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F7FBFB' }}
      >
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: { xs: 6, md: 8 },
                alignItems: 'center',
              }}
            >
              {/* Left: copy */}
              <Box>
                <MotionBox variants={fadeUp}>
                  <Typography
                    variant="overline"
                    color="secondary.main"
                    fontWeight={900}
                    sx={{ letterSpacing: '0.12em' }}
                  >
                    Search experience
                  </Typography>
                  <Typography
                    variant="h3"
                    fontWeight={900}
                    sx={{ mt: 1, mb: 2.5, letterSpacing: '-0.025em', lineHeight: 1.15 }}
                  >
                    Map-based matching for nearby and travelling practitioners.
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 4, fontSize: '1.05rem', lineHeight: 1.8 }}>
                    A postcode search shows practitioners near the client as well as practitioners willing to travel to that postcode. Funding options are visible before booking.
                  </Typography>
                </MotionBox>

                <MotionBox variants={fadeUp} custom={1}>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 4 }}>
                    {fundingPathways.map((pathway) => (
                      <Chip
                        key={pathway}
                        label={pathway}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: '#fff',
                          transition: 'all 0.18s',
                          '&:hover': { bgcolor: 'secondary.main', color: '#fff', borderColor: 'secondary.main' },
                        }}
                      />
                    ))}
                  </Stack>
                </MotionBox>

                <MotionBox variants={fadeUp} custom={2}>
                  <Button
                    variant="contained"
                    startIcon={<Map />}
                    endIcon={<EastRounded />}
                    onClick={() => navigate('/marketplace')}
                    sx={{
                      fontWeight: 900,
                      px: 3,
                      py: 1.4,
                      borderRadius: 2,
                      boxShadow: 'none',
                      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transform: 'translateY(-1px)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Test practitioner search
                  </Button>
                </MotionBox>
              </Box>

              {/* Right: practitioner mini-cards */}
              <MotionBox variants={fadeUp} custom={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#fff',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                      Showing 3 of 500+ practitioners
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<OpenInNew sx={{ fontSize: '0.85rem !important' }} />}
                      onClick={() => navigate('/marketplace')}
                      sx={{ fontWeight: 700, fontSize: '0.8rem' }}
                    >
                      View all
                    </Button>
                  </Stack>
                  <Stack spacing={2}>
                    {mockPractitioners.map((item, i) => (
                      <MotionPaper
                        key={item.name}
                        variants={fadeUp}
                        custom={i}
                        variant="outlined"
                        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transition: { duration: 0.18 } }}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'border-color 0.2s ease',
                          '&:hover': { borderColor: 'secondary.main' },
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Avatar
                            sx={{
                              bgcolor: item.avatarBg,
                              color: '#fff',
                              fontWeight: 800,
                              width: 44,
                              height: 44,
                              fontSize: '0.85rem',
                              flexShrink: 0,
                            }}
                          >
                            {item.avatar}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                              <Typography fontWeight={800} sx={{ fontSize: '0.95rem' }}>
                                {item.name}
                              </Typography>
                              <Chip
                                icon={<CalendarMonth sx={{ fontSize: '0.75rem !important' }} />}
                                label={item.nextAvail}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(65,198,198,0.1)',
                                  color: '#2a9d9d',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  flexShrink: 0,
                                  border: '1px solid rgba(65,198,198,0.25)',
                                }}
                              />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, mt: 0.25 }}>
                              {item.discipline}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <LocationOn sx={{ fontSize: 13, color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.location} · {item.travel}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
                          {item.funding.map((fund) => (
                            <Chip
                              key={fund}
                              label={fund}
                              size="small"
                              sx={{ fontWeight: 600, fontSize: '0.72rem', bgcolor: '#F0F5F5', border: 'none' }}
                            />
                          ))}
                        </Stack>
                      </MotionPaper>
                    ))}
                  </Stack>
                </Paper>
              </MotionBox>
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS — dark navy
      ═══════════════════════════════════════════════ */}
      <Box
        component="section"
        aria-label="How it works"
        sx={{ py: { xs: 8, md: 12 }, bgcolor: '#0B1D2B', color: '#fff', position: 'relative', overflow: 'hidden' }}
      >
        {/* Decorative blobs */}
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            bgcolor: 'rgba(65,198,198,0.06)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            bgcolor: 'rgba(107,142,232,0.07)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <AnimatedSection>
            <MotionBox variants={fadeUp} sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="overline"
                sx={{ color: '#41C6C6', fontWeight: 900, letterSpacing: '0.12em' }}
              >
                How it works
              </Typography>
              <Typography
                variant="h3"
                fontWeight={900}
                sx={{ color: '#fff', mt: 1, letterSpacing: '-0.025em', lineHeight: 1.15 }}
              >
                Simple for everyone.
              </Typography>
            </MotionBox>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: { xs: 6, md: 8 },
              }}
            >
              {/* Client Journey */}
              <Box>
                <MotionBox variants={fadeUp}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 3,
                      px: 2,
                      py: 0.75,
                      borderRadius: 10,
                      border: '1px solid rgba(65,198,198,0.3)',
                      bgcolor: 'rgba(65,198,198,0.08)',
                    }}
                  >
                    <PersonSearch sx={{ fontSize: 16, color: '#41C6C6' }} />
                    <Typography
                      variant="overline"
                      sx={{ color: '#41C6C6', fontWeight: 900, letterSpacing: '0.1em', lineHeight: 1 }}
                    >
                      Client journey
                    </Typography>
                  </Box>
                </MotionBox>
                <MotionBox variants={fadeUp} custom={1}>
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    sx={{ color: '#fff', mb: 4, letterSpacing: '-0.02em', lineHeight: 1.2 }}
                  >
                    Search, compare and connect.
                  </Typography>
                </MotionBox>
                <Stack spacing={2.5}>
                  {journeySteps.map((step, i) => (
                    <NumberedStep key={step} number={i + 1} text={step} accentColor="#41C6C6" />
                  ))}
                </Stack>
              </Box>

              {/* Practitioner Journey */}
              <Box>
                <MotionBox variants={fadeUp}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 3,
                      px: 2,
                      py: 0.75,
                      borderRadius: 10,
                      border: '1px solid rgba(107,142,232,0.3)',
                      bgcolor: 'rgba(107,142,232,0.08)',
                    }}
                  >
                    <MedicalServices sx={{ fontSize: 16, color: '#41C6C6' }} />
                    <Typography
                      variant="overline"
                      sx={{ color: '#41C6C6', fontWeight: 900, letterSpacing: '0.1em', lineHeight: 1 }}
                    >
                      Practitioner journey
                    </Typography>
                  </Box>
                </MotionBox>
                <MotionBox variants={fadeUp} custom={1}>
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    sx={{ color: '#fff', mb: 4, letterSpacing: '-0.02em', lineHeight: 1.2 }}
                  >
                    Register, verify and go live.
                  </Typography>
                </MotionBox>
                <Stack spacing={2.5}>
                  {practitionerSteps.map((step, i) => (
                    <NumberedStep key={step} number={i + 1} text={step} accentColor="#41C6C6" />
                  ))}
                </Stack>
              </Box>
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════
          WELLNESS / FEATURES SECTION
      ═══════════════════════════════════════════════ */}
      <Box
        component="section"
        aria-label="Evidence-based care"
        sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}
      >
        <Container maxWidth="lg">
          <AnimatedSection>
            <MotionBox variants={fadeUp} sx={{ maxWidth: 680, mb: 7 }}>
              <Typography
                variant="overline"
                color="secondary.main"
                fontWeight={900}
                sx={{ letterSpacing: '0.12em' }}
              >
                Your health matters
              </Typography>
              <Typography
                variant="h3"
                fontWeight={900}
                sx={{ mt: 1, mb: 2, letterSpacing: '-0.025em', lineHeight: 1.15 }}
              >
                Evidence-based care for every stage of life.
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
                Access to quality allied health support improves mental wellbeing, physical recovery and long-term quality of life. Beyond5 connects you with verified practitioners across a wide range of disciplines.
              </Typography>
            </MotionBox>

            {/* Feature icon cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2.5,
                mb: 5,
              }}
            >
              {[
                { icon: <Psychology sx={{ fontSize: 28 }} />, stat: 'Search', label: 'by therapy type, postcode, funding and appointment preference', color: '#41C6C6' },
                { icon: <HealthAndSafety sx={{ fontSize: 28 }} />, stat: 'Compare', label: 'verified profiles, travel area, telehealth and next availability', color: '#41C6C6' },
                { icon: <FavoriteBorder sx={{ fontSize: 28 }} />, stat: 'Connect', label: 'through booking, enquiry or a waitlist pathway when ready', color: '#41C6C6' },
                { icon: <Vaccines sx={{ fontSize: 28 }} />, stat: 'Manage', label: 'saved practitioners, messages, enquiries and support preferences', color: '#41C6C6' },
              ].map((item, i) => (
                <MotionPaper
                  key={item.stat}
                  variants={fadeUp}
                  custom={i}
                  elevation={0}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  sx={{
                    p: 3,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    textAlign: 'center',
                    cursor: 'default',
                    transition: 'box-shadow 0.25s ease',
                    '&:hover': { boxShadow: '0 12px 32px rgba(0,0,0,0.07)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      bgcolor: `${item.color}18`,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={900} sx={{ color: item.color, mb: 0.75 }}>
                    {item.stat}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    {item.label}
                  </Typography>
                </MotionPaper>
              ))}
            </Box>

            {/* Wellness cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
              }}
            >
              {wellnessCards.map((card, i) => (
                <MotionPaper
                  key={card.title}
                  variants={fadeUp}
                  custom={i}
                  elevation={0}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  sx={{
                    p: 3.5,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'box-shadow 0.25s ease',
                    '&:hover': { boxShadow: '0 12px 32px rgba(0,0,0,0.07)' },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: `${card.color}18`, color: card.color, borderRadius: 2 }}>
                      {card.icon}
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
                      {card.title}
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2.5 }} />
                  <Stack spacing={2}>
                    {card.tips.map((tip) => (
                      <Stack key={tip} direction="row" spacing={1.5} alignItems="flex-start">
                        <CheckCircle sx={{ color: card.color, fontSize: 18, mt: 0.25, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                          {tip}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </MotionPaper>
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════ */}
      {!user && (
        <Box
          component="section"
          aria-label="Call to action"
          sx={{ py: { xs: 8, md: 12 }, position: 'relative', overflow: 'hidden' }}
        >
          {/* Gradient background */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #0B1D2B 0%, #13283B 50%, #0d2535 100%)',
            }}
          />

          {/* Decorative wave SVG */}
          <Box
            component="svg"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: { xs: 80, md: 120 },
              opacity: 0.06,
            }}
            aria-hidden="true"
          >
            <path
              d="M0,80 C240,160 480,0 720,80 C960,160 1200,0 1440,80 L1440,0 L0,0 Z"
              fill="#41C6C6"
            />
          </Box>

          {/* Decorative circles */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '8%',
              transform: 'translateY(-50%)',
              width: 280,
              height: 280,
              borderRadius: '50%',
              border: '1px solid rgba(65,198,198,0.12)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: '6%',
              transform: 'translateY(-50%)',
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: '1px solid rgba(107,142,232,0.12)',
              pointerEvents: 'none',
            }}
          />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <AnimatedSection>
              <MotionBox
                variants={fadeUp}
                sx={{
                  textAlign: 'center',
                  maxWidth: 640,
                  mx: 'auto',
                }}
              >
                <Chip
                  label="No account needed to browse"
                  size="small"
                  sx={{
                    mb: 3,
                    bgcolor: 'rgba(65,198,198,0.15)',
                    border: '1px solid rgba(65,198,198,0.3)',
                    color: '#7DE8E8',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                />
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{
                    color: '#fff',
                    mb: 2,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.15,
                  }}
                >
                  Ready to find the right practitioner?
                </Typography>
                <Typography
                  sx={{ color: 'rgba(255,255,255,0.7)', mb: 4.5, fontSize: '1.05rem', lineHeight: 1.75 }}
                >
                  You can browse first. Create an account when you want to book, enquire, save a practitioner or join the waitlist.
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="center"
                >
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/register')}
                    sx={{
                      fontWeight: 900,
                      px: 4,
                      py: 1.6,
                      color: '#fff',
                      borderRadius: 2,
                      fontSize: '1rem',
                      boxShadow: '0 4px 20px rgba(65,198,198,0.3)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 28px rgba(65,198,198,0.45)',
                      },
                    }}
                  >
                    Create free account
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/marketplace')}
                    sx={{
                      fontWeight: 700,
                      px: 4,
                      py: 1.6,
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.35)',
                      borderRadius: 2,
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.75)',
                        bgcolor: 'rgba(255,255,255,0.07)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Browse practitioners
                  </Button>
                </Stack>
              </MotionBox>
            </AnimatedSection>
          </Container>

          {/* Bottom wave */}
          <Box
            component="svg"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: { xs: 80, md: 120 },
              opacity: 0.05,
            }}
            aria-hidden="true"
          >
            <path
              d="M0,120 C360,0 720,200 1080,120 C1260,80 1380,60 1440,120 L1440,200 L0,200 Z"
              fill="#41C6C6"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Home;
