import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { CreditCard, Lock } from '@mui/icons-material';
import { paymentService } from '../services/api';

const DemoPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bookingId = searchParams.get('bookingId');
  const paymentId = searchParams.get('paymentId');

  const approveDemoPayment = async () => {
    try {
      setError('');
      setLoading(true);
      await paymentService.confirmReturn({
        provider: 'demo',
        bookingId,
        paymentId
      });
      navigate(`/payment/success?provider=demo&bookingId=${bookingId}&paymentId=${paymentId}`, { replace: true });
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Demo payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#f8fafc', px: 2 }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 54, height: 54, borderRadius: 3, bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center' }}>
                <CreditCard />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={900}>Secure Demo Checkout</Typography>
                <Typography color="text.secondary">Local development payment approval.</Typography>
              </Box>
            </Stack>

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Production card payments should use Stripe Checkout or Stripe Elements. This demo screen exists only when live payment keys are not configured.
            </Alert>

            <Divider />

            <Stack direction="row" spacing={1} alignItems="center">
              <Lock sx={{ color: 'success.main' }} />
              <Typography variant="body2" color="text.secondary">
                No raw card number is collected or stored by Beyond5.
              </Typography>
            </Stack>

            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

            <Button
              variant="contained"
              size="large"
              onClick={approveDemoPayment}
              disabled={loading || !bookingId || !paymentId}
              sx={{ borderRadius: 2, fontWeight: 900, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Approve Demo Payment'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(`/payment/failure?provider=demo&bookingId=${bookingId}`)}
              sx={{ borderRadius: 2, fontWeight: 900, py: 1.5 }}
            >
              Cancel Payment
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default DemoPayment;
