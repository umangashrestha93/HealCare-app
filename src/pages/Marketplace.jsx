import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  TextField, Button, Chip, Avatar, Divider, Stack,
  Paper, IconButton, Drawer, Alert, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { 
  Search, FilterList, Verified, 
  VideoCameraFront, LocationOn, Star
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { setFilters, resetFilters } from '../store/slices/practitionerSlice';
import { useAuth } from '../context/AuthContext';

const MotionCard = motion(Card);

const Marketplace = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { filteredPractitioners, filters } = useSelector(state => state.practitioners);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Role-Based Access: Only 'client' can access
  useEffect(() => {
    if (user && user.role !== 'client') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSearchChange = (e) => {
    dispatch(setFilters({ searchTerm: e.target.value }));
  };

  const handleDisciplineChange = (discipline) => {
    dispatch(setFilters({ discipline }));
  };

  const handleDeliveryChange = (mode) => {
    dispatch(setFilters({ deliveryMode: mode }));
  };

  const handleAvailabilityToggle = (attr) => {
    const newAvailability = filters.availability.includes(attr)
      ? filters.availability.filter(a => a !== attr)
      : [...filters.availability, attr];
    dispatch(setFilters({ availability: newAvailability }));
  };

  const FilterSidebar = () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom aria-label="Filter by Discipline">
          Discipline
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {['All', 'Physiotherapy', 'Occupational Therapy', 'Psychology', 'Speech Pathology'].map(d => (
            <Chip 
              key={d} label={d} 
              onClick={() => handleDisciplineChange(d)}
              color={filters.discipline === d ? 'primary' : 'default'}
              variant={filters.discipline === d ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom aria-label="Filter by Delivery Mode">
          Delivery Mode
        </Typography>
        <Stack direction="row" spacing={1}>
          {['All', 'Telehealth', 'In-person'].map(m => (
            <Chip 
              key={m} label={m} 
              onClick={() => handleDeliveryChange(m)}
              color={filters.deliveryMode === m ? 'primary' : 'default'}
              variant={filters.deliveryMode === m ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom aria-label="Filter by Availability">
          Availability
        </Typography>
        <FormGroup>
          <FormControlLabel 
            control={<Checkbox checked={filters.availability.includes('After-Hours')} onChange={() => handleAvailabilityToggle('After-Hours')} />} 
            label="After-Hours" 
          />
          <FormControlLabel 
            control={<Checkbox checked={filters.availability.includes('Weekends')} onChange={() => handleAvailabilityToggle('Weekends')} />} 
            label="Weekends" 
          />
        </FormGroup>
      </Box>

      <Button variant="outlined" onClick={() => dispatch(resetFilters())} fullWidth>
        Reset Filters
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Desktop Filter Sidebar */}
          <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper sx={{ p: 3, borderRadius: 4, position: 'sticky', top: 100 }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>Filters</Typography>
              <Divider sx={{ my: 2 }} />
              <FilterSidebar />
            </Paper>
          </Grid>

          {/* Practitioner List */}
          <Grid item xs={12} md={9}>
            <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
              <Paper sx={{ p: 1, flexGrow: 1, display: 'flex', alignItems: 'center', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Search sx={{ ml: 2, mr: 1, color: 'text.secondary' }} />
                <TextField 
                  fullWidth placeholder="Search by name or specialty..." 
                  variant="standard" 
                  InputProps={{ disableUnderline: true }}
                  value={filters.searchTerm}
                  onChange={handleSearchChange}
                  aria-label="Search Practitioners"
                />
              </Paper>
              <IconButton 
                sx={{ display: { md: 'none' }, bgcolor: '#fff', borderRadius: 2 }} 
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open Filters"
              >
                <FilterList />
              </IconButton>
            </Box>

            <AnimatePresence mode="popLayout">
              <Grid container spacing={3}>
                {filteredPractitioners.map((p) => (
                  <Grid item xs={12} key={p.id}>
                    <MotionCard 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      sx={{ borderRadius: 4, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                    >
                      <CardContent sx={{ p: 0 }}>
                        <Grid container>
                          <Grid item xs={12} sm={3} sx={{ bgcolor: '#f8fafc', p: 3, textAlign: 'center' }}>
                            <Avatar 
                              src={p.image} 
                              sx={{ width: 80, height: 80, mx: 'auto', mb: 2, border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                            />
                            <Typography variant="subtitle2" fontWeight={800} color="primary">{p.discipline}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={9} sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" fontWeight={800}>{p.name}</Typography>
                                {p.verified && (
                                  <Chip 
                                    icon={<Verified sx={{ fontSize: '14px !important' }} />} 
                                    label="Verified" size="small" color="secondary" variant="outlined" 
                                    sx={{ fontWeight: 700 }}
                                    aria-label="Verified Practitioner"
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Star sx={{ color: '#fbbf24', fontSize: 18 }} />
                                <Typography variant="body2" fontWeight={700}>4.9</Typography>
                              </Box>
                            </Box>
                            
                            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOn sx={{ fontSize: 16 }} /> {p.location}
                              </Typography>
                              {p.telehealth && (
                                <Typography variant="body2" color="secondary.dark" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <VideoCameraFront sx={{ fontSize: 16 }} /> Telehealth Available
                                </Typography>
                              )}
                            </Stack>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{p.bio}</Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="h6" fontWeight={800}>${p.fee}<Typography component="span" variant="caption" color="text.secondary"> / session</Typography></Typography>
                              <Button 
                                variant="contained" color="secondary" 
                                onClick={() => navigate(`/booking?practitioner=${p.id}`)}
                                sx={{ borderRadius: '50px', px: 4, fontWeight: 800 }}
                                aria-label={`Book appointment with ${p.name}`}
                              >
                                Book Session
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </MotionCard>
                  </Grid>
                ))}
              </Grid>
            </AnimatePresence>
          </Grid>
        </Grid>
      </Container>

      {/* Mobile Filter Drawer */}
      <Drawer anchor="bottom" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}>
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={800} gutterBottom>Filter Options</Typography>
          <Divider sx={{ mb: 4 }} />
          <FilterSidebar />
          <Button variant="contained" fullWidth sx={{ mt: 4, py: 2 }} onClick={() => setMobileFilterOpen(false)}>
            Show Results
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Marketplace;
