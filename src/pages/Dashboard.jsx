import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  Avatar, Chip, Stack, Divider, Button, List, ListItem,
  ListItemText, ListItemAvatar, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress
} from '@mui/material';
import {
  CalendarMonth, Person, History,
  Notifications, VideoCameraFront,
  Cancel, Replay, MoreVert
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/api';
import PractitionerDashboard from './PractitionerDashboard';
import AdminDashboard from './AdminDashboard';

const MotionCard = motion(Card);

const Dashboard = () => {
  const navigate = useNavigate();
  const { role: urlRole } = useParams();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState(null);

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

  if (!user) return null;

  if (user.role === 'practitioner') {
    return <PractitionerDashboard />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  const stats = [
    { label: 'Upcoming sessions', value: appointments.length.toString(), icon: <CalendarMonth />, color: '#004a99' },
    { label: 'Saved specialists', value: '5', icon: <Person />, color: '#22c55e' },
    { label: 'Care moments tracked', value: '18', icon: <History />, color: '#ea580c' },
  ];

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

        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h5" fontWeight={900} gutterBottom>
                    Upcoming Appointments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stay on top of your next care sessions and prepare for every appointment.
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2}>
                {loading ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
                ) : appointments.length > 0 ? (
                  appointments.map((app) => (
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
                  <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#f8fafc' }}>
                    <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">You have no scheduled appointments right now.</Typography>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/marketplace')}>
                      Find specialists
                    </Button>
                  </Paper>
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <MotionCard sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
                Platform Features
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your care moments and health tracking modules are currently being synchronized with our clinical systems.
              </Typography>
              <Chip label="Coming soon: Care Plans" color="primary" variant="outlined" sx={{ mb: 1, width: '100%' }} />
              <Chip label="Coming soon: Chat" color="primary" variant="outlined" sx={{ width: '100%' }} />
            </MotionCard>
          </Grid>
        </Grid>
      </Container>

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
    </Box>
  );
};

export default Dashboard;
