import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EmailOutlined,
  Send,
  AccessTime,
  CheckCircleOutlined,
  MessageOutlined,
  PersonOutlined,
  HelpOutlined,
} from '@mui/icons-material';
import { validation } from '../utils/validation';
import bannerImg from '../assets/banner3.jpg';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

const Contact = () => {
  // Form fields state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({ name: '', email: '', message: '' });

  // Status flags
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Handle field changes and validations
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    setErrors((prev) => ({ ...prev, name: validation.required(value, 'Name') }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setErrors((prev) => ({ ...prev, email: validation.email(value) }));
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    setErrors((prev) => ({ ...prev, message: validation.required(value, 'Message') }));
  };

  // Submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Trigger validation on all fields
    const nameErr = validation.required(name, 'Name');
    const emailErr = validation.email(email);
    const messageErr = validation.required(message, 'Message');

    if (nameErr || emailErr || messageErr) {
      setErrors({ name: nameErr, email: emailErr, message: messageErr });
      setSubmitError('Please correct the validation errors before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      // Web3Forms API Submission
      // Falls back to the hardcoded marketplace key if env is not defined
      const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '0687ce52-b3cd-4d91-a402-51c94c57f7b0';

      const payload = {
        access_key: accessKey,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        subject: `beyond5 web app - Contact Inquiry from ${name.trim()}`,
        from_name: 'beyond5 web app',
      };

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        // Clear fields
        setName('');
        setEmail('');
        setMessage('');
        setErrors({ name: '', email: '', message: '' });
      } else {
        throw new Error(result.message || 'Form submission failed. Please try again.');
      }
    } catch (err) {
      setSubmitError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setSubmitError('');
  };

  return (
    <Box sx={{ bgcolor: '#F7FBFB', minHeight: '80vh', overflowX: 'hidden' }}>
      {/* ── Banner Header ── */}
      <Box
        component="section"
        aria-label="Contact Banner"
        sx={{
          position: 'relative',
          minHeight: { xs: '35vh', md: '40vh' },
          display: 'flex',
          alignItems: 'center',
          color: '#fff',
          backgroundImage: `url(${bannerImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* ── Contact Panels ── */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, mt: { xs: -4, md: -6 }, position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr' },
            gap: 4,
          }}
        >
          {/* ── Left Pane: Support Info ── */}
          <MotionPaper
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            elevation={0}
            sx={{
              p: { xs: 4, md: 5 },
              borderRadius: 4,
              bgcolor: '#0B1D2B',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 32px rgba(11,29,43,0.15)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.5px', mb: 2 }}>
                Support & Inquiries
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, lineHeight: 1.7 }}>
                Beyond5 bridges the gap by making allied health support more flexible. If you have any inquiries regarding practitioner listings, booking services, or registration details, reach out to us.
              </Typography>

              <Stack spacing={4}>
                {/* Email Item */}
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      bgcolor: 'rgba(65, 198, 198, 0.12)',
                      border: '1px solid rgba(65, 198, 198, 0.3)',
                      color: '#41C6C6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <EmailOutlined />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'block', mb: 0.25 }}>
                      EMAIL US DIRECTLY
                    </Typography>
                    <Typography
                      component="a"
                      href="mailto:admin@beyond5ah.com.au"
                      sx={{
                        color: '#41C6C6',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      admin@beyond5ah.com.au
                    </Typography>
                  </Box>
                </Stack>

                {/* Hours Item */}
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      bgcolor: 'rgba(65, 198, 198, 0.12)',
                      border: '1px solid rgba(65, 198, 198, 0.3)',
                      color: '#41C6C6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AccessTime />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'block', mb: 0.25 }}>
                      SUPPORT HOURS
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Monday – Friday, 8:00 AM – 6:00 PM AEST
                    </Typography>
                  </Box>
                </Stack>

                {/* Guarantee Item */}
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      bgcolor: 'rgba(65, 198, 198, 0.12)',
                      border: '1px solid rgba(65, 198, 198, 0.3)',
                      color: '#41C6C6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <HelpOutlined />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'block', mb: 0.25 }}>
                      RESPONSE TIME
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                      We aim to respond to all contact inquiries within 24 business hours.
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>

            {/* Bottom Note */}
            <Box
              sx={{
                mt: 6,
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                Looking for practitioner profiles? Visit our{' '}
                <Box
                  component="a"
                  href="/marketplace"
                  sx={{
                    color: '#41C6C6',
                    fontWeight: 700,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Marketplace
                </Box>
                .
              </Typography>
            </Box>
          </MotionPaper>

          {/* ── Right Pane: Form Card ── */}
          <AnimatePresence mode="wait">
            {!success ? (
              <MotionCard
                key="contact-form"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                sx={{
                  borderRadius: 4,
                  bgcolor: '#fff',
                  boxShadow: '0 12px 48px rgba(11,29,43,0.08)',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: { xs: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={900} sx={{ color: 'text.primary', mb: 1, letterSpacing: '-0.5px' }}>
                    Send a Message
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Fill out the form below and we will get back to you as soon as possible.
                  </Typography>

                  {submitError && (
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderLeft: '4px solid',
                        borderColor: 'error.main',
                        borderRadius: 2,
                      }}
                      onClose={() => setSubmitError('')}
                    >
                      {submitError}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Stack spacing={3}>
                      {/* Name field */}
                      <TextField
                        label="Full Name"
                        fullWidth
                        required
                        value={name}
                        onChange={handleNameChange}
                        error={!!errors.name}
                        helperText={errors.name}
                        disabled={submitting}
                        placeholder="John Doe"
                        InputProps={{
                          startAdornment: (
                            <PersonOutlined sx={{ color: errors.name ? 'error.main' : 'action.active', mr: 1 }} />
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                          },
                        }}
                      />

                      {/* Email field */}
                      <TextField
                        label="Email Address"
                        type="email"
                        fullWidth
                        required
                        value={email}
                        onChange={handleEmailChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled={submitting}
                        placeholder="john.doe@example.com"
                        InputProps={{
                          startAdornment: (
                            <EmailOutlined sx={{ color: errors.email ? 'error.main' : 'action.active', mr: 1 }} />
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                          },
                        }}
                      />

                      {/* Message field */}
                      <TextField
                        label="Message"
                        multiline
                        minRows={4}
                        maxRows={8}
                        fullWidth
                        required
                        value={message}
                        onChange={handleMessageChange}
                        error={!!errors.message}
                        helperText={errors.message}
                        disabled={submitting}
                        placeholder="Write your message here..."
                        InputProps={{
                          startAdornment: (
                            <MessageOutlined sx={{ color: errors.message ? 'error.main' : 'action.active', mr: 1, mt: 1, alignSelf: 'flex-start' }} />
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                          },
                        }}
                      />

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={submitting}
                        sx={{
                          py: 1.6,
                          fontWeight: 800,
                          borderRadius: 2.5,
                          fontSize: '1rem',
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: '0 4px 16px rgba(65, 198, 198, 0.35)',
                          },
                          '&:active': { transform: 'scale(0.985)' },
                          transition: 'box-shadow 160ms ease, transform 100ms ease',
                          mt: 1,
                        }}
                      >
                        {submitting ? (
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <CircularProgress size={18} color="inherit" thickness={3} />
                            <span>Sending Message...</span>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Send sx={{ fontSize: 18 }} />
                            <span>Send Message</span>
                          </Stack>
                        )}
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </MotionCard>
            ) : (
              /* ── Success confirmation screen ── */
              <MotionCard
                key="contact-success"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                sx={{
                  borderRadius: 4,
                  bgcolor: '#fff',
                  boxShadow: '0 12px 48px rgba(11,29,43,0.08)',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: { xs: 4, md: 6 },
                }}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <MotionBox
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'rgba(46, 202, 200, 0.12)',
                      color: '#2ECAC8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 4,
                    }}
                  >
                    <CheckCircleOutlined sx={{ fontSize: 48 }} />
                  </MotionBox>

                  <Typography variant="h4" fontWeight={900} sx={{ color: 'text.primary', mb: 2, letterSpacing: '-0.5px' }}>
                    Message Sent!
                  </Typography>

                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, lineHeight: 1.6 }}>
                    Thank you for contacting us. Your message has been successfully received by our support team. We will respond to you within 24 business hours.
                  </Typography>

                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    sx={{
                      py: 1.2,
                      px: 4,
                      fontWeight: 700,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.02)',
                        borderColor: 'text.primary',
                      },
                    }}
                  >
                    Send Another Message
                  </Button>
                </CardContent>
              </MotionCard>
            )}
          </AnimatePresence>
        </Box>
      </Container>
    </Box>
  );
};

export default Contact;
