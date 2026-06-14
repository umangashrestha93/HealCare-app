import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
import { motion, useInView } from 'framer-motion';
import {
  AccessTime,
  ArrowForward,
  CalendarMonth,
  CheckCircle,
  Diversity3,
  EastRounded,
  Elderly,
  FamilyRestroom,
  FactCheck,
  Groups,
  Handshake,
  HomeWork,
  Map,
  MedicalServices,
  School,
  Search as SearchIcon,
  Shield,
  SupportAgent,
  VerifiedUser,
  ChatBubbleOutlined,
  WorkOutlineOutlined,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { DISCIPLINES } from '../utils/mockData';
import {
  audienceMessages,
  brandEssence,
  brandPillars,
  competitorLandscape,
  focusGroupValidation,
  pathwayBenefits,
  positioningItems,
  referralSources,
  referralSteps,
} from '../utils/brandContent';
import bannerImg from '../assets/banner.jpg';

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

const disciplines = DISCIPLINES.filter((item) => item !== 'All');

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const pillarIcons = {
  Access: <Map />,
  Flexibility: <AccessTime />,
  Trust: <VerifiedUser />,
  Clarity: <ChatBubbleOutlined />,
};

const audienceIcons = {
  'Families and children': <FamilyRestroom />,
  'NDIS participants and carers': <Groups />,
  'Older people and their families': <Elderly />,
  'Working professionals': <WorkOutlineOutlined />,
  'Referrers and support coordinators': <Handshake />,
  'Allied health practitioners': <MedicalServices />,
};

const competitorIcons = {
  'Traditional allied health clinics': <HomeWork />,
  'Generic healthcare booking platforms': <SearchIcon />,
  'NDIS and support marketplaces': <Diversity3 />,
  'Independent practitioners': <SupportAgent />,
};

const sourceIcons = {
  GPs: <MedicalServices />,
  'NDIS support coordinators': <Groups />,
  'Aged care': <Elderly />,
  'Case managers': <FactCheck />,
  Schools: <School />,
  'Other referral partners': <Handshake />,
};

const benefitIcons = {
  'Faster access pathways': <AccessTime />,
  'More confidence for referrers': <Shield />,
  'Flexible appointment options': <CalendarMonth />,
  'Better alignment with real life': <CheckCircle />,
};

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

function SectionIntro({ eyebrow, title, copy, align = 'left', maxWidth = 760 }) {
  return (
    <MotionBox
      variants={fadeUp}
      sx={{
        maxWidth,
        mx: align === 'center' ? 'auto' : 0,
        textAlign: align,
        mb: { xs: 4, md: 6 },
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: 'secondary.main', fontWeight: 900, letterSpacing: 0 }}
      >
        {eyebrow}
      </Typography>
      <Typography
        variant="h3"
        sx={{
          mt: 1,
          mb: 2,
          fontWeight: 900,
          letterSpacing: 0,
          lineHeight: 1.12,
          fontSize: { xs: '2rem', md: '2.75rem' },
        }}
      >
        {title}
      </Typography>
      {copy && (
        <Typography sx={{ color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.75 }}>
          {copy}
        </Typography>
      )}
    </MotionBox>
  );
}

function PillarCard({ pillar, index }) {
  return (
    <MotionPaper
      variants={fadeUp}
      custom={index}
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        bgcolor: '#fff',
        minHeight: 210,
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: '8px',
          bgcolor: 'rgba(65,198,198,0.14)',
          color: 'secondary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {pillarIcons[pillar.title]}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 0, mb: 0.75 }}>
        {pillar.title}
      </Typography>
      <Typography sx={{ color: 'text.primary', fontWeight: 700, mb: 1, lineHeight: 1.5 }}>
        {pillar.summary}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
        {pillar.detail}
      </Typography>
    </MotionPaper>
  );
}

function AudienceCard({ item, index, onNavigate }) {
  return (
    <MotionPaper
      variants={fadeUp}
      custom={index}
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        bgcolor: '#fff',
        minHeight: 248,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          bgcolor: 'rgba(107,142,232,0.13)',
          color: 'secondary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {audienceIcons[item.audience]}
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: 0, mb: 1 }}>
        {item.audience}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 2, flexGrow: 1 }}>
        {item.message}
      </Typography>
      <Button
        size="small"
        endIcon={<EastRounded />}
        onClick={() => onNavigate(item.audience === 'Allied health practitioners' ? '/register/practitioner' : '/marketplace')}
        sx={{
          alignSelf: 'flex-start',
          px: 0,
          color: 'secondary.dark',
          fontWeight: 900,
          '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
        }}
      >
        {item.cta}
      </Button>
    </MotionPaper>
  );
}

function PositioningMap() {
  return (
    <>
      <Box
        sx={{
          display: { xs: 'none', sm: 'block' },
          position: 'relative',
          minHeight: 430,
          borderLeft: '2px solid #41C6C6',
          borderBottom: '2px solid #41C6C6',
          ml: { sm: 5, md: 7 },
          mb: 5,
          px: 2,
          py: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            left: -54,
            top: '44%',
            transform: 'rotate(-90deg)',
            color: 'primary.main',
            fontWeight: 900,
            width: 150,
            textAlign: 'center',
          }}
        >
          Allied health specificity
        </Typography>
        <Typography
          variant="caption"
          sx={{ position: 'absolute', bottom: -34, left: '40%', color: 'primary.main', fontWeight: 900 }}
        >
          Access flexibility
        </Typography>
        <Box sx={{ position: 'absolute', inset: '12px 18px 18px 18px', borderTop: '1px dashed #D8E5E8', borderRight: '1px dashed #D8E5E8' }} />
        <Box sx={{ position: 'absolute', left: '50%', top: 18, bottom: 18, borderLeft: '1px dashed #D8E5E8' }} />
        <Box sx={{ position: 'absolute', left: 18, right: 18, top: '50%', borderTop: '1px dashed #D8E5E8' }} />

        {positioningItems.map((item) => (
          <Box
            key={item.label}
            sx={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: item.label === 'Beyond5' ? 240 : 190,
              transform: 'translate(-50%, -50%)',
              p: 1.5,
              border: '1px solid',
              borderColor: item.tone === 'highlight' ? 'secondary.main' : 'divider',
              borderRadius: '8px',
              bgcolor: item.tone === 'highlight' ? '#F2FFFF' : '#fff',
              boxShadow: item.tone === 'highlight' ? '0 16px 32px rgba(65,198,198,0.16)' : '0 10px 24px rgba(11,29,43,0.07)',
            }}
          >
            <Typography sx={{ fontWeight: 900, letterSpacing: 0, color: 'primary.main', mb: 0.5 }}>
              {item.label}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.5 }}>
              {item.note}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1.5, mb: 4 }}>
        {positioningItems.map((item) => (
          <Paper
            key={item.label}
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: item.tone === 'highlight' ? 'secondary.main' : 'divider',
              borderRadius: '8px',
              bgcolor: item.tone === 'highlight' ? '#F2FFFF' : '#fff',
            }}
          >
            <Typography sx={{ fontWeight: 900, mb: 0.5 }}>{item.label}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>
              {item.note}
            </Typography>
          </Paper>
        ))}
      </Box>
    </>
  );
}

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
      <Box
        component="section"
        aria-label="Beyond5 homepage hero"
        sx={{
          position: 'relative',
          minHeight: { xs: 'calc(100svh - 64px)', md: '78vh' },
          display: 'flex',
          alignItems: 'center',
          color: '#fff',
          overflow: 'hidden',
          backgroundImage: `url(${bannerImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
      </Box>

      <Box component="section" aria-label="Beyond5 core pillars" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <SectionIntro
              eyebrow="Core messaging pillars"
              title="Access, flexibility, trust and clarity."
              copy="These four pillars keep the Beyond5 experience anchored in the same brand truth across clients, referrers and practitioners."
              align="center"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
              {brandPillars.map((pillar, index) => (
                <PillarCard key={pillar.title} pillar={pillar} index={index} />
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      <Box component="section" aria-label="Audience message library" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#F7FBFB' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <SectionIntro
              eyebrow="Audience message library"
              title="One access model, clear messages for every audience."
              copy="Beyond5 is designed for the people seeking care, the referrers helping them connect and the practitioners who need flexible caseload pathways."
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              {audienceMessages.map((item, index) => (
                <AudienceCard key={item.audience} item={item} index={index} onNavigate={navigate} />
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      <Box component="section" aria-label="Competitive positioning" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <SectionIntro
              eyebrow="Competitive positioning"
              title="More flexible than traditional clinics, more allied-health specific than generic marketplaces."
              copy="Beyond5 combines flexible access with stronger allied health relevance, verification and practical real-life fit."
              maxWidth={880}
            />

            <MotionBox variants={fadeUp}>
              <PositioningMap />
            </MotionBox>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {competitorLandscape.map((item, index) => (
                <MotionPaper
                  key={item.group}
                  variants={fadeUp}
                  custom={index}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px',
                    bgcolor: '#fff',
                  }}
                >
                  <Box sx={{ color: index % 2 === 0 ? 'primary.main' : 'secondary.dark', mb: 1.5 }}>
                    {competitorIcons[item.group]}
                  </Box>
                  <Typography sx={{ fontWeight: 900, letterSpacing: 0, mb: 1 }}>{item.group}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>
                    {item.gap}
                  </Typography>
                </MotionPaper>
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      <Box component="section" aria-label="Referral pathway" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#F7FBFB' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <SectionIntro
              eyebrow="Referral pathway"
              title="A clearer way for referrers to connect people with flexible support."
              copy="The pathway moves from referral source to search, matched options, client connection, booking and confirmation."
              align="center"
              maxWidth={850}
            />

            <MotionBox variants={fadeUp} sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 900, mb: 1.5 }}>
                Referral sources
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {referralSources.map((source) => (
                  <Chip
                    key={source}
                    icon={sourceIcons[source]}
                    label={source}
                    sx={{
                      bgcolor: '#fff',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '8px',
                      fontWeight: 700,
                    }}
                  />
                ))}
              </Stack>
            </MotionBox>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
              {referralSteps.map((step, index) => (
                <MotionPaper
                  key={step.title}
                  variants={fadeUp}
                  custom={index}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px',
                    bgcolor: '#fff',
                    minHeight: 220,
                  }}
                >
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      bgcolor: 'secondary.main',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      mb: 2,
                    }}
                  >
                    {index + 2}
                  </Box>
                  <Typography sx={{ fontWeight: 900, letterSpacing: 0, mb: 1 }}>{step.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>
                    {step.detail}
                  </Typography>
                </MotionPaper>
              ))}
            </Box>

            <MotionPaper
              variants={fadeUp}
              elevation={0}
              sx={{
                mt: 3,
                p: { xs: 2.5, md: 3 },
                borderRadius: '8px',
                border: '1px solid rgba(65,198,198,0.35)',
                bgcolor: '#F2FFFF',
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ md: 'center' }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    bgcolor: 'secondary.main',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Groups />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: 0 }}>
                    Focus group validation
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.75 }}>
                    {focusGroupValidation}
                  </Typography>
                </Box>
              </Stack>
            </MotionPaper>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mt: 3 }}>
              {pathwayBenefits.map((benefit, index) => (
                <MotionPaper
                  key={benefit.title}
                  variants={fadeUp}
                  custom={index}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#fff',
                  }}
                >
                  <Box sx={{ color: 'secondary.main', mb: 1.5 }}>
                    {benefitIcons[benefit.title]}
                  </Box>
                  <Typography sx={{ fontWeight: 900, letterSpacing: 0, mb: 0.75 }}>{benefit.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {benefit.detail}
                  </Typography>
                </MotionPaper>
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {!user && (
        <Box component="section" aria-label="Call to action" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#0B1D2B', color: '#fff' }}>
          <Container maxWidth="md">
            <AnimatedSection>
              <MotionBox variants={fadeUp} sx={{ textAlign: 'center' }}>
                <Typography variant="overline" sx={{ color: '#8AF0EF', fontWeight: 900, letterSpacing: 0 }}>
                  Start with search
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    mt: 1,
                    mb: 2,
                    color: '#fff',
                    fontWeight: 900,
                    letterSpacing: 0,
                    fontSize: { xs: '2rem', md: '2.8rem' },
                  }}
                >
                  Find flexible allied health support before creating an account.
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, mb: 4 }}>
                  Browse practitioner options first. Register when you are ready to book, enquire, save a practitioner or join a waitlist.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/marketplace')}
                    sx={{ borderRadius: '8px', fontWeight: 900, color: '#fff', px: 4, py: 1.4 }}
                  >
                    Browse practitioners
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/about-us')}
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 900,
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.35)',
                      px: 4,
                      py: 1.4,
                      '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                    }}
                  >
                    About Beyond5
                  </Button>
                </Stack>
              </MotionBox>
            </AnimatedSection>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default Home;
