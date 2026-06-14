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
  const { role: urlRole } = useParams();
  const role = urlRole || 'client';
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

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
      <Box sx={{ bgcolor: '#f3faf7', minHeight: '100vh', display: 'flex', alignItems: 'center', py: 8 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: 2 }}>
            <CheckCircle color="secondary" sx={{ fontSize: 72, mb: 3 }} />
            <Typography variant="h4" fontWeight={900} gutterBottom>
              {role === 'practitioner' ? 'Application received' : 'Account created successfully'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              {role === 'practitioner'
                ? 'Your application is under review. Please login to track your verification status.'
                : 'Your account is ready. Please login to start booking allied health services.'}
            </Typography>
            <Button variant="contained" fullWidth size="large" onClick={() => navigate(`/login/${role}`)} sx={{ py: 1.6, fontWeight: 900 }}>
              Go to Login
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
                bgcolor: '#13283B',
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
                  { label: 'Funding', value: formData.fundingOptions.length ? `${formData.fundingOptions.length} pathways selected` : 'Ready to configure' },
                ].map((item) => (
                  <Box key={item.label} sx={{ borderLeft: '3px solid #41C6C6', pl: 2 }}>
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
                          placeholder="your.email@example.com"
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
                          placeholder="+61 2 xxxx xxxx"
                        />
                        <TextField
                          fullWidth
                          label="Location"
                          name="location"
                          required
                          value={formData.location}
                          onChange={handleChange}
                          error={!!fieldErrors.location}
                          helperText={fieldErrors.location}
                          disabled={submitting}
                        />
                        <FormControl fullWidth required error={!!fieldErrors.sex} disabled={submitting}>
                          <InputLabel>Sex</InputLabel>
                          <Select
                            name="sex"
                            value={formData.sex}
                            label="Sex"
                            onChange={handleChange}
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
                        />
                        <TextField
                          fullWidth
                          label="Password"
                          name="password"
                          type="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          error={!!fieldErrors.password}
                          helperText={fieldErrors.password || 'Use at least 6 characters.'}
                          disabled={submitting}
                          placeholder="••••••••"
                        />
                      </Box>
                    )}

                    {role === 'practitioner' && activeStep === 1 && (
                      <Stack spacing={3}>
                        {/* Profile Photo Upload */}
                        <Paper variant="outlined" sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 3, borderRadius: 2 }}>
                          <Avatar
                            src={formData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.firstName || 'P'}`}
                            sx={{ width: 80, height: 80, border: '1px solid #ddd' }}
                          />
                          <Box>
                            <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                              Profile Photo
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                              Select a professional portrait. Accepted formats: JPG, PNG. Max size: 2MB.
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                component="label"
                                startIcon={<UploadFile />}
                                sx={{ fontWeight: 700 }}
                              >
                                Choose Photo
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
                          />
                          <TextField
                            fullWidth
                            label="ABN"
                            name="abn"
                            value={formData.abn}
                            onChange={handleChange}
                            error={!!fieldErrors.abn}
                            helperText={fieldErrors.abn}
                            disabled={submitting}
                            placeholder="11 digits"
                          />
                          <FormControl fullWidth>
                            <InputLabel>Gender shown on profile</InputLabel>
                            <Select
                              name="gender"
                              value={formData.gender}
                              label="Gender shown on profile"
                              onChange={handleChange}
                              disabled={submitting}
                            >
                              {['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Not specified'].map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            fullWidth
                            label="Practice postcode"
                            name="postcode"
                            value={formData.postcode}
                            onChange={(event) => {
                              const value = event.target.value.replace(/\D/g, '').slice(0, 4);
                              handleChange({ target: { name: 'postcode', value } });
                            }}
                            disabled={submitting}
                            inputProps={{ inputMode: 'numeric' }}
                          />
                          <TextField
                            fullWidth
                            label="Specialisations"
                            name="languages"
                            value={formData.languages}
                            onChange={handleChange}
                            disabled={submitting}
                            helperText="Separate multiple items with commas."
                          />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                          <TextField
                            fullWidth
                            label="Travel area"
                            name="travelArea"
                            value={formData.travelArea}
                            onChange={handleChange}
                            disabled={submitting}
                            helperText="Example: Travels within 20 km of Brunswick."
                          />
                          <TextField
                            fullWidth
                            label="Postcodes you will travel to"
                            name="travelsToPostcodes"
                            value={formData.travelsToPostcodes}
                            onChange={handleChange}
                            disabled={submitting}
                            helperText="Separate postcodes with commas."
                          />
                        </Box>

                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Professional Bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          error={!!fieldErrors.bio}
                          helperText={fieldErrors.bio || `${formData.bio.length}/500 characters`}
                          disabled={submitting}
                        />

                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                          <Typography fontWeight={900} gutterBottom>Availability</Typography>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            {availabilityOptions.map((option) => (
                              <FormControlLabel
                                key={option.name}
                                control={<Checkbox checked={formData[option.name]} onChange={handleChange} name={option.name} disabled={submitting} />}
                                label={
                                  <Stack direction="row" spacing={0.75} alignItems="center">
                                    {option.icon}
                                    <Typography variant="body2">{option.label}</Typography>
                                  </Stack>
                                }
                              />
                            ))}
                            <FormControlLabel
                              control={<Checkbox checked={formData.mobile} onChange={handleChange} name="mobile" disabled={submitting} />}
                              label={<Typography variant="body2">Mobile / travel to clients</Typography>}
                            />
                          </Stack>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                          <Typography fontWeight={900} gutterBottom>Funding pathways accepted</Typography>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }}>
                            {FUNDING_PATHWAYS.map((funding) => (
                              <FormControlLabel
                                key={funding}
                                control={<Checkbox checked={formData.fundingOptions.includes(funding)} onChange={() => handleFundingToggle(funding)} disabled={submitting} />}
                                label={<Typography variant="body2">{funding}</Typography>}
                              />
                            ))}
                          </Stack>
                        </Paper>

                        <TextField
                          fullWidth
                          label="Splose calendar / booking availability notes"
                          name="sploseStatus"
                          value={formData.sploseStatus}
                          onChange={handleChange}
                          disabled={submitting}
                          helperText="Use this to capture how Splose availability should be surfaced while API integration is confirmed."
                        />
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
                        <Button
                          variant="contained"
                          onClick={nextStep}
                          disabled={submitting || Object.values(fieldErrors).some((e) => e !== '')}
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
