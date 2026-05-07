import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Paper,
  Avatar, Chip, Stack, Button, List, ListItem,
  ListItemText, ListItemAvatar, Divider, LinearProgress,
  IconButton, Card, CardContent, TextField, Switch, FormControlLabel,
  Snackbar, Alert, Badge, CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment,
  CalendarMonth,
  Message,
  Settings,
  Verified,
  PendingActions,
  TrendingUp,
  Notifications,
  CloudUpload,
  AccessTime,
  CheckCircle,
  Warning,
  VideoCameraFront,
  LocationOn,
  Send,
  MoreVert,
  AttachMoney,
  Star,
  Schedule,
  Person
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const MotionBox = motion(Box);

const PractitionerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Handle Auth redirection in useEffect to avoid bad setState in render
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // ─── STATE MANAGEMENT ───────────────────────────────────────────────

  const [documents, setDocuments] = useState([
    { id: 'ahpra', name: 'AHPRA Registration', status: 'Approved', expiry: '2027-01-01', description: 'Medical board registration.' },
    { id: 'insurance', name: 'Professional Indemnity', status: 'Pending', expiry: '2026-06-15', description: 'Mandatory insurance cover.' },
    { id: 'wwcc', name: 'Working with Children', status: 'Missing', expiry: null, description: 'Required for pediatric services.' },
  ]);

  const [availability, setAvailability] = useState({
    'Monday': ['5:00 PM', '6:00 PM', '7:00 PM'],
    'Wednesday': ['6:00 PM', '8:00 PM'],
    'Saturday': ['10:00 AM', '11:00 AM', '2:00 PM'],
  });

  const [profile, setProfile] = useState({
    discipline: 'Physiotherapy',
    specialization: 'Sports Rehab, Orthopedics',
    bio: 'Dedicated physiotherapist with 10+ years experience in after-hours acute care.',
    telehealth: true,
    inPerson: true,
  });

  const [messages] = useState([
    { id: 1, sender: 'Alice Cooper', text: 'Hi Dr. Sarah, can we move our session to 7pm?', time: '2m ago', active: true },
    { id: 2, sender: 'John Doe', text: 'Thank you for the session today!', time: '1h ago', active: false },
  ]);

  const complianceProgress = (documents.filter(d => d.status === 'Approved').length / documents.length) * 100;

  // ─── HANDLERS ───────────────────────────────────────────────────────

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleSaveProfile = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Profile updated successfully!');
    }, 800);
  };

  const handleUpload = (id) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'Pending' } : d));
    showToast(`Document uploaded and pending review.`);
  };

  const toggleSlot = (day, time) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      const newSlots = daySlots.includes(time)
        ? daySlots.filter(t => t !== time)
        : [...daySlots, time];
      return { ...prev, [day]: newSlots };
    });
  };

  if (!user) return null;

  // ─── SECTIONS ───────────────────────────────────────────────────────

  const Overview = () => (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>Practitioner Hub</Typography>
        <Typography variant="body1" color="text.secondary">Welcome back, {user?.firstName}. You have 2 sessions today.</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Practice Performance</Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Booking Rate', value: '92%', trend: '+4%', icon: <TrendingUp />, color: '#004a99' },
              { label: 'Total Earnings', value: '$4,250', trend: 'This month', icon: <AttachMoney />, color: '#16a34a' },
              { label: 'Avg. Rating', value: '4.9', trend: '48 reviews', icon: <Star />, color: '#ea580c' },
            ].map((stat, i) => (
              <Grid item xs={12} sm={4} key={i}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${stat.color}1a`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={900}>{stat.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" fontWeight={800} sx={{ mt: 5, mb: 2 }}>Upcoming Sessions Today</Typography>
          <Stack spacing={2}>
            {[
              { name: 'Alice Cooper', time: '6:00 PM', type: 'Telehealth' },
              { name: 'Tom Hardy', time: '7:30 PM', type: 'In-Person' },
            ].map((session, i) => (
              <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: 'primary.main', bgcolor: '#f8fafc' }, transition: '0.2s' }}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar src={`https://i.pravatar.cc/150?u=${session.name}`} />
                      <Box>
                        <Typography fontWeight={800}>{session.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 14 }} /> {session.time} • {session.type}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                    <Button variant="outlined" size="small" sx={{ mr: 1 }}>Details</Button>
                    <Button variant="contained" color="secondary" size="small">Join Call</Button>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ borderRadius: 4, bgcolor: 'primary.main', color: '#fff', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>Compliance Health</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>Maintain 100% verification to maximize your profile visibility.</Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                <CircularProgress variant="determinate" value={complianceProgress} size={80} thickness={6} sx={{ color: 'secondary.main' }} />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" component="div" color="inherit" fontWeight={800}>{Math.round(complianceProgress)}%</Typography>
                </Box>
              </Box>
              <Button variant="contained" color="secondary" fullWidth sx={{ fontWeight: 800, borderRadius: 2 }} onClick={() => setActiveTab(1)}>Fix Issues</Button>
            </CardContent>
          </Card>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>QUICK ACTIONS</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1}>
              <Button variant="text" fullWidth sx={{ justifyContent: 'flex-start', color: 'text.primary', fontWeight: 600 }} startIcon={<Schedule />}>Update Slots</Button>
              <Button variant="text" fullWidth sx={{ justifyContent: 'flex-start', color: 'text.primary', fontWeight: 600 }} startIcon={<AttachMoney />}>View Invoices</Button>
              <Button variant="text" fullWidth sx={{ justifyContent: 'flex-start', color: 'text.primary', fontWeight: 600 }} startIcon={<Verified />}>Profile Badge</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const Compliance = () => (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>Compliance Hub</Typography>
      <Alert severity={complianceProgress < 100 ? "warning" : "success"} sx={{ mb: 4, borderRadius: 3 }}>
        {complianceProgress < 100 ? "Action Required: Please upload missing documents to achieve full verification." : "Compliance Met: Your profile is fully verified and active."}
      </Alert>

      <Stack spacing={2}>
        {documents.map((doc) => (
          <Paper key={doc.id} variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
            <Grid container alignItems="center" spacing={3}>
              <Grid item>
                <Avatar sx={{
                  bgcolor: doc.status === 'Approved' ? 'success.light' : doc.status === 'Pending' ? 'warning.light' : 'error.light',
                  width: 56, height: 56
                }}>
                  {doc.status === 'Approved' ? <CheckCircle /> : doc.status === 'Pending' ? <PendingActions /> : <Warning />}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h6" fontWeight={800}>{doc.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{doc.description}</Typography>
                <Chip label={doc.status} size="small" color={doc.status === 'Approved' ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
              </Grid>
              <Grid item xs={12} sm="auto" sx={{ textAlign: { sm: 'right' } }}>
                {doc.expiry && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">EXPIRY DATE</Typography>
                    <Typography variant="body2" fontWeight={700}>{doc.expiry}</Typography>
                  </Box>
                )}
                <Button variant="contained" startIcon={<CloudUpload />} onClick={() => handleUpload(doc.id)} size="small">
                  {doc.status === 'Missing' ? 'Upload Now' : 'Update'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );

  const AvailabilitySection = () => (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>Clinic Availability</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>Manage your active booking slots. All times are in AEST.</Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <Box key={day} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>{day}</Typography>
                <Grid container spacing={1}>
                  {['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'].map((time) => {
                    const isActive = availability[day]?.includes(time);
                    return (
                      <Grid item xs={4} sm={2.4} key={time}>
                        <Button
                          fullWidth
                          variant={isActive ? 'contained' : 'outlined'}
                          color={isActive ? 'primary' : 'inherit'}
                          onClick={() => toggleSlot(day, time)}
                          sx={{
                            borderRadius: 2, py: 1.2, fontWeight: 700, fontSize: '0.8rem',
                            borderColor: 'divider',
                            transition: 'all 0.2s'
                          }}
                        >
                          {time}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>
                <Divider sx={{ mt: 3 }} />
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 100 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Practice Settings</Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControlLabel control={<Switch checked={profile.telehealth} onChange={(e) => setProfile(prev => ({ ...prev, telehealth: e.target.checked }))} />} label="Accept Telehealth" />
              <FormControlLabel control={<Switch checked={profile.inPerson} onChange={(e) => setProfile(prev => ({ ...prev, inPerson: e.target.checked }))} />} label="Accept In-Person" />
              <Divider sx={{ my: 1 }} />
              <TextField fullWidth multiline rows={4} label="Public Bio" value={profile.bio} onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))} />
              <Button variant="contained" fullWidth size="large" onClick={handleSaveProfile} disabled={loading} sx={{ py: 2, fontWeight: 800 }}>
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const MessagesSection = () => (
    <Box>
      <Grid container sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
        <Grid item xs={12} md={4} sx={{ borderRight: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <TextField fullWidth placeholder="Search chats..." size="small" variant="outlined" sx={{ bgcolor: '#fff' }} />
          </Box>
          <List disablePadding>
            {messages.map((chat) => (
              <ListItem key={chat.id} button sx={{ p: 2.5, bgcolor: chat.active ? 'primary.main' : 'transparent', color: chat.active ? '#fff' : 'inherit' }}>
                <ListItemAvatar><Avatar src={`https://i.pravatar.cc/150?u=${chat.sender}`} /></ListItemAvatar>
                <ListItemText primary={<Typography fontWeight={800}>{chat.sender}</Typography>} secondary={<Typography variant="caption" sx={{ color: chat.active ? 'rgba(255,255,255,0.8)' : 'text.secondary' }}>{chat.text}</Typography>} />
              </ListItem>
            ))}
          </List>
        </Grid>
        <Grid item xs={12} md={8} sx={{ height: '65vh', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src="https://i.pravatar.cc/150?u=Alice" />
              <Typography fontWeight={800}>Alice Cooper</Typography>
            </Stack>
            <IconButton><MoreVert /></IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, p: 3, bgcolor: '#f1f5f9', overflowY: 'auto' }}>
            <Box sx={{ maxWidth: '75%', bgcolor: '#fff', p: 2, borderRadius: '15px 15px 15px 0', mb: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <Typography variant="body2">Hi Dr. Sarah, can we move our session to 7pm today?</Typography>
            </Box>
            <Box sx={{ maxWidth: '75%', bgcolor: 'primary.main', color: '#fff', p: 2, borderRadius: '15px 15px 0 15px', mb: 2, ml: 'auto' }}>
              <Typography variant="body2">Sure Alice, that works for me. I've updated the slot.</Typography>
            </Box>
          </Box>
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1}>
              <TextField fullWidth placeholder="Write a message..." size="small" />
              <Button variant="contained" sx={{ minWidth: 100 }}><Send /></Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  const SettingsSection = () => (
    <Box sx={{ maxWidth: '1000px' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>Account Settings</Typography>
        <Box sx={{ 
          px: 3, py: 1, 
          borderRadius: 2, 
          bgcolor: user?.verified ? '#16a34a' : '#dc2626', 
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          height: 40 
        }}>
          {user?.verified ? 'Verified' : 'Not Verified'}
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, border: '1px solid', borderColor: 'divider', bgcolor: '#ffffff' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" /> Personal Information
            </Typography>
            
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>FIRST NAME</Typography>
                <TextField
                  fullWidth defaultValue={user?.firstName}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>LAST NAME</Typography>
                <TextField
                  fullWidth defaultValue={user?.lastName}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>EMAIL ADDRESS</Typography>
                <TextField
                  fullWidth defaultValue={user?.email}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>DISCIPLINE</Typography>
                <TextField
                  fullWidth defaultValue={profile.discipline}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>GENDER</Typography>
                <TextField
                  fullWidth select
                  defaultValue="Female"
                  SelectProps={{ native: true }}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>PRACTICE LOCATIONS</Typography>
                <TextField
                  fullWidth defaultValue={user?.location || "Melbourne, VIC"}
                  helperText="Separate multiple locations with commas"
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Account Security</Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
              <Button variant="outlined" sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 700 }}>Change Password</Button>
              <Button variant="outlined" color="error" sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 700 }}>Deactivate Account</Button>
            </Stack>

            <Divider sx={{ my: 4 }} />
            
            <Button
              variant="contained"
              size="large"
              sx={{ px: 6, py: 1.8, borderRadius: '50px', fontWeight: 900, fontSize: '0.95rem', boxShadow: '0 8px 20px rgba(0,74,153,0.15)' }}
              onClick={() => showToast('Changes saved successfully!')}
            >
              Save Changes
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );



  // ─── MAIN RENDER ─────────────────────────────────────────────────────

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* Navigation Sidebar */}
          <Grid item xs={12} md={2.5} lg={2}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid', borderColor: 'divider', position: { md: 'sticky' }, top: 100 }}>
              <Stack spacing={1}>
                {[
                  { label: 'Overview', icon: <DashboardIcon /> },
                  { label: 'Compliance', icon: <Assignment />, badge: documents.some(d => d.status === 'Missing') },
                  { label: 'Availability', icon: <CalendarMonth /> },
                  { label: 'Messages', icon: <Message />, badge: true },
                  { label: 'Settings', icon: <Settings /> },
                ].map((nav, i) => (
                  <Button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    variant={activeTab === i ? 'contained' : 'text'}
                    startIcon={nav.badge ? <Badge color="error" variant="dot">{nav.icon}</Badge> : nav.icon}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start', py: 1.5, px: 2, borderRadius: 3,
                      fontWeight: 700,
                      bgcolor: activeTab === i ? 'primary.main' : 'transparent',
                      color: activeTab === i ? '#fff' : 'text.secondary',
                      '&:hover': { bgcolor: activeTab === i ? 'primary.dark' : 'rgba(0,0,0,0.05)' }
                    }}
                  >
                    {nav.label}
                  </Button>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* Main Content Area */}
          <Grid item xs={12} md={9.5} lg={10}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 0 && <Overview />}
                {activeTab === 1 && <Compliance />}
                {activeTab === 2 && <AvailabilitySection />}
                {activeTab === 3 && <MessagesSection />}
                {activeTab === 4 && <SettingsSection />}
              </motion.div>
            </AnimatePresence>

          </Grid>
        </Grid>
      </Container>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ borderRadius: 2, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PractitionerDashboard;
