import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AccessTime, Done, DoneAll, ErrorOutlineOutlined } from '@mui/icons-material';

const MessageRow = styled(Box)(({ isMine }) => ({
  display: 'flex',
  justifyContent: isMine ? 'flex-end' : 'flex-start',
  alignItems: 'flex-end',
  marginBottom: '12px',
  width: '100%'
}));

const BubbleContainer = styled(Box)(({ theme, isMine }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1, 2),
  borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
  backgroundColor: isMine ? theme.palette.primary.main : '#ffffff',
  color: isMine ? '#ffffff' : theme.palette.text.primary,
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column'
}));

const StatusIcon = ({ status, seen, delivered }) => {
  const iconStyle = { fontSize: '0.85rem', marginLeft: '4px' };
  
  if (status === 'error') return <ErrorOutlineOutlined sx={{ ...iconStyle, color: '#ffb3b3' }} />;
  if (status === 'sending') return <AccessTime sx={{ ...iconStyle, fontSize: '0.75rem' }} />;
  
  if (seen) return <DoneAll sx={{ ...iconStyle, color: '#4fc3f7' }} />; // Blue ticks
  if (delivered) return <DoneAll sx={iconStyle} />; // Grey double ticks
  return <Done sx={iconStyle} />; // Grey single tick (sent to server)
};

const MessageBubble = ({ message, isMine }) => {
  const { content, createdAt, status, seen, delivered, senderId } = message;
  
  const timeString = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Handle populated sender info
  const senderName = typeof senderId === 'object' && senderId !== null 
    ? `${senderId.firstName} ${senderId.lastName}` 
    : 'User';
  const senderAvatar = typeof senderId === 'object' && senderId !== null ? senderId.avatar : null;

  return (
    <MessageRow isMine={isMine}>
      {!isMine && (
        <Avatar 
          src={senderAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${senderName}`}
          sx={{ width: 28, height: 28, mr: 1, mb: 0.5 }}
        />
      )}
      <BubbleContainer isMine={isMine}>
        {!isMine && (
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5, fontSize: '0.7rem' }}>
            {senderName}
          </Typography>
        )}
        <Typography variant="body1" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {content}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 0.5, opacity: 0.8 }}>
          <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
            {timeString}
          </Typography>
          {isMine && <StatusIcon status={status} seen={seen} delivered={delivered} />}
        </Box>
      </BubbleContainer>
    </MessageRow>
  );
};

export default MessageBubble;
