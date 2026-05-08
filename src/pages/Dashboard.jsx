import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  Avatar, Chip, Stack, Divider, Button, List, ListItem,
  ListItemText, ListItemAvatar, Paper, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  CalendarMonth, Person, History,
  Notifications, VideoCameraFront,
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
  const { appointments } = useSelector((state) => state.booking);
  const [cancelId, setCancelId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

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

  const quickActions = [
    { label: 'Book a session', action: () => navigate('/marketplace'), variant: 'contained' },
    { label: 'View care history', action: () => navigate('/dashboard'), variant: 'outlined' },
  ];

  const recommendations = [
    { name: 'Dr. Laura Miles', specialty: 'Physiotherapy', status: 'Available' },
    { name: 'Emma Patel', specialty: 'Occupational Therapy', status: 'Next free in 2h' },
    { name: 'Ian Brooke', specialty: 'Psychology', status: 'Fully booked' },
  ];

  const activityFeed = [
    { title: 'Booked follow-up session', details: 'with Dr. Laura Miles on 12 May', time: '5m ago' },
    { title: 'Received care plan update', details: 'Your physiotherapy plan was adjusted.', time: '1h ago' },
    { title: 'Message from practitioner', details: 'Review your new session notes.', time: 'Yesterday' },
  ];

  const handleCancel = () => {
    dispatch(cancelAppointment(cancelId));
    setCancelId(null);
  };

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
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  onClick={action.action}
                  sx={{ minWidth: 150, borderRadius: 3, fontWeight: 700 }}
                >
                  {action.label}
                </Button>
              ))}
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
                <Button variant="outlined" startIcon={<MoreVert />}>
                  Manage
                </Button>
              </Stack>

              <Stack spacing={2}>
                {appointments.length > 0 ? (
                  appointments.map((app) => (
                    <Paper
                      key={app.id}
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
                              <Typography fontWeight={800}>{app.practitionerName}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {app.discipline} • {app.type}
                              </Typography>
                              <Typography variant="body2" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>
                                {app.date} at {app.time}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent={{ sm: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Replay />}
                              onClick={() => navigate('/booking')}
                            >
                              Reschedule
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => setCancelId(app.id)}
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

            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={900}>
                  Your Care Routine
                </Typography>
                <Chip label="In progress" color="secondary" />
              </Stack>
              <List disablePadding>
                {[
                  { name: 'Morning stretching', status: 'Complete' },
                  { name: 'Hydration goal', status: 'Pending' },
                  { name: 'Medication reminder', status: 'Due today' },
                ].map((item, idx) => (
                  <Box key={item.name}>
                    <ListItem sx={{ py: 2, px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: idx === 0 ? 'primary.light' : 'secondary.light' }}>
                          {idx + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography fontWeight={800}>{item.name}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{item.status}</Typography>}
                      />
                    </ListItem>
                    {idx < 2 && <Divider />}
                  </Box>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <MotionCard sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
                Recommended Practitioners
              </Typography>
              <Stack spacing={2}>
                {recommendations.map((provider) => (
                  <Paper key={provider.name} variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0284c7' }}>
                        {provider.name.split(' ').map((n) => n[0]).join('')}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography fontWeight={800}>{provider.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {provider.specialty}
                        </Typography>
                      </Box>
                      <Chip label={provider.status} size="small" />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </MotionCard>

            <MotionCard sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={900}>
                  Quick Actions
                </Typography>
                {['Review care summary', 'Manage alerts', 'Contact support'].map((item) => (
                  <Button key={item} variant="outlined" fullWidth sx={{ justifyContent: 'flex-start', borderRadius: 3, py: 1.5 }}>
                    {item}
                  </Button>
                ))}
              </Stack>
            </MotionCard>
          </Grid>
        </Grid>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={7}>
            <MotionCard sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 3 }}>
                Recent Activity
              </Typography>
              <List disablePadding>
                {activityFeed.map((item, index) => (
                  <Box key={item.title}>
                    <ListItem sx={{ py: 2, px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                          <Notifications />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography fontWeight={800}>{item.title}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{item.details}</Typography>}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {item.time}
                      </Typography>
                    </ListItem>
                    {index < activityFeed.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </MotionCard>
          </Grid>

          <Grid item xs={12} md={5}>
            <MotionCard sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={900}>
                  Care Circle
                </Typography>
                <Chip label="Trusted team" color="secondary" />
              </Stack>
              <Stack spacing={2}>
                {[
                  { name: 'Jasmine Lane', role: 'Support Coordinator' },
                  { name: 'Dr. Laura Miles', role: 'Lead Physiotherapist' },
                ].map((member) => (
                  <Paper key={member.name} variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar>{member.name[0]}</Avatar>
                      <Box>
                        <Typography fontWeight={800}>{member.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{member.role}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
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
