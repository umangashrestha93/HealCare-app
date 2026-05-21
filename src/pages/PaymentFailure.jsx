import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { ErrorOutlineOutlined } from '@mui/icons-material';
import { paymentService } from '../services/api';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ranRef = useRef(false);
  const [message, setMessage] = useState('Payment was cancelled or failed. Your booking has not been confirmed.');

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const bookingId = searchParams.get('bookingId');
    if (!bookingId) return;

    paymentService.cancelPayment({ bookingId })
      .then((res) => setMessage(res.message || 'Payment was cancelled or failed. Your booking has not been confirmed.'))
      .catch(() => {
        setMessage('Payment was not completed. Your booking remains unconfirmed.');
      });
  }, [searchParams]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#f8fafc', px: 2 }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Stack spacing={2.5} alignItems="center">
            <ErrorOutlineOutlined sx={{ fontSize: 78, color: 'error.main' }} />
            <Box>
              <Typography variant="h4" fontWeight={900}>Payment Not Completed</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                The booking is still pending and will not appear as confirmed.
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ width: '100%', borderRadius: 2 }}>{message}</Alert>
            <Button fullWidth variant="contained" size="large" onClick={() => navigate('/marketplace')} sx={{ borderRadius: 2, fontWeight: 900, py: 1.4 }}>
              Book Again
            </Button>
            <Button fullWidth variant="outlined" size="large" onClick={() => navigate('/dashboard')} sx={{ borderRadius: 2, fontWeight: 900, py: 1.4 }}>
              Go to Dashboard
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default PaymentFailure;
