import { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Card, CardContent,
  Stack, Button, Chip, LinearProgress, Avatar,
  IconButton, Tooltip, Container, Divider,
  CircularProgress
} from '@mui/material';
import {
  People,
  MedicalServices,
  TrendingUp,
  VerifiedUser,
  ArrowForward,
  MoreVert,
  Notifications,
  Info
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { adminService } from '../services/api';

const MotionCard = motion.create(Card);

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const res = await adminService.getMarketMetrics();
        setMetrics(res.data);
      } catch (err) {
        console.error('Failed to fetch metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const analytics = [
    { 
      label: 'Active Practitioners', 
      value: metrics?.activeSupply || '0', 
      change: `${metrics?.verificationCounts?.approved || 0} approved`, 
      icon: <MedicalServices />, 
      color: '#0ea5e9' 
    },
    { 
      label: 'Confirmed Bookings', 
      value: metrics?.totalBookings || '0', 
      change: 'Live count', 
      icon: <TrendingUp />, 
      color: '#10b981' 
    },
    { 
      label: 'Market Utilization', 
      value: `${(metrics?.marketUtilization || 0).toFixed(1)}%`, 
      change: 'Confirmed only', 
      icon: <People />, 
      color: '#6366f1' 
    },
    { 
      label: 'Pending Verification', 
      value: metrics?.pendingVerifications || '0', 
      change: `${metrics?.rejectedPractitioners || 0} rejected`, 
      icon: <VerifiedUser />, 
      color: '#f59e0b' 
    },
  ];

  const recentActivity = metrics?.recentPractitioners?.map((practitioner) => ({
    user: `${practitioner.userId?.firstName || ''} ${practitioner.userId?.lastName || ''}`.trim() || 'Practitioner',
    action: `${practitioner.verificationStatus} verification application`,
    time: practitioner.createdAt ? new Date(practitioner.createdAt).toLocaleDateString() : 'Date unavailable',
    status: practitioner.verificationStatus
  })) || [];

  const topDisciplines = metrics?.demandByDiscipline?.map(d => ({
    name: d._id,
    count: d.count,
    percentage: Math.min(100, (d.count / (metrics.activeSupply || 1)) * 100)
  })) || [];

  const quickActions = [
    { label: 'Review Verifications', variant: 'contained' },
    { label: 'Export Reports', variant: 'outlined' },
    { label: 'Send Broadcast', variant: 'outlined' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="xl">
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" spacing={3} sx={{ mb: 5 }}>
          <Box>
            <Typography variant="h4" fontWeight={900} gutterBottom>
              Administrative Overview
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
              Manage platform health, practitioner verification, and marketplace performance from one central command center.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {quickActions.map((action) => (
              <Button key={action.label} variant={action.variant} sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 700 }}>
                {action.label}
              </Button>
            ))}
          </Stack>
        </Stack>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {analytics.map((item, i) => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                sx={{ borderRadius: 4, height: '100%' }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${item.color}1a`, color: item.color }}>
                      {item.icon}
                    </Box>
                    <Chip label={item.change} size="small" sx={{ bgcolor: `${item.color}1a`, color: item.color, fontWeight: 700, borderRadius: 1 }} />
                  </Stack>
                  <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
                    {item.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Discipline Demand
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current marketplace saturation by specialty.
                    </Typography>
                  </Box>
                  <Button size="small" endIcon={<ArrowForward />}>
                    Detailed Report
                  </Button>
                </Stack>
                <Stack spacing={4}>
                  {topDisciplines.length > 0 ? (
                    topDisciplines.map((discipline) => (
                      <Box key={discipline.name}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {discipline.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {discipline.count} Active
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={discipline.percentage}
                          sx={{ height: 10, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center">
                      No discipline data available
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={800}>
                    Verification Snapshot
                  </Typography>
                  <Chip label="Real-time" color="primary" variant="outlined" size="small" />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Track in-progress practitioner verifications and prioritize cases that need immediate review.
                </Typography>
                <Stack spacing={2}>
                  {[
                    { label: 'Pending Queue', value: metrics?.pendingVerifications || 0 },
                    { label: 'Market Bookings', value: metrics?.totalBookings || 0 },
                    { label: 'Active Supply', value: metrics?.activeSupply || 0 },
                    { label: 'Capacity Utilization', value: `${(metrics?.marketUtilization || 0).toFixed(1)}%` },
                  ].map((item) => (
                    <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {item.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={800}>
                    Activity Monitor
                  </Typography>
                  <Tooltip title="Real-time system updates">
                    <IconButton size="small">
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack spacing={2}>
                  {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                    <Box key={index}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box sx={{ mt: 0.5 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor:
                                activity.status === 'pending'
                                  ? 'warning.main'
                                  : activity.status === 'approved'
                                  ? 'success.main'
                                  : 'info.main',
                            }}
                          />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {activity.user}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {activity.action}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.85 }}>
                            {activity.time}
                          </Typography>
                        </Box>
                        <IconButton size="small">
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Stack>
                      {index < recentActivity.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  )) : (
                    <Typography variant="body2" color="text.secondary" align="center">
                      No practitioner activity yet
                    </Typography>
                  )}
                </Stack>
                <Button fullWidth variant="outlined" sx={{ mt: 3, borderRadius: 2 }}>
                  View Full System Audit
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4, bgcolor: '#1e293b', color: '#fff' }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                    <Notifications />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      System Broadcast
                    </Typography>
                    <Typography sx={{ opacity: 0.76 }}>
                      Publish urgent guidance to all practitioners and clients.
                    </Typography>
                  </Box>
                </Stack>
                <Button variant="contained" color="secondary" fullWidth sx={{ borderRadius: '50px', py: 1.8, fontWeight: 700 }}>
                  Send New Broadcast
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
