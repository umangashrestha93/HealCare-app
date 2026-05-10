import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Snackbar, Alert, Typography, Box } from '@mui/material';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineStatusMap, setOnlineStatusMap] = useState({}); // { [userId]: { isOnline, lastSeen } }
  const [notification, setNotification] = useState({ open: false, message: null });
  const [typingUsers, setTypingUsers] = useState(new Set()); 
  
  const { user } = useAuth();
  
  const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
  const SOCKET_URL = configuredApiUrl.replace('/api', '').replace('http://localhost:5000', 'http://127.0.0.1:5000');

  useEffect(() => {
    const currentUserId = user ? (user._id || user.id) : null;
    const token = localStorage.getItem('beyond5_access_token');
    
    if (user && currentUserId && token) {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        // no explicit joinRoom required, handled by server middleware
      });

      // Initial keys received from server
      newSocket.on('initialOnlineUsers', (userIds) => {
        const map = {};
        userIds.forEach(id => map[id] = { isOnline: true });
        setOnlineStatusMap(map);
      });

      newSocket.on('user_online', (userId) => {
        setOnlineStatusMap(prev => ({
          ...prev,
          [userId]: { isOnline: true, lastSeen: null }
        }));
      });

      newSocket.on('user_offline', ({ userId, lastSeen }) => {
        setOnlineStatusMap(prev => ({
          ...prev,
          [userId]: { isOnline: false, lastSeen }
        }));
      });

      // Typing events
      newSocket.on('typing', (senderId) => {
        setTypingUsers((prev) => new Set(prev).add(senderId));
      });

      newSocket.on('stop_typing', (senderId) => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(senderId);
          return next;
        });
      });

      // Global listener for notifications
      newSocket.on('new_notification', (data) => {
        if (!window.location.pathname.includes('/chat')) {
          setNotification({
            open: true,
            title: data.title,
            body: data.body,
            relatedId: data.relatedId
          });
          
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
          } catch(e) {}
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setTypingUsers(new Set());
    }
  }, [user, SOCKET_URL]);

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification({ ...notification, open: false });
  };

  const emitTyping = (receiverId) => {
    const currentUserId = user ? (user._id || user.id) : null;
    if (socket && currentUserId) {
      socket.emit('typing', { receiverId, senderId: currentUserId });
    }
  };

  const emitStopTyping = (receiverId) => {
    const currentUserId = user ? (user._id || user.id) : null;
    if (socket && currentUserId) {
      socket.emit('stop_typing', { receiverId, senderId: currentUserId });
    }
  };
  
  const markMessagesSeen = (messageIds, conversationId) => {
    const currentUserId = user ? (user._id || user.id) : null;
    if (socket && currentUserId) {
      socket.emit('message_seen', { messageIds, conversationId, userId: currentUserId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineStatusMap, typingUsers, emitTyping, emitStopTyping, markMessagesSeen }}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity="info" 
          sx={{ width: '100%', cursor: 'pointer', boxShadow: 3 }}
          onClick={() => window.location.href = '/chat'}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              {notification.title}
            </Typography>
            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
              {notification.body}
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </SocketContext.Provider>
  );
};
