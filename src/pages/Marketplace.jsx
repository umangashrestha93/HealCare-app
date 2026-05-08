import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  TextField, Button, Chip, Avatar, Divider, Stack,
  Paper, IconButton, Drawer, FormGroup, FormControlLabel, Checkbox,
  InputAdornment, Skeleton, Badge, Pagination
} from '@mui/material';
import { 
  Search, FilterList, Verified, 
  LocationOn, RestartAlt, CalendarMonth, Info,
  NavigateBefore, NavigateNext
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { setFilters, resetFilters, fetchPractitioners } from '../store/slices/practitionerSlice';
import { useAuth } from '../context/AuthContext';

const MotionCard = motion(Card);

const Marketplace = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { practitioners, filters, pagination, loading, error } = useSelector(state => state.practitioners);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // Use a ref to debounce search typing
  const searchTimeout = useRef(null);

  // Re-fetch whenever filters change
  useEffect(() => {
    dispatch(fetchPractitioners());
  }, [
    dispatch, 
    filters.discipline, 
    filters.deliveryMode, 
    filters.availability, 
    filters.page,
    // Note: We'll handle searchTerm separately with debouncing
  ]);

  useEffect(() => {
    if (user && user.role !== 'client') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    dispatch(setFilters({ searchTerm: value, page: 1 }));

    // Debounce the API call for search
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      dispatch(fetchPractitioners());
    }, 500);
  };

  const handlePageChange = (event, value) => {
    dispatch(setFilters({ page: value }));
  };

  const clearSearch = () => {
    dispatch(setFilters({ searchTerm: '', page: 1 }));
    dispatch(fetchPractitioners());
  };

  const handleDisciplineChange = (discipline) => {
    dispatch(setFilters({ discipline, page: 1 }));
  };

  const handleDeliveryChange = (mode) => {
    dispatch(setFilters({ deliveryMode: mode, page: 1 }));
  };

  const handleAvailabilityToggle = (attr) => {
    const newAvailability = filters.availability.includes(attr)
      ? filters.availability.filter(a => a !== attr)
      : [...filters.availability, attr];
    dispatch(setFilters({ availability: newAvailability, page: 1 }));
  };

  const FilterSidebarContent = () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>
          DISCIPLINE
        </Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {['All', 'Physiotherapy', 'Occupational Therapy', 'Psychology', 'Speech Pathology'].map(d => (
            <Button
              key={d}
              variant={filters.discipline === d ? 'contained' : 'text'}
              size="small"
              fullWidth
              onClick={() => handleDisciplineChange(d)}
              sx={{ 
                justifyContent: 'flex-start', 
                textAlign: 'left',
                fontWeight: 600,
                color: filters.discipline === d ? '#fff' : 'text.secondary'
              }}
            >
              {d}
            </Button>
          ))}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>
          AVAILABILITY
        </Typography>
        <FormGroup sx={{ mt: 1 }}>
          <FormControlLabel 
            control={<Checkbox size="small" checked={filters.availability.includes('After-Hours')} onChange={() => handleAvailabilityToggle('After-Hours')} />} 
            label={<Typography variant="body2" fontWeight={600}>After-Hours</Typography>} 
          />
          <FormControlLabel 
            control={<Checkbox size="small" checked={filters.availability.includes('Weekends')} onChange={() => handleAvailabilityToggle('Weekends')} />} 
            label={<Typography variant="body2" fontWeight={600}>Weekends</Typography>} 
          />
        </FormGroup>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>
          SERVICE TYPE
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
          {['All', 'Telehealth', 'In-person'].map(m => (
            <Chip 
              key={m} label={m} 
              onClick={() => handleDeliveryChange(m)}
              color={filters.deliveryMode === m ? 'primary' : 'default'}
              variant={filters.deliveryMode === m ? 'filled' : 'outlined'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          ))}
        </Stack>
      </Box>

      <Button 
        variant="outlined" 
        size="small"
        startIcon={<RestartAlt />} 
        onClick={() => {
          dispatch(resetFilters());
          dispatch(fetchPractitioners());
        }} 
        fullWidth
        sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}
      >
        Reset Filters
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* LEFT SIDEBAR: FILTERS */}
          <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 100 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Refine Results</Typography>
              <FilterSidebarContent />
            </Paper>
          </Grid>

          {/* MAIN PAGE: SEARCH & PRACTITIONERS */}
          <Grid item xs={12} md={9}>
            {/* Search Bar at Top of Results */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 1.5, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', bgcolor: '#fff'
              }}
            >
              <Search sx={{ ml: 1.5, mr: 1, color: 'text.disabled' }} />
              <TextField 
                fullWidth placeholder="Search by name, specialty, or condition..." 
                variant="standard" 
                InputProps={{ 
                  disableUnderline: true,
                  endAdornment: filters.searchTerm && (
                    <IconButton size="small" onClick={clearSearch} sx={{ mr: 1 }}><Close fontSize="small" /></IconButton>
                  ),
                  sx: { height: 48, px: 1, fontWeight: 500 }
                }}
                value={filters.searchTerm}
                onChange={handleSearchChange}
              />
              <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />
              <Button 
                variant="text" 
                startIcon={<FilterList />} 
                onClick={() => setMobileFilterOpen(true)}
                sx={{ display: { md: 'none' }, ml: 1, fontWeight: 700 }}
              >
                Filters
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, ml: 2, mr: 2, whiteSpace: 'nowrap' }}>
                {pagination.total} total specialists
              </Typography>
            </Paper>

            <AnimatePresence mode="popLayout">
              {loading ? (
                <Stack spacing={2}>
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: 3 }} />)}
                </Stack>
              ) : practitioners.length > 0 ? (
                <>
                  <Stack spacing={2}>
                    {practitioners.map((p) => (
                      <MotionCard 
                        key={p._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm="auto">
                              <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={p.verificationStatus === 'approved' && <Verified color="secondary" sx={{ bgcolor: '#fff', borderRadius: '50%', fontSize: 20 }} />}
                              >
                                <Avatar 
                                  src={p.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p._id}`} 
                                  sx={{ width: 80, height: 80, border: '2px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }} 
                                />
                              </Badge>
                            </Grid>
                            
                            <Grid item xs={12} sm>
                              <Box sx={{ mb: 0.5 }}>
                                <Typography variant="h6" fontWeight={800}>{p.userId?.firstName} {p.userId?.lastName}</Typography>
                                <Typography variant="body2" color="primary" fontWeight={700}>{p.discipline}</Typography>
                              </Box>
                              <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LocationOn sx={{ fontSize: 14 }} /> {p.userId?.location || 'Remote'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarMonth sx={{ fontSize: 14 }} /> {p.afterHours ? 'After-Hours' : 'Normal Hours'}
                                </Typography>
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {p.bio || 'Professional allied health provider on Beyond5.'}
                              </Typography>
                            </Grid>

                            <Grid item xs={12} sm="auto" sx={{ textAlign: { sm: 'right' }, borderLeft: { sm: '1px solid' }, borderColor: 'divider', pl: { sm: 3 } }}>
                              <Typography variant="h6" fontWeight={800} color="primary.main">${p.fee || '80'}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>per session</Typography>
                              <Button 
                                variant="contained" color="secondary" size="small"
                                onClick={() => navigate(`/booking?practitioner=${p._id}`)}
                                sx={{ borderRadius: '50px', px: 3, fontWeight: 800 }}
                              >
                                Book Now
                              </Button>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </MotionCard>
                    ))}
                  </Stack>
                  
                  {/* Pagination Controls */}
                  {pagination.pages > 1 && (
                    <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
                      <Pagination 
                        count={pagination.pages} 
                        page={pagination.page} 
                        onChange={handlePageChange} 
                        color="primary"
                        size="large"
                        sx={{ '& .MuiPaginationItem-root': { fontWeight: 700 } }}
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }}>
                  <Info sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" fontWeight={800}>No specialists found</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Try adjusting your filters or search terms.</Typography>
                  <Button variant="outlined" onClick={() => {
                    dispatch(resetFilters());
                    dispatch(fetchPractitioners());
                  }}>Reset All</Button>
                </Paper>
              )}
            </AnimatePresence>
          </Grid>
        </Grid>
      </Container>

      {/* Mobile Drawer */}
      <Drawer anchor="bottom" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} PaperProps={{ sx: { borderRadius: '20px 20px 0 0', p: 4 } }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 4 }}>Filter Specialists</Typography>
        <FilterSidebarContent />
        <Button variant="contained" fullWidth sx={{ mt: 4, py: 1.5, borderRadius: 3 }} onClick={() => setMobileFilterOpen(false)}>Show Results</Button>
      </Drawer>
    </Box>
  );
};

export default Marketplace;
