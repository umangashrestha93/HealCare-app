import { useEffect, useState } from 'react';
import {
  Alert, Box, Chip, MenuItem, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, Typography
} from '@mui/material';
import { adminService } from '../../services/api';

const ComplianceLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [action, setAction] = useState('all');
  const [toast, setToast] = useState(null);

  const fetchLogs = async (page = pagination.page) => {
    try {
      const res = await adminService.getComplianceLogs({ action, page, limit: pagination.limit });
      setLogs(res.data || []);
      setPagination((prev) => ({ ...prev, ...(res.pagination || {}), page }));
    } catch (err) {
      setToast({ severity: 'error', message: err || 'Failed to load logs' });
    }
  };

  useEffect(() => { fetchLogs(1); }, [action]);

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Compliance Logs</Typography>
          <Typography color="text.secondary">Audit trail for practitioner verification and compliance decisions.</Typography>
        </Box>
        <TextField select size="small" label="Action" value={action} onChange={(e) => setAction(e.target.value)} sx={{ minWidth: 190 }}>
          {['all', 'approved', 'rejected', 'status-updated', 'note-added'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
      </Stack>
      {toast && <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ mb: 2 }}>{toast.message}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Practitioner</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id} hover>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                <TableCell>{log.practitionerId?.userId ? `${log.practitionerId.userId.firstName} ${log.practitionerId.userId.lastName}` : '-'}</TableCell>
                <TableCell>{log.adminId ? `${log.adminId.firstName} ${log.adminId.lastName}` : '-'}</TableCell>
                <TableCell><Chip label={log.action} size="small" /></TableCell>
                <TableCell>{log.fromStatus || '-'} → {log.toStatus || '-'}</TableCell>
                <TableCell>{log.note || '-'}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && <TableRow><TableCell colSpan={6} align="center">No compliance logs found</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total || 0}
          page={(pagination.page || 1) - 1}
          rowsPerPage={pagination.limit || 10}
          onPageChange={(_, page) => fetchLogs(page + 1)}
          onRowsPerPageChange={(e) => setPagination((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
        />
      </TableContainer>
    </Box>
  );
};

export default ComplianceLogsPage;
