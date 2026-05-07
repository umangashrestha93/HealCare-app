import { cloneElement } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Container, Grid, Card, CardContent,
  Avatar, Chip, Stack,
  TextField
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AccessTime, VerifiedUser, TrendingUp, ArrowForward,
  PersonSearch, MedicalServices, Star, Schedule, VideoCameraFront,
  Search,
  CalendarMonth,
  CheckCircle
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

              {/* Search Widget - Hidden for Practitioners */}
              {user?.role !== 'practitioner' && (
                <MotionBox
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                  sx={{
                    p: 1, bgcolor: '#ffffff', borderRadius: 4,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    maxWidth: 600
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      fullWidth
                      placeholder="Search Doctors, Specialists..."
                      variant="standard"
                      InputProps={{
                        disableUnderline: true,
                        startAdornment: <Search color="action" sx={{ ml: 2, mr: 1 }} />,
                        sx: { height: 60, fontSize: '1.1rem' }
                      }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      onClick={() => navigate('/marketplace')}
                      sx={{
                        px: 4, height: { sm: 60 },
                        borderRadius: 3, fontSize: '1.1rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Find a Doctor
                    </Button>
                  </Stack>
                </MotionBox>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── QUICK SERVICES - Hidden for Practitioners ──────────────────────── */}
      {user?.role !== 'practitioner' && (
        <Container maxWidth="lg" sx={{ mt: -6, position: 'relative', zIndex: 10 }}>
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

      {/* ─── FEATURES SECTION ───────────────────────────────────────────── */}
      <Box sx={{ py: 12 }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{
                  position: 'absolute', top: -20, left: -20, right: 20, bottom: 20,
                  bgcolor: 'secondary.light', borderRadius: 6, opacity: 0.1, zIndex: 0
                }} />
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1584982324674-9dc4bb22340c?auto=format&fit=crop&q=80&w=1000"
                  alt="Healthcare professional providing care"
                  sx={{ 
                    width: '100%', 
                    height: { xs: 300, md: 500 },
                    objectFit: 'cover',
                    borderRadius: 4, 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
                    position: 'relative', 
                    zIndex: 1 
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="overline" color="secondary.main" fontWeight={800} letterSpacing={2}>
                ABOUT BEYOND5
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, mb: 3 }}>
                The Future of Healthcare Access in Australia
              </Typography>
              <Typography color="text.secondary" paragraph sx={{ fontSize: '1.1rem', mb: 4 }}>
                We bridge the gap between traditional healthcare hours and your actual life.
                Our platform connects you with verified practitioners who specialize in after-hours
                care, weekend support, and telehealth services.
              </Typography>

              <Stack spacing={3}>
                {[
                  { title: 'AHPRA Verified Professionals', desc: 'Every practitioner undergoes rigorous compliance checks.' },
                  { title: 'Nationwide Telehealth', desc: 'Access specialists from any corner of Australia.' },
                  { title: 'Transparent Booking', desc: 'No hidden fees, instant confirmations, and clear pricing.' },
                ].map((item) => (
                  <Stack key={item.title} direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ color: 'secondary.main', mt: 0.5 }}>
                      <CheckCircle />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>

              <Button
                variant="contained"
                size="large"
                sx={{ mt: 6, py: 2, px: 6, borderRadius: '50px' }}
                onClick={() => navigate('/marketplace')}
              >
                Learn More About Us
              </Button>
            </Grid>
          </Grid>
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

      {/* ─── CALL TO ACTION ─────────────────────────────────────────────── */}
      <Box sx={{ py: 15, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ mb: 3 }}>Ready to experience better care?</Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 6, fontWeight: 400 }}>
            Join Beyond5 today and get access to top-tier medical professionals on your terms.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            {!user ? (
              <>
                <Button 
                  variant="contained" color="secondary" size="large" 
                  sx={{ borderRadius: '50px', px: 6, py: 2 }}
                  onClick={() => navigate('/register')}
                >
                  Book an Appointment
                </Button>
                <Button 
                  variant="outlined" color="primary" size="large"
                  sx={{ borderRadius: '50px', px: 6, py: 2 }}
                  onClick={() => navigate('/register?role=practitioner')}
                >
                  Join as a Practitioner
                </Button>
              </>
            ) : (
              <Button 
                variant="contained" color="primary" size="large" 
                sx={{ borderRadius: '50px', px: 6, py: 2 }}
                onClick={() => navigate('/dashboard')}
              >
                Go to My Dashboard
              </Button>
            )}
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
