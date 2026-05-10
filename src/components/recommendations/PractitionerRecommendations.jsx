import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AutoAwesome, CalendarMonth, LocationOn, Refresh, Star, Tune } from '@mui/icons-material';
import { recommendationService } from '../../services/api';

const disciplineOptions = ['Any', 'Physiotherapy', 'Occupational Therapy', 'Psychology', 'Speech Pathology'];
const availabilityOptions = [
  { label: 'Any time', value: '' },
  { label: 'After-hours', value: 'after-hours' },
  { label: 'Weekends', value: 'weekends' },
];
const serviceOptions = [
  { label: 'Any service', value: '' },
  { label: 'Telehealth', value: 'telehealth' },
  { label: 'In person', value: 'in-person' },
];

const PractitionerRecommendations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState({
    concern: '',
    discipline: 'Any',
    serviceType: '',
    availability: '',
  });
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  const fetchRecommendations = useCallback(async (nextPreferences) => {
    const activePreferences = nextPreferences || preferencesRef.current;
    try {
      setLoading(true);
      const res = await recommendationService.getPractitioners({
        concern: activePreferences.concern,
        discipline: activePreferences.discipline === 'Any' ? undefined : activePreferences.discipline,
        serviceType: activePreferences.serviceType,
        availability: activePreferences.availability,
        limit: 4,
      });
      setRecommendations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch recommendations', err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchRecommendations]);

  const updatePreference = (field, value) => {
    const nextPreferences = { ...preferences, [field]: value };
    setPreferences(nextPreferences);
    if (field !== 'concern') fetchRecommendations(nextPreferences);
  };

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoAwesome color="secondary" />
            <Typography variant="h5" fontWeight={900}>Recommended for you</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Ranked by your care history, goals, availability, ratings, and provider fit.
          </Typography>
        </Box>
        <IconButton onClick={() => fetchRecommendations()} aria-label="Refresh recommendations">
          <Refresh />
        </IconButton>
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Care goal"
            placeholder="e.g. anxiety, back pain, speech"
            value={preferences.concern}
            onChange={(event) => updatePreference('concern', event.target.value)}
            onBlur={() => fetchRecommendations()}
            InputProps={{ startAdornment: <Tune sx={{ mr: 1, color: 'text.disabled' }} /> }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            select
            size="small"
            label="Discipline"
            value={preferences.discipline}
            onChange={(event) => updatePreference('discipline', event.target.value)}
          >
            {disciplineOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={2.5}>
          <TextField
            fullWidth
            select
            size="small"
            label="Service"
            value={preferences.serviceType}
            onChange={(event) => updatePreference('serviceType', event.target.value)}
          >
            {serviceOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={2.5}>
          <TextField
            fullWidth
            select
            size="small"
            label="Availability"
            value={preferences.availability}
            onChange={(event) => updatePreference('availability', event.target.value)}
          >
            {availabilityOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ py: 5, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : recommendations.length > 0 ? (
        <Grid container spacing={2}>
          {recommendations.map((practitioner) => (
            <Grid item xs={12} md={6} key={practitioner._id}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar
                      src={practitioner.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${practitioner._id}`}
                      sx={{ width: 56, height: 56 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={900} noWrap>
                        {practitioner.userId?.firstName} {practitioner.userId?.lastName}
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight={700}>{practitioner.discipline}</Typography>
                      <Stack direction="row" spacing={1.5} sx={{ mt: 1, mb: 1 }} flexWrap="wrap">
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <Star sx={{ fontSize: 14, color: '#f59e0b' }} /> {practitioner.averageRating || '0.0'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <LocationOn sx={{ fontSize: 14 }} /> {practitioner.location || practitioner.userId?.location || 'Remote'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <CalendarMonth sx={{ fontSize: 14 }} /> {practitioner.weekends ? 'Weekends' : 'Standard hours'}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                        {(practitioner.matchReasons || []).map((reason) => (
                          <Chip key={reason} label={reason} size="small" color="secondary" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button size="small" onClick={() => navigate(`/booking?practitioner=${practitioner._id}`)} variant="contained">
                      Book
                    </Button>
                    <Button size="small" onClick={() => navigate('/marketplace')} variant="outlined">
                      Compare
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography fontWeight={800}>No recommendations yet</Typography>
          <Typography variant="body2" color="text.secondary">Try changing your care goal or browse Marketplace.</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PractitionerRecommendations;
