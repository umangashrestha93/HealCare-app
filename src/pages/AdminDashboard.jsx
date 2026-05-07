import { 
  Box, Grid, Typography, Card, CardContent, 
  Stack, Button, Chip, LinearProgress, Avatar,
  IconButton, Tooltip
} from '@mui/material';
import { 
  People, 
  MedicalServices, 
  TrendingUp, 
  VerifiedUser,
  ArrowForward,
  MoreVert,
  Notifications,
  Download,
  Info
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

const AdminDashboard = () => {
  const analytics = [
    { label: 'Active Practitioners', value: '156', change: '+12%', icon: <MedicalServices />, color: '#0ea5e9' },
    { label: 'Active Bookings', value: '432', change: '+8%', icon: <TrendingUp />, color: '#10b981' },
    { label: 'Client Growth', value: '1,284', change: '+24%', icon: <People />, color: '#6366f1' },
    { label: 'Compliance Rate', value: '98.2%', change: '+0.5%', icon: <VerifiedUser />, color: '#f59e0b' },
  ];

  const recentActivity = [
    { user: 'Dr. Sarah Wilson', action: 'Uploaded AHPRA certificate', time: '12 mins ago', status: 'pending' },
    { user: 'Marcus Chen', action: 'Updated clinical bio', time: '45 mins ago', status: 'approved' },
    { user: 'System', action: 'New backup created successfully', time: '2 hours ago', status: 'info' },
    { user: 'Emma Thompson', action: 'Registration application', time: '3 hours ago', status: 'pending' },
  ];

  const topDisciplines = [
    { name: 'Physiotherapy', count: 45, percentage: 85 },
    { name: 'Psychology', count: 38, percentage: 72 },
    { name: 'Occupational Therapy', count: 24, percentage: 45 },
    { name: 'Speech Pathology', count: 18, percentage: 32 },
  ];

  return (
    <Box sx={{ animate: 'fadeIn' }}>
      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {analytics.map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              sx={{ borderRadius: 4, height: '100%', border: '1px solid', borderColor: 'divider' }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box sx={{ 
                    p: 1.5, borderRadius: 2, 
                    bgcolor: `${item.color}1a`, color: item.color 
                  }}>
                    {item.icon}
                  </Box>
                  <Chip 
                    label={item.change} 
                    size="small" 
                    sx={{ bgcolor: `${item.color}1a`, color: item.color, fontWeight: 700, borderRadius: 1 }} 
                  />
                </Stack>
                <Typography variant="h4" fontWeight={800}>{item.value}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>{item.label}</Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Market Demand Visualization */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Discipline Demand</Typography>
                  <Typography variant="body2" color="text.secondary">Current marketplace saturation by specialty</Typography>
                </Box>
                <Button size="small" endIcon={<ArrowForward />}>Detailed Report</Button>
              </Stack>
              
              <Stack spacing={4}>
                {topDisciplines.map((d) => (
                  <Box key={d.name}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={700}>{d.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{d.count} Active</Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={d.percentage} 
                      sx={{ 
                        height: 8, borderRadius: 4, bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': { borderRadius: 4 }
                      }} 
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity Log */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={800}>Activity Monitor</Typography>
                <Tooltip title="Real-time system updates">
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Stack>
              
              <Stack spacing={3}>
                {recentActivity.map((item, i) => (
                  <Box key={i}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ 
                          width: 8, height: 8, borderRadius: '50%', 
                          bgcolor: item.status === 'pending' ? 'warning.main' : 
                                   item.status === 'approved' ? 'success.main' : 'info.main'
                        }} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{item.user}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{item.action}</Typography>
                        <Typography variant="caption" color="slate.400" sx={{ fontSize: '0.7rem' }}>{item.time}</Typography>
                      </Box>
                      <IconButton size="small"><MoreVert fontSize="small" /></IconButton>
                    </Stack>
                    {i < recentActivity.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Stack>
              
              <Button fullWidth variant="outlined" sx={{ mt: 3, borderRadius: 2 }}>
                View Full System Audit
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Global Notifications Section */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4, bgcolor: '#1e293b', color: '#fff' }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                      <Notifications />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={800} gutterBottom>System Broadcast</Typography>
                      <Typography sx={{ opacity: 0.7 }}>
                        Send urgent updates or maintenance notices to all active practitioners and clients instantly.
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="large"
                    sx={{ borderRadius: '50px', px: 4, fontWeight: 700 }}
                  >
                    Send New Broadcast
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
