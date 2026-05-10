import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, Grid, IconButton, MenuItem, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TextField, Typography
} from '@mui/material';
import { Add, Block, Edit, Refresh } from '@mui/icons-material';
import { adminService } from '../services/api';

const permissionOptions = [
  'users:read',
  'users:write',
  'practitioners:read',
  'practitioners:verify',
  'admins:manage',
  'settings:manage',
  'logs:read'
];

const defaultForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  adminRole: 'support-admin',
  permissions: ['users:read', 'practitioners:read'],
  disabled: false
};

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [dialog, setDialog] = useState({ open: false, mode: 'create', admin: null });
  const [form, setForm] = useState(defaultForm);
  const [toast, setToast] = useState(null);

  const fetchAdmins = async (page = pagination.page) => {
    try {
      const res = await adminService.getAdmins({ page, limit: pagination.limit });
      setAdmins(res.data || []);
      setPagination((prev) => ({ ...prev, ...(res.pagination || {}), page }));
    } catch (err) {
      setToast({ severity: 'error', message: err || 'Failed to load admins' });
    }
  };

  useEffect(() => { fetchAdmins(1); }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setDialog({ open: true, mode: 'create', admin: null });
  };

  const openEdit = (admin) => {
    setForm({
      ...defaultForm,
      firstName: admin.userId?.firstName || '',
      lastName: admin.userId?.lastName || '',
      email: admin.userId?.email || '',
      password: '',
      adminRole: admin.adminRole,
      permissions: admin.permissions || [],
      disabled: admin.disabled
    });
    setDialog({ open: true, mode: 'edit', admin });
  };

  const togglePermission = (permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const saveAdmin = async () => {
    try {
      if (dialog.mode === 'create') {
        await adminService.createAdminProfile(form);
      } else {
        await adminService.updateAdminProfile(dialog.admin._id, {
          adminRole: form.adminRole,
          permissions: form.permissions,
          disabled: form.disabled
        });
      }
      setDialog({ open: false, mode: 'create', admin: null });
      setToast({ severity: 'success', message: 'Admin saved' });
      fetchAdmins();
    } catch (err) {
      setToast({ severity: 'error', message: err || 'Save failed' });
    }
  };

  const disableAdmin = async (admin) => {
    try {
      await adminService.updateAdminProfile(admin._id, { disabled: !admin.disabled });
      setToast({ severity: 'success', message: admin.disabled ? 'Admin enabled' : 'Admin disabled' });
      fetchAdmins();
    } catch (err) {
      setToast({ severity: 'error', message: err || 'Update failed' });
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Admin Management</Typography>
          <Typography color="text.secondary">Manage internal admin roles, permissions, and account access.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<Refresh />} variant="outlined" onClick={() => fetchAdmins(1)}>Refresh</Button>
          <Button startIcon={<Add />} variant="contained" onClick={openCreate}>Create Admin</Button>
        </Stack>
      </Stack>

      {toast && <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ mb: 2 }}>{toast.message}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Admin role</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin._id} hover>
                <TableCell>{admin.userId?.firstName} {admin.userId?.lastName}</TableCell>
                <TableCell>{admin.userId?.email}</TableCell>
                <TableCell><Chip label={admin.adminRole} size="small" /></TableCell>
                <TableCell>{(admin.permissions || []).slice(0, 3).map((item) => <Chip key={item} label={item} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}</TableCell>
                <TableCell><Chip label={admin.disabled ? 'disabled' : 'active'} color={admin.disabled ? 'error' : 'success'} size="small" /></TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(admin)}><Edit /></IconButton>
                  <IconButton color={admin.disabled ? 'success' : 'error'} onClick={() => disableAdmin(admin)}><Block /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total || 0}
          page={(pagination.page || 1) - 1}
          rowsPerPage={pagination.limit || 10}
          onPageChange={(_, page) => fetchAdmins(page + 1)}
          onRowsPerPageChange={(e) => setPagination((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
        />
      </TableContainer>

      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="md" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Create Admin' : 'Edit Admin'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {dialog.mode === 'create' && (
              <>
                <Grid item xs={12} sm={6}><TextField fullWidth label="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth type="password" label="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Admin role" value={form.adminRole} onChange={(e) => setForm({ ...form, adminRole: e.target.value })}>
                {['super-admin', 'support-admin', 'moderator'].map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Checkbox checked={form.disabled} onChange={(e) => setForm({ ...form, disabled: e.target.checked })} />} label="Disable account" />
            </Grid>
            <Grid item xs={12}>
              <Typography fontWeight={800} sx={{ mb: 1 }}>Permissions</Typography>
              <Grid container spacing={1}>
                {permissionOptions.map((permission) => (
                  <Grid item xs={12} sm={6} md={4} key={permission}>
                    <FormControlLabel
                      control={<Checkbox checked={form.permissions.includes(permission)} onChange={() => togglePermission(permission)} />}
                      label={permission}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={saveAdmin}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminManagement;
