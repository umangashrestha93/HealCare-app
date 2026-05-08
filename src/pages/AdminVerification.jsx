import { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Chip, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Stack, Divider,
  TextField, InputAdornment,
  Grid,
  Avatar
} from '@mui/material';
import { 
  Visibility, CheckCircle, Cancel, Info, 
  Search, FilterList, Description, History
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const AdminVerification = () => {
  const [selectedPractitioner, setSelectedPractitioner] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const pendingPractitioners = [
    { id: 1, name: 'Dr. Sarah Wilson', discipline: 'Physiotherapy', date: '2026-05-06', status: 'Pending', docs: ['AHPRA', 'Indemnity'] },
    { id: 2, name: 'Marcus Chen', discipline: 'Psychology', date: '2026-05-05', status: 'Reviewing', docs: ['AHPRA', 'ID'] },
    { id: 3, name: 'Emma Thompson', discipline: 'Occupational Therapy', date: '2026-05-05', status: 'Pending', docs: ['AHPRA', 'Indemnity', 'WWCC'] },
    { id: 4, name: 'James Miller', discipline: 'Speech Pathology', date: '2026-05-04', status: 'Incomplete', docs: ['ID'] },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Reviewing': return 'info';
      case 'Approved': return 'success';
      case 'Incomplete': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Verification Queue</Typography>
          <Typography color="text.secondary">Review compliance documents for new practitioners</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <TextField 
            size="small"
            placeholder="Search practitioners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: '#fff' }
            }}
          />
          <Button startIcon={<FilterList />} variant="outlined" sx={{ borderRadius: 2 }}>Filter</Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Practitioner Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Discipline</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Submission Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Documents</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingPractitioners.map((p) => (
              <TableRow key={p.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Typography fontWeight={700}>{p.name}</Typography>
                </TableCell>
                <TableCell>{p.discipline}</TableCell>
                <TableCell>{p.date}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {p.docs.map(doc => (
                      <Chip key={doc} label={doc} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={p.status} 
                    size="small" 
                    color={getStatusColor(p.status)}
                    sx={{ fontWeight: 700, borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button 
                    variant="contained" 
                    size="small" 
                    startIcon={<Visibility />}
                    onClick={() => setSelectedPractitioner(p)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                  >
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Document Review Modal */}
      <Dialog 
        open={Boolean(selectedPractitioner)} 
        onClose={() => setSelectedPractitioner(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight={800}>Compliance Review</Typography>
              <Typography variant="caption" color="text.secondary">Reviewing files for {selectedPractitioner?.name}</Typography>
            </Box>
            <Chip label="Verification ID: #V-8821" variant="outlined" size="small" />
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Compliance Documents</Typography>
              <Stack spacing={2}>
                {[
                  { name: 'AHPRA Registration Certificate', type: 'PDF', size: '1.2 MB' },
                  { name: 'Professional Indemnity Insurance', type: 'PDF', size: '2.4 MB' },
                  { name: 'Working With Children Check', type: 'Image', size: '840 KB' },
                ].map((doc, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 3, '&:hover': { bgcolor: '#f8fafc' } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.light' }}><Description /></Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{doc.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{doc.type} • {doc.size}</Typography>
                        </Box>
                      </Stack>
                      <Button size="small">View File</Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Review Decision</Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={2}>
                  <Button variant="contained" color="success" fullWidth startIcon={<CheckCircle />} sx={{ borderRadius: 2 }}>
                    Approve All Documents
                  </Button>
                  <Button variant="outlined" color="error" fullWidth startIcon={<Cancel />} sx={{ borderRadius: 2 }}>
                    Reject Application
                  </Button>
                  <Button variant="outlined" color="primary" fullWidth startIcon={<Info />} sx={{ borderRadius: 2 }}>
                    Request More Info
                  </Button>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="caption" color="text.secondary">Review History</Typography>
                  <Stack spacing={1}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                      <History fontSize="inherit" sx={{ mr: 0.5 }} /> System: Applied on 2026-05-06
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setSelectedPractitioner(null)} color="inherit">Close</Button>
          <Button variant="contained" onClick={() => setSelectedPractitioner(null)}>Save Progress</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminVerification;
