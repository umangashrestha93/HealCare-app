import { useState } from 'react';
import { 
  Box, Container, Typography, TextField, Button, 
  Card, CardContent, Stack, Alert, Snackbar,
  Grid, Avatar
} from '@mui/material';
import { PersonAdd, AdminPanelSettings, Security } from '@mui/icons-material';
import api from '../services/api';

const AdminManagement = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/admin/users/admin', formData);
      setSuccess(true);
      setFormData({ firstName: '', lastName: '', email: '', password: '' });
    } catch (err) {
      setError(err || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" fontWeight={900} gutterBottom>
              Admin Management
            </Typography>
            <Typography color="text.secondary">
              Provision new administrative accounts and manage system access.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <PersonAdd />
                    </Avatar>
                    <Typography variant="h6" fontWeight={800}>
                      Create New Admin
                    </Typography>
                  </Stack>

                  {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                  <form onSubmit={handleSubmit}>
                    <Stack spacing={2.5}>
                      <Stack direction="row" spacing={2}>
                        <TextField
                          label="First Name"
                          fullWidth
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                        <TextField
                          label="Last Name"
                          fullWidth
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        />
                      </Stack>
                      <TextField
                        label="Email Address"
                        type="email"
                        fullWidth
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                      <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        required
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        helperText="Ensure password is secure (8+ characters)"
                      />
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="secondary"
                        fullWidth 
                        size="large"
                        disabled={loading}
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                      >
                        {loading ? 'Processing...' : 'Create Admin Account'}
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
                    Security Guidelines
                  </Typography>
                  <Stack spacing={3}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Stack direction="row" spacing={2}>
                        <Security color="primary" />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>Least Privilege</Typography>
                          <Typography variant="body2" color="text.secondary">Only create admin accounts for users who require system-wide access.</Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Stack direction="row" spacing={2}>
                        <AdminPanelSettings color="secondary" />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>Audit Logs</Typography>
                          <Typography variant="body2" color="text.secondary">All actions performed by new admins are logged for security auditing.</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>

        <Snackbar 
          open={success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess(false)}
          message="New admin account created successfully"
        />
      </Container>
    </Box>
  );
};

export default AdminManagement;
