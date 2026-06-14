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
  Dialog,
  DialogContent,
  Divider,
  Fade,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  ArrowBackIos,
  ArrowForwardIos,
  Cake,
  CalendarMonth,
  Cancel,
  CheckCircle,
  Close,
  Collections,
  HealthAndSafety,
  Language,
  LocationOn,
  MedicalServices,
  Payments,
  Verified,
  Videocam,
  Wc,
  ZoomIn,
} from '@mui/icons-material';
import { clientService } from '../services/api';
import { MOCK_PRACTITIONERS } from '../utils/mockData';

const getFullName = (p) => p.name || `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`.trim() || 'Beyond5 practitioner';
const getAvatar = (p) => p.avatar || p.image || p.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p._id || p.id}`;
const getLocation = (p) => p.location || p.userId?.location || 'Location available on profile';
const getFunding = (p) => Array.isArray(p.fundingOptions) && p.fundingOptions.length ? p.fundingOptions : [];
const getAge = (p) => p.age || p.userId?.age || null;
const getPhotos = (p) => Array.isArray(p.photos) && p.photos.length ? p.photos : [];

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

/* ─── Photo Lightbox ─── */
const PhotoLightbox = ({ photos, open, initialIndex, onClose }) => {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    setCurrent(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') setCurrent((i) => (i + 1) % photos.length);
      if (e.key === 'ArrowLeft') setCurrent((i) => (i - 1 + photos.length) % photos.length);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, photos.length, onClose]);

  const prev = () => setCurrent((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setCurrent((i) => (i + 1) % photos.length);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0,0,0,0.95)',
          boxShadow: 'none',
          borderRadius: 3,
          overflow: 'hidden',
          maxWidth: '90vw',
          maxHeight: '92vh',
          width: 'auto',
          m: 1,
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: { xs: '80vw', md: '60vw' }, minHeight: 300 }}>
        {/* Close */}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10, color: '#fff', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
        >
          <Close />
        </IconButton>

        {/* Counter */}
        <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, bgcolor: 'rgba(0,0,0,0.55)', borderRadius: 5, px: 2, py: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>{current + 1} / {photos.length}</Typography>
        </Box>

        {/* Prev */}
        {photos.length > 1 && (
          <IconButton
            onClick={prev}
            sx={{ position: 'absolute', left: 12, zIndex: 10, color: '#fff', bgcolor: 'rgba(0,0,0,0.45)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }, width: 44, height: 44 }}
          >
            <ArrowBackIos sx={{ fontSize: 20, ml: 0.5 }} />
          </IconButton>
        )}

        {/* Image */}
        <Fade in key={current} timeout={280}>
          <Box
            component="img"
            src={photos[current]}
            alt={`Photo ${current + 1}`}
            sx={{ maxWidth: '85vw', maxHeight: '82vh', objectFit: 'contain', display: 'block', borderRadius: 1 }}
          />
        </Fade>

        {/* Next */}
        {photos.length > 1 && (
          <IconButton
            onClick={next}
            sx={{ position: 'absolute', right: 12, zIndex: 10, color: '#fff', bgcolor: 'rgba(0,0,0,0.45)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }, width: 44, height: 44 }}
          >
            <ArrowForwardIos sx={{ fontSize: 20 }} />
          </IconButton>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: 'absolute',
              bottom: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: 3,
              px: 1.5,
              py: 1,
              zIndex: 10,
            }}
          >
            {photos.map((src, i) => (
              <Box
                key={i}
                component="img"
                src={src}
                onClick={() => setCurrent(i)}
                sx={{
                  width: 44,
                  height: 44,
                  objectFit: 'cover',
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: i === current ? '2px solid #41C6C6' : '2px solid transparent',
                  opacity: i === current ? 1 : 0.55,
                  transition: 'all 0.2s',
                  '&:hover': { opacity: 1 },
                }}
              />
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ─── Photo Gallery Grid ─── */
const PhotoGallery = ({ photos }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  const open = (i) => { setLightboxIndex(i); setLightboxOpen(true); };
  const close = () => setLightboxOpen(false);

  // Layout: first photo large, rest smaller
  const [first, ...rest] = photos;

  return (
    <>
      <Paper
        elevation={0}
        sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#fff' }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.light', color: 'primary.main' }}>
            <Collections sx={{ fontSize: 18 }} />
          </Avatar>
          <Typography variant="subtitle1" fontWeight={900}>Photos & Portfolio</Typography>
          <Chip label={`${photos.length} photo${photos.length > 1 ? 's' : ''}`} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(65,198,198,0.1)', color: 'secondary.main' }} />
        </Stack>

        {/* Grid Layout */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: photos.length === 1
              ? '1fr'
              : photos.length <= 3
              ? 'repeat(auto-fill, minmax(140px, 1fr))'
              : { xs: '1fr 1fr', sm: '2fr 1fr 1fr' },
            gridTemplateRows: photos.length >= 4 ? { sm: '200px 200px' } : 'auto',
            gap: 1.5,
          }}
        >
          {/* First photo — large hero */}
          <Tooltip title="View photo" placement="top">
            <Box
              onClick={() => open(0)}
              sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
                gridRow: photos.length >= 4 ? { sm: '1 / 3' } : 'auto',
                aspectRatio: photos.length === 1 ? '16/9' : undefined,
                '&:hover .zoom-overlay': { opacity: 1 },
                '&:hover img': { transform: 'scale(1.04)' },
              }}
            >
              <Box
                component="img"
                src={first}
                alt="Portfolio photo 1"
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s ease' }}
              />
              <Box
                className="zoom-overlay"
                sx={{
                  position: 'absolute', inset: 0,
                  bgcolor: 'rgba(0,0,0,0.28)',
                  opacity: 0, transition: 'opacity 0.25s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ZoomIn sx={{ color: '#fff', fontSize: 36 }} />
              </Box>
            </Box>
          </Tooltip>

          {/* Remaining photos */}
          {rest.map((src, i) => {
            const isLast = i === rest.length - 1 && photos.length > 7;
            return (
              <Tooltip key={i} title="View photo" placement="top">
                <Box
                  onClick={() => open(i + 1)}
                  sx={{
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    aspectRatio: '4/3',
                    '&:hover .zoom-overlay': { opacity: 1 },
                    '&:hover img': { transform: 'scale(1.05)' },
                  }}
                >
                  <Box
                    component="img"
                    src={src}
                    alt={`Portfolio photo ${i + 2}`}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s ease' }}
                  />
                  <Box
                    className="zoom-overlay"
                    sx={{
                      position: 'absolute', inset: 0,
                      bgcolor: isLast ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.25)',
                      opacity: isLast ? 1 : 0, transition: 'opacity 0.25s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {isLast
                      ? <Typography variant="h6" fontWeight={900} sx={{ color: '#fff' }}>+{photos.length - 7} more</Typography>
                      : <ZoomIn sx={{ color: '#fff', fontSize: 28 }} />
                    }
                  </Box>
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
          Click any photo to view full size. Use arrow keys or thumbnails to navigate.
        </Typography>
      </Paper>

      <PhotoLightbox
        photos={photos}
        open={lightboxOpen}
        initialIndex={lightboxIndex}
        onClose={close}
      />
    </>
  );
};

/* ─── Main Component ─── */
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

  const age = getAge(practitioner);
  const photos = getPhotos(practitioner);

  return (
    <Box sx={{ bgcolor: '#F7FBFB', minHeight: '100vh', pb: 8 }}>
      {/* ── Hero Header ── */}
      <Box sx={{ bgcolor: '#0B1D2B', color: '#fff', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/marketplace')} sx={{ color: '#BDE7E6', mb: 3, px: 0 }}>
            Back to search results
          </Button>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Avatar src={getAvatar(practitioner)} sx={{ width: 132, height: 132, border: '4px solid rgba(189,231,230,0.55)' }} />
            <Box sx={{ flex: 1 }}>
              {/* Chips row */}
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1.5, gap: 0.75 }}>
                {practitioner.verificationStatus === 'approved' && (
                  <Chip icon={<Verified />} label="Verified Practitioner" color="secondary" sx={{ fontWeight: 900 }} />
                )}
                {practitioner.gender && (
                  <Chip
                    icon={<Wc sx={{ fontSize: 16 }} />}
                    label={practitioner.gender}
                    sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', '& .MuiChip-icon': { color: '#BDE7E6' } }}
                  />
                )}
                {age && (
                  <Chip
                    icon={<Cake sx={{ fontSize: 16 }} />}
                    label={`Age ${age}`}
                    sx={{ bgcolor: 'rgba(65,198,198,0.18)', color: '#BDE7E6', fontWeight: 700, '& .MuiChip-icon': { color: '#BDE7E6' } }}
                  />
                )}
                {photos.length > 0 && (
                  <Chip
                    icon={<Collections sx={{ fontSize: 16 }} />}
                    label={`${photos.length} photos`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', '& .MuiChip-icon': { color: 'rgba(255,255,255,0.6)' } }}
                  />
                )}
              </Stack>

              <Typography variant="h2" sx={{ color: '#fff', fontWeight: 900, mb: 0.75, fontSize: { xs: '2rem', md: '2.75rem' } }}>
                {getFullName(practitioner)}
              </Typography>
              <Typography variant="h6" sx={{ color: '#BDE7E6', fontWeight: 800 }}>{practitioner.discipline}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', mt: 1.5, maxWidth: 760, lineHeight: 1.7 }}>
                {practitioner.bio || 'A Beyond5 practitioner offering warm, practical allied health support around real-life schedules and access needs.'}
              </Typography>
            </Box>

            {/* Booking card */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff', color: 'primary.main', width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={900}>NEXT AVAILABLE</Typography>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{practitioner.nextAvailable}</Typography>
              {practitioner.fee && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f0fafa', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>CONSULTATION FEE</Typography>
                  <Typography variant="h5" fontWeight={900} color="secondary.main">${practitioner.fee}</Typography>
                  <Typography variant="caption" color="text.disabled">per session</Typography>
                </Box>
              )}
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

      {/* ── Body ── */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.35fr 0.9fr' }, gap: 3 }}>
          {/* LEFT column */}
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

            {/* Photo Gallery — only shown if there are photos */}
            {photos.length > 0 && <PhotoGallery photos={photos} />}
          </Stack>

          {/* RIGHT column */}
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
                {getFunding(practitioner).length > 0
                  ? getFunding(practitioner).map((fund) => <Chip key={fund} label={fund} color="secondary" />)
                  : <Typography color="text.disabled" variant="body2">Contact practitioner for funding details.</Typography>
                }
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
