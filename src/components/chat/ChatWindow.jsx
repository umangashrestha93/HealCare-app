import { useState, useRef, useEffect, memo } from 'react';
import { Box, Typography, Avatar, Stack, IconButton, TextField, CircularProgress, styled } from '@mui/material';
import { ArrowBack, MoreVert, EmojiEmotions, AttachFile, Send } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import PresenceIndicator from './PresenceIndicator';

const ChatArea = styled(Box)(({ isMobile, show }) => ({
  flexGrow: 1,
  display: isMobile && !show ? 'none' : 'flex',
  flexDirection: 'column',
  backgroundColor: '#f0f2f5',
  backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
}));

const ChatWindow = memo(() => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedUser, messages, messagesLoading, sendMessage } = useChat();
  const { typingUsers, emitTyping, emitStopTyping } = useSocket();
  const [newMessage, setNewMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => () => {
    const targetId = selectedUser?._id || selectedUser?.id;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (targetId) emitStopTyping(targetId);
  }, [emitStopTyping, selectedUser]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    const targetId = selectedUser?._id || selectedUser?.id;
    if (targetId) {
      emitTyping(targetId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(targetId);
      }, 2000);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const messageText = newMessage.trim();
    if (!messageText) return;
    const targetId = selectedUser?._id || selectedUser?.id;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (targetId) emitStopTyping(targetId);
    sendMessage(messageText);
    setNewMessage('');
  };

  const isTyping = selectedUser && typingUsers.has(selectedUser._id || selectedUser.id);

  if (!selectedUser) {
    return (
      <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', bgcolor: '#f8fafc' }}>
        <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: '#e2e8f0', color: '#94a3b8' }}>
          <Send fontSize="large" />
        </Avatar>
        <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>Your Messages</Typography>
        <Typography variant="body1">Select a conversation from the sidebar to start chatting</Typography>
      </Box>
    );
  }

  return (
    <ChatArea isMobile={false} show={!!selectedUser} sx={{ display: { xs: selectedUser ? 'flex' : 'none', md: 'flex' } }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton sx={{ display: { md: 'none' } }} onClick={() => navigate('/chat')}>
            <ArrowBack />
          </IconButton>
          <Avatar src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.firstName}`} />
          <Box>
            <Typography fontWeight={700} fontSize="1.1rem">{selectedUser.firstName} {selectedUser.lastName}</Typography>
            <PresenceIndicator userId={selectedUser._id || selectedUser.id} initialPresence={selectedUser} />
          </Box>
        </Stack>
        <IconButton><MoreVert /></IconButton>
      </Box>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {messagesLoading ? (
          <Box sx={{ m: 'auto' }}><CircularProgress /></Box>
        ) : (
          messages.map((msg, index) => {
            const senderIdStr = typeof msg.senderId === 'object' && msg.senderId !== null
              ? (msg.senderId._id || msg.senderId.id).toString()
              : msg.senderId.toString();
            const currentUserId = user ? (user._id || user.id).toString() : '';
            const isMine = senderIdStr === currentUserId;
            const msgDate = new Date(msg.createdAt).toDateString();
            const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
            const showDate = msgDate !== prevMsgDate;

            return (
              <Box key={msg._id || index} sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {showDate && (
                  <Box sx={{ alignSelf: 'center', my: 2, bgcolor: 'rgba(0,0,0,0.05)', px: 2, py: 0.5, borderRadius: 4 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </Box>
                )}
                <MessageBubble message={msg} isMine={isMine} />
              </Box>
            );
          })
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e0e0e0' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IconButton size="small"><EmojiEmotions /></IconButton>
          <IconButton size="small"><AttachFile /></IconButton>
          <TextField
            fullWidth
            placeholder="Type a message..."
            variant="outlined"
            size="medium"
            value={newMessage}
            onChange={handleInputChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                bgcolor: '#f5f5f5',
                '& fieldset': { border: 'none' }
              }
            }}
          />
          <IconButton
            type="submit"
            color="primary"
            disabled={!newMessage.trim()}
            sx={{
              bgcolor: newMessage.trim() ? 'primary.main' : 'transparent',
              color: newMessage.trim() ? '#fff' : 'inherit',
              '&:hover': { bgcolor: newMessage.trim() ? 'primary.dark' : 'transparent' },
            }}
          >
            <Send />
          </IconButton>
        </form>
      </Box>
    </ChatArea>
  );
});

export default ChatWindow;
