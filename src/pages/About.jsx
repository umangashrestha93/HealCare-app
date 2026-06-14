import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { motion, useInView } from 'framer-motion';
import {
  AccessTime,
  ArrowForward,
  ChatBubbleOutlined,
  CheckCircle,
  Diversity3,
  HealthAndSafety,
  Map,
  MedicalServices,
  Search as SearchIcon,
  VerifiedUser,
} from '@mui/icons-material';
import {
  approvedDescriptions,
  audienceMessages,
  brandEssence,
  brandPillars,
  competitorLandscape,
  focusGroupValidation,
  pathwayBenefits,
} from '../utils/brandContent';
import bannerImg from '../assets/banner2.jpg';

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
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

const benefitIcons = {
  'Faster access pathways': <AccessTime />,
  'More confidence for referrers': <VerifiedUser />,
  'Flexible appointment options': <CheckCircle />,
  'Better alignment with real life': <Diversity3 />,
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
      <Typography variant="overline" sx={{ color: 'secondary.main', fontWeight: 900, letterSpacing: 0 }}>
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

const About = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#F7FBFB', overflowX: 'hidden' }}>
      <Box
        component="section"
        aria-label="About Beyond5"
        sx={{
          position: 'relative',
          minHeight: { xs: '70vh', md: '67vh' },
          display: 'flex',
          alignItems: 'center',
          color: '#fff',
          backgroundImage: `url(${bannerImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
          <MotionBox initial="hidden" animate="visible" variants={stagger} sx={{ maxWidth: 780 }}>
            {/* <MotionBox variants={fadeUp}>
              <Typography variant="overline" sx={{ color: '#8AF0EF', fontWeight: 900, letterSpacing: 0 }}>
                About Beyond5
              </Typography>
            </MotionBox>
            <MotionBox variants={fadeUp} custom={1}>
              <Typography
                variant="h1"
                sx={{
                  mt: 1,
                  mb: 2.5,
                  fontWeight: 900,
                  letterSpacing: 0,
                  lineHeight: 1.05,
                  fontSize: { xs: '3rem', md: '5rem' },
                }}
              >
                {brandEssence.headline}
              </Typography>
            </MotionBox>
            <MotionBox variants={fadeUp} custom={2}>
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontSize: '1.18rem', lineHeight: 1.75, mb: 4 }}>
                {brandEssence.description}
              </Typography>
            </MotionBox> */}
            {/* <MotionBox variants={fadeUp} custom={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/marketplace')}
                  sx={{ borderRadius: '8px', fontWeight: 900, color: '#fff', px: 4, py: 1.4 }}
                >
                  Find a Practitioner
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register/practitioner')}
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
                  Join as Practitioner
                </Button>
              </Stack>
            </MotionBox> */}
          </MotionBox>
        </Container>
      </Box>

      <Box component="section" aria-label="What Beyond5 is" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <SectionIntro
              eyebrow="What Beyond5 is"
              title="A flexible allied health access model."
              copy="Beyond5 exists to make trusted therapy easier to find for people whose routines, funding pathways, mobility, work and care responsibilities do not always fit standard clinic hours."
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              {approvedDescriptions.map((description, index) => (
                <MotionPaper
                  key={description}
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
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <CheckCircle sx={{ color: 'secondary.main', mt: 0.25, flexShrink: 0 }} />
                    <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                      {description}
                    </Typography>
                  </Stack>
                </MotionPaper>
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      <Box component="section" aria-label="Beyond5 pillars" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#F7FBFB' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <SectionIntro
              eyebrow="Brand truth"
              title="Built on access, flexibility, trust and clarity."
              copy="These pillars guide the public experience, referral pathways and practitioner onboarding."
              align="center"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
              {brandPillars.map((pillar, index) => (
                <MotionPaper
                  key={pillar.title}
                  variants={fadeUp}
                  custom={index}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#fff',
                    minHeight: 214,
                  }}
                >
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: '8px',
                      bgcolor:  'rgba(65,198,198,0.14)',
                      color: 'secondary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    {pillarIcons[pillar.title]}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 0, mb: 1 }}>
                    {pillar.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                    {pillar.detail}
                  </Typography>
                </MotionPaper>
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      <Box component="section" aria-label="Who Beyond5 supports" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <SectionIntro
              eyebrow="Who we support"
              title="For people seeking care, people making referrals and practitioners delivering support."
              copy="The Beyond5 message flexes across audiences while staying anchored in the same practical promise."
              maxWidth={860}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
              {audienceMessages.map((item, index) => (
                <MotionPaper
                  key={item.audience}
                  variants={fadeUp}
                  custom={index}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#fff',
                    minHeight: 178,
                  }}
                >
                  <Typography sx={{ fontWeight: 900, letterSpacing: 0, mb: 1 }}>
                    {item.audience}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                    {item.message}
                  </Typography>
                </MotionPaper>
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      <Box component="section" aria-label="How Beyond5 is different" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#F7FBFB' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <SectionIntro
              eyebrow="How Beyond5 is different"
              title="Flexible access with stronger allied health relevance."
              copy="Beyond5 is not positioned as a doctor directory, generic healthcare marketplace or promise of instant clinical outcomes. It is a clearer access model for allied health support that fits real life."
              maxWidth={880}
            />

            <MotionPaper
              variants={fadeUp}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                overflow: 'hidden',
                bgcolor: '#fff',
              }}
            >
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead" sx={{ bgcolor: '#F0F8F8' }}>
                  <Box component="tr">
                    {['Competitor group', 'Strength', 'Gap Beyond5 addresses'].map((heading) => (
                      <Box
                        key={heading}
                        component="th"
                        sx={{
                          p: 2,
                          textAlign: 'left',
                          color: 'primary.main',
                          fontSize: '0.9rem',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {heading}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {competitorLandscape.map((item) => (
                    <Box component="tr" key={item.group}>
                      <Box component="td" sx={{ p: 2, fontWeight: 800, verticalAlign: 'top', borderBottom: '1px solid', borderColor: 'divider' }}>
                        {item.group}
                      </Box>
                      <Box component="td" sx={{ p: 2, color: 'text.secondary', verticalAlign: 'top', borderBottom: '1px solid', borderColor: 'divider' }}>
                        {item.strength}
                      </Box>
                      <Box component="td" sx={{ p: 2, color: 'text.secondary', verticalAlign: 'top', borderBottom: '1px solid', borderColor: 'divider' }}>
                        {item.gap}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </MotionPaper>
          </AnimatedSection>
        </Container>
      </Box>

      <Box component="section" aria-label="Referral confidence" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <SectionIntro
              eyebrow="Referral confidence"
              title="Designed for clearer, more confident connection."
              copy={focusGroupValidation}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {pathwayBenefits.map((benefit, index) => (
                <MotionPaper
                  key={benefit.title}
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
                  <Box sx={{ color: 'secondary.main', mb: 1.5 }}>
                    {benefitIcons[benefit.title]}
                  </Box>
                  <Typography sx={{ fontWeight: 900, letterSpacing: 0, mb: 0.75 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>
                    {benefit.detail}
                  </Typography>
                </MotionPaper>
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      <Box component="section" aria-label="About call to action" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#0B1D2B', color: '#fff' }}>
        <Container maxWidth="md">
          <AnimatedSection>
            <MotionBox variants={fadeUp} sx={{ textAlign: 'center' }}>
              <Chip
                icon={<HealthAndSafety sx={{ color: '#8AF0EF !important' }} />}
                label={brandEssence.strapline}
                sx={{
                  mb: 3,
                  bgcolor: 'rgba(65,198,198,0.14)',
                  border: '1px solid rgba(65,198,198,0.35)',
                  color: '#fff',
                  borderRadius: '8px',
                  fontWeight: 900,
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  color: '#fff',
                  fontWeight: 900,
                  letterSpacing: 0,
                  mb: 2,
                  fontSize: { xs: '2rem', md: '2.8rem' },
                }}
              >
                Start with a clearer pathway to support.
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, mb: 4 }}>
                Search practitioners, compare access options and connect when the fit feels right.
              </Typography>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.14)', mb: 4 }} />
              {/* <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<SearchIcon />}
                  onClick={() => navigate('/marketplace')}
                  sx={{ borderRadius: '8px', fontWeight: 900, color: '#fff', px: 4, py: 1.4 }}
                >
                  Browse practitioners
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<MedicalServices />}
                  onClick={() => navigate('/register/practitioner')}
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
                  Register as practitioner
                </Button>
              </Stack> */}
            </MotionBox>
          </AnimatedSection>
        </Container>
      </Box>
    </Box>
  );
};

export default About;
