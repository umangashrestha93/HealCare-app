import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  Avatar, Chip, Stack, Divider, Button, List, ListItem,
  ListItemText, ListItemAvatar, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  CalendarMonth, Person, History, Verified,
  Notifications, Settings, VideoCameraFront,
  Cancel, Replay, MoreVert
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { cancelAppointment } from '../store/slices/bookingSlice';
import PractitionerDashboard from './PractitionerDashboard';
import AdminDashboard from './AdminDashboard';

const MotionCard = motion(Card);

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { appointments } = useSelector(state => state.booking);
  const [cancelId, setCancelId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  // Role-based Dashboard Delegation
  if (user.role === 'practitioner') {
    return <PractitionerDashboard />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  const isPractitioner = false; // Always false here as practitioners are handled above

  const stats = isPractitioner ? [
    { label: 'Upcoming sessions', value: '4', icon: <CalendarMonth />, color: '#004a99' },
    { label: 'Profile views', value: '128', icon: <History />, color: '#22c55e' },
    { label: 'Pending reviews', value: '2', icon: <History />, color: '#ea580c' },
  ] : [
    { label: 'Upcoming sessions', value: appointments.length.toString(), icon: <CalendarMonth />, color: '#004a99' },
    { label: 'Past bookings', value: '8', icon: <History />, color: '#22c55e' },
    { label: 'Saved specialists', value: '5', icon: <Person />, color: '#ea580c' },
  ];

  const handleCancel = () => {
    dispatch(cancelAppointment(cancelId));
    setCancelId(null);
  };

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            <Avatar
              sx={{
                width: 80, height: 80,
                bgcolor: isPractitioner ? 'secondary.main' : 'primary.main',
                fontSize: '2rem', fontWeight: 800
              }}
            >
              {user.firstName ? user.firstName[0] : 'U'}
            </Avatar>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography variant="h3" fontWeight={800}>Hello, {user.firstName}!</Typography>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} sx={{ mt: 1 }}>
                <Chip label={isPractitioner ? 'Practitioner' : 'Client Account'} size="small" color={isPractitioner ? 'secondary' : 'primary'} />
                <Typography variant="body2" color="text.secondary">• {user.location || 'Melbourne, VIC'}</Typography>
              </Stack>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="outlined" startIcon={<Settings />} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              Settings
            </Button>
          </Stack>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {stats.map((s, i) => (
            <Grid item xs={12} sm={4} key={s.label}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 2,
                    bgcolor: `${s.color}1a`, color: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2.5
                  }}>
                    {s.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>{s.value}</Typography>
                    <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Upcoming Appointments</Typography>
            <Stack spacing={2}>
              {appointments.length > 0 ? appointments.map((app) => (
                <Paper key={app.id} variant="outlined" sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Grid container alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'secondary.light' }}><VideoCameraFront /></Avatar>
                        <Box>
                          <Typography fontWeight={800}>{app.practitionerName}</Typography>
                          <Typography variant="body2" color="text.secondary">{app.discipline} • {app.type}</Typography>
                          <Typography variant="body2" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>
                            {app.date} at {app.time}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' }, mt: { xs: 2, sm: 0 } }}>
                      <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                        <Button
                          size="small" variant="outlined" startIcon={<Replay />}
                          onClick={() => navigate(`/booking?practitioner=1`)}
                          aria-label="Reschedule Appointment"
                        >
                          Reschedule
                        </Button>
                        <Button
                          size="small" variant="text" color="error" startIcon={<Cancel />}
                          onClick={() => setCancelId(app.id)}
                          aria-label="Cancel Appointment"
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              )) : (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#f8fafc' }}>
                  <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">No upcoming sessions found.</Typography>
                  <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/marketplace')}>Browse Specialists</Button>
                </Paper>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Notifications</Typography>
            <Paper variant="outlined" sx={{ borderRadius: 4, p: 2 }}>
              <List disablePadding>
                <ListItem sx={{ px: 1 }}>
                  <ListItemAvatar><Avatar sx={{ bgcolor: 'secondary.light' }}><Verified /></Avatar></ListItemAvatar>
                  <ListItemText primary="Verification Success" secondary="Your account is fully verified." />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelId} onClose={() => setCancelId(null)}>
        <DialogTitle fontWeight={800}>Cancel Appointment?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to cancel this session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCancelId(null)}>No, Keep it</Button>
          <Button variant="contained" color="error" onClick={handleCancel}>Yes, Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
