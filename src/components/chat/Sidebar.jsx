import { memo } from 'react';
import { Box, Typography, List, styled } from '@mui/material';
import ConversationItem from './ConversationItem';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';

const SidebarBox = styled(Box)(({ isMobile, show }) => ({
  width: isMobile ? '100%' : '350px',
  borderRight: '1px solid #e0e0e0',
  display: isMobile && !show ? 'none' : 'flex',
  flexDirection: 'column',
  backgroundColor: '#f8fafc'
}));

const Sidebar = memo(() => {
  const { conversations, selectedUser } = useChat();
  const { typingUsers } = useSocket();

  return (
    <SidebarBox isMobile={false} show={!selectedUser} sx={{ display: { xs: selectedUser ? 'none' : 'flex', md: 'flex' } }}>
      <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h5" fontWeight={800} color="primary">Messages</Typography>
      </Box>
      <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
        {conversations.length > 0 ? (
          conversations.map((conv) => (
            <ConversationItem 
              key={conv._id} 
              conv={conv} 
              isSelected={(selectedUser?._id || selectedUser?.id) === (conv.user?._id || conv.user?.id)}
              isTyping={typingUsers.has(conv.user?._id || conv.user?.id)}
            />
          ))
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No active conversations</Typography>
          </Box>
        )}
      </List>
    </SidebarBox>
  );
});

export default Sidebar;
