import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  Avatar, Chip, Stack, Divider, Button, List, ListItem,
  ListItemText, ListItemAvatar, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, TextField, Rating
} from '@mui/material';
import {
  CalendarMonth, Person, History,
  Notifications, VideoCameraFront,
  Cancel, Replay, MoreVert, Message, Star
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { bookingService, reviewService } from '../services/api';
import PractitionerDashboard from './PractitionerDashboard';
import AdminDashboard from './AdminDashboard';
import PractitionerRecommendations from '../components/recommendations/PractitionerRecommendations';

const MotionCard = motion.create(Card);

const Dashboard = () => {
  const navigate = useNavigate();
  const { role: urlRole } = useParams();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState(null);
  
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (user && urlRole && user.role !== urlRole) {
      navigate(`/dashboard/${user.role}`, { replace: true });
    }
    if (user && !urlRole) {
      navigate(`/dashboard/${user.role}`, { replace: true });
    }
  }, [user, urlRole, navigate]);

  useEffect(() => {
    if (user && user.role === 'client') {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getBookings();
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await bookingService.cancelBooking(cancelId);
      setAppointments(prev => prev.filter(a => a._id !== cancelId));
      setCancelId(null);
    } catch (err) {
      console.error('Cancellation failed', err);
    }
  };

  const handleOpenRating = (booking) => {
    setSelectedBooking(booking);
    setRatingOpen(true);
  };

  const handleCloseRating = () => {
    setRatingOpen(false);
    setSelectedBooking(null);
    setRatingValue(5);
    setRatingComment('');
  };

  const handleSubmitRating = async () => {
    if (!selectedBooking) return;
    try {
      setSubmittingRating(true);
      await reviewService.createReview({
        bookingId: selectedBooking._id,
        rating: ratingValue,
        comment: ratingComment
      });
      setAppointments(prev => prev.map(a => a._id === selectedBooking._id ? { ...a, isRated: true } : a));
      handleCloseRating();
    } catch (err) {
      console.error('Rating submission failed', err);
      alert(err || 'Failed to submit rating. You might have already rated this booking.');
      handleCloseRating();
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!user) return null;

  if (user.role === 'practitioner') {
    return <PractitionerDashboard />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  const upcoming = appointments.filter(a => new Date(a.appointmentDate) >= new Date().setHours(0,0,0,0));
  const past = appointments.filter(a => new Date(a.appointmentDate) < new Date().setHours(0,0,0,0));

  const stats = [
    { label: 'Upcoming sessions', value: upcoming.length.toString(), icon: <CalendarMonth />, color: '#004a99' },
    { label: 'Past sessions', value: past.length.toString(), icon: <History />, color: '#ea580c' },
    { label: 'Care access', value: '24/7', icon: <Person />, color: '#22c55e' },
  ];

  const renderStats = () => {
    return (
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={4} key={stat.label}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              sx={{ borderRadius: 4, overflow: 'hidden' }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    bgcolor: `${stat.color}1a`,
                    color: stat.color,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={900}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>
    )
  }

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <Box sx={{ maxWidth: { xs: '100%', md: '58%' } }}>
              <Typography variant="h3" fontWeight={900} gutterBottom>
                Welcome back, {user.firstName}.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, lineHeight: 1.8 }}>
                Manage all your care from one place. Check your next booking, connect with trusted specialists, and keep your wellness goals on track.
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: 'wrap' }}>
                <Chip label="Verified member" color="success" />
                <Chip label={user.location || 'Melbourne, VIC'} />
                <Chip label="24/7 care access" />
              </Stack>
            </Box>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={() => navigate('/marketplace')}
                sx={{ minWidth: 150, borderRadius: 3, fontWeight: 700 }}
              >
                Book a session
              </Button>
            </Stack>
          </Stack>
        </Box>

        {renderStats()}

        <PractitionerRecommendations />

        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
              <Typography variant="h5" fontWeight={900} gutterBottom>
                Upcoming Appointments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Stay on top of your next care sessions and prepare for every appointment.
              </Typography>

              <Stack spacing={2}>
                {loading ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
                ) : upcoming.length > 0 ? (
                  upcoming.map((app) => (
                    <Paper
                      key={app._id}
                      variant="outlined"
                      sx={{ p: 3, borderRadius: 4, borderColor: 'transparent', bgcolor: 'background.paper' }}
                    >
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} sm={8}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                              <VideoCameraFront />
                            </Avatar>
                            <Box>
                              <Typography fontWeight={800}>
                                {app.practitionerId?.userId?.firstName} {app.practitionerId?.userId?.lastName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {app.practitionerId?.discipline} • {app.serviceType}
                              </Typography>
                              <Typography variant="body2" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>
                                {new Date(app.appointmentDate).toLocaleDateString()} at {app.startTime}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent={{ sm: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Message />}
                              onClick={() => navigate('/chat', { state: { recipient: app.practitionerId.userId } })}
                            >
                              Chat
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => setCancelId(app._id)}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: '#f8fafc', border: '1px dashed', borderColor: 'divider' }}>
                    <Typography color="text.secondary">No upcoming appointments.</Typography>
                  </Paper>
                )}
              </Stack>

              <Typography variant="h5" fontWeight={900} sx={{ mt: 6, mb: 1 }}>
                Past Appointments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review your history and rate your experience with practitioners.
              </Typography>

              <Stack spacing={2}>
                {past.length > 0 ? (
                  past.map((app) => (
                    <Paper
                      key={app._id}
                      variant="outlined"
                      sx={{ p: 3, borderRadius: 4, borderColor: 'transparent', bgcolor: 'background.paper' }}
                    >
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} sm={8}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar src={`https://api.dicebear.com/7.x/initials/svg?seed=${app.practitionerId?.userId?.firstName}`} />
                            <Box>
                              <Typography fontWeight={800}>
                                {app.practitionerId?.userId?.firstName} {app.practitionerId?.userId?.lastName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {app.practitionerId?.discipline} • Completed on {new Date(app.appointmentDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                          {app.isRated ? (
                            <Chip label="Rated" color="success" size="small" icon={<Star />} />
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              color="secondary"
                              startIcon={<Star />}
                              onClick={() => handleOpenRating(app)}
                            >
                              Rate Now
                            </Button>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No past history found.</Typography>
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <MotionCard sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider', mb: 4, bgcolor: '#fff' }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
                Platform Features
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Communicate directly with your practitioners and share feedback to improve the community.
              </Typography>
              <Button 
                fullWidth 
                variant="contained" 
                startIcon={<Message />} 
                onClick={() => navigate('/chat')}
                sx={{ mb: 2, borderRadius: 2, py: 1.2 }}
              >
                Open Chat Hub
              </Button>
              <Divider sx={{ my: 2 }} />
              <Chip label="Coming soon: Care Plans" color="primary" variant="outlined" sx={{ mb: 1, width: '100%' }} />
              <Chip label="Coming soon: Prescriptions" color="primary" variant="outlined" sx={{ width: '100%' }} />
            </MotionCard>
          </Grid>
        </Grid>
      </Container>

      {/* Cancel Confirmation */}
      <Dialog open={!!cancelId} onClose={() => setCancelId(null)}>
        <DialogTitle fontWeight={800}>Cancel Appointment?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to cancel this session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCancelId(null)}>No, Keep it</Button>
          <Button variant="contained" color="error" onClick={handleCancel}>
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingOpen} onClose={handleCloseRating} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={800}>Rate your experience</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              How was your session with <strong>{selectedBooking?.practitionerId?.userId?.firstName}</strong>?
            </Typography>
            <Rating
              value={ratingValue}
              onChange={(event, newValue) => setRatingValue(newValue)}
              size="large"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Leave a comment (optional)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseRating} disabled={submittingRating}>Cancel</Button>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleSubmitRating}
            disabled={submittingRating}
            startIcon={submittingRating ? <CircularProgress size={16} /> : <Star />}
          >
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
