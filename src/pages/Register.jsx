import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AccessTime,
  AssignmentTurnedIn,
  CheckCircle,
  MedicalServices,
  Person,
  ShieldOutlined,
  UploadFile,
  VerifiedUser,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DOCUMENTS = [
  { id: 'ahpra', label: 'AHPRA Registration', required: true },
  { id: 'indemnity', label: 'Professional Indemnity Insurance', required: true },
  { id: 'wwcc', label: 'Working with Children Check', required: false },
  { id: 'id', label: 'Photo ID', required: true },
];

const DISCIPLINE_OPTIONS = [
  'Physiotherapy',
  'Psychology',
  'Occupational Therapy',
  'Speech Pathology',
  'Nutrition & Dietetics',
  'Exercise Physiology',
  'Social Work',
  'Other',
];

const availabilityOptions = [
  { name: 'afterHours', label: 'After hours', icon: <AccessTime /> },
  { name: 'weekends', label: 'Weekends', icon: <AssignmentTurnedIn /> },
  { name: 'telehealth', label: 'Telehealth', icon: <MedicalServices /> },
];

const roleCards = [
  {
    id: 'client',
    title: 'Client',
    subtitle: 'Book flexible allied health support.',
    icon: <Person />,
  },
  {
    id: 'practitioner',
    title: 'Practitioner',
    subtitle: 'Apply to join the Beyond5 network.',
    icon: <MedicalServices />,
  },
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'practitioner' ? 'practitioner' : 'client';
  const [role, setRole] = useState(initialRole);
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    discipline: '',
    yearsExp: '',
    location: '',
    abn: '',
    telehealth: false,
    weekends: false,
    afterHours: false,
    bio: '',
    languages: '',
  });

  const steps = role === 'practitioner'
    ? ['Account', 'Practice', 'Compliance']
    : ['Account'];

  const requiredDocsUploaded = DOCUMENTS
    .filter((doc) => doc.required)
    .every((doc) => uploadedDocs[doc.id]);

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setActiveStep(0);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleUpload = (id) => {
    setUploadedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const nextStep = () => {
    setError('');
    setActiveStep((step) => step + 1);
  };

  const prevStep = () => {
    setError('');
    setActiveStep((step) => step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'practitioner' && !requiredDocsUploaded) {
      setError('Please mark the required compliance documents before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        password: formData.password,
        role,
        practitionerProfile: role === 'practitioner'
          ? {
            discipline: formData.discipline,
            yearsExp: Number(formData.yearsExp) || 0,
            location: formData.location,
            abn: formData.abn,
            telehealth: formData.telehealth,
            weekends: formData.weekends,
            afterHours: formData.afterHours,
            bio: formData.bio,
            specializations: formData.languages
              ? formData.languages.split(',').map((item) => item.trim()).filter(Boolean)
              : [],
            complianceDocs: DOCUMENTS
              .filter((doc) => uploadedDocs[doc.id])
              .map((doc) => ({ docType: doc.label })),
          }
          : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err || 'Registration failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box sx={{ bgcolor: '#f3faf7', minHeight: '100vh', display: 'flex', alignItems: 'center', py: 8 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: 2 }}>
            <CheckCircle color="secondary" sx={{ fontSize: 72, mb: 3 }} />
            <Typography variant="h4" fontWeight={900} gutterBottom>
              {role === 'practitioner' ? 'Application received' : 'Account created'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              {role === 'practitioner'
                ? "Your profile is pending verification. You'll see onboarding progress in your dashboard."
                : 'You can now search, compare, and book after-hours allied health services.'}
            </Typography>
            <Button variant="contained" fullWidth size="large" onClick={() => navigate('/dashboard')} sx={{ py: 1.6, fontWeight: 900 }}>
              Go to Dashboard
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f3faf7', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Paper
          component={motion.div}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ overflow: 'hidden', borderRadius: 2 }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.86fr 1.14fr' } }}>
            <Box
              sx={{
                p: { xs: 4, md: 6 },
                bgcolor: '#0f3f3c',
                color: '#fff',
              }}
            >
              <Chip
                icon={<ShieldOutlined />}
                label="Beyond5 onboarding"
                sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', mb: 3 }}
              />
              <Typography variant="h3" fontWeight={900} gutterBottom sx={{ color: '#fff' }}>
                Join a flexible allied health marketplace
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.78)', mb: 5 }}>
                Create the right account for your role and build the foundations for search, booking, verification, and dashboards.
              </Typography>

              <Stack spacing={2.5}>
                {[
                  { label: 'Role-based access', value: role === 'client' ? 'Client journey' : 'Practitioner onboarding' },
                  { label: 'Verification', value: role === 'client' ? 'Secure account' : `${Object.values(uploadedDocs).filter(Boolean).length}/${DOCUMENTS.length} documents` },
                  { label: 'Availability', value: formData.afterHours || formData.weekends || formData.telehealth ? 'Flexible options selected' : 'Ready to configure' },
                ].map((item) => (
                  <Box key={item.label} sx={{ borderLeft: '3px solid #22c55e', pl: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.64)' }}>
                      {item.label}
                    </Typography>
                    <Typography fontWeight={800}>{item.value}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box sx={{ p: { xs: 3, md: 5 } }}>
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h4" fontWeight={900} gutterBottom>
                    Create account
                  </Typography>
                  <Typography color="text.secondary">
                    Select your role and complete the required details.
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {roleCards.map((item) => (
                    <Paper
                      key={item.id}
                      component="button"
                      type="button"
                      onClick={() => handleRoleChange(item.id)}
                      sx={{
                        p: 2.5,
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: role === item.id ? 'primary.main' : 'divider',
                        bgcolor: role === item.id ? 'rgba(0, 74, 153, 0.04)' : 'background.paper',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: role === item.id ? 'primary.main' : 'text.secondary' }}>
                          {item.icon}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={900}>{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.subtitle}</Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Box>

                <Stepper activeStep={activeStep} alternativeLabel={role === 'practitioner'}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {error && <Alert severity="error">{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    {activeStep === 0 && (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                        <TextField fullWidth label="First Name" name="firstName" required value={formData.firstName} onChange={handleChange} />
                        <TextField fullWidth label="Last Name" name="lastName" required value={formData.lastName} onChange={handleChange} />
                        <TextField fullWidth label="Email Address" name="email" type="email" required value={formData.email} onChange={handleChange} />
                        <TextField fullWidth label="Phone Number" name="phone" required value={formData.phone} onChange={handleChange} />
                        <TextField fullWidth label="Location" name="location" required value={formData.location} onChange={handleChange} />
                        <TextField fullWidth label="Password" name="password" type="password" required value={formData.password} onChange={handleChange} helperText="Use at least 8 characters." />
                      </Box>
                    )}

                    {role === 'practitioner' && activeStep === 1 && (
                      <Stack spacing={3}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                          <FormControl fullWidth required>
                            <InputLabel>Primary Discipline</InputLabel>
                            <Select name="discipline" value={formData.discipline} label="Primary Discipline" onChange={handleChange}>
                              {DISCIPLINE_OPTIONS.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField fullWidth label="Years of Experience" name="yearsExp" type="number" value={formData.yearsExp} onChange={handleChange} />
                          <TextField fullWidth label="ABN" name="abn" value={formData.abn} onChange={handleChange} />
                          <TextField fullWidth label="Specialisations" name="languages" value={formData.languages} onChange={handleChange} helperText="Separate multiple items with commas." />
                        </Box>

                        <TextField fullWidth multiline rows={4} label="Professional Bio" name="bio" value={formData.bio} onChange={handleChange} />

                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                          <Typography fontWeight={900} gutterBottom>Availability</Typography>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            {availabilityOptions.map((option) => (
                              <FormControlLabel
                                key={option.name}
                                control={<Checkbox checked={formData[option.name]} onChange={handleChange} name={option.name} />}
                                label={
                                  <Stack direction="row" spacing={0.75} alignItems="center">
                                    {option.icon}
                                    <Typography variant="body2">{option.label}</Typography>
                                  </Stack>
                                }
                              />
                            ))}
                          </Stack>
                        </Paper>
                      </Stack>
                    )}

                    {role === 'practitioner' && activeStep === 2 && (
                      <Stack spacing={2}>
                        <Alert severity="info">
                          Required documents are marked before submission; real file upload can be connected to storage later.
                        </Alert>
                        {DOCUMENTS.map((doc) => (
                          <Paper
                            key={doc.id}
                            variant="outlined"
                            sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ bgcolor: uploadedDocs[doc.id] ? 'secondary.main' : 'grey.200', color: uploadedDocs[doc.id] ? '#fff' : 'text.secondary' }}>
                                {uploadedDocs[doc.id] ? <CheckCircle /> : <VerifiedUser />}
                              </Avatar>
                              <Box>
                                <Typography fontWeight={900}>{doc.label}</Typography>
                                <Typography variant="caption" color={doc.required ? 'error' : 'text.secondary'}>
                                  {doc.required ? 'Required' : 'Optional'}
                                </Typography>
                              </Box>
                            </Stack>
                            <Button
                              variant={uploadedDocs[doc.id] ? 'contained' : 'outlined'}
                              color={uploadedDocs[doc.id] ? 'secondary' : 'primary'}
                              startIcon={uploadedDocs[doc.id] ? <CheckCircle /> : <UploadFile />}
                              onClick={() => handleUpload(doc.id)}
                            >
                              {uploadedDocs[doc.id] ? 'Ready' : 'Mark ready'}
                            </Button>
                          </Paper>
                        ))}
                      </Stack>
                    )}

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Button disabled={activeStep === 0 || submitting} onClick={prevStep}>
                        Back
                      </Button>
                      {role === 'practitioner' && activeStep < steps.length - 1 ? (
                        <Button variant="contained" onClick={nextStep}>
                          Continue
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="secondary"
                          type="submit"
                          disabled={submitting}
                          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
                          sx={{ fontWeight: 900 }}
                        >
                          {submitting ? 'Creating...' : role === 'practitioner' ? 'Submit Application' : 'Create Account'}
                        </Button>
                      )}
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
