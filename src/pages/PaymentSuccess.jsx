import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { CheckCircle, VideoCall } from '@mui/icons-material';
import { paymentService } from '../services/api';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ranRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const confirmPayment = async () => {
      try {
        const provider = searchParams.get('provider');
        const bookingId = searchParams.get('bookingId');
        const sessionId = searchParams.get('session_id');
        const orderId = searchParams.get('token') || searchParams.get('orderId');
        const paymentId = searchParams.get('paymentId');

        const res = await paymentService.confirmReturn({
          provider,
          bookingId,
          sessionId,
          orderId,
          paymentId
        });

        setBooking(res.data);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Payment could not be verified.');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [searchParams]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#f8fafc', px: 2 }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          {loading ? (
            <Stack spacing={2} alignItems="center">
              <CircularProgress />
              <Typography fontWeight={900}>Verifying payment...</Typography>
              <Typography color="text.secondary">
                Please keep this page open while Beyond5 confirms the transaction with the payment provider.
              </Typography>
            </Stack>
          ) : error ? (
            <Stack spacing={2}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
              <Typography color="text.secondary">
                Your booking has not been confirmed. Please retry payment or contact support if money was deducted.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ borderRadius: 2, fontWeight: 900 }}>
                Go to Dashboard
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2.5} alignItems="center">
              <CheckCircle sx={{ fontSize: 78, color: 'success.main' }} />
              <Box>
                <Typography variant="h4" fontWeight={900}>Booking Request Sent</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Payment has been verified. The practitioner will now accept or decline this appointment request.
                </Typography>
              </Box>

              {booking?.status === 'confirmed' && booking?.serviceType === 'telehealth' && booking?.telehealthRoom?.joinUrl && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<VideoCall />}
                  onClick={() => navigate(booking.telehealthRoom.joinUrl)}
                  sx={{ borderRadius: 2, fontWeight: 900, py: 1.4 }}
                >
                  Open Telehealth Room
                </Button>
              )}

              <Button fullWidth variant="outlined" size="large" onClick={() => navigate('/dashboard')} sx={{ borderRadius: 2, fontWeight: 900, py: 1.4 }}>
                Go to Dashboard
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default PaymentSuccess;
