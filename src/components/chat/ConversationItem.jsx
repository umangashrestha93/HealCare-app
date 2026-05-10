import { memo } from 'react';
import { Box, ListItem, ListItemAvatar, ListItemText, Avatar, Typography, Badge, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePresence } from '../../context/PresenceContext';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      borderRadius: '50%', animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor', content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': { transform: 'scale(.8)', opacity: 1 },
    '100%': { transform: 'scale(2.4)', opacity: 0 },
  },
}));

const ConversationItem = memo(({ conv, isSelected, isTyping }) => {
  const navigate = useNavigate();
  const { onlineStatusMap } = usePresence();
  
  const userId = conv.user?._id || conv.user?.id;
  const isOnline = onlineStatusMap[userId]?.isOnline || conv.user?.isOnline;
  const lastMessageTime = conv.lastMessage?.createdAt || conv.updatedAt;
  const formattedTime = lastMessageTime
    ? new Date(lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <ListItem
      button
      selected={isSelected}
      onClick={() => navigate(`/chat/${userId}`)}
      sx={{
        py: 2, px: 3, borderBottom: '1px solid #f0f0f0',
        '&.Mui-selected': { bgcolor: '#e3f2fd' },
        '&:hover': { bgcolor: '#f5f5f5' }
      }}
    >
      <ListItemAvatar>
        {isOnline ? (
          <StyledBadge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot">
            <Avatar src={conv.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.user.firstName}`} />
          </StyledBadge>
        ) : (
          <Avatar src={conv.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.user.firstName}`} />
        )}
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
            <Typography fontWeight={600} noWrap>{conv.user.firstName} {conv.user.lastName}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{formattedTime}</Typography>
          </Box>
        }
        secondary={
          isTyping ? (
            <Typography variant="body2" color="primary" fontWeight={600} fontStyle="italic">Typing...</Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" noWrap>
              {conv.lastMessage?.content || 'Started a conversation'}
            </Typography>
          )
        }
      />
      {conv.unreadCount > 0 && (
        <Badge badgeContent={conv.unreadCount} color="error" sx={{ mr: 2 }} />
      )}
    </ListItem>
  );
});

export default ConversationItem;
