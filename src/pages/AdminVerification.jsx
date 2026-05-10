import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Stack, Button,
  Chip, Avatar, Divider, CircularProgress, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Tab, Tabs, Skeleton, Paper, IconButton, Tooltip
} from '@mui/material';
import {
  Verified, PendingActions, Cancel, CheckCircle,
  Person, Assignment, Info, Refresh
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../services/api';

const MotionCard = motion.create(Card);

const STATUS_TABS = ['pending', 'approved', 'rejected'];
const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'error' };
const STATUS_ICONS = { pending: <PendingActions />, approved: <CheckCircle />, rejected: <Cancel /> };

const AdminVerification = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [practitioners, setPractitioners] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id being acted on

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState({ open: false, practitionerId: null, name: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const currentStatus = STATUS_TABS[activeTab];

  const fetchPractitioners = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getPractitioners({ status: currentStatus, page, limit: 8 });
      setPractitioners(res.data || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      showToast('Failed to load practitioners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPractitioners(1); }, [activeTab]);

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
    setTimeout(() => setToast(t => ({ ...t, open: false })), 4000);
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await adminService.approvePractitioner(id);
      showToast('Practitioner approved and now visible in marketplace');
      fetchPractitioners(pagination.page);
    } catch {
      showToast('Approval failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    try {
      setActionLoading(rejectDialog.practitionerId);
      await adminService.rejectPractitioner(rejectDialog.practitionerId, rejectReason || 'Application did not meet requirements');
      showToast('Practitioner application rejected');
      setRejectDialog({ open: false, practitionerId: null, name: '' });
      setRejectReason('');
      fetchPractitioners(pagination.page);
    } catch {
      showToast('Rejection failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (p) => {
    const name = `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`.trim() || 'this practitioner';
    setRejectDialog({ open: true, practitionerId: p._id, name });
    setRejectReason('');
  };

  return (
    <Box sx={{ py: 2 }}>
      {/* Toast */}
      {toast.open && (
        <Alert severity={toast.severity} sx={{ mb: 3, borderRadius: 3 }} onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      )}

      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Verification Queue</Typography>
          <Typography color="text.secondary">Review practitioner applications before they appear in the marketplace.</Typography>
        </Box>
        <Button startIcon={<Refresh />} variant="outlined" onClick={() => fetchPractitioners(1)} sx={{ borderRadius: 2 }}>
          Refresh
        </Button>
      </Stack>

      {/* Status Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          {STATUS_TABS.map((status) => (
            <Tab
              key={status}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{status}</span>
                  <Chip
                    label={counts[status] ?? 0}
                    size="small"
                    color={STATUS_COLORS[status]}
                    sx={{ height: 20, fontWeight: 800, fontSize: '0.7rem' }}
                  />
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Practitioner Cards */}
      <AnimatePresence mode="wait">
        {loading ? (
          <Grid container spacing={3} key="loading">
            {[1,2,3,4].map(i => (
              <Grid item xs={12} key={i}>
                <Skeleton variant="rounded" height={160} sx={{ borderRadius: 4 }} />
              </Grid>
            ))}
          </Grid>
        ) : practitioners.length === 0 ? (
          <Paper key="empty" sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            {STATUS_ICONS[currentStatus]}
            <Typography variant="h6" fontWeight={800} sx={{ mt: 2 }}>No {currentStatus} applications</Typography>
            <Typography color="text.secondary">Check back later or switch tabs to review other queues.</Typography>
          </Paper>
        ) : (
          <Stack spacing={3} key="list">
            {practitioners.map((p, i) => (
              <MotionCard
                key={p._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3} alignItems="flex-start">
                    {/* Avatar + Name */}
                    <Grid item xs={12} sm="auto">
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${p.userId?.firstName}${p.userId?.lastName}`}
                          sx={{ width: 64, height: 64, border: '2px solid #f1f5f9' }}
                        />
                        <Box>
                          <Typography variant="h6" fontWeight={800}>
                            {p.userId?.firstName} {p.userId?.lastName}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight={700}>{p.discipline}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.userId?.email}</Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

                    {/* Details */}
                    <Grid item xs={12} sm>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">ABN</Typography>
                          <Typography variant="body2" fontWeight={600}>{p.abn || '—'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">EXPERIENCE</Typography>
                          <Typography variant="body2" fontWeight={600}>{p.yearsExp ? `${p.yearsExp} yrs` : '—'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">LOCATION</Typography>
                          <Typography variant="body2" fontWeight={600}>{p.userId?.location || '—'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">APPLIED</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-AU') : '—'}
                          </Typography>
                        </Grid>
                      </Grid>

                      {/* Compliance docs */}
                      {p.complianceDocs?.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                          <Assignment sx={{ fontSize: 16, color: 'text.secondary', mt: 0.3 }} />
                          {p.complianceDocs.map((doc) => (
                            <Chip
                              key={doc.docType}
                              label={doc.docType}
                              size="small"
                              color={doc.status === 'approved' ? 'success' : doc.status === 'pending' ? 'warning' : 'default'}
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                            />
                          ))}
                        </Stack>
                      )}

                      {/* Availability flags */}
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                        {p.telehealth && <Chip label="Telehealth" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />}
                        {p.afterHours && <Chip label="After-Hours" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />}
                        {p.weekends && <Chip label="Weekends" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />}
                      </Stack>

                      {/* Rejection reason */}
                      {p.rejectionReason && (
                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2, py: 0.5 }}>
                          <Typography variant="caption"><strong>Rejection reason:</strong> {p.rejectionReason}</Typography>
                        </Alert>
                      )}
                    </Grid>

                    {/* Action Buttons */}
                    <Grid item xs={12} sm="auto">
                      <Stack spacing={1.5} sx={{ alignItems: { sm: 'flex-end' } }}>
                        <Chip
                          label={currentStatus.toUpperCase()}
                          color={STATUS_COLORS[currentStatus]}
                          size="small"
                          sx={{ fontWeight: 800, alignSelf: 'flex-start' }}
                        />
                        {currentStatus === 'pending' && (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={actionLoading === p._id ? <CircularProgress size={14} color="inherit" /> : <Verified />}
                              disabled={actionLoading === p._id}
                              onClick={() => handleApprove(p._id)}
                              sx={{ borderRadius: 2, fontWeight: 700, minWidth: 130 }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<Cancel />}
                              disabled={actionLoading === p._id}
                              onClick={() => openRejectDialog(p)}
                              sx={{ borderRadius: 2, fontWeight: 700, minWidth: 130 }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {currentStatus === 'approved' && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Cancel />}
                            disabled={actionLoading === p._id}
                            onClick={() => openRejectDialog(p)}
                            sx={{ borderRadius: 2, fontWeight: 700, minWidth: 130 }}
                          >
                            Revoke
                          </Button>
                        )}
                        {currentStatus === 'rejected' && (
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            startIcon={<CheckCircle />}
                            disabled={actionLoading === p._id}
                            onClick={() => handleApprove(p._id)}
                            sx={{ borderRadius: 2, fontWeight: 700, minWidth: 130 }}
                          >
                            Re-approve
                          </Button>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </MotionCard>
            ))}
          </Stack>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={(_, v) => fetchPractitioners(v)}
            color="primary"
            size="large"
            sx={{ '& .MuiPaginationItem-root': { fontWeight: 700 } }}
          />
        </Box>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog(d => ({ ...d, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={800}>Reject Application</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            You are rejecting <strong>{rejectDialog.name}</strong>. They will be notified. Provide a reason below:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Incomplete AHPRA registration, missing insurance documentation..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setRejectDialog(d => ({ ...d, open: false }))}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectConfirm}
            disabled={actionLoading !== null}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <Cancel />}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminVerification;
