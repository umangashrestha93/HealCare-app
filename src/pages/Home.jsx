import { cloneElement } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Container, Grid, Card, CardContent,
  Avatar, Chip, Stack,
  TextField,
  Divider,
  Paper
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AccessTime, VerifiedUser, TrendingUp, ArrowForward,
  PersonSearch, MedicalServices, Star, Schedule, VideoCameraFront,
  Search,
  CalendarMonth,
  CheckCircle,
  LocationOn
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: 'easeOut', delay: i * 0.12 }
  })
};

const TESTIMONIALS = [
  { name: 'Rachel M.', role: 'NDIS Participant', text: 'Finally found a physio available on Sunday evenings. Game changer for our family!', avatar: 'https://i.pravatar.cc/60?u=rachel' },
  { name: 'Tom B.', role: 'Shift Worker', text: 'Booked my psychologist for 8pm on a Tuesday. Never thought that was possible.', avatar: 'https://i.pravatar.cc/60?u=tom' },
  { name: 'Linda K.', role: 'Practitioner', text: 'I set my own hours and Beyond5 fills my calendar. Best decision I made.', avatar: 'https://i.pravatar.cc/60?u=linda' },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const renderServices = () => {
    return (
      <>
        {user?.role !== 'practitioner' && (
          <Container maxWidth="lg" sx={{ mt: -6, position: 'relative', zIndex: 10, alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
            <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', color: 'primary.dark' }}>Our Services</Box>
            <Grid container spacing={3}>
              {[
                { label: 'Book Appointment', icon: <CalendarMonth />, color: '#004a99' },
                { label: 'Telehealth Call', icon: <VideoCameraFront />, color: '#16a34a' },
                { label: 'Find Services', icon: <MedicalServices />, color: '#ea580c' },
                { label: '24/7 Support', icon: <Schedule />, color: '#7c3aed' },
              ].map((service, i) => (
                <Grid item xs={6} md={3} key={service.label}>
                  <MotionCard
                    whileHover={{ y: -8 }}
                    sx={{
                      textAlign: 'center', py: 4, px: 2, cursor: 'pointer',
                      border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Box sx={{
                      width: 64, height: 64, borderRadius: '50%',
                      bgcolor: `${service.color}1a`, color: service.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mx: 'auto', mb: 2
                    }}>
                      {cloneElement(service.icon, { fontSize: 'large' })}
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700}>{service.label}</Typography>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </Container>
        )}
      </>
    )
  }

  return (
    <Box sx={{ bgcolor: 'background.default' }}>

      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative',
        background: 'linear-gradient(135deg, #004a99 0%, #003366 100%)',
        color: '#ffffff',
        pt: { xs: 8, md: 12 },
        pb: { xs: 12, md: 16 },
        overflow: 'hidden'
      }}>
        {/* Background Image Overlay */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.15,
          backgroundImage: 'url(https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          pointerEvents: 'none'
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center" justifyContent={user?.role === 'practitioner' ? 'center' : 'flex-start'}>
            <Grid item xs={12} md={user?.role === 'practitioner' ? 10 : 7}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                sx={{ textAlign: user?.role === 'practitioner' ? 'center' : 'left', width: '100%' }}
              >
                <Typography variant="h2" sx={{
                  color: '#ffffff', mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.75rem' },
                  lineHeight: 1.1, fontWeight: 800
                }}>
                  World-Class Care,<br />
                  <Box component="span" sx={{ color: 'secondary.light' }}>Beyond the 9 to 5</Box>
                </Typography>
                <Typography variant="h6" sx={{
                  color: 'rgba(255,255,255,0.8)', mb: user?.role === 'practitioner' ? 4 : 6,
                  fontWeight: 400, maxWidth: user?.role === 'practitioner' ? 800 : 600,
                  mx: user?.role === 'practitioner' ? 'auto' : 0
                }}>
                  Access Australia's leading allied health professionals after hours and on weekends.
                  AHPRA-verified care that fits your schedule.
                </Typography>

                {user?.role === 'practitioner' && (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    sx={{ borderRadius: '50px', px: 6, py: 2, fontWeight: 800, fontSize: '1.1rem' }}
                  >
                    Go to Practitioner Workspace
                  </Button>
                )}
              </MotionBox>

              {/* Premium Multi-Field Search Widget - Hidden for Practitioners */}
              {user?.role !== 'practitioner' && (
                <MotionBox
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                  sx={{
                    p: 0.5, bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    maxWidth: 800,
                    width: '100%',
                    border: '1px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <Box sx={{ flex: 1.5, display: 'flex', alignItems: 'center', px: 2, width: '100%' }}>
                    <Search color="primary" sx={{ mr: 1.5, opacity: 0.7 }} />
                    <TextField
                      fullWidth
                      placeholder="Doctor, Specialty or Condition"
                      variant="standard"
                      InputProps={{
                        disableUnderline: true,
                        sx: { height: 64, fontSize: '1rem', fontWeight: 500 }
                      }}
                    />
                  </Box>

                  <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1, my: 2, borderRightWidth: 2 }} />
                  <Divider sx={{ display: { xs: 'block', md: 'none' }, width: '100%' }} />

                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 2, width: '100%' }}>
                    <LocationOn color="primary" sx={{ mr: 1.5, opacity: 0.7 }} />
                    <TextField
                      fullWidth
                      placeholder="Location"
                      variant="standard"
                      InputProps={{
                        disableUnderline: true,
                        sx: { height: 64, fontSize: '1rem', fontWeight: 500 }
                      }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate('/marketplace')}
                    sx={{
                      px: 6, height: { xs: 60, md: 60 },
                      borderRadius: '20px', fontSize: '1.05rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      m: 0.5,
                      width: { xs: 'calc(100% - 8px)', md: 'auto' },
                      boxShadow: '0 10px 20px rgba(234, 88, 12, 0.2)',
                      '&:hover': { boxShadow: '0 15px 30px rgba(234, 88, 12, 0.3)' }
                    }}
                  >
                    Search Now
                  </Button>
                </MotionBox>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── FEATURES SECTION ───────────────────────────────────────────── */}
      <Box sx={{ py: 12 }}>
        <Container maxWidth="lg">
          {renderServices()}
        </Container>
      </Box>

      {/* ─── TRUSTED STATISTICS ─────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'primary.main', color: '#ffffff', py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} textAlign="center">
            {[
              { value: '500+', label: 'Doctors & Specialists' },
              { value: '25+', label: 'Disciplines' },
              { value: '100K+', label: 'Happy Patients' },
              { value: '4.9/5', label: 'Patient Satisfaction' },
            ].map((stat) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>{stat.value}</Typography>
                <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>{stat.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── MEDIUM HORIZONTAL CTA BANNER ───────────────────────────── */}
      <Box sx={{
        py: { xs: 6, md: 10 },
        bgcolor: '#ffffff',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: 8,
              bgcolor: '#f8fafc',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Grid container spacing={6} alignItems="center">
              {/* Content Side */}
              <Grid item xs={12} md={7}>
                <MotionBox
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <Typography variant="overline" color="secondary.main" fontWeight={800} letterSpacing={2}>
                    START YOUR JOURNEY
                  </Typography>
                  <Typography variant="h3" sx={{
                    mt: 1, mb: 2, fontWeight: 900,
                    fontSize: { xs: '2rem', md: '2.75rem' },
                    lineHeight: 1.2, color: '#003366'
                  }}>
                    Quality care that fits<br />your life.
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, fontWeight: 400, maxWidth: 500 }}>
                    Access Australia's leading allied health professionals after hours and on weekends.
                    Simple, secure, and AHPRA-verified.
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    {!user ? (
                      <>
                        <Button
                          variant="contained" color="secondary"
                          onClick={() => navigate('/register')}
                          sx={{
                            borderRadius: '12px', px: 5, py: 2,
                            fontWeight: 800, textTransform: 'none', fontSize: '1.05rem'
                          }}
                        >
                          Book Appointment
                        </Button>
                        <Button
                          variant="outlined" color="primary"
                          onClick={() => navigate('/register?role=practitioner')}
                          sx={{
                            borderRadius: '12px', px: 5, py: 2,
                            fontWeight: 800, textTransform: 'none', fontSize: '1.05rem',
                            borderWidth: 2, '&:hover': { borderWidth: 2 }
                          }}
                        >
                          Join as Provider
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained" color="primary"
                        onClick={() => navigate('/dashboard')}
                        sx={{
                          borderRadius: '12px', px: 8, py: 2,
                          fontWeight: 800, textTransform: 'none', fontSize: '1.05rem'
                        }}
                      >
                        Go to My Dashboard
                      </Button>
                    )}
                  </Stack>
                </MotionBox>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
