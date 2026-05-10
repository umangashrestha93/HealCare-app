import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Box, CircularProgress, Container, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';

const ChatShell = styled(Paper)(({ theme }) => ({
  height: 'calc(100vh - 128px)',
  minHeight: 560,
  display: 'flex',
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  backgroundColor: '#ffffff',
  [theme.breakpoints.down('md')]: {
    height: 'calc(100vh - 96px)',
    minHeight: 0,
    borderRadius: 0,
  },
}));

const Chat = () => {
  const { userId } = useParams();
  const location = useLocation();
  const { loading, selectUserById, setSelectedUser } = useChat();

  useEffect(() => {
    const routeRecipient = location.state?.recipient;

    if (routeRecipient && !userId) {
      setSelectedUser(routeRecipient);
      return;
    }

    selectUserById(userId || null);
  }, [location.state, selectUserById, setSelectedUser, userId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 0, md: 3 }, px: { xs: 0, md: 3 }, bgcolor: '#f8fafc' }}>
      <Container maxWidth="xl" disableGutters>
        <ChatShell>
          <Sidebar />
          <ChatWindow />
        </ChatShell>
      </Container>
    </Box>
  );
};

export default Chat;
