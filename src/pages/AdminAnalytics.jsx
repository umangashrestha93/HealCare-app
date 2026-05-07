import { 
  Box, Typography, Grid, Card, CardContent, 
  Stack, Button, MenuItem, Select, FormControl,
  InputLabel, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { 
  TrendingUp, TrendingDown, People, 
  CalendarMonth, Download, FilterList 
} from '@mui/icons-material';

const AdminAnalytics = () => {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Marketplace Analytics</Typography>
          <Typography color="text.secondary">Deep dive into platform growth and user trends</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select defaultValue="30" label="Time Range">
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
              <MenuItem value="365">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<Download />} variant="contained" sx={{ borderRadius: 2 }}>Export Data</Button>
        </Stack>
      </Stack>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: 'divider' }}>
            <Typography color="text.secondary">Main Growth Chart - Telehealth vs In-Person (Visual Placeholder)</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {[
              { label: 'Booking Conversion', value: '24.8%', trend: '+4.2%', up: true },
              { label: 'Retention Rate', value: '78.2%', trend: '-1.5%', up: false },
              { label: 'Avg. Rating', value: '4.92', trend: '+0.05%', up: true },
            ].map(item => (
              <Card key={item.label} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>{item.label}</Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                    <Typography variant="h4" fontWeight={800}>{item.value}</Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'flex', alignItems: 'center', fontWeight: 700,
                        color: item.up ? 'success.main' : 'error.main'
                      }}
                    >
                      {item.up ? <TrendingUp fontSize="inherit" /> : <TrendingDown fontSize="inherit" />}
                      {item.trend}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAnalytics;
