import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FormHelperText,
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
  InputAdornment,
  IconButton,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AccessTime,
  AssignmentTurnedIn,
  CheckCircle,
  MedicalServices,
  Person,
  ShieldOutlined,
  UploadFile,
  VerifiedUser,
  Visibility,
  VisibilityOff,
  Email,
  Phone,
  LocationOn,
  Lock,
  Badge,
} from '@mui/icons-material';
import { authService } from '../services/api';
import { validation } from '../utils/validation';
import { DISCIPLINES, FUNDING_PATHWAYS } from '../utils/mockData';

const DOCUMENTS = [
  { id: 'ahpra', label: 'AHPRA Registration', required: true },
  { id: 'indemnity', label: 'Professional Indemnity Insurance', required: true },
  { id: 'wwcc', label: 'Working with Children Check', required: false },
  { id: 'id', label: 'Photo ID', required: true },
];

const DISCIPLINE_OPTIONS = DISCIPLINES.filter((item) => item !== 'All');

const availabilityOptions = [
  { name: 'afterHours', label: 'After hours', icon: <AccessTime sx={{ fontSize: 16 }} /> },
  { name: 'weekends', label: 'Weekends', icon: <AssignmentTurnedIn sx={{ fontSize: 16 }} /> },
  { name: 'telehealth', label: 'Telehealth', icon: <MedicalServices sx={{ fontSize: 16 }} /> },
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
  const { role: urlRole } = useParams();
  const role = urlRole || 'client';
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    sex: '',
    age: '',
    discipline: '',
    gender: '',
    yearsExp: '',
    location: '',
    postcode: '',
    travelArea: '',
    travelsToPostcodes: '',
    abn: '',
    telehealth: false,
    mobile: false,
    weekends: false,
    afterHours: false,
    fundingOptions: [],
    sploseStatus: 'Splose calendar pending integration',
    bio: '',
    languages: '',
    avatar: '',
  });

  const steps = role === 'practitioner'
    ? ['Account', 'Practice', 'Compliance']
    : ['Account'];

  const requiredDocsUploaded = DOCUMENTS
    .filter((doc) => doc.required)
    .every((doc) => uploadedDocs[doc.id]);

  const handleRoleChange = (nextRole) => {
    navigate(`/register/${nextRole}`);
    setActiveStep(0);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: fieldValue }));

    // Validate field on change
    let fieldError = '';
    switch (name) {
      case 'firstName':
        fieldError = validation.firstName(fieldValue);
        break;
      case 'lastName':
        fieldError = validation.lastName(fieldValue);
        break;
      case 'email':
        fieldError = validation.email(fieldValue);
        break;
      case 'phone':
        fieldError = validation.phone(fieldValue);
        break;
      case 'location':
        fieldError = validation.location(fieldValue);
        break;
      case 'password':
        fieldError = validation.password(fieldValue);
        break;
      case 'sex':
        fieldError = validation.required(fieldValue, 'Sex');
        break;
      case 'discipline':
        fieldError = validation.discipline(fieldValue);
        break;
      case 'yearsExp':
        fieldError = validation.yearsExp(fieldValue);
        break;
      case 'abn':
        fieldError = validation.abn(fieldValue);
        break;
      case 'bio':
        fieldError = validation.bio(fieldValue);
        break;
      default:
        fieldError = '';
    }

    setFieldErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleFundingToggle = (funding) => {
    setFormData((prev) => ({
      ...prev,
      fundingOptions: prev.fundingOptions.includes(funding)
        ? prev.fundingOptions.filter((item) => item !== funding)
        : [...prev.fundingOptions, funding],
    }));
  };

  const handleUpload = (id) => {
    setUploadedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const nextStep = () => {
    setError('');

    // Validate current step before proceeding
    if (activeStep === 0) {
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'password', 'sex', 'age'];
      const errors = {};
      let hasError = false;

      requiredFields.forEach((field) => {
        let error = '';
        switch (field) {
          case 'firstName':
            error = validation.firstName(formData.firstName);
            break;
          case 'lastName':
            error = validation.lastName(formData.lastName);
            break;
          case 'email':
            error = validation.email(formData.email);
            break;
          case 'phone':
            error = validation.phone(formData.phone);
            break;
          case 'location':
            error = validation.location(formData.location);
            break;
          case 'password':
            error = validation.password(formData.password);
            break;
          case 'sex':
            error = validation.required(formData.sex, 'Sex');
            break;
          case 'age':
            error = validation.required(formData.age, 'Age');
            break;
          default:
            break;
        }
        if (error) {
          errors[field] = error;
          hasError = true;
        }
      });

      if (hasError) {
        setFieldErrors(errors);
        setError('Please correct the errors above before proceeding.');
        return;
      }
    }

    if (activeStep === 1) {
      const practitionerFields = ['discipline', 'yearsExp'];
      const errors = {};
      let hasError = false;

      practitionerFields.forEach((field) => {
        let error = '';
        switch (field) {
          case 'discipline':
            error = validation.discipline(formData.discipline);
            break;
          case 'yearsExp':
            error = validation.yearsExp(formData.yearsExp);
            break;
          default:
            break;
        }
        if (error) {
          errors[field] = error;
          hasError = true;
        }
      });

      if (hasError) {
        setFieldErrors(errors);
        setError('Please correct the errors above before proceeding.');
        return;
      }
    }

    setActiveStep((step) => step + 1);
  };

  const prevStep = () => {
    setError('');
    setActiveStep((step) => step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all required fields for the role
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'password', 'sex', 'age'];
    if (role === 'practitioner') {
      requiredFields.push('discipline', 'yearsExp');
    }

    const errors = {};
    let hasError = false;

    requiredFields.forEach((field) => {
      let error = '';
      switch (field) {
        case 'firstName':
          error = validation.firstName(formData.firstName);
          break;
        case 'lastName':
          error = validation.lastName(formData.lastName);
          break;
        case 'email':
          error = validation.email(formData.email);
          break;
        case 'phone':
          error = validation.phone(formData.phone);
          break;
        case 'location':
          error = validation.location(formData.location);
          break;
        case 'password':
          error = validation.password(formData.password);
          break;
        case 'sex':
          error = validation.required(formData.sex, 'Sex');
          break;
        case 'age':
          error = validation.required(formData.age, 'Age');
          break;
        case 'discipline':
          error = validation.discipline(formData.discipline);
          break;
        case 'yearsExp':
          error = validation.yearsExp(formData.yearsExp);
          break;
        default:
          break;
      }
      if (error) {
        errors[field] = error;
        hasError = true;
      }
    });

    if (hasError) {
      setFieldErrors(errors);
      setError('Please correct all errors before submitting.');
      return;
    }

    if (role === 'practitioner' && !requiredDocsUploaded) {
      setError('Please mark the required compliance documents before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        password: formData.password,
        sex: formData.sex,
        age: formData.age ? Number(formData.age) : undefined,
        role,
        practitionerProfile: role === 'practitioner'
          ? {
            discipline: formData.discipline,
            gender: formData.gender,
            yearsExp: Number(formData.yearsExp) || 0,
            location: formData.location,
            postcode: formData.postcode,
            travelArea: formData.travelArea,
            travelsToPostcodes: formData.travelsToPostcodes
              ? formData.travelsToPostcodes.split(',').map((item) => item.trim()).filter(Boolean)
              : [],
            abn: formData.abn,
            telehealth: formData.telehealth,
            mobile: formData.mobile,
            weekends: formData.weekends,
            afterHours: formData.afterHours,
            fundingOptions: formData.fundingOptions,
            sploseStatus: formData.sploseStatus,
            bio: formData.bio,
            avatar: formData.avatar,
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
      setError(typeof err === 'string' ? err : err?.message || 'Registration failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', alignItems: 'center', py: 8 }}>
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            sx={{
              p: { xs: 5, md: 7 },
              textAlign: 'center',
              borderRadius: 5,
              border: '1px solid #E2E8F0',
              boxShadow: '0 12px 30px rgba(11,29,43,0.04)'
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'success.light',
                color: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}
            >
              <CheckCircle sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} gutterBottom color="primary.main">
              {role === 'practitioner' ? 'Application Received' : 'Account Created Successfully'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              {role === 'practitioner'
                ? 'Your application is under review. Please log in to track your verification status.'
                : 'Your account is ready. Please log in to start booking allied health services.'}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => navigate(`/login/${role}`)}
              sx={{
                py: 1.8,
                fontWeight: 800,
                borderRadius: 3,
                fontSize: '1rem'
              }}
            >
              Go to Login
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', alignItems: 'center', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          component={motion.div}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            overflow: 'hidden',
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            boxShadow: '0 12px 40px rgba(11,29,43,0.03)'
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.82fr 1.18fr' } }}>
            {/* Left Brand Panel */}
            <Box
              sx={{
                p: { xs: 5, md: 7 },
                bgcolor: 'primary.main',
                color: '#fff',
                position: 'relative',
                backgroundImage: 'radial-gradient(rgba(65, 198, 198, 0.12) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Chip
                  icon={<ShieldOutlined sx={{ color: 'secondary.main !important', fontSize: '14px' }} />}
                  label="Beyond5 Onboarding"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    mb: 4,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                />
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{ color: '#fff', letterSpacing: '-0.02em', mb: 2 }}>
                  Join the Future of Allied Health
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.72)', mb: 6, lineHeight: 1.6 }}>
                  Create an account to search verified practitioners, request custom bookings, and manage care pathways seamlessly.
                </Typography>
              </Box>

              <Stack spacing={3}>
                {[
                  { label: 'Role-Based Journeys', value: role === 'client' ? 'Direct client search & bookings' : 'Structured practitioner onboarding' },
                  { label: 'Compliance & Safety', value: role === 'client' ? '100% verified practitioners' : `${Object.values(uploadedDocs).filter(Boolean).length} of ${DOCUMENTS.length} requirements checked` },
                  { label: 'Funding Access', value: formData.fundingOptions.length ? `${formData.fundingOptions.length} pathways supported` : 'Configurable on profile' },
                ].map((item) => (
                  <Box key={item.label} sx={{ borderLeft: '3px solid #41C6C6', pl: 2.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.25 }}>
                      {item.label}
                    </Typography>
                    <Typography fontWeight={700} sx={{ color: '#fff', fontSize: '0.95rem' }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Right Form Panel */}
            <Box sx={{ p: { xs: 4, sm: 5, md: 7 }, bgcolor: 'background.paper' }}>
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h4" fontWeight={800} color="primary.main" gutterBottom>
                    Create Account
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                    Select your registration type and fill out your profile details.
                  </Typography>
                </Box>

                {/* Role Switcher */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
                        borderRadius: 3,
                        border: '1.5px solid',
                        borderColor: role === item.id ? 'primary.main' : 'divider',
                        bgcolor: role === item.id ? 'rgba(65, 198, 198, 0.06)' : 'background.paper',
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        outline: 'none',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: role === item.id ? 'primary.main' : 'grey.200',
                          color: role === item.id ? '#fff' : 'text.secondary',
                          width: 40,
                          height: 40
                        }}
                      >
                        {item.icon}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={800} color="text.primary" sx={{ fontSize: '0.95rem' }}>{item.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{item.subtitle}</Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>

                {/* Stepper UI (MUI Standard with customization) */}
                <Stepper activeStep={activeStep} alternativeLabel={role === 'practitioner'} sx={{ '& .MuiStepIcon-root.Mui-active': { color: 'secondary.main' }, '& .MuiStepIcon-root.Mui-completed': { color: 'primary.main' } }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel sx={{ '& .MuiStepLabel-label': { fontWeight: 700, fontSize: '0.8rem' } }}>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {error && <Alert severity="error" sx={{ borderRadius: 3, fontWeight: 600 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={3.5}>
                    {/* STEP 0: Account Details */}
                    {activeStep === 0 && (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                        <TextField
                          fullWidth
                          label="First Name"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleChange}
                          error={!!fieldErrors.firstName}
                          helperText={fieldErrors.firstName}
                          disabled={submitting}
                          InputProps={{ sx: { borderRadius: 2.5 } }}
                        />
                        <TextField
                          fullWidth
                          label="Last Name"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleChange}
                          error={!!fieldErrors.lastName}
                          helperText={fieldErrors.lastName}
                          disabled={submitting}
                          InputProps={{ sx: { borderRadius: 2.5 } }}
                        />
                        <TextField
                          fullWidth
                          label="Email Address"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          error={!!fieldErrors.email}
                          helperText={fieldErrors.email}
                          disabled={submitting}
                          placeholder="name@example.com"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment>,
                            sx: { borderRadius: 2.5 },
                            autoComplete: 'email'
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Phone Number"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          error={!!fieldErrors.phone}
                          helperText={fieldErrors.phone}
                          disabled={submitting}
                          placeholder="+61 400 000 000"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Phone color="action" /></InputAdornment>,
                            sx: { borderRadius: 2.5 }
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Location (Suburb, State)"
                          name="location"
                          required
                          value={formData.location}
                          onChange={handleChange}
                          error={!!fieldErrors.location}
                          helperText={fieldErrors.location}
                          disabled={submitting}
                          placeholder="e.g. Melbourne, VIC"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><LocationOn color="action" /></InputAdornment>,
                            sx: { borderRadius: 2.5 }
                          }}
                        />
                        <FormControl fullWidth required error={!!fieldErrors.sex} disabled={submitting}>
                          <InputLabel>Sex</InputLabel>
                          <Select
                            name="sex"
                            value={formData.sex}
                            label="Sex"
                            onChange={handleChange}
                            sx={{ borderRadius: 2.5 }}
                          >
                            <MenuItem value="Male">Male</MenuItem>
                            <MenuItem value="Female">Female</MenuItem>
                          </Select>
                          {fieldErrors.sex && <FormHelperText>{fieldErrors.sex}</FormHelperText>}
                        </FormControl>
                        <TextField
                          fullWidth
                          label="Age"
                          name="age"
                          type="number"
                          required
                          value={formData.age}
                          onChange={handleChange}
                          error={!!fieldErrors.age}
                          helperText={fieldErrors.age}
                          disabled={submitting}
                          placeholder="e.g. 28"
                          inputProps={{ min: 0, max: 120 }}
                          InputProps={{ sx: { borderRadius: 2.5 } }}
                        />
                        <TextField
                          fullWidth
                          label="Password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={handleChange}
                          error={!!fieldErrors.password}
                          helperText={fieldErrors.password || 'At least 6 characters'}
                          disabled={submitting}
                          placeholder="••••••••"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                            sx: { borderRadius: 2.5 },
                            autoComplete: 'new-password'
                          }}
                        />
                      </Box>
                    )}

                    {/* STEP 1: Practice Details (Practitioners Only) */}
                    {role === 'practitioner' && activeStep === 1 && (
                      <Stack spacing={3.5}>
                        {/* Profile Photo Upload card */}
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: 'center',
                            gap: 3,
                            borderRadius: 4,
                            borderColor: 'divider',
                            bgcolor: 'grey.50'
                          }}
                        >
                          <Avatar
                            src={formData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.firstName || 'P'}`}
                            sx={{ width: 88, height: 88, border: '4px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}
                          />
                          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                            <Typography variant="subtitle2" fontWeight={800} color="primary.main" gutterBottom>
                              Profile Portrait
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, lineHeight: 1.4 }}>
                              Select a professional photo. Accepted formats: JPG, PNG. Max 2MB.
                            </Typography>
                            <Stack direction="row" spacing={1} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                              <Button
                                variant="outlined"
                                size="small"
                                component="label"
                                startIcon={<UploadFile />}
                                sx={{ fontWeight: 700, borderRadius: 2 }}
                              >
                                Upload file
                                <input
                                  type="file"
                                  hidden
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 2 * 1024 * 1024) {
                                        alert('Image size exceeds 2MB limit.');
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        setFormData((prev) => ({ ...prev, avatar: event.target.result }));
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </Button>
                              {formData.avatar && (
                                <Button
                                  variant="text"
                                  color="error"
                                  size="small"
                                  sx={{ fontWeight: 700 }}
                                  onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                                >
                                  Remove
                                </Button>
                              )}
                            </Stack>
                          </Box>
                        </Paper>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                          <FormControl fullWidth required error={!!fieldErrors.discipline}>
                            <InputLabel>Primary Discipline</InputLabel>
                            <Select
                              name="discipline"
                              value={formData.discipline}
                              label="Primary Discipline"
                              onChange={handleChange}
                              disabled={submitting}
                              sx={{ borderRadius: 2.5 }}
                            >
                              {DISCIPLINE_OPTIONS.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                              ))}
                            </Select>
                            {fieldErrors.discipline && <FormHelperText>{fieldErrors.discipline}</FormHelperText>}
                          </FormControl>
                          <TextField
                            fullWidth
                            label="Years of Experience"
                            name="yearsExp"
                            type="number"
                            value={formData.yearsExp}
                            onChange={handleChange}
                            error={!!fieldErrors.yearsExp}
                            helperText={fieldErrors.yearsExp}
                            disabled={submitting}
                            inputProps={{ min: 0, max: 70 }}
                            InputProps={{ sx: { borderRadius: 2.5 } }}
                          />
                          <TextField
                            fullWidth
                            label="ABN (Business Registration)"
                            name="abn"
                            value={formData.abn}
                            onChange={handleChange}
                            error={!!fieldErrors.abn}
                            helperText={fieldErrors.abn}
                            disabled={submitting}
                            placeholder="11 digits"
                            InputProps={{
                              startAdornment: <InputAdornment position="start"><Badge color="action" /></InputAdornment>,
                              sx: { borderRadius: 2.5 }
                            }}
                          />
                          <FormControl fullWidth>
                            <InputLabel>Gender (for public profile)</InputLabel>
                            <Select
                              name="gender"
                              value={formData.gender}
                              label="Gender (for public profile)"
                              onChange={handleChange}
                              disabled={submitting}
                              sx={{ borderRadius: 2.5 }}
                            >
                              {['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Not specified'].map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            fullWidth
                            label="Practice Postcode"
                            name="postcode"
                            value={formData.postcode}
                            onChange={(event) => {
                              const value = event.target.value.replace(/\D/g, '').slice(0, 4);
                              handleChange({ target: { name: 'postcode', value } });
                            }}
                            disabled={submitting}
                            inputProps={{ inputMode: 'numeric' }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start"><LocationOn color="action" /></InputAdornment>,
                              sx: { borderRadius: 2.5 }
                            }}
                          />
                          <TextField
                            fullWidth
                            label="Clinical Specialisations"
                            name="languages"
                            value={formData.languages}
                            onChange={handleChange}
                            disabled={submitting}
                            helperText="Separate multiple specialisations with commas."
                            InputProps={{ sx: { borderRadius: 2.5 } }}
                          />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                          <TextField
                            fullWidth
                            label="Travel Area Tagline"
                            name="travelArea"
                            value={formData.travelArea}
                            onChange={handleChange}
                            disabled={submitting}
                            placeholder="e.g. Travels within 20 km of Richmond"
                            helperText="Brief summary of travel capacity."
                            InputProps={{ sx: { borderRadius: 2.5 } }}
                          />
                          <TextField
                            fullWidth
                            label="Postcodes Serviced"
                            name="travelsToPostcodes"
                            value={formData.travelsToPostcodes}
                            onChange={handleChange}
                            disabled={submitting}
                            placeholder="e.g. 3121, 3122, 3141"
                            helperText="Comma separated numerical list."
                            InputProps={{ sx: { borderRadius: 2.5 } }}
                          />
                        </Box>

                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Professional Biography"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          error={!!fieldErrors.bio}
                          helperText={fieldErrors.bio || `${formData.bio.length}/500 chars`}
                          disabled={submitting}
                          InputProps={{ sx: { borderRadius: 2.5 } }}
                        />

                        {/* Availability Checklist */}
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: 'divider' }}>
                          <Typography fontWeight={800} color="primary.main" variant="subtitle2" sx={{ mb: 2 }}>
                            Availability
                          </Typography>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
                            {availabilityOptions.map((option) => (
                              <FormControlLabel
                                key={option.name}
                                control={
                                  <Checkbox
                                    checked={formData[option.name]}
                                    onChange={handleChange}
                                    name={option.name}
                                    disabled={submitting}
                                    sx={{ color: 'divider', '&.Mui-checked': { color: 'secondary.main' } }}
                                  />
                                }
                                label={
                                  <Stack direction="row" spacing={0.75} alignItems="center">
                                    {option.icon}
                                    <Typography variant="body2" fontWeight={600} color="text.secondary">{option.label}</Typography>
                                  </Stack>
                                }
                              />
                            ))}
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.mobile}
                                  onChange={handleChange}
                                  name="mobile"
                                  disabled={submitting}
                                  sx={{ color: 'divider', '&.Mui-checked': { color: 'secondary.main' } }}
                                />
                              }
                              label={<Typography variant="body2" fontWeight={600} color="text.secondary">Mobile / travel to clients</Typography>}
                            />
                          </Stack>
                        </Paper>

                        {/* Funding Checklist */}
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: 'divider' }}>
                          <Typography fontWeight={800} color="primary.main" variant="subtitle2" sx={{ mb: 2 }}>
                            Funding Pathways Supported
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                            {FUNDING_PATHWAYS.map((funding) => (
                              <FormControlLabel
                                key={funding}
                                control={
                                  <Checkbox
                                    checked={formData.fundingOptions.includes(funding)}
                                    onChange={() => handleFundingToggle(funding)}
                                    disabled={submitting}
                                    sx={{ color: 'divider', '&.Mui-checked': { color: 'secondary.main' } }}
                                  />
                                }
                                label={<Typography variant="body2" fontWeight={600} color="text.secondary">{funding}</Typography>}
                              />
                            ))}
                          </Box>
                        </Paper>

                        <TextField
                          fullWidth
                          label="Booking Notes / Platform Preference"
                          name="sploseStatus"
                          value={formData.sploseStatus}
                          onChange={handleChange}
                          disabled={submitting}
                          helperText="Indicate any calendar sync preference or booking limitations."
                          InputProps={{ sx: { borderRadius: 2.5 } }}
                        />
                      </Stack>
                    )}

                    {/* STEP 2: Compliance Checklist (Practitioners Only) */}
                    {role === 'practitioner' && activeStep === 2 && (
                      <Stack spacing={3}>
                        <Alert severity="info" sx={{ borderRadius: 3, fontWeight: 600 }}>
                          Mark compliance requirements. In production, real file uploads can be connected to document cloud storage.
                        </Alert>
                        <Stack spacing={2}>
                          {DOCUMENTS.map((doc) => (
                            <Paper
                              key={doc.id}
                              variant="outlined"
                              sx={{
                                p: 2.5,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 2.5,
                                borderRadius: 3.5,
                                border: '1.5px solid',
                                borderColor: uploadedDocs[doc.id] ? 'secondary.main' : 'divider',
                                bgcolor: uploadedDocs[doc.id] ? 'rgba(65, 198, 198, 0.04)' : 'background.paper',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                  sx={{
                                    bgcolor: uploadedDocs[doc.id] ? 'secondary.main' : 'grey.100',
                                    color: uploadedDocs[doc.id] ? '#fff' : 'text.disabled',
                                    width: 44,
                                    height: 44
                                  }}
                                >
                                  {uploadedDocs[doc.id] ? <CheckCircle /> : <VerifiedUser />}
                                </Avatar>
                                <Box>
                                  <Typography fontWeight={800} color="primary.main" sx={{ fontSize: '0.95rem' }}>
                                    {doc.label}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color={doc.required ? 'error' : 'text.secondary'}
                                    fontWeight={700}
                                  >
                                    {doc.required ? 'Required for verification' : 'Optional requirement'}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Button
                                variant={uploadedDocs[doc.id] ? 'contained' : 'outlined'}
                                color={uploadedDocs[doc.id] ? 'secondary' : 'primary'}
                                startIcon={uploadedDocs[doc.id] ? <CheckCircle /> : <UploadFile />}
                                onClick={() => handleUpload(doc.id)}
                                sx={{
                                  borderRadius: 2.5,
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  px: 2.5,
                                  boxShadow: 'none',
                                  '&:hover': { boxShadow: 'none' }
                                }}
                              >
                                {uploadedDocs[doc.id] ? 'Selected' : 'Mark Ready'}
                              </Button>
                            </Paper>
                          ))}
                        </Stack>
                      </Stack>
                    )}

                    <Divider />

                    {/* Form Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Button
                        disabled={activeStep === 0 || submitting}
                        onClick={prevStep}
                        sx={{ fontWeight: 700, borderRadius: 2.5, px: 3 }}
                      >
                        Back
                      </Button>

                      {role === 'practitioner' && activeStep < steps.length - 1 ? (
                        <Button
                          variant="contained"
                          onClick={nextStep}
                          disabled={submitting || Object.values(fieldErrors).some((e) => e !== '')}
                          sx={{
                            fontWeight: 800,
                            borderRadius: 2.5,
                            px: 4,
                            boxShadow: 'none',
                            '&:hover': { boxShadow: 'none' }
                          }}
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="secondary"
                          type="submit"
                          disabled={submitting || Object.values(fieldErrors).some((e) => e !== '')}
                          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
                          sx={{
                            fontWeight: 800,
                            borderRadius: 2.5,
                            px: 4.5,
                            color: 'primary.contrastText',
                            boxShadow: 'none',
                            '&:hover': {
                              bgcolor: '#35b5b5',
                              boxShadow: 'none',
                            }
                          }}
                        >
                          {submitting ? 'Registering...' : role === 'practitioner' ? 'Submit Application' : 'Create Account'}
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
