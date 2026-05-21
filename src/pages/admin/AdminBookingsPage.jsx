import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import {
  CalendarMonth,
  CreditCard,
  EventAvailable,
  Payments,
  PersonSearch,
  Refresh
} from '@mui/icons-material';
import { adminService } from '../../services/api';

const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD'
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const formatDateTime = (booking) => {
  if (!booking?.appointmentDate) return '-';
  const date = new Date(booking.appointmentDate).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  return `${date} at ${booking.startTime || '-'}`;
};

const paymentColor = {
  paid: 'success',
  pending: 'warning',
  unpaid: 'default',
  failed: 'error',
  refunded: 'info'
};

const bookingStatusColor = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'error',
  completed: 'info'
};

const defaultFilters = {
  search: '',
  status: 'all',
  paymentStatus: 'all',
  serviceType: 'all',
  dateFrom: '',
  dateTo: ''
};

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadBookings = useCallback(async (page = 1, limit = 10, activeFilters = defaultFilters) => {
    try {
      setLoading(true);
      const res = await adminService.getBookings({
        ...activeFilters,
        page,
        limit
      });
      setBookings(res.data || []);
      setStats(res.stats || null);
      setPagination((prev) => ({ ...prev, ...(res.pagination || {}), page, limit }));
    } catch (err) {
      setToast({ severity: 'error', message: err || 'Failed to load bookings and transactions' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBookings(1, pagination.limit, filters);
  }, [filters, loadBookings, pagination.limit]);

  const summaryCards = useMemo(() => ([
    {
      label: 'Total bookings',
      value: stats?.total || 0,
      detail: `${stats?.confirmed || 0} confirmed`,
      icon: <EventAvailable />,
      color: '#0f766e'
    },
    {
      label: 'Paid transactions',
      value: stats?.payment?.paid || 0,
      detail: `${formatCurrency(stats?.totalRevenue || 0)} received`,
      icon: <Payments />,
      color: '#16a34a'
    },
    {
      label: 'Pending payments',
      value: stats?.payment?.pending || 0,
      detail: `${stats?.pending || 0} reserved bookings`,
      icon: <CreditCard />,
      color: '#d97706'
    },
    {
      label: 'Filtered records',
      value: pagination.total || 0,
      detail: 'Matching current filters',
      icon: <PersonSearch />,
      color: '#2563eb'
    }
  ]), [pagination.total, stats]);

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleRowsPerPageChange = (event) => {
    const nextLimit = Number(event.target.value);
    setPagination((prev) => ({ ...prev, limit: nextLimit, page: 1 }));
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Bookings & Transactions</Typography>
          <Typography color="text.secondary">
            Track booked sessions, clients, practitioners, payment status, and transaction details.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Refresh />}
          onClick={() => loadBookings(pagination.page, pagination.limit, filters)}
          disabled={loading}
          sx={{ borderRadius: 2, fontWeight: 800, alignSelf: { xs: 'stretch', md: 'center' } }}
        >
          Refresh
        </Button>
      </Stack>

      {toast && (
        <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ mb: 2, borderRadius: 2 }}>
          {toast.message}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 48, height: 48, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: `${card.color}18`, color: card.color }}>
                  {card.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={800}>{card.label}</Typography>
                  <Typography variant="h5" fontWeight={900}>{card.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{card.detail}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search client, practitioner, transaction"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth select size="small" label="Booking status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth select size="small" label="Payment" value={filters.paymentStatus} onChange={(event) => updateFilter('paymentStatus', event.target.value)}>
              {['all', 'paid', 'pending', 'unpaid', 'failed', 'refunded'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth select size="small" label="Service" value={filters.serviceType} onChange={(event) => updateFilter('serviceType', event.target.value)}>
              {['all', 'telehealth', 'in-person'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button fullWidth variant="outlined" onClick={resetFilters} sx={{ height: 40, borderRadius: 2, fontWeight: 800 }}>
              Reset
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" type="date" label="From" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" type="date" label="To" value={filters.dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Table sx={{ minWidth: 1080 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Booked By</TableCell>
              <TableCell>Practitioner</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Transaction</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : bookings.length > 0 ? (
              bookings.map((booking) => (
                <TableRow key={booking._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarMonth sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight={800}>{formatDateTime(booking)}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={800}>{booking.clientName}</Typography>
                    <Typography variant="caption" color="text.secondary">{booking.clientEmail || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={800}>{booking.practitionerName}</Typography>
                    <Typography variant="caption" color="text.secondary">{booking.practitionerDiscipline || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={booking.serviceType || '-'} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={800}>{booking.transactionId || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{booking.payment?.provider || 'demo'} • {booking.paymentMethod || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.paymentStatus || 'unpaid'}
                      size="small"
                      color={paymentColor[booking.paymentStatus] || 'default'}
                      sx={{ fontWeight: 900 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={900}>{formatCurrency(booking.amount)}</Typography>
                    {Number(booking.discountAmount || 0) > 0 && (
                      <Typography variant="caption" color="success.main">
                        -{formatCurrency(booking.discountAmount)} offer
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status || '-'}
                      size="small"
                      color={bookingStatusColor[booking.status] || 'default'}
                      sx={{ fontWeight: 900 }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  No bookings or transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total || 0}
          page={(pagination.page || 1) - 1}
          rowsPerPage={pagination.limit || 10}
          onPageChange={(_, page) => loadBookings(page + 1, pagination.limit, filters)}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </TableContainer>
    </Box>
  );
};

export default AdminBookingsPage;
