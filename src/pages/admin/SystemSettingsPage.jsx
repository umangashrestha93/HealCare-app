import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Grid, Paper, Stack, Switch, TextField,
  Typography, FormControlLabel, CircularProgress
} from '@mui/material';
import { Save, Settings } from '@mui/icons-material';
import { adminService } from '../../services/api';

const defaultSettings = {
  platform: { appName: 'Beyond5 Healthcare', supportEmail: 'support@beyond5.com' },
  bookingRules: { cancellationPolicyHours: 24, maxBookingsPerDay: 8 },
  featureToggles: {
    aiAssistant: true,
    practitionerChat: true,
    marketplaceBookings: true,
    reviews: true
  }
};

const SystemSettingsPage = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSettings();
      setSettings({
        platform: { ...defaultSettings.platform, ...(res.data?.platform || {}) },
        bookingRules: { ...defaultSettings.bookingRules, ...(res.data?.bookingRules || {}) },
        featureToggles: { ...defaultSettings.featureToggles, ...(res.data?.featureToggles || {}) }
      });
    } catch (err) {
      setToast({ severity: 'error', message: err || 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      await adminService.updateSettings(settings);
      setToast({ severity: 'success', message: 'Settings saved' });
    } catch (err) {
      setToast({ severity: 'error', message: err || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const update = (group, key, value) => setSettings((prev) => ({
    ...prev,
    [group]: { ...prev[group], [key]: value }
  }));

  if (loading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 300 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>System Settings</Typography>
          <Typography color="text.secondary">Configure platform identity, booking rules, and feature availability.</Typography>
        </Box>
        <Button startIcon={<Save />} variant="contained" onClick={saveSettings} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
      </Stack>

      {toast && <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ mb: 2 }}>{toast.message}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Settings color="primary" />
              <Typography variant="h6" fontWeight={900}>Platform</Typography>
            </Stack>
            <Stack spacing={2}>
              <TextField label="App name" value={settings.platform.appName} onChange={(e) => update('platform', 'appName', e.target.value)} />
              <TextField label="Support email" type="email" value={settings.platform.supportEmail} onChange={(e) => update('platform', 'supportEmail', e.target.value)} />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Booking Rules</Typography>
            <Stack spacing={2}>
              <TextField
                label="Cancellation policy hours"
                type="number"
                value={settings.bookingRules.cancellationPolicyHours}
                onChange={(e) => update('bookingRules', 'cancellationPolicyHours', Number(e.target.value))}
              />
              <TextField
                label="Max bookings per day"
                type="number"
                value={settings.bookingRules.maxBookingsPerDay}
                onChange={(e) => update('bookingRules', 'maxBookingsPerDay', Number(e.target.value))}
              />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Feature Toggles</Typography>
            <Grid container spacing={2}>
              {Object.entries(settings.featureToggles).map(([key, value]) => (
                <Grid item xs={12} sm={6} md={3} key={key}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <FormControlLabel
                      control={<Switch checked={Boolean(value)} onChange={(e) => update('featureToggles', key, e.target.checked)} />}
                      label={<Typography fontWeight={800}>{key}</Typography>}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSettingsPage;
