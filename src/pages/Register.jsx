import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  TextField, Button, Stepper, Step, StepLabel, MenuItem,
  FormControl, InputLabel, Select, Chip, Stack, Divider,
  Paper, IconButton, Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadFile, CheckCircle, PersonOutlined, WorkOutlined,
  AssignmentTurnedIn, Person, MedicalServices, ArrowBack, ArrowForward,
  Info, Language, AccessTime, Close
} from '@mui/icons-material';

const DOCUMENTS = [
  { id: 'ahpra', label: 'AHPRA Registration', required: true },
  { id: 'indemnity', label: 'Professional Indemnity Insurance', required: true },
  { id: 'wwcc', label: 'Working with Children Check', required: false },
  { id: 'id', label: 'Photo ID', required: true },
];

const DISCIPLINE_OPTIONS = [
  'Physiotherapy', 'Psychology', 'Occupational Therapy', 'Speech Pathology',
  'Nutrition & Dietetics', 'Exercise Physiology', 'Social Work', 'Other'
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || 'client');
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
    discipline: '', yearsExp: '', location: '', abn: '',
    telehealth: false, weekends: false, afterHours: false,
    bio: '', languages: '',
  });

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam) setRole(roleParam);
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleUpload = (id) => {
    setUploadedDocs((prev) => ({ ...prev, [id]: true }));
  };

  const nextStep = () => setActiveStep((s) => s + 1);
  const prevStep = () => setActiveStep((s) => s - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    localStorage.setItem('beyond5_user', JSON.stringify({ ...formData, role }));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', display: 'flex', alignItems: 'center', py: 8 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <CheckCircle color="secondary" sx={{ fontSize: 80, mb: 3 }} />
            <Typography variant="h4" fontWeight={800} gutterBottom>Application Received!</Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              {role === 'practitioner' 
                ? "Your compliance documents are being reviewed. We'll notify you within 24-48 hours once your profile is live."
                : "Welcome to Beyond5! Your account is ready. You can now browse and book specialists."}
            </Typography>
            <Button variant="contained" fullWidth size="large" onClick={() => navigate('/dashboard')} sx={{ py: 2, borderRadius: '50px' }}>
              Go to Dashboard
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const steps = role === 'practitioner' ? ['Basic Info', 'Qualifications', 'Documents'] : ['Create Account'];

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
          <Box sx={{ p: 4, bgcolor: 'primary.main', color: '#fff', textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              {role === 'practitioner' ? 'Practitioner Registration' : 'Create Patient Account'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              Join Australia's leading after-hours allied health community.
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {role === 'practitioner' && (
              <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {activeStep === 0 && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="First Name" name="firstName" required value={formData.firstName} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Last Name" name="lastName" required value={formData.lastName} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Email Address" name="email" type="email" required value={formData.email} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Phone Number" name="phone" required value={formData.phone} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Password" name="password" type="password" required value={formData.password} onChange={handleChange} />
                    </Grid>
                  </>
                )}

                {role === 'practitioner' && activeStep === 1 && (
                  <>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Primary Discipline</InputLabel>
                        <Select name="discipline" value={formData.discipline} label="Primary Discipline" onChange={handleChange} required>
                          {DISCIPLINE_OPTIONS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Years of Experience" name="yearsExp" value={formData.yearsExp} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="ABN (Optional)" name="abn" value={formData.abn} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={3} label="Professional Bio" name="bio" value={formData.bio} onChange={handleChange} />
                    </Grid>
                  </>
                )}

                {role === 'practitioner' && activeStep === 2 && (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 4 }}>
                      Please upload the following documents for compliance verification.
                    </Alert>
                    <Stack spacing={2}>
                      {DOCUMENTS.map((doc) => (
                        <Paper key={doc.id} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{doc.label}</Typography>
                            {doc.required && <Typography variant="caption" color="error">Required</Typography>}
                          </Box>
                          <Button 
                            variant={uploadedDocs[doc.id] ? "text" : "outlined"} 
                            color={uploadedDocs[doc.id] ? "secondary" : "primary"}
                            startIcon={uploadedDocs[doc.id] ? <CheckCircle /> : <UploadFile />}
                            onClick={() => handleUpload(doc.id)}
                          >
                            {uploadedDocs[doc.id] ? "Uploaded" : "Upload"}
                          </Button>
                        </Paper>
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between' }}>
                {activeStep > 0 && <Button onClick={prevStep}>Back</Button>}
                <Box sx={{ flexGrow: 1 }} />
                {role === 'practitioner' && activeStep < 2 ? (
                  <Button variant="contained" onClick={nextStep}>Next Step</Button>
                ) : (
                  <Button variant="contained" color="secondary" type="submit" size="large" sx={{ px: 6, borderRadius: '50px' }}>
                    {role === 'practitioner' ? 'Submit Application' : 'Create Account'}
                  </Button>
                )}
              </Box>
            </form>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
