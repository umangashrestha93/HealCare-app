import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  CheckCircle,
  Close,
  Email,
  LocationOn,
  Refresh,
  Search,
  VerifiedUser
} from '@mui/icons-material';
import usePractitioners from '../../hooks/usePractitioners';

const formatDate = (value) => {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
};

const statusColor = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
};

const VerificationQueue = () => {
  const {
    practitioners,
    counts,
    loading,
    refreshing,
    error,
    refetch,
    approvePractitioner,
    rejectPractitioner
  } = usePractitioners('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionId, setActionId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const filteredPractitioners = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return practitioners;
    return practitioners.filter((practitioner) => (
      practitioner.name.toLowerCase().includes(term)
      || practitioner.email.toLowerCase().includes(term)
      || practitioner.discipline?.toLowerCase().includes(term)
      || practitioner.location.toLowerCase().includes(term)
    ));
  }, [practitioners, searchTerm]);

  const handleApprove = async (id) => {
    try {
      setActionError(null);
      setActionId(id);
      await approvePractitioner(id);
    } catch (err) {
      setActionError(typeof err === 'string' ? err : 'Unable to approve practitioner');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection');
    if (reason === null) return;

    try {
      setActionError(null);
      setActionId(id);
      await rejectPractitioner(id, reason.trim() || undefined);
    } catch (err) {
      setActionError(typeof err === 'string' ? err : 'Unable to reject practitioner');
    } finally {
      setActionId(null);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={900}>
            Verification Queue
          </Typography>
          <Typography color="text.secondary">
            {counts.pending} pending practitioners awaiting admin review
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            size="small"
            placeholder="Search queue"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={() => refetch({ silent: true })}
            disabled={refreshing}
            sx={{ fontWeight: 700 }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          ['Pending', counts.pending, 'warning'],
          ['Approved', counts.approved, 'success'],
          ['Rejected', counts.rejected, 'error']
        ].map(([label, value, color]) => (
          <Grid item xs={12} sm={4} key={label}>
            <Box sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h4" fontWeight={900} color={`${color}.main`}>
                {value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {(error || actionError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || actionError}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : filteredPractitioners.length === 0 ? (
        <Box sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 5, textAlign: 'center' }}>
          <VerifiedUser sx={{ fontSize: 44, color: 'success.main', mb: 1 }} />
          <Typography variant="h6" fontWeight={800}>
            No pending practitioners
          </Typography>
          <Typography variant="body2" color="text.secondary">
            New practitioner registrations will appear here as soon as they enter MongoDB with pending verification.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filteredPractitioners.map((practitioner) => {
            const busy = actionId === practitioner.id;
            return (
              <Grid item xs={12} lg={6} key={practitioner.id}>
                <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52, fontWeight: 900 }}>
                        {practitioner.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h6" fontWeight={850} noWrap>
                              {practitioner.name}
                            </Typography>
                            <Typography variant="body2" color="primary" fontWeight={750}>
                              {practitioner.discipline || 'Other'}
                            </Typography>
                          </Box>
                          <Chip
                            label={practitioner.status}
                            color={statusColor[practitioner.status] || 'default'}
                            size="small"
                            sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                          />
                        </Stack>

                        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Email fontSize="small" /> {practitioner.email}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <LocationOn fontSize="small" /> {practitioner.location}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Submitted
                        </Typography>
                        <Typography variant="body2" fontWeight={750}>
                          {formatDate(practitioner.createdAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Experience
                        </Typography>
                        <Typography variant="body2" fontWeight={750}>
                          {practitioner.yearsExp ? `${practitioner.yearsExp} years` : 'Not provided'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2, gap: 1 }}>
                      {practitioner.documents.length > 0 ? (
                        practitioner.documents.map((document) => (
                          <Tooltip key={`${practitioner.id}-${document._id || document.docType}`} title={document.status || 'pending'}>
                            <Chip label={document.docType} variant="outlined" size="small" />
                          </Tooltip>
                        ))
                      ) : (
                        <Chip label="No documents uploaded" variant="outlined" size="small" />
                      )}
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2.5 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={busy ? <CircularProgress color="inherit" size={16} /> : <CheckCircle />}
                        onClick={() => handleApprove(practitioner.id)}
                        disabled={Boolean(actionId)}
                        sx={{ fontWeight: 800 }}
                      >
                        Approve
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<Close />}
                        onClick={() => handleReject(practitioner.id)}
                        disabled={Boolean(actionId)}
                        sx={{ fontWeight: 800 }}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default VerificationQueue;
