import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, Avatar,
  TextField, IconButton, List, ListItem, ListItemAvatar,
  ListItemText, CircularProgress, Badge, Stack
} from '@mui/material';
import { Send, ArrowBack, MoreVert, AttachFile, EmojiEmotions } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { chatService, authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';

// Styled Components
const ChatContainer = styled(Paper)(({ theme }) => ({
  height: '80vh',
  display: 'flex',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  border: '1px solid rgba(255,255,255,0.4)',
  backgroundColor: '#ffffff'
}));

const SidebarBox = styled(Box)(({ theme, isMobile, show }) => ({
  width: isMobile ? '100%' : '350px',
  borderRight: '1px solid #e0e0e0',
  display: isMobile && !show ? 'none' : 'flex',
  flexDirection: 'column',
  backgroundColor: '#f8fafc'
}));

const ChatArea = styled(Box)(({ theme, isMobile, show }) => ({
  flexGrow: 1,
  display: isMobile && !show ? 'none' : 'flex',
  flexDirection: 'column',
  backgroundColor: '#f0f2f5',
  backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
}));

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

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useParams(); // Dynamic routing
  const { socket, onlineStatusMap, typingUsers, emitTyping, emitStopTyping, markMessagesSeen } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(location.state?.recipient || null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle dynamic routing and user selection
  useEffect(() => {
    const handleUserSelection = async () => {
      if (userId) {
        const existingConv = conversations.find(c => c.user._id === userId || c.user.id === userId);
        if (existingConv) {
          setSelectedUser(existingConv.user);
        } else if (!selectedUser || (selectedUser._id !== userId && selectedUser.id !== userId)) {
          try {
            const res = await authService.getUserById(userId);
            setSelectedUser(res.user);
          } catch (err) {
            console.error('Failed to fetch user for chat', err);
          }
        }
      } else {
        setSelectedUser(null);
      }
    };
    handleUserSelection();
  }, [userId, conversations]);

  useEffect(() => {
    if (selectedUser && (selectedUser._id || selectedUser.id)) {
      fetchMessages(selectedUser._id || selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Handle incoming messages and seen updates
  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (newMessage) => {
        const otherUserId = selectedUser?._id || selectedUser?.id;
        const senderId = newMessage.senderId?._id || newMessage.senderId;
        
        if (otherUserId === senderId) {
          setMessages((prev) => [...prev, newMessage]);
          if (activeConversationId) {
            markMessagesSeen([newMessage._id], activeConversationId);
          }
        }
        fetchConversations();
      };

      const handleMessagesSeen = (messageIds) => {
        setMessages((prev) => prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, seen: true, delivered: true } : msg
        ));
      };

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('messages_seen', handleMessagesSeen);
      
      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('messages_seen', handleMessagesSeen);
      };
    }
  }, [socket, selectedUser, activeConversationId]);

  const fetchConversations = async () => {
    try {
      const res = await chatService.getConversations();
      setConversations(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      setMessagesLoading(true);
      const res = await chatService.getMessages(otherUserId);
      setMessages(res.data);
      
      if (res.data.length > 0) {
        setActiveConversationId(res.data[0].conversationId);
      }
      
      setMessagesLoading(false);
      fetchConversations();
    } catch (err) {
      console.error('Failed to fetch messages', err);
      setMessagesLoading(false);
    }
  };

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

  const formatLastSeen = (date) => {
    if (!date) return 'Offline';
    const lastSeen = new Date(date);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return `Last seen yesterday at ${lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return `Last seen on ${lastSeen.toLocaleDateString()}`;
  };

  const getPresenceStatus = (userId) => {
    if (!userId) return 'Offline';
    const status = onlineStatusMap[userId];
    if (status?.isOnline) return 'Online';
    
    const conversation = conversations.find(c => (c.user?._id || c.user?.id) === userId);
    const dbStatus = conversation?.user;
    
    if (status?.lastSeen) return formatLastSeen(status.lastSeen);
    if (dbStatus?.isOnline) return 'Online';
    if (dbStatus?.lastSeen) return formatLastSeen(dbStatus.lastSeen);
    
    return 'Offline';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const targetId = selectedUser?._id || selectedUser?.id;
    if (!newMessage.trim() || !targetId) return;

    const messageContent = newMessage;
    setNewMessage('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitStopTyping(targetId);

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      content: messageContent,
      senderId: { _id: user._id || user.id, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await chatService.sendMessage(targetId, messageContent);
      const actualMessage = { ...res.data, status: 'sent' };
      setMessages((prev) => prev.map(msg => msg._id === tempId ? actualMessage : msg));
      
      if (!activeConversationId) {
        setActiveConversationId(res.data.conversationId);
      }
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages((prev) => prev.map(msg => msg._id === tempId ? { ...msg, status: 'error' } : msg));
    }
  };

  const isTyping = selectedUser && typingUsers.has(selectedUser._id || selectedUser.id);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 1, md: 3 } }}>
      <Container maxWidth="xl" disableGutters>
        <ChatContainer>

          {/* Sidebar Area */}
          <SidebarBox isMobile={false} show={!selectedUser} sx={{ display: { xs: selectedUser ? 'none' : 'flex', md: 'flex' } }}>
            <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h5" fontWeight={800} color="primary">Messages</Typography>
            </Box>
            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
              {conversations.length > 0 ? (
                conversations.map((conv) => {
                  if (!conv.user) return null;
                  const presence = getPresenceStatus(conv.user._id || conv.user.id);
                  const isOnline = presence === 'Online';
                  const isUserTyping = typingUsers.has(conv.user._id || conv.user.id);

                  return (
                    <ListItem
                      key={conv._id}
                      button
                      selected={(selectedUser?._id || selectedUser?.id) === (conv.user._id || conv.user.id)}
                      onClick={() => navigate(`/chat/${conv.user._id || conv.user.id}`)}
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
                        primary={<Typography fontWeight={600}>{conv.user.firstName} {conv.user.lastName}</Typography>}
                        secondary={
                          isUserTyping ? (
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
                })
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No active conversations</Typography>
                </Box>
              )}
            </List>
          </SidebarBox>

          {/* Main Chat Area */}
          <ChatArea isMobile={false} show={!!selectedUser} sx={{ display: { xs: selectedUser ? 'flex' : 'none', md: 'flex' } }}>
            {selectedUser ? (
              <>
                {/* Header */}
                <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton sx={{ display: { md: 'none' } }} onClick={() => navigate('/chat')}>
                      <ArrowBack />
                    </IconButton>
                    <Avatar src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.firstName}`} />
                    <Box>
                      <Typography fontWeight={700} fontSize="1.1rem">{selectedUser.firstName} {selectedUser.lastName}</Typography>
                      {getPresenceStatus(selectedUser._id || selectedUser.id) === 'Online' ? (
                        <Typography variant="caption" sx={{ color: '#44b700', fontWeight: 600 }}>Online</Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {getPresenceStatus(selectedUser._id || selectedUser.id)}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                  <IconButton><MoreVert /></IconButton>
                </Box>

                {/* Messages View */}
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

                {/* Input Area */}
                <Box sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e0e0e0' }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              </>
            ) : (
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', bgcolor: '#f8fafc' }}>
                <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: '#e2e8f0', color: '#94a3b8' }}>
                  <Send fontSize="large" />
                </Avatar>
                <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>Your Messages</Typography>
                <Typography variant="body1">Select a conversation from the sidebar to start chatting</Typography>
              </Box>
            )}
          </ChatArea>
        </ChatContainer>
      </Container>
    </Box>
  );
};

export default Chat;


