import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, Typography
} from '@mui/material';
import { Add, Delete, Edit, Refresh } from '@mui/icons-material';
import { adminService } from '../../services/api';

const defaultForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'client',
  status: 'active',
  phone: '',
  location: ''
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '', role: 'all', status: 'all' });
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', user: null });
  const [form, setForm] = useState(defaultForm);
  const [toast, setToast] = useState(null);

  const fetchUsers = async (page = pagination.page) => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({ ...filters, page, limit: pagination.limit });
      setUsers(res.data || []);
      setPagination((prev) => ({ ...prev, ...(res.pagination || {}), page }));
    } catch (err) {
      setToast({ severity: 'error', message: err || 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1), 250);
    return () => clearTimeout(timer);
  }, [filters.role, filters.status, filters.search]);

  const openCreate = () => {
    setForm(defaultForm);
    setDialog({ open: true, mode: 'create', user: null });
  };

  const openEdit = (user) => {
    setForm({ ...defaultForm, ...user, password: '' });
    setDialog({ open: true, mode: 'edit', user });
  };

  const saveUser = async () => {
    try {
      if (dialog.mode === 'create') {
        await adminService.createUser(form);
      } else {
        const { password, email, ...payload } = form;
        await adminService.updateUser(dialog.user._id, payload);
      }
      setDialog({ open: false, mode: 'create', user: null });
      setToast({ severity: 'success', message: 'User saved' });
      fetchUsers();
    } catch (err) {
      setToast({ severity: 'error', message: err || 'Save failed' });
    }
  };

  const deleteUser = async (id) => {
    try {
      await adminService.deleteUser(id);
      setToast({ severity: 'success', message: 'User suspended and soft deleted' });
      fetchUsers();
    } catch (err) {
      setToast({ severity: 'error', message: err || 'Delete failed' });
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>User Management</Typography>
          <Typography color="text.secondary">Create, search, update, suspend, and soft-delete platform users.</Typography>
        </Box>
        <Button startIcon={<Add />} variant="contained" onClick={openCreate}>Create User</Button>
      </Stack>

      {toast && <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ mb: 2 }}>{toast.message}</Alert>}

      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField fullWidth select size="small" label="Role" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              {['all', 'client', 'practitioner', 'admin'].map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField fullWidth select size="small" label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              {['all', 'active', 'suspended'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="outlined" startIcon={<Refresh />} onClick={() => fetchUsers(1)}>Refresh</Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><Chip label={user.role} size="small" /></TableCell>
                <TableCell><Chip label={user.status || 'active'} color={user.status === 'suspended' ? 'error' : 'success'} size="small" /></TableCell>
                <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(user)}><Edit /></IconButton>
                  <IconButton color="error" onClick={() => deleteUser(user._id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && users.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">No users found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total || 0}
          page={(pagination.page || 1) - 1}
          rowsPerPage={pagination.limit || 10}
          onPageChange={(_, nextPage) => fetchUsers(nextPage + 1)}
          onRowsPerPageChange={(e) => setPagination((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
        />
      </TableContainer>

      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Create User' : 'Edit User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth disabled={dialog.mode === 'edit'} label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
            {dialog.mode === 'create' && <Grid item xs={12}><TextField fullWidth type="password" label="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Grid>}
            <Grid item xs={12} sm={6}><TextField fullWidth select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{['client', 'practitioner', 'admin'].map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{['active', 'suspended'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={saveUser}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
