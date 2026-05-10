import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, 
  Stack, Button, MenuItem, Select, FormControl,
  InputLabel, LinearProgress, CircularProgress, Alert, Divider
} from '@mui/material';
import { 
  TrendingUp, TrendingDown, Download, People,
  MedicalServices, VerifiedUser, CalendarMonth
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { adminService } from '../services/api';

const MotionCard = motion.create(Card);

const AdminAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await adminService.getMarketMetrics();
        setMetrics(res.data);
      } catch {
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>;
  }

  const kpis = [
    {
      label: 'Active Practitioners',
      value: metrics?.activeSupply ?? 0,
      sub: `${metrics?.verificationCounts?.approved ?? 0} approved`,
      icon: <MedicalServices />,
      color: '#0ea5e9',
      up: true
    },
    {
      label: 'Confirmed Bookings',
      value: metrics?.totalBookings ?? 0,
      sub: 'All time',
      icon: <CalendarMonth />,
      color: '#10b981',
      up: true
    },
    {
      label: 'Market Utilisation',
      value: `${(metrics?.marketUtilization ?? 0).toFixed(1)}%`,
      sub: 'Bookings / capacity',
      icon: <People />,
      color: '#6366f1',
      up: (metrics?.marketUtilization ?? 0) > 50
    },
    {
      label: 'Pending Verifications',
      value: metrics?.pendingVerifications ?? 0,
      sub: `${metrics?.rejectedPractitioners ?? 0} rejected`,
      icon: <VerifiedUser />,
      color: '#f59e0b',
      up: false
    }
  ];

  const disciplineStats = metrics?.demandByDiscipline ?? [];
  const maxCount = disciplineStats.length > 0 ? disciplineStats[0].count : 1;

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Marketplace Analytics</Typography>
          <Typography color="text.secondary">Live platform metrics from MongoDB Atlas</Typography>
        </Box>
        <Button startIcon={<Download />} variant="contained" sx={{ borderRadius: 2 }} disabled>
          Export Data
        </Button>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {kpis.map((kpi, i) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${kpi.color}1a`, color: kpi.color }}>
                    {kpi.icon}
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {kpi.up ? <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} /> : <TrendingDown sx={{ fontSize: 14, color: 'warning.main' }} />}
                    <Typography variant="caption" fontWeight={700} color={kpi.up ? 'success.main' : 'warning.main'}>
                      {kpi.sub}
                    </Typography>
                  </Stack>
                </Stack>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>{kpi.value}</Typography>
                <Typography variant="body2" color="text.secondary">{kpi.label}</Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Discipline Breakdown */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>Discipline Breakdown</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Distribution of approved practitioners by specialty
              </Typography>
              {disciplineStats.length > 0 ? (
                <Stack spacing={3}>
                  {disciplineStats.map((d) => (
                    <Box key={d._id}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{d._id || 'Other'}</Typography>
                        <Typography variant="body2" color="text.secondary">{d.count} active</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (d.count / maxCount) * 100)}
                        sx={{ height: 10, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No approved practitioners yet. Approve some from the Verification queue.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Verification Snapshot */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>Verification Snapshot</Typography>
              <Divider sx={{ mb: 3 }} />
              <Stack spacing={2.5}>
                {[
                  { label: 'Pending Queue', value: metrics?.pendingVerifications ?? 0, color: '#f59e0b' },
                  { label: 'Approved', value: metrics?.verificationCounts?.approved ?? 0, color: '#10b981' },
                  { label: 'Rejected', value: metrics?.verificationCounts?.rejected ?? 0, color: '#ef4444' },
                  { label: 'Total Bookings', value: metrics?.totalBookings ?? 0, color: '#6366f1' },
                  { label: 'Capacity Utilisation', value: `${(metrics?.marketUtilization ?? 0).toFixed(1)}%`, color: '#0ea5e9' },
                ].map((item) => (
                  <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight={800}>{item.value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAnalytics;
